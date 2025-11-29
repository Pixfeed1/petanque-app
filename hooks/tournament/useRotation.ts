/**
 * Hook pour la gestion de la rotation en mêlée tournante
 * - Création de nouvelles équipes avec mélange
 * - Génération des matchs de rotation
 * - Gestion des tours
 * - Validation des partenaires (évite les répétitions)
 */

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { MixiteService } from '@/lib/services/mixite.service'
import type { Joueur } from '@/lib/types'
import type { Tournament, Team, Match } from './useTournamentData'

/**
 * 🔧 FIX Bug #2: Validation des rotations pour éviter les partenaires répétés
 * Construit un index des partenaires précédents pour chaque joueur
 */
function buildPreviousPartnersIndex(teams: Team[]): Map<string, Set<string>> {
  const partnersIndex = new Map<string, Set<string>>()

  teams.forEach(team => {
    const playerIds = team.joueur_ids || []
    playerIds.forEach(playerId => {
      if (!partnersIndex.has(playerId)) {
        partnersIndex.set(playerId, new Set())
      }
      // Ajouter tous les autres joueurs de l'équipe comme partenaires
      playerIds.forEach(partnerId => {
        if (partnerId !== playerId) {
          partnersIndex.get(playerId)!.add(partnerId)
        }
      })
    })
  })

  return partnersIndex
}

/**
 * Vérifie si une formation d'équipe contient des partenaires répétés
 * @returns Le nombre de paires répétées trouvées
 */
function countRepeatedPartners(
  newTeams: Array<{ joueur_ids: string[] }>,
  previousPartners: Map<string, Set<string>>
): number {
  let repeatedCount = 0

  newTeams.forEach(team => {
    const playerIds = team.joueur_ids
    for (let i = 0; i < playerIds.length; i++) {
      const playerPartners = previousPartners.get(playerIds[i])
      if (playerPartners) {
        for (let j = i + 1; j < playerIds.length; j++) {
          if (playerPartners.has(playerIds[j])) {
            repeatedCount++
          }
        }
      }
    }
  })

  return repeatedCount
}

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
  createNewTeamsWithAlgorithm: () => Promise<void>
  createMatchesForRotation: (rotationNumber: number) => Promise<void>
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

  /**
   * 🔧 FIX Bug #1: Synchroniser currentRotation avec les données de la BD
   * Initialise le tour actuel depuis les matchs existants au chargement
   */
  useEffect(() => {
    if (matches.length === 0) return

    const maxTour = Math.max(...matches.map(m => m.tour))
    if (maxTour !== currentRotation) {
      setCurrentRotation(maxTour)
    }
  }, [matches]) // eslint-disable-line react-hooks/exhaustive-deps

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
   * Crée de nouvelles équipes avec l'algorithme de mixité
   * 🔧 FIX Bug #2: Évite les partenaires répétés des rotations précédentes
   */
  const createNewTeamsWithAlgorithm = useCallback(async () => {
    if (!organization || !tournament?.settings.players) return

    try {
      // Charger tous les joueurs de l'organisation
      const joueursResponse = await fetch(`/api/joueurs?org_id=${organization.id}`, {
        credentials: 'include'
      })

      if (!joueursResponse.ok) return
      const data = await joueursResponse.json()
      const allPlayers = Array.isArray(data) ? data : data.joueurs || []

      // Filtrer pour obtenir seulement les joueurs du tournoi
      const players = allPlayers.filter((p: Joueur) =>
        tournament.settings.players.includes(p.id)
      )

      if (players.length === 0) return

      // Créer les nouvelles équipes
      const teamSize = tournament.format === 'doublette' ? 2 : 3
      const rotationNumber = currentRotation + 1 // On crée pour la prochaine rotation
      let teamNumber = 1

      // 🔧 FIX Bug #2: Construire l'index des partenaires précédents
      const previousPartners = buildPreviousPartnersIndex(teams)

      // Essayer plusieurs fois pour minimiser les partenaires répétés
      const MAX_RETRIES = 10
      let bestResult = MixiteService.createTeamsWithMixite(
        players,
        teamSize as 2 | 3,
        tournament.settings.mixiteObligatoire || false
      )
      let bestRepeatedCount = countRepeatedPartners(bestResult.teams, previousPartners)

      // Si on a des partenaires répétés, essayer de trouver une meilleure formation
      if (bestRepeatedCount > 0) {
        for (let i = 0; i < MAX_RETRIES && bestRepeatedCount > 0; i++) {
          const candidate = MixiteService.createTeamsWithMixite(
            players,
            teamSize as 2 | 3,
            tournament.settings.mixiteObligatoire || false
          )
          const candidateRepeatedCount = countRepeatedPartners(candidate.teams, previousPartners)

          if (candidateRepeatedCount < bestRepeatedCount) {
            bestResult = candidate
            bestRepeatedCount = candidateRepeatedCount
          }
        }

        // Avertir si on n'a pas pu éviter tous les partenaires répétés
        if (bestRepeatedCount > 0) {
          notify.warning(
            `⚠️ ${bestRepeatedCount} paire(s) de partenaires répétée(s) dans cette rotation. ` +
            `Avec ${players.length} joueurs après ${currentRotation} rotation(s), ` +
            `il devient difficile d'éviter les répétitions.`
          )
        }
      }

      const newTeams = bestResult.teams.map(team => ({
        name: `R${rotationNumber}-Équipe ${teamNumber++}`,
        joueur_ids: team.joueur_ids
      }))

      // Alerter si des joueurs ne peuvent pas être assignés
      if (bestResult.unassignedPlayerIds.length > 0) {
        console.warn(`${bestResult.unassignedPlayerIds.length} joueur(s) non assigné(s) pour la rotation ${rotationNumber}:`, bestResult.warnings)
      }

      // Créer les équipes en batch (1 seule requête au lieu de N)
      const teamsToCreate = newTeams.map(team => ({
        tournoi_id: tournament.id,
        name: team.name,
        joueur_ids: team.joueur_ids,
        stats: {
          victoires: 0,
          defaites: 0,
          points_pour: 0,
          points_contre: 0
        }
      }))

      const teamsBatchResponse = await fetch('/api/equipes/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ teams: teamsToCreate })
      })

      if (!teamsBatchResponse.ok) {
        const error = await teamsBatchResponse.json()
        throw new Error(`Échec création équipes: ${error.error || 'Erreur inconnue'}`)
      }

      // Recharger les données
      await loadTournamentData()
    } catch (error) {
      console.error('Erreur création équipes:', error)
    }
  }, [organization, tournament, currentRotation, teams, loadTournamentData, notify])

  /**
   * Crée les matchs round-robin pour les équipes du tour de rotation
   */
  const createMatchesForRotation = useCallback(async (rotationNumber: number) => {
    if (!tournament) return

    try {
      // Recharger les équipes fraîches depuis la BD
      const teamsResponse = await fetch(`/api/equipes?tournoi_id=${tournament.id}`, {
        credentials: 'include'
      })

      if (!teamsResponse.ok) {
        throw new Error('Échec chargement équipes depuis la BD')
      }

      const freshTeams = await teamsResponse.json()

      // Récupérer toutes les équipes du tour actuel
      const rotationTeams = freshTeams.filter((t: Team) =>
        t.name.startsWith(`R${rotationNumber}-`)
      )

      if (rotationTeams.length === 0) {
        console.warn(`Aucune équipe trouvée pour rotation ${rotationNumber}`)
        return
      }

      // Générer matchs round-robin (tous contre tous) en batch
      const matchesToCreate = []
      for (let i = 0; i < rotationTeams.length; i++) {
        for (let j = i + 1; j < rotationTeams.length; j++) {
          matchesToCreate.push({
            tournoi_id: tournament.id,
            equipe_a_id: rotationTeams[i].id,
            equipe_b_id: rotationTeams[j].id,
            tour: rotationNumber,
            terrain: null,
            type: 'poule',
            poule: null,
            status: 'a_jouer'
          })
        }
      }

      // Créer tous les matchs en batch (1 seule requête au lieu de N²)
      const matchesBatchResponse = await fetch('/api/matches/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ matches: matchesToCreate })
      })

      if (!matchesBatchResponse.ok) {
        const error = await matchesBatchResponse.json()
        throw new Error(error.error || `Échec création matchs`)
      }

      const matchesResult = await matchesBatchResponse.json()
      console.log(`✅ ${matchesResult.created} matchs créés pour rotation ${rotationNumber}`)

      // Recharger les données
      await loadTournamentData()
    } catch (error) {
      console.error('Erreur création matchs rotation:', error)
      notify.error('Erreur lors de la création des matchs de rotation')
    }
  }, [tournament, loadTournamentData])

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

      // Vérifier que les matchs n'existent pas déjà
      const existingMatches = matches.filter(m => m.tour === newRotation)
      if (existingMatches.length > 0) {
        notify.warning(`Les matchs pour la rotation ${newRotation} existent déjà.`)
        return
      }

      // Créer les nouvelles équipes
      await createNewTeamsWithAlgorithm()

      // Vérifier que les équipes ont bien été créées
      const verifyResponse = await fetch(`/api/equipes?tournoi_id=${tournament.id}`, {
        credentials: 'include'
      })
      if (!verifyResponse.ok) {
        throw new Error('Échec vérification création équipes')
      }
      const allTeams = await verifyResponse.json()
      const newTeams = allTeams.filter((t: Team) => t.name.startsWith(`R${newRotation}-`))

      if (newTeams.length === 0) {
        throw new Error('Aucune équipe créée pour la nouvelle rotation')
      }

      // Incrémenter le state
      setCurrentRotation(newRotation)

      // Créer les matchs pour cette rotation
      await createMatchesForRotation(newRotation)

      notify.success(`Rotation ${newRotation} créée avec succès ! ${newTeams.length} équipes et leurs matchs sont prêts.`)
    } catch (error) {
      console.error('Erreur rotation:', error)
      notify.error(`Erreur lors de la création de la rotation: ${error instanceof Error ? error.message : 'Erreur inconnue'}`)
    }
  }, [tournament, teams, matches, currentRotation, organization, createNewTeamsWithAlgorithm, createMatchesForRotation])

  return {
    // States
    currentRotation,
    setCurrentRotation,
    isRotationAvailable,

    // Actions
    reformTeamsForRotation,
    createNewTeamsWithAlgorithm,
    createMatchesForRotation
  }
}

export default useRotation
