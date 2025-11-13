// app/api/auth/oauth/google/callback/route.ts
// Callback OAuth Google

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { generateToken } from '@/lib/auth'
import { serialize } from 'cookie'

interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
  refresh_token?: string
}

interface GoogleUserInfo {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name: string
  family_name: string
  picture: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // Si l'utilisateur refuse l'accès
    if (error) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Connexion annulée')}`, baseUrl)
      )
    }

    if (!code) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        new URL('/login?error=missing_code', baseUrl)
      )
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/google/callback`

    if (!clientId || !clientSecret) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        new URL('/login?error=oauth_not_configured', baseUrl)
      )
    }

    // 1. Échanger le code contre un access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResponse.ok) {
      console.error('Erreur échange token Google:', await tokenResponse.text())
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        new URL('/login?error=token_exchange_failed', baseUrl)
      )
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()

    // 2. Récupérer les informations de l'utilisateur
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    })

    if (!userInfoResponse.ok) {
      console.error('Erreur récupération profil Google:', await userInfoResponse.text())
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.redirect(
        new URL('/login?error=profile_fetch_failed', baseUrl)
      )
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json()

    // 3. Vérifier si l'utilisateur existe déjà
    let user = await queryOne<any>(
      'SELECT * FROM users WHERE email = $1',
      [googleUser.email]
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
          googleUser.email,
          '', // Pas de mot de passe pour OAuth
          googleUser.name,
          googleUser.verified_email,
          JSON.stringify({ oauth_provider: 'google', google_id: googleUser.id, picture: googleUser.picture })
        ]
      )

      // 5. Créer une organisation par défaut
      const org = await queryOne<any>(
        `INSERT INTO organisations (name, created_by, settings)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          `Organisation de ${googleUser.given_name}`,
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = NextResponse.redirect(new URL('/dashboard', baseUrl))
    response.headers.set('Set-Cookie', cookie)

    return response

  } catch (error) {
    console.error('Erreur OAuth Google:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    return NextResponse.redirect(
      new URL('/login?error=oauth_error', baseUrl)
    )
  }
}
