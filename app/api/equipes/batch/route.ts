// app/api/equipes/batch/route.ts
// API pour créer plusieurs équipes en une seule requête

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { query, queryOne } from '@/lib/db'
import { getOrgLimit } from '@/lib/plans'

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

    // Validation
    if (!Array.isArray(teams) || teams.length === 0) {
      return apiError('teams doit être un tableau non-vide', 400)
    }

    if (teams.length > 100) {
      return apiError('Maximum 100 équipes par requête', 400)
    }

    // Valider que toutes les équipes ont le même tournoi_id
    const tournoiId = teams[0].tournoi_id
    if (!tournoiId) {
      return apiError('tournoi_id est requis', 400)
    }

    const allSameTournoi = teams.every(t => t.tournoi_id === tournoiId)
    if (!allSameTournoi) {
      return apiError('Toutes les équipes doivent appartenir au même tournoi', 400)
    }

    // Vérifier accès au tournoi
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

    // Valider chaque équipe
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i]
      if (!team.name || !team.name.trim()) {
        return apiError(`Équipe ${i}: name est requis`, 400)
      }
    }

    // Récupérer les settings pour vérifier les limites
    const orgResult = await query(
      `SELECT settings FROM organisations WHERE id = $1`,
      [tournoi.org_id]
    )
    const orgSettings = orgResult.rows[0]?.settings || {}
    const maxEquipes = getOrgLimit(orgSettings, 'max_equipes')

    // Construire la requête d'insertion en masse
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

    // Transaction avec verrou pour éviter la race condition sur la limite
    await query('BEGIN', [])
    try {
      if (maxEquipes !== null) {
        const countResult = await query(
          `SELECT COUNT(*) as count FROM equipes WHERE tournoi_id = $1 FOR UPDATE`,
          [tournoiId]
        )
        const existingCount = parseInt(countResult.rows[0]?.count || '0')
        if (existingCount + teams.length > maxEquipes) {
          await query('ROLLBACK', [])
          return apiError(`Votre plan est limité à ${maxEquipes} équipes par tournoi (${existingCount} existantes). Passez au plan supérieur pour des équipes illimitées.`, 403)
        }
      }

      const result = await query(insertQuery, values)
      await query('COMMIT', [])

      return apiSuccess({
        created: result.rows.length,
        teams: result.rows
      }, 201)
    } catch (txError) {
      await query('ROLLBACK', [])
      throw txError
    }
  } catch (error) {
    console.error('❌ Erreur POST /api/equipes/batch:', error)
    return apiError('Erreur lors de la création des équipes', 500)
  }
}
