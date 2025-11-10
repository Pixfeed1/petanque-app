// lib/middleware.ts
// Middleware pour protéger les routes API

import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, getUserById, JWTPayload, User } from './auth'

export interface AuthenticatedRequest extends NextRequest {
  user?: User
}

/**
 * Extrait le token JWT de la requête
 * @param request - Requête Next.js
 * @returns Token ou null
 */
export function extractToken(request: NextRequest): string | null {
  // 1. Chercher dans le header Authorization
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // 2. Chercher dans les cookies
  const cookieToken = request.cookies.get('auth-token')?.value
  if (cookieToken) {
    return cookieToken
  }

  return null
}

/**
 * Middleware pour vérifier l'authentification
 * @param request - Requête Next.js
 * @returns Utilisateur authentifié ou erreur
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: User } | NextResponse> {
  try {
    // Extraire le token
    const token = extractToken(request)

    if (!token) {
      return NextResponse.json(
        { error: 'Non authentifié - Token manquant' },
        { status: 401 }
      )
    }

    // Vérifier le token
    const payload = verifyToken(token)

    if (!payload) {
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 401 }
      )
    }

    // Récupérer l'utilisateur
    const user = await getUserById(payload.userId)

    if (!user) {
      return NextResponse.json(
        { error: 'Utilisateur introuvable' },
        { status: 401 }
      )
    }

    return { user }
  } catch (error) {
    console.error('❌ Erreur middleware auth:', error)
    return NextResponse.json(
      { error: 'Erreur d\'authentification' },
      { status: 500 }
    )
  }
}

/**
 * Middleware optionnel - ne bloque pas si non authentifié
 * @param request - Requête Next.js
 * @returns Utilisateur authentifié ou null
 */
export async function optionalAuth(
  request: NextRequest
): Promise<User | null> {
  try {
    const token = extractToken(request)

    if (!token) {
      return null
    }

    const payload = verifyToken(token)

    if (!payload) {
      return null
    }

    const user = await getUserById(payload.userId)
    return user
  } catch (error) {
    console.error('❌ Erreur optionalAuth:', error)
    return null
  }
}

/**
 * Vérifie que l'utilisateur a accès à une organisation
 * @param userId - ID de l'utilisateur
 * @param orgId - ID de l'organisation
 * @returns True si l'utilisateur a accès
 */
export async function checkOrgAccess(
  userId: string,
  orgId: string
): Promise<boolean> {
  const { queryOne } = await import('./db')

  const role = await queryOne(
    'SELECT id FROM user_roles WHERE user_id = $1 AND org_id = $2',
    [userId, orgId]
  )

  return role !== null
}

/**
 * Vérifie que l'utilisateur est owner ou admin d'une organisation
 * @param userId - ID de l'utilisateur
 * @param orgId - ID de l'organisation
 * @returns True si l'utilisateur est owner/admin
 */
export async function checkOrgAdmin(
  userId: string,
  orgId: string
): Promise<boolean> {
  const { queryOne } = await import('./db')

  const role = await queryOne<{ role: string }>(
    'SELECT role FROM user_roles WHERE user_id = $1 AND org_id = $2',
    [userId, orgId]
  )

  return role?.role === 'owner' || role?.role === 'admin'
}

/**
 * Helper pour gérer les erreurs API de manière cohérente
 */
export function apiError(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Helper pour les réponses API réussies
 */
export function apiSuccess<T = any>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Valide les champs requis dans le body
 * @param body - Corps de la requête
 * @param requiredFields - Champs requis
 * @returns Erreur si un champ manque, null sinon
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): NextResponse | null {
  for (const field of requiredFields) {
    if (!body[field]) {
      return apiError(`Le champ '${field}' est requis`, 400)
    }
  }
  return null
}

/**
 * Parse le body JSON de manière sécurisée
 * @param request - Requête Next.js
 * @returns Body parsé ou erreur
 */
export async function parseJsonBody<T = any>(
  request: NextRequest
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const data = await request.json()
    return { data }
  } catch (error) {
    return {
      error: apiError('Corps de requête JSON invalide', 400)
    }
  }
}
