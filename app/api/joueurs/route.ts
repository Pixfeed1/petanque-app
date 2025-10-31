// app/api/joueurs/route.ts
// API pour gérer les joueurs

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { queryMany, query } from '@/lib/db'

// GET - Récupérer les joueurs d'une organisation
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org_id')

    if (!orgId) {
      return apiError('org_id est requis', 400)
    }

    const hasAccess = await checkOrgAccess(user.id, orgId)
    if (!hasAccess) {
      return apiError('Accès refusé', 403)
    }

    const joueurs = await queryMany(
      'SELECT * FROM joueurs WHERE org_id = $1 ORDER BY name',
      [orgId]
    )

    return apiSuccess(joueurs)
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

    const { org_id, name, email, phone, stats } = body

    if (!org_id || !name) {
      return apiError('Champs requis: org_id, name', 400)
    }

    const hasAccess = await checkOrgAccess(user.id, org_id)
    if (!hasAccess) {
      return apiError('Accès refusé', 403)
    }

    const result = await query(
      `INSERT INTO joueurs (org_id, name, email, phone, stats, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING *`,
      [org_id, name, email, phone, JSON.stringify(stats || {})]
    )

    return apiSuccess(result.rows[0], 201)
  } catch (error) {
    console.error('❌ Erreur POST /api/joueurs:', error)
    return apiError('Erreur lors de la création du joueur', 500)
  }
}
