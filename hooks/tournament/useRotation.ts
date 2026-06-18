/**
 * Hook pour la gestion de la rotation en mêlée tournante
 * - Création de nouvelles équipes avec mélange
 * - Génération des matchs de rotation
 * - Gestion des tours
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { MixiteService } from '@/lib/services/mixite.service'
import { TirageService } from '@/lib/services'
import type { Joueur } from '@/lib/types'
import type { Tournament, Team, Match } from './useTournamentData'

interface UseRotationProps {
  tournament: Tournament | null
  teams: Team[]
  matches: Match[]
  loadTournamentData: () => Promise<void>
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
  onWarning?: (message: string) => void
}

interface UseRotationReturn {
  // States
  currentRotation: number
  setCurrentRotation: React.Dispatch<React.SetStateAction<number>>
  isRotationAvailable: boolean

  // Actions
  reformTeamsForRotation: () => Promise<void>
}

export function useRotation({
  tournament,
  teams,
  matches,
  loadTournamentData,
  onSuccess,
  onError,
  onWarning
}: UseRotationProps): UseRotationReturn {
  const { organization } = useAuth()

  // Système de notification avec fallback
  const notify = {
    success: (msg: string) => onSuccess ? onSuccess(msg) : console.log(msg),
    error: (msg: string) => onError ? onError(msg) : console.error(msg),
    warning: (msg: string) => onWarning ? onWarning(msg) : console.warn(msg)
  }

  const [currentRotation, setCurrentRotation] = useState(1)

  // Recalculer currentRotation depuis les données existantes au chargement
  useEffect(() => {
    if (!tournament || tournament.mode !== 'melee_tournante') return

    // Priorité 1 : tournament.settings.current_round
    if (tournament.settings.current_round && tournament.settings.current_round > 1) {
      setCurrentRotation(tournament.settings.current_round)
      return
    }

    // Priorité 2 : extraire le numéro de rotation le plus élevé des noms d'équipes (R{n}-...)
    let maxRotation = 1
    for (const team of teams) {
      const match = team.name.match(/^R(\d+)-/)
      if (match) {
        const rotNum = parseInt(match[1], 10)
        if (rotNum > maxRotation) maxRotation = rotNum
      }
    }

    // Priorité 3 : tour le plus élevé dans les matchs
    for (const m of matches) {
      if (m.tour > maxRotation) maxRotation = m.tour
    }

    if (maxRotation !== currentRotation) {
      setCurrentRotation(maxRotation)
    }
  }, [tournament, teams, matches])

  /**
   * Vérifie si la rotation est disponible (tous les matchs terminés selon le mode)
   */
  const isRotationAvailable = useMemo(() => {
    if (tournament?.mode !== 'melee_tournante') return false

    const rotationType = tournament.settings.meleeRotation || 'par_tour'
    const currentRotationMatches = matches.filter(m => m.tour === currentRotation)

    if (currentRotationMatches.length === 0) return false

    if (rotationType === 'par_match') {
      // Mode par_match : besoin d'au moins 1 match terminé
      return currentRotationMatches.some(m => m.status === 'termine')
    } else {
      // Mode par_tour : besoin que TOUS les matchs soient terminés
      return currentRotationMatches.every(m => m.status === 'termine')
    }
  }, [tournament, matches, currentRotation])

  /**
   * Crée de nouvelles équipes avec anti-rematch et mixité
   * Utilise l'historique des rotations précédentes pour minimiser les doublons
   */
  // Fix Bug #4 : calcule les équipes en mémoire (sans POST), retourne le tableau
  const buildNewTeams = useCallback(async (): Promise<Array<{ name: string; joueur_ids: string[] }> | null> => {
    if (!organization || !tournament?.settings.players) return null

    try {
      const joueursResponse = await fetch(`/api/joueurs?org_id=${organization.id}`, {
        credentials: 'include'
      })
      if (!joueursResponse.ok) return null

      const data = await joueursResponse.json()
      const allPlayers = Array.isArray(data) ? data : data.joueurs || []
      const players = allPlayers.filter((p: Joueur) =>
        tournament.settings.players.includes(p.id)
      )
      if (players.length === 0) return null

      const isTeteATete = tournament.format === 'tete_a_tete'
      const teamSize = isTeteATete ? 1 : (tournament.format === 'doublette' ? 2 : 3)
      const newRotation = currentRotation + 1
      let teamNumber = 1

      let teamCompositions: Array<{ joueur_ids: string[] }>

      const isFirstRotation = currentRotation === 1 && teams.filter(t => t.name.startsWith('R')).length === 0
      const needsMixite = tournament.settings.mixiteObligatoire || false

      if (isTeteATete) {
        // Tête-à-tête : 1 joueur = 1 équipe, identité STABLE entre rotations.
        // Ordre = settings.players, pour que rotation r corresponde à la ronde de Berger r
        // (chaque joueur affronte un nouvel adversaire, sans répétition).
        const order = tournament.settings.players
        const sortedPlayers = [...players].sort(
          (a: Joueur, b: Joueur) => order.indexOf(a.id) - order.indexOf(b.id)
        )
        teamCompositions = sortedPlayers.map((p: Joueur) => ({ joueur_ids: [p.id] }))
      } else if (isFirstRotation || needsMixite) {
        if (needsMixite) {
          const genderValidation = MixiteService.validatePlayerGenders(players, true)
          if (!genderValidation.valid) {
            notify.error(genderValidation.error || 'Certains joueurs n\'ont pas de genre défini')
            return null
          }
        }

        const mixiteResult = MixiteService.createTeamsWithMixite(
          players,
          teamSize as 2 | 3,
          needsMixite
        )
        teamCompositions = mixiteResult.teams

        if (mixiteResult.unassignedPlayerIds.length > 0) {
          console.warn(`${mixiteResult.unassignedPlayerIds.length} joueur(s) non assigné(s):`, mixiteResult.warnings)
        }
      } else {
        const previousTeams = teams
          .filter(t => t.name.match(/^R\d+-/))
          .map(t => ({ joueur_ids: t.joueur_ids || [] }))
          .filter(t => t.joueur_ids.length > 0)

        const previousMatches: Array<{ equipe_a_joueur_ids: string[]; equipe_b_joueur_ids: string[] }> = []
        for (const match of matches) {
          if (!match.equipe_a_id || !match.equipe_b_id) continue
          const teamA = teams.find(t => t.id === match.equipe_a_id)
          const teamB = teams.find(t => t.id === match.equipe_b_id)
          if (teamA?.joueur_ids?.length && teamB?.joueur_ids?.length) {
            previousMatches.push({
              equipe_a_joueur_ids: teamA.joueur_ids,
              equipe_b_joueur_ids: teamB.joueur_ids
            })
          }
        }

        // Équité de l'exempt : reconstituer, ronde par ronde, les joueurs qui
        // n'étaient dans aucune équipe (donc au repos) afin de faire tourner le repos.
        const rosterIds = players.map((p: Joueur) => p.id)
        const idsByRound = new Map<number, Set<string>>()
        for (const t of teams) {
          const rm = t.name.match(/^R(\d+)-/)
          if (!rm) continue
          const r = parseInt(rm[1], 10)
          if (!idsByRound.has(r)) idsByRound.set(r, new Set())
          for (const id of (t.joueur_ids || [])) idsByRound.get(r)!.add(id)
        }
        const previousExempt: string[] = []
        for (const idsInRound of idsByRound.values()) {
          for (const id of rosterIds) {
            if (!idsInRound.has(id)) previousExempt.push(id)
          }
        }

        const { teams: newCompositions, exempt } = TirageService.antiRematchTeamFormation(
          players.map((p: Joueur) => ({ id: p.id, gender: p.gender as 'H' | 'F' | undefined })),
          previousTeams,
          previousMatches,
          teamSize as 2 | 3,
          previousExempt
        )
        teamCompositions = newCompositions

        if (exempt.length > 0) {
          const exemptNames = exempt.map(
            id => players.find((p: Joueur) => p.id === id)?.name || id
          )
          notify.warning(`${exempt.length} joueur(s) au repos cette ronde : ${exemptNames.join(', ')}`)
        }
      }

      return teamCompositions.map(team => ({
        name: `R${newRotation}-Équipe ${teamNumber++}`,
        joueur_ids: team.joueur_ids
      }))
    } catch (error) {
      console.error('Erreur calcul équipes:', error)
      return null
    }
  }, [organization, tournament, teams, matches, currentRotation])

  /**
   * Crée les matchs round-robin pour les équipes du tour de rotation
   */
  // Fix Bug #4 : calcule les matchs en mémoire avec team_a_index (référence par index, pas UUID)
  const buildMatchesForRotation = useCallback((
    rotationNumber: number,
    newTeams: Array<{ name: string; joueur_ids: string[] }>
  ): Array<{
    tour: number
    terrain: number | null
    team_a_index: number
    team_b_index: number | null
    type: string
    poule: string | null
    status: string
  }> => {
    if (!tournament || newTeams.length === 0) return []

    // Équipes virtuelles avec id = index (le serveur résoudra en UUID après création)
    const virtualTeams = newTeams.map((t, idx) => ({
      id: String(idx),
      name: t.name
    }))

    // Tête-à-tête : une rotation = UNE ronde de Berger (chaque joueur un nouvel adversaire).
    // Doublette/triplette : round-robin complet sur les équipes rebrassées (comportement existant).
    const bergerMatches = tournament.format === 'tete_a_tete'
      ? TirageService.bergerRoundForRotation(virtualTeams, rotationNumber)
      : TirageService.generateBergerMatches(virtualTeams, null)

    const terrains = tournament.settings.terrains || 0
    let terrainMap: Map<string, number> | null = null
    if (terrains > 0) {
      const matchesForTerrain = bergerMatches.map((m, idx) => ({
        id: `rot_${idx}`,
        equipe_a_id: m.teamA.id,
        equipe_b_id: m.teamB.id,
        tour: m.tour
      }))
      terrainMap = TirageService.smartTerrainAssignment(matchesForTerrain, terrains)
    }

    return bergerMatches.map((m, idx) => ({
      tour: rotationNumber,
      terrain: terrainMap?.get(`rot_${idx}`) || null,
      team_a_index: parseInt(m.teamA.id, 10),
      team_b_index: parseInt(m.teamB.id, 10),
      type: 'poule',
      poule: null,
      status: 'a_jouer'
    }))
  }, [tournament])

  /**
   * Reformule les équipes pour une nouvelle rotation
   */
  const reformTeamsForRotation = useCallback(async () => {
    if (tournament?.mode !== 'melee_tournante') return
    if (!tournament?.settings.players) return

    const rotationType = tournament.settings.meleeRotation || 'par_tour'

    // Vérifier si les équipes pour le prochain tour existent déjà
    const nextRotation = currentRotation + 1
    const nextRotationTeams = teams.filter(t => t.name.startsWith(`R${nextRotation}-`))
    if (nextRotationTeams.length > 0) {
      notify.warning(`Les équipes pour la rotation ${nextRotation} existent déjà. Impossible de créer une nouvelle rotation.`)
      return
    }

    if (rotationType === 'par_match') {
      // Vérifier qu'au moins 1 match est terminé
      const currentRotationMatches = matches.filter(m => m.tour === currentRotation)

      if (currentRotationMatches.length === 0) {
        notify.warning('Aucun match trouvé pour le tour actuel. Créez d\'abord des matchs avant de faire une rotation.')
        return
      }

      const hasFinishedMatch = currentRotationMatches.some(m => m.status === 'termine')

      if (!hasFinishedMatch) {
        notify.warning('Mode rotation par match: Au moins 1 match doit être terminé avant de pouvoir créer une nouvelle rotation.')
        return
      }
    } else {
      // Vérifier que TOUS les matchs sont terminés
      const allMatchesOfCurrentTour = matches.filter(m => m.tour === currentRotation)

      if (allMatchesOfCurrentTour.length === 0) {
        notify.warning('Aucun match trouvé pour le tour actuel. Créez d\'abord des matchs avant de faire une rotation.')
        return
      }

      const allFinished = allMatchesOfCurrentTour.every(m => m.status === 'termine')

      if (!allFinished) {
        const remainingMatches = allMatchesOfCurrentTour.filter(m => m.status !== 'termine').length
        notify.warning(`Mode rotation par tour: Tous les matchs du tour ${currentRotation} doivent être terminés. Matchs restants: ${remainingMatches}`)
        return
      }
    }

    // Validation mixité si obligatoire
    if (tournament.settings.mixiteObligatoire) {
      try {
        const joueursResponse = await fetch(`/api/joueurs?org_id=${organization?.id}`, {
          credentials: 'include'
        })
        if (!joueursResponse.ok) return

        const joueursData = await joueursResponse.json()
        const allPlayers = Array.isArray(joueursData) ? joueursData : joueursData.joueurs || []
        const players = allPlayers.filter((p: Joueur) =>
          tournament.settings.players.includes(p.id)
        )

        const hommes = players.filter((p: Joueur) => p.gender === 'H')
        const femmes = players.filter((p: Joueur) => p.gender === 'F')

        // Vérifier si la mixité est faisable
        if (tournament.format === 'doublette') {
          if (hommes.length < 1 || femmes.length < 1) {
            notify.error('Mixité impossible: La doublette avec mixité obligatoire nécessite au minimum 1 homme et 1 femme.')
            return
          }
        } else {
          if (hommes.length < 1 || femmes.length < 1) {
            notify.error('Mixité impossible: La triplette avec mixité obligatoire nécessite au minimum 1 homme et 1 femme.')
            return
          }
        }
      } catch (error) {
        console.error('Erreur validation mixité:', error)
        notify.error('Erreur lors de la validation de la mixité')
        return
      }
    }

    try {
      const newRotation = currentRotation + 1

      const existingMatches = matches.filter(m => m.tour === newRotation)
      if (existingMatches.length > 0) {
        notify.warning(`Les matchs pour la rotation ${newRotation} existent déjà.`)
        return
      }

      // Fix Bug #4 : calcul des équipes ET matchs EN MÉMOIRE
      const newTeams = await buildNewTeams()
      if (!newTeams || newTeams.length === 0) {
        notify.error('Échec du calcul des équipes pour la rotation')
        return
      }

      const newMatches = buildMatchesForRotation(newRotation, newTeams)
      if (newMatches.length === 0) {
        notify.error('Échec du calcul des matchs pour la rotation')
        return
      }

      // 1 SEUL POST transactionnel : équipes + matchs créés ensemble (rollback auto si erreur)
      const response = await fetch(`/api/tournois/${tournament.id}/new-rotation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rotation_number: newRotation,
          teams: newTeams,
          matches: newMatches
        })
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: 'Erreur serveur' }))
        throw new Error(err.error || `HTTP ${response.status}`)
      }

      setCurrentRotation(newRotation)
      await loadTournamentData()
      notify.success(`Rotation ${newRotation} créée avec succès ! ${newTeams.length} équipes et ${newMatches.length} matchs prêts.`)
    } catch (error) {
      console.error('Erreur rotation:', error)
      notify.error(`Erreur lors de la création de la rotation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }, [tournament, teams, matches, currentRotation, organization, buildNewTeams, buildMatchesForRotation, loadTournamentData])

  return {
    // States
    currentRotation,
    setCurrentRotation,
    isRotationAvailable,

    // Actions
    reformTeamsForRotation
  }
}

export default useRotation
