// app/api/equipes/batch/route.ts
// API pour créer plusieurs équipes en une seule requête

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { emitTournamentEvent } from '@/lib/tournament-events'
import { query, queryOne, transaction } from '@/lib/db'
import { getOrgLimitAsync } from '@/lib/plans'

interface TeamInput {
  tournoi_id: string
  name: string
  joueur_ids: string[]
  stats?: Record<string, any>
}

// POST - Créer plusieurs équipes en une seule requête
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const body = await request.json()
    const { teams } = body as { teams: TeamInput[] }

    if (!Array.isArray(teams) || teams.length === 0) {
      return apiError('teams doit être un tableau non-vide', 400)
    }

    if (teams.length > 100) {
      return apiError('Maximum 100 équipes par requête', 400)
    }

    const tournoiId = teams[0].tournoi_id
    if (!tournoiId) {
      return apiError('tournoi_id est requis', 400)
    }

    const allSameTournoi = teams.every(t => t.tournoi_id === tournoiId)
    if (!allSameTournoi) {
      return apiError('Toutes les équipes doivent appartenir au même tournoi', 400)
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

    for (let i = 0; i < teams.length; i++) {
      const team = teams[i]
      if (!team.name || !team.name.trim()) {
        return apiError(`Équipe ${i}: name est requis`, 400)
      }
    }

    const orgResult = await query(
      `SELECT settings FROM organisations WHERE id = $1`,
      [tournoi.org_id]
    )
    const orgSettings = orgResult.rows[0]?.settings || {}
    const maxEquipes = await getOrgLimitAsync(orgSettings, 'max_equipes')

    const values: any[] = []
    const valueStrings: string[] = []

    teams.forEach((team, i) => {
      const baseIndex = i * 4
      valueStrings.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}::bigint[], $${baseIndex + 4}::jsonb)`
      )
      values.push(
        team.tournoi_id,
        team.name.trim(),
        Array.isArray(team.joueur_ids) ? team.joueur_ids : [],
        JSON.stringify(team.stats || {})
      )
    })

    const insertQuery = `
      INSERT INTO equipes (tournoi_id, name, joueur_ids, stats)
      VALUES ${valueStrings.join(', ')}
      RETURNING *
    `

    // FIX BUG : transaction réelle via le helper transaction() qui partage
    // un seul client PoolClient. Avant : query('BEGIN')/query('COMMIT')
    // s'exécutaient sur des connexions différentes du pool, donc le verrou
    // FOR UPDATE et la transaction étaient inopérants.
    let existingCountForError = 0
    try {
      const inserted = await transaction(async (client) => {
        if (maxEquipes !== null) {
          const countResult = await client.query(
            `SELECT COUNT(*) as count FROM equipes WHERE tournoi_id = $1 FOR UPDATE`,
            [tournoiId]
          )
          const existingCount = parseInt(countResult.rows[0]?.count || '0')
          existingCountForError = existingCount
          if (existingCount + teams.length > maxEquipes) {
            throw new Error('LIMIT_REACHED')
          }
        }

        const result = await client.query(insertQuery, values)
        return result.rows
      })

      emitTournamentEvent('team:created', tournoiId, { count: inserted.length })

      return apiSuccess({
        created: inserted.length,
        teams: inserted
      }, 201)
    } catch (txError: any) {
      if (txError?.message === 'LIMIT_REACHED') {
        return apiError(
          `Votre plan est limité à ${maxEquipes} équipes par tournoi (${existingCountForError} existantes). Passez au plan supérieur pour des équipes illimitées.`,
          403
        )
      }
      throw txError
    }
  } catch (error) {
    console.error('❌ Erreur POST /api/equipes/batch:', error)
    return apiError('Erreur lors de la création des équipes', 500)
  }
}
