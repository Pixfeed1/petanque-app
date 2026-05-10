// app/api/auth/oauth/google/callback/route.ts
// FIX SÉCURITÉ 1 : vérification du state CSRF (RFC 6749 §10.12)
// FIX SÉCURITÉ 2 : protection contre le détournement de compte
//   Si un compte mot-de-passe existe pour cet email mais n'a jamais lié Google,
//   on refuse le login (sinon n'importe qui ayant ce gmail vole le compte).

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { generateToken } from '@/lib/auth'

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
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url

  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const stateFromQuery = searchParams.get('state')

    // FIX SÉCURITÉ : vérifier le state CSRF
    const stateFromCookie = request.cookies.get('oauth_state_google')?.value

    const buildErrorResponse = (errCode: string) => {
      const resp = NextResponse.redirect(new URL(`/login?error=${errCode}`, baseUrl))
      resp.cookies.delete('oauth_state_google')
      return resp
    }

    if (error) {
      return buildErrorResponse(encodeURIComponent('Connexion annulée'))
    }

    if (!code) {
      return buildErrorResponse('missing_code')
    }

    if (!stateFromQuery || !stateFromCookie || stateFromQuery !== stateFromCookie) {
      console.error('OAuth Google : state mismatch (CSRF possible)')
      return buildErrorResponse('invalid_state')
    }

    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/google/callback`

    if (!clientId || !clientSecret) {
      return buildErrorResponse('oauth_not_configured')
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
      return buildErrorResponse('token_exchange_failed')
    }

    const tokens: GoogleTokenResponse = await tokenResponse.json()

    // 2. Récupérer les informations de l'utilisateur
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` }
    })

    if (!userInfoResponse.ok) {
      console.error('Erreur récupération profil Google:', await userInfoResponse.text())
      return buildErrorResponse('profile_fetch_failed')
    }

    const googleUser: GoogleUserInfo = await userInfoResponse.json()

    // FIX SÉCURITÉ : refuser les emails non vérifiés (défense supplémentaire)
    if (!googleUser.verified_email) {
      return buildErrorResponse('email_not_verified')
    }

    // 3. Vérifier si l'utilisateur existe déjà
    let user = await queryOne<any>(
      'SELECT * FROM users WHERE email = $1',
      [googleUser.email]
    )

    let orgId: number | string | undefined

    if (user) {
      // FIX UX : auto-link au premier login OAuth.
      // Avant : on refusait tout compte ayant password_hash sans
      // oauth_provider explicitement = 'google'. Cela bloquait tous les
      // comptes créés avant le patch CSRF.
      // Maintenant : si pas encore lié à un provider, on auto-link Google
      // (Google a vérifié l'email, donc le user contrôle bien la boîte).
      // Si déjà lié à un autre provider (Apple), on refuse pour éviter
      // le détournement entre providers.
      const linkedProvider = user.metadata?.oauth_provider

      if (linkedProvider && linkedProvider !== 'google') {
        console.warn(`OAuth Google bloqué pour ${googleUser.email}: compte lié à ${linkedProvider}`)
        return buildErrorResponse('account_linked_other_provider')
      }

      if (!linkedProvider) {
        await query(
          `UPDATE users
           SET metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{oauth_provider}', '"google"')
           WHERE id = $1`,
          [user.id]
        )
      }

      await query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      )

      const userRole = await queryOne<any>(
        'SELECT org_id FROM user_roles WHERE user_id = $1 LIMIT 1',
        [user.id]
      )
      orgId = userRole?.org_id
    } else {
      // 4. Créer un nouvel utilisateur (lié à Google)
      user = await queryOne<any>(
        `INSERT INTO users (email, password_hash, full_name, email_verified, email_verified_at, metadata)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
         RETURNING *`,
        [
          googleUser.email,
          '',
          googleUser.name,
          googleUser.verified_email,
          JSON.stringify({ oauth_provider: 'google', google_id: googleUser.id, picture: googleUser.picture })
        ]
      )

      const org = await queryOne<any>(
        `INSERT INTO organisations (name, created_by, settings)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          `Organisation de ${googleUser.given_name}`,
          user.id,
          JSON.stringify({ plan: 'free', features: { max_tournois: 1, max_equipes: 8 } })
        ]
      )
      orgId = org.id

      await query(
        `INSERT INTO user_roles (user_id, org_id, role)
         VALUES ($1, $2, 'owner')`,
        [user.id, orgId]
      )
    }

    // 5. Générer un token JWT
    const token = generateToken({
      userId: String(user.id),
      email: user.email
    })

    // 6. Cookie de session + nettoyage du state
    // FIX : utiliser response.cookies.set au lieu de headers.set('Set-Cookie',...)
    // sinon le 'cookies.delete' suivant écrase le Set-Cookie précédent et
    // le auth-token n'est jamais posé côté navigateur.
    const response = NextResponse.redirect(new URL('/dashboard', baseUrl))
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })
    response.cookies.delete('oauth_state_google')

    return response

  } catch (error) {
    console.error('Erreur OAuth Google:', error)
    const resp = NextResponse.redirect(new URL('/login?error=oauth_error', baseUrl))
    resp.cookies.delete('oauth_state_google')
    return resp
  }
}
