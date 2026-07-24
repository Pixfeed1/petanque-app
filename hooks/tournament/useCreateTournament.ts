/**
 * Hook pour gérer le formulaire de création de tournoi
 * - État du formulaire (formData)
 * - Validation par étape
 * - Navigation entre les étapes
 */

import { useState, useCallback, useEffect } from 'react'
import { validateQualifiedPerPoule } from '@/lib/services/validation.service'

export interface TournamentFormData {
  // Étape 1 - Informations
  name: string
  date: string
  time: string
  location: string
  terrains: number
  terrainNames: string[]

  // Étape 2 - Configuration
  mode: 'choisi' | 'melee_fixe' | 'melee_tournante' | 'personnalise'
  format: 'tete_a_tete' | 'doublette' | 'triplette'
  maxPoints: number
  timeLimit: boolean
  timeLimitMinutes: number

  // Options pétanque
  pouleSize: number
  eliminationFormat: 'simple' | 'double'
  meleeRotation: 'par_tour' | 'par_match'
  // Nombre de parties fixé à l'avance (2/3/4). 0 = illimité (rotations manuelles).
  nombreParties: number
  qualifiedPerPoule: number
  consolante: boolean
  mixiteObligatoire: boolean
  mixiteAdversaire: boolean
  // Équilibrage par niveau cumulé (historique inter-concours) : tirages homogènes au fil du temps.
  equilibrageNiveau: boolean

  // Mode « Personnalisé » (moteur de règles libre)
  engineFormation: 'random' | 'balanced' | 'remixed'
  engineStructure: 'rounds' | 'poules'
  diffFirst: boolean

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
  terrainNames: ['A', 'B', 'C', '3'],
  mode: 'melee_fixe',
  format: 'doublette',
  maxPoints: 13,
  timeLimit: false,
  timeLimitMinutes: 60,
  pouleSize: 4,
  eliminationFormat: 'simple',
  meleeRotation: 'par_tour',
  nombreParties: 0,
  qualifiedPerPoule: 2,
  consolante: false,
  mixiteObligatoire: false,
  mixiteAdversaire: false,
  equilibrageNiveau: false,
  engineFormation: 'random',
  engineStructure: 'rounds',
  diffFirst: false,
  selectedPlayers: [],
  newPlayers: [],
  visibility: 'private',
  allowPhotos: false,
  sendNotifications: false,
  fairPlay: false,
  recordMenes: false
}

interface UseCreateTournamentReturn {
  // State
  formData: TournamentFormData
  currentStep: number
  validationError: string

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

  // Effacer l'erreur de validation quand l'utilisateur modifie les joueurs
  useEffect(() => {
    if (validationError) {
      setValidationError('')
    }
  }, [formData.selectedPlayers.length, formData.newPlayers, formData.qualifiedPerPoule, formData.pouleSize])

  const handleContinue = useCallback(() => {
    setValidationError('')

    if (currentStep === 3) {
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

    if (currentStep === 4) {
      // Validation config poules : qualifiés < taille de poule (et >= 1)
      const qualValidation = validateQualifiedPerPoule(
        formData.qualifiedPerPoule,
        formData.pouleSize
      )
      if (!qualValidation.valid) {
        setValidationError(qualValidation.error || 'Configuration des poules invalide')
        return
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
    steps
  }
}

export default useCreateTournament
