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
    console.log('🔵 [OAuth Google] Début du callback')
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    // Utiliser l'URL de l'app pour les redirections (pas request.url qui peut être localhost)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://petanquepro.fr'
    console.log('🔵 [OAuth Google] baseUrl:', baseUrl)

    // Si l'utilisateur refuse l'accès
    if (error) {
      console.log('❌ [OAuth Google] Erreur reçue de Google:', error)
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent('Connexion annulée')}`, baseUrl)
      )
    }

    if (!code) {
      console.log('❌ [OAuth Google] Code manquant')
      return NextResponse.redirect(
        new URL('/login?error=missing_code', baseUrl)
      )
    }

    console.log('🔵 [OAuth Google] Code reçu (tronqué):', code.substring(0, 20) + '...')

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${baseUrl}/api/auth/oauth/google/callback`

    console.log('🔵 [OAuth Google] Client ID présent:', !!clientId)
    console.log('🔵 [OAuth Google] Client Secret présent:', !!clientSecret)
    console.log('🔵 [OAuth Google] Redirect URI:', redirectUri)

    if (!clientId || !clientSecret) {
      console.log('❌ [OAuth Google] Configuration OAuth manquante')
      return NextResponse.redirect(
        new URL('/login?error=oauth_not_configured', baseUrl)
      )
    }

    // 1. Échanger le code contre un access token
    console.log('🔵 [OAuth Google] Échange du code contre un token...')
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

    console.log('🔵 [OAuth Google] Statut de la réponse token:', tokenResponse.status)

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('❌ [OAuth Google] Erreur échange token:', errorText)
      return NextResponse.redirect(
        new URL('/login?error=token_exchange_failed', baseUrl)
      )
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()
    console.log('✅ [OAuth Google] Token reçu avec succès')

    // 2. Récupérer les informations de l'utilisateur
    console.log('🔵 [OAuth Google] Récupération du profil utilisateur...')
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    })

    console.log('🔵 [OAuth Google] Statut de la réponse userinfo:', userInfoResponse.status)

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text()
      console.error('❌ [OAuth Google] Erreur récupération profil:', errorText)
      return NextResponse.redirect(
        new URL('/login?error=profile_fetch_failed', baseUrl)
      )
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json()
    console.log('✅ [OAuth Google] Profil reçu:', googleUser.email)

    // 3. Vérifier si l'utilisateur existe déjà
    console.log('🔵 [OAuth Google] Vérification de l\'utilisateur dans la DB...')
    let user = await queryOne<any>(
      'SELECT * FROM users WHERE email = $1',
      [googleUser.email]
    )

    let orgId: number

    if (user) {
      console.log('✅ [OAuth Google] Utilisateur existant trouvé:', user.id)
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
      console.log('🔵 [OAuth Google] Organisation ID:', orgId)
    } else {
      console.log('🔵 [OAuth Google] Nouvel utilisateur, création en cours...')
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
      console.log('✅ [OAuth Google] Utilisateur créé:', user.id)

      // 5. Créer une organisation par défaut
      console.log('🔵 [OAuth Google] Création de l\'organisation...')
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
      console.log('✅ [OAuth Google] Organisation créée:', orgId)

      // 6. Lier l'utilisateur à son organisation
      console.log('🔵 [OAuth Google] Liaison user-organisation...')
      await query(
        `INSERT INTO user_roles (user_id, org_id, role)
         VALUES ($1, $2, 'owner')`,
        [user.id, orgId]
      )
      console.log('✅ [OAuth Google] Liaison créée')
    }

    // 7. Générer un token JWT
    console.log('🔵 [OAuth Google] Génération du token JWT...')
    const token = generateToken({
      userId: user.id.toString(),
      email: user.email
    })
    console.log('✅ [OAuth Google] Token JWT généré')

    // 8. Créer le cookie de session
    console.log('🔵 [OAuth Google] Création du cookie de session...')
    const cookie = serialize('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/'
    })
    console.log('✅ [OAuth Google] Cookie créé')

    // 9. Rediriger vers le dashboard
    console.log('🔵 [OAuth Google] Redirection vers /dashboard')
    const response = NextResponse.redirect(new URL('/dashboard', baseUrl))
    response.headers.set('Set-Cookie', cookie)

    console.log('✅ [OAuth Google] Callback terminé avec succès')
    return response

  } catch (error) {
    console.error('❌❌❌ [OAuth Google] ERREUR CATCH:', error)
    console.error('❌❌❌ [OAuth Google] Stack trace:', error instanceof Error ? error.stack : 'Pas de stack')
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://petanquepro.fr'
    return NextResponse.redirect(
      new URL('/login?error=oauth_error', baseUrl)
    )
  }
}
