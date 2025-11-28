/**
 * Hook pour la création du tournoi et ses entités
 * - Création des joueurs
 * - Création des équipes (avec mixité)
 * - Création des matchs de poules
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { ValidationService } from '@/lib/services'
import { MixiteService } from '@/lib/services/mixite.service'
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
  onError?: (message: string) => void
  onWarning?: (message: string) => void
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
  getEstimatedTeams,
  onError,
  onWarning
}: UseTournamentCreationProps): UseTournamentCreationReturn {
  const router = useRouter()
  const { user, organization, refreshOrganization } = useAuth()

  const [savingTournament, setSavingTournament] = useState(false)
  const [successAnimation, setSuccessAnimation] = useState(false)

  // Système de notification avec fallback
  const notify = {
    error: (msg: string) => onError ? onError(msg) : console.error(msg),
    warning: (msg: string) => onWarning ? onWarning(msg) : console.warn(msg)
  }

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

    // Créer toutes les équipes en batch (1 seule requête au lieu de N)
    const teamsToCreate = mixiteResult.teams.map((team, index) => ({
      tournoi_id: tournoi.id,
      name: prefix ? `${prefix}Équipe ${index + 1}` : `Équipe ${index + 1}`,
      joueur_ids: team.joueur_ids,
      stats: { victoires: 0, defaites: 0, points_pour: 0, points_contre: 0 }
    }))

    const teamsBatchResponse = await fetch('/api/equipes/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ teams: teamsToCreate })
    })

    if (!teamsBatchResponse.ok) {
      throw new Error('Erreur lors de la création des équipes en batch')
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

    // Créer tous les matchs en batch (1 seule requête au lieu de N)
    const matchesBatchResponse = await fetch('/api/matches/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ matches: matchesToCreate })
    })

    if (!matchesBatchResponse.ok) {
      const error = await matchesBatchResponse.json()
      throw new Error(error.error || 'Erreur lors de la création des matchs en batch')
    }

    const matchesResult = await matchesBatchResponse.json()
    if (matchesResult.created !== matchesToCreate.length) {
      throw new Error(`Seulement ${matchesResult.created}/${matchesToCreate.length} matchs créés`)
    }
  }, [formData])

  /**
   * Soumission du formulaire
   */
  const handleSubmit = useCallback(async () => {
    if (!user) {
      notify.error('Vous devez être connecté')
      router.push('/login')
      return
    }

    if (!organization?.id || organization.id.startsWith('temp-')) {
      notify.error('Organisation invalide. Veuillez vous reconnecter.')
      if (refreshOrganization) {
        try {
          await refreshOrganization()
          notify.warning('Organisation rechargée. Réessayez.')
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
      notify.error(formatValidation.error || 'Format invalide')
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
        notify.error(genderValidation.error || 'Configuration mixité invalide')
        return
      }
    }

    // Validation poules
    const pouleValidation = ValidationService.validatePouleSize(formData.pouleSize, getEstimatedTeams())
    if (!pouleValidation.valid) {
      notify.error(`Configuration invalide: ${pouleValidation.error || pouleValidation.warning}`)
      return
    }

    // Validation terrains vs matchs simultanés (warning seulement, non bloquant)
    const estimatedTeams = getEstimatedTeams()
    if (estimatedTeams > 0) {
      const terrainValidation = ValidationService.validateTerrainsVsMatches(
        formData.terrains,
        estimatedTeams,
        formData.pouleSize
      )
      if (terrainValidation.warning) {
        notify.warning(terrainValidation.warning)
      }
    }

    // Validation date
    const selectedDate = new Date(formData.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selectedDate < today) {
      notify.error('La date doit être ultérieure ou égale à aujourd\'hui.')
      return
    }

    // Validation qualifiés < taille poule
    if (formData.qualifiedPerPoule >= formData.pouleSize) {
      notify.error(`Le nombre de qualifiés (${formData.qualifiedPerPoule}) doit être < taille poule (${formData.pouleSize})`)
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

      // 3. Créer équipes et matchs selon le mode
      if (formData.mode === 'choisi') {
        // MODE CHOISI : Les équipes seront formées manuellement
        // On enregistre juste les joueurs disponibles dans les settings
        if (allPlayerIds.length > 0) {
          await fetch(`/api/tournois/${tournoi.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              settings: {
                ...tournoi.settings,
                available_players: allPlayerIds,
                poules_created: false
              }
            })
          })
        }
        // Note: En mode choisi, l'utilisateur doit créer les équipes manuellement
        // puis générer les poules depuis la page du tournoi
      } else {
        // MODES MÊLÉE : Créer équipes automatiquement
        const unassigned = await createTeamsWithMixity(tournoi, allPlayerIds, allPlayersUpdated)

        if (unassigned > 0) {
          notify.warning(`${unassigned} joueur(s) non assigné(s) en raison de la mixité`)
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
      notify.error(`${msg}. Des données partielles peuvent avoir été créées.`)
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
