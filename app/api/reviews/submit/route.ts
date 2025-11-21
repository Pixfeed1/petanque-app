// app/api/reviews/submit/route.ts
// API pour soumettre un avis utilisateur

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { query } from '@/lib/db'

// POST - Soumettre un nouvel avis
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const body = await request.json()

    const { rating, content, name, role } = body

    // Validation
    if (!rating || !content || !name) {
      return apiError('Champs requis: rating, content, name', 400)
    }

    if (rating < 1 || rating > 5) {
      return apiError('La note doit être entre 1 et 5', 400)
    }

    if (content.length < 10) {
      return apiError('Le commentaire doit contenir au moins 10 caractères', 400)
    }

    if (content.length > 500) {
      return apiError('Le commentaire ne doit pas dépasser 500 caractères', 400)
    }

    // Créer l'avis avec ON CONFLICT pour éviter race condition
    // Utilise INSERT ... ON CONFLICT pour atomicité (évite TOCTOU)
    const result = await query(
      `INSERT INTO reviews (user_id, rating, content, name, role, source, approved, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'web', false, NOW(), NOW())
       ON CONFLICT (user_id) DO NOTHING
       RETURNING *`,
      [user.id, rating, content, name, role || null]
    )

    // Si aucune ligne retournée, l'utilisateur a déjà un avis
    if (result.rows.length === 0) {
      return apiError('Vous avez déjà soumis un avis', 409)
    }

    const review = result.rows[0]

    return apiSuccess({
      message: 'Merci pour votre avis ! Il sera publié après modération.',
      review
    }, 201)
  } catch (error) {
    console.error('❌ Erreur POST /api/reviews/submit:', error)
    return apiError('Erreur lors de la soumission de l\'avis', 500)
  }
}
