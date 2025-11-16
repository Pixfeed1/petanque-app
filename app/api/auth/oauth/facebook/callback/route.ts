// app/api/auth/oauth/facebook/callback/route.ts
// Callback OAuth Facebook

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { generateToken } from '@/lib/auth'
import { serialize } from 'cookie'

interface FacebookTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}

interface FacebookUserInfo {
  id: string
  email: string
  name: string
  first_name: string
  last_name: string
  picture?: {
    data: {
      url: string
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // URL de base pour les redirections (utilise NEXT_PUBLIC_APP_URL en priorité)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url

    // Si l'utilisateur refuse l'accès
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Connexion annulée')}`, baseUrl)
      )
    }

    if (!code) {
      return NextResponse.redirect(
        new URL('/login?error=missing_code', baseUrl)
      )
    }

    const appId = process.env.FACEBOOK_APP_ID
    const appSecret = process.env.FACEBOOK_APP_SECRET
    const redirectUri = process.env.FACEBOOK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/facebook/callback`

    if (!appId || !appSecret) {
      return NextResponse.redirect(
        new URL('/login?error=oauth_not_configured', baseUrl)
      )
    }

    // 1. Échanger le code contre un access token
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?${new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      redirect_uri: redirectUri,
      code
    })}`

    const tokenResponse = await fetch(tokenUrl)

    if (!tokenResponse.ok) {
      console.error('Erreur échange token Facebook:', await tokenResponse.text())
      return NextResponse.redirect(
        new URL('/login?error=token_exchange_failed', baseUrl)
      )
    }

    const tokens: FacebookTokenResponse = await tokenResponse.json()

    // 2. Récupérer les informations de l'utilisateur
    const userInfoUrl = `https://graph.facebook.com/v18.0/me?fields=id,email,name,first_name,last_name,picture&access_token=${tokens.access_token}`

    const userInfoResponse = await fetch(userInfoUrl)

    if (!userInfoResponse.ok) {
      console.error('Erreur récupération profil Facebook:', await userInfoResponse.text())
      return NextResponse.redirect(
        new URL('/login?error=profile_fetch_failed', baseUrl)
      )
    }

    const facebookUser: FacebookUserInfo = await userInfoResponse.json()

    // Vérifier que l'email est disponible
    if (!facebookUser.email) {
      return NextResponse.redirect(
        new URL('/login?error=email_required', baseUrl)
      )
    }

    // 3. Vérifier si l'utilisateur existe déjà
    let user = await queryOne<any>(
      'SELECT * FROM users WHERE email = $1',
      [facebookUser.email]
    )

    let orgId: number

    if (user) {
      // L'utilisateur existe - mettre à jour la date de dernière connexion
      await query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      )

      // Récupérer son organisation
      const userRole = await queryOne<any>(
        'SELECT org_id FROM user_roles WHERE user_id = $1 LIMIT 1',
        [user.id]
      )
      orgId = userRole?.org_id
    } else {
      // 4. Créer un nouvel utilisateur
      user = await queryOne<any>(
        `INSERT INTO users (email, password_hash, full_name, email_verified, email_verified_at, metadata)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
         RETURNING *`,
        [
          facebookUser.email,
          '', // Pas de mot de passe pour OAuth
          facebookUser.name,
          true, // Facebook vérifie les emails
          JSON.stringify({
            oauth_provider: 'facebook',
            facebook_id: facebookUser.id,
            picture: facebookUser.picture?.data?.url
          })
        ]
      )

      // 5. Créer une organisation par défaut
      const org = await queryOne<any>(
        `INSERT INTO organisations (name, created_by, settings)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          `Organisation de ${facebookUser.first_name}`,
          user.id,
          JSON.stringify({ plan: 'free' })
        ]
      )
      orgId = org.id

      // 6. Lier l'utilisateur à son organisation
      await query(
        `INSERT INTO user_roles (user_id, org_id, role)
         VALUES ($1, $2, 'owner')`,
        [user.id, orgId]
      )
    }

    // 7. Générer un token JWT
    const token = generateToken({
      userId: user.id.toString(),
      email: user.email
    })

    // 8. Créer le cookie de session
    // sameSite: 'strict' pour protection CSRF maximale
    const cookie = serialize('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Protection CSRF renforcée
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/'
    })

    // 9. Rediriger vers le dashboard
    const response = NextResponse.redirect(new URL('/dashboard', baseUrl))
    response.headers.set('Set-Cookie', cookie)

    return response

  } catch (error) {
    console.error('Erreur OAuth Facebook:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url
    return NextResponse.redirect(
      new URL('/login?error=oauth_error', baseUrl)
    )
  }
}
