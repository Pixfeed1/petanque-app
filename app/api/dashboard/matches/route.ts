// app/api/dashboard/matches/route.ts
// API optimisée pour le dashboard — tous les matchs d'une organisation en une requête

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { queryMany } from '@/lib/db'

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

    // Une seule requête pour tous les matchs de tous les tournois de l'org
    const matches = await queryMany(
      `SELECT m.id, m.tournoi_id, m.status, m.tour, m.terrain,
              m.score_a, m.score_b, m.created_at, m.updated_at,
              ea.name as equipe_a_name, eb.name as equipe_b_name
       FROM matches m
       INNER JOIN tournois t ON m.tournoi_id = t.id
       LEFT JOIN equipes ea ON m.equipe_a_id = ea.id
       LEFT JOIN equipes eb ON m.equipe_b_id = eb.id
       WHERE t.org_id = $1
       ORDER BY m.updated_at DESC`,
      [orgId]
    )

    // Transformer pour correspondre au format attendu par le dashboard
    const formatted = matches.map((m: any) => ({
      id: m.id,
      tournoi_id: m.tournoi_id,
      status: m.status,
      tour: m.tour,
      terrain: m.terrain,
      score_a: m.score_a,
      score_b: m.score_b,
      created_at: m.created_at,
      updated_at: m.updated_at,
      equipe_a: m.equipe_a_name ? { name: m.equipe_a_name } : null,
      equipe_b: m.equipe_b_name ? { name: m.equipe_b_name } : null
    }))

    return apiSuccess(formatted)
  } catch (error) {
    console.error('❌ Erreur GET /api/dashboard/matches:', error)
    return apiError('Erreur lors de la récupération des matchs', 500)
  }
}
