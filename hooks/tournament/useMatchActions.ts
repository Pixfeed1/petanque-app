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
  getTeamPlayers
}: UseMatchActionsProps): UseMatchActionsReturn {
  const { organization } = useAuth()

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
   */
  const createRoundRobinMatches = useCallback(async (
    teamsToMatch: Team[],
    tour: number,
    poule: string | null
  ): Promise<void> => {
    if (!tournament) return

    for (let i = 0; i < teamsToMatch.length; i++) {
      for (let j = i + 1; j < teamsToMatch.length; j++) {
        try {
          const response = await fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              tournoi_id: tournament.id,
              equipe_a_id: teamsToMatch[i].id,
              equipe_b_id: teamsToMatch[j].id,
              tour,
              terrain: null,
              type: 'poule',
              poule,
              status: 'a_jouer'
            })
          })

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
            throw new Error(error.error || `Échec création match (${response.status})`)
          }
        } catch (error) {
          console.error(`Erreur création match ${teamsToMatch[i].name} vs ${teamsToMatch[j].name}:`, error)
          throw error
        }
      }
    }
  }, [tournament])

  /**
   * Génère les poules du tournoi
   */
  const generatePoules = useCallback(async () => {
    if (!tournament || teams.length === 0) return

    const pouleSize = tournament.settings.pouleSize || 4

    // Validation de la configuration avant génération
    if (!isValidPoolConfiguration(teams.length, pouleSize)) {
      alert(`❌ Configuration invalide\n\nLa répartition ${teams.length} équipes en poules de ${pouleSize} créerait des poules déséquilibrées.\n\nChaque poule doit avoir au minimum 3 équipes.`)
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

      // Recharger les données
      await loadTournamentData()
    } catch (error) {
      console.error('Erreur génération poules:', error)
    }
  }, [tournament, teams, isValidPoolConfiguration, createRoundRobinMatches, loadTournamentData])

  /**
   * Génère les phases éliminatoires après les poules
   */
  const generateEliminationPhases = useCallback(async () => {
    if (!tournament) return

    // Vérifier que tous les matchs de poule sont terminés
    const pouleMatches = matches.filter(m => m.type === 'poule')
    const allPouleMatchesFinished = pouleMatches.every(m => m.status === 'termine')

    if (!allPouleMatchesFinished) {
      alert('Tous les matchs de poule doivent être terminés avant de générer les phases finales.')
      return
    }

    // Calculer le classement de chaque poule
    const qualifiedPerPoule = tournament.settings.qualifiedPerPoule || 2
    const pouleNames = [...new Set(pouleMatches.map(m => m.poule))]

    // Vérifier avec ValidationService qu'aucune poule n'a un nom null/undefined
    const pouleValidation = ValidationService.validatePouleNames(pouleNames as string[])
    if (!pouleValidation.valid) {
      console.error('❌ ERREUR : Poules sans nom détectées !', pouleNames.filter(p => !p))
      alert(pouleValidation.error)
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
      alert('Aucune équipe qualifiée trouvée.')
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
      // Déterminer le nombre de matchs selon les qualifiés
      const nbQualified = reorderedQualified.length
      let matchType = 'finale'
      let nbMatches = 1

      if (nbQualified === 2) {
        matchType = 'finale'
        nbMatches = 1
      } else if (nbQualified === 4) {
        matchType = 'demi'
        nbMatches = 2
      } else if (nbQualified === 8) {
        matchType = 'quart'
        nbMatches = 4
      } else if (nbQualified === 16) {
        matchType = 'huitieme'
        nbMatches = 8
      } else {
        const nextPower = Math.pow(2, Math.ceil(Math.log2(nbQualified)))
        if (nextPower === 16) {
          matchType = 'huitieme'
          nbMatches = 8
        } else if (nextPower === 8) {
          matchType = 'quart'
          nbMatches = 4
        } else if (nextPower === 4) {
          matchType = 'demi'
          nbMatches = 2
        } else {
          matchType = 'finale'
          nbMatches = 1
        }
      }

      // Créer les matchs d'élimination
      for (let i = 0; i < nbMatches; i++) {
        const equipe_a = reorderedQualified[i * 2]
        const equipe_b = reorderedQualified[i * 2 + 1]

        if (!equipe_a) break

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
        }
      }

      alert(`Phases éliminatoires générées : ${nbMatches} match(s) de ${matchType}`)
      await loadTournamentData()
    } catch (error) {
      console.error('Erreur génération phases finales:', error)
      alert('Erreur lors de la génération des phases finales')
    }
  }, [tournament, teams, matches, loadTournamentData])

  /**
   * Génère la finale et petite finale après les demi-finales
   */
  const generateFinales = useCallback(async () => {
    if (!tournament) return

    const demiMatches = matches.filter(m => m.type === 'demi' && m.status === 'termine')

    if (demiMatches.length < 2) {
      alert('Les deux demi-finales doivent être terminées.')
      return
    }

    // Vérifier si finales déjà créées
    const finaleExists = matches.some(m => m.type === 'finale')
    const petiteFinaleExists = matches.some(m => m.type === 'petite_finale')

    if (finaleExists && petiteFinaleExists) {
      alert('Les finales sont déjà créées.')
      return
    }

    try {
      const winners: string[] = []
      const losers: string[] = []

      // Utiliser for...of pour permettre un early return propre
      for (const match of demiMatches) {
        if (match.score_a === match.score_b) {
          alert(`⚠️ Égalité détectée dans ${match.equipe_a?.name} vs ${match.equipe_b?.name}. Impossible de créer la finale.`)
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

      alert('Finale et petite finale générées avec succès !')
      await loadTournamentData()
    } catch (error) {
      console.error('Erreur génération finales:', error)
      alert('Erreur lors de la génération des finales')
    }
  }, [tournament, matches, loadTournamentData])

  /**
   * Assigne un terrain à un match
   */
  const assignTerrain = useCallback(async (matchId: string, terrain: number) => {
    try {
      // Vérifier que le numéro de terrain est valide
      if (!tournament?.settings.terrains) {
        alert('❌ Erreur : Nombre de terrains non défini pour ce tournoi.')
        return
      }

      const validation = ValidationService.validateTerrainNumber(terrain, tournament.settings.terrains)
      if (!validation.valid) {
        alert(validation.error)
        return
      }

      // Vérifier les conflits de terrain
      const matchToAssign = matches.find(m => m.id === matchId)
      if (!matchToAssign) return

      // Chercher des matchs en cours ou à jouer sur ce terrain
      const conflicts = matches.filter(m =>
        m.id !== matchId &&
        m.terrain === terrain &&
        (m.status === 'en_cours' || m.status === 'a_jouer')
      )

      if (conflicts.length > 0) {
        const conflictNames = conflicts.map(m => {
          const playersA = getTeamPlayers(m.equipe_a_id || m.equipe_a?.id)
          const playersB = getTeamPlayers(m.equipe_b_id || m.equipe_b?.id)
          const teamADisplay = playersA.length > 0 ? `${m.equipe_a?.name} (${playersA.join(', ')})` : m.equipe_a?.name
          const teamBDisplay = playersB.length > 0 ? `${m.equipe_b?.name} (${playersB.join(', ')})` : m.equipe_b?.name
          return `${teamADisplay} vs ${teamBDisplay}`
        }).join('\n')

        const confirm = window.confirm(
          `⚠️ CONFLIT DE TERRAIN !\n\n` +
          `Le terrain ${terrain} est déjà assigné à :\n${conflictNames}\n\n` +
          `Voulez-vous quand même assigner ce terrain ?`
        )

        if (!confirm) return
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
