// app/api/tournois/[id]/double-elimination/route.ts
// Génération du squelette complet d'un bracket à double élimination.
// On insère TOUS les slots (WB + LB + grande finale) d'un coup ; les byes sont
// déjà résolus par le réducteur (computeBracketState). Aucune nouvelle colonne :
// l'identité du slot est encodée dans matches.type ("de:W1-0", "de:GF", ...).

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { transaction, queryOne, query } from '@/lib/db'
import { emitTournamentEvent } from '@/lib/tournament-events'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { buildInitialRows } from '@/lib/services/doubleEliminationIntegration'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, 'double-elimination', RATE_LIMITS.batch)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const { id: tournoiId } = await params
    const body = await request.json()
    const { teamIdsBySeed } = body as { teamIdsBySeed: string[] }

    if (!Array.isArray(teamIdsBySeed) || teamIdsBySeed.length < 3) {
      return apiError('teamIdsBySeed doit contenir au moins 3 équipes', 400)
    }
    if (teamIdsBySeed.length > 128) {
      return apiError('Maximum 128 équipes en double élimination', 400)
    }
    if (new Set(teamIdsBySeed).size !== teamIdsBySeed.length) {
      return apiError('teamIdsBySeed contient des doublons', 400)
    }

    // Accès tournoi
    const tournoiResult = await queryOne<{ org_id: string }>(
      'SELECT org_id FROM tournois WHERE id = $1',
      [tournoiId]
    )
    if (!tournoiResult) return apiError('Tournoi introuvable', 404)
    const hasAccess = await checkOrgAccess(user.id, tournoiResult.org_id)
    if (!hasAccess) return apiError('Accès refusé', 403)

    // Toutes les équipes doivent appartenir au tournoi
    const equipesResult = await query('SELECT id FROM equipes WHERE tournoi_id = $1', [tournoiId])
    const validIds = new Set(equipesResult.rows.map((e) => (e as Record<string, unknown>).id as string))
    for (const teamId of teamIdsBySeed) {
      if (!validIds.has(teamId)) return apiError(`Équipe inconnue dans ce tournoi : ${teamId}`, 400)
    }

    // Calcul de l'état initial (byes propagés par le réducteur)
    const rows = buildInitialRows(teamIdsBySeed)

    const result = await transaction(async (client) => {
      // Garde-fou : ne pas régénérer si une phase double élim existe déjà
      const existing = await client.query(
        `SELECT 1 FROM matches WHERE tournoi_id = $1 AND type LIKE 'de:%' LIMIT 1`,
        [tournoiId]
      )
      if (existing.rows.length > 0) {
        throw new Error('Une phase à double élimination existe déjà pour ce tournoi')
      }

      const values: any[] = []
      const valueStrings: string[] = []
      rows.forEach((r, i) => {
        const b = i * 7
        valueStrings.push(`($${b+1}, $${b+2}, $${b+3}, $${b+4}, $${b+5}, $${b+6}, $${b+7})`)
        values.push(
          tournoiId,
          r.tour,
          r.equipe_a_id,
          r.equipe_b_id,
          r.type,
          r.status,
          r.winner_id
        )
      })

      const inserted = await client.query(
        `INSERT INTO matches (tournoi_id, tour, equipe_a_id, equipe_b_id, type, status, winner_id)
         VALUES ${valueStrings.join(', ')}
         RETURNING *`,
        values
      )
      return inserted.rows
    })

    emitTournamentEvent('match:created', tournoiId, { count: result.length })

    return apiSuccess({ created: result.length, matches: result }, 201)
  } catch (error: any) {
    console.error('❌ Erreur POST /api/tournois/[id]/double-elimination:', error)
    return apiError(error.message || 'Erreur lors de la génération de la double élimination', 500)
  }
}
