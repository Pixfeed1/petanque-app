/**
 * Hook pour gérer le formulaire de création de tournoi
 * - État du formulaire (formData)
 * - Validation par étape
 * - Navigation entre les étapes
 */

import { useState, useCallback, useEffect } from 'react'

export interface TournamentFormData {
  // Étape 1 - Informations
  name: string
  date: string
  time: string
  location: string
  terrains: number

  // Étape 2 - Configuration
  mode: 'choisi' | 'melee_fixe' | 'melee_tournante'
  format: 'tete_a_tete' | 'doublette' | 'triplette'
  maxPoints: number
  timeLimit: boolean
  timeLimitMinutes: number

  // Options pétanque
  pouleSize: number
  eliminationFormat: 'simple' | 'double'
  meleeRotation: 'par_tour' | 'par_match'
  qualifiedPerPoule: number
  consolante: boolean
  mixiteObligatoire: boolean

  // Étape 3 - Joueurs
  selectedPlayers: string[]
  newPlayers: NewPlayer[]

  // Options avancées
  visibility: 'private' | 'public'
  allowPhotos: boolean
  sendNotifications: boolean
  fairPlay: boolean
  recordMenes: boolean
}

export interface NewPlayer {
  name: string
  gender: 'H' | 'F'
  email?: string
  phone?: string
}

export interface StepConfig {
  number: number
  title: string
  color: string
}

const initialFormData: TournamentFormData = {
  name: '',
  date: new Date().toISOString().split('T')[0],
  time: '09:00',
  location: '',
  terrains: 4,
  mode: 'melee_fixe',
  format: 'doublette',
  maxPoints: 13,
  timeLimit: false,
  timeLimitMinutes: 60,
  pouleSize: 4,
  eliminationFormat: 'simple',
  meleeRotation: 'par_tour',
  qualifiedPerPoule: 2,
  consolante: true,
  mixiteObligatoire: false,
  selectedPlayers: [],
  newPlayers: [],
  visibility: 'private',
  allowPhotos: true,
  sendNotifications: true,
  fairPlay: true,
  recordMenes: true
}

// A8 FIX: Clé localStorage pour le brouillon
const DRAFT_STORAGE_KEY = 'petanque_tournament_draft'

// A8 FIX: Charger le brouillon depuis localStorage
const loadDraft = (): TournamentFormData | null => {
  if (typeof window === 'undefined') return null
  try {
    const saved = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (saved) {
      const draft = JSON.parse(saved)
      // Vérifier que le brouillon n'est pas trop ancien (24h max)
      if (draft.savedAt && Date.now() - draft.savedAt < 24 * 60 * 60 * 1000) {
        return draft.data as TournamentFormData
      } else {
        localStorage.removeItem(DRAFT_STORAGE_KEY)
      }
    }
  } catch (e) {
    console.warn('Erreur chargement brouillon:', e)
  }
  return null
}

// A8 FIX: Sauvegarder le brouillon dans localStorage
const saveDraft = (data: TournamentFormData) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
      data,
      savedAt: Date.now()
    }))
  } catch (e) {
    console.warn('Erreur sauvegarde brouillon:', e)
  }
}

interface UseCreateTournamentReturn {
  // State
  formData: TournamentFormData
  currentStep: number
  validationError: string
  hasDraft: boolean  // A8 FIX: Indique si un brouillon existe
  draftRestored: boolean  // I9 FIX: Indique si un brouillon vient d'être restauré

  // Setters
  setFormData: React.Dispatch<React.SetStateAction<TournamentFormData>>
  setCurrentStep: React.Dispatch<React.SetStateAction<number>>
  setValidationError: React.Dispatch<React.SetStateAction<string>>
  updateFormField: <K extends keyof TournamentFormData>(field: K, value: TournamentFormData[K]) => void

  // Validation
  canProceed: () => boolean
  handleContinue: () => void
  handleBack: () => void

  // Helpers
  getTotalPlayers: () => number
  getMinPlayers: () => number
  getEstimatedTeams: () => number
  getEstimatedPools: () => number
  getPlayersPerTeam: () => number

  // A8 FIX: Gestion brouillon
  clearDraft: () => void
  clearDraftRestoredFlag: () => void  // I9 FIX

  // Steps config
  steps: StepConfig[]
}

// Validation email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function useCreateTournament(): UseCreateTournamentReturn {
  const [formData, setFormData] = useState<TournamentFormData>(initialFormData)
  const [currentStep, setCurrentStep] = useState(1)
  const [validationError, setValidationError] = useState('')
  const [hasDraft, setHasDraft] = useState(false)  // A8 FIX
  const [draftRestored, setDraftRestored] = useState(false)  // I9 FIX

  // A8 FIX: Charger le brouillon au montage
  useEffect(() => {
    const draft = loadDraft()
    if (draft) {
      setFormData(draft)
      setHasDraft(true)
      setDraftRestored(true)  // I9 FIX: Signaler que le brouillon a été restauré
    }
  }, [])

  // A8 FIX: Sauvegarder le brouillon à chaque modification
  useEffect(() => {
    // Ne pas sauvegarder si le formulaire est vide (initialFormData)
    if (formData.name.trim() || formData.selectedPlayers.length > 0 || formData.newPlayers.length > 0) {
      saveDraft(formData)
      setHasDraft(true)
    }
  }, [formData])

  // A8 FIX: Fonction pour effacer le brouillon
  const clearDraft = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
    }
    setHasDraft(false)
    setDraftRestored(false)
    setFormData(initialFormData)
    setCurrentStep(1)
  }, [])

  // I9 FIX: Fonction pour effacer le flag de restauration (après affichage du toast)
  const clearDraftRestoredFlag = useCallback(() => {
    setDraftRestored(false)
  }, [])

  const steps: StepConfig[] = [
    { number: 1, title: 'Informations', color: 'from-green-500 to-emerald-600' },
    { number: 2, title: 'Format', color: 'from-green-500 to-emerald-600' },
    { number: 3, title: 'Joueurs', color: 'from-green-500 to-emerald-600' },
    { number: 4, title: 'Options', color: 'from-green-500 to-emerald-600' },
    { number: 5, title: 'Validation', color: 'from-green-500 to-emerald-600' }
  ]

  const updateFormField = useCallback(<K extends keyof TournamentFormData>(
    field: K,
    value: TournamentFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const getPlayersPerTeam = useCallback(() => {
    return formData.format === 'tete_a_tete' ? 1 : formData.format === 'doublette' ? 2 : 3
  }, [formData.format])

  const getTotalPlayers = useCallback(() => {
    return formData.selectedPlayers.length + formData.newPlayers.filter(p => p.name.trim()).length
  }, [formData.selectedPlayers, formData.newPlayers])

  const getMinPlayers = useCallback(() => {
    if (formData.format === 'tete_a_tete') return 2
    return formData.format === 'doublette' ? 4 : 6
  }, [formData.format])

  const getEstimatedTeams = useCallback(() => {
    const total = getTotalPlayers()
    if (total === 0) return 0
    return Math.floor(total / getPlayersPerTeam())
  }, [getTotalPlayers, getPlayersPerTeam])

  const getEstimatedPools = useCallback(() => {
    const teams = getEstimatedTeams()
    if (teams === 0 || formData.pouleSize === 0) return 0
    return Math.ceil(teams / formData.pouleSize)
  }, [getEstimatedTeams, formData.pouleSize])

  const canProceed = useCallback(() => {
    switch (currentStep) {
      case 1:
        // Nom minimum 3 caractères
        return formData.name.trim().length >= 3 &&
          formData.name.trim().length <= 100 &&
          formData.terrains > 0

      case 2:
        return true

      case 3: {
        const totalPlayers = getTotalPlayers()
        const minPlayers = getMinPlayers()

        // MODE CHOISI : Sélection optionnelle
        if (formData.mode === 'choisi') {
          if (totalPlayers > 0 && totalPlayers < minPlayers) return false

          // Validation emails nouveaux joueurs
          for (const player of formData.newPlayers) {
            if (player.name.trim() && player.email?.trim() && !isValidEmail(player.email)) {
              return false
            }
          }
          return true
        }

        // MODES MÊLÉE : Joueurs obligatoires
        if (totalPlayers < minPlayers) return false

        const playersPerTeam = getPlayersPerTeam()
        if (totalPlayers % playersPerTeam !== 0) return false

        // Validation emails
        for (const player of formData.newPlayers) {
          if (player.name.trim() && player.email?.trim() && !isValidEmail(player.email)) {
            return false
          }
        }
        return true
      }

      case 4:
      case 5:
        return true

      default:
        return false
    }
  }, [currentStep, formData, getTotalPlayers, getMinPlayers, getPlayersPerTeam])

  const handleContinue = useCallback(() => {
    setValidationError('')

    if (currentStep === 3) {
      // C2 FIX: Validation noms joueurs non vides
      const emptyNamePlayers = formData.newPlayers.filter(p => p.name.trim() === '' && formData.newPlayers.length > 0)
      if (emptyNamePlayers.length > 0 && formData.newPlayers.some(p => p.name.trim() !== '')) {
        // Il y a des joueurs avec nom ET des joueurs sans nom = erreur
        const emptyCount = formData.newPlayers.filter(p => p.name.trim() === '').length
        if (emptyCount > 0 && formData.newPlayers.length > emptyCount) {
          setValidationError(`${emptyCount} joueur(s) sans nom. Remplissez tous les noms ou supprimez les lignes vides.`)
          return
        }
      }

      // C6 FIX: Détection doublons joueurs (nouveaux joueurs entre eux)
      const newPlayerNames = formData.newPlayers
        .map(p => p.name.trim().toLowerCase())
        .filter(name => name !== '')
      const duplicateNewNames = newPlayerNames.filter((name, index) => newPlayerNames.indexOf(name) !== index)
      if (duplicateNewNames.length > 0) {
        setValidationError(`Joueur en double : "${duplicateNewNames[0]}". Chaque joueur doit avoir un nom unique.`)
        return
      }

      const totalPlayers = getTotalPlayers()
      const minPlayers = getMinPlayers()

      if (formData.mode === 'choisi') {
        if (totalPlayers === 0) {
          setCurrentStep(prev => prev + 1)
          return
        }
        if (totalPlayers > 0 && totalPlayers < minPlayers) {
          setValidationError(`Si vous sélectionnez des joueurs, minimum ${minPlayers} requis pour une ${formData.format}`)
          return
        }
      } else {
        if (totalPlayers < minPlayers) {
          setValidationError(`Minimum ${minPlayers} joueurs requis pour une ${formData.format}`)
          return
        }

        const playersPerTeam = getPlayersPerTeam()
        if (totalPlayers % playersPerTeam !== 0) {
          setValidationError(`Pour une ${formData.format} en mêlée, il faut un multiple de ${playersPerTeam} joueurs. Vous avez ${totalPlayers} joueurs.`)
          return
        }
      }
    }

    if (canProceed()) {
      setCurrentStep(prev => prev + 1)
    }
  }, [currentStep, formData, getTotalPlayers, getMinPlayers, getPlayersPerTeam, canProceed])

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      setValidationError('')
    }
  }, [currentStep])

  return {
    formData,
    currentStep,
    validationError,
    hasDraft,  // A8 FIX
    draftRestored,  // I9 FIX
    setFormData,
    setCurrentStep,
    setValidationError,
    updateFormField,
    canProceed,
    handleContinue,
    handleBack,
    getTotalPlayers,
    getMinPlayers,
    getEstimatedTeams,
    getEstimatedPools,
    getPlayersPerTeam,
    clearDraft,  // A8 FIX
    clearDraftRestoredFlag,  // I9 FIX
    steps
  }
}

export default useCreateTournament
