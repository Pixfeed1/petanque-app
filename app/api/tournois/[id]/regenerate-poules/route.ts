// app/api/tournois/[id]/regenerate-poules/route.ts
// Régénération transactionnelle des matchs de poules
// Fix Bug #4 : tout en une seule transaction PG, rollback automatique si erreur

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { transaction, queryOne } from '@/lib/db'
import { emitTournamentEvent } from '@/lib/tournament-events'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

interface MatchInput {
  tour: number
  terrain: number | null
  equipe_a_id: string
  equipe_b_id: string | null
  type?: string
  poule?: string | null
  status?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting
  const rateLimitResponse = applyRateLimit(request, 'regenerate-poules', RATE_LIMITS.write)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const { id: tournoiId } = await params

    const body = await request.json()
    const { matches } = body as { matches: MatchInput[] }

    if (!Array.isArray(matches) || matches.length === 0) {
      return apiError('matches doit être un tableau non-vide', 400)
    }
    if (matches.length > 500) {
      return apiError('Maximum 500 matchs par requête', 400)
    }

    // Vérifier accès au tournoi
    const tournoiResult = await queryOne<{ org_id: string }>(
      'SELECT org_id FROM tournois WHERE id = $1',
      [tournoiId]
    )
    if (!tournoiResult) return apiError('Tournoi introuvable', 404)
    const hasAccess = await checkOrgAccess(user.id, tournoiResult.org_id)
    if (!hasAccess) return apiError('Accès refusé', 403)

    // TRANSACTION : suppression anciens matchs de poule + création des nouveaux
    // Si une étape échoue, rollback automatique : aucun changement en base
    const result = await transaction(async (client) => {
      // 1. Vérifier qu'aucun match de poule existant n'est en_cours / termine
      const existingResult = await client.query(
        `SELECT id, status FROM matches WHERE tournoi_id = $1 AND type = 'poule'`,
        [tournoiId]
      )
      const existing = existingResult.rows
      const playedMatches = existing.filter((m: any) => m.status === 'en_cours' || m.status === 'termine')
      if (playedMatches.length > 0) {
        throw new Error(`${playedMatches.length} match(s) déjà joué(s), impossible de régénérer`)
      }

      // 2. Supprimer tous les anciens matchs de poule en 1 requête
      await client.query(
        `DELETE FROM matches WHERE tournoi_id = $1 AND type = 'poule'`,
        [tournoiId]
      )

      // 3. Récupérer les équipes valides
      const equipesResult = await client.query(
        'SELECT id FROM equipes WHERE tournoi_id = $1',
        [tournoiId]
      )
      const validEquipeIds = new Set(equipesResult.rows.map((e: any) => e.id))

      // 4. Valider chaque nouveau match
      for (let i = 0; i < matches.length; i++) {
        const m = matches[i]
        if (!m.equipe_a_id || !validEquipeIds.has(m.equipe_a_id)) {
          throw new Error(`Match ${i}: equipe_a_id invalide`)
        }
        if (m.equipe_b_id && !validEquipeIds.has(m.equipe_b_id)) {
          throw new Error(`Match ${i}: equipe_b_id invalide`)
        }
        if (m.equipe_a_id === m.equipe_b_id) {
          throw new Error(`Match ${i}: les deux équipes doivent être différentes`)
        }
      }

      // 5. Insertion bulk des nouveaux matchs
      const values: any[] = []
      const valueStrings: string[] = []
      matches.forEach((m, i) => {
        const b = i * 8
        valueStrings.push(`($${b+1}, $${b+2}, $${b+3}, $${b+4}, $${b+5}, $${b+6}, $${b+7}, $${b+8})`)
        values.push(
          tournoiId,
          m.tour || 1,
          m.terrain,
          m.equipe_a_id,
          m.equipe_b_id,
          m.type || 'poule',
          m.poule,
          m.status || 'a_jouer'
        )
      })

      const insertResult = await client.query(
        `INSERT INTO matches (tournoi_id, tour, terrain, equipe_a_id, equipe_b_id, type, poule, status)
         VALUES ${valueStrings.join(', ')}
         RETURNING *`,
        values
      )

      return {
        deleted: existing.length,
        created: insertResult.rows.length,
        matches: insertResult.rows
      }
    })

    emitTournamentEvent('match:created', tournoiId, { count: result.created })
    emitTournamentEvent('match:deleted', tournoiId, { count: result.deleted })

    return apiSuccess(result, 201)
  } catch (error: any) {
    console.error('❌ Erreur POST /api/tournois/[id]/regenerate-poules:', error)
    return apiError(error.message || 'Erreur lors de la régénération', 500)
  }
}
