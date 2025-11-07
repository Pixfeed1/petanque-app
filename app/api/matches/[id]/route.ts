// app/api/matches/[id]/route.ts
// API pour un match spécifique

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { queryOne, query } from '@/lib/db'

// GET - Récupérer un match par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { id } = await params

    const matchRaw = await queryOne(
      `SELECT m.*,
              ea.id as equipe_a_id_check, ea.name as equipe_a_name, ea.joueur_ids as equipe_a_joueur_ids,
              eb.id as equipe_b_id_check, eb.name as equipe_b_name, eb.joueur_ids as equipe_b_joueur_ids,
              t.id as tournoi_id_check, t.name as tournoi_name
       FROM matches m
       LEFT JOIN equipes ea ON m.equipe_a_id = ea.id
       LEFT JOIN equipes eb ON m.equipe_b_id = eb.id
       LEFT JOIN tournois t ON m.tournoi_id = t.id
       WHERE m.id = $1`,
      [id]
    )

    if (!matchRaw) {
      return apiError('Match introuvable', 404)
    }

    // Transform to nested format
    const match = {
      id: matchRaw.id,
      tournoi_id: matchRaw.tournoi_id,
      tournoi: matchRaw.tournoi_id ? {
        id: matchRaw.tournoi_id,
        name: matchRaw.tournoi_name
      } : null,
      equipe_a_id: matchRaw.equipe_a_id,
      equipe_b_id: matchRaw.equipe_b_id,
      equipe_a: matchRaw.equipe_a_id ? {
        id: matchRaw.equipe_a_id,
        name: matchRaw.equipe_a_name,
        joueur_ids: matchRaw.equipe_a_joueur_ids
      } : null,
      equipe_b: matchRaw.equipe_b_id ? {
        id: matchRaw.equipe_b_id,
        name: matchRaw.equipe_b_name,
        joueur_ids: matchRaw.equipe_b_joueur_ids
      } : null,
      score_a: matchRaw.score_a,
      score_b: matchRaw.score_b,
      status: matchRaw.status,
      tour: matchRaw.tour,
      terrain: matchRaw.terrain,
      type: matchRaw.type,
      poule: matchRaw.poule,
      round: matchRaw.round,
      manches_json: matchRaw.manches_json,
      started_at: matchRaw.started_at,
      ended_at: matchRaw.ended_at,
      validated_at: matchRaw.validated_at,
      played_at: matchRaw.played_at,
      created_at: matchRaw.created_at,
      updated_at: matchRaw.updated_at
    }

    return apiSuccess(match)
  } catch (error) {
    console.error('❌ Erreur GET /api/matches/[id]:', error)
    return apiError('Erreur lors de la récupération du match', 500)
  }
}

// PUT - Mettre à jour un match (score, statut, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { id } = await params
    const body = await request.json()

    const existingMatch = await queryOne(
      'SELECT * FROM matches WHERE id = $1',
      [id]
    )

    if (!existingMatch) {
      return apiError('Match introuvable', 404)
    }

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (body.score_a !== undefined) {
      updates.push(`score_a = $${paramIndex++}`)
      values.push(body.score_a)
    }

    if (body.score_b !== undefined) {
      updates.push(`score_b = $${paramIndex++}`)
      values.push(body.score_b)
    }

    if (body.manches_json !== undefined) {
      updates.push(`manches_json = $${paramIndex++}`)
      values.push(JSON.stringify(body.manches_json))
    }

    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(body.status)

      // Si le statut devient "termine", enregistrer played_at
      if (body.status === 'termine') {
        updates.push(`played_at = NOW()`)
      }
    }

    if (body.started_at !== undefined) {
      updates.push(`started_at = $${paramIndex++}`)
      values.push(body.started_at)
    }

    if (body.ended_at !== undefined) {
      updates.push(`ended_at = $${paramIndex++}`)
      values.push(body.ended_at)
    }

    if (body.validated_at !== undefined) {
      updates.push(`validated_at = $${paramIndex++}`)
      values.push(body.validated_at)
    }

    if (body.winner_id !== undefined) {
      updates.push(`winner_id = $${paramIndex++}`)
      values.push(body.winner_id)
    }

    if (body.terrain !== undefined) {
      updates.push(`terrain = $${paramIndex++}`)
      values.push(body.terrain)
    }

    if (updates.length === 0) {
      return apiError('Aucune mise à jour fournie', 400)
    }

    values.push(id)

    const result = await query(
      `UPDATE matches
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    )

    return apiSuccess(result.rows[0])
  } catch (error) {
    console.error('❌ Erreur PUT /api/matches/[id]:', error)
    return apiError('Erreur lors de la mise à jour du match', 500)
  }
}

// DELETE - Supprimer un match
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { id } = await params

    const match = await queryOne('SELECT id FROM matches WHERE id = $1', [id])

    if (!match) {
      return apiError('Match introuvable', 404)
    }

    await query('DELETE FROM matches WHERE id = $1', [id])

    return apiSuccess({ message: 'Match supprimé avec succès' })
  } catch (error) {
    console.error('❌ Erreur DELETE /api/matches/[id]:', error)
    return apiError('Erreur lors de la suppression du match', 500)
  }
}
