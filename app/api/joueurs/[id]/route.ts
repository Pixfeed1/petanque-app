import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { query, queryOne } from '@/lib/db'

// GET /api/joueurs/[id] - Récupérer un joueur par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const joueur = await queryOne(
      'SELECT * FROM joueurs WHERE id = $1',
      [params.id]
    )

    if (!joueur) {
      return apiError('Joueur introuvable', 404)
    }

    return apiSuccess(joueur)
  } catch (error) {
    console.error('❌ Erreur GET /api/joueurs/[id]:', error)
    return apiError('Erreur lors de la récupération du joueur', 500)
  }
}

// PUT /api/joueurs/[id] - Modifier un joueur
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const body = await request.json()
    const { name, gender, email, phone, stats } = body

    // Vérifier que le joueur existe
    const joueur = await queryOne(
      'SELECT * FROM joueurs WHERE id = $1',
      [params.id]
    )

    if (!joueur) {
      return apiError('Joueur introuvable', 404)
    }

    // Construire la requête UPDATE dynamiquement
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`)
      values.push(name)
    }

    if (gender !== undefined) {
      updates.push(`gender = $${paramIndex++}`)
      values.push(gender)
    }

    if (email !== undefined) {
      updates.push(`email = $${paramIndex++}`)
      values.push(email)
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`)
      values.push(phone)
    }

    if (stats !== undefined) {
      updates.push(`stats = $${paramIndex++}`)
      values.push(JSON.stringify(stats))
    }

    if (updates.length === 0) {
      return apiError('Aucune modification fournie', 400)
    }

    // Ajouter updated_at
    updates.push(`updated_at = NOW()`)

    // Ajouter l'ID à la fin
    values.push(params.id)

    const result = await query(
      `UPDATE joueurs SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    if (result.rowCount === 0) {
      return apiError('Joueur introuvable', 404)
    }

    console.log('✅ Joueur modifié:', params.id)
    return apiSuccess(result.rows[0])
  } catch (error) {
    console.error('❌ Erreur PUT /api/joueurs/[id]:', error)
    return apiError('Erreur lors de la modification du joueur', 500)
  }
}

// DELETE /api/joueurs/[id] - Supprimer un joueur
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    // Vérifier que le joueur existe
    const joueur = await queryOne(
      'SELECT * FROM joueurs WHERE id = $1',
      [params.id]
    )

    if (!joueur) {
      return apiError('Joueur introuvable', 404)
    }

    // Vérifier que le joueur n'est pas dans des équipes actives
    // Note: Si joueur_ids est JSONB, on peut vérifier avec @>
    const activeTeams = await query(
      `SELECT e.id, t.name as tournoi_name
       FROM equipes e
       JOIN tournois t ON e.tournoi_id = t.id
       WHERE e.joueur_ids @> $1::jsonb
       AND t.status IN ('preparation', 'en_cours')
       LIMIT 1`,
      [JSON.stringify([params.id])]
    )

    if (activeTeams.rows.length > 0) {
      return apiError(
        `Impossible de supprimer : le joueur est dans l'équipe "${activeTeams.rows[0].id}" du tournoi "${activeTeams.rows[0].tournoi_name}"`,
        400
      )
    }

    // Supprimer le joueur
    const result = await query(
      'DELETE FROM joueurs WHERE id = $1 RETURNING *',
      [params.id]
    )

    if (result.rowCount === 0) {
      return apiError('Joueur introuvable', 404)
    }

    console.log('✅ Joueur supprimé:', params.id)
    return apiSuccess({ message: 'Joueur supprimé avec succès', joueur: result.rows[0] })
  } catch (error) {
    console.error('❌ Erreur DELETE /api/joueurs/[id]:', error)
    return apiError('Erreur lors de la suppression du joueur', 500)
  }
}
