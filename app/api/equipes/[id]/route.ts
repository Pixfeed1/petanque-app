// app/api/equipes/[id]/route.ts
// API pour une équipe spécifique

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { queryOne, query, queryMany } from '@/lib/db'

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
        `SELECT * FROM joueurs WHERE id = ANY($1::uuid[])`,
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

    const existingEquipe = await queryOne(
      'SELECT * FROM equipes WHERE id = $1',
      [id]
    )

    if (!existingEquipe) {
      return apiError('Équipe introuvable', 404)
    }

    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(body.name)
    }

    if (body.joueur_ids !== undefined) {
      updates.push(`joueur_ids = $${paramIndex++}`)
      values.push(JSON.stringify(body.joueur_ids))
    }

    if (body.stats !== undefined) {
      updates.push(`stats = $${paramIndex++}`)
      values.push(JSON.stringify(body.stats))
    }

    if (updates.length === 0) {
      return apiError('Aucune mise à jour fournie', 400)
    }

    values.push(id)

    const result = await query(
      `UPDATE equipes
       SET ${updates.join(', ')}
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

    const equipe = await queryOne('SELECT id FROM equipes WHERE id = $1', [id])

    if (!equipe) {
      return apiError('Équipe introuvable', 404)
    }

    await query('DELETE FROM equipes WHERE id = $1', [id])

    return apiSuccess({ message: 'Équipe supprimée avec succès' })
  } catch (error) {
    console.error('❌ Erreur DELETE /api/equipes/[id]:', error)
    return apiError('Erreur lors de la suppression de l\'équipe', 500)
  }
}
