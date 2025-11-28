// app/api/equipes/[id]/route.ts
// API pour une équipe spécifique

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { queryOne, query, queryMany } from '@/lib/db'
import { SQLValue } from '@/lib/types'

// GET - Récupérer une équipe par ID avec les détails des joueurs
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { id } = await params

    const equipe = await queryOne(
      'SELECT * FROM equipes WHERE id = $1',
      [id]
    )

    if (!equipe) {
      return apiError('Équipe introuvable', 404)
    }

    // Enrichir avec les détails des joueurs
    if (equipe.joueur_ids && Array.isArray(equipe.joueur_ids)) {
      const joueurs = await queryMany(
        `SELECT * FROM joueurs WHERE id = ANY($1::bigint[])`,
        [equipe.joueur_ids]
      )
      equipe.joueurs = joueurs
    }

    return apiSuccess(equipe)
  } catch (error) {
    console.error('❌ Erreur GET /api/equipes/[id]:', error)
    return apiError('Erreur lors de la récupération de l\'équipe', 500)
  }
}

// PUT - Mettre à jour une équipe
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { id } = await params
    const body = await request.json()

    // Récupérer l'équipe avec le statut du tournoi
    const existingEquipe = await queryOne(
      `SELECT e.*, t.status as tournoi_status
       FROM equipes e
       LEFT JOIN tournois t ON e.tournoi_id = t.id
       WHERE e.id = $1`,
      [id]
    )

    if (!existingEquipe) {
      return apiError('Équipe introuvable', 404)
    }

    // Ne permettre la modification que si le tournoi est en préparation
    if (existingEquipe.tournoi_status !== 'preparation') {
      return apiError('Impossible de modifier une équipe une fois le tournoi démarré', 400)
    }

    const updates: string[] = []
    const values: SQLValue[] = []
    let paramIndex = 1

    if (body.name !== undefined) {
      // Validation du nom
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return apiError('Le nom de l\'équipe ne peut pas être vide', 400)
      }
      if (body.name.trim().length > 50) {
        return apiError('Le nom de l\'équipe est trop long (maximum 50 caractères)', 400)
      }
      updates.push(`name = $${paramIndex++}`)
      values.push(body.name.trim())
    }

    if (body.joueur_ids !== undefined) {
      if (!Array.isArray(body.joueur_ids)) {
        return apiError('joueur_ids doit être un tableau', 400)
      }
      updates.push(`joueur_ids = $${paramIndex++}::bigint[]`)
      values.push(body.joueur_ids)
    }

    if (body.stats !== undefined) {
      updates.push(`stats = $${paramIndex++}::jsonb`)
      values.push(body.stats)
    }

    if (updates.length === 0) {
      return apiError('Aucune mise à jour fournie', 400)
    }

    values.push(id)

    const result = await query(
      `UPDATE equipes
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    )

    return apiSuccess(result.rows[0])
  } catch (error) {
    console.error('❌ Erreur PUT /api/equipes/[id]:', error)
    return apiError('Erreur lors de la mise à jour de l\'équipe', 500)
  }
}

// DELETE - Supprimer une équipe
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { id } = await params

    // Récupérer l'équipe avec le statut du tournoi
    const equipe = await queryOne(
      `SELECT e.*, t.status as tournoi_status
       FROM equipes e
       LEFT JOIN tournois t ON e.tournoi_id = t.id
       WHERE e.id = $1`,
      [id]
    )

    if (!equipe) {
      return apiError('Équipe introuvable', 404)
    }

    // Ne permettre la suppression que si le tournoi est en préparation
    if (equipe.tournoi_status && equipe.tournoi_status !== 'preparation') {
      return apiError('Impossible de supprimer une équipe une fois le tournoi démarré', 400)
    }

    // Vérifier si des matchs existent avec cette équipe
    const matchesWithTeam = await queryOne(
      `SELECT COUNT(*) as count FROM matches
       WHERE equipe_a_id = $1 OR equipe_b_id = $1`,
      [id]
    )

    if (matchesWithTeam && parseInt(matchesWithTeam.count) > 0) {
      return apiError(
        `Impossible de supprimer cette équipe : ${matchesWithTeam.count} match(s) associé(s). Supprimez d'abord les matchs.`,
        400
      )
    }

    await query('DELETE FROM equipes WHERE id = $1', [id])

    return apiSuccess({ message: 'Équipe supprimée avec succès' })
  } catch (error) {
    console.error('❌ Erreur DELETE /api/equipes/[id]:', error)
    return apiError('Erreur lors de la suppression de l\'équipe', 500)
  }
}
