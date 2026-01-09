// app/api/equipes/batch/route.ts
// API pour créer plusieurs équipes en une seule requête
// 🔧 FIX: Ajout de TOUTES les validations (aligné avec API simple)

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { query, queryOne, queryMany } from '@/lib/db'

interface TeamInput {
  tournoi_id: string
  name: string
  joueur_ids: string[]
  stats?: Record<string, unknown>
}

// POST - Créer plusieurs équipes en une seule requête
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const body = await request.json()
    const { teams } = body as { teams: TeamInput[] }

    // Validation de base
    if (!Array.isArray(teams) || teams.length === 0) {
      return apiError('teams doit être un tableau non-vide', 400)
    }

    if (teams.length > 100) {
      return apiError('Maximum 100 équipes par requête', 400)
    }

    // Valider que toutes les équipes ont le même tournoi_id
    const tournoiId = teams[0].tournoi_id
    if (!tournoiId) {
      return apiError('tournoi_id est requis', 400)
    }

    const allSameTournoi = teams.every(t => t.tournoi_id === tournoiId)
    if (!allSameTournoi) {
      return apiError('Toutes les équipes doivent appartenir au même tournoi', 400)
    }

    // 🔧 FIX: Récupérer le tournoi avec format, mode et status
    const tournoi = await queryOne<{ org_id: number; format: string; mode: string; status: string }>(
      'SELECT org_id, format, mode, status FROM tournois WHERE id = $1',
      [tournoiId]
    )

    if (!tournoi) {
      return apiError('Tournoi non trouvé', 404)
    }

    const hasAccess = await checkOrgAccess(user.id, String(tournoi.org_id))
    if (!hasAccess) {
      return apiError('Accès non autorisé à ce tournoi', 403)
    }

    // 🔧 FIX: Vérifier que le tournoi est en préparation
    // Exception: en mêlée tournante, on peut créer des équipes en cours (rotation)
    if (tournoi.status !== 'preparation' && tournoi.mode !== 'melee_tournante') {
      return apiError('Impossible de créer des équipes après le démarrage du tournoi', 400)
    }

    // 🔧 FIX: Valider le format du tournoi
    const validFormats = ['tete_a_tete', 'doublette', 'triplette']
    if (!validFormats.includes(tournoi.format)) {
      return apiError(`Format de tournoi invalide: ${tournoi.format}`, 400)
    }

    // 🔧 FIX: Calculer le nombre de joueurs requis par équipe
    const playersPerTeam = tournoi.format === 'tete_a_tete' ? 1 : tournoi.format === 'doublette' ? 2 : 3

    // Collecter tous les joueur_ids pour validation globale
    const allPlayerIds: string[] = []
    const playerIdsByTeam: Map<number, Set<string>> = new Map()

    // Valider chaque équipe
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i]

      // 🔧 FIX: Validation du nom
      if (!team.name || !team.name.trim()) {
        return apiError(`Équipe ${i + 1}: name est requis`, 400)
      }
      if (team.name.trim().length > 50) {
        return apiError(`Équipe ${i + 1}: nom trop long (maximum 50 caractères)`, 400)
      }

      const joueurIds = Array.isArray(team.joueur_ids) ? team.joueur_ids : []

      // 🔧 FIX: Validation du nombre de joueurs selon le format
      if (joueurIds.length !== playersPerTeam) {
        return apiError(
          `Équipe ${i + 1} "${team.name}": le format ${tournoi.format} nécessite exactement ${playersPerTeam} joueur(s). Fourni: ${joueurIds.length}`,
          400
        )
      }

      // 🔧 FIX: Vérifier qu'il n'y a pas de doublons dans cette équipe
      const uniqueIds = new Set(joueurIds.map(String))
      if (uniqueIds.size !== joueurIds.length) {
        return apiError(`Équipe ${i + 1} "${team.name}": un joueur ne peut pas apparaître plusieurs fois`, 400)
      }

      playerIdsByTeam.set(i, uniqueIds)

      // Ajouter à la liste globale pour vérification cross-équipes
      joueurIds.forEach(id => allPlayerIds.push(String(id)))
    }

    // 🔧 FIX: Vérifier les doublons ENTRE les équipes du batch
    const globalPlayerSet = new Set<string>()
    for (let i = 0; i < teams.length; i++) {
      const teamPlayerIds = playerIdsByTeam.get(i)!
      for (const playerId of teamPlayerIds) {
        if (globalPlayerSet.has(playerId)) {
          return apiError(
            `Joueur ID ${playerId} est assigné à plusieurs équipes dans cette requête`,
            400
          )
        }
        globalPlayerSet.add(playerId)
      }
    }

    // 🔧 FIX: Vérifier que tous les joueurs existent en base de données
    if (allPlayerIds.length > 0) {
      const existingPlayers = await queryMany<{ id: string }>(
        'SELECT id FROM joueurs WHERE id = ANY($1::bigint[])',
        [allPlayerIds]
      )

      if (existingPlayers.length !== globalPlayerSet.size) {
        const existingIds = new Set(existingPlayers.map(p => String(p.id)))
        const missingIds = Array.from(globalPlayerSet).filter(id => !existingIds.has(id))
        return apiError(`Joueur(s) introuvable(s): ${missingIds.join(', ')}`, 400)
      }
    }

    // 🔧 FIX: Vérifier qu'aucun joueur n'est déjà dans une autre équipe de ce tournoi
    if (allPlayerIds.length > 0) {
      const existingTeamsWithPlayers = await queryMany<{ id: string; name: string; joueur_ids: string[] }>(
        `SELECT id, name, joueur_ids FROM equipes WHERE tournoi_id = $1`,
        [tournoiId]
      )

      const alreadyAssigned: { playerId: string; teamName: string }[] = []
      for (const existingTeam of existingTeamsWithPlayers) {
        const existingPlayerIds = (existingTeam.joueur_ids || []).map(String)
        for (const playerId of allPlayerIds) {
          if (existingPlayerIds.includes(String(playerId))) {
            alreadyAssigned.push({ playerId: String(playerId), teamName: existingTeam.name })
          }
        }
      }

      if (alreadyAssigned.length > 0) {
        const details = alreadyAssigned
          .map(a => `Joueur ${a.playerId} déjà dans "${a.teamName}"`)
          .join(', ')
        return apiError(`Conflit de joueurs: ${details}`, 400)
      }
    }

    // 🔧 FIX: Vérifier les noms d'équipes en doublon dans le batch
    const teamNames = new Set<string>()
    for (let i = 0; i < teams.length; i++) {
      const normalizedName = teams[i].name.trim().toLowerCase()
      if (teamNames.has(normalizedName)) {
        return apiError(`Nom d'équipe en doublon dans le batch: "${teams[i].name}"`, 400)
      }
      teamNames.add(normalizedName)
    }

    // 🔧 FIX: Vérifier les noms contre les équipes EXISTANTES dans le tournoi
    const existingTeamNames = await queryMany<{ name: string }>(
      'SELECT LOWER(TRIM(name)) as name FROM equipes WHERE tournoi_id = $1',
      [tournoiId]
    )
    const existingNamesSet = new Set(existingTeamNames.map(t => t.name))

    for (let i = 0; i < teams.length; i++) {
      const normalizedName = teams[i].name.trim().toLowerCase()
      if (existingNamesSet.has(normalizedName)) {
        return apiError(`Une équipe nommée "${teams[i].name}" existe déjà dans ce tournoi`, 400)
      }
    }

    // Construire la requête d'insertion en masse
    const values: (string | string[] | Record<string, unknown>)[] = []
    const valueStrings: string[] = []

    teams.forEach((team, i) => {
      const baseIndex = i * 4
      valueStrings.push(
        `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}::bigint[], $${baseIndex + 4}::jsonb, NOW())`
      )
      values.push(
        team.tournoi_id,
        team.name.trim(),
        Array.isArray(team.joueur_ids) ? team.joueur_ids : [],
        JSON.stringify(team.stats || {})
      )
    })

    const insertQuery = `
      INSERT INTO equipes (tournoi_id, name, joueur_ids, stats, created_at)
      VALUES ${valueStrings.join(', ')}
      RETURNING *
    `

    const result = await query(insertQuery, values)

    return apiSuccess({
      created: result.rows.length,
      teams: result.rows
    }, 201)
  } catch (error) {
    console.error('❌ Erreur POST /api/equipes/batch:', error)
    return apiError('Erreur lors de la création des équipes', 500)
  }
}
