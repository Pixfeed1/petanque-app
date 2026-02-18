// app/api/matches/batch/route.ts
// API pour créer plusieurs matches en une seule requête

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { query, queryOne } from '@/lib/db'

interface MatchInput {
  tournoi_id: string
  tour: number
  terrain: number | null
  equipe_a_id: string
  equipe_b_id: string | null
  type?: string
  poule?: string | null
  status?: string
}

// POST - Créer plusieurs matches en une seule requête
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const body = await request.json()
    const { matches } = body as { matches: MatchInput[] }

    // Validation
    if (!Array.isArray(matches) || matches.length === 0) {
      return apiError('matches doit être un tableau non-vide', 400)
    }

    if (matches.length > 200) {
      return apiError('Maximum 200 matchs par requête', 400)
    }

    // Valider que tous les matchs ont le même tournoi_id
    const tournoiId = matches[0].tournoi_id
    if (!tournoiId) {
      return apiError('tournoi_id est requis', 400)
    }

    const allSameTournoi = matches.every(m => m.tournoi_id === tournoiId)
    if (!allSameTournoi) {
      return apiError('Tous les matchs doivent appartenir au même tournoi', 400)
    }

    // Récupérer toutes les équipes du tournoi pour validation
    const equipesResult = await query(
      'SELECT id FROM equipes WHERE tournoi_id = $1',
      [tournoiId]
    )
    const validEquipeIds = new Set(equipesResult.rows.map((e) => (e as Record<string, unknown>).id as string))

    // Valider chaque match
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]

      if (!match.equipe_a_id) {
        return apiError(`Match ${i}: equipe_a_id est requis`, 400)
      }

      const isByeMatch = match.type === 'bye' || match.equipe_b_id === null

      if (!isByeMatch && !match.equipe_b_id) {
        return apiError(`Match ${i}: equipe_b_id est requis pour les matchs normaux`, 400)
      }

      if (!isByeMatch && match.equipe_a_id === match.equipe_b_id) {
        return apiError(`Match ${i}: Les deux équipes doivent être différentes`, 400)
      }

      if (!validEquipeIds.has(match.equipe_a_id)) {
        return apiError(`Match ${i}: equipe_a_id invalide`, 400)
      }

      if (!isByeMatch && match.equipe_b_id && !validEquipeIds.has(match.equipe_b_id)) {
        return apiError(`Match ${i}: equipe_b_id invalide`, 400)
      }
    }

    // Construire la requête d'insertion en masse
    const values: any[] = []
    const valueStrings: string[] = []

    matches.forEach((match, i) => {
      const baseIndex = i * 8
      valueStrings.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${baseIndex + 7}, $${baseIndex + 8})`
      )
      values.push(
        match.tournoi_id,
        match.tour || 1,
        match.terrain,
        match.equipe_a_id,
        match.equipe_b_id,
        match.type || 'poule',
        match.poule,
        match.status || 'a_jouer'
      )
    })

    const insertQuery = `
      INSERT INTO matches (tournoi_id, tour, terrain, equipe_a_id, equipe_b_id, type, poule, status)
      VALUES ${valueStrings.join(', ')}
      RETURNING *
    `

    const result = await query(insertQuery, values)

    return apiSuccess({
      created: result.rows.length,
      matches: result.rows
    }, 201)
  } catch (error) {
    console.error('❌ Erreur POST /api/matches/batch:', error)
    return apiError('Erreur lors de la création des matches', 500)
  }
}
