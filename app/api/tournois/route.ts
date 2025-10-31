// app/api/tournois/route.ts
// API pour gérer les tournois

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { queryMany, query } from '@/lib/db'

// GET - Récupérer les tournois de l'organisation
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult

    // Récupérer l'orgId depuis les query params
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org_id')

    if (!orgId) {
      return apiError('org_id est requis', 400)
    }

    // Vérifier l'accès
    const hasAccess = await checkOrgAccess(user.id, orgId)
    if (!hasAccess) {
      return apiError('Accès refusé à cette organisation', 403)
    }

    // Récupérer les tournois
    const tournois = await queryMany(
      `SELECT * FROM tournois
       WHERE org_id = $1
       ORDER BY created_at DESC`,
      [orgId]
    )

    return apiSuccess(tournois)
  } catch (error) {
    console.error('❌ Erreur GET /api/tournois:', error)
    return apiError('Erreur lors de la récupération des tournois', 500)
  }
}

// POST - Créer un nouveau tournoi
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const body = await request.json()

    const { org_id, name, format, mode, settings } = body

    // Validation
    if (!org_id || !name || !format || !mode) {
      return apiError('Champs requis: org_id, name, format, mode', 400)
    }

    // Vérifier l'accès
    const hasAccess = await checkOrgAccess(user.id, org_id)
    if (!hasAccess) {
      return apiError('Accès refusé à cette organisation', 403)
    }

    // Créer le tournoi
    const result = await query(
      `INSERT INTO tournois (org_id, name, format, mode, status, settings, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'preparation', $5, $6, NOW(), NOW())
       RETURNING *`,
      [org_id, name, format, mode, JSON.stringify(settings || {}), user.id]
    )

    const tournoi = result.rows[0]

    return apiSuccess(tournoi, 201)
  } catch (error) {
    console.error('❌ Erreur POST /api/tournois:', error)
    return apiError('Erreur lors de la création du tournoi', 500)
  }
}
