// app/api/auth/oauth/facebook/login/route.ts
// Initie le flux OAuth Facebook

import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const appId = process.env.FACEBOOK_APP_ID
  const redirectUri = process.env.FACEBOOK_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/oauth/facebook/callback`

  if (!appId) {
    return NextResponse.json(
      { error: 'Facebook OAuth non configuré' },
      { status: 500 }
    )
  }

  // Paramètres OAuth Facebook
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: 'email,public_profile',
    response_type: 'code'
  })

  const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`

  // Rediriger vers Facebook
  return NextResponse.redirect(authUrl)
}
