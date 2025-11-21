/**
 * Hook pour la gestion des joueurs
 * - Chargement et CRUD
 * - Filtrage et recherche
 * - Sélection multiple
 * - Export CSV
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { sanitizeRowForCSV } from '@/lib/sanitize'
import type { Joueur } from '@/lib/types'

interface PlayerFormData {
  name: string
  gender: 'H' | 'F'
  email: string
  phone: string
}

interface PlayerStats {
  total: number
  hommes: number
  femmes: number
  actifs: number
}

interface UsePlayersManagementProps {
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
  onConfirm?: (message: string) => Promise<boolean>
}

interface UsePlayersManagementReturn {
  // State
  players: Joueur[]
  loading: boolean
  stats: PlayerStats
  searchTerm: string
  selectedGender: 'all' | 'H' | 'F'
  selectedPlayers: string[]
  filteredPlayers: Joueur[]

  // Modal
  showModal: boolean
  editingPlayer: Joueur | null
  formData: PlayerFormData

  // Actions - Data
  loadPlayers: () => Promise<void>
  savePlayer: () => Promise<void>
  deletePlayer: (playerId: string) => Promise<void>
  bulkDelete: () => Promise<void>
  exportPlayers: () => void

  // Actions - UI
  setSearchTerm: (term: string) => void
  setSelectedGender: (gender: 'all' | 'H' | 'F') => void
  togglePlayerSelection: (playerId: string) => void
  selectAll: () => void
  openModal: (player?: Joueur) => void
  closeModal: () => void
  updateFormData: (data: Partial<PlayerFormData>) => void
}

export function usePlayersManagement(props?: UsePlayersManagementProps): UsePlayersManagementReturn {
  const { organization } = useAuth()
  const { onSuccess, onError, onConfirm } = props || {}

  // Système de notification avec fallback
  const notify = {
    success: (msg: string) => onSuccess ? onSuccess(msg) : console.log(msg),
    error: (msg: string) => onError ? onError(msg) : console.error(msg)
  }

  // State
  const [players, setPlayers] = useState<Joueur[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PlayerStats>({
    total: 0,
    hommes: 0,
    femmes: 0,
    actifs: 0
  })

  // Filtres
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGender, setSelectedGender] = useState<'all' | 'H' | 'F'>('all')
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Joueur | null>(null)
  const [formData, setFormData] = useState<PlayerFormData>({
    name: '',
    gender: 'H',
    email: '',
    phone: ''
  })

  // Joueurs filtrés
  const filteredPlayers = useMemo(() => {
    return players.filter(player => {
      const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           player.email?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesGender = selectedGender === 'all' || player.gender === selectedGender
      return matchesSearch && matchesGender
    })
  }, [players, searchTerm, selectedGender])

  /**
   * Charge les joueurs de l'organisation
   */
  const loadPlayers = useCallback(async () => {
    if (!organization?.id) return

    try {
      const response = await fetch(`/api/joueurs?org_id=${organization.id}`, {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Erreur chargement joueurs')
      const data = await response.json()
      let playersData: Joueur[] = Array.isArray(data) ? data : data.joueurs || []

      // Trier par nom
      playersData = playersData.sort((a, b) => a.name.localeCompare(b.name))

      setPlayers(playersData)

      // Calculer les stats
      setStats({
        total: playersData.length,
        hommes: playersData.filter(p => p.gender === 'H').length,
        femmes: playersData.filter(p => p.gender === 'F').length,
        actifs: playersData.filter(p =>
          (p as any).equipes_joueurs?.some((ej: any) =>
            ej.equipe?.tournoi?.status === 'en_cours'
          )
        ).length
      })
    } catch (error) {
      console.error('Erreur chargement joueurs:', error)
    } finally {
      setLoading(false)
    }
  }, [organization?.id])

  // Charger au mount
  useEffect(() => {
    if (organization?.id) {
      loadPlayers()
    }
  }, [organization?.id, loadPlayers])

  /**
   * Sauvegarde un joueur (création ou modification)
   */
  const savePlayer = useCallback(async () => {
    if (!organization?.id) return

    try {
      if (editingPlayer) {
        // Modification
        const response = await fetch(`/api/joueurs/${editingPlayer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: formData.name,
            gender: formData.gender,
            email: formData.email || null,
            phone: formData.phone || null
          })
        })

        if (response.ok) {
          await loadPlayers()
          closeModal()
          notify.success('Joueur modifié avec succès')
        } else {
          const error = await response.json()
          notify.error(error.error || 'Erreur lors de la modification')
        }
      } else {
        // Création
        const response = await fetch('/api/joueurs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            org_id: organization.id,
            name: formData.name,
            gender: formData.gender,
            email: formData.email || null,
            phone: formData.phone || null
          })
        })

        if (response.ok) {
          await loadPlayers()
          closeModal()
          notify.success('Joueur créé avec succès')
        } else {
          const error = await response.json()
          notify.error(error.error || 'Erreur lors de la création')
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde joueur:', error)
    }
  }, [organization?.id, editingPlayer, formData, loadPlayers])

  /**
   * Supprime un joueur
   */
  const deletePlayer = useCallback(async (playerId: string) => {
    const confirmed = onConfirm
      ? await onConfirm('Êtes-vous sûr de vouloir supprimer ce joueur ?')
      : window.confirm('Êtes-vous sûr de vouloir supprimer ce joueur ?')

    if (!confirmed) return

    try {
      const response = await fetch(`/api/joueurs/${playerId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await loadPlayers()
        notify.success('Joueur supprimé')
      } else {
        const error = await response.json()
        notify.error(error.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur suppression joueur:', error)
      notify.error('Erreur lors de la suppression du joueur')
    }
  }, [loadPlayers, onConfirm])

  /**
   * Suppression en masse
   */
  const bulkDelete = useCallback(async () => {
    const confirmed = onConfirm
      ? await onConfirm(`Supprimer ${selectedPlayers.length} joueur(s) ?`)
      : window.confirm(`Supprimer ${selectedPlayers.length} joueur(s) ?`)

    if (!confirmed) return

    try {
      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      for (const playerId of selectedPlayers) {
        try {
          const response = await fetch(`/api/joueurs/${playerId}`, {
            method: 'DELETE',
            credentials: 'include'
          })
          if (response.ok) {
            successCount++
          } else {
            failedCount++
            const error = await response.json()
            errors.push(error.error || 'Erreur inconnue')
          }
        } catch (err) {
          failedCount++
          errors.push('Erreur réseau')
        }
      }

      setSelectedPlayers([])
      await loadPlayers()

      if (failedCount === 0) {
        notify.success(`${successCount} joueur(s) supprimé(s)`)
      } else if (successCount === 0) {
        notify.error(`Échec de la suppression de ${failedCount} joueur(s)`)
      } else {
        notify.warning(`${successCount} joueur(s) supprimé(s), ${failedCount} échec(s)`)
      }
    } catch (error) {
      console.error('Erreur bulk delete:', error)
      notify.error('Erreur lors de la suppression')
    }
  }, [selectedPlayers, loadPlayers, onConfirm])

  /**
   * Export CSV
   */
  const exportPlayers = useCallback(() => {
    const dataToExport = selectedPlayers.length > 0
      ? players.filter(p => selectedPlayers.includes(p.id))
      : filteredPlayers

    const csv = [
      ['Nom', 'Genre', 'Email', 'Telephone'].join(','),
      ...dataToExport.map(p =>
        sanitizeRowForCSV([p.name, p.gender || '', p.email || '', p.phone || '']).join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'joueurs.csv'
    a.click()
  }, [players, selectedPlayers, filteredPlayers])

  /**
   * Toggle selection d'un joueur
   */
  const togglePlayerSelection = useCallback((playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }, [])

  /**
   * Sélectionner/Désélectionner tous
   */
  const selectAll = useCallback(() => {
    if (selectedPlayers.length === filteredPlayers.length) {
      setSelectedPlayers([])
    } else {
      setSelectedPlayers(filteredPlayers.map(p => p.id))
    }
  }, [selectedPlayers.length, filteredPlayers])

  /**
   * Ouvre le modal (création ou édition)
   */
  const openModal = useCallback((player?: Joueur) => {
    if (player) {
      setEditingPlayer(player)
      setFormData({
        name: player.name,
        gender: player.gender ?? 'H',
        email: player.email || '',
        phone: player.phone || ''
      })
    } else {
      setEditingPlayer(null)
      setFormData({
        name: '',
        gender: 'H',
        email: '',
        phone: ''
      })
    }
    setShowModal(true)
  }, [])

  /**
   * Ferme le modal
   */
  const closeModal = useCallback(() => {
    setShowModal(false)
    setEditingPlayer(null)
    setFormData({
      name: '',
      gender: 'H',
      email: '',
      phone: ''
    })
  }, [])

  /**
   * Met à jour les données du formulaire
   */
  const updateFormData = useCallback((data: Partial<PlayerFormData>) => {
    setFormData(prev => ({ ...prev, ...data }))
  }, [])

  return {
    // State
    players,
    loading,
    stats,
    searchTerm,
    selectedGender,
    selectedPlayers,
    filteredPlayers,

    // Modal
    showModal,
    editingPlayer,
    formData,

    // Actions - Data
    loadPlayers,
    savePlayer,
    deletePlayer,
    bulkDelete,
    exportPlayers,

    // Actions - UI
    setSearchTerm,
    setSelectedGender,
    togglePlayerSelection,
    selectAll,
    openModal,
    closeModal,
    updateFormData
  }
}

export default usePlayersManagement
