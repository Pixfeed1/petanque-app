// app/api/equipes/[id]/route.ts
// FIX SÉCURITÉ : ajout des checks d'org sur GET/PUT/DELETE.
// L'org_id est récupérée via le tournoi de l'équipe (equipes n'ont pas
// d'org_id direct dans le schéma, le lien passe par tournois).

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { emitTournamentEvent } from '@/lib/tournament-events'
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
    const { user } = authResult

    const { id } = await params

    // Charger équipe + org_id du tournoi (pour le check d'accès)
    const equipe = await queryOne<any>(
      `SELECT e.*, t.org_id as tournoi_org_id
       FROM equipes e
       LEFT JOIN tournois t ON e.tournoi_id = t.id
       WHERE e.id = $1`,
      [id]
    )

    if (!equipe) {
      return apiError('Équipe introuvable', 404)
    }

    // FIX SÉCURITÉ : vérifier l'accès à l'org du tournoi
    if (!equipe.tournoi_org_id) {
      return apiError('Équipe orpheline (tournoi introuvable)', 404)
    }
    const hasAccess = await checkOrgAccess(user.id, String(equipe.tournoi_org_id))
    if (!hasAccess) {
      return apiError('Accès refusé', 403)
    }

    // Enrichir avec les détails des joueurs
    if (equipe.joueur_ids && Array.isArray(equipe.joueur_ids) && equipe.joueur_ids.length > 0) {
      const joueurs = await queryMany(
        `SELECT * FROM joueurs WHERE id = ANY($1::bigint[])`,
        [equipe.joueur_ids]
      )
      equipe.joueurs = joueurs
    } else {
      equipe.joueurs = []
    }

    // Retirer le champ technique tournoi_org_id avant de renvoyer
    delete equipe.tournoi_org_id

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
    const { user } = authResult

    const { id } = await params
    const body = await request.json()

    const existingEquipe = await queryOne<any>(
      `SELECT e.*, t.status as tournoi_status, t.mode as tournoi_mode, t.org_id as tournoi_org_id
       FROM equipes e
       LEFT JOIN tournois t ON e.tournoi_id = t.id
       WHERE e.id = $1`,
      [id]
    )

    if (!existingEquipe) {
      return apiError('Équipe introuvable', 404)
    }

    // FIX SÉCURITÉ : vérifier l'accès à l'org du tournoi
    if (!existingEquipe.tournoi_org_id) {
      return apiError('Équipe orpheline (tournoi introuvable)', 404)
    }
    const hasAccess = await checkOrgAccess(user.id, String(existingEquipe.tournoi_org_id))
    if (!hasAccess) {
      return apiError('Accès refusé', 403)
    }

    const isMeleeTournante = existingEquipe.tournoi_mode === 'melee_tournante'
    const isEnCours = existingEquipe.tournoi_status === 'en_cours'
    const isPreparation = existingEquipe.tournoi_status === 'preparation'

    if (!isPreparation && !(isEnCours && isMeleeTournante)) {
      return apiError('Impossible de modifier une équipe une fois le tournoi démarré', 400)
    }

    if (isEnCours && isMeleeTournante && body.joueur_ids !== undefined) {
      return apiError('Impossible de modifier la composition d\'une équipe en cours de tournoi', 400)
    }

    const updates: string[] = []
    const values: SQLValue[] = []
    let paramIndex = 1

    if (body.name !== undefined) {
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

    if (result.rows[0]?.tournoi_id) {
      emitTournamentEvent('team:updated', result.rows[0].tournoi_id, { team_id: id })
    }

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
    const { user } = authResult

    const { id } = await params

    // Charger équipe + org_id du tournoi
    const equipe = await queryOne<any>(
      `SELECT e.id, e.tournoi_id, t.org_id as tournoi_org_id
       FROM equipes e
       LEFT JOIN tournois t ON e.tournoi_id = t.id
       WHERE e.id = $1`,
      [id]
    )

    if (!equipe) {
      return apiError('Équipe introuvable', 404)
    }

    // FIX SÉCURITÉ : vérifier l'accès à l'org du tournoi
    if (!equipe.tournoi_org_id) {
      return apiError('Équipe orpheline (tournoi introuvable)', 404)
    }
    const hasAccess = await checkOrgAccess(user.id, String(equipe.tournoi_org_id))
    if (!hasAccess) {
      return apiError('Accès refusé', 403)
    }

    await query('DELETE FROM equipes WHERE id = $1', [id])

    if (equipe.tournoi_id) {
      emitTournamentEvent('team:updated', String(equipe.tournoi_id), { team_id: id, deleted: true })
    }

    return apiSuccess({ message: 'Équipe supprimée avec succès' })
  } catch (error) {
    console.error('❌ Erreur DELETE /api/equipes/[id]:', error)
    return apiError('Erreur lors de la suppression de l\'équipe', 500)
  }
}
