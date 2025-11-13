// app/api/reviews/moderate/route.ts
// API pour modérer les avis (approuver/refuser)
// Réservé aux administrateurs

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { query } from '@/lib/db'

// POST - Approuver ou refuser un avis
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const body = await request.json()

    const { review_id, action } = body // action: 'approve' ou 'reject'

    // Validation
    if (!review_id || !action) {
      return apiError('Champs requis: review_id, action', 400)
    }

    if (!['approve', 'reject'].includes(action)) {
      return apiError('Action invalide (approve ou reject)', 400)
    }

    // Vérifier que l'utilisateur est admin
    // Pour l'instant, simple vérification sur email ou champ is_admin
    // À améliorer avec un vrai système de rôles
    const userCheck = await query(
      `SELECT email FROM users WHERE id = $1`,
      [user.id]
    )

    const userEmail = userCheck.rows[0]?.email
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())

    if (!adminEmails.includes(userEmail)) {
      return apiError('Accès refusé - Vous n\'êtes pas administrateur', 403)
    }

    // Récupérer l'avis
    const reviewResult = await query(
      `SELECT * FROM reviews WHERE id = $1`,
      [review_id]
    )

    if (reviewResult.rows.length === 0) {
      return apiError('Avis introuvable', 404)
    }

    const review = reviewResult.rows[0]

    if (action === 'approve') {
      // Approuver l'avis
      await query(
        `UPDATE reviews
         SET approved = true, approved_at = NOW(), approved_by = $1, updated_at = NOW()
         WHERE id = $2`,
        [user.id, review_id]
      )

      return apiSuccess({
        message: 'Avis approuvé avec succès',
        review_id
      })
    } else {
      // Refuser l'avis (le supprimer de la base)
      await query(
        `DELETE FROM reviews WHERE id = $1`,
        [review_id]
      )

      return apiSuccess({
        message: 'Avis refusé et supprimé',
        review_id
      })
    }
  } catch (error) {
    console.error('❌ Erreur POST /api/reviews/moderate:', error)
    return apiError('Erreur lors de la modération', 500)
  }
}

// GET - Récupérer les avis en attente de modération (admin uniquement)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult

    // Vérifier que l'utilisateur est admin
    const userCheck = await query(
      `SELECT email FROM users WHERE id = $1`,
      [user.id]
    )

    const userEmail = userCheck.rows[0]?.email
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim())

    if (!adminEmails.includes(userEmail)) {
      return apiError('Accès refusé - Vous n\'êtes pas administrateur', 403)
    }

    // Récupérer tous les avis (approuvés et non approuvés)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // 'pending', 'approved', 'all'

    let sqlQuery = `
      SELECT
        r.id,
        r.rating,
        r.content,
        r.name,
        r.role,
        r.source,
        r.approved,
        r.created_at,
        r.approved_at,
        u.email as user_email
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
    `

    if (status === 'pending') {
      sqlQuery += ` WHERE r.approved = false`
    } else if (status === 'approved') {
      sqlQuery += ` WHERE r.approved = true`
    }

    sqlQuery += ` ORDER BY r.created_at DESC LIMIT 100`

    const reviews = await query(sqlQuery)

    // Stats
    const stats = await query(`
      SELECT
        COUNT(*) FILTER (WHERE approved = false) as pending,
        COUNT(*) FILTER (WHERE approved = true) as approved,
        COUNT(*) as total
      FROM reviews
    `)

    return apiSuccess({
      reviews: reviews.rows,
      stats: stats.rows[0]
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/reviews/moderate:', error)
    return apiError('Erreur lors de la récupération des avis', 500)
  }
}
