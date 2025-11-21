/**
 * Hook pour la gestion de la sélection des joueurs
 * - Chargement des joueurs disponibles
 * - Sélection/désélection
 * - Ajout de nouveaux joueurs
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import type { Joueur } from '@/lib/types'
import type { NewPlayer } from './useCreateTournament'

interface UsePlayerSelectionProps {
  selectedPlayers: string[]
  newPlayers: NewPlayer[]
  onUpdateSelectedPlayers: (players: string[]) => void
  onUpdateNewPlayers: (players: NewPlayer[]) => void
}

interface UsePlayerSelectionReturn {
  // State
  availablePlayers: Joueur[]
  loadingPlayers: boolean

  // Actions
  loadPlayers: () => Promise<void>
  togglePlayer: (playerId: string) => void
  addNewPlayer: () => void
  updateNewPlayer: (index: number, field: keyof NewPlayer, value: string) => void
  removeNewPlayer: (index: number) => void
  selectAllPlayers: () => void
  deselectAllPlayers: () => void

  // Refs
  newPlayersRef: React.RefObject<HTMLDivElement | null>
}

export function usePlayerSelection({
  selectedPlayers,
  newPlayers,
  onUpdateSelectedPlayers,
  onUpdateNewPlayers
}: UsePlayerSelectionProps): UsePlayerSelectionReturn {
  const { organization } = useAuth()

  const [availablePlayers, setAvailablePlayers] = useState<Joueur[]>([])
  const [loadingPlayers, setLoadingPlayers] = useState(true)

  const newPlayersRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Charge les joueurs de l'organisation
   */
  const loadPlayers = useCallback(async () => {
    if (!organization?.id) return

    setLoadingPlayers(true)
    try {
      const response = await fetch(`/api/joueurs?org_id=${organization.id}`, {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Erreur chargement joueurs')

      const data = await response.json()
      const playersData = Array.isArray(data) ? data : data.joueurs || []
      setAvailablePlayers(playersData)
    } catch (error) {
      console.error('Erreur chargement joueurs:', error)
    } finally {
      setLoadingPlayers(false)
    }
  }, [organization?.id])

  /**
   * Toggle la sélection d'un joueur
   */
  const togglePlayer = useCallback((playerId: string) => {
    const wasSelected = selectedPlayers.includes(playerId)
    const updated = wasSelected
      ? selectedPlayers.filter(id => id !== playerId)
      : [...selectedPlayers, playerId]
    onUpdateSelectedPlayers(updated)
  }, [selectedPlayers, onUpdateSelectedPlayers])

  /**
   * Ajoute un nouveau joueur vide
   */
  const addNewPlayer = useCallback(() => {
    onUpdateNewPlayers([...newPlayers, { name: '', gender: 'H', email: '', phone: '' }])

    // Auto-scroll vers le bas
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(() => {
      newPlayersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 100)
  }, [newPlayers, onUpdateNewPlayers])

  /**
   * Met à jour un champ d'un nouveau joueur
   */
  const updateNewPlayer = useCallback((index: number, field: keyof NewPlayer, value: string) => {
    const updated = [...newPlayers]
    updated[index] = { ...updated[index], [field]: value }
    onUpdateNewPlayers(updated)
  }, [newPlayers, onUpdateNewPlayers])

  /**
   * Supprime un nouveau joueur
   */
  const removeNewPlayer = useCallback((index: number) => {
    onUpdateNewPlayers(newPlayers.filter((_, i) => i !== index))
  }, [newPlayers, onUpdateNewPlayers])

  /**
   * Sélectionne tous les joueurs disponibles
   */
  const selectAllPlayers = useCallback(() => {
    onUpdateSelectedPlayers(availablePlayers.map(p => p.id))
  }, [availablePlayers, onUpdateSelectedPlayers])

  /**
   * Désélectionne tous les joueurs
   */
  const deselectAllPlayers = useCallback(() => {
    onUpdateSelectedPlayers([])
  }, [onUpdateSelectedPlayers])

  return {
    availablePlayers,
    loadingPlayers,
    loadPlayers,
    togglePlayer,
    addNewPlayer,
    updateNewPlayer,
    removeNewPlayer,
    selectAllPlayers,
    deselectAllPlayers,
    newPlayersRef
  }
}

export default usePlayerSelection
