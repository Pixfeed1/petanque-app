// app/api/equipes/route.ts
// API pour gérer les équipes

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { queryMany, query, queryOne, transaction } from '@/lib/db'
import { getOrgLimitAsync } from '@/lib/plans'

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

    const tournoi = await queryOne<{ org_id: number }>(
      'SELECT org_id FROM tournois WHERE id = $1',
      [tournoiId]
    )

    if (!tournoi) {
      return apiError('Tournoi non trouvé', 404)
    }

    const hasAccess = await checkOrgAccess(user.id, String(tournoi.org_id))
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

    const tournoi = await queryOne<{ org_id: number }>(
      'SELECT org_id FROM tournois WHERE id = $1',
      [tournoi_id]
    )

    if (!tournoi) {
      return apiError('Tournoi non trouvé', 404)
    }

    const hasAccess = await checkOrgAccess(user.id, String(tournoi.org_id))
    if (!hasAccess) {
      return apiError('Accès non autorisé à ce tournoi', 403)
    }

    const orgResult = await query(
      `SELECT settings FROM organisations WHERE id = $1`,
      [tournoi.org_id]
    )
    const orgSettings = orgResult.rows[0]?.settings || {}

    if (!name.trim()) {
      return apiError('Le nom de l\'équipe ne peut pas être vide', 400)
    }

    if (Array.isArray(joueur_ids) && joueur_ids.length > 0) {
      const tournoiDetails = await queryOne<{ format: string }>(
        'SELECT format FROM tournois WHERE id = $1',
        [tournoi_id]
      )
      if (tournoiDetails) {
        const expectedPlayers = tournoiDetails.format === 'tete_a_tete' ? 1 :
                                tournoiDetails.format === 'doublette' ? 2 : 3
        if (joueur_ids.length !== expectedPlayers) {
          return apiError(`Une ${tournoiDetails.format} requiert exactement ${expectedPlayers} joueur(s) par équipe, ${joueur_ids.length} fourni(s)`, 400)
        }
      }
    }

    const maxEquipes = await getOrgLimitAsync(orgSettings, 'max_equipes')

    // FIX BUG : transaction réelle via le helper transaction() qui partage
    // un seul client PoolClient. Avant : query('BEGIN') / query('COMMIT')
    // s'exécutaient sur des connexions différentes du pool, donc le verrou
    // FOR UPDATE et la transaction étaient inopérants.
    try {
      const created = await transaction(async (client) => {
        if (maxEquipes !== null) {
          const countResult = await client.query(
            `SELECT COUNT(*) as count FROM equipes WHERE tournoi_id = $1 FOR UPDATE`,
            [tournoi_id]
          )
          if (parseInt(countResult.rows[0]?.count || '0') >= maxEquipes) {
            // throw pour rollback automatique par transaction()
            throw new Error('LIMIT_REACHED')
          }
        }

        const result = await client.query(
          `INSERT INTO equipes (tournoi_id, name, joueur_ids, stats, created_at)
           VALUES ($1, $2, $3::bigint[], $4::jsonb, NOW())
           RETURNING *`,
          [tournoi_id, name.trim(), Array.isArray(joueur_ids) ? joueur_ids : [], JSON.stringify(stats || {})]
        )
        return result.rows[0]
      })

      return apiSuccess(created, 201)
    } catch (txError: any) {
      if (txError?.message === 'LIMIT_REACHED') {
        return apiError(`Votre plan est limité à ${maxEquipes} équipes par tournoi. Passez au plan supérieur pour des équipes illimitées.`, 403)
      }
      throw txError
    }
  } catch (error) {
    console.error('❌ Erreur POST /api/equipes:', error)
    return apiError('Erreur lors de la création de l\'équipe', 500)
  }
}
