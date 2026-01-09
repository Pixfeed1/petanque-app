// app/api/tournois/[id]/route.ts
// API pour un tournoi spécifique

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { queryOne, query } from '@/lib/db'
import { SQLValue } from '@/lib/types'

// GET - Récupérer un tournoi par ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const { id } = await params

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const { id } = await params
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

    const currentStatus = existingTournoi.status || 'preparation'

    // 🔧 FIX: Valider les transitions de statut
    if (body.status !== undefined && body.status !== currentStatus) {
      const validTransitions: Record<string, string[]> = {
        'preparation': ['en_cours', 'annule'],
        'en_cours': ['termine', 'annule'],
        'termine': [], // Aucune transition depuis termine
        'annule': []   // Aucune transition depuis annule
      }

      const allowedNext = validTransitions[currentStatus] || []
      if (!allowedNext.includes(body.status)) {
        return apiError(
          `Transition de statut invalide: ${currentStatus} → ${body.status}. Transitions autorisées: ${allowedNext.join(', ') || 'aucune'}`,
          400
        )
      }
    }

    // 🔧 FIX: Bloquer les modifications critiques après démarrage
    if (currentStatus !== 'preparation') {
      // Seuls le statut et le nom peuvent être modifiés après démarrage
      const restrictedFields = ['format', 'mode', 'settings']
      const hasRestrictedChanges = restrictedFields.some(f => body[f] !== undefined)

      if (hasRestrictedChanges) {
        return apiError(
          'Impossible de modifier le format, mode ou settings après le démarrage du tournoi',
          400
        )
      }
    }

    // Construire la requête de mise à jour
    const updates: string[] = []
    const values: SQLValue[] = []
    let paramIndex = 1

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return apiError('Le nom du tournoi ne peut pas être vide', 400)
      }
      if (body.name.trim().length > 200) {
        return apiError('Le nom du tournoi est trop long (maximum 200 caractères)', 400)
      }
      updates.push(`name = $${paramIndex++}`)
      values.push(body.name.trim())
    }

    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex++}`)
      values.push(body.status)
    }

    if (body.settings !== undefined) {
      // Validation des settings (même logique que POST)
      if (body.settings.maxPoints !== undefined && (typeof body.settings.maxPoints !== 'number' || body.settings.maxPoints < 1 || body.settings.maxPoints > 50)) {
        return apiError('maxPoints doit être un nombre entre 1 et 50', 400)
      }
      if (body.settings.pouleSize !== undefined && (typeof body.settings.pouleSize !== 'number' || body.settings.pouleSize < 3 || body.settings.pouleSize > 10)) {
        return apiError('pouleSize doit être un nombre entre 3 et 10', 400)
      }
      if (body.settings.qualifiedPerPoule !== undefined) {
        if (typeof body.settings.qualifiedPerPoule !== 'number' || body.settings.qualifiedPerPoule < 1) {
          return apiError('qualifiedPerPoule doit être un nombre >= 1', 400)
        }
        if (body.settings.pouleSize !== undefined && body.settings.qualifiedPerPoule >= body.settings.pouleSize) {
          return apiError('qualifiedPerPoule doit être inférieur à pouleSize', 400)
        }
      }
      if (body.settings.terrains !== undefined && (typeof body.settings.terrains !== 'number' || body.settings.terrains < 1 || body.settings.terrains > 100)) {
        return apiError('terrains doit être un nombre entre 1 et 100', 400)
      }
      // 🔧 FIX: Validation timeLimit et timeLimitMinutes
      if (body.settings.timeLimit !== undefined && typeof body.settings.timeLimit !== 'boolean') {
        return apiError('timeLimit doit être un booléen', 400)
      }
      if (body.settings.timeLimitMinutes !== undefined) {
        if (typeof body.settings.timeLimitMinutes !== 'number' || body.settings.timeLimitMinutes < 1 || body.settings.timeLimitMinutes > 300) {
          return apiError('timeLimitMinutes doit être un nombre entre 1 et 300', 400)
        }
      }
      // 🔧 FIX: Validation consolante
      if (body.settings.consolante !== undefined && typeof body.settings.consolante !== 'boolean') {
        return apiError('consolante doit être un booléen', 400)
      }
      updates.push(`settings = $${paramIndex++}::jsonb`)
      values.push(body.settings)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const { id } = await params

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
