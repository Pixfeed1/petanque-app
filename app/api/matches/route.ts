// app/api/matches/route.ts
// API pour gérer les matches

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { queryMany, query, queryOne } from '@/lib/db'

// GET - Récupérer les matches d'un tournoi
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { searchParams } = new URL(request.url)
    const tournoiId = searchParams.get('tournoi_id')

    if (!tournoiId) {
      return apiError('tournoi_id est requis', 400)
    }

    const matchesRaw = await queryMany(
      `SELECT m.*,
              ea.id as equipe_a_id_check, ea.name as equipe_a_name, ea.joueur_ids as equipe_a_joueur_ids,
              eb.id as equipe_b_id_check, eb.name as equipe_b_name, eb.joueur_ids as equipe_b_joueur_ids
       FROM matches m
       LEFT JOIN equipes ea ON m.equipe_a_id = ea.id
       LEFT JOIN equipes eb ON m.equipe_b_id = eb.id
       WHERE m.tournoi_id = $1
       ORDER BY m.tour, m.terrain`,
      [tournoiId]
    )

    // Transform to nested format expected by frontend
    const matches = matchesRaw.map((match: any) => ({
      id: match.id,
      tournoi_id: match.tournoi_id,
      equipe_a_id: match.equipe_a_id,
      equipe_b_id: match.equipe_b_id,
      equipe_a: match.equipe_a_id ? {
        id: match.equipe_a_id,
        name: match.equipe_a_name,
        joueur_ids: match.equipe_a_joueur_ids
      } : null,
      equipe_b: match.equipe_b_id ? {
        id: match.equipe_b_id,
        name: match.equipe_b_name,
        joueur_ids: match.equipe_b_joueur_ids
      } : null,
      score_a: match.score_a,
      score_b: match.score_b,
      status: match.status,
      tour: match.tour,
      terrain: match.terrain,
      type: match.type,
      poule: match.poule,
      round: match.round,
      manches_json: match.manches_json,
      started_at: match.started_at,
      ended_at: match.ended_at,
      validated_at: match.validated_at,
      played_at: match.played_at,
      created_at: match.created_at,
      updated_at: match.updated_at
    }))

    return apiSuccess(matches)
  } catch (error) {
    console.error('❌ Erreur GET /api/matches:', error)
    return apiError('Erreur lors de la récupération des matches', 500)
  }
}

// POST - Créer un nouveau match
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const body = await request.json()
    const { tournoi_id, tour, terrain, equipe_a_id, equipe_b_id, type, poule, status } = body

    // Validation des champs requis
    if (!tournoi_id) {
      return apiError('tournoi_id est requis', 400)
    }

    if (!equipe_a_id || !equipe_b_id) {
      return apiError('equipe_a_id et equipe_b_id sont requis', 400)
    }

    // Vérifier que les deux équipes sont différentes
    if (equipe_a_id === equipe_b_id) {
      return apiError('Les deux équipes doivent être différentes', 400)
    }

    // Vérifier que les équipes existent et appartiennent au bon tournoi
    const equipeACheck = await queryOne(
      'SELECT id, tournoi_id FROM equipes WHERE id = $1',
      [equipe_a_id]
    )
    const equipeBCheck = await queryOne(
      'SELECT id, tournoi_id FROM equipes WHERE id = $1',
      [equipe_b_id]
    )

    if (!equipeACheck) {
      return apiError(`Équipe A (${equipe_a_id}) n'existe pas`, 404)
    }
    if (!equipeBCheck) {
      return apiError(`Équipe B (${equipe_b_id}) n'existe pas`, 404)
    }

    if (equipeACheck.tournoi_id !== tournoi_id) {
      return apiError(`Équipe A n'appartient pas au tournoi ${tournoi_id}`, 400)
    }
    if (equipeBCheck.tournoi_id !== tournoi_id) {
      return apiError(`Équipe B n'appartient pas au tournoi ${tournoi_id}`, 400)
    }

    const result = await query(
      `INSERT INTO matches (tournoi_id, tour, terrain, equipe_a_id, equipe_b_id, type, poule, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [tournoi_id, tour || 1, terrain, equipe_a_id, equipe_b_id, type || 'poule', poule, status || 'a_jouer']
    )

    return apiSuccess(result.rows[0], 201)
  } catch (error) {
    console.error('❌ Erreur POST /api/matches:', error)
    return apiError('Erreur lors de la création du match', 500)
  }
}
