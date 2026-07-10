// app/api/matches/[id]/route.ts
// API pour un match spécifique

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { queryOne, query, transaction } from '@/lib/db'
import { MatchRawDB, MatchWithEquipes, SQLValue } from '@/lib/types'
import { emitTournamentEvent } from '@/lib/tournament-events'
import { parseDeType } from '@/lib/services/doubleElimination.service'
import { computeTargetState, type DEStoredRow } from '@/lib/services/doubleEliminationIntegration'
import { validateScore } from '@/lib/services/validation.service'

// Parse défensif des settings de tournoi : un JSON malformé ne doit pas faire
// planter (500) la page match. Fallback null si la chaîne n'est pas du JSON valide.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseTournoiSettings(raw: unknown): any {
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw)
    } catch {
      return null
    }
  }
  return raw || null
}

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
              t.id as tournoi_id_check, t.name as tournoi_name, t.format as tournoi_format, t.settings as tournoi_settings, t.org_id as tournoi_org_id
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
    // Fix faille : refus strict si tournoi_org_id absent (au lieu de skip silencieux)
    if (!matchRaw.tournoi_org_id) {
      return apiError('Match orphelin : aucun tournoi associé', 500)
    }
    const { checkOrgAccess: checkOrgAccess1 } = await import('@/lib/middleware')
    const hasAccess1 = await checkOrgAccess1(user.id, matchRaw.tournoi_org_id)
    if (!hasAccess1) {
      return apiError('Accès refusé à ce match', 403)
    }

    // FIX BUG : pg désérialise déjà le JSONB en objet/array JS. Ne parser que si
    // c'est une chaîne (legacy) ; sinon la valeur telle quelle. Avant, la condition
    // typeof==='string' était toujours fausse → manches_json null → historique des
    // mènes perdu et écrasé à la mène suivante.
    let manchesData = null
    if (typeof matchRaw.manches_json === 'string') {
      if (matchRaw.manches_json.trim().length > 0) {
        try {
          manchesData = JSON.parse(matchRaw.manches_json)
        } catch {
          // JSON invalide — manchesData reste null
        }
      }
    } else {
      manchesData = matchRaw.manches_json ?? null
    }

    // Transform to nested format
    const match: MatchWithEquipes = {
      id: matchRaw.id,
      tournoi_id: matchRaw.tournoi_id,
      tournoi: matchRaw.tournoi_id ? {
        id: matchRaw.tournoi_id,
        name: matchRaw.tournoi_name || '',
        format: (matchRaw as any).tournoi_format || null,
        settings: parseTournoiSettings((matchRaw as any).tournoi_settings)
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
/**
 * Avancement double élimination : après qu'un match "de:*" passe à "termine",
 * on recalcule TOUT le bracket (réducteur = source de vérité unique) et on
 * persiste le différentiel. Aucun routage manuel → aucune classe de bugs de
 * propagation. Les byes en cascade sont gérés par le réducteur.
 */
async function advanceDoubleElimination(tournoiId: string): Promise<void> {
  await transaction(async (client) => {
    const stored = await client.query(
      `SELECT id, type, equipe_a_id, equipe_b_id, status, winner_id
       FROM matches WHERE tournoi_id = $1 AND type LIKE 'de:%'`,
      [tournoiId]
    )
    const rows = stored.rows as Array<DEStoredRow & { id: string }>
    if (rows.length === 0) return

    const target = computeTargetState(rows)
    const byType = new Map(rows.map((r) => [r.type, r]))

    for (const m of target) {
      const cur = byType.get(m.type)
      if (!cur) continue
      const changed =
        cur.equipe_a_id !== m.equipeAId ||
        cur.equipe_b_id !== m.equipeBId ||
        cur.status !== m.status ||
        (cur.winner_id ?? null) !== (m.winnerId ?? null)
      if (!changed) continue
      await client.query(
        `UPDATE matches
         SET equipe_a_id = $1, equipe_b_id = $2, status = $3, winner_id = $4, updated_at = NOW()
         WHERE tournoi_id = $5 AND type = $6`,
        [m.equipeAId, m.equipeBId, m.status, m.winnerId, tournoiId, m.type]
      )
    }
  })
}

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
    // Fix faille : refus strict si tournoi_org_id absent
    if (!existingMatch.tournoi_org_id) {
      return apiError('Match orphelin : aucun tournoi associé', 500)
    }
    const { checkOrgAccess: checkOrgAccess2 } = await import('@/lib/middleware')
    const hasAccess2 = await checkOrgAccess2(user.id, existingMatch.tournoi_org_id)
    if (!hasAccess2) {
      return apiError('Accès refusé pour modifier ce match', 403)
    }

    // FIX SÉCURITÉ : whitelist des statuts. Avant, body.status était poussé tel
    // quel → on pouvait écrire n'importe quelle chaîne en base (pas de CHECK).
    const VALID_MATCH_STATUSES = ['a_jouer', 'en_cours', 'termine', 'en_attente_validation', 'valide']
    if (body.status !== undefined && !VALID_MATCH_STATUSES.includes(body.status)) {
      return apiError('Statut de match invalide', 400)
    }

    const updates: string[] = []
    const values: SQLValue[] = []
    let paramIndex = 1

    // Validation des scores (rejette null explicite et undefined)
    if (body.score_a !== undefined && body.score_a !== null) {
      if (!Number.isInteger(body.score_a) || body.score_a < 0) {
        return apiError('Le score de l\'équipe A doit être un nombre entier positif ou zéro', 400)
      }
      if (body.score_a > 50) {
        return apiError('Le score de l\'équipe A est trop élevé (maximum 50)', 400)
      }
      updates.push(`score_a = $${paramIndex++}`)
      values.push(body.score_a)
    }

    if (body.score_b !== undefined && body.score_b !== null) {
      if (!Number.isInteger(body.score_b) || body.score_b < 0) {
        return apiError('Le score de l\'équipe B doit être un nombre entier positif ou zéro', 400)
      }
      if (body.score_b > 50) {
        return apiError('Le score de l\'équipe B est trop élevé (maximum 50)', 400)
      }
      updates.push(`score_b = $${paramIndex++}`)
      values.push(body.score_b)
    }

    if (body.manches_json !== undefined) {
      // Validation des mènes - Règle de pétanque : une seule équipe marque par mène
      if (Array.isArray(body.manches_json)) {
        for (let i = 0; i < body.manches_json.length; i++) {
          const manche = body.manches_json[i]
          const scoreA = manche.scoreA || 0
          const scoreB = manche.scoreB || 0

          // Vérifier qu'une seule équipe marque par mène
          if (scoreA > 0 && scoreB > 0) {
            return apiError(
              `Mène ${i + 1} invalide (${scoreA}-${scoreB}). En pétanque, une seule équipe marque par mène.`,
              400
            )
          }

          // Mène 0-0 autorisée (cochonnet hors terrain, règle FIPJP)
        }
      }

      updates.push(`manches_json = $${paramIndex++}`)
      values.push(JSON.stringify(body.manches_json))
    }

    if (body.status !== undefined) {
      // Validation des règles de pétanque si le statut devient "termine"
      if (body.status === 'termine') {
        // 🔧 FIX: Scores peuvent être null en DB, utiliser 0 par défaut pour éviter NaN
        const scoreA = body.score_a !== undefined ? body.score_a : (existingMatch.score_a ?? 0)
        const scoreB = body.score_b !== undefined ? body.score_b : (existingMatch.score_b ?? 0)

        // Vérifier que les scores sont définis avant de terminer
        if (scoreA === 0 && scoreB === 0 && body.score_a === undefined && body.score_b === undefined) {
          return apiError('Impossible de terminer un match sans scores', 400)
        }

        // 🔧 FIX: Permettre les égalités SEULEMENT pour les matchs BYE (équipe_b null)
        const isByeMatch = existingMatch.type === 'bye' || !existingMatch.equipe_b_id

        // Récupérer les settings du tournoi
        const tournoiQuery = await query(
          'SELECT settings FROM tournois WHERE id = $1',
          [existingMatch.tournoi_id]
        )
        const settings = (tournoiQuery.rows[0]?.settings as any) || {}
        const maxPoints = settings.maxPoints || 13
        const timeLimit = settings.timeLimit || false

        // Source de vérité UNIQUE pour la validation de fin de match : validateScore.
        // isElimination = phase à élimination (élim simple OU double "de:*"), où le
        // meneur au temps limite gagne (pas d'égalité possible).
        const matchTypeStr = (existingMatch.type as string) || ''
        const isElimination =
          matchTypeStr.startsWith('de:') ||
          ['huitieme', 'quart', 'demi', 'finale', 'petite_finale'].includes(matchTypeStr)

        if (!isByeMatch) {
          const scoreCheck = validateScore(scoreA, scoreB, maxPoints, {
            allowTimeLimitEnd: timeLimit,
            isElimination,
          })
          if (!scoreCheck.valid) {
            return apiError(scoreCheck.error!, 400)
          }

          // Option (a) — conservateur : aucune égalité hors BYE (zéro régression vs prod).
          // validateScore tolère un nul en poule au temps limite ; on le refuse ici pour
          // préserver le comportement actuel. Passer en option (b) = retirer ce bloc.
          if (scoreA === scoreB) {
            return apiError('Un match de pétanque ne peut pas se terminer sur une égalité', 400)
          }
        }

        // Calculer automatiquement le winner_id basé sur les scores (ou équipe_a pour BYE)
        const calculatedWinnerId = isByeMatch
          ? existingMatch.equipe_a_id
          : (scoreA > scoreB ? existingMatch.equipe_a_id : existingMatch.equipe_b_id)
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

    // Le winner_id peut être calculé automatiquement pour un match terminé.
    // FIX SÉCURITÉ : valider qu'il correspond à l'une des deux équipes du match.
    // Avant, en envoyant winner_id SANS status='termine', on contournait le
    // contrôle croisé avec les scores et on pouvait affecter comme vainqueur une
    // équipe arbitraire (y compris d'un autre tournoi).
    if (body.winner_id !== undefined && body.winner_id !== null) {
      const validWinners = [existingMatch.equipe_a_id, existingMatch.equipe_b_id]
        .filter((v): v is string | number => v !== null && v !== undefined)
        .map(String)
      if (!validWinners.includes(String(body.winner_id))) {
        return apiError('Le vainqueur doit être l\'une des deux équipes du match', 400)
      }
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

    // Double élimination : si on vient de terminer un match "de:*", recalculer
    // et propager tout le bracket (le match courant inclus dans les résultats).
    if (body.status === 'termine' && parseDeType(existingMatch.type as string | null) !== null) {
      try {
        await advanceDoubleElimination(existingMatch.tournoi_id as string)
      } catch (e) {
        console.error('❌ Erreur avancement double élimination:', e)
      }
    }

    // Notifier les clients SSE connectés au tournoi
    emitTournamentEvent('match:updated', existingMatch.tournoi_id, {
      match_id: id,
      status: body.status
    })

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
    const { user } = authResult

    const { id } = await params

    // 🔧 FIX: Vérifier accès organisation avant suppression
    const match = await queryOne(
      `SELECT m.id, t.org_id as tournoi_org_id
       FROM matches m
       LEFT JOIN tournois t ON m.tournoi_id = t.id
       WHERE m.id = $1`,
      [id]
    )

    if (!match) {
      return apiError('Match introuvable', 404)
    }

    // Vérifier que l'utilisateur a accès à l'organisation
    if (match.tournoi_org_id) {
      const hasAccess = await queryOne(
        'SELECT 1 FROM user_roles WHERE user_id = $1 AND org_id = $2',
        [user.id, match.tournoi_org_id]
      )
      if (!hasAccess) {
        return apiError('Accès refusé à ce tournoi', 403)
      }
    }

    await query('DELETE FROM matches WHERE id = $1', [id])

    return apiSuccess({ message: 'Match supprimé avec succès' })
  } catch (error) {
    console.error('❌ Erreur DELETE /api/matches/[id]:', error)
    return apiError('Erreur lors de la suppression du match', 500)
  }
}
