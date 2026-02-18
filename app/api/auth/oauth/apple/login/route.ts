// app/api/auth/oauth/apple/login/route.ts
// Initie le flux OAuth Apple Sign In

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const clientId = process.env.APPLE_CLIENT_ID
  const redirectUri = process.env.APPLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/apple/callback`

  if (!clientId) {
    return NextResponse.json(
      { error: 'Apple Sign In non configuré' },
      { status: 500 }
    )
  }

  // Paramètres OAuth Apple
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code id_token',
    scope: 'name email',
    response_mode: 'form_post'
  })

  const authUrl = `https://appleid.apple.com/auth/authorize?${params.toString()}`

  // Rediriger vers Apple
  return NextResponse.redirect(authUrl)
}
