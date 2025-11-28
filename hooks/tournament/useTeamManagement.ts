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
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
  onWarning?: (message: string) => void
}

interface UseTeamManagementReturn {
  // States
  availablePlayers: Joueur[]
  selectedPlayerIds: string[]
  newTeamNameForCreation: string
  setNewTeamNameForCreation: React.Dispatch<React.SetStateAction<string>>
  creatingTeam: boolean
  deletingTeamId: string | null
  editingTeam: Team | null
  setEditingTeam: React.Dispatch<React.SetStateAction<Team | null>>
  newTeamName: string
  setNewTeamName: React.Dispatch<React.SetStateAction<string>>
  showTeamFormation: boolean
  setShowTeamFormation: React.Dispatch<React.SetStateAction<boolean>>
  editingTeamComposition: Team | null
  setEditingTeamComposition: React.Dispatch<React.SetStateAction<Team | null>>
  compositionPlayerIds: string[]
  setCompositionPlayerIds: React.Dispatch<React.SetStateAction<string[]>>
  updatingComposition: boolean

  // Actions
  loadAvailablePlayers: (forTeamId?: string) => Promise<void>
  togglePlayerSelection: (playerId: string) => void
  createTeamWithPlayers: () => Promise<void>
  renameTeam: () => Promise<void>
  deleteTeam: (teamId: string) => Promise<void>
  getPlayersPerTeam: (format: string) => number
  getTeamPlayers: (teamId: string | null | undefined) => string[]
  resetTeamFormation: () => void
  startEditingComposition: (team: Team) => void
  toggleCompositionPlayer: (playerId: string) => void
  updateTeamComposition: () => Promise<void>
  cancelEditingComposition: () => void
}

export function useTeamManagement({
  tournament,
  teams,
  loadTournamentData,
  onSuccess,
  onError,
  onWarning
}: UseTeamManagementProps): UseTeamManagementReturn {
  const { organization } = useAuth()

  // Système de notification avec fallback
  const notify = {
    success: (msg: string) => onSuccess ? onSuccess(msg) : console.log(msg),
    error: (msg: string) => onError ? onError(msg) : console.error(msg),
    warning: (msg: string) => onWarning ? onWarning(msg) : console.warn(msg)
  }

  // States pour composer les équipes (mode choisi)
  const [availablePlayers, setAvailablePlayers] = useState<Joueur[]>([])
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([])
  const [newTeamNameForCreation, setNewTeamNameForCreation] = useState('')
  const [creatingTeam, setCreatingTeam] = useState(false)
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null)
  const [showTeamFormation, setShowTeamFormation] = useState(false)

  // States pour renommer une équipe
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [newTeamName, setNewTeamName] = useState('')

  // States pour modifier la composition d'une équipe
  const [editingTeamComposition, setEditingTeamComposition] = useState<Team | null>(null)
  const [compositionPlayerIds, setCompositionPlayerIds] = useState<string[]>([])
  const [updatingComposition, setUpdatingComposition] = useState(false)

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
   * Si on édite la composition d'une équipe, inclut aussi les joueurs de cette équipe
   */
  const loadAvailablePlayers = useCallback(async (forTeamId?: string) => {
    if (!organization?.id) return

    try {
      const response = await fetch(`/api/joueurs?org_id=${organization.id}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        const allPlayers = Array.isArray(data) ? data : data.joueurs || []

        // Filtrer les joueurs déjà assignés à une équipe de ce tournoi
        // Sauf ceux de l'équipe qu'on édite (forTeamId)
        const assignedPlayerIds = new Set<string>()
        teams.forEach(team => {
          // Si on édite une équipe, ne pas exclure ses joueurs actuels
          if (forTeamId && team.id === forTeamId) return
          team.joueur_ids?.forEach(playerId => assignedPlayerIds.add(playerId))
        })

        // Ne garder que les joueurs non assignés (ou dans l'équipe éditée)
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
      notify.warning('Veuillez entrer un nom d\'équipe')
      return
    }

    // Vérifier l'unicité du nom d'équipe
    const teamName = newTeamNameForCreation.trim()
    const existingTeam = teams.find(t => t.name.toLowerCase() === teamName.toLowerCase())
    if (existingTeam) {
      notify.error(`Une équipe nommée "${teamName}" existe déjà. Veuillez choisir un autre nom.`)
      return
    }

    const playersPerTeam = getPlayersPerTeam(tournament.format)

    if (selectedPlayerIds.length !== playersPerTeam) {
      notify.warning(`Vous devez sélectionner exactement ${playersPerTeam} joueur(s) pour une ${tournament.format}`)
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

        notify.success('Équipe créée avec succès !')
      } else {
        const error = await response.json()
        notify.error(error.error || 'Impossible de créer l\'équipe')
      }
    } catch (error) {
      console.error('Erreur création équipe:', error)
      notify.error('Erreur lors de la création de l\'équipe')
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
      notify.error(`Une équipe nommée "${trimmedName}" existe déjà. Veuillez choisir un autre nom.`)
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
        notify.success('Équipe renommée avec succès')
      } else {
        const error = await response.json()
        notify.error(error.error || 'Erreur lors du renommage de l\'équipe')
      }
    } catch (error) {
      console.error('Erreur renommage équipe:', error)
      notify.error('Erreur lors du renommage de l\'équipe')
    }
  }, [editingTeam, newTeamName, teams, loadTournamentData])

  /**
   * Supprime une équipe existante
   * Vérifie côté API que le tournoi est en préparation et qu'aucun match n'existe
   */
  const deleteTeam = useCallback(async (teamId: string) => {
    const teamToDelete = teams.find(t => t.id === teamId)
    if (!teamToDelete) {
      notify.error('Équipe introuvable')
      return
    }

    setDeletingTeamId(teamId)

    try {
      const response = await fetch(`/api/equipes/${teamId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await loadTournamentData()
        notify.success(`Équipe "${teamToDelete.name}" supprimée avec succès`)
      } else {
        const error = await response.json()
        notify.error(error.error || 'Erreur lors de la suppression de l\'équipe')
      }
    } catch (error) {
      console.error('Erreur suppression équipe:', error)
      notify.error('Erreur lors de la suppression de l\'équipe')
    } finally {
      setDeletingTeamId(null)
    }
  }, [teams, loadTournamentData])

  /**
   * Démarre l'édition de la composition d'une équipe
   */
  const startEditingComposition = useCallback((team: Team) => {
    setEditingTeamComposition(team)
    // Initialiser avec les joueurs actuels de l'équipe
    setCompositionPlayerIds(team.joueur_ids || [])
    // Charger les joueurs disponibles (inclut ceux de l'équipe qu'on édite)
    loadAvailablePlayers(team.id)
  }, [loadAvailablePlayers])

  /**
   * Toggle la sélection d'un joueur pour la composition
   */
  const toggleCompositionPlayer = useCallback((playerId: string) => {
    setCompositionPlayerIds(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }, [])

  /**
   * Annule l'édition de la composition
   */
  const cancelEditingComposition = useCallback(() => {
    setEditingTeamComposition(null)
    setCompositionPlayerIds([])
  }, [])

  /**
   * Met à jour la composition d'une équipe
   */
  const updateTeamComposition = useCallback(async () => {
    if (!editingTeamComposition || !tournament) return

    const playersPerTeam = getPlayersPerTeam(tournament.format)

    if (compositionPlayerIds.length !== playersPerTeam) {
      notify.warning(`Vous devez sélectionner exactement ${playersPerTeam} joueur(s) pour une ${tournament.format}`)
      return
    }

    // Vérifier que les joueurs ne sont pas déjà dans une autre équipe
    const otherTeams = teams.filter(t => t.id !== editingTeamComposition.id)
    const conflictingPlayers: { playerId: string; teamName: string }[] = []

    for (const team of otherTeams) {
      const teamJoueurIds = team.joueur_ids || []
      for (const playerId of compositionPlayerIds) {
        if (teamJoueurIds.includes(playerId)) {
          conflictingPlayers.push({ playerId, teamName: team.name })
        }
      }
    }

    if (conflictingPlayers.length > 0) {
      const details = conflictingPlayers
        .map(c => `Un joueur est déjà dans l'équipe "${c.teamName}"`)
        .join(', ')
      notify.error(details)
      return
    }

    setUpdatingComposition(true)

    try {
      const response = await fetch(`/api/equipes/${editingTeamComposition.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ joueur_ids: compositionPlayerIds })
      })

      if (response.ok) {
        await loadTournamentData()
        setEditingTeamComposition(null)
        setCompositionPlayerIds([])
        notify.success('Composition de l\'équipe mise à jour')
      } else {
        const error = await response.json()
        notify.error(error.error || 'Erreur lors de la mise à jour de la composition')
      }
    } catch (error) {
      console.error('Erreur mise à jour composition:', error)
      notify.error('Erreur lors de la mise à jour de la composition')
    } finally {
      setUpdatingComposition(false)
    }
  }, [editingTeamComposition, tournament, compositionPlayerIds, teams, getPlayersPerTeam, loadTournamentData])

  return {
    // States
    availablePlayers,
    selectedPlayerIds,
    newTeamNameForCreation,
    setNewTeamNameForCreation,
    creatingTeam,
    deletingTeamId,
    editingTeam,
    setEditingTeam,
    newTeamName,
    setNewTeamName,
    showTeamFormation,
    setShowTeamFormation,
    editingTeamComposition,
    setEditingTeamComposition,
    compositionPlayerIds,
    setCompositionPlayerIds,
    updatingComposition,

    // Actions
    loadAvailablePlayers,
    togglePlayerSelection,
    createTeamWithPlayers,
    renameTeam,
    deleteTeam,
    getPlayersPerTeam,
    getTeamPlayers,
    resetTeamFormation,
    startEditingComposition,
    toggleCompositionPlayer,
    updateTeamComposition,
    cancelEditingComposition
  }
}

export default useTeamManagement
