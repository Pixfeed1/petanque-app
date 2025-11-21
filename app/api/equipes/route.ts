// app/api/equipes/route.ts
// API pour gérer les équipes

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { queryMany, query, queryOne } from '@/lib/db'

// GET - Récupérer les équipes d'un tournoi
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const { searchParams } = new URL(request.url)
    const tournoiId = searchParams.get('tournoi_id')

    if (!tournoiId) {
      return apiError('tournoi_id est requis', 400)
    }

    // Vérifier que le tournoi existe et que l'utilisateur a accès à son organisation
    const tournoi = await queryOne<{ org_id: number }>(
      'SELECT org_id FROM tournois WHERE id = $1',
      [tournoiId]
    )

    if (!tournoi) {
      return apiError('Tournoi non trouvé', 404)
    }

    const hasAccess = await checkOrgAccess(user.id, tournoi.org_id)
    if (!hasAccess) {
      return apiError('Accès non autorisé à ce tournoi', 403)
    }

    const equipes = await queryMany(
      `SELECT e.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', j.id,
                    'name', j.name,
                    'email', j.email,
                    'phone', j.phone,
                    'stats', j.stats
                  ) ORDER BY j.name
                ) FILTER (WHERE j.id IS NOT NULL),
                '[]'::json
              ) as joueurs
       FROM equipes e
       LEFT JOIN LATERAL unnest(e.joueur_ids) WITH ORDINALITY AS jid(id, ord) ON true
       LEFT JOIN joueurs j ON j.id = jid.id
       WHERE e.tournoi_id = $1
       GROUP BY e.id
       ORDER BY e.name`,
      [tournoiId]
    )

    return apiSuccess(equipes)
  } catch (error) {
    console.error('❌ Erreur GET /api/equipes:', error)
    return apiError('Erreur lors de la récupération des équipes', 500)
  }
}

// POST - Créer une nouvelle équipe
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const body = await request.json()
    const { tournoi_id, name, joueur_ids, stats } = body

    if (!tournoi_id || !name) {
      return apiError('Champs requis: tournoi_id, name', 400)
    }

    // Vérifier accès au tournoi
    const tournoi = await queryOne<{ org_id: number }>(
      'SELECT org_id FROM tournois WHERE id = $1',
      [tournoi_id]
    )

    if (!tournoi) {
      return apiError('Tournoi non trouvé', 404)
    }

    const hasAccess = await checkOrgAccess(user.id, tournoi.org_id)
    if (!hasAccess) {
      return apiError('Accès non autorisé à ce tournoi', 403)
    }

    const result = await query(
      `INSERT INTO equipes (tournoi_id, name, joueur_ids, stats, created_at)
       VALUES ($1, $2, $3::bigint[], $4::jsonb, NOW())
       RETURNING *`,
      [
        tournoi_id,
        name,
        Array.isArray(joueur_ids) ? joueur_ids : [],
        JSON.stringify(stats || {})
      ]
    )

    return apiSuccess(result.rows[0], 201)
  } catch (error) {
    console.error('❌ Erreur POST /api/equipes:', error)
    return apiError('Erreur lors de la création de l\'équipe', 500)
  }
}
