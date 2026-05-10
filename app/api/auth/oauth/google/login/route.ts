// app/api/auth/oauth/google/login/route.ts
// FIX SÉCURITÉ : ajout du paramètre state CSRF (RFC 6749 §10.12).
// Le state est généré aléatoirement, posé dans un cookie httpOnly court,
// et passé en query à Google. Le callback vérifie qu'ils correspondent.

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/google/callback`

  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth non configuré' },
      { status: 500 }
    )
  }

  // Générer un state cryptographique pour empêcher le CSRF OAuth
  const state = crypto.randomBytes(32).toString('hex')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  const response = NextResponse.redirect(authUrl)

  // Cookie httpOnly de courte durée pour vérifier le state au callback.
  // sameSite='lax' suffit ici car le callback Google est un GET top-level.
  const isProd = process.env.NODE_ENV === 'production'
  response.cookies.set('oauth_state_google', state, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    maxAge: 600,
    path: '/'
  })

  return response
}
