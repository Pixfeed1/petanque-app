// app/api/equipes/route.ts
// API pour gérer les équipes

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { queryMany, query, queryOne } from '@/lib/db'

// GET - Récupérer les équipes d'un tournoi
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const { searchParams } = new URL(request.url)
    const tournoiId = searchParams.get('tournoi_id')

    if (!tournoiId) {
      return apiError('tournoi_id est requis', 400)
    }

    // Vérifier que le tournoi existe et que l'utilisateur a accès à son organisation
    const tournoi = await queryOne<{ org_id: number }>(
      'SELECT org_id FROM tournois WHERE id = $1',
      [tournoiId]
    )

    if (!tournoi) {
      return apiError('Tournoi non trouvé', 404)
    }

    const hasAccess = await checkOrgAccess(user.id, String(tournoi.org_id))
    if (!hasAccess) {
      return apiError('Accès non autorisé à ce tournoi', 403)
    }

    const equipes = await queryMany(
      `SELECT e.*,
              COALESCE(
                json_agg(
                  json_build_object(
                    'id', j.id,
                    'name', j.name,
                    'email', j.email,
                    'phone', j.phone,
                    'stats', j.stats
                  ) ORDER BY j.name
                ) FILTER (WHERE j.id IS NOT NULL),
                '[]'::json
              ) as joueurs
       FROM equipes e
       LEFT JOIN LATERAL unnest(e.joueur_ids) WITH ORDINALITY AS jid(id, ord) ON true
       LEFT JOIN joueurs j ON j.id = jid.id
       WHERE e.tournoi_id = $1
       GROUP BY e.id
       ORDER BY e.name`,
      [tournoiId]
    )

    return apiSuccess(equipes)
  } catch (error) {
    console.error('❌ Erreur GET /api/equipes:', error)
    return apiError('Erreur lors de la récupération des équipes', 500)
  }
}

// POST - Créer une nouvelle équipe
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const body = await request.json()
    const { tournoi_id, name, joueur_ids, stats } = body

    if (!tournoi_id || !name) {
      return apiError('Champs requis: tournoi_id, name', 400)
    }

    // Vérifier accès au tournoi et récupérer le format + statut
    const tournoi = await queryOne<{ org_id: number; format: string; mode: string; status: string }>(
      'SELECT org_id, format, mode, status FROM tournois WHERE id = $1',
      [tournoi_id]
    )

    if (!tournoi) {
      return apiError('Tournoi non trouvé', 404)
    }

    const hasAccess = await checkOrgAccess(user.id, String(tournoi.org_id))
    if (!hasAccess) {
      return apiError('Accès non autorisé à ce tournoi', 403)
    }

    // Vérifier que le tournoi est en préparation
    if (tournoi.status !== 'preparation') {
      return apiError('Impossible de créer une équipe après le démarrage du tournoi', 400)
    }

    // 🔧 FIX: Validation du nom (longueur)
    if (typeof name !== 'string' || name.trim().length === 0) {
      return apiError('Le nom de l\'équipe ne peut pas être vide', 400)
    }
    if (name.trim().length > 50) {
      return apiError('Le nom de l\'équipe est trop long (maximum 50 caractères)', 400)
    }

    // 🔧 FIX: Vérifier unicité du nom dans le tournoi
    const existingTeamWithName = await queryOne(
      'SELECT id FROM equipes WHERE tournoi_id = $1 AND LOWER(name) = LOWER($2)',
      [tournoi_id, name.trim()]
    )
    if (existingTeamWithName) {
      return apiError(`Une équipe nommée "${name}" existe déjà dans ce tournoi`, 400)
    }

    // Validation du format du tournoi
    const validFormats = ['tete_a_tete', 'doublette', 'triplette']
    if (!validFormats.includes(tournoi.format)) {
      return apiError(`Format de tournoi invalide: ${tournoi.format}`, 400)
    }

    // Validation du nombre de joueurs selon le format du tournoi
    const playersPerTeam = tournoi.format === 'tete_a_tete' ? 1 : tournoi.format === 'doublette' ? 2 : 3
    const playerCount = Array.isArray(joueur_ids) ? joueur_ids.length : 0

    if (playerCount !== playersPerTeam) {
      return apiError(
        `Le format ${tournoi.format} nécessite exactement ${playersPerTeam} joueur(s) par équipe. Vous en avez fourni ${playerCount}.`,
        400
      )
    }

    // Vérifier qu'il n'y a pas de doublons dans la liste des joueurs
    if (Array.isArray(joueur_ids) && joueur_ids.length > 0) {
      const uniqueIds = new Set(joueur_ids.map(String))
      if (uniqueIds.size !== joueur_ids.length) {
        return apiError('Un même joueur ne peut pas apparaître plusieurs fois dans la même équipe', 400)
      }

      // Vérifier que tous les joueurs existent en base de données
      const existingPlayers = await queryMany<{ id: string }>(
        'SELECT id FROM joueurs WHERE id = ANY($1::bigint[])',
        [joueur_ids]
      )
      if (existingPlayers.length !== joueur_ids.length) {
        const existingIds = new Set(existingPlayers.map(p => String(p.id)))
        const missingIds = joueur_ids.filter(id => !existingIds.has(String(id)))
        return apiError(`Joueur(s) introuvable(s): ${missingIds.join(', ')}`, 400)
      }
    }

    // Vérifier qu'aucun joueur n'est déjà dans une autre équipe de ce tournoi
    if (Array.isArray(joueur_ids) && joueur_ids.length > 0) {
      const existingTeamsWithPlayers = await queryMany(
        `SELECT e.id, e.name, e.joueur_ids
         FROM equipes e
         WHERE e.tournoi_id = $1`,
        [tournoi_id]
      )

      const alreadyAssigned: { playerId: string; teamName: string }[] = []
      for (const team of existingTeamsWithPlayers) {
        const teamJoueurIds = team.joueur_ids || []
        for (const playerId of joueur_ids) {
          if (teamJoueurIds.includes(Number(playerId)) || teamJoueurIds.includes(String(playerId))) {
            alreadyAssigned.push({ playerId: String(playerId), teamName: team.name })
          }
        }
      }

      if (alreadyAssigned.length > 0) {
        const details = alreadyAssigned
          .map(a => `Joueur ID ${a.playerId} est déjà dans l'équipe "${a.teamName}"`)
          .join(', ')
        return apiError(`Un ou plusieurs joueurs sont déjà assignés à une équipe : ${details}`, 400)
      }
    }

    const result = await query(
      `INSERT INTO equipes (tournoi_id, name, joueur_ids, stats, created_at)
       VALUES ($1, $2, $3::bigint[], $4::jsonb, NOW())
       RETURNING *`,
      [
        tournoi_id,
        name,
        Array.isArray(joueur_ids) ? joueur_ids : [],
        JSON.stringify(stats || {})
      ]
    )

    return apiSuccess(result.rows[0], 201)
  } catch (error) {
    console.error('❌ Erreur POST /api/equipes:', error)
    return apiError('Erreur lors de la création de l\'équipe', 500)
  }
}
