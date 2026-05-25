// app/api/organisations/route.ts
// API pour gérer les organisations

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { queryMany, query, transaction } from '@/lib/db'

// GET - Récupérer les organisations de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult

    // Récupérer toutes les organisations dont l'utilisateur fait partie
    const organisations = await queryMany(
      `SELECT o.*, ur.role
       FROM organisations o
       JOIN user_roles ur ON ur.org_id = o.id
       WHERE ur.user_id = $1
       ORDER BY o.created_at DESC`,
      [user.id]
    )

    return apiSuccess(organisations)
  } catch (error) {
    console.error('❌ Erreur GET /api/organisations:', error)
    return apiError('Erreur lors de la récupération des organisations', 500)
  }
}

// POST - Créer une nouvelle organisation
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = applyRateLimit(request, 'org-create', RATE_LIMITS.write)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const body = await request.json()

    const { name, settings } = body

    if (!name) {
      return apiError('Le nom de l\'organisation est requis', 400)
    }

    // FIX BUG : avant ce fix, les 2 INSERTs étaient hors transaction sur
    // des connexions différentes du pool. Si l'INSERT user_roles plantait,
    // l'organisation restait orpheline en base sans owner.
    const organisation = await transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO organisations (name, settings, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *`,
        [name, JSON.stringify({ plan: 'free', features: { max_tournois: 1, max_equipes: 8 }, ...(settings || {}) }), user.id]
      )

      const org = result.rows[0]

      await client.query(
        `INSERT INTO user_roles (user_id, org_id, role, granted_by, granted_at)
         VALUES ($1, $2, 'owner', $1, NOW())`,
        [user.id, org.id]
      )

      return org
    })

    return apiSuccess(organisation, 201)
  } catch (error) {
    console.error('❌ Erreur POST /api/organisations:', error)
    return apiError('Erreur lors de la création de l\'organisation', 500)
  }
}
