// app/api/reviews/route.ts
// API pour récupérer les avis

import { NextRequest } from 'next/server'
import { apiSuccess, apiError } from '@/lib/middleware'
import { queryMany, query } from '@/lib/db'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// GET - Récupérer les avis (publics ou admin)
export async function GET(request: NextRequest) {
  // Rate limiting pour route publique
  const rateLimitResponse = applyRateLimit(request, 'reviews-get', RATE_LIMITS.api)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const { searchParams } = new URL(request.url)

    // Paramètres de filtrage
    const approved = searchParams.get('approved') !== 'false' // Par défaut: seulement les approuvés
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const rating = searchParams.get('rating') // Filtrer par note (optionnel)
    const source = searchParams.get('source') // Filtrer par source (optionnel)
    const orderBy = searchParams.get('order_by') || 'created_at' // Par défaut: plus récents
    const orderDir = searchParams.get('order_dir') || 'DESC'

    // Validation
    if (limit > 100) {
      return apiError('La limite maximale est 100', 400)
    }

    // Construire la requête SQL
    let sqlQuery = `SELECT
      id,
      rating,
      content,
      name,
      role,
      source,
      created_at,
      approved
    FROM reviews`

    const conditions: string[] = []
    const params: any[] = []
    let paramIndex = 1

    // Filtrer par approbation
    if (approved) {
      conditions.push(`approved = $${paramIndex}`)
      params.push(true)
      paramIndex++
    }

    // Filtrer par note
    if (rating) {
      conditions.push(`rating = $${paramIndex}`)
      params.push(parseInt(rating))
      paramIndex++
    }

    // Filtrer par source
    if (source && ['web', 'google_play', 'app_store'].includes(source)) {
      conditions.push(`source = $${paramIndex}`)
      params.push(source)
      paramIndex++
    }

    // Ajouter les conditions WHERE
    if (conditions.length > 0) {
      sqlQuery += ` WHERE ${conditions.join(' AND ')}`
    }

    // Ordre et pagination
    const validOrderBy = ['created_at', 'rating'].includes(orderBy) ? orderBy : 'created_at'
    const validOrderDir = orderDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'

    sqlQuery += ` ORDER BY ${validOrderBy} ${validOrderDir} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`
    params.push(limit, offset)

    // Exécuter la requête
    const reviews = await queryMany(sqlQuery, params)

    // Compter le total pour pagination
    let countQuery = `SELECT COUNT(*) as total FROM reviews`
    const countConditions: string[] = []
    const countParams: any[] = []
    let countParamIndex = 1

    if (approved) {
      countConditions.push(`approved = $${countParamIndex}`)
      countParams.push(true)
      countParamIndex++
    }
    if (rating) {
      countConditions.push(`rating = $${countParamIndex}`)
      countParams.push(parseInt(rating))
      countParamIndex++
    }
    if (source && ['web', 'google_play', 'app_store'].includes(source)) {
      countConditions.push(`source = $${countParamIndex}`)
      countParams.push(source)
      countParamIndex++
    }

    if (countConditions.length > 0) {
      countQuery += ` WHERE ${countConditions.join(' AND ')}`
    }

    const countResult = await query(countQuery, countParams)
    const total = parseInt(countResult.rows[0]?.total || '0')

    // Calculer la moyenne des notes (avis approuvés uniquement)
    const avgResult = await query(
      `SELECT AVG(rating)::numeric(3,2) as average, COUNT(*) as count
       FROM reviews WHERE approved = true`
    )
    const average = parseFloat(avgResult.rows[0]?.average || '0')
    const approvedCount = parseInt(avgResult.rows[0]?.count || '0')

    return apiSuccess({
      reviews,
      total,
      limit,
      offset,
      stats: {
        average: Math.round(average * 10) / 10, // Arrondir à 1 décimale
        total_approved: approvedCount
      }
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/reviews:', error)
    return apiError('Erreur lors de la récupération des avis', 500)
  }
}
