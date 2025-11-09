// app/api/auth/login/route.ts
// API de connexion

import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import { apiError, apiSuccess, validateRequiredFields, parseJsonBody } from '@/lib/middleware'
import cookie from 'cookie'

export async function POST(request: NextRequest) {
  try {
    // Parse le body
    const bodyResult = await parseJsonBody<{
      email: string
      password: string
      rememberMe?: boolean
    }>(request)

    if ('error' in bodyResult) {
      return bodyResult.error
    }

    const { email, password, rememberMe } = bodyResult.data

    // Validation des champs requis
    const validation = validateRequiredFields(bodyResult.data, ['email', 'password'])
    if (validation) {
      return validation
    }

    // Authentification
    const session = await authenticateUser(email, password)

    // Durée du cookie (7 jours si rememberMe, sinon session)
    const maxAge = rememberMe ? 7 * 24 * 60 * 60 : undefined

    // Créer la réponse
    const response = apiSuccess({
      user: session.user,
      token: session.token
    })

    // Définir le cookie avec le token
    response.cookies.set({
      name: 'auth-token',
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/'
    })

    return response
  } catch (error: unknown) {
    console.error('❌ Erreur login:', error)

    if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
      return apiError('Email ou mot de passe incorrect', 401)
    }

    return apiError('Erreur lors de la connexion', 500)
  }
}
