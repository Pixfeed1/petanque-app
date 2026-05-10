// app/api/auth/oauth/apple/login/route.ts
// FIX SÉCURITÉ : ajout du paramètre state CSRF (RFC 6749 §10.12).
// Pour Apple, le callback est en POST cross-site (form_post) — le cookie
// de state doit être en sameSite=none pour que le navigateur l'envoie.

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const clientId = process.env.APPLE_CLIENT_ID
  const redirectUri = process.env.APPLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/apple/callback`

  if (!clientId) {
    return NextResponse.json(
      { error: 'Apple Sign In non configuré' },
      { status: 500 }
    )
  }

  const state = crypto.randomBytes(32).toString('hex')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code id_token',
    scope: 'name email',
    response_mode: 'form_post',
    state
  })

  const authUrl = `https://appleid.apple.com/auth/authorize?${params.toString()}`

  const response = NextResponse.redirect(authUrl)

  // sameSite='none' obligatoire car Apple POST le callback cross-site.
  // 'none' impose 'secure' qui est OK en prod (HTTPS).
  const isProd = process.env.NODE_ENV === 'production'
  response.cookies.set('oauth_state_apple', state, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 600,
    path: '/'
  })

  return response
}
