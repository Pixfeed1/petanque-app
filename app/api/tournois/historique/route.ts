// app/api/tournois/historique/route.ts
// API pour l'historique des tournois terminés

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { queryMany } from '@/lib/db'

// GET - Récupérer l'historique des tournois terminés
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult

    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org_id')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''

    if (!orgId) {
      return apiError('org_id est requis', 400)
    }

    const hasAccess = await checkOrgAccess(user.id, orgId)
    if (!hasAccess) {
      return apiError('Accès refusé à cette organisation', 403)
    }

    // Récupérer les tournois terminés avec statistiques détaillées
    const searchCondition = search
      ? `AND LOWER(t.name) LIKE LOWER($4)`
      : ''
    const params: (string | number)[] = [orgId, limit, offset]
    if (search) {
      params.push(`%${search}%`)
    }

    const tournois = await queryMany(
      `SELECT t.*,
        (SELECT COUNT(DISTINCT unnest_id)
         FROM equipes e, LATERAL unnest(e.joueur_ids) AS unnest_id
         WHERE e.tournoi_id = t.id) AS nb_joueurs,
        (SELECT COUNT(*) FROM equipes e WHERE e.tournoi_id = t.id) AS nb_equipes,
        (SELECT COUNT(*) FROM matches m WHERE m.tournoi_id = t.id) AS nb_matchs_total,
        (SELECT COUNT(*) FROM matches m WHERE m.tournoi_id = t.id AND m.status = 'termine') AS nb_matchs_joues,
        (SELECT e.name FROM matches m
         JOIN equipes e ON e.id = m.winner_id
         WHERE m.tournoi_id = t.id AND m.type = 'finale' AND m.status = 'termine'
         LIMIT 1) AS vainqueur
       FROM tournois t
       WHERE t.org_id = $1
         AND t.status = 'termine'
         ${searchCondition}
       ORDER BY t.updated_at DESC
       LIMIT $2 OFFSET $3`,
      params
    )

    // Convertir les counts en nombres
    tournois.forEach((t: Record<string, unknown>) => {
      t.nb_joueurs = parseInt(String(t.nb_joueurs || '0'))
      t.nb_equipes = parseInt(String(t.nb_equipes || '0'))
      t.nb_matchs_total = parseInt(String(t.nb_matchs_total || '0'))
      t.nb_matchs_joues = parseInt(String(t.nb_matchs_joues || '0'))
    })

    return apiSuccess(tournois)
  } catch (error) {
    console.error('❌ Erreur GET /api/tournois/historique:', error)
    return apiError('Erreur lors de la récupération de l\'historique', 500)
  }
}
