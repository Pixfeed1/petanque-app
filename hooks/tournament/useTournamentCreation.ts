/**
 * Hook pour la création du tournoi et ses entités
 * - Création des joueurs
 * - Création des équipes (avec mixité)
 * - Création des matchs de poules
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { ValidationService, MixiteService } from '@/lib/services'
import type { Joueur, Tournoi } from '@/lib/types'
import type { TournamentFormData, NewPlayer } from './useCreateTournament'

// Validation email
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

interface UseTournamentCreationProps {
  formData: TournamentFormData
  availablePlayers: Joueur[]
  getEstimatedTeams: () => number
}

interface UseTournamentCreationReturn {
  // State
  savingTournament: boolean
  successAnimation: boolean

  // Actions
  handleSubmit: () => Promise<void>
}

export function useTournamentCreation({
  formData,
  availablePlayers,
  getEstimatedTeams
}: UseTournamentCreationProps): UseTournamentCreationReturn {
  const router = useRouter()
  const { user, organization, refreshOrganization } = useAuth()

  const [savingTournament, setSavingTournament] = useState(false)
  const [successAnimation, setSuccessAnimation] = useState(false)

  /**
   * Crée une équipe avec ses joueurs
   */
  const createTeamWithPlayers = useCallback(async (
    tournoiId: string,
    teamNumber: number,
    playerIds: string[],
    prefix: string = ''
  ) => {
    const teamName = prefix ? `${prefix}Équipe ${teamNumber}` : `Équipe ${teamNumber}`

    const response = await fetch('/api/equipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        tournoi_id: tournoiId,
        name: teamName,
        joueur_ids: playerIds,
        stats: { victoires: 0, defaites: 0, points_pour: 0, points_contre: 0 }
      })
    })

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.error || 'Erreur création équipe')
    }

    return response.json()
  }, [])

  /**
   * Crée les équipes avec mixité
   */
  const createTeamsWithMixity = useCallback(async (
    tournoi: Tournoi,
    allPlayerIds: string[],
    updatedPlayersList: Joueur[]
  ): Promise<number> => {
    const playersPerTeam = formData.format === 'tete_a_tete' ? 1 :
      formData.format === 'doublette' ? 2 : 3

    // Validation
    const validation = ValidationService.validatePlayerCount(
      allPlayerIds.length,
      formData.format,
      formData.mode
    )
    if (!validation.valid) throw new Error(validation.error)

    // MODE CHOISI : pas d'équipes auto
    if (formData.mode === 'choisi') return 0

    // Tête-à-tête : 1 joueur = 1 équipe
    if (formData.format === 'tete_a_tete') {
      const shuffled = [...allPlayerIds].sort(() => Math.random() - 0.5)
      for (let i = 0; i < shuffled.length; i++) {
        await createTeamWithPlayers(tournoi.id, i + 1, [shuffled[i]])
      }
      return 0
    }

    // MÊLÉE FIXE ou TOURNANTE : utiliser MixiteService
    const players = updatedPlayersList.filter(p => allPlayerIds.includes(p.id))
    const mixiteResult = MixiteService.createTeamsWithMixite(
      players,
      playersPerTeam as 2 | 3,
      formData.mixiteObligatoire
    )

    const prefix = formData.mode === 'melee_tournante' ? 'R1-' : ''
    let teamNumber = 1

    for (const team of mixiteResult.teams) {
      await createTeamWithPlayers(tournoi.id, teamNumber++, team.joueur_ids, prefix)
    }

    // Config mêlée tournante
    if (formData.mode === 'melee_tournante') {
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
    }

    return mixiteResult.unassignedPlayerIds.length
  }, [formData, createTeamWithPlayers])

  /**
   * Crée les matchs de poules
   */
  const createPoolMatches = useCallback(async (tournoi: Tournoi) => {
    const response = await fetch(`/api/equipes?tournoi_id=${tournoi.id}`, {
      credentials: 'include'
    })
    if (!response.ok) throw new Error('Erreur récupération équipes')

    const equipes = await response.json()
    if (!equipes?.length) throw new Error('Aucune équipe trouvée')

    const shuffled = [...equipes].sort(() => Math.random() - 0.5)
    const nbPoules = Math.ceil(shuffled.length / formData.pouleSize)

    let globalMatchNum = 0
    const matchesToCreate: any[] = []

    for (let pouleNum = 0; pouleNum < nbPoules; pouleNum++) {
      const start = pouleNum * formData.pouleSize
      const end = Math.min(start + formData.pouleSize, shuffled.length)
      const pouleEquipes = shuffled.slice(start, end)

      // Round-robin
      for (let i = 0; i < pouleEquipes.length; i++) {
        for (let j = i + 1; j < pouleEquipes.length; j++) {
          matchesToCreate.push({
            tournoi_id: tournoi.id,
            equipe_a_id: pouleEquipes[i].id,
            equipe_b_id: pouleEquipes[j].id,
            terrain: (globalMatchNum % formData.terrains) + 1,
            tour: Math.floor(globalMatchNum / formData.terrains) + 1,
            type: 'poule',
            poule: String.fromCharCode(65 + pouleNum),
            status: 'a_jouer'
          })
          globalMatchNum++
        }
      }
    }

    // Créer tous les matchs
    let created = 0
    for (const match of matchesToCreate) {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(match)
      })
      if (res.ok) created++
    }

    if (created !== matchesToCreate.length) {
      throw new Error(`Seulement ${created}/${matchesToCreate.length} matchs créés`)
    }
  }, [formData])

  /**
   * Soumission du formulaire
   */
  const handleSubmit = useCallback(async () => {
    if (!user) {
      alert('Vous devez être connecté')
      router.push('/login')
      return
    }

    if (!organization?.id || organization.id.startsWith('temp-')) {
      alert('Erreur : Organisation invalide. Veuillez vous reconnecter.')
      if (refreshOrganization) {
        try {
          await refreshOrganization()
          alert('Organisation rechargée. Réessayez.')
          return
        } catch {
          router.push('/login')
          return
        }
      }
      router.push('/dashboard')
      return
    }

    // Validations préalables
    const formatValidation = MixiteService.validateFormatMixite(formData.format, formData.mixiteObligatoire)
    if (!formatValidation.valid) {
      alert(formatValidation.error)
      return
    }

    // Validation mixité si obligatoire
    if (formData.mixiteObligatoire && formData.mode !== 'choisi') {
      const selectedExisting = availablePlayers.filter(p => formData.selectedPlayers.includes(p.id))
      const tempBase = Date.now()
      const newPlayersTemp = formData.newPlayers
        .filter(np => np.name.trim())
        .map((np, i) => ({ id: `temp-${tempBase}-${i}`, name: np.name, gender: np.gender }))

      const genderValidation = MixiteService.validatePlayerGenders(
        [...selectedExisting, ...newPlayersTemp],
        true
      )
      if (!genderValidation.valid) {
        alert(genderValidation.error)
        return
      }
    }

    // Validation poules
    const pouleValidation = ValidationService.validatePouleSize(formData.pouleSize, getEstimatedTeams())
    if (!pouleValidation.valid) {
      alert(`❌ Configuration invalide\n\n${pouleValidation.error || pouleValidation.warning}`)
      return
    }

    // Validation date
    const selectedDate = new Date(formData.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate < today) {
      alert('❌ La date doit être ultérieure ou égale à aujourd\'hui.')
      return
    }

    // Validation qualifiés < taille poule
    if (formData.qualifiedPerPoule >= formData.pouleSize) {
      alert(`❌ Le nombre de qualifiés (${formData.qualifiedPerPoule}) doit être < taille poule (${formData.pouleSize})`)
      return
    }

    setSavingTournament(true)

    try {
      // 1. Créer les nouveaux joueurs
      const newPlayerIds: string[] = []
      const allPlayersUpdated = [...availablePlayers]

      for (const np of formData.newPlayers) {
        if (np.name.trim()) {
          const emailToSave = np.email?.trim() && isValidEmail(np.email) ? np.email.trim() : null

          const res = await fetch('/api/joueurs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              org_id: organization.id,
              name: np.name.trim(),
              email: emailToSave,
              phone: np.phone?.trim() || null,
              gender: np.gender,
              stats: { gender: np.gender }
            })
          })

          if (!res.ok) throw new Error(`Impossible de créer ${np.name}`)

          const data = await res.json()
          newPlayerIds.push(data.id)
          allPlayersUpdated.push(data)
        }
      }

      // 2. Créer le tournoi
      const allPlayerIds = [...formData.selectedPlayers, ...newPlayerIds]

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
          timeLimitMinutes: formData.timeLimit ? formData.timeLimitMinutes : 60,
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
          players: allPlayerIds
        }
      }

      const tournoiRes = await fetch('/api/tournois', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(tournoiData)
      })

      if (!tournoiRes.ok) {
        const err = await tournoiRes.json()
        throw new Error(err.error || 'Erreur création tournoi')
      }

      const tournoi = await tournoiRes.json()

      // 3. Créer équipes et matchs (sauf mode choisi sans joueurs)
      if (formData.mode !== 'choisi' || allPlayerIds.length > 0) {
        const unassigned = await createTeamsWithMixity(tournoi, allPlayerIds, allPlayersUpdated)

        if (unassigned > 0) {
          alert(`⚠️ ${unassigned} joueur(s) non assigné(s) en raison de la mixité`)
        }

        await createPoolMatches(tournoi)

        // Mettre à jour le tournoi
        await fetch(`/api/tournois/${tournoi.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            status: 'preparation',
            settings: { ...tournoi.settings, poules_created: true }
          })
        })
      }

      // Animation et redirection
      setSuccessAnimation(true)
      await new Promise(r => setTimeout(r, 1500))
      router.push(`/tournoi/${tournoi.id}`)

    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur lors de la création'
      alert(`${msg}\n\nDes données partielles peuvent avoir été créées.`)
      console.error('Erreur création:', error)
    } finally {
      setSavingTournament(false)
    }
  }, [
    user, organization, router, refreshOrganization,
    formData, availablePlayers, getEstimatedTeams,
    createTeamsWithMixity, createPoolMatches
  ])

  return {
    savingTournament,
    successAnimation,
    handleSubmit
  }
}

export default useTournamentCreation
