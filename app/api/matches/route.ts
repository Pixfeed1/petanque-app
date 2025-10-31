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

    const matches = await queryMany(
      `SELECT m.*,
              ea.name as equipe_a_name,
              eb.name as equipe_b_name
       FROM matches m
       LEFT JOIN equipes ea ON m.equipe_a_id = ea.id
       LEFT JOIN equipes eb ON m.equipe_b_id = eb.id
       WHERE m.tournoi_id = $1
       ORDER BY m.tour, m.terrain`,
      [tournoiId]
    )

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
    const { tournoi_id, tour, terrain, equipe_a_id, equipe_b_id } = body

    if (!tournoi_id) {
      return apiError('tournoi_id est requis', 400)
    }

    const result = await query(
      `INSERT INTO matches (tournoi_id, tour, terrain, equipe_a_id, equipe_b_id, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 'a_jouer', NOW(), NOW())
       RETURNING *`,
      [tournoi_id, tour || 1, terrain, equipe_a_id, equipe_b_id]
    )

    return apiSuccess(result.rows[0], 201)
  } catch (error) {
    console.error('❌ Erreur POST /api/matches:', error)
    return apiError('Erreur lors de la création du match', 500)
  }
}
