/**
 * Hook pour le calcul et l'affichage des classements
 * - Classement par équipe (modes choisi et mêlée fixe)
 * - Classement individuel (mode mêlée tournante)
 * - Classement par poule
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { useAuth } from '@/app/providers/AuthProvider'
import { StatsService } from '@/lib/services'
import type { Match as MatchType, Joueur } from '@/lib/types'
import type { Tournament, Team, Match } from './useTournamentData'

export interface PlayerWithStats extends Joueur {
  played: number
  victories: number
  defeats: number
  draws: number
  pointsFor: number
  pointsAgainst: number
  difference: number
  points: number
}

export interface TeamWithStats extends Team {
  played: number
  victories: number
  defeats: number
  draws: number
  pointsFor: number
  pointsAgainst: number
  difference: number
}

interface UseRankingsProps {
  tournament: Tournament | null
  teams: Team[]
  matches: Match[]
}

interface UseRankingsReturn {
  // Computed values
  teamsWithStats: TeamWithStats[]
  teamsByPoule: { [key: string]: TeamWithStats[] }
  individualRankings: PlayerWithStats[]

  // States
  refreshingClassement: boolean

  // Actions
  loadIndividualRankings: () => Promise<void>
  refreshClassement: (loadTournamentData: () => Promise<void>) => Promise<void>
}

export function useRankings({
  tournament,
  teams,
  matches
}: UseRankingsProps): UseRankingsReturn {
  const { organization } = useAuth()

  const [individualRankings, setIndividualRankings] = useState<PlayerWithStats[]>([])
  const [refreshingClassement, setRefreshingClassement] = useState(false)
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Calcul optimisé du classement des équipes avec useMemo + StatsService
   */
  const teamsWithStats = useMemo((): TeamWithStats[] => {
    return teams.map(team => {
      const stats = StatsService.calculateTeamStats(team.id, team.name, matches as unknown as MatchType[])
      return {
        ...team,
        played: stats.played,
        victories: stats.victories,
        defeats: stats.defeats,
        draws: stats.draws,
        pointsFor: stats.pointsFor,
        pointsAgainst: stats.pointsAgainst,
        difference: stats.difference
      }
    })
  }, [teams, matches])

  /**
   * Classement par poule optimisé avec confrontation directe FIPJP
   */
  const teamsByPoule = useMemo((): { [key: string]: TeamWithStats[] } => {
    const poules: { [key: string]: TeamWithStats[] } = {}

    teamsWithStats.forEach(team => {
      // Trouver la poule de cette équipe
      // Utiliser equipe_a_id/equipe_b_id en priorité (toujours présents)
      // puis fallback sur equipe_a?.id (si relation jointe)
      const pouleMatch = matches.find(m =>
        (m.equipe_a_id === team.id || m.equipe_b_id === team.id ||
         m.equipe_a?.id === team.id || m.equipe_b?.id === team.id) && m.poule
      )

      // 🔧 FIX: Ne pas assigner de poule par défaut aux équipes sans matchs
      // L'ancien `|| 'A'` créait une poule fantôme corrompant les classements
      if (!pouleMatch?.poule) {
        // Équipe orpheline (pas encore de matchs) - ne pas l'inclure dans le classement par poule
        return
      }
      const poule = pouleMatch.poule

      if (!poules[poule]) poules[poule] = []
      poules[poule].push(team)
    })

    // Trier chaque poule avec StatsService (inclut confrontation directe)
    Object.keys(poules).forEach(poule => {
      // Convertir en TeamStats avec points FIPJP
      const teamsStats = poules[poule].map(team => ({
        id: team.id,
        name: team.name,
        played: team.played ?? 0,
        victories: team.victories ?? 0,
        defeats: team.defeats ?? 0,
        draws: team.draws ?? 0,
        pointsFor: team.pointsFor ?? 0,
        pointsAgainst: team.pointsAgainst ?? 0,
        difference: team.difference ?? 0,
        points: (team.victories ?? 0) * 3 + (team.draws ?? 0)
      }))

      // Utiliser le service avec confrontation directe
      const sorted = StatsService.sortTeamsByFIPJPRules(
        teamsStats,
        matches as unknown as MatchType[],
        poule
      )

      // Remplacer la poule triée en gardant les propriétés complètes
      const originalPouleTeams = poules[poule]
      poules[poule] = sorted
        .map(stats => originalPouleTeams.find(t => t.id === stats.id))
        .filter((team): team is TeamWithStats => team !== undefined)
    })

    return poules
  }, [teamsWithStats, matches])

  /**
   * Charge le classement individuel (pour mêlée tournante)
   */
  const loadIndividualRankings = useCallback(async () => {
    if (!organization || !tournament) return

    try {
      // Charger tous les joueurs de l'organisation
      const joueursResponse = await fetch(`/api/joueurs?org_id=${organization.id}`, {
        credentials: 'include'
      })

      if (!joueursResponse.ok) return
      const joueursData = await joueursResponse.json()
      const joueurs = Array.isArray(joueursData) ? joueursData : joueursData.joueurs || []

      // Charger toutes les équipes et matchs du tournoi
      const equipesResponse = await fetch(`/api/equipes?tournoi_id=${tournament.id}`, {
        credentials: 'include'
      })
      const matchesResponse = await fetch(`/api/matches?tournoi_id=${tournament.id}`, {
        credentials: 'include'
      })

      if (!equipesResponse.ok || !matchesResponse.ok) return

      const equipesData = await equipesResponse.json()
      const matchesData = await matchesResponse.json()

      // Calculer les stats de tous les joueurs en batch (optimisé O(n) vs O(n*m))
      const teamsForStats = equipesData.map((eq: Team) => ({
        id: eq.id,
        joueur_ids: eq.joueur_ids || []
      }))

      const statsArray = StatsService.calculateAllPlayersStats(
        joueurs,
        matchesData as unknown as MatchType[],
        teamsForStats
      )

      // Fusionner les stats avec les données joueurs
      const playerStats: PlayerWithStats[] = joueurs.map((joueur: Joueur, index: number) => ({
        ...joueur,
        played: statsArray[index].played,
        victories: statsArray[index].victories,
        defeats: statsArray[index].defeats,
        draws: statsArray[index].draws,
        pointsFor: statsArray[index].pointsFor,
        pointsAgainst: statsArray[index].pointsAgainst,
        difference: statsArray[index].difference,
        points: statsArray[index].points
      }))

      // Trier par règle FIPJP
      // 🔧 FIX: Tri par points FIPJP (victoires×3 + nuls×1) au lieu de victoires seules
      playerStats.sort((a: PlayerWithStats, b: PlayerWithStats) => {
        // 1. Points FIPJP (critère principal)
        if (b.points !== a.points) return b.points - a.points
        // 2. Différence de points
        if (b.difference !== a.difference) return b.difference - a.difference
        // 3. Points marqués
        return b.pointsFor - a.pointsFor
      })

      setIndividualRankings(playerStats)
    } catch (error) {
      console.error('Erreur chargement classement individuel:', error)
    }
  }, [organization, tournament])

  /**
   * Rafraîchit le classement en forçant le rechargement complet
   */
  const refreshClassement = useCallback(async (loadTournamentData: () => Promise<void>) => {
    setRefreshingClassement(true)

    // Clear previous timeout if any
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    // Attendre un peu puis recharger
    refreshTimeoutRef.current = setTimeout(async () => {
      await loadTournamentData()
      setRefreshingClassement(false)
      refreshTimeoutRef.current = null
    }, 100)
  }, [])

  return {
    // Computed values
    teamsWithStats,
    teamsByPoule,
    individualRankings,

    // States
    refreshingClassement,

    // Actions
    loadIndividualRankings,
    refreshClassement
  }
}

export default useRankings
