/**
 * Hook pour la gestion de la rotation en mêlée tournante
 * - Création de nouvelles équipes avec mélange
 * - Génération des matchs de rotation
 * - Gestion des tours
 */

import { useState, useMemo, useCallback } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { MixiteService } from '@/lib/services/mixite.service'
import type { Joueur } from '@/lib/types'
import type { Tournament, Team, Match } from './useTournamentData'

interface UseRotationProps {
  tournament: Tournament | null
  teams: Team[]
  matches: Match[]
  loadTournamentData: () => Promise<void>
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
  loadTournamentData
}: UseRotationProps): UseRotationReturn {
  const { organization } = useAuth()

  const [currentRotation, setCurrentRotation] = useState(1)

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
      const rotationNumber = currentRotation
      let teamNumber = 1

      // Utiliser MixiteService pour formation des équipes
      const mixiteResult = MixiteService.createTeamsWithMixite(
        players,
        teamSize as 2 | 3,
        tournament.settings.mixiteObligatoire || false
      )

      const newTeams = mixiteResult.teams.map(team => ({
        name: `R${rotationNumber}-Équipe ${teamNumber++}`,
        joueur_ids: team.joueur_ids
      }))

      // Alerter si des joueurs ne peuvent pas être assignés
      if (mixiteResult.unassignedPlayerIds.length > 0) {
        console.warn(`${mixiteResult.unassignedPlayerIds.length} joueur(s) non assigné(s) pour la rotation ${rotationNumber}:`, mixiteResult.warnings)
      }

      // Créer les équipes avec vérification
      const teamErrors: string[] = []
      for (const team of newTeams) {
        const teamResponse = await fetch('/api/equipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            tournoi_id: tournament.id,
            name: team.name,
            joueur_ids: team.joueur_ids,
            stats: {
              victoires: 0,
              defaites: 0,
              points_pour: 0,
              points_contre: 0
            }
          })
        })

        if (!teamResponse.ok) {
          const error = await teamResponse.json().catch(() => ({ error: 'Erreur serveur' }))
          teamErrors.push(`${team.name}: ${error.error}`)
        }
      }

      if (teamErrors.length > 0) {
        throw new Error(`Échec création équipes:\n${teamErrors.join('\n')}`)
      }

      // Recharger les données
      await loadTournamentData()
    } catch (error) {
      console.error('Erreur création équipes:', error)
    }
  }, [organization, tournament, currentRotation, loadTournamentData])

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

      // Générer matchs round-robin (tous contre tous)
      for (let i = 0; i < rotationTeams.length; i++) {
        for (let j = i + 1; j < rotationTeams.length; j++) {
          const response = await fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              tournoi_id: tournament.id,
              equipe_a_id: rotationTeams[i].id,
              equipe_b_id: rotationTeams[j].id,
              tour: rotationNumber,
              terrain: null,
              type: 'poule',
              poule: null,
              status: 'a_jouer'
            })
          })

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
            throw new Error(error.error || `Échec création match`)
          }
        }
      }

      console.log(`✅ ${(rotationTeams.length * (rotationTeams.length - 1)) / 2} matchs créés pour rotation ${rotationNumber}`)

      // Recharger les données
      await loadTournamentData()
    } catch (error) {
      console.error('Erreur création matchs rotation:', error)
      alert('❌ Erreur lors de la création des matchs de rotation')
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
      alert(`⚠️ Les équipes pour la rotation ${nextRotation} existent déjà.\n\nImpossible de créer une nouvelle rotation.`)
      return
    }

    if (rotationType === 'par_match') {
      // Vérifier qu'au moins 1 match est terminé
      const currentRotationMatches = matches.filter(m => m.tour === currentRotation)

      if (currentRotationMatches.length === 0) {
        alert('⚠️ Aucun match trouvé pour le tour actuel.\n\nCréez d\'abord des matchs avant de faire une rotation.')
        return
      }

      const hasFinishedMatch = currentRotationMatches.some(m => m.status === 'termine')

      if (!hasFinishedMatch) {
        alert('⚠️ Mode rotation par match\n\nAu moins 1 match doit être terminé avant de pouvoir créer une nouvelle rotation.')
        return
      }
    } else {
      // Vérifier que TOUS les matchs sont terminés
      const allMatchesOfCurrentTour = matches.filter(m => m.tour === currentRotation)

      if (allMatchesOfCurrentTour.length === 0) {
        alert('⚠️ Aucun match trouvé pour le tour actuel.\n\nCréez d\'abord des matchs avant de faire une rotation.')
        return
      }

      const allFinished = allMatchesOfCurrentTour.every(m => m.status === 'termine')

      if (!allFinished) {
        const remainingMatches = allMatchesOfCurrentTour.filter(m => m.status !== 'termine').length
        alert(`⚠️ Mode rotation par tour\n\nTous les matchs du tour ${currentRotation} doivent être terminés.\n\nMatchs restants : ${remainingMatches}`)
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
            alert('❌ Mixité impossible\n\nLa doublette avec mixité obligatoire nécessite au minimum 1 homme et 1 femme.')
            return
          }
        } else {
          if (hommes.length < 1 || femmes.length < 1) {
            alert('❌ Mixité impossible\n\nLa triplette avec mixité obligatoire nécessite au minimum 1 homme et 1 femme.')
            return
          }
        }
      } catch (error) {
        console.error('Erreur validation mixité:', error)
        alert('❌ Erreur lors de la validation de la mixité')
        return
      }
    }

    try {
      const newRotation = currentRotation + 1

      // Vérifier que les matchs n'existent pas déjà
      const existingMatches = matches.filter(m => m.tour === newRotation)
      if (existingMatches.length > 0) {
        alert(`⚠️ Les matchs pour la rotation ${newRotation} existent déjà.`)
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

      alert(`✅ Rotation ${newRotation} créée avec succès !\n\n${newTeams.length} équipes et leurs matchs sont prêts.`)
    } catch (error) {
      console.error('Erreur rotation:', error)
      alert(`❌ Erreur lors de la création de la rotation:\n${error instanceof Error ? error.message : 'Erreur inconnue'}`)
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
