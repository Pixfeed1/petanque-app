// app/api/auth/login/route.ts
// API de connexion

import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'
import { apiError, apiSuccess, parseJsonBody } from '@/lib/middleware'
import { loginSchema, validateRequest } from '@/lib/validations'
import { applyRateLimit, RATE_LIMITS, resetRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting: 5 tentatives max par IP toutes les 15 minutes
  const rateLimitResponse = applyRateLimit(request, 'login', RATE_LIMITS.login)
  if (rateLimitResponse) return rateLimitResponse

  try {
    // Parse le body
    const bodyResult = await parseJsonBody(request)

    if ('error' in bodyResult) {
      return bodyResult.error
    }

    // Validation Zod
    const validation = validateRequest(loginSchema, bodyResult.data)
    if (!validation.success) {
      return apiError(validation.errors.join(', '), 400)
    }

    const { email, password } = validation.data
    const rememberMe = (bodyResult.data as any).rememberMe

    // Authentification
    const session = await authenticateUser(email, password)

    // Connexion réussie : réinitialiser le rate limit pour cet IP
    resetRateLimit(request, 'login')

    // Durée du cookie (7 jours si rememberMe, sinon session)
    const maxAge = rememberMe ? 7 * 24 * 60 * 60 : undefined

    // Créer la réponse
    const response = apiSuccess({
      user: session.user,
      token: session.token
    })

    // Définir le cookie avec le token
    // sameSite: 'strict' pour protection CSRF maximale
    response.cookies.set({
      name: 'auth-token',
      value: session.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Protection CSRF renforcée
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
