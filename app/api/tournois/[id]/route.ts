// app/api/tournois/[id]/route.ts
// API pour un tournoi spécifique

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { queryOne, query } from '@/lib/db'

// GET - Récupérer un tournoi par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const { id } = params

    // Récupérer le tournoi
    const tournoi = await queryOne(
      'SELECT * FROM tournois WHERE id = $1',
      [id]
    )

    if (!tournoi) {
      return apiError('Tournoi introuvable', 404)
    }

    // Vérifier l'accès
    const hasAccess = await checkOrgAccess(user.id, tournoi.org_id)
    if (!hasAccess) {
      return apiError('Accès refusé', 403)
    }

    return apiSuccess(tournoi)
  } catch (error) {
    console.error('❌ Erreur GET /api/tournois/[id]:', error)
    return apiError('Erreur lors de la récupération du tournoi', 500)
  }
}

// PUT - Mettre à jour un tournoi
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const { id } = params
    const body = await request.json()

    // Récupérer le tournoi existant
    const existingTournoi = await queryOne(
      'SELECT * FROM tournois WHERE id = $1',
      [id]
    )

    if (!existingTournoi) {
      return apiError('Tournoi introuvable', 404)
    }

    // Vérifier l'accès
    const hasAccess = await checkOrgAccess(user.id, existingTournoi.org_id)
    if (!hasAccess) {
      return apiError('Accès refusé', 403)
    }

    // Construire la requête de mise à jour
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(body.name)
    }

    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(body.status)
    }

    if (body.settings !== undefined) {
      updates.push(`settings = $${paramIndex++}`)
      values.push(JSON.stringify(body.settings))
    }

    if (updates.length === 0) {
      return apiError('Aucune mise à jour fournie', 400)
    }

    values.push(id)

    // Mettre à jour
    const result = await query(
      `UPDATE tournois
       SET ${updates.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    )

    return apiSuccess(result.rows[0])
  } catch (error) {
    console.error('❌ Erreur PUT /api/tournois/[id]:', error)
    return apiError('Erreur lors de la mise à jour du tournoi', 500)
  }
}

// DELETE - Supprimer un tournoi
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const { id } = params

    // Récupérer le tournoi
    const tournoi = await queryOne(
      'SELECT * FROM tournois WHERE id = $1',
      [id]
    )

    if (!tournoi) {
      return apiError('Tournoi introuvable', 404)
    }

    // Vérifier l'accès
    const hasAccess = await checkOrgAccess(user.id, tournoi.org_id)
    if (!hasAccess) {
      return apiError('Accès refusé', 403)
    }

    // Supprimer le tournoi (cascade supprimera équipes et matchs)
    await query('DELETE FROM tournois WHERE id = $1', [id])

    return apiSuccess({ message: 'Tournoi supprimé avec succès' })
  } catch (error) {
    console.error('❌ Erreur DELETE /api/tournois/[id]:', error)
    return apiError('Erreur lors de la suppression du tournoi', 500)
  }
}
