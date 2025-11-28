/**
 * Hook pour la gestion des matchs d'un tournoi
 * - Génération des poules et matchs
 * - Phases éliminatoires
 * - Finales
 * - Assignation de terrains
 */

import { useCallback } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { ValidationService, BracketService, StatsService } from '@/lib/services'
import type { Match as MatchType } from '@/lib/types'
import type { Tournament, Team, Match } from './useTournamentData'

interface UseMatchActionsProps {
  tournament: Tournament | null
  teams: Team[]
  matches: Match[]
  loadTournamentData: () => Promise<void>
  getTeamPlayers: (teamId: string | null | undefined) => string[]
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
  onWarning?: (message: string) => void
  onConfirmTerrainConflict?: (message: string) => Promise<boolean>
}

interface UseMatchActionsReturn {
  // Validation helpers
  isValidPoolConfiguration: (teamCount: number, poolSize: number) => boolean
  getValidPoolSizes: (teamCount: number) => number[]
  getPoolDistribution: (teamCount: number, poolSize: number) => number[]

  // Actions
  generatePoules: () => Promise<void>
  generateEliminationPhases: () => Promise<void>
  generateFinales: () => Promise<void>
  assignTerrain: (matchId: string, terrain: number) => Promise<void>
  createRoundRobinMatches: (teams: Team[], tour: number, poule: string | null) => Promise<void>
}

export function useMatchActions({
  tournament,
  teams,
  matches,
  loadTournamentData,
  getTeamPlayers,
  onSuccess,
  onError,
  onWarning,
  onConfirmTerrainConflict
}: UseMatchActionsProps): UseMatchActionsReturn {
  const { organization } = useAuth()

  // Helpers pour notifications (fallback sur console si pas de callback)
  const notify = {
    success: (msg: string) => onSuccess ? onSuccess(msg) : console.log(msg),
    error: (msg: string) => onError ? onError(msg) : console.error(msg),
    warning: (msg: string) => onWarning ? onWarning(msg) : console.warn(msg)
  }

  /**
   * Valide si une configuration de poules est viable
   */
  const isValidPoolConfiguration = useCallback((teamCount: number, poolSize: number): boolean => {
    if (teamCount < 4 || poolSize < 3) return false

    const nbPoules = Math.ceil(teamCount / poolSize)
    const lastPouleSize = teamCount - (nbPoules - 1) * poolSize

    // La dernière poule doit avoir au moins 3 équipes
    return lastPouleSize >= 3
  }, [])

  /**
   * Retourne les tailles de poules valides pour un nombre d'équipes
   */
  const getValidPoolSizes = useCallback((teamCount: number): number[] => {
    const validSizes: number[] = []

    for (let size = 3; size <= 6; size++) {
      if (isValidPoolConfiguration(teamCount, size)) {
        validSizes.push(size)
      }
    }

    return validSizes
  }, [isValidPoolConfiguration])

  /**
   * Calcule la distribution des équipes dans les poules
   */
  const getPoolDistribution = useCallback((teamCount: number, poolSize: number): number[] => {
    const nbPoules = Math.ceil(teamCount / poolSize)
    const distribution: number[] = []

    for (let i = 0; i < nbPoules; i++) {
      const start = i * poolSize
      const end = Math.min((i + 1) * poolSize, teamCount)
      distribution.push(end - start)
    }

    return distribution
  }, [])

  /**
   * Crée des matchs round-robin (tous contre tous) pour un groupe d'équipes
   * Utilise l'API batch pour une création optimisée en une seule requête
   */
  const createRoundRobinMatches = useCallback(async (
    teamsToMatch: Team[],
    tour: number,
    poule: string | null
  ): Promise<void> => {
    if (!tournament) return

    // Construire la liste de tous les matchs à créer
    const matchesToCreate: Array<{
      tournoi_id: string
      equipe_a_id: string
      equipe_b_id: string
      tour: number
      terrain: null
      type: string
      poule: string | null
      status: string
    }> = []

    for (let i = 0; i < teamsToMatch.length; i++) {
      for (let j = i + 1; j < teamsToMatch.length; j++) {
        matchesToCreate.push({
          tournoi_id: tournament.id,
          equipe_a_id: teamsToMatch[i].id,
          equipe_b_id: teamsToMatch[j].id,
          tour,
          terrain: null,
          type: 'poule',
          poule,
          status: 'a_jouer'
        })
      }
    }

    // Créer tous les matchs en une seule requête batch
    if (matchesToCreate.length > 0) {
      try {
        const response = await fetch('/api/matches/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ matches: matchesToCreate })
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
          throw new Error(error.error || `Échec création matchs batch (${response.status})`)
        }
      } catch (error) {
        console.error(`Erreur création matchs batch pour poule ${poule}:`, error)
        throw error
      }
    }
  }, [tournament])

  /**
   * Génère les poules du tournoi
   */
  const generatePoules = useCallback(async () => {
    if (!tournament) {
      notify.error('Tournoi non trouvé')
      return
    }

    // Vérifier le nombre minimum d'équipes
    if (teams.length < 4) {
      notify.error(`Minimum 4 équipes requises pour créer des poules. Vous en avez ${teams.length}.`)
      return
    }

    // Vérifier si les poules ont déjà été créées
    if (tournament.settings.poules_created) {
      notify.error('Les poules ont déjà été générées pour ce tournoi. Supprimez les matchs existants pour régénérer.')
      return
    }

    // Vérifier qu'il n'y a pas déjà des matchs de poule
    const existingPouleMatches = matches.filter(m => m.type === 'poule')
    if (existingPouleMatches.length > 0) {
      notify.error('Des matchs de poule existent déjà. Supprimez-les avant de régénérer les poules.')
      return
    }

    // Vérifier que toutes les équipes ont des joueurs
    const emptyTeams = teams.filter(t => !t.joueur_ids || t.joueur_ids.length === 0)
    if (emptyTeams.length > 0) {
      const names = emptyTeams.map(t => t.name).join(', ')
      notify.error(`Les équipes suivantes n'ont pas de joueurs : ${names}`)
      return
    }

    // Vérifier le nombre de joueurs par équipe selon le format
    const playersPerTeam = tournament.format === 'tete_a_tete' ? 1 : tournament.format === 'doublette' ? 2 : 3
    const wrongSizeTeams = teams.filter(t => (t.joueur_ids?.length || 0) !== playersPerTeam)
    if (wrongSizeTeams.length > 0) {
      const names = wrongSizeTeams.map(t => `${t.name} (${t.joueur_ids?.length || 0} joueurs)`).join(', ')
      notify.error(`Format ${tournament.format} : chaque équipe doit avoir ${playersPerTeam} joueur(s). Équipes incorrectes : ${names}`)
      return
    }

    const pouleSize = tournament.settings.pouleSize || 4

    // Validation de la configuration avant génération
    if (!isValidPoolConfiguration(teams.length, pouleSize)) {
      notify.error(`Configuration invalide: ${teams.length} équipes en poules de ${pouleSize} créerait des poules déséquilibrées`)
      return
    }

    const nbPoules = Math.ceil(teams.length / pouleSize)

    // Mélanger les équipes avant de les répartir en poules (fairness)
    const shuffledTeams = [...teams].sort(() => Math.random() - 0.5)

    // Créer les poules
    const poules: { [key: string]: Team[] } = {}
    for (let i = 0; i < nbPoules; i++) {
      const pouleName = String.fromCharCode(65 + i) // A, B, C...
      poules[pouleName] = shuffledTeams.slice(i * pouleSize, (i + 1) * pouleSize)
    }

    // Générer les matchs de poule (round-robin)
    try {
      for (const [pouleName, pouleTeams] of Object.entries(poules)) {
        await createRoundRobinMatches(pouleTeams, 1, pouleName)
      }

      // Mettre à jour le flag poules_created
      await fetch(`/api/tournois/${tournament.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          settings: { ...tournament.settings, poules_created: true }
        })
      })

      // Recharger les données
      await loadTournamentData()
      notify.success(`${Object.keys(poules).length} poule(s) générée(s) avec succès !`)
    } catch (error) {
      console.error('Erreur génération poules:', error)
      notify.error('Erreur lors de la génération des poules')
    }
  }, [tournament, teams, matches, isValidPoolConfiguration, createRoundRobinMatches, loadTournamentData])

  /**
   * Génère les phases éliminatoires après les poules
   */
  const generateEliminationPhases = useCallback(async () => {
    if (!tournament) return

    // Vérifier que tous les matchs de poule sont terminés
    const pouleMatches = matches.filter(m => m.type === 'poule')
    const allPouleMatchesFinished = pouleMatches.every(m => m.status === 'termine')

    if (!allPouleMatchesFinished) {
      notify.warning('Tous les matchs de poule doivent être terminés avant de générer les phases finales')
      return
    }

    // Vérifier qu'il n'y a pas d'égalités (sauf si timeLimit activé)
    const timeLimit = tournament.settings.timeLimit || false
    const drawMatches = pouleMatches.filter(m => m.score_a === m.score_b && m.status === 'termine')

    if (drawMatches.length > 0 && !timeLimit) {
      const drawNames = drawMatches.map(m =>
        `${m.equipe_a?.name || 'Équipe A'} vs ${m.equipe_b?.name || 'Équipe B'} (${m.score_a}-${m.score_b})`
      ).join(', ')
      notify.error(`Impossible de générer les phases finales : ${drawMatches.length} match(s) avec égalité détecté(s) : ${drawNames}`)
      return
    }

    // Calculer le classement de chaque poule
    const qualifiedPerPoule = tournament.settings.qualifiedPerPoule || 2
    const pouleNames = [...new Set(pouleMatches.map(m => m.poule))]

    // Vérifier avec ValidationService qu'aucune poule n'a un nom null/undefined
    const pouleValidation = ValidationService.validatePouleNames(pouleNames as string[])
    if (!pouleValidation.valid) {
      console.error('❌ ERREUR : Poules sans nom détectées !', pouleNames.filter(p => !p))
      notify.error(pouleValidation.error || 'Erreur de validation des poules')
      return
    }

    const qualified: Array<{ team: Team; poule: string }> = []

    for (const pouleName of pouleNames) {
      if (!pouleName) continue

      // Équipes de cette poule
      const pouleTeamIds = new Set<string>()
      pouleMatches
        .filter(m => m.poule === pouleName)
        .forEach(m => {
          if (m.equipe_a_id) pouleTeamIds.add(m.equipe_a_id)
          if (m.equipe_b_id) pouleTeamIds.add(m.equipe_b_id)
        })

      const pouleTeams = teams.filter(t => pouleTeamIds.has(t.id))

      // Calculer stats pour chaque équipe avec StatsService
      const teamStatsForPoule = pouleTeams.map(team => {
        const teamPouleMatches = pouleMatches.filter(m =>
          m.poule === pouleName &&
          (m.equipe_a_id === team.id || m.equipe_b_id === team.id) &&
          m.status === 'termine'
        )

        const matchesForService = teamPouleMatches.map(m => ({
          id: m.id,
          tournoi_id: tournament?.id || '',
          equipe_a_id: m.equipe_a_id || null,
          equipe_b_id: m.equipe_b_id || null,
          equipe_a: m.equipe_a as any,
          equipe_b: m.equipe_b as any,
          score_a: m.score_a ?? null,
          score_b: m.score_b ?? null,
          tour: m.tour || 0,
          terrain: m.terrain ?? null,
          status: m.status as any,
          type: m.type as any,
          poule: m.poule || null,
          round: null,
          manches_json: m.manches_json || null,
          started_at: m.started_at || null,
          ended_at: m.ended_at || null,
          validated_at: m.validated_at || null,
          played_at: m.played_at || null,
          proposed_by: null,
          proposed_at: null,
          winner_id: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }))

        const stats = StatsService.calculateTeamStats(team.id, team.name, matchesForService as MatchType[])

        return {
          team,
          victories: stats.victories,
          difference: stats.difference,
          pointsFor: stats.pointsFor,
          stats
        }
      })

      // Trier avec StatsService.sortTeamsByFIPJPRules
      const rankings = StatsService.sortTeamsByFIPJPRules(
        teamStatsForPoule.map(t => ({
          id: t.team.id,
          name: t.team.name,
          played: t.stats.played,
          victories: t.stats.victories,
          defeats: t.stats.defeats,
          draws: t.stats.draws,
          pointsFor: t.stats.pointsFor,
          pointsAgainst: t.stats.pointsAgainst,
          difference: t.stats.difference,
          points: t.stats.points
        }))
      ).map(stats => teamStatsForPoule.find(t => t.team.id === stats.id))
        .filter((teamStat): teamStat is typeof teamStatsForPoule[number] => teamStat !== undefined)

      // Prendre les N premiers qualifiés
      qualified.push(...rankings.slice(0, qualifiedPerPoule).map(r => ({
        team: r.team,
        poule: pouleName
      })))
    }

    if (qualified.length === 0) {
      notify.warning('Aucune équipe qualifiée trouvée')
      return
    }

    // Seeding avec BracketService
    const nbQualifiedPerPoule = tournament.settings.qualifiedPerPoule || 2

    const reorderedTeamsData = BracketService.applySeedingByRank(
      qualified.map(q => ({
        id: q.team.id,
        name: q.team.name,
        poule: q.poule
      })),
      nbQualifiedPerPoule,
      pouleNames.length
    )

    const reorderedQualified: Team[] = reorderedTeamsData
      .map(data => qualified.find(q => q.team.id === data.id)?.team)
      .filter((team): team is Team => team !== undefined)

    try {
      // Utiliser BracketService pour déterminer la configuration du bracket
      const nbQualified = reorderedQualified.length

      // Validation minimum
      if (nbQualified < 2) {
        notify.error('Minimum 2 équipes qualifiées nécessaires pour les phases finales')
        return
      }

      const bracketConfig = BracketService.calculateBracketMatches(nbQualified)
      const { nbMatches, round: matchType, hasByes, nbByes } = bracketConfig

      // Créer le tableau des équipes avec les BYE bien placés
      // Les BYE sont attribués aux meilleures équipes (premiers indices après seeding)
      // Pour un bracket équilibré, on place les BYE en positions impaires à la fin
      const bracketSlots: (Team | null)[] = []
      let teamIdx = 0

      for (let i = 0; i < nbMatches * 2; i++) {
        if (teamIdx < reorderedQualified.length) {
          bracketSlots.push(reorderedQualified[teamIdx])
          teamIdx++
        } else {
          // Plus d'équipes disponibles → BYE
          bracketSlots.push(null)
        }
      }

      // Réorganiser pour placer les BYE contre les meilleures équipes
      // Les BYE doivent être en position B (indices impairs) des premiers matchs
      if (hasByes && nbByes > 0) {
        // Déplacer les BYE (null) vers les positions B des premiers matchs
        const teamsOnly = bracketSlots.filter(t => t !== null) as Team[]
        const reorganized: (Team | null)[] = []

        for (let i = 0; i < nbMatches; i++) {
          if (i < nbByes) {
            // Ce match a un BYE - l'équipe la mieux classée (début de teamsOnly) reçoit le BYE
            reorganized.push(teamsOnly.shift() || null)
            reorganized.push(null) // BYE
          } else {
            // Match normal
            reorganized.push(teamsOnly.shift() || null)
            reorganized.push(teamsOnly.shift() || null)
          }
        }

        // Remplacer bracketSlots par la version réorganisée
        bracketSlots.length = 0
        bracketSlots.push(...reorganized)
      }

      // Créer les matchs d'élimination
      let createdMatches = 0
      let createdByes = 0

      for (let i = 0; i < nbMatches; i++) {
        const equipe_a = bracketSlots[i * 2]
        const equipe_b = bracketSlots[i * 2 + 1]

        // Si pas d'équipe A, c'est une erreur de logique
        if (!equipe_a) {
          console.warn(`⚠️ Position ${i * 2} sans équipe - ignoré`)
          continue
        }

        // Match BYE si pas d'équipe B
        if (!equipe_b) {
          const byeResponse = await fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              tournoi_id: tournament.id,
              equipe_a_id: equipe_a.id,
              equipe_b_id: null,
              tour: 1,
              terrain: null,
              type: 'bye',
              status: 'termine',
              score_a: 0,
              score_b: 0
            })
          })
          if (!byeResponse.ok) {
            const error = await byeResponse.json().catch(() => ({ error: 'Erreur serveur' }))
            throw new Error(`Échec création match BYE: ${error.error}`)
          }
          createdByes++
        } else {
          const matchResponse = await fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              tournoi_id: tournament.id,
              equipe_a_id: equipe_a.id,
              equipe_b_id: equipe_b.id,
              tour: 1,
              terrain: null,
              type: matchType,
              status: 'a_jouer'
            })
          })
          if (!matchResponse.ok) {
            const error = await matchResponse.json().catch(() => ({ error: 'Erreur serveur' }))
            throw new Error(`Échec création match ${equipe_a.name} vs ${equipe_b.name}: ${error.error}`)
          }
          createdMatches++
        }
      }

      // Message de succès avec détails sur les BYE
      const byeInfo = createdByes > 0 ? ` (${createdByes} BYE${createdByes > 1 ? 's' : ''})` : ''
      notify.success(`Phases éliminatoires générées : ${createdMatches} match(s) de ${matchType}${byeInfo}`)
      await loadTournamentData()
    } catch (error) {
      console.error('Erreur génération phases finales:', error)
      notify.error('Erreur lors de la génération des phases finales')
    }
  }, [tournament, teams, matches, loadTournamentData, notify])

  /**
   * Génère la finale et petite finale après les demi-finales
   */
  const generateFinales = useCallback(async () => {
    if (!tournament) return

    const demiMatches = matches.filter(m => m.type === 'demi' && m.status === 'termine')

    if (demiMatches.length < 2) {
      notify.warning('Les deux demi-finales doivent être terminées')
      return
    }

    // Vérifier si finales déjà créées
    const finaleExists = matches.some(m => m.type === 'finale')
    const petiteFinaleExists = matches.some(m => m.type === 'petite_finale')

    if (finaleExists && petiteFinaleExists) {
      notify.warning('Les finales sont déjà créées')
      return
    }

    try {
      const winners: string[] = []
      const losers: string[] = []

      // Utiliser for...of pour permettre un early return propre
      for (const match of demiMatches) {
        if (match.score_a === match.score_b) {
          notify.error(`Égalité détectée dans ${match.equipe_a?.name} vs ${match.equipe_b?.name}. Impossible de créer la finale`)
          return // Early exit propre
        }

        if (!match.equipe_a_id || !match.equipe_b_id) {
          console.warn('⚠️ Match de demi avec équipe manquante, ignoré:', match)
          continue
        }

        if ((match.score_a ?? 0) > (match.score_b ?? 0)) {
          winners.push(match.equipe_a_id)
          losers.push(match.equipe_b_id)
        } else {
          winners.push(match.equipe_b_id)
          losers.push(match.equipe_a_id)
        }
      }

      // Créer la finale
      if (!finaleExists && winners.length === 2) {
        const finaleResponse = await fetch('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            tournoi_id: tournament.id,
            equipe_a_id: winners[0],
            equipe_b_id: winners[1],
            tour: 1,
            terrain: null,
            type: 'finale',
            status: 'a_jouer'
          })
        })
        if (!finaleResponse.ok) {
          const error = await finaleResponse.json().catch(() => ({ error: 'Erreur serveur' }))
          throw new Error(`Échec création finale: ${error.error}`)
        }
      }

      // Créer la petite finale seulement si consolante est activée
      if (!petiteFinaleExists && losers.length === 2 && tournament.settings.consolante) {
        const petiteFinaleResponse = await fetch('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            tournoi_id: tournament.id,
            equipe_a_id: losers[0],
            equipe_b_id: losers[1],
            tour: 1,
            terrain: null,
            type: 'petite_finale',
            status: 'a_jouer'
          })
        })
        if (!petiteFinaleResponse.ok) {
          const error = await petiteFinaleResponse.json().catch(() => ({ error: 'Erreur serveur' }))
          throw new Error(`Échec création petite finale: ${error.error}`)
        }
      }

      notify.success('Finale et petite finale générées avec succès !')
      await loadTournamentData()
    } catch (error) {
      console.error('Erreur génération finales:', error)
      notify.error('Erreur lors de la génération des finales')
    }
  }, [tournament, matches, loadTournamentData, notify])

  /**
   * Assigne un terrain à un match
   */
  const assignTerrain = useCallback(async (matchId: string, terrain: number) => {
    try {
      // Vérifier que le numéro de terrain est valide
      if (!tournament?.settings.terrains) {
        notify.error('Nombre de terrains non défini pour ce tournoi')
        return
      }

      const validation = ValidationService.validateTerrainNumber(terrain, tournament.settings.terrains)
      if (!validation.valid) {
        notify.error(validation.error || 'Numéro de terrain invalide')
        return
      }

      // Vérifier les conflits de terrain
      const matchToAssign = matches.find(m => m.id === matchId)
      if (!matchToAssign) return

      // Chercher des matchs EN COURS sur ce terrain (conflit bloquant)
      const activeConflicts = matches.filter(m =>
        m.id !== matchId &&
        m.terrain === terrain &&
        m.status === 'en_cours'
      )

      if (activeConflicts.length > 0) {
        const conflictNames = activeConflicts.map(m => {
          const teamADisplay = m.equipe_a?.name || 'Équipe A'
          const teamBDisplay = m.equipe_b?.name || 'Équipe B'
          return `${teamADisplay} vs ${teamBDisplay}`
        }).join(', ')

        notify.error(`Impossible : le terrain ${terrain} est occupé par un match en cours (${conflictNames})`)
        return
      }

      // Chercher des matchs À JOUER sur ce terrain (warning, pas bloquant)
      const pendingConflicts = matches.filter(m =>
        m.id !== matchId &&
        m.terrain === terrain &&
        m.status === 'a_jouer'
      )

      if (pendingConflicts.length > 0) {
        const conflictNames = pendingConflicts.map(m => {
          const playersA = getTeamPlayers(m.equipe_a_id || m.equipe_a?.id)
          const playersB = getTeamPlayers(m.equipe_b_id || m.equipe_b?.id)
          const teamADisplay = playersA.length > 0 ? `${m.equipe_a?.name} (${playersA.join(', ')})` : m.equipe_a?.name
          const teamBDisplay = playersB.length > 0 ? `${m.equipe_b?.name} (${playersB.join(', ')})` : m.equipe_b?.name
          return `${teamADisplay} vs ${teamBDisplay}`
        }).join(', ')

        // Demander confirmation uniquement pour les matchs non commencés
        const message = `Le terrain ${terrain} est déjà assigné à : ${conflictNames}. Réassigner quand même ?`
        const confirmed = onConfirmTerrainConflict
          ? await onConfirmTerrainConflict(message)
          : window.confirm(message)

        if (!confirmed) return
      }

      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ terrain })
      })

      if (response.ok) {
        await loadTournamentData()
      }
    } catch (error) {
      console.error('Erreur assignation terrain:', error)
    }
  }, [tournament, matches, getTeamPlayers, loadTournamentData])

  return {
    // Validation helpers
    isValidPoolConfiguration,
    getValidPoolSizes,
    getPoolDistribution,

    // Actions
    generatePoules,
    generateEliminationPhases,
    generateFinales,
    assignTerrain,
    createRoundRobinMatches
  }
}

export default useMatchActions
