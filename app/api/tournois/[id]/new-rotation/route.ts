// app/api/tournois/[id]/new-rotation/route.ts
// Création transactionnelle d'une nouvelle rotation (équipes + matchs)
// Fix Bug #4 : si une étape échoue, rollback de TOUT (équipes orphelines impossibles)

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { transaction, queryOne } from '@/lib/db'
import { emitTournamentEvent } from '@/lib/tournament-events'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

interface TeamInput {
  name: string
  joueur_ids: string[]
  stats?: { victoires: number; defaites: number; points_pour: number; points_contre: number }
}

interface MatchInput {
  tour: number
  terrain: number | null
  // Indices vers le tableau teams (0-based), pas des UUID
  team_a_index: number
  team_b_index: number | null
  type?: string
  poule?: string | null
  status?: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Rate limiting (rotation = opération lourde)
  const rateLimitResponse = applyRateLimit(request, 'new-rotation', RATE_LIMITS.batch)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const { id: tournoiId } = await params

    const body = await request.json()
    const { teams, matches, rotation_number } = body as {
      teams: TeamInput[]
      matches: MatchInput[]
      rotation_number: number
    }

    if (!Array.isArray(teams) || teams.length === 0) {
      return apiError('teams doit être un tableau non-vide', 400)
    }
    if (!Array.isArray(matches) || matches.length === 0) {
      return apiError('matches doit être un tableau non-vide', 400)
    }
    if (typeof rotation_number !== 'number' || rotation_number < 2) {
      return apiError('rotation_number doit être >= 2', 400)
    }
    if (teams.length > 100) return apiError('Maximum 100 équipes', 400)
    if (matches.length > 500) return apiError('Maximum 500 matchs', 400)

    // Vérifier accès au tournoi
    const tournoiResult = await queryOne<{ org_id: string; mode: string }>(
      'SELECT org_id, mode FROM tournois WHERE id = $1',
      [tournoiId]
    )
    if (!tournoiResult) return apiError('Tournoi introuvable', 404)
    if (tournoiResult.mode !== 'melee_tournante') {
      return apiError('Rotation disponible uniquement en mêlée tournante', 400)
    }
    const hasAccess = await checkOrgAccess(user.id, tournoiResult.org_id)
    if (!hasAccess) return apiError('Accès refusé', 403)

    // TRANSACTION : création équipes + matchs en une seule transaction
    // Si erreur sur les matchs, les équipes créées sont rollback automatiquement
    const result = await transaction(async (client) => {
      // 1. Vérifier qu'aucune équipe avec le même préfixe R{n}- n'existe déjà
      const prefix = `R${rotation_number}-%`
      const existingTeams = await client.query(
        `SELECT id FROM equipes WHERE tournoi_id = $1 AND name LIKE $2`,
        [tournoiId, prefix]
      )
      if (existingTeams.rows.length > 0) {
        throw new Error(`Les équipes de la rotation ${rotation_number} existent déjà`)
      }

      // 2. Insertion bulk des équipes
      const teamValues: any[] = []
      const teamValueStrings: string[] = []
      teams.forEach((t, i) => {
        const b = i * 4
        teamValueStrings.push(`($${b+1}, $${b+2}, $${b+3}, $${b+4}::jsonb)`)
        const defaultStats = { victoires: 0, defaites: 0, points_pour: 0, points_contre: 0 }
        teamValues.push(
          tournoiId,
          t.name,
          t.joueur_ids,
          JSON.stringify(t.stats || defaultStats)
        )
      })

      const teamsInsertResult = await client.query(
        `INSERT INTO equipes (tournoi_id, name, joueur_ids, stats)
         VALUES ${teamValueStrings.join(', ')}
         RETURNING id, name`,
        teamValues
      )

      const createdTeams = teamsInsertResult.rows as { id: string; name: string }[]

      // 3. Construire les matchs avec les vrais IDs des équipes
      const matchValues: any[] = []
      const matchValueStrings: string[] = []
      matches.forEach((m, i) => {
        if (m.team_a_index < 0 || m.team_a_index >= createdTeams.length) {
          throw new Error(`Match ${i}: team_a_index invalide`)
        }
        if (m.team_b_index !== null && (m.team_b_index < 0 || m.team_b_index >= createdTeams.length)) {
          throw new Error(`Match ${i}: team_b_index invalide`)
        }
        if (m.team_a_index === m.team_b_index) {
          throw new Error(`Match ${i}: les deux équipes doivent être différentes`)
        }

        const equipeAId = createdTeams[m.team_a_index].id
        const equipeBId = m.team_b_index !== null ? createdTeams[m.team_b_index].id : null

        const b = i * 8
        matchValueStrings.push(`($${b+1}, $${b+2}, $${b+3}, $${b+4}, $${b+5}, $${b+6}, $${b+7}, $${b+8})`)
        matchValues.push(
          tournoiId,
          m.tour || rotation_number,
          m.terrain,
          equipeAId,
          equipeBId,
          m.type || 'poule',
          m.poule,
          m.status || 'a_jouer'
        )
      })

      // 4. Insertion bulk des matchs
      const matchesInsertResult = await client.query(
        `INSERT INTO matches (tournoi_id, tour, terrain, equipe_a_id, equipe_b_id, type, poule, status)
         VALUES ${matchValueStrings.join(', ')}
         RETURNING *`,
        matchValues
      )

      return {
        rotation_number,
        teams_created: createdTeams.length,
        matches_created: matchesInsertResult.rows.length,
        teams: createdTeams,
        matches: matchesInsertResult.rows
      }
    })

    emitTournamentEvent('team:created', tournoiId, { count: result.teams_created })
    emitTournamentEvent('match:created', tournoiId, { count: result.matches_created })

    return apiSuccess(result, 201)
  } catch (error: any) {
    console.error('❌ Erreur POST /api/tournois/[id]/new-rotation:', error)
    return apiError(error.message || 'Erreur lors de la rotation', 500)
  }
}
