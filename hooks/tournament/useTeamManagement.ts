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
  editingTeam: Team | null
  setEditingTeam: React.Dispatch<React.SetStateAction<Team | null>>
  newTeamName: string
  setNewTeamName: React.Dispatch<React.SetStateAction<string>>
  showTeamFormation: boolean
  setShowTeamFormation: React.Dispatch<React.SetStateAction<boolean>>
  suggestedTeamName: string

  // Actions
  loadAvailablePlayers: () => Promise<void>
  togglePlayerSelection: (playerId: string) => void
  createTeamWithPlayers: () => Promise<void>
  autoFillRemainingTeams: () => Promise<void>
  renameTeam: () => Promise<void>
  getPlayersPerTeam: (format: string) => number
  getTeamPlayers: (teamId: string | null | undefined) => string[]
  resetTeamFormation: () => void
}

/**
 * Génère le prochain nom d'équipe libre "Équipe N".
 * Évite les collisions avec les équipes déjà nommées ainsi.
 */
function nextDefaultTeamName(existing: Team[]): string {
  const taken = new Set(existing.map(t => t.name.trim().toLowerCase()))
  let n = 1
  while (taken.has(`équipe ${n}`)) n++
  return `Équipe ${n}`
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

  // Nom suggéré pour la prochaine équipe (pré-rempli, éditable) → 2 taps pour créer.
  const suggestedTeamName = nextDefaultTeamName(teams)

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
        const data = await response.json()
        const allPlayers = Array.isArray(data) ? data : data.joueurs || []

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
    if (!tournament) return

    // Nom facultatif : si laissé vide, on utilise le nom suggéré "Équipe N".
    // → l'utilisateur peut composer une équipe en 2 taps (sélection + créer).
    const teamName = newTeamNameForCreation.trim() || nextDefaultTeamName(teams)
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
   * Répartit automatiquement les joueurs restants en équipes complètes.
   * Escape hatch du mode "choisi" : l'organisateur peut composer à la main les
   * équipes qui lui tiennent à cœur, puis compléter le reste en un clic.
   */
  const autoFillRemainingTeams = useCallback(async () => {
    if (!tournament) return

    const perTeam = getPlayersPerTeam(tournament.format)
    const pool = [...availablePlayers]

    if (pool.length < perTeam) {
      notify.warning('Pas assez de joueurs restants pour former une équipe complète.')
      return
    }

    // Mélange (Fisher-Yates) pour une répartition aléatoire équitable
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }

    // Découpe en équipes complètes (on laisse de côté un éventuel reliquat)
    const chunks: Joueur[][] = []
    for (let i = 0; i + perTeam <= pool.length; i += perTeam) {
      chunks.push(pool.slice(i, i + perTeam))
    }

    setCreatingTeam(true)
    try {
      const taken = new Set(teams.map(t => t.name.trim().toLowerCase()))
      let idx = 0
      let created = 0

      for (const chunk of chunks) {
        // Prochain nom "Équipe N" libre
        let name = ''
        do { idx++; name = `Équipe ${idx}` } while (taken.has(name.toLowerCase()))
        taken.add(name.toLowerCase())

        const response = await fetch('/api/equipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            tournoi_id: tournament.id,
            name,
            joueur_ids: chunk.map(p => p.id),
            stats: { victoires: 0, defaites: 0, points_pour: 0, points_contre: 0 }
          })
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          notify.error(error.error || 'Impossible de créer une équipe automatiquement')
          break
        }
        created++
      }

      await loadTournamentData()

      const leftover = pool.length % perTeam
      notify.success(
        `${created} équipe${created > 1 ? 's' : ''} créée${created > 1 ? 's' : ''} automatiquement` +
        (leftover ? ` · ${leftover} joueur${leftover > 1 ? 's' : ''} non assigné${leftover > 1 ? 's' : ''}` : '')
      )
      resetTeamFormation()
    } catch (error) {
      console.error('Erreur répartition automatique:', error)
      notify.error('Erreur lors de la répartition automatique')
    } finally {
      setCreatingTeam(false)
    }
  }, [tournament, availablePlayers, teams, getPlayersPerTeam, loadTournamentData, resetTeamFormation])

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
    suggestedTeamName,

    // Actions
    loadAvailablePlayers,
    togglePlayerSelection,
    createTeamWithPlayers,
    autoFillRemainingTeams,
    renameTeam,
    getPlayersPerTeam,
    getTeamPlayers,
    resetTeamFormation
  }
}

export default useTeamManagement
