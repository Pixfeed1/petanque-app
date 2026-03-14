// app/api/auth/oauth/apple/callback/route.ts
// Callback OAuth Apple Sign In (reçoit les données via POST form_post)

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
  sub: string // Apple user ID unique
  aud: string
  email?: string
  email_verified?: string | boolean
  is_private_email?: string | boolean
}

/**
 * Génère le client_secret JWT requis par Apple
 * Apple n'utilise pas un simple secret string, il faut signer un JWT
 * avec la clé privée (.p8) fournie par Apple Developer
 */
async function generateAppleClientSecret(): Promise<string> {
  const teamId = process.env.APPLE_TEAM_ID
  const clientId = process.env.APPLE_CLIENT_ID
  const keyId = process.env.APPLE_KEY_ID
  const privateKey = process.env.APPLE_PRIVATE_KEY

  if (!teamId || !clientId || !keyId || !privateKey) {
    throw new Error('Configuration Apple Sign In incomplète')
  }

  // La clé privée est stockée en base64 dans le .env pour éviter les problèmes de newlines
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
  try {
    const formData = await request.formData()
    const code = formData.get('code') as string | null
    const idToken = formData.get('id_token') as string | null
    const userJson = formData.get('user') as string | null
    const error = formData.get('error') as string | null

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

    const clientId = process.env.APPLE_CLIENT_ID
    const redirectUri = process.env.APPLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/apple/callback`

    if (!clientId) {
      return NextResponse.redirect(
        new URL('/login?error=oauth_not_configured', baseUrl)
      )
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
      return NextResponse.redirect(
        new URL('/login?error=token_exchange_failed', baseUrl)
      )
    }

    const tokens: AppleTokenResponse = await tokenResponse.json()

    // 3. Décoder l'id_token pour obtenir les infos utilisateur
    // Apple envoie les infos dans l'id_token JWT (pas besoin d'un appel API supplémentaire)
    const tokenToVerify = tokens.id_token || idToken
    if (!tokenToVerify) {
      return NextResponse.redirect(
        new URL('/login?error=missing_id_token', baseUrl)
      )
    }

    // Vérifier le JWT Apple avec les clés publiques Apple
    const JWKS = jose.createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'))
    const { payload } = await jose.jwtVerify(tokenToVerify, JWKS, {
      issuer: 'https://appleid.apple.com',
      audience: clientId
    })

    const applePayload = payload as unknown as AppleIdTokenPayload
    const appleUserId = applePayload.sub

    // Apple ne renvoie le nom que lors de la PREMIÈRE connexion
    // On le récupère depuis le champ "user" du form_post
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
        // Pas de données utilisateur, ce n'est pas la première connexion
      }
    }

    const email = applePayload.email

    if (!email) {
      // Apple peut masquer l'email (relay privé)
      // On utilise l'ID Apple comme identifiant de fallback
      return NextResponse.redirect(
        new URL('/login?error=email_required', baseUrl)
      )
    }

    // 4. Vérifier si l'utilisateur existe déjà (par email OU par apple_id)
    let user = await queryOne<Record<string, unknown>>(
      "SELECT * FROM users WHERE email = $1 OR metadata->>'apple_id' = $2",
      [email, appleUserId]
    )

    let orgId: number

    if (user) {
      // L'utilisateur existe - mettre à jour la date de dernière connexion
      await query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id as number]
      )

      // Si le nom n'était pas encore renseigné et qu'on le reçoit maintenant
      if (userName !== 'Utilisateur Apple' && user.full_name === 'Utilisateur Apple') {
        await query(
          'UPDATE users SET full_name = $1 WHERE id = $2',
          [userName, user.id as number]
        )
      }

      const userRole = await queryOne<Record<string, unknown>>(
        'SELECT org_id FROM user_roles WHERE user_id = $1 LIMIT 1',
        [user.id as number]
      )
      orgId = userRole?.org_id as number
    } else {
      // 5. Créer un nouvel utilisateur
      user = await queryOne<Record<string, unknown>>(
        `INSERT INTO users (email, password_hash, full_name, email_verified, email_verified_at, metadata)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
         RETURNING *`,
        [
          email,
          '', // Pas de mot de passe pour OAuth
          userName,
          true, // Apple vérifie les emails
          JSON.stringify({
            oauth_provider: 'apple',
            apple_id: appleUserId
          })
        ]
      )

      // 6. Créer une organisation par défaut
      const orgName = firstName || userName
      const org = await queryOne<Record<string, unknown>>(
        `INSERT INTO organisations (name, created_by, settings)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          `Organisation de ${orgName}`,
          (user as Record<string, unknown>).id as number,
          JSON.stringify({ plan: 'free', features: { max_tournois: 1, max_equipes: 8 } })
        ]
      )
      orgId = (org as Record<string, unknown>).id as number

      // 7. Lier l'utilisateur à son organisation
      await query(
        `INSERT INTO user_roles (user_id, org_id, role)
         VALUES ($1, $2, 'owner')`,
        [(user as Record<string, unknown>).id as number, orgId]
      )
    }

    // 8. Générer un token JWT
    const token = generateToken({
      userId: (user as Record<string, unknown>).id!.toString(),
      email: (user as Record<string, unknown>).email as string
    })

    // 9. Créer le cookie de session
    const cookie = serialize('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // 'lax' nécessaire pour le redirect POST Apple
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: '/'
    })

    // 10. Rediriger vers le dashboard
    const response = NextResponse.redirect(new URL('/dashboard', baseUrl))
    response.headers.set('Set-Cookie', cookie)

    return response

  } catch (error) {
    console.error('Erreur OAuth Apple:', error)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.url
    return NextResponse.redirect(
      new URL('/login?error=oauth_error', baseUrl)
    )
  }
}
