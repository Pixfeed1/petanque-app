// app/api/joueurs/[id]/route.ts
// FIX SÉCURITÉ : ajout des checks d'org sur GET/PUT/DELETE.
// Avant ce fix, n'importe quel user authentifié pouvait lire/modifier/supprimer
// les joueurs de n'importe quel club.
// FIX BUG : la requête de vérification "joueur dans une équipe active" utilisait
// joueur_ids @> $1::jsonb alors que la colonne est BIGINT[] → plantait silencieusement.

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { query, queryOne } from '@/lib/db'
import { SQLValue } from '@/lib/types'
import { joueurIdSchema, updateJoueurSchema, validateRequest } from '@/lib/validations'

// GET /api/joueurs/[id] - Récupérer un joueur par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const { id } = await params

    const idValidation = validateRequest(joueurIdSchema, { id })
    if (!idValidation.success) {
      return apiError(idValidation.errors.join(', '), 400)
    }

    const joueur = await queryOne<{ org_id: string | number }>(
      'SELECT * FROM joueurs WHERE id = $1',
      [id]
    )

    if (!joueur) {
      return apiError('Joueur introuvable', 404)
    }

    // FIX SÉCURITÉ : vérifier que le user a accès à l'org du joueur
    const hasAccess = await checkOrgAccess(user.id, String(joueur.org_id))
    if (!hasAccess) {
      return apiError('Accès refusé', 403)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const { id } = await params

    const idValidation = validateRequest(joueurIdSchema, { id })
    if (!idValidation.success) {
      return apiError(idValidation.errors.join(', '), 400)
    }

    const body = await request.json()

    const validation = validateRequest(updateJoueurSchema, body)
    if (!validation.success) {
      return apiError(validation.errors.join(', '), 400)
    }

    const { name, gender, email, phone } = validation.data
    const stats = (body as any).stats

    const joueur = await queryOne<{ org_id: string | number }>(
      'SELECT * FROM joueurs WHERE id = $1',
      [id]
    )

    if (!joueur) {
      return apiError('Joueur introuvable', 404)
    }

    // FIX SÉCURITÉ : vérifier l'org avant modification
    const hasAccess = await checkOrgAccess(user.id, String(joueur.org_id))
    if (!hasAccess) {
      return apiError('Accès refusé', 403)
    }

    const updates: string[] = []
    const values: SQLValue[] = []
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

    updates.push(`updated_at = NOW()`)
    values.push(id)

    const result = await query(
      `UPDATE joueurs SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    )

    if (result.rowCount === 0) {
      return apiError('Joueur introuvable', 404)
    }

    return apiSuccess(result.rows[0])
  } catch (error) {
    console.error('❌ Erreur PUT /api/joueurs/[id]:', error)
    return apiError('Erreur lors de la modification du joueur', 500)
  }
}

// DELETE /api/joueurs/[id] - Supprimer un joueur
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const { id } = await params

    const joueur = await queryOne<{ org_id: string | number }>(
      'SELECT * FROM joueurs WHERE id = $1',
      [id]
    )

    if (!joueur) {
      return apiError('Joueur introuvable', 404)
    }

    // FIX SÉCURITÉ : vérifier l'org avant suppression
    const hasAccess = await checkOrgAccess(user.id, String(joueur.org_id))
    if (!hasAccess) {
      return apiError('Accès refusé', 403)
    }

    // FIX BUG : joueur_ids est BIGINT[] pas JSONB. Avant : @> $1::jsonb plantait.
    // Maintenant : on teste si l'id est dans le tableau via ANY().
    const activeTeams = await query(
      `SELECT e.id, e.name as equipe_name, t.name as tournoi_name
       FROM equipes e
       JOIN tournois t ON e.tournoi_id = t.id
       WHERE $1::bigint = ANY(e.joueur_ids)
       AND t.status IN ('preparation', 'en_cours')
       LIMIT 1`,
      [id]
    )

    if (activeTeams.rows.length > 0) {
      const t = activeTeams.rows[0] as { equipe_name: string; tournoi_name: string }
      return apiError(
        `Impossible de supprimer : le joueur est dans l'équipe "${t.equipe_name}" du tournoi "${t.tournoi_name}"`,
        400
      )
    }

    const result = await query(
      'DELETE FROM joueurs WHERE id = $1 RETURNING *',
      [id]
    )

    if (result.rowCount === 0) {
      return apiError('Joueur introuvable', 404)
    }

    return apiSuccess({ message: 'Joueur supprimé avec succès', joueur: result.rows[0] })
  } catch (error) {
    console.error('❌ Erreur DELETE /api/joueurs/[id]:', error)
    return apiError('Erreur lors de la suppression du joueur', 500)
  }
}
