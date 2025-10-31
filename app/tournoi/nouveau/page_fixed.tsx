'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { supabase } from '@/lib/supabase'

// IcÃ´nes premium amÃ©liorÃ©es
const Icons = {
  trophy: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v6m-3 0h6m4-13V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1H11a1 1 0 00-1 1v1.5a.5.5 0 01-.5.5H7a2 2 0 00-2 2v1c0 3.5 2.5 6 5.5 6.5m9 0c3-0.5 5.5-3 5.5-6.5V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1h-2" />
    </svg>
  ),
  petanque: (
    <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="url(#metalGradient)" stroke="currentColor" strokeWidth="2"/>
      <circle cx="26" cy="24" r="3" fill="white" opacity="0.8"/>
      <circle cx="36" cy="36" r="2" fill="currentColor" opacity="0.3"/>
      <defs>
        <radialGradient id="metalGradient">
          <stop offset="0%" stopColor="#a8b2c3"/>
          <stop offset="100%" stopColor="#8e9aaf"/>
        </radialGradient>
      </defs>
    </svg>
  ),
  calendar: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  gamepad: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  sparkles: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  lightning: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  star: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
    </svg>
  ),
  loader: (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  map: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  shuffle: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  grid: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  settings: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  flag: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  ),
  alert: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  )
}

// Validation email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export default function CreateTournamentPage() {
  const router = useRouter()
  const { user, organization } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [successAnimation, setSuccessAnimation] = useState(false)
  const [savingTournament, setSavingTournament] = useState(false)
  const [validationError, setValidationError] = useState('')
  const newPlayersRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()
  
  // Joueurs depuis la base
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([])
  
  // Ãtat du formulaire complet avec TOUTES les options pÃ©tanque
  const [formData, setFormData] = useState({
    // Ãtape 1 - Informations
    name: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    location: '',
    terrains: 4,
    
    // Ãtape 2 - Configuration PÃTANQUE
    mode: 'melee_fixe',
    format: 'doublette',
    maxPoints: 13,
    timeLimit: false,
    timeLimitMinutes: 60,
    
    // NOUVELLES OPTIONS PÃTANQUE
    pouleSize: 4, // 4, 5 ou 6 Ã©quipes par poule
    eliminationFormat: 'simple', // simple ou double Ã©limination
    meleeRotation: 'par_tour', // par_tour ou par_match (pour mÃªlÃ©e tournante)
    qualifiedPerPoule: 2, // Nombre de qualifiÃ©s par poule
    consolante: true, // Petite finale pour la 3Ã¨me place
    
    // Ãtape 3 - Joueurs
    selectedPlayers: [] as string[],
    newPlayers: [] as { name: string, gender: 'H' | 'F', email?: string, phone?: string }[],
    
    // Options avancÃ©es
    visibility: 'private',
    allowPhotos: true,
    sendNotifications: true,
    fairPlay: true, // Notation fair-play activÃ©e
    recordMenes: true // Enregistrer le dÃ©tail des mÃ¨nes
  })

  // Cleanup des timeouts
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    if (user && organization) {
      loadPlayers()
    } else if (!user) {
      router.push('/login')
    }
  }, [user, organization, router])

  const loadPlayers = async () => {
    if (!organization) return
    
    setLoadingPlayers(true)
    try {
      const { data: playersData, error } = await supabase
        .from('joueurs')
        .select('*')
        .eq('org_id', organization.id)
        .order('name')

      if (error) throw error
      if (playersData) {
        setAvailablePlayers(playersData)
      }
    } catch (error) {
      console.error('Erreur chargement joueurs:', error)
    } finally {
      setLoadingPlayers(false)
    }
  }

  const steps = [
    { number: 1, title: 'Informations', icon: Icons.trophy, color: 'from-blue-500 to-indigo-600' },
    { number: 2, title: 'Configuration', icon: Icons.gamepad, color: 'from-purple-500 to-pink-600' },
    { number: 3, title: 'Joueurs', icon: Icons.users, color: 'from-green-500 to-emerald-600' },
    { number: 4, title: 'Validation', icon: Icons.check, color: 'from-orange-500 to-red-600' }
  ]

  const modes = [
    {
      value: 'choisi',
      title: 'Mode Choisi',
      description: 'Les joueurs forment leurs propres Ã©quipes',
      detail: 'IdÃ©al pour les tournois officiels',
      icon: Icons.users,
      gradient: 'from-blue-400 to-blue-600',
      recommended: false
    },
    {
      value: 'melee_fixe',
      title: 'MÃªlÃ©e Fixe',
      description: 'Ãquipes tirÃ©es au sort qui restent ensemble',
      detail: 'Parfait pour la convivialitÃ©',
      icon: Icons.lightning,
      gradient: 'from-purple-400 to-purple-600',
      recommended: true
    },
    {
      value: 'melee_tournante',
      title: 'MÃªlÃ©e Tournante',
      description: 'Nouvelles Ã©quipes selon votre choix',
      detail: 'Maximum de rencontres',
      icon: Icons.shuffle,
      gradient: 'from-green-400 to-green-600',
      recommended: false
    }
  ]

  const formats = [
    {
      value: 'doublette',
      title: 'Doublette',
      description: '2 joueurs par Ã©quipe',
      minPlayers: 4,
      icon: 'ð¥',
      gradient: 'from-orange-400 to-orange-600'
    },
    {
      value: 'triplette',
      title: 'Triplette',
      description: '3 joueurs par Ã©quipe',
      minPlayers: 6,
      icon: 'ð¥ð¤',
      gradient: 'from-indigo-400 to-indigo-600'
    }
  ]

  const togglePlayer = (playerId: string) => {
    setFormData({
      ...formData,
      selectedPlayers: formData.selectedPlayers.includes(playerId)
        ? formData.selectedPlayers.filter(id => id !== playerId)
        : [...formData.selectedPlayers, playerId]
    })
  }

  const addNewPlayer = () => {
    setFormData({
      ...formData,
      newPlayers: [...formData.newPlayers, { name: '', gender: 'H', email: '', phone: '' }]
    })
    // Auto-scroll vers le bas aprÃ¨s ajout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(() => {
      newPlayersRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 100)
  }

  const updateNewPlayer = (index: number, field: string, value: string) => {
    const updated = [...formData.newPlayers]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, newPlayers: updated })
  }

  const removeNewPlayer = (index: number) => {
    setFormData({
      ...formData,
      newPlayers: formData.newPlayers.filter((_, i) => i !== index)
    })
  }

  const getTotalPlayers = () => {
    return formData.selectedPlayers.length + formData.newPlayers.filter(p => p.name.trim()).length
  }

  const getMinPlayers = () => {
    return formData.format === 'doublette' ? 4 : 6
  }

  const canProceed = () => {
    switch(currentStep) {
      case 1: 
        return formData.name.trim().length > 0 && 
               formData.name.trim().length <= 100 && 
               formData.terrains > 0
      
      case 2: 
        return true
      
      case 3: 
        const totalPlayers = getTotalPlayers()
        const minPlayers = getMinPlayers()
        
        // VÃ©rification supplÃ©mentaire pour mÃªlÃ©e
        if (formData.mode === 'melee_fixe' || formData.mode === 'melee_tournante') {
          const playersPerTeam = formData.format === 'doublette' ? 2 : 3
          const canFormCompleteTeams = totalPlayers % playersPerTeam === 0
          
          if (!canFormCompleteTeams) {
            return false
          }
        }
        
        if (totalPlayers < minPlayers) {
          return false
        }
        
        // VÃ©rifier emails valides
        for (const player of formData.newPlayers) {
          if (player.email && player.email.trim() && !isValidEmail(player.email)) {
            return false
          }
        }
        
        return true
      
      case 4: 
        return true
      
      default: 
        return false
    }
  }

  // Fonction pour gÃ©rer le clic sur Continuer
  const handleContinue = () => {
    try {
      // Effacer l'erreur prÃ©cÃ©dente
      setValidationError('')
      
      // VÃ©rifications spÃ©cifiques Ã  l'Ã©tape 3
      if (currentStep === 3) {
        const totalPlayers = getTotalPlayers()
        const minPlayers = getMinPlayers()
        
        // VÃ©rifier emails invalides
        for (const player of formData.newPlayers) {
          if (player.email && player.email.trim() && !isValidEmail(player.email)) {
            setValidationError(`Email invalide : ${player.email}`)
            return
          }
        }
        
        if (formData.mode === 'melee_fixe' || formData.mode === 'melee_tournante') {
          const playersPerTeam = formData.format === 'doublette' ? 2 : 3
          const canFormCompleteTeams = totalPlayers % playersPerTeam === 0
          
          if (!canFormCompleteTeams) {
            setValidationError(`Pour une ${formData.format}, il faut un nombre de joueurs multiple de ${playersPerTeam}. Vous avez ${totalPlayers} joueurs.`)
            return
          }
        }
        
        if (totalPlayers < minPlayers) {
          setValidationError(`Minimum ${minPlayers} joueurs requis`)
          return
        }
      }
      
      // Si tout est OK, passer Ã  l'Ã©tape suivante
      if (canProceed()) {
        setCurrentStep(currentStep + 1)
      }
    } catch (error) {
      console.error('Erreur dans handleContinue:', error)
      setValidationError('Une erreur est survenue')
    }
  }

  // Fonction pour crÃ©er les Ã©quipes avec mixitÃ©
  const createTeamsWithMixity = async (tournoi: any, allPlayerIds: string[]) => {
    const playersPerTeam = formData.format === 'doublette' ? 2 : 3
    const nbEquipes = Math.floor(allPlayerIds.length / playersPerTeam)
    
    if (formData.mode === 'choisi') {
      // Mode choisi : crÃ©er des Ã©quipes vides
      for (let i = 1; i <= nbEquipes; i++) {
        await supabase
          .from('equipes')
          .insert({
            tournoi_id: tournoi.id,
            name: `Ãquipe ${i}`
          })
      }
    } 
    else if (formData.mode === 'melee_fixe') {
      // Mode mÃªlÃ©e fixe : crÃ©er les Ã©quipes ET assigner les joueurs avec mixitÃ©
      
      // RÃ©cupÃ©rer les infos de genre pour tous les joueurs
      const playersByGender: { H: string[], F: string[] } = { H: [], F: [] }
      
      for (const playerId of allPlayerIds) {
        // Joueur existant
        const existingPlayer = availablePlayers.find(p => p.id === playerId)
        if (existingPlayer) {
          // Gestion du genre null/undefined - par dÃ©faut 'H'
          const gender = existingPlayer.gender === 'F' ? 'F' : 'H'
          playersByGender[gender].push(playerId)
        } else {
          // Nouveau joueur (dans l'ordre aprÃ¨s les selectedPlayers)
          const newPlayerIndex = allPlayerIds.indexOf(playerId) - formData.selectedPlayers.length
          if (newPlayerIndex >= 0 && newPlayerIndex < formData.newPlayers.length) {
            const newPlayer = formData.newPlayers[newPlayerIndex]
            playersByGender[newPlayer.gender].push(playerId)
          }
        }
      }
      
      // MÃ©langer chaque groupe
      playersByGender.H.sort(() => Math.random() - 0.5)
      playersByGender.F.sort(() => Math.random() - 0.5)
      
      // CrÃ©er les Ã©quipes en essayant de respecter la mixitÃ©
      let teamNumber = 1
      const usedPlayers = new Set<string>()
      
      // D'abord crÃ©er les Ã©quipes mixtes possibles
      if (formData.format === 'doublette') {
        // Pour doublette : essayer 1H + 1F
        while (playersByGender.H.length > 0 && playersByGender.F.length > 0 && usedPlayers.size < allPlayerIds.length - playersPerTeam) {
          const teamPlayers = [
            playersByGender.H.shift()!,
            playersByGender.F.shift()!
          ]
          
          await createTeamWithPlayers(tournoi.id, teamNumber++, teamPlayers)
          teamPlayers.forEach(p => usedPlayers.add(p))
        }
      } else {
        // Pour triplette : essayer 2H + 1F ou 1H + 2F
        while ((playersByGender.H.length >= 2 && playersByGender.F.length >= 1) || 
               (playersByGender.H.length >= 1 && playersByGender.F.length >= 2)) {
          const teamPlayers = 
            playersByGender.H.length >= 2 && playersByGender.F.length >= 1
              ? [playersByGender.H.shift()!, playersByGender.H.shift()!, playersByGender.F.shift()!]
              : [playersByGender.H.shift()!, playersByGender.F.shift()!, playersByGender.F.shift()!]
          
          await createTeamWithPlayers(tournoi.id, teamNumber++, teamPlayers)
          teamPlayers.forEach(p => usedPlayers.add(p))
        }
      }
      
      // CrÃ©er les Ã©quipes restantes (non mixtes)
      const remainingPlayers = [...playersByGender.H, ...playersByGender.F]
      while (remainingPlayers.length >= playersPerTeam) {
        const teamPlayers = remainingPlayers.splice(0, playersPerTeam)
        await createTeamWithPlayers(tournoi.id, teamNumber++, teamPlayers)
      }
    }
    else if (formData.mode === 'melee_tournante') {
      // Mode mÃªlÃ©e tournante : crÃ©er une structure pour gÃ©rer les rotations
      // Pour l'instant, on stocke juste les joueurs dans les settings du tournoi
      // Les Ã©quipes seront crÃ©Ã©es dynamiquement Ã  chaque tour
      const { error: updateError } = await supabase
        .from('tournois')
        .update({
          settings: {
            ...tournoi.settings,
            melee_tournante_players: allPlayerIds,
            melee_rotation: formData.meleeRotation
          }
        })
        .eq('id', tournoi.id)
      
      if (updateError) {
        console.error('Erreur mise Ã  jour mÃªlÃ©e tournante:', updateError)
      }
    }
  }

  // Helper pour crÃ©er une Ã©quipe avec ses joueurs
  const createTeamWithPlayers = async (tournoiId: string, teamNumber: number, playerIds: string[]) => {
    const { data: equipe, error: equipeError } = await supabase
      .from('equipes')
      .insert({
        tournoi_id: tournoiId,
        name: `Ãquipe ${teamNumber}`
      })
      .select()
      .single()
    
    if (equipeError) {
      console.error('Erreur crÃ©ation Ã©quipe:', equipeError)
      return
    }
    
    if (equipe) {
      for (let j = 0; j < playerIds.length; j++) {
        const { error: assignError } = await supabase
          .from('equipes_joueurs')
          .insert({
            equipe_id: equipe.id,
            joueur_id: playerIds[j],
            role: j === 0 ? 'capitaine' : 'joueur',
            ordre: j + 1
          })
        
        if (assignError) {
          console.error('Erreur assignation joueur:', assignError)
        }
      }
      console.log(`Ãquipe ${teamNumber} crÃ©Ã©e avec ${playerIds.length} joueurs`)
    }
  }

  // Fonction pour crÃ©er les matchs de poules
  const createPoolMatches = async (tournoi: any) => {
    if (formData.mode === 'melee_tournante') {
      // Pour mÃªlÃ©e tournante, crÃ©er le premier tour seulement
      // Les tours suivants seront crÃ©Ã©s dynamiquement
      console.log('MÃªlÃ©e tournante : crÃ©ation du premier tour')
      // TODO: ImplÃ©menter la crÃ©ation du premier tour pour mÃªlÃ©e tournante
      return
    }

    // RÃ©cupÃ©rer toutes les Ã©quipes crÃ©Ã©es
    const { data: equipes, error: equipesError } = await supabase
      .from('equipes')
      .select('*')
      .eq('tournoi_id', tournoi.id)
      .order('name')
    
    if (!equipes || equipes.length === 0) {
      console.error('Pas d\'Ã©quipes trouvÃ©es')
      return
    }

    // Diviser en poules
    const equipesParPoule = formData.pouleSize
    const nbPoules = Math.ceil(equipes.length / equipesParPoule)
    
    let globalMatchNum = 0
    
    for (let pouleNum = 0; pouleNum < nbPoules; pouleNum++) {
      const pouleStart = pouleNum * equipesParPoule
      const pouleEnd = Math.min(pouleStart + equipesParPoule, equipes.length)
      const equipesPoule = equipes.slice(pouleStart, pouleEnd)
      
      // CrÃ©er tous les matchs de cette poule (round-robin)
      for (let i = 0; i < equipesPoule.length; i++) {
        for (let j = i + 1; j < equipesPoule.length; j++) {
          const terrainNum = (globalMatchNum % formData.terrains) + 1
          const tour = Math.floor(globalMatchNum / formData.terrains) + 1
          
          const { error: matchError } = await supabase
            .from('matches')
            .insert({
              tournoi_id: tournoi.id,
              equipe_a_id: equipesPoule[i].id,
              equipe_b_id: equipesPoule[j].id,
              terrain: terrainNum,
              tour: tour,
              status: 'a_jouer',
              score_a: 0,
              score_b: 0,
              manches_json: []
            })
          
          if (matchError) {
            console.error('Erreur crÃ©ation match:', matchError)
          }
          globalMatchNum++
        }
      }
    }
    
    console.log(`${globalMatchNum} matchs de poules crÃ©Ã©s`)
  }

  const handleSubmit = async () => {
    if (!user || !organization) {
      alert('Vous devez Ãªtre connectÃ©')
      return
    }

    setSavingTournament(true)
    setLoading(true)
    
    try {
      // 1. CrÃ©er les nouveaux joueurs
      const newPlayerIds = []
      for (const newPlayer of formData.newPlayers) {
        if (newPlayer.name.trim()) {
          const { data, error } = await supabase
            .from('joueurs')
            .insert({
              org_id: organization.id,
              name: newPlayer.name.trim(),
              gender: newPlayer.gender || 'H', // Valeur par dÃ©faut si undefined
              email: newPlayer.email?.trim() || null,
              phone: newPlayer.phone?.trim() || null
            })
            .select()
            .single()
          
          if (error) {
            console.error('Erreur crÃ©ation joueur:', error)
            // On continue mais on note l'erreur
            alert(`Attention : impossible de crÃ©er le joueur ${newPlayer.name}`)
          } else if (data) {
            newPlayerIds.push(data.id)
          }
        }
      }

      // 2. CrÃ©er le tournoi avec TOUTES les options pÃ©tanque
      const allPlayerIds = [...formData.selectedPlayers, ...newPlayerIds]
      
      // VÃ©rification finale du nombre de joueurs
      if (allPlayerIds.length === 0) {
        throw new Error('Aucun joueur sÃ©lectionnÃ©')
      }
      
      const { data: tournoi, error: tournoiError } = await supabase
        .from('tournois')
        .insert({
          org_id: organization.id,
          name: formData.name.trim(),
          mode: formData.mode,
          format: formData.format,
          status: 'preparation',
          visibility: formData.visibility,
          settings: {
            date: formData.date,
            time: formData.time,
            location: formData.location?.trim() || null,
            terrains: formData.terrains,
            maxPoints: formData.maxPoints,
            timeLimit: formData.timeLimit,
            timeLimitMinutes: formData.timeLimitMinutes,
            // NOUVELLES OPTIONS PÃTANQUE
            pouleSize: formData.pouleSize,
            eliminationFormat: formData.eliminationFormat,
            meleeRotation: formData.mode === 'melee_tournante' ? formData.meleeRotation : null,
            qualifiedPerPoule: formData.qualifiedPerPoule,
            consolante: formData.consolante,
            fairPlay: formData.fairPlay,
            recordMenes: formData.recordMenes,
            // Autres
            allowPhotos: formData.allowPhotos,
            sendNotifications: formData.sendNotifications,
            players: allPlayerIds,
            totalPlayers: allPlayerIds.length
          }
        })
        .select()
        .single()

      if (tournoiError) {
        throw tournoiError
      }

      if (!tournoi) {
        throw new Error('Erreur lors de la crÃ©ation du tournoi')
      }

      // 3. CrÃ©er les Ã©quipes selon le mode (avec gestion de la mixitÃ©)
      await createTeamsWithMixity(tournoi, allPlayerIds)
      
      // 4. CrÃ©er les matchs de poules
      await createPoolMatches(tournoi)
      
      // 5. Mettre Ã  jour le statut du tournoi
      const { error: updateError } = await supabase
        .from('tournois')
        .update({ 
          status: 'en_cours',
          settings: {
            ...tournoi.settings,
            poules_created: true,
            start_time: new Date().toISOString()
          }
        })
        .eq('id', tournoi.id)
      
      if (updateError) {
        console.error('Erreur mise Ã  jour statut:', updateError)
      }
      
      // 6. Animation de succÃ¨s
      setSuccessAnimation(true)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 7. Redirection vers la page du tournoi
      router.push(`/tournoi/${tournoi.id}`)
      
    } catch (error) {
      console.error('Erreur crÃ©ation tournoi:', error)
      alert(error instanceof Error ? error.message : 'Une erreur est survenue lors de la crÃ©ation du tournoi')
    } finally {
      setSavingTournament(false)
      setLoading(false)
    }
  }

  // Protection contre les erreurs de division par zÃ©ro
  const getEstimatedTeams = () => {
    const total = getTotalPlayers()
    if (total === 0) return 0
    const playersPerTeam = formData.format === 'doublette' ? 2 : 3
    return Math.floor(total / playersPerTeam)
  }

  const getEstimatedPools = () => {
    const teams = getEstimatedTeams()
    if (teams === 0 || formData.pouleSize === 0) return 0
    return Math.ceil(teams / formData.pouleSize)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      {/* Particules animÃ©es */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header glassmorphism avec logo pÃ©tanque */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
                {Icons.petanque}
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Nouveau Tournoi de PÃ©tanque
                </h1>
                <p className="text-xs text-gray-500">CrÃ©ez votre compÃ©tition en quelques clics</p>
              </div>
            </div>
            
            <button 
              onClick={() => router.push('/dashboard')}
              className="group flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              {Icons.x}
              <span>Annuler</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className={`mb-12 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="relative">
                  {currentStep === step.number && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-full animate-ping opacity-20`}></div>
                  )}
                  
                  <div className={`
                    relative w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg
                    transition-all duration-500 transform
                    ${currentStep >= step.number 
                      ? `bg-gradient-to-br ${step.color} text-white shadow-lg scale-100` 
                      : 'bg-gray-200 text-gray-400 scale-90'}
                    ${currentStep === step.number ? 'ring-4 ring-white shadow-2xl scale-110' : ''}
                  `}>
                    {currentStep > step.number ? Icons.check : step.icon}
                  </div>
                  
                  <div className={`absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap text-xs font-medium transition-all duration-500 ${
                    currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                </div>
                
                {index < steps.length - 1 && (
                  <div className="w-24 h-1 mx-4">
                    <div className="h-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${step.color} transition-all duration-700`}
                        style={{ width: currentStep > step.number ? '100%' : '0%' }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contenu des Ã©tapes */}
        <div className={`mt-16 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          
          {/* Ãtape 1: Informations */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                    {Icons.sparkles}
                    <span className="ml-3">Informations gÃ©nÃ©rales</span>
                  </h2>
                  <p className="text-gray-600">DÃ©finissez les bases de votre tournoi de pÃ©tanque</p>
                </div>
                
                <div className="p-8 space-y-6">
                  {/* Nom du tournoi */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du tournoi * (max 100 caractÃ¨res)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value.slice(0, 100)})}
                        className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-lg"
                        placeholder="Ex: Tournoi de Printemps 2025"
                        maxLength={100}
                      />
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                        <span className="text-xs text-gray-400">{formData.name.length}/100</span>
                        {formData.name && (
                          <div className="text-green-500 animate-fadeIn">
                            {Icons.check}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date et Heure */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date du tournoi *
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          {Icons.calendar}
                        </div>
                        <input
                          type="date"
                          value={formData.date}
                          onChange={(e) => setFormData({...formData, date: e.target.value})}
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="group">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Heure de dÃ©but *
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                          {Icons.clock}
                        </div>
                        <input
                          type="time"
                          value={formData.time}
                          onChange={(e) => setFormData({...formData, time: e.target.value})}
                          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Lieu */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lieu (optionnel)
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        {Icons.map}
                      </div>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                        placeholder="Ex: Boulodrome Municipal"
                      />
                    </div>
                  </div>

                  {/* Nombre de terrains */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Nombre de terrains disponibles: <span className="text-2xl font-bold text-blue-600">{formData.terrains}</span>
                    </label>
                    <div className="relative">
                      <input
                        type="range"
                        min="1"
                        max="12"
                        value={formData.terrains}
                        onChange={(e) => setFormData({...formData, terrains: parseInt(e.target.value)})}
                        className="w-full h-3 bg-gray-200 rounded-full appearance-none cursor-pointer slider"
                      />
                      <div className="flex justify-between mt-2">
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                          <span key={n} className={`text-xs ${formData.terrains >= n ? 'text-blue-600 font-bold' : 'text-gray-400'}`}>
                            {n}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ãtape 2: Configuration AMÃLIORÃE */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-fadeIn">
              {/* Mode de jeu */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl text-white mr-3">
                    {Icons.gamepad}
                  </div>
                  Mode de jeu
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {modes.map((mode) => (
                    <button
                      key={mode.value}
                      onClick={() => setFormData({...formData, mode: mode.value})}
                      className={`group relative p-6 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                        formData.mode === mode.value
                          ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      {mode.recommended && (
                        <span className="absolute -top-3 -right-3 px-3 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                          Populaire
                        </span>
                      )}
                      
                      <div className={`inline-flex p-3 rounded-xl mb-3 bg-gradient-to-br ${mode.gradient} text-white`}>
                        {mode.icon}
                      </div>
                      
                      <h4 className="font-bold text-gray-900 mb-1">{mode.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{mode.description}</p>
                      <p className="text-xs text-gray-500">{mode.detail}</p>
                      
                      {formData.mode === mode.value && (
                        <div className="absolute top-3 left-3 text-purple-500 animate-fadeIn">
                          {Icons.check}
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                {/* Options spÃ©cifiques mÃªlÃ©e tournante */}
                {formData.mode === 'melee_tournante' && (
                  <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl animate-fadeIn">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                      {Icons.shuffle}
                      <span className="ml-2">Rotation des Ã©quipes</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setFormData({...formData, meleeRotation: 'par_tour'})}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.meleeRotation === 'par_tour'
                            ? 'border-green-500 bg-white shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-gray-900">Par tour</p>
                        <p className="text-xs text-gray-600 mt-1">Nouvelles Ã©quipes Ã  chaque tour (recommandÃ©)</p>
                      </button>
                      <button
                        onClick={() => setFormData({...formData, meleeRotation: 'par_match'})}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.meleeRotation === 'par_match'
                            ? 'border-green-500 bg-white shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-gray-900">Par match</p>
                        <p className="text-xs text-gray-600 mt-1">Nouvelles Ã©quipes aprÃ¨s chaque partie</p>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Format */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl text-white mr-3">
                    {Icons.users}
                  </div>
                  Format des Ã©quipes
                </h3>
                
                <div className="grid grid-cols-2 gap-6">
                  {formats.map((format) => (
                    <button
                      key={format.value}
                      onClick={() => setFormData({...formData, format: format.value})}
                      className={`group relative p-8 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                        formData.format === format.value
                          ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-red-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-5xl mb-4">{format.icon}</div>
                      
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{format.title}</h4>
                      <p className="text-gray-600">{format.description}</p>
                      <p className="text-sm text-gray-500 mt-2">Min. {format.minPlayers} joueurs</p>
                      
                      {formData.format === format.value && (
                        <div className="absolute top-4 right-4 text-orange-500 animate-fadeIn">
                          {Icons.check}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Configuration du tournoi PÃTANQUE */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  {Icons.settings}
                  <span className="ml-2">Configuration du tournoi</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Taille des poules */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Taille des poules
                    </label>
                    <select
                      value={formData.pouleSize}
                      onChange={(e) => setFormData({...formData, pouleSize: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500"
                    >
                      <option value={4}>4 Ã©quipes par poule</option>
                      <option value={5}>5 Ã©quipes par poule</option>
                      <option value={6}>6 Ã©quipes par poule</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Chaque Ã©quipe jouera {formData.pouleSize - 1} matchs en poule</p>
                  </div>

                  {/* QualifiÃ©s par poule */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      QualifiÃ©s par poule
                    </label>
                    <select
                      value={formData.qualifiedPerPoule}
                      onChange={(e) => setFormData({...formData, qualifiedPerPoule: parseInt(e.target.value)})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500"
                    >
                      <option value={1}>Le 1er de chaque poule</option>
                      <option value={2}>Les 2 premiers</option>
                      {formData.pouleSize >= 6 && <option value={3}>Les 3 premiers</option>}
                    </select>
                  </div>

                  {/* Format Ã©limination */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format des phases finales
                    </label>
                    <select
                      value={formData.eliminationFormat}
                      onChange={(e) => setFormData({...formData, eliminationFormat: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500"
                    >
                      <option value="simple">Ãlimination simple</option>
                      <option value="double">Double Ã©limination (avec repÃªchage)</option>
                    </select>
                  </div>

                  {/* Points pour gagner */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points pour gagner: <span className="text-xl font-bold text-purple-600">{formData.maxPoints}</span>
                    </label>
                    <input
                      type="range"
                      min="7"
                      max="15"
                      value={formData.maxPoints}
                      onChange={(e) => setFormData({...formData, maxPoints: parseInt(e.target.value)})}
                      className="w-full h-2 bg-gray-200 rounded-full appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between mt-1">
                      {[7,9,11,13,15].map(n => (
                        <span key={n} className={`text-xs ${formData.maxPoints === n ? 'text-purple-600 font-bold' : 'text-gray-400'}`}>
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

{/* Options supplÃ©mentaires */}
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
                 {/* Petite finale */}
                 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                   <div>
                     <p className="font-medium text-gray-900">Petite finale</p>
                     <p className="text-xs text-gray-500">Match pour la 3Ã¨me place</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={formData.consolante}
                       onChange={(e) => setFormData({...formData, consolante: e.target.checked})}
                       className="sr-only peer"
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>

                 {/* Enregistrer les mÃ¨nes */}
                 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                   <div>
                     <p className="font-medium text-gray-900">DÃ©tail des mÃ¨nes</p>
                     <p className="text-xs text-gray-500">Enregistrer chaque mÃ¨ne jouÃ©e</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={formData.recordMenes}
                       onChange={(e) => setFormData({...formData, recordMenes: e.target.checked})}
                       className="sr-only peer"
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>

                 {/* Fair-play */}
                 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                   <div>
                     <p className="font-medium text-gray-900">Notation fair-play</p>
                     <p className="text-xs text-gray-500">Ãvaluer l'esprit sportif</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={formData.fairPlay}
                       onChange={(e) => setFormData({...formData, fairPlay: e.target.checked})}
                       className="sr-only peer"
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>

                 {/* Limite de temps */}
                 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                   <div>
                     <p className="font-medium text-gray-900">Limite de temps</p>
                     <p className="text-xs text-gray-500">Pour tournois rapides</p>
                   </div>
                   <label className="relative inline-flex items-center cursor-pointer">
                     <input 
                       type="checkbox" 
                       checked={formData.timeLimit}
                       onChange={(e) => setFormData({...formData, timeLimit: e.target.checked})}
                       className="sr-only peer"
                     />
                     <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                   </label>
                 </div>
               </div>

               {formData.timeLimit && (
                 <div className="mt-4 p-4 bg-yellow-50 rounded-xl animate-fadeIn">
                   <label className="block text-sm font-medium text-gray-700 mb-2">
                     DurÃ©e maximum par match (minutes)
                   </label>
                   <input
                     type="number"
                     min="15"
                     max="120"
                     value={formData.timeLimitMinutes}
                     onChange={(e) => setFormData({...formData, timeLimitMinutes: parseInt(e.target.value)})}
                     className="w-32 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-purple-500"
                   />
                 </div>
               )}
             </div>
           </div>
         )}

         {/* Ãtape 3: Joueurs AMÃLIORÃ */}
         {currentStep === 3 && (
           <div className="space-y-6 animate-fadeIn">
             {/* Message d'erreur de validation */}
             {validationError && (
               <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
                 <div className="text-red-500 mr-3">{Icons.alert}</div>
                 <p className="text-red-700">{validationError}</p>
               </div>
             )}

             <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
               <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-50">
                 <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                   {Icons.users}
                   <span className="ml-3">SÃ©lection des joueurs</span>
                 </h2>
                 <div className="flex items-center justify-between">
                   <p className="text-gray-600">Choisissez les participants au tournoi</p>
                   <div className="flex items-center space-x-4">
                     <span className="px-4 py-2 bg-white rounded-xl font-medium shadow-sm">
                       <span className="text-2xl font-bold text-gray-900">{getTotalPlayers()}</span>
                       <span className="text-gray-600 ml-1">joueurs</span>
                     </span>
                     <span className={`px-4 py-2 rounded-xl font-medium ${
                       getTotalPlayers() >= getMinPlayers()
                         ? 'bg-green-100 text-green-700'
                         : 'bg-orange-100 text-orange-700'
                     }`}>
                       Min. {getMinPlayers()} requis
                     </span>
                   </div>
                 </div>
               </div>

               <div className="p-8">
                 {/* Joueurs existants */}
                 <div className="mb-8">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-gray-900">
                       Joueurs du club ({availablePlayers.length})
                     </h3>
                     {availablePlayers.length > 0 && (
                       <button
                         onClick={() => {
                           if (formData.selectedPlayers.length === availablePlayers.length) {
                             setFormData({...formData, selectedPlayers: []})
                           } else {
                             setFormData({...formData, selectedPlayers: availablePlayers.map(p => p.id)})
                           }
                         }}
                         className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                       >
                         {formData.selectedPlayers.length === availablePlayers.length 
                           ? 'DÃ©sÃ©lectionner tout' 
                           : 'SÃ©lectionner tout'
                         }
                       </button>
                     )}
                   </div>
                   
                   {loadingPlayers ? (
                     <div className="flex justify-center py-12">
                       <div className="text-center">
                         {Icons.loader}
                         <p className="mt-4 text-gray-500">Chargement des joueurs...</p>
                       </div>
                     </div>
                   ) : availablePlayers.length === 0 ? (
                     <div className="text-center py-12 bg-gray-50 rounded-2xl">
                       <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                         {Icons.users}
                       </div>
                       <p className="text-gray-500 mb-2">Aucun joueur dans le club</p>
                       <p className="text-sm text-gray-400">Ajoutez des joueurs ci-dessous</p>
                     </div>
                   ) : (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                       {availablePlayers.map((player) => (
                         <button
                           key={player.id}
                           onClick={() => togglePlayer(player.id)}
                           className={`group relative p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                             formData.selectedPlayers.includes(player.id)
                               ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm'
                               : 'border-gray-200 hover:border-gray-300 bg-white'
                           }`}
                         >
                           <div className="flex items-center">
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3 bg-gradient-to-br ${
                               player.gender === 'F' ? 'from-pink-500 to-rose-600' : 'from-blue-500 to-indigo-600'
                             } group-hover:scale-110 transition-transform`}>
                               {player.name.charAt(0).toUpperCase()}
                             </div>
                             <div className="text-left flex-1">
                               <p className="font-medium text-gray-900">{player.name}</p>
                               <div className="flex items-center space-x-2 text-xs text-gray-500">
                                 <span className={`px-2 py-0.5 rounded-full ${
                                   player.gender === 'F' 
                                     ? 'bg-pink-100 text-pink-700' 
                                     : 'bg-blue-100 text-blue-700'
                                 }`}>
                                   {player.gender === 'F' ? 'Femme' : 'Homme'}
                                 </span>
                                 {player.email && (
                                   <span className="truncate max-w-[120px]">{player.email}</span>
                                 )}
                               </div>
                             </div>
                             {formData.selectedPlayers.includes(player.id) && (
                               <div className="ml-auto text-green-500 animate-fadeIn">
                                 {Icons.check}
                               </div>
                             )}
                           </div>
                         </button>
                       ))}
                     </div>
                   )}
                 </div>

                 {/* Nouveaux joueurs AMÃLIORÃ */}
                 <div className="border-t pt-8">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-bold text-gray-900">Ajouter de nouveaux joueurs</h3>
                   </div>
                   
                   {formData.newPlayers.length === 0 ? (
                     <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                       <p className="text-gray-500 mb-4">Cliquez sur le bouton pour inscrire de nouveaux participants</p>
                       <button
                         onClick={addNewPlayer}
                         className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
                       >
                         {Icons.plus}
                         <span className="ml-2">Ajouter un joueur</span>
                       </button>
                     </div>
                   ) : (
                     <div className="space-y-3 max-h-96 overflow-y-auto pr-2" ref={newPlayersRef}>
                       {formData.newPlayers.map((player, index) => (
                         <div key={index} className="flex gap-3 p-4 bg-gray-50 rounded-xl animate-fadeIn">
                           <input
                             type="text"
                             placeholder="Nom complet *"
                             value={player.name}
                             onChange={(e) => updateNewPlayer(index, 'name', e.target.value)}
                             className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100"
                           />
                           <select
                             value={player.gender}
                             onChange={(e) => updateNewPlayer(index, 'gender', e.target.value)}
                             className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500"
                           >
                             <option value="H">Homme</option>
                             <option value="F">Femme</option>
                           </select>
                           <input
                             type="email"
                             placeholder="Email (optionnel)"
                             value={player.email}
                             onChange={(e) => updateNewPlayer(index, 'email', e.target.value)}
                             className={`flex-1 px-4 py-3 border-2 rounded-xl focus:border-green-500 ${
                               player.email && player.email.trim() && !isValidEmail(player.email)
                                 ? 'border-red-300 bg-red-50'
                                 : 'border-gray-200'
                             }`}
                           />
                           <button
                             onClick={() => removeNewPlayer(index)}
                             className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                           >
                             {Icons.x}
                           </button>
                         </div>
                       ))}
                     </div>
                   )}

                   {/* Bouton flottant pour ajouter un joueur */}
                   {formData.newPlayers.length > 0 && (
                     <div className="mt-4 sticky bottom-0 bg-white pt-4 border-t">
                       <button
                         onClick={addNewPlayer}
                         className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105"
                       >
                         {Icons.plus}
                         <span className="ml-2">Ajouter un autre joueur</span>
                       </button>
                     </div>
                   )}
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Ãtape 4: Validation AMÃLIORÃE */}
         {currentStep === 4 && (
           <div className="space-y-6 animate-fadeIn">
             <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
               <div className="p-8 bg-gradient-to-br from-orange-50 to-red-50">
                 <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                   {Icons.sparkles}
                   <span className="ml-3">RÃ©capitulatif du tournoi</span>
                 </h2>
                 <p className="text-gray-600">VÃ©rifiez les informations avant de crÃ©er le tournoi</p>
               </div>

               <div className="p-8">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {[
                     { label: 'Nom', value: formData.name || 'Non dÃ©fini', icon: Icons.trophy },
                     { label: 'Date', value: new Date(formData.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), icon: Icons.calendar },
                     { label: 'Heure', value: formData.time, icon: Icons.clock },
                     { label: 'Lieu', value: formData.location || 'Non spÃ©cifiÃ©', icon: Icons.map },
                     { label: 'Mode', value: modes.find(m => m.value === formData.mode)?.title, icon: Icons.gamepad },
                     { label: 'Format', value: formats.find(f => f.value === formData.format)?.title, icon: Icons.users },
                     { label: 'Terrains', value: `${formData.terrains} terrain${formData.terrains > 1 ? 's' : ''}`, icon: Icons.grid },
                     { label: 'Joueurs', value: `${getTotalPlayers()} participant${getTotalPlayers() > 1 ? 's' : ''}`, icon: Icons.users },
                     { label: 'Points pour gagner', value: formData.maxPoints, icon: Icons.trophy },
                     { label: 'Taille des poules', value: `${formData.pouleSize} Ã©quipes`, icon: Icons.grid },
                     { label: 'QualifiÃ©s/poule', value: formData.qualifiedPerPoule === 1 ? '1er' : `${formData.qualifiedPerPoule} premiers`, icon: Icons.star },
                     { label: 'Phases finales', value: formData.eliminationFormat === 'simple' ? 'Ãlimination simple' : 'Double Ã©limination', icon: Icons.flag }
                   ].map((item, index) => (
                     <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100">
                       <div className="flex items-center">
                         <div className="p-2.5 bg-white rounded-lg text-gray-400 mr-3 shadow-sm">
                           {item.icon}
                         </div>
                         <span className="text-sm text-gray-600">{item.label}</span>
                       </div>
                       <span className="font-bold text-gray-900">{item.value}</span>
                     </div>
                   ))}
                 </div>

                 {/* Options spÃ©ciales pour mÃªlÃ©e tournante */}
                 {formData.mode === 'melee_tournante' && (
                   <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                     <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                       {Icons.shuffle}
                       <span className="ml-2">Configuration MÃªlÃ©e Tournante</span>
                     </h4>
                     <p className="text-sm text-gray-700">
                       Rotation des Ã©quipes : <span className="font-bold">
                         {formData.meleeRotation === 'par_tour' ? 'Par tour' : 'AprÃ¨s chaque match'}
                       </span>
                     </p>
                     <p className="text-xs text-gray-600 mt-1">
                       {formData.meleeRotation === 'par_tour' 
                         ? 'Les Ã©quipes seront reformÃ©es Ã  chaque nouveau tour'
                         : 'Les Ã©quipes seront reformÃ©es aprÃ¨s chaque match jouÃ©'
                       }
                     </p>
                   </div>
                 )}

                 {/* Options activÃ©es */}
                 <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                   <h4 className="font-bold text-gray-900 mb-3">Options activÃ©es</h4>
                   <div className="grid grid-cols-2 gap-2">
                     {formData.consolante && (
                       <div className="flex items-center text-sm text-gray-700">
                         {Icons.check}
                         <span className="ml-2">Petite finale (3Ã¨me place)</span>
                       </div>
                     )}
                     {formData.recordMenes && (
                       <div className="flex items-center text-sm text-gray-700">
                         {Icons.check}
                         <span className="ml-2">Enregistrement des mÃ¨nes</span>
                       </div>
                     )}
                     {formData.fairPlay && (
                       <div className="flex items-center text-sm text-gray-700">
                         {Icons.check}
                         <span className="ml-2">Notation fair-play</span>
                       </div>
                     )}
                     {formData.timeLimit && (
                       <div className="flex items-center text-sm text-gray-700">
                         {Icons.check}
                         <span className="ml-2">Limite de temps ({formData.timeLimitMinutes} min)</span>
                       </div>
                     )}
                     {formData.allowPhotos && (
                       <div className="flex items-center text-sm text-gray-700">
                         {Icons.check}
                         <span className="ml-2">Photos autorisÃ©es</span>
                       </div>
                     )}
                     {formData.sendNotifications && (
                       <div className="flex items-center text-sm text-gray-700">
                         {Icons.check}
                         <span className="ml-2">Notifications activÃ©es</span>
                       </div>
                     )}
                   </div>
                 </div>

                 {/* RÃ©sumÃ© des joueurs */}
                 <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                   <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                     {Icons.users}
                     <span className="ml-2">Participants ({getTotalPlayers()})</span>
                   </h4>

                   {/* Statistiques H/F */}
                   <div className="mb-4 p-3 bg-white rounded-xl">
                     <div className="flex justify-around text-center">
                       <div>
                         <p className="text-2xl font-bold text-blue-600">
                           {[
                             ...availablePlayers.filter(p => formData.selectedPlayers.includes(p.id) && p.gender !== 'F'),
                             ...formData.newPlayers.filter(p => p.name.trim() && p.gender === 'H')
                           ].length}
                         </p>
                         <p className="text-xs text-gray-600">Hommes</p>
                       </div>
                       <div className="w-px bg-gray-200"></div>
                       <div>
                         <p className="text-2xl font-bold text-pink-600">
                           {[
                             ...availablePlayers.filter(p => formData.selectedPlayers.includes(p.id) && p.gender === 'F'),
                             ...formData.newPlayers.filter(p => p.name.trim() && p.gender === 'F')
                           ].length}
                         </p>
                         <p className="text-xs text-gray-600">Femmes</p>
                       </div>
                       <div className="w-px bg-gray-200"></div>
                       <div>
                         <p className="text-2xl font-bold text-green-600">
                           {getEstimatedTeams()}
                         </p>
                         <p className="text-xs text-gray-600">Ãquipes possibles</p>
                       </div>
                     </div>
                   </div>

                   <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                     {/* Joueurs existants sÃ©lectionnÃ©s */}
                     {availablePlayers
                       .filter(p => formData.selectedPlayers.includes(p.id))
                       .map(player => (
                         <div key={player.id} className="flex items-center space-x-2 p-2 bg-white rounded-lg">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br ${
                             player.gender === 'F' ? 'from-pink-500 to-rose-600' : 'from-blue-500 to-indigo-600'
                           }`}>
                             {player.name.charAt(0)}
                           </div>
                           <span className="text-sm text-gray-700">{player.name}</span>
                         </div>
                       ))}
                     {/* Nouveaux joueurs */}
                     {formData.newPlayers
                       .filter(p => p.name.trim())
                       .map((player, index) => (
                         <div key={`new-${index}`} className="flex items-center space-x-2 p-2 bg-white rounded-lg">
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br ${
                             player.gender === 'F' ? 'from-pink-500 to-rose-600' : 'from-blue-500 to-indigo-600'
                           }`}>
                             {player.name.charAt(0)}
                           </div>
                           <span className="text-sm text-gray-700">{player.name}</span>
                           <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Nouveau</span>
                         </div>
                       ))}
                   </div>
                 </div>

                 {/* Estimation du dÃ©roulement */}
                 <div className="mt-6 p-6 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl">
                   <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                     {Icons.petanque}
                     <span className="ml-2">Estimation du tournoi</span>
                   </h4>
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <p className="text-sm text-gray-600">Nombre de poules</p>
                       <p className="text-lg font-bold text-gray-900">
                         {getEstimatedPools()}
                       </p>
                     </div>
                     <div>
                       <p className="text-sm text-gray-600">Matchs en poule/Ã©quipe</p>
                       <p className="text-lg font-bold text-gray-900">{formData.pouleSize - 1}</p>
                     </div>
                     <div>
                       <p className="text-sm text-gray-600">Ãquipes en phases finales</p>
                       <p className="text-lg font-bold text-gray-900">
                         {getEstimatedPools() * formData.qualifiedPerPoule}
                       </p>
                     </div>
                     <div>
                       <p className="text-sm text-gray-600">DurÃ©e estimÃ©e</p>
                       <p className="text-lg font-bold text-gray-900">
                         {formData.timeLimit 
                           ? `${Math.ceil((formData.pouleSize - 1 + 3) * formData.timeLimitMinutes / 60)}h`
                           : '3-5h'
                         }
                       </p>
                     </div>
                   </div>
                 </div>

                 {/* Message de confirmation */}
                 <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border-2 border-green-200">
                   <div className="flex items-start">
                     <div className="p-2 bg-green-100 rounded-xl text-green-600 mr-3">
                       {Icons.info}
                     </div>
                     <div>
                       <h4 className="font-bold text-gray-900 mb-1">Tout est prÃªt !</h4>
                       <p className="text-sm text-gray-600">
                         Votre tournoi de pÃ©tanque sera crÃ©Ã© avec ces paramÃ¨tres. 
                         {formData.mode === 'choisi' 
                           ? " Vous pourrez ensuite composer les Ã©quipes manuellement."
                           : formData.mode === 'melee_fixe'
                           ? " Les Ã©quipes seront tirÃ©es au sort automatiquement au dÃ©marrage."
                           : " Les Ã©quipes seront reformÃ©es selon votre configuration."
                         }
                       </p>
                     </div>
                   </div>
                 </div>
               </div>
             </div>

             {/* Bouton de crÃ©ation */}
             <div className="text-center">
               <button
                 onClick={handleSubmit}
                 disabled={loading || savingTournament}
                 className={`
                   relative px-12 py-5 text-lg font-bold rounded-2xl transition-all transform
                   ${successAnimation 
                     ? 'bg-green-600 text-white scale-105 shadow-2xl' 
                     : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-2xl hover:scale-105'
                   }
                   ${loading ? 'opacity-75 cursor-wait' : ''}
                   disabled:opacity-50 disabled:cursor-not-allowed
                 `}
               >
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 rounded-2xl"></div>
                 
                 <span className="relative flex items-center justify-center">
                   {savingTournament ? (
                     <>
                       {Icons.loader}
                       <span className="ml-3">CrÃ©ation en cours...</span>
                     </>
                   ) : successAnimation ? (
                     <>
                       {Icons.check}
                       <span className="ml-3">Tournoi crÃ©Ã© !</span>
                     </>
                   ) : (
                     <>
                       {Icons.trophy}
                       <span className="ml-3">CrÃ©er le tournoi</span>
                     </>
                   )}
                 </span>
               </button>

               {savingTournament && (
                 <p className="mt-4 text-sm text-gray-500 animate-pulse">
                   Enregistrement du tournoi et prÃ©paration des poules...
                 </p>
               )}
             </div>
           </div>
         )}
       </div>

       {/* Boutons de navigation */}
       <div className="flex justify-between mt-12">
         <button
           onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
           className={`px-6 py-3 rounded-xl font-medium transition-all ${
             currentStep === 1 
               ? 'text-gray-400 cursor-not-allowed' 
               : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
           }`}
           disabled={currentStep === 1}
         >
           â Retour
         </button>

         {currentStep < 4 && (
           <button
             onClick={handleContinue}
             disabled={!canProceed()}
             className={`
               flex items-center px-8 py-3 rounded-xl font-medium transition-all
               ${canProceed()
                 ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg hover:scale-105'
                 : 'bg-gray-200 text-gray-400 cursor-not-allowed'
               }
             `}
           >
             Continuer
             {Icons.arrow}
           </button>
         )}
       </div>
     </div>

     <style jsx>{`
       @keyframes fadeIn {
         from {
           opacity: 0;
           transform: translateY(10px);
         }
         to {
           opacity: 1;
           transform: translateY(0);
         }
       }

       @keyframes blob {
         0% { transform: translate(0px, 0px) scale(1); }
         33% { transform: translate(30px, -50px) scale(1.1); }
         66% { transform: translate(-20px, 20px) scale(0.9); }
         100% { transform: translate(0px, 0px) scale(1); }
       }

       .animate-fadeIn {
         animation: fadeIn 0.5s ease-out;
       }

       .animate-blob {
         animation: blob 7s infinite;
       }

       .animation-delay-2000 {
         animation-delay: 2s;
       }

       .animation-delay-4000 {
         animation-delay: 4s;
       }

       .slider::-webkit-slider-thumb {
         appearance: none;
         width: 24px;
         height: 24px;
         background: linear-gradient(135deg, #3b82f6, #6366f1);
         border-radius: 50%;
         cursor: pointer;
         box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
       }
     `}</style>
   </div>
 )
}