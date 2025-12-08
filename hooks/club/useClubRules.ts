// hooks/club/useClubRules.ts
// Hook React pour gérer les règles personnalisées Pack Club

import { useState, useEffect, useCallback } from 'react'
import { ClubRules, DEFAULT_CLUB_RULES } from '@/lib/club/types'
import { ClubRulesService } from '@/lib/club/rules.service'
import { useAuth } from '@/app/providers/AuthProvider'

interface UseClubRulesOptions {
  autoLoad?: boolean
}

interface UseClubRulesReturn {
  // État
  rules: ClubRules[]
  currentRules: ClubRules | null
  loading: boolean
  error: string | null

  // Actions
  loadRules: () => void
  selectRules: (rulesId: string | null) => void
  createRules: (name: string) => ClubRules | null
  updateRules: (rules: ClubRules) => ClubRules | null
  deleteRules: (rulesId: string) => boolean
  duplicateRules: (rulesId: string, newName: string) => ClubRules | null

  // Helpers
  hasPackClub: boolean
  canCreateRules: boolean
  isPremium: boolean
}

/**
 * Hook pour gérer les règles personnalisées Pack Club
 */
export function useClubRules({
  autoLoad = true
}: UseClubRulesOptions = {}): UseClubRulesReturn {
  const { user, hasPackClub, isPremium } = useAuth()
  const userId = user?.id || null

  const [rules, setRules] = useState<ClubRules[]>([])
  const [currentRules, setCurrentRules] = useState<ClubRules | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pack Club requis pour créer des règles personnalisées
  const canCreateRules = hasPackClub

  /**
   * Charge les règles de l'utilisateur
   */
  const loadRules = useCallback(() => {
    if (!userId) {
      setRules([])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userRules = ClubRulesService.getRulesByUserId(userId)
      setRules(userRules)

      // Sélectionner la première règle par défaut si aucune sélectionnée
      if (userRules.length > 0 && !currentRules) {
        setCurrentRules(userRules[0])
      }
    } catch (e) {
      setError('Erreur lors du chargement des règles')
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [userId, currentRules])

  /**
   * Sélectionne un jeu de règles
   */
  const selectRules = useCallback((rulesId: string | null) => {
    if (!rulesId) {
      setCurrentRules(null)
      return
    }

    const selected = rules.find(r => r.id === rulesId)
    if (selected) {
      setCurrentRules(selected)
    } else {
      // Essayer de charger depuis le service
      const fromService = ClubRulesService.getRulesById(rulesId)
      if (fromService) {
        setCurrentRules(fromService)
      }
    }
  }, [rules])

  /**
   * Crée un nouveau jeu de règles
   */
  const createRules = useCallback((name: string): ClubRules | null => {
    if (!userId || !canCreateRules) {
      setError('Vous devez avoir le Pack Club pour créer des règles')
      return null
    }

    try {
      const newRules = ClubRulesService.createDefaultRules(userId, name)
      const saved = ClubRulesService.saveRules(newRules)

      setRules(prev => [...prev, saved])
      setCurrentRules(saved)
      setError(null)

      return saved
    } catch (e) {
      setError('Erreur lors de la création des règles')
      console.error(e)
      return null
    }
  }, [userId, canCreateRules])

  /**
   * Met à jour un jeu de règles
   */
  const updateRules = useCallback((updatedRules: ClubRules): ClubRules | null => {
    if (!userId) return null

    // Valider
    const validation = ClubRulesService.validateRules(updatedRules)
    if (!validation.valid) {
      setError(validation.errors.join(', '))
      return null
    }

    try {
      const saved = ClubRulesService.saveRules(updatedRules)

      setRules(prev => prev.map(r => r.id === saved.id ? saved : r))

      if (currentRules?.id === saved.id) {
        setCurrentRules(saved)
      }

      setError(null)
      return saved
    } catch (e) {
      setError('Erreur lors de la sauvegarde')
      console.error(e)
      return null
    }
  }, [userId, currentRules])

  /**
   * Supprime un jeu de règles
   */
  const deleteRules = useCallback((rulesId: string): boolean => {
    try {
      const success = ClubRulesService.deleteRules(rulesId)

      if (success) {
        setRules(prev => prev.filter(r => r.id !== rulesId))

        if (currentRules?.id === rulesId) {
          setCurrentRules(null)
        }
      }

      return success
    } catch (e) {
      setError('Erreur lors de la suppression')
      console.error(e)
      return false
    }
  }, [currentRules])

  /**
   * Duplique un jeu de règles
   */
  const duplicateRules = useCallback((rulesId: string, newName: string): ClubRules | null => {
    try {
      const duplicated = ClubRulesService.duplicateRules(rulesId, newName)

      if (duplicated) {
        setRules(prev => [...prev, duplicated])
        return duplicated
      }

      return null
    } catch (e) {
      setError('Erreur lors de la duplication')
      console.error(e)
      return null
    }
  }, [])

  // Charger automatiquement au montage
  useEffect(() => {
    if (autoLoad && userId) {
      loadRules()
    }
  }, [autoLoad, userId, loadRules])

  return {
    rules,
    currentRules,
    loading,
    error,
    loadRules,
    selectRules,
    createRules,
    updateRules,
    deleteRules,
    duplicateRules,
    hasPackClub,
    canCreateRules,
    isPremium
  }
}

/**
 * Hook simplifié pour utiliser les règles par défaut ou personnalisées
 */
export function useRulesOrDefault(customRulesId?: string | null): ClubRules {
  const [rules, setRules] = useState<ClubRules>({
    ...DEFAULT_CLUB_RULES,
    id: 'default',
    userId: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  useEffect(() => {
    if (customRulesId) {
      const customRules = ClubRulesService.getRulesById(customRulesId)
      if (customRules) {
        setRules(customRules)
        return
      }
    }

    // Règles par défaut
    setRules({
      ...DEFAULT_CLUB_RULES,
      id: 'default',
      userId: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })
  }, [customRulesId])

  return rules
}
