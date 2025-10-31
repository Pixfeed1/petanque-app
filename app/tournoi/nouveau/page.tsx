'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { supabase } from '@/lib/supabase'

// Icônes premium améliorées
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
  // CORRECTION 1: Import complet depuis useAuth
  const { user, organization, loading: authLoading, refreshOrganization } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [loadingPlayers, setLoadingPlayers] = useState(true)
  const [successAnimation, setSuccessAnimation] = useState(false)
  const [savingTournament, setSavingTournament] = useState(false)
  const [validationError, setValidationError] = useState('')
  const newPlayersRef = useRef<HTMLDivElement>(null)
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  
  // Joueurs depuis la base
  const [availablePlayers, setAvailablePlayers] = useState<any[]>([])
  
  // État du formulaire complet avec TOUTES les options pétanque
  const [formData, setFormData] = useState({
    // Étape 1 - Informations
    name: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
    location: '',
    terrains: 4,
    
    // Étape 2 - Configuration PÉTANQUE
    mode: 'melee_fixe',
    format: 'doublette',
    maxPoints: 13,
    timeLimit: false,
    timeLimitMinutes: 60,
    
    // NOUVELLES OPTIONS PÉTANQUE
    pouleSize: 4,
    eliminationFormat: 'simple',
    meleeRotation: 'par_tour',
    qualifiedPerPoule: 2,
    consolante: true,
    
    // Étape 3 - Joueurs
    selectedPlayers: [] as string[],
    newPlayers: [] as { name: string, gender: 'H' | 'F', email?: string, phone?: string }[],
    
    // Options avancées
    visibility: 'private',
    allowPhotos: true,
    sendNotifications: true,
    fairPlay: true,
    recordMenes: true
  })

  // CORRECTION 2: Vérification critique de l'organisation
  useEffect(() => {
    if (!authLoading && !organization && user) {
      console.error('❌ ERREUR CRITIQUE: User connecté mais pas d\'organisation!')
      alert('Erreur: Aucune organisation trouvée. Veuillez vous reconnecter.')
      router.push('/dashboard')
    }
  }, [organization, user, authLoading, router])

  // CORRECTION 3: Modifier le useEffect existant
  useEffect(() => {
    setMounted(true)
    
    // Attendre que l'auth soit chargée
    if (authLoading) return
    
    if (user && organization && organization.id && !organization.id.startsWith('temp-')) {
      loadPlayers()
    } else if (!user) {
      router.push('/login')
    } else if (user && !organization) {
      console.error('❌ User sans organisation, redirection...')
      alert('Configuration de votre espace en cours...')
      router.push('/dashboard')
    }
  }, [user, organization, router, authLoading])

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [])

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
      description: 'Les joueurs forment leurs propres équipes',
      detail: 'Idéal pour les tournois officiels',
      icon: Icons.users,
      gradient: 'from-blue-400 to-blue-600',
      recommended: false
    },
    {
      value: 'melee_fixe',
      title: 'Mêlée Fixe',
      description: 'Équipes tirées au sort qui restent ensemble',
      detail: 'Parfait pour la convivialité',
      icon: Icons.lightning,
      gradient: 'from-purple-400 to-purple-600',
      recommended: true
    },
    {
      value: 'melee_tournante',
      title: 'Mêlée Tournante',
      description: 'Nouvelles équipes selon votre choix',
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
      description: '2 joueurs par équipe',
      minPlayers: 4,
      icon: '👥',
      gradient: 'from-orange-400 to-orange-600'
    },
    {
      value: 'triplette',
      title: 'Triplette',
      description: '3 joueurs par équipe',
      minPlayers: 6,
      icon: '👥👤',
      gradient: 'from-indigo-400 to-indigo-600'
    }
  ]

  const togglePlayer = (playerId: string) => {
    const wasSelected = formData.selectedPlayers.includes(playerId)
    
    setFormData({
      ...formData,
      selectedPlayers: wasSelected
        ? formData.selectedPlayers.filter(id => id !== playerId)
        : [...formData.selectedPlayers, playerId]
    })
  }

  const addNewPlayer = () => {
    setFormData({
      ...formData,
      newPlayers: [...formData.newPlayers, { name: '', gender: 'H', email: '', phone: '' }]
    })
    
    // Auto-scroll vers le bas après ajout
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
    let canGo = false
    
    switch(currentStep) {
      case 1: 
        canGo = formData.name.trim().length > 0 && 
               formData.name.trim().length <= 100 && 
               formData.terrains > 0
        break
      
      case 2: 
        canGo = true
        break
      
      case 3: 
        const totalPlayers = getTotalPlayers()
        const minPlayers = getMinPlayers()
        
        canGo = true
        
        if (totalPlayers < minPlayers) {
          canGo = false
          break
        }
        
        if (formData.mode === 'melee_fixe' || formData.mode === 'melee_tournante') {
          const playersPerTeam = formData.format === 'doublette' ? 2 : 3
          const canFormCompleteTeams = totalPlayers % playersPerTeam === 0
          
          if (!canFormCompleteTeams) {
            canGo = false
            break
          }
        }
        
        for (const player of formData.newPlayers) {
          if (player.name.trim()) {
            if (player.email && player.email.trim() && !isValidEmail(player.email)) {
              // Email invalide mais non bloquant
            }
          }
        }
        break
      
      case 4: 
        canGo = true
        break
      
      default: 
        canGo = false
    }
    
    return canGo
  }

  const handleContinue = () => {
    setValidationError('')
    
    if (currentStep === 3) {
      const totalPlayers = getTotalPlayers()
      const minPlayers = getMinPlayers()
      
      if (totalPlayers < minPlayers) {
        setValidationError(`Minimum ${minPlayers} joueurs requis pour une ${formData.format}`)
        return
      }
      
      if (formData.mode === 'melee_fixe' || formData.mode === 'melee_tournante') {
        const playersPerTeam = formData.format === 'doublette' ? 2 : 3
        const canFormCompleteTeams = totalPlayers % playersPerTeam === 0
        
        if (!canFormCompleteTeams) {
          setValidationError(`Pour une ${formData.format} en mêlée, il faut un nombre de joueurs multiple de ${playersPerTeam}. Vous avez ${totalPlayers} joueurs.`)
          return
        }
      }
    }
    
    if (canProceed()) {
      setCurrentStep(currentStep + 1)
    }
  }

  // Helper pour créer une équipe avec ses joueurs
  const createTeamWithPlayers = async (tournoiId: string, teamNumber: number, playerIds: string[]) => {
    const { data: equipe, error: equipeError } = await supabase
      .from('equipes')
      .insert({
        tournoi_id: tournoiId,
        name: `Équipe ${teamNumber}`
      })
      .select()
      .single()
    
    if (equipeError) {
      console.error('Erreur création équipe:', equipeError)
      return
    }
    
    if (equipe) {
      for (let j = 0; j < playerIds.length; j++) {
        const role = j === 0 ? 'capitaine' : 'joueur'
        
        const { error: assignError } = await supabase
          .from('equipes_joueurs')
          .insert({
            equipe_id: equipe.id,
            joueur_id: playerIds[j],
            role: role,
            ordre: j + 1
          })
        
        if (assignError) {
          console.error(`Erreur assignation joueur:`, assignError)
        }
      }
    }
  }

  // Fonction corrigée pour créer les équipes avec mixité
  const createTeamsWithMixity = async (tournoi: any, allPlayerIds: string[], updatedPlayersList: any[]) => {
    const playersPerTeam = formData.format === 'doublette' ? 2 : 3
    const nbEquipes = Math.floor(allPlayerIds.length / playersPerTeam)
    
    if (formData.mode === 'choisi') {
      // Pour le mode choisi, on crée les équipes ET on assigne les joueurs temporairement
      const shuffledPlayers = [...allPlayerIds].sort(() => Math.random() - 0.5)
      
      for (let i = 0; i < nbEquipes; i++) {
        const teamPlayers = shuffledPlayers.slice(i * playersPerTeam, (i + 1) * playersPerTeam)
        await createTeamWithPlayers(tournoi.id, i + 1, teamPlayers)
      }
    } 
    else if (formData.mode === 'melee_fixe') {
      // Utiliser la liste mise à jour pour avoir les infos de genre
      const playersByGender: { H: string[], F: string[] } = { H: [], F: [] }
      
      for (const playerId of allPlayerIds) {
        const player = updatedPlayersList.find(p => p.id === playerId)
        if (player) {
          const gender = player.gender === 'F' ? 'F' : 'H'
          playersByGender[gender].push(playerId)
        } else {
          playersByGender.H.push(playerId)
        }
      }
      
      // Mélanger et créer les équipes
      playersByGender.H.sort(() => Math.random() - 0.5)
      playersByGender.F.sort(() => Math.random() - 0.5)
      
      let teamNumber = 1
      
      // Créer équipes mixtes
      if (formData.format === 'doublette') {
        while (playersByGender.H.length > 0 && playersByGender.F.length > 0) {
          const teamPlayers = [
            playersByGender.H.shift()!,
            playersByGender.F.shift()!
          ]
          await createTeamWithPlayers(tournoi.id, teamNumber++, teamPlayers)
        }
      } else {
        while ((playersByGender.H.length >= 2 && playersByGender.F.length >= 1) || 
               (playersByGender.H.length >= 1 && playersByGender.F.length >= 2)) {
          let teamPlayers: string[]
          if (playersByGender.H.length >= 2 && playersByGender.F.length >= 1) {
            teamPlayers = [playersByGender.H.shift()!, playersByGender.H.shift()!, playersByGender.F.shift()!]
          } else {
            teamPlayers = [playersByGender.H.shift()!, playersByGender.F.shift()!, playersByGender.F.shift()!]
          }
          await createTeamWithPlayers(tournoi.id, teamNumber++, teamPlayers)
        }
      }
      
      // Créer équipes restantes
      const remainingPlayers = [...playersByGender.H, ...playersByGender.F]
      while (remainingPlayers.length >= playersPerTeam) {
        const teamPlayers = remainingPlayers.splice(0, playersPerTeam)
        await createTeamWithPlayers(tournoi.id, teamNumber++, teamPlayers)
      }
    }
    else if (formData.mode === 'melee_tournante') {
      // Pour mêlée tournante, créer les équipes du premier tour
      const shuffledPlayers = [...allPlayerIds].sort(() => Math.random() - 0.5)
      
      for (let i = 0; i < nbEquipes; i++) {
        const teamPlayers = shuffledPlayers.slice(i * playersPerTeam, (i + 1) * playersPerTeam)
        await createTeamWithPlayers(tournoi.id, i + 1, teamPlayers)
      }
      
      // Sauvegarder la configuration pour les rotations futures
      await supabase
        .from('tournois')
        .update({
          settings: {
            ...tournoi.settings,
            melee_tournante_players: allPlayerIds,
            melee_rotation: formData.meleeRotation,
            current_round: 1
          }
        })
        .eq('id', tournoi.id)
    }
  }

  // Fonction pour créer les matchs de poules
  const createPoolMatches = async (tournoi: any) => {
    // Récupérer toutes les équipes créées
    const { data: equipes, error: equipesError } = await supabase
      .from('equipes')
      .select('*')
      .eq('tournoi_id', tournoi.id)
      .order('name')
    
    if (equipesError || !equipes || equipes.length === 0) {
      console.error('Erreur récupération équipes:', equipesError)
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
      
      // Créer tous les matchs de cette poule (round-robin)
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
            .select()
            .single()
          
          if (matchError) {
            console.error(`Erreur création match:`, matchError)
          }
          globalMatchNum++
        }
      }
    }
  }

  // CORRECTION 4: Modifier handleSubmit avec vérifications améliorées
  const handleSubmit = async () => {
    // Vérifications améliorées
    if (!user) {
      alert('Vous devez être connecté')
      router.push('/login')
      return
    }

    if (!organization || !organization.id) {
      console.error('❌ Organization manquante:', organization)
      alert('Erreur : Aucune organisation trouvée. Rechargement en cours...')
      
      // Tenter de recharger l'organisation
      if (typeof refreshOrganization === 'function') {
        await refreshOrganization()
        
        // Attendre un peu pour que le state se mette à jour
        setTimeout(() => {
          if (!organization || !organization.id) {
            alert('Impossible de charger l\'organisation. Veuillez vous reconnecter.')
            router.push('/login')
          }
        }, 1000)
        return
      }
      
      router.push('/dashboard')
      return
    }

    // Vérifier que l'ID n'est pas temporaire
    if (organization.id.startsWith('temp-')) {
      alert('Erreur : Organisation temporaire détectée. Veuillez vous reconnecter.')
      router.push('/login')
      return
    }

    console.log('✅ Organisation validée:', organization)
    console.log('✅ Organisation ID:', organization.id)

    setSavingTournament(true)
    setLoading(true)
    
    try {
      // 1. Créer les nouveaux joueurs et récupérer leurs IDs
      const newPlayerIds = []
      const allAvailablePlayersUpdated = [...availablePlayers] // Copie pour mise à jour locale
      
      for (const newPlayer of formData.newPlayers) {
        if (newPlayer.name.trim()) {
          const emailToSave = newPlayer.email?.trim() && isValidEmail(newPlayer.email) 
            ? newPlayer.email.trim() 
            : null
          
          const { data, error } = await supabase
            .from('joueurs')
            .insert({
              org_id: organization.id,
              name: newPlayer.name.trim(),
              gender: newPlayer.gender || 'H',
              email: emailToSave,
              phone: newPlayer.phone?.trim() || null
            })
            .select()
            .single()
          
          if (error) {
            throw new Error(`Impossible de créer le joueur ${newPlayer.name}`)
          } else if (data) {
            newPlayerIds.push(data.id)
            // IMPORTANT: Ajouter le nouveau joueur à la liste locale pour createTeamsWithMixity
            allAvailablePlayersUpdated.push(data)
          }
        }
      }

      // 2. Créer le tournoi
      const allPlayerIds = [...formData.selectedPlayers, ...newPlayerIds]
      
      // Vérification finale du nombre de joueurs
      if (allPlayerIds.length === 0) {
        throw new Error('Aucun joueur sélectionné')
      }
      
      const tournoiData = {
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
          pouleSize: formData.pouleSize,
          eliminationFormat: formData.eliminationFormat,
          meleeRotation: formData.mode === 'melee_tournante' ? formData.meleeRotation : null,
          qualifiedPerPoule: formData.qualifiedPerPoule,
          consolante: formData.consolante,
          fairPlay: formData.fairPlay,
          recordMenes: formData.recordMenes,
          allowPhotos: formData.allowPhotos,
          sendNotifications: formData.sendNotifications,
          players: allPlayerIds,
          totalPlayers: allPlayerIds.length
        }
      }
      
      const { data: tournoi, error: tournoiError } = await supabase
        .from('tournois')
        .insert(tournoiData)
        .select()
        .single()

      if (tournoiError) {
        throw tournoiError
      }

      if (!tournoi) {
        throw new Error('Erreur lors de la création du tournoi')
      }

      // 3. Créer les équipes avec la liste mise à jour des joueurs
      await createTeamsWithMixity(tournoi, allPlayerIds, allAvailablePlayersUpdated)
      
      // 4. Créer les matchs de poules
      await createPoolMatches(tournoi)
      
      // 5. Mettre à jour le statut du tournoi
      await supabase
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
      
      // 6. Animation de succès
      setSuccessAnimation(true)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 7. Redirection
      router.push(`/tournoi/${tournoi.id}`)
      
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Une erreur est survenue lors de la création du tournoi')
    } finally {
      setSavingTournament(false)
      setLoading(false)
    }
  }

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

  // CORRECTION 5: Écran de chargement si auth en cours
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-12 shadow-2xl">
              <svg className="animate-spin h-12 w-12 mx-auto text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-lg font-medium text-gray-600">Chargement de votre espace...</p>
              <p className="mt-2 text-sm text-gray-400">Vérification de votre organisation...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      {/* Particules animées */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header glassmorphism avec logo pétanque */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
                {Icons.petanque}
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Nouveau Tournoi de Pétanque
                </h1>
                <p className="text-xs text-gray-500">Créez votre compétition en quelques clics</p>
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

        {/* Contenu des étapes */}
        <div className={`mt-16 transition-all duration-700 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          
          {/* Étape 1: Informations */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="p-8 bg-gradient-to-br from-blue-50 to-indigo-50">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                    {Icons.sparkles}
                    <span className="ml-3">Informations générales</span>
                  </h2>
                  <p className="text-gray-600">Définissez les bases de votre tournoi de pétanque</p>
                </div>
                
                <div className="p-8 space-y-6">
                  {/* Nom du tournoi */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du tournoi * (max 100 caractères)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          const newValue = e.target.value.slice(0, 100)
                          setFormData({...formData, name: newValue})
                        }}
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
                        Heure de début *
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

          {/* Étape 2: Configuration AMÉLIORÉE */}
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

                {/* Options spécifiques mêlée tournante */}
                {formData.mode === 'melee_tournante' && (
                  <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl animate-fadeIn">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                      {Icons.shuffle}
                      <span className="ml-2">Rotation des équipes</span>
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
                        <p className="text-xs text-gray-600 mt-1">Nouvelles équipes à chaque tour (recommandé)</p>
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
                        <p className="text-xs text-gray-600 mt-1">Nouvelles équipes après chaque partie</p>
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
                  Format des équipes
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

              {/* Configuration du tournoi PÉTANQUE */}
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
                      <option value={4}>4 équipes par poule</option>
                      <option value={5}>5 équipes par poule</option>
                      <option value={6}>6 équipes par poule</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">Chaque équipe jouera {formData.pouleSize - 1} matchs en poule</p>
                  </div>

{/* Qualifiés par poule */}
<div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Qualifiés par poule
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

                  {/* Format élimination */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Format des phases finales
                    </label>
                    <select
                      value={formData.eliminationFormat}
                      onChange={(e) => setFormData({...formData, eliminationFormat: e.target.value})}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500"
                    >
                      <option value="simple">Élimination simple</option>
                      <option value="double">Double élimination (avec repêchage)</option>
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

                {/* Options supplémentaires */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t">
                  {/* Petite finale */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">Petite finale</p>
                      <p className="text-xs text-gray-500">Match pour la 3ème place</p>
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

                  {/* Enregistrer les mènes */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900">Détail des mènes</p>
                      <p className="text-xs text-gray-500">Enregistrer chaque mène jouée</p>
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
                      <p className="text-xs text-gray-500">Évaluer l'esprit sportif</p>
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
                      Durée maximum par match (minutes)
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

          {/* Étape 3: Joueurs AMÉLIORÉ */}
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
                    <span className="ml-3">Sélection des joueurs</span>
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
                            const selectAll = formData.selectedPlayers.length !== availablePlayers.length
                            
                            if (selectAll) {
                              const allIds = availablePlayers.map(p => p.id)
                              setFormData({...formData, selectedPlayers: allIds})
                            } else {
                              setFormData({...formData, selectedPlayers: []})
                            }
                          }}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {formData.selectedPlayers.length === availablePlayers.length 
                            ? 'Désélectionner tout' 
                            : 'Sélectionner tout'
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

                  {/* Nouveaux joueurs */}
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

          {/* Étape 4: Validation */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="p-8 bg-gradient-to-br from-orange-50 to-red-50">
                  <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                    {Icons.sparkles}
                    <span className="ml-3">Récapitulatif du tournoi</span>
                  </h2>
                  <p className="text-gray-600">Vérifiez les informations avant de créer le tournoi</p>
                </div>

                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Nom', value: formData.name || 'Non défini', icon: Icons.trophy },
                      { label: 'Date', value: new Date(formData.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), icon: Icons.calendar },
                      { label: 'Heure', value: formData.time, icon: Icons.clock },
                      { label: 'Lieu', value: formData.location || 'Non spécifié', icon: Icons.map },
                      { label: 'Mode', value: modes.find(m => m.value === formData.mode)?.title, icon: Icons.gamepad },
                      { label: 'Format', value: formats.find(f => f.value === formData.format)?.title, icon: Icons.users },
                      { label: 'Terrains', value: `${formData.terrains} terrain${formData.terrains > 1 ? 's' : ''}`, icon: Icons.grid },
                      { label: 'Joueurs', value: `${getTotalPlayers()} participant${getTotalPlayers() > 1 ? 's' : ''}`, icon: Icons.users },
                      { label: 'Points pour gagner', value: formData.maxPoints, icon: Icons.trophy },
                      { label: 'Taille des poules', value: `${formData.pouleSize} équipes`, icon: Icons.grid },
                      { label: 'Qualifiés/poule', value: formData.qualifiedPerPoule === 1 ? '1er' : `${formData.qualifiedPerPoule} premiers`, icon: Icons.star },
                      { label: 'Phases finales', value: formData.eliminationFormat === 'simple' ? 'Élimination simple' : 'Double élimination', icon: Icons.flag }
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

                  {/* Options spéciales pour mêlée tournante */}
                  {formData.mode === 'melee_tournante' && (
                    <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl">
                      <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                        {Icons.shuffle}
                        <span className="ml-2">Configuration Mêlée Tournante</span>
                      </h4>
                      <p className="text-sm text-gray-700">
                        Rotation des équipes : <span className="font-bold">
                          {formData.meleeRotation === 'par_tour' ? 'Par tour' : 'Après chaque match'}
                        </span>
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {formData.meleeRotation === 'par_tour' 
                          ? 'Les équipes seront reformées à chaque nouveau tour'
                          : 'Les équipes seront reformées après chaque match joué'
                        }
                      </p>
                    </div>
                  )}

                  {/* Options activées */}
                  <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                    <h4 className="font-bold text-gray-900 mb-3">Options activées</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {formData.consolante && (
                        <div className="flex items-center text-sm text-gray-700">
                          {Icons.check}
                          <span className="ml-2">Petite finale (3ème place)</span>
                        </div>
                      )}
                      {formData.recordMenes && (
                        <div className="flex items-center text-sm text-gray-700">
                          {Icons.check}
                          <span className="ml-2">Enregistrement des mènes</span>
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
                          <span className="ml-2">Photos autorisées</span>
                        </div>
                      )}
                      {formData.sendNotifications && (
                        <div className="flex items-center text-sm text-gray-700">
                          {Icons.check}
                          <span className="ml-2">Notifications activées</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Résumé des joueurs */}
                  <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                      {Icons.users}
                      <span className="ml-2">Participants ({getTotalPlayers()})</span>
                    </h4>

                    {/* Statistiques H/F */}
                    {(() => {
                      const hommes = [
                        ...availablePlayers.filter(p => formData.selectedPlayers.includes(p.id) && p.gender !== 'F'),
                        ...formData.newPlayers.filter(p => p.name.trim() && p.gender === 'H')
                      ].length
                      
                      const femmes = [
                        ...availablePlayers.filter(p => formData.selectedPlayers.includes(p.id) && p.gender === 'F'),
                        ...formData.newPlayers.filter(p => p.name.trim() && p.gender === 'F')
                      ].length
                      
                      return (
                        <div className="mb-4 p-3 bg-white rounded-xl">
                          <div className="flex justify-around text-center">
                            <div>
                              <p className="text-2xl font-bold text-blue-600">{hommes}</p>
                              <p className="text-xs text-gray-600">Hommes</p>
                            </div>
                            <div className="w-px bg-gray-200"></div>
                            <div>
                              <p className="text-2xl font-bold text-pink-600">{femmes}</p>
                              <p className="text-xs text-gray-600">Femmes</p>
                            </div>
                            <div className="w-px bg-gray-200"></div>
                            <div>
                              <p className="text-2xl font-bold text-green-600">{getEstimatedTeams()}</p>
                              <p className="text-xs text-gray-600">Équipes possibles</p>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {/* Joueurs existants sélectionnés */}
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

                  {/* Estimation du déroulement */}
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
                        <p className="text-sm text-gray-600">Matchs en poule/équipe</p>
                        <p className="text-lg font-bold text-gray-900">{formData.pouleSize - 1}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Équipes en phases finales</p>
                        <p className="text-lg font-bold text-gray-900">
                          {getEstimatedPools() * formData.qualifiedPerPoule}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Durée estimée</p>
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
                        <h4 className="font-bold text-gray-900 mb-1">Tout est prêt !</h4>
                        <p className="text-sm text-gray-600">
                          Votre tournoi de pétanque sera créé avec ces paramètres. 
                          {formData.mode === 'choisi' 
                            ? " Vous pourrez ensuite composer les équipes manuellement."
                            : formData.mode === 'melee_fixe'
                            ? " Les équipes seront tirées au sort automatiquement au démarrage."
                            : " Les équipes seront reformées selon votre configuration."
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bouton de création */}
              <div className="text-center">
                <button
                  onClick={handleSubmit}
                  disabled={savingTournament}
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
                        <span className="ml-3">Création en cours...</span>
                      </>
                    ) : successAnimation ? (
                      <>
                        {Icons.check}
                        <span className="ml-3">Tournoi créé !</span>
                      </>
                    ) : (
                      <>
                        {Icons.trophy}
                        <span className="ml-3">Créer le tournoi</span>
                      </>
                    )}
                  </span>
                </button>

                {savingTournament && (
                  <p className="mt-4 text-sm text-gray-500 animate-pulse">
                    Enregistrement du tournoi et préparation des poules...
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Boutons de navigation */}
        <div className="flex justify-between mt-12">
          <button
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep(currentStep - 1)
              }
            }}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              currentStep === 1 
                ? 'text-gray-400 cursor-not-allowed' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            disabled={currentStep === 1}
          >
            ← Retour
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