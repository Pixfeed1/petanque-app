// app/api/matches/[id]/route.ts
// API pour un match spécifique

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { queryOne, query } from '@/lib/db'
import { MatchRawDB, MatchWithEquipes, SQLValue } from '@/lib/types'

// GET - Récupérer un match par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const { id } = await params

    const matchRaw = await queryOne<MatchRawDB>(
      `SELECT m.*,
              ea.id as equipe_a_id_check, ea.name as equipe_a_name, ea.joueur_ids as equipe_a_joueur_ids,
              eb.id as equipe_b_id_check, eb.name as equipe_b_name, eb.joueur_ids as equipe_b_joueur_ids,
              t.id as tournoi_id_check, t.name as tournoi_name, t.org_id as tournoi_org_id
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

    // Vérifier que l'utilisateur a accès à l'organisation du tournoi
    if (matchRaw.tournoi_org_id) {
      const { checkOrgAccess } = await import('@/lib/middleware')
      const hasAccess = await checkOrgAccess(user.id, matchRaw.tournoi_org_id)
      if (!hasAccess) {
        return apiError('Accès refusé à ce match', 403)
      }
    }

    // Parse manches_json seulement si c'est une chaîne non-vide
    let manchesData = null
    if (matchRaw.manches_json && typeof matchRaw.manches_json === 'string' && matchRaw.manches_json.trim().length > 0) {
      try {
        manchesData = JSON.parse(matchRaw.manches_json)
      } catch (e) {
        console.warn(`⚠️  JSON invalide pour match ${matchRaw.id}:`, matchRaw.manches_json)
      }
    }

    // Transform to nested format
    const match: MatchWithEquipes = {
      id: matchRaw.id,
      tournoi_id: matchRaw.tournoi_id,
      tournoi: matchRaw.tournoi_id ? {
        id: matchRaw.tournoi_id,
        name: matchRaw.tournoi_name || ''
      } : null,
      equipe_a_id: matchRaw.equipe_a_id,
      equipe_b_id: matchRaw.equipe_b_id,
      equipe_a: matchRaw.equipe_a_id ? {
        id: matchRaw.equipe_a_id,
        name: matchRaw.equipe_a_name || '',
        joueur_ids: matchRaw.equipe_a_joueur_ids || []
      } : null,
      equipe_b: matchRaw.equipe_b_id ? {
        id: matchRaw.equipe_b_id,
        name: matchRaw.equipe_b_name || '',
        joueur_ids: matchRaw.equipe_b_joueur_ids || []
      } : null,
      score_a: matchRaw.score_a,
      score_b: matchRaw.score_b,
      status: matchRaw.status as MatchWithEquipes['status'],
      tour: matchRaw.tour,
      terrain: matchRaw.terrain,
      type: matchRaw.type as MatchWithEquipes['type'],
      poule: matchRaw.poule,
      round: matchRaw.round,
      manches_json: manchesData,
      started_at: matchRaw.started_at,
      ended_at: matchRaw.ended_at,
      validated_at: matchRaw.validated_at,
      played_at: matchRaw.played_at,
      proposed_by: matchRaw.proposed_by,
      proposed_at: matchRaw.proposed_at,
      winner_id: matchRaw.winner_id,
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
    const { user } = authResult

    const { id } = await params
    const body = await request.json()

    const existingMatch = await queryOne(
      `SELECT m.*, t.org_id as tournoi_org_id
       FROM matches m
       LEFT JOIN tournois t ON m.tournoi_id = t.id
       WHERE m.id = $1`,
      [id]
    )

    if (!existingMatch) {
      return apiError('Match introuvable', 404)
    }

    // Vérifier que l'utilisateur a accès à l'organisation du tournoi
    if (existingMatch.tournoi_org_id) {
      const { checkOrgAccess } = await import('@/lib/middleware')
      const hasAccess = await checkOrgAccess(user.id, existingMatch.tournoi_org_id)
      if (!hasAccess) {
        return apiError('Accès refusé pour modifier ce match', 403)
      }
    }

    const updates: string[] = []
    const values: SQLValue[] = []
    let paramIndex = 1

    // Validation des scores
    if (body.score_a !== undefined) {
      if (!Number.isInteger(body.score_a) || body.score_a < 0) {
        return apiError('Le score de l\'équipe A doit être un nombre entier positif ou zéro', 400)
      }
      if (body.score_a > 99) {
        return apiError('Le score de l\'équipe A est trop élevé (maximum 99)', 400)
      }
      updates.push(`score_a = $${paramIndex++}`)
      values.push(body.score_a)
    }

    if (body.score_b !== undefined) {
      if (!Number.isInteger(body.score_b) || body.score_b < 0) {
        return apiError('Le score de l\'équipe B doit être un nombre entier positif ou zéro', 400)
      }
      if (body.score_b > 99) {
        return apiError('Le score de l\'équipe B est trop élevé (maximum 99)', 400)
      }
      updates.push(`score_b = $${paramIndex++}`)
      values.push(body.score_b)
    }

    if (body.manches_json !== undefined) {
      updates.push(`manches_json = $${paramIndex++}`)
      values.push(JSON.stringify(body.manches_json))
    }

    if (body.status !== undefined) {
      // Validation des règles de pétanque si le statut devient "termine"
      if (body.status === 'termine') {
        const scoreA = body.score_a !== undefined ? body.score_a : existingMatch.score_a
        const scoreB = body.score_b !== undefined ? body.score_b : existingMatch.score_b

        // Vérifier qu'il n'y a pas d'égalité
        if (scoreA === scoreB) {
          return apiError('Un match de pétanque ne peut pas se terminer sur une égalité', 400)
        }

        // Récupérer le maxPoints du tournoi (par défaut 13)
        const tournoiQuery = await query(
          'SELECT settings FROM tournois WHERE id = $1',
          [existingMatch.tournoi_id]
        )
        const maxPoints = (tournoiQuery.rows[0]?.settings as any)?.maxPoints || 13

        // Vérifier qu'au moins une équipe a atteint le score maximum
        if (scoreA < maxPoints && scoreB < maxPoints) {
          return apiError(
            `Le match doit se terminer quand une équipe atteint ${maxPoints} points. Score actuel: ${scoreA}-${scoreB}`,
            400
          )
        }

        // Calculer automatiquement le winner_id basé sur les scores
        const calculatedWinnerId = scoreA > scoreB ? existingMatch.equipe_a_id : existingMatch.equipe_b_id
        if (!body.winner_id) {
          body.winner_id = calculatedWinnerId
        } else if (body.winner_id !== calculatedWinnerId) {
          return apiError('Le winner_id ne correspond pas au score final', 400)
        }

        // Enregistrer played_at quand le match se termine
        updates.push(`played_at = NOW()`)
      }

      updates.push(`status = $${paramIndex++}`)
      values.push(body.status)
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

    // Sécurité: Si le statut devient "en_attente_validation", forcer proposed_by à être l'utilisateur actuel
    // TODO: Colonnes proposed_by et proposed_at désactivées (n'existent pas dans la DB actuelle)
    // if (body.status === 'en_attente_validation') {
    //   updates.push(`proposed_by = $${paramIndex++}`)
    //   values.push(user.id)
    //   updates.push(`proposed_at = NOW()`)
    // }

    // Le winner_id peut être calculé automatiquement pour un match terminé
    if (body.winner_id !== undefined && body.winner_id !== null) {
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
