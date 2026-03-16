// app/api/feedback/route.ts
// Soumission de feedback par les utilisateurs connectés

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, parseJsonBody } from '@/lib/middleware'
import { query, queryMany } from '@/lib/db'

// POST : soumettre un feedback
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const bodyResult = await parseJsonBody<{ message: string; category?: string }>(request)
    if ('error' in bodyResult) return bodyResult.error

    const { message, category } = bodyResult.data

    if (!message || message.trim().length < 5) {
      return apiError('Le message doit contenir au moins 5 caractères', 400)
    }

    if (message.trim().length > 2000) {
      return apiError('Le message ne peut pas dépasser 2000 caractères', 400)
    }

    await query(
      `INSERT INTO feedback (user_id, user_email, user_name, message, category)
       VALUES ($1, $2, $3, $4, $5)`,
      [user.id, user.email, user.full_name || null, message.trim(), category || 'general']
    )

    return apiSuccess({ sent: true }, 201)
  } catch (error: any) {
    console.error('❌ Erreur POST /api/feedback:', error)
    return apiError(`Erreur serveur: ${error?.message || error}`, 500)
  }
}

// GET : récupérer ses propres feedbacks (pour voir les réponses admin)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const feedbacks = await queryMany(
      `SELECT id, message, category, status, admin_reply, admin_replied_at, created_at
       FROM feedback
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [user.id]
    )

    return apiSuccess({ feedbacks })
  } catch (error) {
    console.error('❌ Erreur GET /api/feedback:', error)
    return apiError('Erreur serveur', 500)
  }
}
