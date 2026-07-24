/**
 * Hook pour la création du tournoi et ses entités.
 *
 * Création ATOMIQUE : au lieu d'une saga de N requêtes HTTP séquentielles
 * (joueurs → tournoi → équipes → settings → matchs) qui laissait des données
 * partielles en cas d'échec, on construit tout le payload côté client
 * (compositions d'équipes + matchs, avec des jetons "new:<index>" pour les
 * joueurs à créer) puis on l'envoie en UN seul appel à POST /api/tournois/full,
 * qui insère l'ensemble dans une transaction PG (rollback global si erreur).
 */

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { ValidationService } from '@/lib/services'
import { MixiteService } from '@/lib/services/mixite.service'
import { readHistory } from '@/lib/services/playerHistory'
import type { Joueur } from '@/lib/types'
import type { TournamentFormData } from './useCreateTournament'
import { buildTeamsAndMatches, type PlayerRef } from '@/lib/tournament/creationPayload'
import { configFromForm } from '@/lib/engine/configFromForm'
import { startTournament } from '@/lib/engine/incremental'
import { engineTeamsToPayload, engineMatchesToPayload } from '@/lib/engine/adapter'
import { Rng } from '@/lib/engine/rng'
import type { EnginePlayer } from '@/lib/engine/types'

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
  savingTournament: boolean
  successAnimation: boolean
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

  const notify = {
    error: (msg: string) => onError ? onError(msg) : console.error(msg),
    warning: (msg: string) => onWarning ? onWarning(msg) : console.warn(msg)
  }

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

    // --- Validations préalables (identiques à l'ancien flux) ---
    const formatValidation = MixiteService.validateFormatMixite(formData.format, formData.mixiteObligatoire)
    if (!formatValidation.valid) {
      notify.error(formatValidation.error || 'Format invalide')
      return
    }

    // Nouveaux joueurs (avec jetons "new:<index>")
    const newPlayerInputs = formData.newPlayers.filter(np => np.name.trim())
    const newPlayerRefs: PlayerRef[] = newPlayerInputs.map((np, i) => ({
      id: `new:${i}`, name: np.name.trim(), gender: np.gender
    }))

    // Joueurs existants sélectionnés
    const selectedExisting: PlayerRef[] = formData.selectedPlayers
      .map(id => availablePlayers.find(p => p.id === id))
      .filter((p): p is Joueur => !!p)
      // niveau cumulé (historique inter-concours) attaché pour l'équilibrage optionnel des tirages
      .map(p => ({ id: p.id, name: p.name, gender: p.gender, email: p.email, niveau: readHistory((p as { stats?: unknown }).stats).niveau }))

    const combinedPlayers: PlayerRef[] = [...selectedExisting, ...newPlayerRefs]
    const allPlayerIds = combinedPlayers.map(p => p.id)

    // Validation mixité si obligatoire
    if (formData.mixiteObligatoire && formData.mode !== 'choisi') {
      const genderValidation = MixiteService.validatePlayerGenders(combinedPlayers as unknown as Joueur[], true)
      if (!genderValidation.valid) {
        notify.error(genderValidation.error || 'Configuration mixité invalide')
        return
      }
      // FIX M4 : mixité obligatoire réellement vérifiée — sans au moins 1 homme ET
      // 1 femme, aucune équipe mixte n'est possible. On bloque au lieu de produire
      // silencieusement des équipes non mixtes.
      const nbH = combinedPlayers.filter(p => p.gender === 'H').length
      const nbF = combinedPlayers.filter(p => p.gender === 'F').length
      if (nbH < 1 || nbF < 1) {
        notify.error('Mixité obligatoire impossible : il faut au moins 1 homme et 1 femme.')
        return
      }
      if (nbH !== nbF && formData.format !== 'triplette') {
        notify.warning(`Déséquilibre H/F (${nbH}H / ${nbF}F) : certaines équipes ne pourront pas être parfaitement mixtes.`)
      }
    }

    // Validation nombre de joueurs (hors mode choisi)
    if (formData.mode !== 'choisi') {
      if (allPlayerIds.length === 0) {
        notify.error('Aucun joueur sélectionné')
        return
      }
      const countMode = formData.mode === 'personnalise' ? 'melee_fixe' : formData.mode
      const countValidation = ValidationService.validatePlayerCount(allPlayerIds.length, formData.format, countMode)
      if (!countValidation.valid) {
        notify.error(countValidation.error || 'Nombre de joueurs invalide')
        return
      }
    }

    // Validation poules (seulement si des poules seront générées)
    const willGeneratePoules = formData.mode !== 'choisi' &&
      !(formData.format === 'tete_a_tete' && formData.mode === 'melee_tournante')
    if (willGeneratePoules) {
      const pouleValidation = ValidationService.validatePouleSize(formData.pouleSize, getEstimatedTeams())
      if (!pouleValidation.valid) {
        notify.error(`Configuration invalide: ${pouleValidation.error || pouleValidation.warning}`)
        return
      }
    }

    // Validation date (comparaison de chaînes YYYY-MM-DD, sans piège de fuseau)
    const todayStr = new Date().toLocaleDateString('en-CA') // YYYY-MM-DD en heure locale
    if (formData.date && formData.date < todayStr) {
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
      // MODE PERSONNALISÉ : le moteur de règles libre compose la config, forme les
      // équipes et génère le premier lot de matchs (le reste est généré au fil des
      // scores via /api/tournois/[id]/engine-advance).
      const isPersonnalise = formData.mode === 'personnalise'
      let engineConfig: ReturnType<typeof configFromForm> | null = null
      let engineTeamCount = 0

      let teams: { name: string; joueur_ids: string[] }[]
      let matches: Array<{ team_a_index: number; team_b_index: number | null; tour: number; terrain: number | null; type: string; poule: string | null; status: string }>
      let unassignedCount = 0

      if (isPersonnalise) {
        engineConfig = configFromForm({
          format: formData.format,
          maxPoints: formData.maxPoints,
          fairPlay: formData.fairPlay,
          mixiteObligatoire: formData.mixiteObligatoire,
          mixiteAdversaire: formData.mixiteAdversaire,
          consolante: formData.consolante,
          engineFormation: formData.engineFormation,
          engineStructure: formData.engineStructure,
          rounds: formData.nombreParties || 3,
          pouleSize: formData.pouleSize,
          qualifiedPerPoule: formData.qualifiedPerPoule,
          diffFirst: formData.diffFirst,
          seed: Rng.seedFromString(formData.name.trim() + formData.date),
        })
        const enginePlayers: EnginePlayer[] = combinedPlayers.map(p => ({
          id: p.id, gender: p.gender, niveau: p.niveau,
        }))
        const started = startTournament(engineConfig, enginePlayers)
        engineTeamCount = started.teams.length
        teams = engineTeamsToPayload(started.teams)
        matches = engineMatchesToPayload(started.matches, engineConfig, formData.terrains)
      } else {
        // Construire équipes + matchs (indexés)
        const built = buildTeamsAndMatches(
          {
            format: formData.format,
            mode: formData.mode as 'choisi' | 'melee_fixe' | 'melee_tournante',
            mixiteObligatoire: formData.mixiteObligatoire,
            mixiteAdversaire: formData.mixiteAdversaire,
            nombreParties: formData.nombreParties || 0,
            equilibrageNiveau: formData.equilibrageNiveau,
            pouleSize: formData.pouleSize,
            terrains: formData.terrains,
          },
          combinedPlayers
        )
        teams = built.teams
        matches = built.matches
        unassignedCount = built.unassignedCount
      }
      if (unassignedCount > 0) {
        notify.warning(`${unassignedCount} joueur(s) non assigné(s) en raison de la mixité`)
      }

      const isMeleeTournante = formData.mode === 'melee_tournante'

      const settings: Record<string, unknown> = {
        date: formData.date,
        time: formData.time,
        location: formData.location?.trim() || null,
        terrains: formData.terrains,
        terrainNames: formData.terrainNames,
        maxPoints: formData.maxPoints,
        timeLimit: formData.timeLimit,
        timeLimitMinutes: formData.timeLimit ? formData.timeLimitMinutes : 60,
        pouleSize: formData.pouleSize,
        eliminationFormat: formData.eliminationFormat,
        meleeRotation: isMeleeTournante ? formData.meleeRotation : null,
        nombreParties: formData.nombreParties || 0,
        qualifiedPerPoule: formData.qualifiedPerPoule,
        consolante: formData.consolante,
        fairPlay: formData.fairPlay,
        recordMenes: formData.recordMenes,
        mixiteObligatoire: formData.mixiteObligatoire,
        mixiteAdversaire: formData.mixiteAdversaire,
        equilibrageNiveau: formData.equilibrageNiveau,
        allowPhotos: formData.allowPhotos,
        sendNotifications: formData.sendNotifications,
        players: allPlayerIds,
        // Poules/matchs créés dans le même appel → poules_created dès la création
        // (sauf mode choisi où l'organisateur compose ensuite).
        poules_created: formData.mode !== 'choisi',
      }
      if (isMeleeTournante) {
        settings.melee_tournante_players = allPlayerIds
        settings.current_round = 1
      }
      if (isPersonnalise && engineConfig) {
        // Config du moteur + nombre d'équipes d'origine (espace d'indices pour l'avance).
        settings.ruleEngine = engineConfig
        settings.ruleEngineTeamCount = engineTeamCount
        settings.poules_created = true
      }

      const payload = {
        tournoi: {
          org_id: organization.id,
          name: formData.name.trim(),
          mode: formData.mode,
          format: formData.format,
          visibility: formData.visibility,
          settings,
        },
        newPlayers: newPlayerInputs.map(np => ({
          name: np.name.trim(),
          gender: np.gender,
          email: np.email?.trim() && isValidEmail(np.email) ? np.email.trim() : null,
          phone: np.phone?.trim() || null,
        })),
        teams,
        matches,
      }

      const res = await fetch('/api/tournois/full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Erreur lors de la création du tournoi')
      }

      const data = await res.json()
      const tournoiId = data?.tournoi?.id

      setSuccessAnimation(true)
      await new Promise(r => setTimeout(r, 400))
      router.push(`/tournoi/${tournoiId}`)
    } catch (error) {
      // Création atomique : en cas d'échec, AUCUNE donnée partielle (rollback serveur).
      const msg = error instanceof Error ? error.message : 'Erreur lors de la création'
      notify.error(msg)
      console.error('Erreur création:', error)
    } finally {
      setSavingTournament(false)
    }
  }, [
    user, organization, router, refreshOrganization,
    formData, availablePlayers, getEstimatedTeams
  ])

  return {
    savingTournament,
    successAnimation,
    handleSubmit
  }
}

export default useTournamentCreation
