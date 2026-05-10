// app/api/auth/oauth/apple/callback/route.ts
// FIX SÉCURITÉ 1 : vérification du state CSRF (state lu du formData et du cookie)
// FIX SÉCURITÉ 2 : protection contre le détournement de compte
//   Si un compte mot-de-passe ou Google existe déjà pour cet email,
//   on refuse le login Apple sinon il y a takeover.

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { generateToken } from '@/lib/auth'
import { serialize } from 'cookie'
import * as jose from 'jose'

interface AppleTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  id_token: string
  refresh_token?: string
}

interface AppleIdTokenPayload {
  iss: string
  sub: string
  aud: string
  email?: string
  email_verified?: string | boolean
  is_private_email?: string | boolean
}

/**
 * Génère le client_secret JWT requis par Apple
 */
async function generateAppleClientSecret(): Promise<string> {
  const teamId = process.env.APPLE_TEAM_ID
  const clientId = process.env.APPLE_CLIENT_ID
  const keyId = process.env.APPLE_KEY_ID
  const privateKey = process.env.APPLE_PRIVATE_KEY

  if (!teamId || !clientId || !keyId || !privateKey) {
    throw new Error('Configuration Apple Sign In incomplète')
  }

  const key = await jose.importPKCS8(privateKey.replace(/\\n/g, '\n'), 'ES256')

  const jwt = await new jose.SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: keyId })
    .setIssuer(teamId)
    .setAudience('https://appleid.apple.com')
    .setSubject(clientId)
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key)

  return jwt
}

export async function POST(request: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url

  const buildErrorResponse = (errCode: string) => {
    const resp = NextResponse.redirect(new URL(`/login?error=${errCode}`, baseUrl))
    resp.cookies.delete('oauth_state_apple')
    return resp
  }

  try {
    const formData = await request.formData()
    const code = formData.get('code') as string | null
    const idToken = formData.get('id_token') as string | null
    const userJson = formData.get('user') as string | null
    const error = formData.get('error') as string | null
    const stateFromForm = formData.get('state') as string | null

    // FIX SÉCURITÉ : vérifier le state CSRF
    const stateFromCookie = request.cookies.get('oauth_state_apple')?.value

    if (error) {
      return buildErrorResponse(encodeURIComponent('Connexion annulée'))
    }

    if (!code) {
      return buildErrorResponse('missing_code')
    }

    if (!stateFromForm || !stateFromCookie || stateFromForm !== stateFromCookie) {
      console.error('OAuth Apple : state mismatch (CSRF possible)')
      return buildErrorResponse('invalid_state')
    }

    const clientId = process.env.APPLE_CLIENT_ID
    const redirectUri = process.env.APPLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/apple/callback`

    if (!clientId) {
      return buildErrorResponse('oauth_not_configured')
    }

    // 1. Générer le client_secret JWT
    const clientSecret = await generateAppleClientSecret()

    // 2. Échanger le code contre un access token
    const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    })

    if (!tokenResponse.ok) {
      console.error('Erreur échange token Apple:', await tokenResponse.text())
      return buildErrorResponse('token_exchange_failed')
    }

    const tokens: AppleTokenResponse = await tokenResponse.json()

    // 3. Vérifier l'id_token avec les clés publiques Apple
    const tokenToVerify = tokens.id_token || idToken
    if (!tokenToVerify) {
      return buildErrorResponse('missing_id_token')
    }

    const JWKS = jose.createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'))
    const { payload } = await jose.jwtVerify(tokenToVerify, JWKS, {
      issuer: 'https://appleid.apple.com',
      audience: clientId
    })

    const applePayload = payload as unknown as AppleIdTokenPayload
    const appleUserId = applePayload.sub

    // Apple ne renvoie le nom que lors de la PREMIÈRE connexion
    let userName = 'Utilisateur Apple'
    let firstName = ''
    if (userJson) {
      try {
        const userData = JSON.parse(userJson)
        if (userData.name) {
          firstName = userData.name.firstName || ''
          const lastName = userData.name.lastName || ''
          userName = `${firstName} ${lastName}`.trim() || userName
        }
      } catch {
        // Pas de données, ce n'est pas la première connexion
      }
    }

    const email = applePayload.email
    if (!email) {
      return buildErrorResponse('email_required')
    }

    // 4. Chercher un user existant (par email OU par apple_id)
    let user = await queryOne<any>(
      "SELECT * FROM users WHERE email = $1 OR metadata->>'apple_id' = $2",
      [email, appleUserId]
    )

    let orgId: number | string | undefined

    if (user) {
      // FIX SÉCURITÉ : empêcher le détournement de compte
      const linkedProvider = user.metadata?.oauth_provider
      const hasPassword = user.password_hash && user.password_hash !== ''

      if (linkedProvider !== 'apple' && hasPassword) {
        console.warn(`OAuth Apple bloqué pour ${email}: compte mot-de-passe existant non lié à Apple`)
        return buildErrorResponse('account_exists_use_password')
      }

      if (linkedProvider && linkedProvider !== 'apple') {
        console.warn(`OAuth Apple bloqué pour ${email}: compte lié à ${linkedProvider}`)
        return buildErrorResponse('account_linked_other_provider')
      }

      await query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      )

      if (userName !== 'Utilisateur Apple' && user.full_name === 'Utilisateur Apple') {
        await query(
          'UPDATE users SET full_name = $1 WHERE id = $2',
          [userName, user.id]
        )
      }

      const userRole = await queryOne<any>(
        'SELECT org_id FROM user_roles WHERE user_id = $1 LIMIT 1',
        [user.id]
      )
      orgId = userRole?.org_id
    } else {
      // 5. Créer un nouvel utilisateur Apple
      user = await queryOne<any>(
        `INSERT INTO users (email, password_hash, full_name, email_verified, email_verified_at, metadata)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
         RETURNING *`,
        [
          email,
          '',
          userName,
          true,
          JSON.stringify({ oauth_provider: 'apple', apple_id: appleUserId })
        ]
      )

      // 6. Créer l'organisation par défaut
      const orgName = firstName || userName
      const org = await queryOne<any>(
        `INSERT INTO organisations (name, created_by, settings)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          `Organisation de ${orgName}`,
          user.id,
          JSON.stringify({ plan: 'free', features: { max_tournois: 1, max_equipes: 8 } })
        ]
      )
      orgId = org.id

      // 7. Lier le user à son org
      await query(
        `INSERT INTO user_roles (user_id, org_id, role)
         VALUES ($1, $2, 'owner')`,
        [user.id, orgId]
      )
    }

    // 8. Token JWT
    const token = generateToken({
      userId: String(user.id),
      email: user.email
    })

    const cookie = serialize('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/'
    })

    const response = NextResponse.redirect(new URL('/dashboard', baseUrl))
    response.headers.set('Set-Cookie', cookie)
    response.cookies.delete('oauth_state_apple')

    return response

  } catch (error) {
    console.error('Erreur OAuth Apple:', error)
    return buildErrorResponse('oauth_error')
  }
}
