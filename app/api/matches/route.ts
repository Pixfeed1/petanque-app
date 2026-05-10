// app/api/matches/route.ts
// FIX SÉCURITÉ : ajout du check d'org sur GET et POST.
// Avant ce fix, GET /api/matches?tournoi_id=X renvoyait les matchs de
// n'importe quel tournoi sans vérifier que l'utilisateur a accès à l'org
// propriétaire. Idem pour POST qui vérifiait juste l'appartenance des
// équipes au tournoi, pas l'accès à l'org.

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { queryMany, query, queryOne } from '@/lib/db'
import { MatchRawDB, MatchWithEquipes } from '@/lib/types'
import { tournoiIdQuerySchema, validateRequest } from '@/lib/validations'
import { emitTournamentEvent } from '@/lib/tournament-events'

// GET - Récupérer les matches d'un tournoi
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const { searchParams } = new URL(request.url)

    const validation = validateRequest(tournoiIdQuerySchema, {
      tournoi_id: searchParams.get('tournoi_id')
    })
    if (!validation.success) {
      return apiError(validation.errors.join(', '), 400)
    }

    const tournoiId = validation.data.tournoi_id

    // FIX SÉCURITÉ : vérifier que le user a accès à l'org du tournoi
    const tournoi = await queryOne<{ org_id: string | number }>(
      'SELECT org_id FROM tournois WHERE id = $1',
      [tournoiId]
    )
    if (!tournoi) {
      return apiError('Tournoi introuvable', 404)
    }
    const hasAccess = await checkOrgAccess(user.id, String(tournoi.org_id))
    if (!hasAccess) {
      return apiError('Accès refusé', 403)
    }

    const matchesRaw = await queryMany<MatchRawDB>(
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

    const matches: MatchWithEquipes[] = matchesRaw.map((match): MatchWithEquipes => {
      let manchesData = null
      if (match.manches_json && typeof match.manches_json === 'string' && match.manches_json.trim().length > 0) {
        try {
          manchesData = JSON.parse(match.manches_json)
        } catch {
          // JSON invalide — manchesData reste null
        }
      }

      return {
        id: match.id,
        tournoi_id: match.tournoi_id,
        equipe_a_id: match.equipe_a_id,
        equipe_b_id: match.equipe_b_id,
        equipe_a: match.equipe_a_id ? {
          id: match.equipe_a_id,
          name: match.equipe_a_name || '',
          joueur_ids: match.equipe_a_joueur_ids || []
        } : null,
        equipe_b: match.equipe_b_id ? {
          id: match.equipe_b_id,
          name: match.equipe_b_name || '',
          joueur_ids: match.equipe_b_joueur_ids || []
        } : null,
        score_a: match.score_a,
        score_b: match.score_b,
        status: match.status as MatchWithEquipes['status'],
        tour: match.tour,
        terrain: match.terrain,
        type: match.type as MatchWithEquipes['type'],
        poule: match.poule,
        round: match.round,
        manches_json: manchesData,
        started_at: match.started_at,
        ended_at: match.ended_at,
        validated_at: match.validated_at,
        played_at: match.played_at,
        proposed_by: match.proposed_by,
        proposed_at: match.proposed_at,
        winner_id: match.winner_id,
        created_at: match.created_at,
        updated_at: match.updated_at
      }
    })

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
    const { user } = authResult

    const body = await request.json()
    const { tournoi_id, tour, terrain, equipe_a_id, equipe_b_id, type, poule, status } = body

    if (!tournoi_id) {
      return apiError('tournoi_id est requis', 400)
    }

    if (!equipe_a_id) {
      return apiError('equipe_a_id est requis', 400)
    }

    // FIX SÉCURITÉ : vérifier l'accès à l'org du tournoi
    const tournoi = await queryOne<{ org_id: string | number }>(
      'SELECT org_id FROM tournois WHERE id = $1',
      [tournoi_id]
    )
    if (!tournoi) {
      return apiError('Tournoi introuvable', 404)
    }
    const hasAccess = await checkOrgAccess(user.id, String(tournoi.org_id))
    if (!hasAccess) {
      return apiError('Accès refusé', 403)
    }

    // FIX Bug #5 : Permettre equipe_b_id null pour les matchs BYE (brackets impairs)
    const isByeMatch = type === 'bye' || equipe_b_id === null

    if (!isByeMatch && !equipe_b_id) {
      return apiError('equipe_b_id est requis pour les matchs normaux (non-BYE)', 400)
    }

    if (!isByeMatch && equipe_a_id === equipe_b_id) {
      return apiError('Les deux équipes doivent être différentes', 400)
    }

    // Vérifier que l'équipe A existe et appartient au bon tournoi
    const equipeACheck = await queryOne(
      'SELECT id, tournoi_id FROM equipes WHERE id = $1',
      [equipe_a_id]
    )

    if (!equipeACheck) {
      return apiError(`Équipe A (${equipe_a_id}) n'existe pas`, 404)
    }

    if (String(equipeACheck.tournoi_id) !== String(tournoi_id)) {
      return apiError(`Équipe A n'appartient pas au tournoi ${tournoi_id}`, 400)
    }

    if (!isByeMatch) {
      const equipeBCheck = await queryOne(
        'SELECT id, tournoi_id FROM equipes WHERE id = $1',
        [equipe_b_id]
      )

      if (!equipeBCheck) {
        return apiError(`Équipe B (${equipe_b_id}) n'existe pas`, 404)
      }

      if (String(equipeBCheck.tournoi_id) !== String(tournoi_id)) {
        return apiError(`Équipe B n'appartient pas au tournoi ${tournoi_id}`, 400)
      }
    }

    const result = await query(
      `INSERT INTO matches (tournoi_id, tour, terrain, equipe_a_id, equipe_b_id, type, poule, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING *`,
      [tournoi_id, tour || 1, terrain, equipe_a_id, equipe_b_id, type || 'poule', poule, status || 'a_jouer']
    )

    emitTournamentEvent('match:created', tournoi_id, { match_id: result.rows[0].id })

    return apiSuccess(result.rows[0], 201)
  } catch (error) {
    console.error('❌ Erreur POST /api/matches:', error)
    return apiError('Erreur lors de la création du match', 500)
  }
}
