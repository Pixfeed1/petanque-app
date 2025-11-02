// app/api/auth/oauth/google/login/route.ts
// Initie le flux OAuth Google

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/google/callback`

  if (!clientId) {
    return NextResponse.json(
      { error: 'Google OAuth non configuré' },
      { status: 500 }
    )
  }

  // Paramètres OAuth Google
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  })

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`

  // Rediriger vers Google
  return NextResponse.redirect(authUrl)
}
