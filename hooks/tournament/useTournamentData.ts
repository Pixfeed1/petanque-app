/**
 * Hook principal pour charger et gérer les données d'un tournoi
 * Centralise le chargement de: tournament, teams, matches
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import type { Joueur } from '@/lib/types'

// Types locaux pour le hook
export interface TournamentSettings {
  date: string
  time: string
  location?: string
  terrains: number
  maxPoints: number
  pouleSize?: number
  eliminationFormat?: 'simple' | 'double'
  meleeRotation?: 'par_tour' | 'par_match'
  mixiteObligatoire?: boolean
  qualifiedPerPoule?: number
  consolante?: boolean
  fairPlay?: boolean
  recordMenes?: boolean
  timeLimit?: boolean
  timeLimitMinutes?: number
  allowPhotos?: boolean
  sendNotifications?: boolean
  players: string[]
  poules_created?: boolean
  available_players?: string[]  // Joueurs sélectionnés pour Mode Choisi
}

export interface Tournament {
  id: string
  name: string
  mode: 'choisi' | 'melee_fixe' | 'melee_tournante'
  format: 'tete_a_tete' | 'doublette' | 'triplette'
  status: 'preparation' | 'en_cours' | 'termine'
  settings: TournamentSettings
  org_id?: string
}

export interface EquipeJoueur {
  joueur: Joueur
  role: string
}

export interface Team {
  id: string
  name: string
  joueur_ids?: string[]
  equipes_joueurs?: EquipeJoueur[]
  victories?: number
  defeats?: number
  difference?: number
  points?: number
  pointsFor?: number
  pointsAgainst?: number
}

export interface Manche {
  scoreA: number
  scoreB: number
}

export interface Match {
  id: string
  equipe_a: Team | null
  equipe_b: Team | null
  equipe_a_id?: string
  equipe_b_id?: string
  terrain: number | null
  tour: number
  status: 'a_jouer' | 'en_cours' | 'termine' | 'en_attente_validation'
  score_a: number
  score_b: number
  type?: 'poule' | 'elimination' | 'demi' | 'finale' | 'petite_finale' | 'bye' | 'quart' | 'huitieme'
  poule?: string
  round?: number
  manches_json?: Manche[]
  started_at?: string
  ended_at?: string
  validated_at?: string
  played_at?: string
  proposed_by?: string
  proposed_at?: string
  tournoi?: Tournament
}

interface UseTournamentDataProps {
  tournamentId: string | string[] | undefined
}

interface UseTournamentDataReturn {
  // States
  tournament: Tournament | null
  setTournament: React.Dispatch<React.SetStateAction<Tournament | null>>
  teams: Team[]
  setTeams: React.Dispatch<React.SetStateAction<Team[]>>
  matches: Match[]
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>
  loading: boolean
  error: string | null  // C4 FIX: Exposer les erreurs à l'utilisateur
  isOrganizer: boolean
  userPlan: string

  // Actions
  loadTournamentData: () => Promise<void>
  checkAndUpdateTournamentStatus: (tournamentData: Tournament, matchesData: Match[]) => Promise<Tournament>
}

export function useTournamentData({ tournamentId }: UseTournamentDataProps): UseTournamentDataReturn {
  const { user, organization } = useAuth()

  // States principaux
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)  // C4 FIX: État erreur
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [userPlan, setUserPlan] = useState('free')

  // Récupérer le plan de l'utilisateur
  useEffect(() => {
    if (organization?.settings?.plan && typeof organization.settings.plan === 'string') {
      setUserPlan(organization.settings.plan)
    }
  }, [organization])

  /**
   * Vérifie et met à jour automatiquement le statut du tournoi
   * - preparation -> en_cours si matchs commencés
   * - en_cours -> termine si tous matchs finis
   */
  const checkAndUpdateTournamentStatus = useCallback(async (
    tournamentData: Tournament,
    matchesData: Match[]
  ): Promise<Tournament> => {
    if (matchesData.length === 0) return tournamentData

    // 1. Si le tournoi est en "préparation" et qu'un match a commencé ou est terminé, passer à "en_cours"
    if (tournamentData.status === 'preparation') {
      const hasStartedMatches = matchesData.some(m => m.status === 'en_cours' || m.status === 'termine')

      if (hasStartedMatches) {
        try {
          const updateResponse = await fetch(`/api/tournois/${tournamentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: 'en_cours' })
          })

          if (updateResponse.ok) {
            const updatedTournoi = await updateResponse.json()
            setTournament(updatedTournoi)
            return updatedTournoi
          }
        } catch (error) {
          console.error('Erreur mise à jour statut tournoi en_cours:', error)
        }
      }
    }

    // 2. Si le tournoi est "en_cours" et que tous les matchs sont terminés, passer à "termine"
    // FIX: Ne pas terminer le tournoi si la finale n'a pas encore eu lieu
    if (tournamentData.status === 'en_cours') {
      const allMatchesFinished = matchesData.every(m => m.status === 'termine')
      const hasFinale = matchesData.some(m => m.type === 'finale')
      const finaleFinished = matchesData.some(m => m.type === 'finale' && m.status === 'termine')

      // Ne terminer que si la finale existe ET est terminée (ou s'il n'y a que des matchs de poule terminés sans possibilité de phases finales)
      if (allMatchesFinished && hasFinale && finaleFinished) {
        try {
          const updateResponse = await fetch(`/api/tournois/${tournamentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: 'termine' })
          })

          if (updateResponse.ok) {
            const updatedTournoi = await updateResponse.json()
            setTournament(updatedTournoi)
            return updatedTournoi
          }
        } catch (error) {
          console.error('Erreur mise à jour statut tournoi termine:', error)
        }
      }
    }

    return tournamentData
  }, [tournamentId])

  /**
   * Charge toutes les données du tournoi (tournoi, équipes, matchs)
   */
  const loadTournamentData = useCallback(async () => {
    if (!tournamentId) return

    try {
      // Charger le tournoi
      const tournamentResponse = await fetch(`/api/tournois/${tournamentId}`, {
        credentials: 'include'
      })

      if (!tournamentResponse.ok) throw new Error('Erreur chargement tournoi')
      const tournamentData = await tournamentResponse.json()

      if (tournamentData) {
        setTournament(tournamentData)

        // Charger les équipes - enrichies avec les joueurs via l'API
        const teamsResponse = await fetch(`/api/equipes?tournoi_id=${tournamentId}`, {
          credentials: 'include'
        })

        if (!teamsResponse.ok) throw new Error('Erreur chargement équipes')
        const teamsData = await teamsResponse.json()

        // Optimisation: charger tous les joueurs de l'org en une seule requête
        // puis les mapper aux équipes côté client (évite N+1 queries)
        const allJoueurIds = new Set<string>()
        teamsData.forEach((team: Team) => {
          if (team.joueur_ids && Array.isArray(team.joueur_ids)) {
            team.joueur_ids.forEach(id => allJoueurIds.add(id))
          }
        })

        let joueursMap: Map<string, Joueur> = new Map()
        if (allJoueurIds.size > 0 && organization?.id) {
          try {
            const joueursResponse = await fetch(`/api/joueurs?org_id=${organization.id}&limit=1000`, {
              credentials: 'include'
            })
            if (joueursResponse.ok) {
              const joueursData = await joueursResponse.json()
              const joueurs = Array.isArray(joueursData) ? joueursData : joueursData.joueurs || []
              joueurs.forEach((j: Joueur) => joueursMap.set(j.id, j))
            }
          } catch (e) {
            console.warn('Erreur chargement joueurs:', e)
          }
        }

        // Enrichir les équipes avec les joueurs du cache
        const enrichedTeams = teamsData.map((team: Team) => {
          if (team.joueur_ids && Array.isArray(team.joueur_ids) && team.joueur_ids.length > 0) {
            team.equipes_joueurs = team.joueur_ids
              .map(id => joueursMap.get(id))
              .filter((j): j is Joueur => j !== undefined)
              .map(joueur => ({ joueur, role: 'joueur' }))
          }
          return team
        })
        setTeams(enrichedTeams)

        // Charger les matchs
        const matchesResponse = await fetch(`/api/matches?tournoi_id=${tournamentId}`, {
          credentials: 'include'
        })

        if (!matchesResponse.ok) throw new Error('Erreur chargement matchs')
        const matchesData = await matchesResponse.json()

        // Mise à jour de l'état des matchs
        setMatches(matchesData || [])

        // Vérifier et mettre à jour le statut du tournoi si nécessaire
        const finalTournamentData = await checkAndUpdateTournamentStatus(tournamentData, matchesData)

        // Vérifier si l'utilisateur est organisateur
        if (user && organization && finalTournamentData.org_id === organization.id) {
          setIsOrganizer(true)
        } else {
          setIsOrganizer(false)
        }
      }
    } catch (err) {
      console.error('Erreur chargement tournoi:', err)
      // C4 FIX: Exposer l'erreur à l'utilisateur au lieu d'être silencieux
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du tournoi'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [tournamentId, user, organization, checkAndUpdateTournamentStatus])

  // Charger les données au montage
  useEffect(() => {
    if (user && tournamentId) {
      loadTournamentData()
    }
  }, [user, tournamentId, loadTournamentData])

  return {
    // States
    tournament,
    setTournament,
    teams,
    setTeams,
    matches,
    setMatches,
    loading,
    error,  // C4 FIX: Exposer l'erreur
    isOrganizer,
    userPlan,

    // Actions
    loadTournamentData,
    checkAndUpdateTournamentStatus
  }
}

export default useTournamentData
