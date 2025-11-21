/**
 * Hook pour la gestion des équipes d'un tournoi
 * - Création d'équipes (mode choisi)
 * - Renommage d'équipes
 * - Gestion des joueurs disponibles
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import type { Joueur } from '@/lib/types'
import type { Tournament, Team } from './useTournamentData'

interface UseTeamManagementProps {
  tournament: Tournament | null
  teams: Team[]
  loadTournamentData: () => Promise<void>
}

interface UseTeamManagementReturn {
  // States
  availablePlayers: Joueur[]
  selectedPlayerIds: string[]
  newTeamNameForCreation: string
  setNewTeamNameForCreation: React.Dispatch<React.SetStateAction<string>>
  creatingTeam: boolean
  editingTeam: Team | null
  setEditingTeam: React.Dispatch<React.SetStateAction<Team | null>>
  newTeamName: string
  setNewTeamName: React.Dispatch<React.SetStateAction<string>>
  showTeamFormation: boolean
  setShowTeamFormation: React.Dispatch<React.SetStateAction<boolean>>

  // Actions
  loadAvailablePlayers: () => Promise<void>
  togglePlayerSelection: (playerId: string) => void
  createTeamWithPlayers: () => Promise<void>
  renameTeam: () => Promise<void>
  getPlayersPerTeam: (format: string) => number
  getTeamPlayers: (teamId: string | null | undefined) => string[]
  resetTeamFormation: () => void
}

export function useTeamManagement({
  tournament,
  teams,
  loadTournamentData
}: UseTeamManagementProps): UseTeamManagementReturn {
  const { organization } = useAuth()

  // States pour composer les équipes (mode choisi)
  const [availablePlayers, setAvailablePlayers] = useState<Joueur[]>([])
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [newTeamNameForCreation, setNewTeamNameForCreation] = useState('')
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [showTeamFormation, setShowTeamFormation] = useState(false)

  // States pour renommer une équipe
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [newTeamName, setNewTeamName] = useState('')

  /**
   * Calcule le nombre de joueurs requis par équipe selon le format
   */
  const getPlayersPerTeam = useCallback((format: string): number => {
    return format === 'tete_a_tete' ? 1 : format === 'doublette' ? 2 : 3
  }, [])

  /**
   * Récupère les noms des joueurs d'une équipe
   */
  const getTeamPlayers = useCallback((teamId: string | null | undefined): string[] => {
    if (!teamId) return []
    const team = teams.find(t => t.id === teamId)
    if (!team || !team.equipes_joueurs || team.equipes_joueurs.length === 0) return []
    return team.equipes_joueurs.map(ej => ej.joueur.name)
  }, [teams])

  /**
   * Charge les joueurs disponibles (non assignés à une équipe)
   */
  const loadAvailablePlayers = useCallback(async () => {
    if (!organization?.id) return

    try {
      const response = await fetch(`/api/joueurs?org_id=${organization.id}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const allPlayers = await response.json()

        // Filtrer les joueurs déjà assignés à une équipe de ce tournoi
        const assignedPlayerIds = new Set<string>()
        teams.forEach(team => {
          team.joueur_ids?.forEach(playerId => assignedPlayerIds.add(playerId))
        })

        // Ne garder que les joueurs non assignés
        const available = allPlayers.filter((player: Joueur) =>
          !assignedPlayerIds.has(player.id)
        )

        setAvailablePlayers(available)
      }
    } catch (error) {
      console.error('Erreur chargement joueurs:', error)
    }
  }, [organization?.id, teams])

  // Charger les joueurs disponibles quand on ouvre le modal
  useEffect(() => {
    if (showTeamFormation && organization?.id) {
      loadAvailablePlayers()
    }
  }, [showTeamFormation, organization?.id, loadAvailablePlayers])

  /**
   * Toggle la sélection d'un joueur
   */
  const togglePlayerSelection = useCallback((playerId: string) => {
    setSelectedPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }, [])

  /**
   * Reset le formulaire de création d'équipe
   */
  const resetTeamFormation = useCallback(() => {
    setShowTeamFormation(false)
    setNewTeamNameForCreation('')
    setSelectedPlayerIds([])
  }, [])

  /**
   * Crée une nouvelle équipe avec les joueurs sélectionnés
   */
  const createTeamWithPlayers = useCallback(async () => {
    if (!tournament || !newTeamNameForCreation.trim()) {
      alert('Veuillez entrer un nom d\'équipe')
      return
    }

    // Vérifier l'unicité du nom d'équipe
    const teamName = newTeamNameForCreation.trim()
    const existingTeam = teams.find(t => t.name.toLowerCase() === teamName.toLowerCase())
    if (existingTeam) {
      alert(`❌ Une équipe nommée "${teamName}" existe déjà.\n\nVeuillez choisir un autre nom.`)
      return
    }

    const playersPerTeam = getPlayersPerTeam(tournament.format)

    if (selectedPlayerIds.length !== playersPerTeam) {
      alert(`Vous devez sélectionner exactement ${playersPerTeam} joueur(s) pour une ${tournament.format}`)
      return
    }

    setCreatingTeam(true)

    try {
      const response = await fetch('/api/equipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tournoi_id: tournament.id,
          name: teamName,
          joueur_ids: selectedPlayerIds,
          stats: {
            victoires: 0,
            defaites: 0,
            points_pour: 0,
            points_contre: 0
          }
        })
      })

      if (response.ok) {
        // Réinitialiser le formulaire
        setNewTeamNameForCreation('')
        setSelectedPlayerIds([])

        // Recharger les données
        await loadTournamentData()

        alert('✅ Équipe créée avec succès !')
      } else {
        const error = await response.json()
        alert(`Erreur : ${error.error || 'Impossible de créer l\'équipe'}`)
      }
    } catch (error) {
      console.error('Erreur création équipe:', error)
      alert('Erreur lors de la création de l\'équipe')
    } finally {
      setCreatingTeam(false)
    }
  }, [tournament, newTeamNameForCreation, teams, selectedPlayerIds, getPlayersPerTeam, loadTournamentData])

  /**
   * Renomme une équipe existante
   */
  const renameTeam = useCallback(async () => {
    if (!editingTeam || !newTeamName.trim()) return

    const trimmedName = newTeamName.trim()
    const existingTeam = teams.find(t =>
      t.id !== editingTeam.id &&
      t.name.toLowerCase() === trimmedName.toLowerCase()
    )

    if (existingTeam) {
      alert(`❌ Une équipe nommée "${trimmedName}" existe déjà.\n\nVeuillez choisir un autre nom.`)
      return
    }

    try {
      const response = await fetch(`/api/equipes/${editingTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: trimmedName })
      })

      if (response.ok) {
        await loadTournamentData()
        setEditingTeam(null)
        setNewTeamName('')
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors du renommage de l\'équipe')
      }
    } catch (error) {
      console.error('Erreur renommage équipe:', error)
      alert('Erreur lors du renommage de l\'équipe')
    }
  }, [editingTeam, newTeamName, teams, loadTournamentData])

  return {
    // States
    availablePlayers,
    selectedPlayerIds,
    newTeamNameForCreation,
    setNewTeamNameForCreation,
    creatingTeam,
    editingTeam,
    setEditingTeam,
    newTeamName,
    setNewTeamName,
    showTeamFormation,
    setShowTeamFormation,

    // Actions
    loadAvailablePlayers,
    togglePlayerSelection,
    createTeamWithPlayers,
    renameTeam,
    getPlayersPerTeam,
    getTeamPlayers,
    resetTeamFormation
  }
}

export default useTeamManagement
