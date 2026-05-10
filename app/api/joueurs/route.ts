// app/api/joueurs/route.ts
// API pour gérer les joueurs

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { queryMany, query } from '@/lib/db'
import { SQLValue } from '@/lib/types'
import { orgIdQuerySchema, validateRequest } from '@/lib/validations'

// GET - Récupérer les joueurs d'une organisation
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const { searchParams } = new URL(request.url)

    // Validation Zod des query params
    const validation = validateRequest(orgIdQuerySchema, {
      org_id: searchParams.get('org_id')
    })
    if (!validation.success) {
      return apiError(validation.errors.join(', '), 400)
    }

    const { org_id: orgId } = validation.data
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''

    const hasAccess = await checkOrgAccess(user.id, orgId)
    if (!hasAccess) {
      return apiError('Accès refusé', 403)
    }

    // Build query with optional search
    let query_text = 'SELECT * FROM joueurs WHERE org_id = $1'
    let count_query = 'SELECT COUNT(*) as total FROM joueurs WHERE org_id = $1'
    const params: SQLValue[] = [orgId]
    const countParams: SQLValue[] = [orgId]

    if (search) {
      query_text += ' AND (name ILIKE $2 OR email ILIKE $2)'
      count_query += ' AND (name ILIKE $2 OR email ILIKE $2)'
      params.push(`%${search}%`)
      countParams.push(`%${search}%`)
    }

    query_text += ' ORDER BY name LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2)
    params.push(limit, offset)

    // Exécuter les deux requêtes en parallèle
    const [joueurs, countResult] = await Promise.all([
      queryMany(query_text, params),
      queryMany<{ total: string }>(count_query, countParams)
    ])

    const total = parseInt(countResult[0]?.total || '0')

    return apiSuccess({
      joueurs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + joueurs.length < total
      }
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/joueurs:', error)
    return apiError('Erreur lors de la récupération des joueurs', 500)
  }
}

// POST - Créer un nouveau joueur
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const body = await request.json()

    // Validation Zod
    const { createJoueurSchema } = await import('@/lib/validations')
    const validation = validateRequest(createJoueurSchema, body)
    if (!validation.success) {
      return apiError(validation.errors.join(', '), 400)
    }

    const { org_id, name, gender, email, phone } = validation.data
    const stats = (body as any).stats

    const hasAccess = await checkOrgAccess(user.id, org_id)
    if (!hasAccess) {
      return apiError('Accès refusé', 403)
    }

    // FIX BUG : gender était validé par Zod mais jamais inséré → tous les
    // nouveaux joueurs avaient gender=NULL et la mixité ne pouvait pas
    // s'appliquer. Ajout de la colonne et du paramètre.
    const result = await query(
      `INSERT INTO joueurs (org_id, name, gender, email, phone, stats, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [org_id, name, gender ?? null, email ?? null, phone ?? null, JSON.stringify(stats || {})]
    )

    return apiSuccess(result.rows[0], 201)
  } catch (error) {
    console.error('❌ Erreur POST /api/joueurs:', error)
    return apiError('Erreur lors de la création du joueur', 500)
  }
}
