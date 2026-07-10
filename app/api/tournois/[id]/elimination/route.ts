// app/api/tournois/[id]/elimination/route.ts
// Génération TRANSACTIONNELLE d'un tour d'élimination simple (premier tour +
// byes, tours suivants, finale/petite finale). Remplace les N POST /api/matches
// séquentiels du client, qui pouvaient :
//   - dupliquer un bracket (double-clic / 2 organisateurs, garde uniquement côté
//     état React),
//   - laisser un demi-bracket en cas d'échec au milieu.
// Garde serveur : refuse de recréer un type de tour déjà présent.

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { transaction, queryOne } from '@/lib/db'
import { emitTournamentEvent } from '@/lib/tournament-events'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

interface ElimMatchInput {
  equipe_a_id: string
  equipe_b_id: string | null
  tour?: number
  type: string
  status?: string
  score_a?: number | null
  score_b?: number | null
  winner_id?: string | null
}

const ALLOWED_TYPES = new Set(['huitieme', 'quart', 'demi', 'finale', 'petite_finale', 'bye'])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, 'elimination', RATE_LIMITS.batch)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const { id: tournoiId } = await params
    const body = await request.json()
    const matches: ElimMatchInput[] = Array.isArray(body.matches) ? body.matches : []

    if (matches.length === 0) return apiError('matches doit être un tableau non-vide', 400)
    if (matches.length > 64) return apiError('Maximum 64 matchs', 400)
    for (const m of matches) {
      if (!m.equipe_a_id) return apiError('equipe_a_id requis', 400)
      if (!ALLOWED_TYPES.has(m.type)) return apiError(`Type d'élimination invalide: ${m.type}`, 400)
    }

    const tournoi = await queryOne<{ org_id: string | number }>(
      'SELECT org_id FROM tournois WHERE id = $1',
      [tournoiId]
    )
    if (!tournoi) return apiError('Tournoi introuvable', 404)
    const hasAccess = await checkOrgAccess(user.id, String(tournoi.org_id))
    if (!hasAccess) return apiError('Accès refusé', 403)

    const result = await transaction(async (client) => {
      // Garde anti-doublon : aucun des types de tour (hors 'bye') ne doit déjà exister.
      const roundTypes = [...new Set(matches.map(m => m.type).filter(t => t !== 'bye'))]
      if (roundTypes.length > 0) {
        const existing = await client.query(
          `SELECT 1 FROM matches WHERE tournoi_id = $1 AND type = ANY($2::text[]) LIMIT 1`,
          [tournoiId, roundTypes]
        )
        if (existing.rows.length > 0) throw new Error('ROUND_EXISTS')
      }

      // Validation des équipes (appartenance au tournoi)
      const equipesResult = await client.query(
        'SELECT id FROM equipes WHERE tournoi_id = $1',
        [tournoiId]
      )
      const validIds = new Set(equipesResult.rows.map((e: any) => String(e.id)))
      for (let i = 0; i < matches.length; i++) {
        const m = matches[i]
        if (!validIds.has(String(m.equipe_a_id))) throw new Error(`Match ${i}: equipe_a_id invalide`)
        if (m.equipe_b_id != null && !validIds.has(String(m.equipe_b_id))) throw new Error(`Match ${i}: equipe_b_id invalide`)
        if (m.equipe_b_id != null && String(m.equipe_a_id) === String(m.equipe_b_id)) throw new Error(`Match ${i}: équipes identiques`)
      }

      const values: any[] = []
      const rows: string[] = []
      matches.forEach((m, i) => {
        const isBye = m.type === 'bye' || m.equipe_b_id == null
        const b = i * 8
        rows.push(`($${b+1}, $${b+2}, $${b+3}, $${b+4}, $${b+5}, $${b+6}, $${b+7}, $${b+8})`)
        values.push(
          tournoiId,
          m.tour || 1,
          m.equipe_a_id,
          m.equipe_b_id ?? null,
          m.type,
          isBye ? 'termine' : (m.status || 'a_jouer'),
          isBye ? 0 : (m.score_a ?? 0),
          isBye ? 0 : (m.score_b ?? 0),
        )
      })

      const insertResult = await client.query(
        `INSERT INTO matches (tournoi_id, tour, equipe_a_id, equipe_b_id, type, status, score_a, score_b)
         VALUES ${rows.join(', ')}
         RETURNING *`,
        values
      )

      // Renseigner winner_id des byes (équipe A qualifiée d'office)
      const byeIds = insertResult.rows.filter((r: any) => r.type === 'bye').map((r: any) => r.id)
      if (byeIds.length > 0) {
        await client.query(
          `UPDATE matches SET winner_id = equipe_a_id WHERE id = ANY($1::bigint[])`,
          [byeIds]
        )
      }

      return insertResult.rows
    })

    emitTournamentEvent('match:created', tournoiId, { count: result.length })
    return apiSuccess({ created: result.length, matches: result }, 201)
  } catch (error: any) {
    if (error?.message === 'ROUND_EXISTS') {
      return apiError('Ce tour d\'élimination existe déjà', 409)
    }
    if (error?.message && /invalide|identiques/.test(error.message)) {
      return apiError(error.message, 400)
    }
    console.error('❌ Erreur POST /api/tournois/[id]/elimination:', error)
    return apiError('Erreur lors de la génération du tour d\'élimination', 500)
  }
}
