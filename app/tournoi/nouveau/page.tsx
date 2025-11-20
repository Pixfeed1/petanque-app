'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import type { Tournoi, Joueur } from '@/lib/types'
import { Trophy, Petanque, Calendar, User, Users, Check, Sparkles, Lightning, Star, Plus, X, Info, ArrowRight, Loader, Clock, Shuffle, Grid, Settings, Flag, Warning, Gamepad, Map, Target } from '@/components/Icons'

// Icônes premium améliorées
const Icons = {
  trophy: <Trophy className="w-6 h-6" />,
  petanque: <Petanque className="w-8 h-8" />,
  calendar: <Calendar className="w-6 h-6" />,
  users: <Users className="w-6 h-6" />,
  gamepad: <Gamepad className="w-6 h-6" />,
  check: <Check className="w-5 h-5" />,
  sparkles: <Sparkles className="w-6 h-6" />,
  lightning: <Lightning className="w-6 h-6" />,
  star: <Star className="w-5 h-5" />,
  plus: <Plus className="w-5 h-5" />,
  x: <X className="w-5 h-5" />,
  info: <Info className="w-5 h-5" />,
  arrow: <ArrowRight className="w-5 h-5" />,
  loader: <Loader className="animate-spin h-5 w-5" />,
  clock: <Clock className="w-5 h-5" />,
  map: <Map className="w-5 h-5" />,
  shuffle: <Shuffle className="w-6 h-6" />,
  grid: <Grid className="w-6 h-6" />,
  settings: <Settings className="w-6 h-6" />,
  flag: <Flag className="w-5 h-5" />,
  alert: <Warning className="w-5 h-5" />
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
    mixiteObligatoire: false,
    
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
      const response = await fetch(`/api/joueurs?org_id=${organization.id}`, {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Erreur chargement joueurs')

      const playersData = await response.json()
      setAvailablePlayers(playersData)
    } catch (error) {
      console.error('Erreur chargement joueurs:', error)
    } finally {
      setLoadingPlayers(false)
    }
  }

  const steps = [
    { number: 1, title: 'Informations', icon: Icons.trophy, color: 'from-green-500 to-emerald-600' },
    { number: 2, title: 'Format', icon: Icons.gamepad, color: 'from-green-500 to-emerald-600' },
    { number: 3, title: 'Joueurs', icon: Icons.users, color: 'from-green-500 to-emerald-600' },
    { number: 4, title: 'Options', icon: Icons.settings, color: 'from-green-500 to-emerald-600' },
    { number: 5, title: 'Validation', icon: Icons.check, color: 'from-green-500 to-emerald-600' }
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
      gradient: 'from-green-400 to-green-600',
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
      value: 'tete_a_tete',
      title: 'Tête à tête',
      description: '1 joueur (individuel)',
      minPlayers: 2,
      icon: <User className="w-12 h-12" />,
      gradient: 'from-blue-400 to-blue-600'
    },
    {
      value: 'doublette',
      title: 'Doublette',
      description: '2 joueurs par équipe',
      minPlayers: 4,
      icon: <Users className="w-12 h-12" />,
      gradient: 'from-green-400 to-emerald-600'
    },
    {
      value: 'triplette',
      title: 'Triplette',
      description: '3 joueurs par équipe',
      minPlayers: 6,
      icon: <Users className="w-12 h-12" />,
      gradient: 'from-green-400 to-emerald-600'
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
    if (formData.format === 'tete_a_tete') return 2
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

        // MODE CHOISI : Sélection de joueurs OPTIONNELLE
        // L'organisateur compose les équipes manuellement dans le tournoi
        if (formData.mode === 'choisi') {
          canGo = true

          // Validation seulement SI des joueurs sont sélectionnés
          if (totalPlayers > 0 && totalPlayers < minPlayers) {
            canGo = false
            break
          }

          // Validation des emails pour nouveaux joueurs
          for (const player of formData.newPlayers) {
            if (player.name.trim()) {
              if (player.email && player.email.trim() && !isValidEmail(player.email)) {
                canGo = false
                setValidationError(`Email invalide pour ${player.name}: ${player.email}`)
                break
              }
            }
          }
          break
        }

        // MODES MÊLÉE : Joueurs OBLIGATOIRES
        canGo = true

        if (totalPlayers < minPlayers) {
          canGo = false
          break
        }

        if (formData.mode === 'melee_fixe' || formData.mode === 'melee_tournante') {
          const playersPerTeam = formData.format === 'tete_a_tete' ? 1 : (formData.format === 'doublette' ? 2 : 3)
          const canFormCompleteTeams = totalPlayers % playersPerTeam === 0

          if (!canFormCompleteTeams) {
            canGo = false
            break
          }
        }

        for (const player of formData.newPlayers) {
          if (player.name.trim()) {
            if (player.email && player.email.trim() && !isValidEmail(player.email)) {
              canGo = false
              setValidationError(`Email invalide pour ${player.name}: ${player.email}`)
              break
            }
          }
        }
        break
      
      case 4:
        // Étape 4 : Options avancées (toujours valide)
        canGo = true
        break

      case 5:
        // Étape 5 : Validation finale (toujours valide)
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

      // MODE CHOISI : validation SEULEMENT si des joueurs sont sélectionnés
      if (formData.mode === 'choisi') {
        // Si aucun joueur sélectionné, laisser passer (OK)
        if (totalPlayers === 0) {
          setCurrentStep(currentStep + 1)
          return
        }

        // Si des joueurs sont sélectionnés, vérifier le minimum
        if (totalPlayers > 0 && totalPlayers < minPlayers) {
          setValidationError(`Si vous sélectionnez des joueurs, minimum ${minPlayers} joueurs requis pour une ${formData.format}`)
          return
        }
      } else {
        // MODES MÊLÉE : validation OBLIGATOIRE
        if (totalPlayers < minPlayers) {
          setValidationError(`Minimum ${minPlayers} joueurs requis pour une ${formData.format}`)
          return
        }
      }

      if (formData.mode === 'melee_fixe' || formData.mode === 'melee_tournante') {
        const playersPerTeam = formData.format === 'tete_a_tete' ? 1 : (formData.format === 'doublette' ? 2 : 3)
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
    try {
      const response = await fetch('/api/equipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tournoi_id: tournoiId,
          name: `Équipe ${teamNumber}`,
          joueur_ids: playerIds,
          stats: {
            victoires: 0,
            defaites: 0,
            points_pour: 0,
            points_contre: 0
          }
        })
      })

      if (!response.ok) {
        console.error('Erreur création équipe')
        return null
      }

      const equipe = await response.json()
      return equipe
    } catch (error) {
      console.error('Erreur création équipe:', error)
      return null
    }
  }

  // Fonction corrigée pour créer les équipes avec mixité
  const createTeamsWithMixity = async (tournoi: Tournoi, allPlayerIds: string[], updatedPlayersList: Joueur[]) => {
    const playersPerTeam = formData.format === 'tete_a_tete' ? 1 : (formData.format === 'doublette' ? 2 : 3)
    const nbEquipes = Math.floor(allPlayerIds.length / playersPerTeam)
    const remainingPlayers = allPlayerIds.length % playersPerTeam

    // SÉCURITÉ : Vérifier qu'aucun joueur ne sera exclu
    if (remainingPlayers > 0 && (formData.mode === 'melee_fixe' || formData.mode === 'melee_tournante')) {
      throw new Error(
        `❌ Erreur critique : ${remainingPlayers} joueur(s) seraient exclus du tournoi.\n\n` +
        `Vous avez ${allPlayerIds.length} joueurs pour une ${formData.format} (${playersPerTeam} joueurs/équipe).\n` +
        `Ajoutez ${playersPerTeam - remainingPlayers} joueur(s) ou retirez-en ${remainingPlayers}.`
      )
    }

    if (formData.mode === 'choisi') {
      // MODE CHOISI : Ne PAS créer d'équipes automatiquement
      // L'organisateur les composera manuellement dans l'interface du tournoi
      // via le bouton "Composer les équipes"
      return 0
    }
    else if (formData.mode === 'melee_fixe') {
      // Pour tête-à-tête, chaque joueur est sa propre équipe
      if (formData.format === 'tete_a_tete') {
        const shuffledPlayers = [...allPlayerIds].sort(() => Math.random() - 0.5)
        for (let i = 0; i < shuffledPlayers.length; i++) {
          await createTeamWithPlayers(tournoi.id, i + 1, [shuffledPlayers[i]])
        }
        return 0
      }

      // Si mixité NON obligatoire : formation libre sans contrainte de genre
      if (!formData.mixiteObligatoire) {
        const shuffledPlayers = [...allPlayerIds].sort(() => Math.random() - 0.5)
        let teamNumber = 1

        for (let i = 0; i < nbEquipes; i++) {
          const teamPlayers = shuffledPlayers.slice(i * playersPerTeam, (i + 1) * playersPerTeam)
          await createTeamWithPlayers(tournoi.id, teamNumber++, teamPlayers)
        }

        return 0
      }

      // Si mixité OBLIGATOIRE : utiliser l'algorithme de mixité H/F
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
      
      // Créer équipes restantes en préservant la mixité autant que possible
      const remainingPlayers = [...playersByGender.H, ...playersByGender.F]
      remainingPlayers.sort(() => Math.random() - 0.5) // Mélanger pour alterner H/F

      while (remainingPlayers.length >= playersPerTeam) {
        const teamPlayers = remainingPlayers.splice(0, playersPerTeam)
        await createTeamWithPlayers(tournoi.id, teamNumber++, teamPlayers)
      }

      // Avertir si des joueurs restent
      if (remainingPlayers.length > 0) {
        console.warn(`${remainingPlayers.length} joueur(s) non assigné(s) car nombre incompatible avec le format`)
        // Retourner le nombre de joueurs non assignés pour alerter l'utilisateur
        return remainingPlayers.length
      }
      return 0
    }
    else if (formData.mode === 'melee_tournante') {
      // Pour mêlée tournante, créer les équipes du premier tour (rotation 1)
      const shuffledPlayers = [...allPlayerIds].sort(() => Math.random() - 0.5)

      for (let i = 0; i < nbEquipes; i++) {
        const teamPlayers = shuffledPlayers.slice(i * playersPerTeam, (i + 1) * playersPerTeam)
        // Utiliser le format R1-Équipe X pour cohérence avec les rotations suivantes
        await fetch('/api/equipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            tournoi_id: tournoi.id,
            name: `R1-Équipe ${i + 1}`,
            joueur_ids: teamPlayers,
            stats: {
              victoires: 0,
              defaites: 0,
              points_pour: 0,
              points_contre: 0
            }
          })
        })
      }
      
      // Sauvegarder la configuration pour les rotations futures
      await fetch(`/api/tournois/${tournoi.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          settings: {
            ...tournoi.settings,
            melee_tournante_players: allPlayerIds,
            melee_rotation: formData.meleeRotation,
            current_round: 1
          }
        })
      })
      return 0
    }
    return 0
  }

  // Fonction pour créer les matchs de poules
  const createPoolMatches = async (tournoi: Tournoi) => {
    // Récupérer toutes les équipes créées
    try {
      const response = await fetch(`/api/equipes?tournoi_id=${tournoi.id}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Erreur récupération équipes')
      }

      const equipes = await response.json()

      if (!equipes || equipes.length === 0) {
        throw new Error('Aucune équipe trouvée')
      }

      // Mélanger les équipes pour fairplay (éviter clustering des équipes fortes)
      const shuffledEquipes = [...equipes].sort(() => Math.random() - 0.5)

      // Diviser en poules
      const equipesParPoule = formData.pouleSize
      const nbPoules = Math.ceil(shuffledEquipes.length / equipesParPoule)

      let globalMatchNum = 0
      let matchesCreated = 0
      const matchesToCreate: Array<{
        tournoi_id: string
        equipe_a_id: string
        equipe_b_id: string
        status: string
        tour: number
        terrain: number | null
        type: string
        poule: string | null
      }> = []

      for (let pouleNum = 0; pouleNum < nbPoules; pouleNum++) {
        const pouleStart = pouleNum * equipesParPoule
        const pouleEnd = Math.min(pouleStart + equipesParPoule, shuffledEquipes.length)
        const equipesPoule = shuffledEquipes.slice(pouleStart, pouleEnd)

        // Créer tous les matchs de cette poule (round-robin)
        for (let i = 0; i < equipesPoule.length; i++) {
          for (let j = i + 1; j < equipesPoule.length; j++) {
            const terrainNum = (globalMatchNum % formData.terrains) + 1
            const tour = Math.floor(globalMatchNum / formData.terrains) + 1

            matchesToCreate.push({
              tournoi_id: tournoi.id,
              equipe_a_id: equipesPoule[i].id,
              equipe_b_id: equipesPoule[j].id,
              terrain: terrainNum,
              tour: tour,
              type: 'poule',
              poule: String.fromCharCode(65 + pouleNum),
              status: 'a_jouer'
            })

            globalMatchNum++
          }
        }
      }

      // Créer tous les matchs et vérifier le succès
      for (const matchData of matchesToCreate) {
        const matchResponse = await fetch('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(matchData)
        })

        if (matchResponse.ok) {
          matchesCreated++
        } else {
          console.error('Erreur création match:', await matchResponse.text())
        }
      }

      // Vérifier que tous les matchs ont été créés
      if (matchesCreated !== matchesToCreate.length) {
        throw new Error(`Seulement ${matchesCreated}/${matchesToCreate.length} matchs créés`)
      }

      console.log(`✅ ${matchesCreated} matchs créés avec succès`)
    } catch (error) {
      console.error('Erreur création matchs de poule:', error)
      throw error // Re-throw pour que handleSubmit puisse gérer l'erreur
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
        try {
          await refreshOrganization()
          // Si refresh réussit, l'organisation sera chargée au prochain render
          // On informe l'utilisateur de réessayer
          alert('Organisation rechargée. Veuillez cliquer à nouveau sur "Créer le tournoi".')
          return
        } catch (error) {
          console.error('Erreur refresh organisation:', error)
          alert('Impossible de charger l\'organisation. Veuillez vous reconnecter.')
          router.push('/login')
          return
        }
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

          try {
            const response = await fetch('/api/joueurs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                org_id: organization.id,
                name: newPlayer.name.trim(),
                email: emailToSave,
                phone: newPlayer.phone?.trim() || null,
                stats: { gender: newPlayer.gender || 'H' }
              })
            })

            if (!response.ok) {
              throw new Error(`Impossible de créer le joueur ${newPlayer.name}`)
            }

            const data = await response.json()
            newPlayerIds.push(data.id)
            // IMPORTANT: Ajouter le nouveau joueur à la liste locale pour createTeamsWithMixity
            allAvailablePlayersUpdated.push(data)
          } catch (error) {
            throw new Error(`Impossible de créer le joueur ${newPlayer.name}`)
          }
        }
      }

      // 2. Créer le tournoi
      const allPlayerIds = [...formData.selectedPlayers, ...newPlayerIds]

      // Vérification finale du nombre de joueurs
      // MODE CHOISI : Autoriser 0 joueurs (tournoi vide, équipes composées manuellement après)
      // MODES MÊLÉE : Bloquer si 0 joueurs (obligatoires pour créer les équipes)
      if (formData.mode !== 'choisi' && allPlayerIds.length === 0) {
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
          mixiteObligatoire: formData.mixiteObligatoire,
          allowPhotos: formData.allowPhotos,
          sendNotifications: formData.sendNotifications,
          players: allPlayerIds,
          totalPlayers: allPlayerIds.length
        }
      }
      
      const tournoiResponse = await fetch('/api/tournois', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(tournoiData)
      })

      if (!tournoiResponse.ok) {
        const error = await tournoiResponse.json()
        throw new Error(error.error || 'Erreur lors de la création du tournoi')
      }

      const tournoi = await tournoiResponse.json()

      if (!tournoi) {
        throw new Error('Erreur lors de la création du tournoi')
      }

      // 3. Créer les équipes avec la liste mise à jour des joueurs
      // MODE CHOISI avec 0 joueurs : sauter cette étape (équipes créées manuellement après)
      if (formData.mode !== 'choisi' || allPlayerIds.length > 0) {
        const unassignedPlayers = await createTeamsWithMixity(tournoi, allPlayerIds, allAvailablePlayersUpdated)

        // Alerter si des joueurs n'ont pas pu être assignés
        if (unassignedPlayers > 0) {
          alert(`⚠️ Attention : ${unassignedPlayers} joueur(s) n'ont pas pu être assignés à une équipe complète en raison de la mixité obligatoire. Veuillez ajuster votre liste de joueurs ou désactiver la mixité obligatoire.`)
        }

        // 4. Créer les matchs de poules
        await createPoolMatches(tournoi)
      }
      
      // 5. Mettre à jour le statut du tournoi (reste en "preparation" jusqu'à lancement manuel)
      // SEULEMENT si des équipes/matchs ont été créés
      if (formData.mode !== 'choisi' || allPlayerIds.length > 0) {
        const updateResponse = await fetch(`/api/tournois/${tournoi.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            status: 'preparation',
            settings: {
              ...tournoi.settings,
              poules_created: true,
              created_time: new Date().toISOString()
            }
          })
        })

        if (!updateResponse.ok) {
          console.warn('⚠️ Erreur mise à jour tournoi (non bloquant)')
        }
      }
      
      // 6. Animation de succès
      setSuccessAnimation(true)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 7. Redirection
      router.push(`/tournoi/${tournoi.id}`)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue lors de la création du tournoi'
      alert(`${errorMessage}\n\nNote: Des données partielles peuvent avoir été créées. Veuillez contacter un administrateur si nécessaire.`)
      console.error('Erreur détaillée:', error)
    } finally {
      setSavingTournament(false)
      setLoading(false)
    }
  }

  const getEstimatedTeams = () => {
    const total = getTotalPlayers()
    if (total === 0) return 0
    const playersPerTeam = formData.format === 'tete_a_tete' ? 1 : (formData.format === 'doublette' ? 2 : 3)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 overflow-x-hidden">
      {/* Particules animées */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 right-40 w-80 h-80 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header glassmorphism avec logo pétanque */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
                {Icons.petanque}
              </div>
              <div>
                <h1 className="text-sm sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  <span className="hidden sm:inline">Nouveau Tournoi de Pétanque</span>
                  <span className="sm:hidden">Nouveau Tournoi</span>
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">Créez votre compétition en quelques clics</p>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="group flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              {Icons.x}
              <span className="hidden sm:inline">Annuler</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Progress Steps */}
        <div className={`mb-12 sm:mb-16 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className="relative">
                  {currentStep === step.number && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-full animate-ping opacity-20`}></div>
                  )}

                  <div className={`
                    relative w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center font-bold text-sm sm:text-lg
                    transition-all duration-500 transform
                    ${currentStep >= step.number
                      ? `bg-gradient-to-br ${step.color} text-white shadow-lg scale-100`
                      : 'bg-gray-200 text-gray-400 scale-90'}
                    ${currentStep === step.number ? 'ring-2 sm:ring-4 ring-white shadow-2xl scale-110' : ''}
                  `}>
                    {currentStep > step.number ? Icons.check : step.icon}
                  </div>

                  <div className={`absolute -bottom-6 sm:-bottom-8 left-1/2 transform -translate-x-1/2 text-[10px] sm:text-xs font-medium transition-all duration-500 text-center max-w-[60px] sm:max-w-none sm:whitespace-nowrap ${
                    currentStep >= step.number ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </div>
                </div>

                {index < steps.length - 1 && (
                  <div className="w-8 sm:w-24 h-1 mx-1 sm:mx-4">
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
            <div className="animate-fadeIn">
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
                <div className="p-4 sm:p-8 bg-gradient-to-br from-green-50 to-emerald-50">
                  <h2 className="text-xl sm:text-3xl font-bold text-gray-900 mb-2 flex items-center">
                    {Icons.sparkles}
                    <span className="ml-2 sm:ml-3">Informations générales</span>
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">Définissez les bases de votre tournoi de pétanque</p>
                </div>

                <div className="p-4 sm:p-8 space-y-4 sm:space-y-6">
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
                        className="w-full h-14 px-5 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-lg text-gray-900"
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

                  {/* Date du tournoi */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date du tournoi *
                    </label>
                    <div className="relative w-full">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none hidden sm:block">
                        {Icons.calendar}
                      </div>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({...formData, date: e.target.value})}
                        className="w-full max-w-full h-14 px-3 sm:px-5 sm:pl-12 sm:pr-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-base sm:text-lg text-gray-900 box-border"
                        style={{ WebkitAppearance: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Heure de début */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure de début *
                    </label>
                    <div className="relative w-full">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none hidden sm:block">
                        {Icons.clock}
                      </div>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={(e) => setFormData({...formData, time: e.target.value})}
                        className="w-full max-w-full h-14 px-3 sm:px-5 sm:pl-12 sm:pr-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-base sm:text-lg text-gray-900 box-border"
                        style={{ WebkitAppearance: 'none' }}
                      />
                    </div>
                  </div>

                  {/* Lieu */}
                  <div className="group">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lieu (optionnel)
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none hidden sm:block">
                        {Icons.map}
                      </div>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                        className="w-full h-14 px-5 sm:pl-12 sm:pr-4 border-2 border-gray-200 rounded-2xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-lg text-gray-900"
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
            <div className="animate-fadeIn">
              {/* Mode de jeu */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white mr-3">
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
                          ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg'
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
                        <div className="absolute top-3 left-3 text-green-500 animate-fadeIn">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => setFormData({...formData, meleeRotation: 'par_tour'})}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          formData.meleeRotation === 'par_tour'
                            ? 'border-green-500 bg-white shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <p className="font-medium text-gray-900">Par tour</p>
                        <p className="text-xs text-gray-900 mt-1">Nouvelles équipes à chaque tour (recommandé)</p>
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
                        <p className="text-xs text-gray-900 mt-1">Nouvelles équipes après chaque partie</p>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Format */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white mr-3">
                    {Icons.users}
                  </div>
                  Format des équipes
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {formats.map((format) => (
                    <button
                      key={format.value}
                      onClick={() => setFormData({...formData, format: format.value})}
                      className={`group relative p-6 sm:p-8 rounded-2xl border-2 transition-all transform hover:scale-105 ${
                        formData.format === format.value
                          ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <div className="text-5xl mb-4">{format.icon}</div>
                      
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{format.title}</h4>
                      <p className="text-gray-600">{format.description}</p>
                      <p className="text-sm text-gray-500 mt-2">Min. {format.minPlayers} joueurs</p>
                      
                      {formData.format === format.value && (
                        <div className="absolute top-4 right-4 text-green-500 animate-fadeIn">
                          {Icons.check}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Points pour gagner */}
              <div className="bg-white rounded-3xl shadow-xl p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white mr-3">
                    {Icons.trophy}
                  </div>
                  Points pour gagner
                </h3>

                <div className="max-w-md mx-auto">
                  <div className="text-center mb-6">
                    <span className="text-6xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {formData.maxPoints}
                    </span>
                    <p className="text-gray-600 mt-2">points</p>
                  </div>

                  <input
                    type="range"
                    min="7"
                    max="15"
                    value={formData.maxPoints}
                    onChange={(e) => setFormData({...formData, maxPoints: parseInt(e.target.value)})}
                    className="w-full h-3 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full appearance-none cursor-pointer accent-green-600"
                  />

                  <div className="flex justify-between mt-3">
                    {[7,9,11,13,15].map(n => (
                      <button
                        key={n}
                        onClick={() => setFormData({...formData, maxPoints: n})}
                        className={`px-4 py-2 rounded-xl transition-all ${
                          formData.maxPoints === n
                            ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold shadow-lg'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>

                  <p className="text-sm text-gray-500 text-center mt-6">
                    {formData.maxPoints === 13 ? 'Recommandé pour tournois officiels FIPJP' :
                     formData.maxPoints < 11 ? 'Parties rapides' :
                     'Parties longues'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Joueurs AMÉLIORÉ */}
          {currentStep === 3 && (
            <div className="animate-fadeIn">
              {/* Message d'erreur de validation */}
              {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start mb-4 sm:mb-6">
                  <div className="text-red-500 mr-3">{Icons.alert}</div>
                  <p className="text-red-700">{validationError}</p>
                </div>
              )}

              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
                <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-green-50 to-emerald-50">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-2 flex items-center">
                    <span className="w-6 h-6 sm:w-auto sm:h-auto">{Icons.users}</span>
                    <span className="ml-2 sm:ml-3">
                      {formData.mode === 'choisi' ? 'Sélection des joueurs (optionnel)' : 'Sélection des joueurs'}
                    </span>
                  </h2>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <p className="text-sm sm:text-base text-gray-600">
                      {formData.mode === 'choisi'
                        ? 'Vous pouvez passer cette étape et composer les équipes plus tard dans le tournoi'
                        : 'Choisissez les participants au tournoi'}
                    </p>
                    {formData.mode !== 'choisi' && (
                      <div className="flex items-center gap-2 sm:space-x-4">
                        <span className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white rounded-xl font-medium shadow-sm text-center">
                          <span className="text-xl sm:text-2xl font-bold text-gray-900">{getTotalPlayers()}</span>
                          <span className="text-sm sm:text-base text-gray-600 ml-1">joueurs</span>
                        </span>
                        <span className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-xl font-medium text-center whitespace-nowrap ${
                          getTotalPlayers() >= getMinPlayers()
                            ? 'bg-green-100 text-green-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          <span className="text-sm sm:text-base">Min. {getMinPlayers()}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Message explicatif pour le mode choisi */}
                  {formData.mode === 'choisi' && (
                    <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                      <div className="flex items-start">
                        <div className="text-blue-600 mr-3">{Icons.info}</div>
                        <div>
                          <h4 className="font-bold text-blue-900 mb-1">Mode "Équipes choisies"</h4>
                          <p className="text-sm text-blue-700">
                            En mode choisi, vous composez manuellement les équipes après la création du tournoi.
                            <strong className="block mt-1">Vous pouvez passer cette étape</strong> et cliquer directement sur "Suivant" pour créer le tournoi vide.
                            Vous ajouterez ensuite les équipes via le bouton <strong>"Composer les équipes"</strong> dans le tournoi.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 sm:p-6 lg:p-8">
                  {/* Joueurs existants */}
                  <div className="mb-6 sm:mb-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-4">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">
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
                      <div
                        className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[60vh] sm:max-h-96 overflow-y-auto pr-1 sm:pr-2 -mr-1 sm:-mr-2"
                        style={{ overscrollBehavior: 'contain' }}
                      >
                        {availablePlayers.map((player) => (
                          <button
                            key={player.id}
                            onClick={() => togglePlayer(player.id)}
                            className={`group relative p-3 sm:p-4 rounded-xl border-2 transition-all hover:shadow-md ${
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
                              <div className="text-left flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{player.name}</p>
                                <div className="flex items-center gap-1 sm:gap-2 text-xs flex-wrap">
                                  <span className={`px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap ${
                                    player.gender === 'F'
                                      ? 'bg-pink-100 text-pink-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}>
                                    {player.gender === 'F' ? 'F' : 'H'}
                                  </span>
                                  {player.email && (
                                    <span className="truncate max-w-[100px] sm:max-w-[120px] text-gray-500">{player.email}</span>
                                  )}
                                </div>
                              </div>
                              {formData.selectedPlayers.includes(player.id) && (
                                <div className="ml-2 text-green-500 animate-fadeIn flex-shrink-0">
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
                  <div className="border-t pt-4 sm:pt-6 lg:pt-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0 mb-4">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900">Ajouter de nouveaux joueurs</h3>
                    </div>

                    {formData.newPlayers.length === 0 ? (
                      <div className="text-center py-6 sm:py-8 border-2 border-dashed border-gray-300 rounded-xl">
                        <p className="text-sm sm:text-base text-gray-500 mb-4 px-4">Cliquez sur le bouton pour inscrire de nouveaux participants</p>
                        <button
                          onClick={addNewPlayer}
                          className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105 text-sm sm:text-base"
                        >
                          {Icons.plus}
                          <span className="ml-2">Ajouter un joueur</span>
                        </button>
                      </div>
                    ) : (
                      <div
                        className="space-y-3 max-h-[60vh] sm:max-h-96 overflow-y-auto pr-1 sm:pr-2 -mr-1 sm:-mr-2"
                        style={{ overscrollBehavior: 'contain' }}
                        ref={newPlayersRef}
                      >
                        {formData.newPlayers.map((player, index) => (
                          <div key={index} className="flex flex-col sm:flex-row gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl animate-fadeIn">
                            <input
                              type="text"
                              placeholder="Nom complet *"
                              value={player.name}
                              onChange={(e) => updateNewPlayer(index, 'name', e.target.value)}
                              className="w-full sm:flex-1 h-11 sm:h-auto px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 sm:focus:ring-4 focus:ring-green-100 text-sm sm:text-base text-gray-900"
                            />
                            <select
                              value={player.gender}
                              onChange={(e) => updateNewPlayer(index, 'gender', e.target.value)}
                              className="w-full sm:w-auto h-11 sm:h-auto px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 text-sm sm:text-base text-gray-900 bg-white"
                            >
                              <option value="H">Homme</option>
                              <option value="F">Femme</option>
                            </select>
                            <input
                              type="email"
                              placeholder="Email (optionnel)"
                              value={player.email}
                              onChange={(e) => updateNewPlayer(index, 'email', e.target.value)}
                              className={`w-full sm:flex-1 h-11 sm:h-auto px-3 sm:px-4 py-2.5 sm:py-3 border-2 rounded-xl focus:border-green-500 text-sm sm:text-base text-gray-900 ${
                                player.email && player.email.trim() && !isValidEmail(player.email)
                                  ? 'border-red-300 bg-red-50'
                                  : 'border-gray-200 bg-white'
                              }`}
                            />
                            <button
                              onClick={() => removeNewPlayer(index)}
                              className="self-center sm:self-auto p-2.5 sm:p-3 text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              aria-label="Supprimer ce joueur"
                            >
                              {Icons.x}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Bouton flottant pour ajouter un joueur */}
                    {formData.newPlayers.length > 0 && (
                      <div className="mt-3 sm:mt-4 sticky bottom-0 bg-white pt-3 sm:pt-4 border-t">
                        <button
                          onClick={addNewPlayer}
                          className="w-full flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105 text-sm sm:text-base"
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

          {/* Étape 4: Options avancées */}
          {currentStep === 4 && (
            <div className="animate-fadeIn">
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
                <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-green-50 to-emerald-50">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-2 flex items-center">
                    <span className="w-6 h-6 sm:w-auto sm:h-auto">{Icons.settings}</span>
                    <span className="ml-2 sm:ml-3">Options avancées</span>
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">Personnalisez les paramètres de votre tournoi</p>
                </div>

                <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                  {/* Configuration technique */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {/* Taille des poules */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Taille des poules
                      </label>
                      <select
                        value={formData.pouleSize}
                        onChange={(e) => setFormData({...formData, pouleSize: parseInt(e.target.value)})}
                        className="w-full h-11 sm:h-auto px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 text-sm sm:text-base text-gray-900 bg-white"
                      >
                        <option value={3}>3 équipes par poule</option>
                        <option value={4}>4 équipes par poule</option>
                        <option value={5}>5 équipes par poule</option>
                        <option value={6}>6 équipes par poule</option>
                        <option value={7}>7 équipes par poule</option>
                        <option value={8}>8 équipes par poule</option>
                      </select>
                    </div>

                    {/* Qualifiés par poule */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Qualifiés par poule
                      </label>
                      <select
                        value={formData.qualifiedPerPoule}
                        onChange={(e) => setFormData({...formData, qualifiedPerPoule: parseInt(e.target.value)})}
                        className="w-full h-11 sm:h-auto px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 text-sm sm:text-base text-gray-900 bg-white"
                      >
                        <option value={1}>Le 1er de chaque poule</option>
                        <option value={2}>Les 2 premiers</option>
                        {formData.pouleSize >= 6 && <option value={3}>Les 3 premiers</option>}
                      </select>
                    </div>
                  </div>

                  {/* Options de jeu */}
                  <div className="border-t pt-6 mt-6">
                    <h3 className="font-bold text-gray-900 mb-4">Options de jeu</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">Mixité obligatoire</p>
                          <p className="text-xs text-gray-500">Imposer H/F dans les équipes</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={formData.mixiteObligatoire} onChange={(e) => setFormData({...formData, mixiteObligatoire: e.target.checked})} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">Petite finale</p>
                          <p className="text-xs text-gray-500">Match pour la 3ème place</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={formData.consolante} onChange={(e) => setFormData({...formData, consolante: e.target.checked})} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">Détail des mènes</p>
                          <p className="text-xs text-gray-500">Enregistrer chaque mène</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={formData.recordMenes} onChange={(e) => setFormData({...formData, recordMenes: e.target.checked})} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">Notation fair-play</p>
                          <p className="text-xs text-gray-500">Évaluer l'esprit sportif</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={formData.fairPlay} onChange={(e) => setFormData({...formData, fairPlay: e.target.checked})} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">Limite de temps</p>
                          <p className="text-xs text-gray-500">Pour tournois rapides</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={formData.timeLimit} onChange={(e) => setFormData({...formData, timeLimit: e.target.checked})} className="sr-only peer" />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                        </label>
                      </div>
                    </div>

                    {formData.timeLimit && (
                      <div className="mt-4 p-4 bg-yellow-50 rounded-xl animate-fadeIn">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Durée maximum par match (minutes)
                        </label>
                        <input type="number" min="15" max="120" value={formData.timeLimitMinutes} onChange={(e) => setFormData({...formData, timeLimitMinutes: parseInt(e.target.value)})} className="w-32 px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 5: Validation */}
          {currentStep === 5 && (
            <div className="animate-fadeIn">
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">
                <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-green-50 to-emerald-50">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-3 sm:mb-2 flex items-center">
                    <span className="w-6 h-6 sm:w-auto sm:h-auto">{Icons.sparkles}</span>
                    <span className="ml-2 sm:ml-3">Récapitulatif du tournoi</span>
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600">Vérifiez les informations avant de créer le tournoi</p>
                </div>

                <div className="p-4 sm:p-6 lg:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {[
                      { label: 'Nom', value: formData.name || 'Non défini', icon: Icons.trophy },
                      { label: 'Date', value: new Date(formData.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }), icon: Icons.calendar },
                      { label: 'Heure', value: formData.time, icon: Icons.clock },
                      { label: 'Lieu', value: formData.location || 'Non spécifié', icon: Icons.map },
                      { label: 'Mode', value: modes.find(m => m.value === formData.mode)?.title, icon: Icons.gamepad },
                      { label: 'Format', value: formats.find(f => f.value === formData.format)?.title, icon: Icons.users },
                      { label: 'Terrains', value: `${formData.terrains} terrain${formData.terrains > 1 ? 's' : ''}`, icon: Icons.grid },
                      { label: 'Joueurs', value: `${getTotalPlayers()} participant${getTotalPlayers() > 1 ? 's' : ''}`, icon: Icons.users },
                      { label: 'Points pour gagner', value: formData.maxPoints, icon: Icons.trophy },
                      { label: 'Taille des poules', value: `${formData.pouleSize} équipes`, icon: Icons.grid },
                      { label: 'Qualifiés/poule', value: formData.qualifiedPerPoule === 1 ? '1er' : `${formData.qualifiedPerPoule} premiers`, icon: Icons.star },
                      { label: 'Phases finales', value: 'Élimination simple', icon: Icons.flag }
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
                    <div className="mt-6 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                      <h4 className="font-bold text-gray-900 mb-2 flex items-center">
                        {Icons.shuffle}
                        <span className="ml-2">Configuration Mêlée Tournante</span>
                      </h4>
                      <p className="text-sm text-gray-900">
                        Rotation des équipes : <span className="font-bold">
                          {formData.meleeRotation === 'par_tour' ? 'Par tour' : 'Après chaque match'}
                        </span>
                      </p>
                      <p className="text-xs text-gray-900 mt-1">
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
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
                          <div className="flex flex-col sm:flex-row sm:justify-around gap-3 sm:gap-0 text-center">
                            <div className="flex-1">
                              <p className="text-xl sm:text-2xl font-bold text-blue-600">{hommes}</p>
                              <p className="text-xs text-gray-600">Hommes</p>
                            </div>
                            <div className="hidden sm:block w-px bg-gray-200"></div>
                            <div className="flex-1">
                              <p className="text-xl sm:text-2xl font-bold text-pink-600">{femmes}</p>
                              <p className="text-xs text-gray-600">Femmes</p>
                            </div>
                            <div className="hidden sm:block w-px bg-gray-200"></div>
                            <div className="flex-1">
                              <p className="text-xl sm:text-2xl font-bold text-green-600">{getEstimatedTeams()}</p>
                              <p className="text-xs text-gray-600">Équipes possibles</p>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
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
                            <span className="text-sm text-gray-700 truncate">{player.name}</span>
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
                            <span className="text-sm text-gray-700 truncate flex-1">{player.name}</span>
                            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded whitespace-nowrap">Nouveau</span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Estimation du déroulement */}
                  <div className="mt-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                      {Icons.petanque}
                      <span className="ml-2">Estimation du tournoi</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
              <div className="text-center mt-6 sm:mt-8">
                <button
                  onClick={handleSubmit}
                  disabled={savingTournament}
                  className={`
                    relative px-6 sm:px-12 py-4 sm:py-5 text-base sm:text-lg font-bold rounded-2xl transition-all transform
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
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 mt-12">
          <button
            onClick={() => {
              if (currentStep > 1) {
                setCurrentStep(currentStep - 1)
              }
            }}
            className={`px-4 sm:px-6 py-3 rounded-xl font-medium transition-all ${
              currentStep === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
            disabled={currentStep === 1}
          >
            ← Retour
          </button>

          {currentStep < 5 && (
            <button
              onClick={handleContinue}
              disabled={!canProceed()}
              className={`
                flex items-center justify-center px-6 sm:px-8 py-3 rounded-xl font-medium transition-all
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