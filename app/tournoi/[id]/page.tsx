'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'

// Icônes premium pour la pétanque
const Icons = {
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
  trophy: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v6m-3 0h6m4-13V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1H11a1 1 0 00-1 1v1.5a.5.5 0 01-.5.5H7a2 2 0 00-2 2v1c0 3.5 2.5 6 5.5 6.5m9 0c3-0.5 5.5-3 5.5-6.5V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1h-2" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  play: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  flag: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  ),
  clock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  settings: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  loader: (
    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  shuffle: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  edit: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  refresh: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
  arrow: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  grid: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
  ),
  medal: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  )
}

// Types pour le tournoi
interface Tournament {
  id: string
  name: string
  mode: 'choisi' | 'melee_fixe' | 'melee_tournante'
  format: 'doublette' | 'triplette'
  status: 'preparation' | 'en_cours' | 'termine'
  settings: {
    date: string
    time: string
    location?: string
    terrains: number
    maxPoints: number
    pouleSize?: number
    eliminationFormat?: 'simple' | 'double'
    meleeRotation?: 'par_tour' | 'par_match'
    players: string[]
  }
}

interface Team {
  id: string
  name: string
  equipes_joueurs?: any[]
}

interface Match {
  id: string
  equipe_a: Team
  equipe_b: Team
  terrain: number
  tour: number
  status: 'a_jouer' | 'en_cours' | 'termine'
  score_a: number
  score_b: number
  type?: 'poule' | 'elimination' | 'finale'
  poule?: string
}

export default function TournamentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, organization, loading: authLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [currentPhase, setCurrentPhase] = useState<'poules' | 'elimination' | 'finale'>('poules')
  const [activeTab, setActiveTab] = useState<'vue' | 'matchs' | 'classement' | 'equipes'>('vue')
  const [selectedPoule, setSelectedPoule] = useState<string>('A')
  const [isOrganizer, setIsOrganizer] = useState(false)
  const [showTeamFormation, setShowTeamFormation] = useState(false)
  const [showStartModal, setShowStartModal] = useState(false)
  const [refreshingClassement, setRefreshingClassement] = useState(false)

  // État pour la mêlée tournante
  const [currentRotation, setCurrentRotation] = useState(1)
  const [individualRankings, setIndividualRankings] = useState<any[]>([])

  // Calcul optimisé du classement avec useMemo
  const teamsWithStats = useMemo(() => {
    return teams.map(team => {
      const teamMatches = matches.filter(m =>
        (m.equipe_a?.id === team.id || m.equipe_b?.id === team.id) && m.status === 'termine'
      )

      const victories = teamMatches.filter(m =>
        (m.equipe_a?.id === team.id && m.score_a > m.score_b) ||
        (m.equipe_b?.id === team.id && m.score_b > m.score_a)
      ).length

      const defeats = teamMatches.filter(m =>
        (m.equipe_a?.id === team.id && m.score_a < m.score_b) ||
        (m.equipe_b?.id === team.id && m.score_b < m.score_a)
      ).length

      const pointsFor = teamMatches.reduce((acc, m) => {
        if (m.equipe_a?.id === team.id) return acc + (m.score_a || 0)
        if (m.equipe_b?.id === team.id) return acc + (m.score_b || 0)
        return acc
      }, 0)

      const pointsAgainst = teamMatches.reduce((acc, m) => {
        if (m.equipe_a?.id === team.id) return acc + (m.score_b || 0)
        if (m.equipe_b?.id === team.id) return acc + (m.score_a || 0)
        return acc
      }, 0)

      return {
        ...team,
        played: teamMatches.length,
        victories,
        defeats,
        pointsFor,
        pointsAgainst,
        difference: pointsFor - pointsAgainst
      }
    })
  }, [teams, matches])

  // Classement par poule optimisé
  const teamsByPoule = useMemo(() => {
    const poules: { [key: string]: any[] } = {}

    teamsWithStats.forEach(team => {
      // Trouver la poule de cette équipe
      const pouleMatch = matches.find(m =>
        (m.equipe_a?.id === team.id || m.equipe_b?.id === team.id) && m.poule
      )
      const poule = pouleMatch?.poule || 'A'

      if (!poules[poule]) poules[poule] = []
      poules[poule].push(team)
    })

    // Trier chaque poule
    Object.keys(poules).forEach(poule => {
      poules[poule].sort((a, b) => {
        if (b.victories !== a.victories) return b.victories - a.victories
        return b.difference - a.difference
      })
    })

    return poules
  }, [teamsWithStats, matches])

  useEffect(() => {
    setMounted(true)
    if (user && params.id) {
      loadTournamentData()
    }
  }, [user, params.id])

  const loadTournamentData = async () => {
    try {
      // Charger le tournoi
      const tournamentResponse = await fetch(`/api/tournois/${params.id}`, {
        credentials: 'include'
      })

      if (!tournamentResponse.ok) throw new Error('Erreur chargement tournoi')
      const tournamentData = await tournamentResponse.json()

      if (tournamentData) {
        setTournament(tournamentData)

        // Charger les équipes - enrichies avec les joueurs via l'API
        const teamsResponse = await fetch(`/api/equipes?tournoi_id=${params.id}`, {
          credentials: 'include'
        })

        if (!teamsResponse.ok) throw new Error('Erreur chargement équipes')
        const teamsData = await teamsResponse.json()

        // Enrichir chaque équipe avec les détails des joueurs
        const enrichedTeams = await Promise.all(
          teamsData.map(async (team: any) => {
            if (team.joueur_ids && Array.isArray(team.joueur_ids) && team.joueur_ids.length > 0) {
              const joueursResponse = await fetch(`/api/equipes/${team.id}`, {
                credentials: 'include'
              })
              if (joueursResponse.ok) {
                const enrichedTeam = await joueursResponse.json()
                // Adapter la structure pour correspondre à l'ancienne structure Supabase
                if (enrichedTeam.joueurs) {
                  team.equipes_joueurs = enrichedTeam.joueurs.map((joueur: any) => ({
                    joueur: joueur,
                    role: 'joueur'
                  }))
                }
              }
            }
            return team
          })
        )
        setTeams(enrichedTeams)

        // Charger les matchs
        const matchesResponse = await fetch(`/api/matches?tournoi_id=${params.id}`, {
          credentials: 'include'
        })

        if (!matchesResponse.ok) throw new Error('Erreur chargement matchs')
        const matchesData = await matchesResponse.json()

        // Mise à jour de l'état des matchs
        setMatches(matchesData || [])

        // Si mêlée tournante, charger le classement individuel
        if (tournamentData.mode === 'melee_tournante') {
          loadIndividualRankings()
        }

        // Vérifier si l'utilisateur est organisateur
        // Vérifier que le tournoi appartient bien à l'organisation de l'utilisateur
        if (user && organization && tournamentData.org_id === organization.id) {
          setIsOrganizer(true)
        } else {
          setIsOrganizer(false)
        }
      }
    } catch (error) {
      console.error('Erreur chargement tournoi:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadIndividualRankings = async () => {
    if (!organization || !params.id) return

    try {
      // Charger tous les joueurs de l'organisation
      const joueursResponse = await fetch(`/api/joueurs?org_id=${organization.id}`, {
        credentials: 'include'
      })

      if (!joueursResponse.ok) return
      const joueurs = await joueursResponse.json()

      // Charger toutes les équipes et matchs du tournoi
      const equipesResponse = await fetch(`/api/equipes?tournoi_id=${params.id}`, {
        credentials: 'include'
      })
      const matchesResponse = await fetch(`/api/matches?tournoi_id=${params.id}`, {
        credentials: 'include'
      })

      if (!equipesResponse.ok || !matchesResponse.ok) return

      const equipesData = await equipesResponse.json()
      const matchesData = await matchesResponse.json()

      // Calculer les stats de chaque joueur
      const playerStats = joueurs.map((joueur: any) => {
        let victories = 0
        let defeats = 0
        let pointsFor = 0
        let pointsAgainst = 0

        // Trouver toutes les équipes où ce joueur a joué
        const playerTeams = equipesData.filter((eq: any) =>
          eq.joueur_ids && eq.joueur_ids.includes(joueur.id)
        )

        // Pour chaque équipe, compter les matchs terminés
        playerTeams.forEach((team: any) => {
          const teamMatches = matchesData.filter((m: any) =>
            m.status === 'termine' && (m.equipe_a_id === team.id || m.equipe_b_id === team.id)
          )

          teamMatches.forEach((match: any) => {
            if (match.equipe_a_id === team.id) {
              pointsFor += match.score_a || 0
              pointsAgainst += match.score_b || 0
              if (match.score_a > match.score_b) victories++
              else defeats++
            } else {
              pointsFor += match.score_b || 0
              pointsAgainst += match.score_a || 0
              if (match.score_b > match.score_a) victories++
              else defeats++
            }
          })
        })

        return {
          ...joueur,
          victories,
          defeats,
          difference: pointsFor - pointsAgainst,
          points: pointsFor
        }
      })

      // Trier par nombre de victoires, puis différence
      playerStats.sort((a: any, b: any) => {
        if (b.victories !== a.victories) return b.victories - a.victories
        return b.difference - a.difference
      })

      setIndividualRankings(playerStats)
    } catch (error) {
      console.error('Erreur chargement classement individuel:', error)
    }
  }

  const generatePoules = async () => {
    if (!tournament || teams.length === 0) return

    const pouleSize = tournament.settings.pouleSize || 4
    const nbPoules = Math.ceil(teams.length / pouleSize)

    // Créer les poules
    const poules: { [key: string]: Team[] } = {}
    for (let i = 0; i < nbPoules; i++) {
      const pouleName = String.fromCharCode(65 + i) // A, B, C...
      poules[pouleName] = teams.slice(i * pouleSize, (i + 1) * pouleSize)
    }

    // Générer les matchs de poule (round-robin)
    try {
      for (const [pouleName, pouleTeams] of Object.entries(poules)) {
        for (let i = 0; i < pouleTeams.length; i++) {
          for (let j = i + 1; j < pouleTeams.length; j++) {
            await fetch('/api/matches', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                tournoi_id: tournament.id,
                equipe_a_id: pouleTeams[i].id,
                equipe_b_id: pouleTeams[j].id,
                tour: 1,
                terrain: null,
                type: 'poule',
                poule: pouleName,
                status: 'a_jouer'
              })
            })
          }
        }
      }

      // Recharger les données
      await loadTournamentData()
    } catch (error) {
      console.error('Erreur génération poules:', error)
    }
  }

  const reformTeamsForRotation = async () => {
    if (tournament?.mode !== 'melee_tournante') return

    const rotationType = tournament.settings.meleeRotation || 'par_tour'
    
    if (rotationType === 'par_match') {
      // Reformer après chaque match
      await createNewTeamsWithAlgorithm()
    } else {
      // Reformer après chaque tour
      const allMatchesOfCurrentTour = matches.filter(m => m.tour === currentRotation)
      const allFinished = allMatchesOfCurrentTour.every(m => m.status === 'termine')
      
      if (allFinished) {
        await createNewTeamsWithAlgorithm()
        setCurrentRotation(currentRotation + 1)
      }
    }
  }

  const createNewTeamsWithAlgorithm = async () => {
    if (!organization || !tournament?.settings.players) return

    try {
      // Charger tous les joueurs de l'organisation
      const joueursResponse = await fetch(`/api/joueurs?org_id=${organization.id}`, {
        credentials: 'include'
      })

      if (!joueursResponse.ok) return
      const allPlayers = await joueursResponse.json()

      // Filtrer pour obtenir seulement les joueurs du tournoi
      const players = allPlayers.filter((p: any) =>
        tournament.settings.players.includes(p.id)
      )

      if (players.length === 0) return

      // Mélanger les joueurs
      const shuffled = [...players].sort(() => Math.random() - 0.5)

      // Respecter la mixité H/F
      const hommes = shuffled.filter((p: any) => p.stats?.gender === 'H' || p.gender === 'H')
      const femmes = shuffled.filter((p: any) => p.stats?.gender === 'F' || p.gender === 'F')

      // Créer les nouvelles équipes
      const teamSize = tournament.format === 'doublette' ? 2 : 3
      const nbEquipes = Math.floor(players.length / teamSize)

      // Supprimer les anciennes équipes
      const oldTeams = teams
      for (const team of oldTeams) {
        await fetch(`/api/equipes/${team.id}`, {
          method: 'DELETE',
          credentials: 'include'
        })
      }

      // Former les nouvelles équipes avec mixité
      let teamNumber = 1
      const newTeams = []

      if (tournament.format === 'doublette') {
        // Pour doublette: 1H + 1F autant que possible
        while (hommes.length > 0 && femmes.length > 0 && teamNumber <= nbEquipes) {
          const teamPlayers = [hommes.shift()!.id, femmes.shift()!.id]
          newTeams.push({ name: `Équipe ${teamNumber}`, joueur_ids: teamPlayers })
          teamNumber++
        }

        // Équipes restantes sans mixité
        const remaining = [...hommes, ...femmes].sort(() => Math.random() - 0.5)
        while (remaining.length >= teamSize && teamNumber <= nbEquipes) {
          const teamPlayers = remaining.splice(0, teamSize).map(p => p.id)
          newTeams.push({ name: `Équipe ${teamNumber}`, joueur_ids: teamPlayers })
          teamNumber++
        }
      } else {
        // Pour triplette: 2H + 1F ou 1H + 2F
        while (teamNumber <= nbEquipes) {
          let teamPlayers: string[] = []

          if (hommes.length >= 2 && femmes.length >= 1) {
            teamPlayers = [hommes.shift()!.id, hommes.shift()!.id, femmes.shift()!.id]
          } else if (hommes.length >= 1 && femmes.length >= 2) {
            teamPlayers = [hommes.shift()!.id, femmes.shift()!.id, femmes.shift()!.id]
          } else {
            // Pas assez pour mixité, prendre ce qu'on a
            const remaining = [...hommes, ...femmes]
            if (remaining.length >= teamSize) {
              teamPlayers = remaining.splice(0, teamSize).map(p => p.id)
            } else {
              break
            }
          }

          if (teamPlayers.length === teamSize) {
            newTeams.push({ name: `Équipe ${teamNumber}`, joueur_ids: teamPlayers })
            teamNumber++
          }
        }
      }

      // Créer les équipes en base
      for (const team of newTeams) {
        await fetch('/api/equipes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            tournoi_id: tournament.id,
            name: team.name,
            joueur_ids: team.joueur_ids,
            stats: {
              victoires: 0,
              defaites: 0,
              points_pour: 0,
              points_contre: 0
            }
          })
        })
      }

      // Recharger les données
      await loadTournamentData()
    } catch (error) {
      console.error('Erreur création équipes:', error)
    }
  }

  const startTournament = async () => {
    if (!tournament) return

    try {
      // Générer les poules si pas encore fait
      if (matches.length === 0) {
        await generatePoules()
      }

      // Mettre à jour le statut
      const response = await fetch(`/api/tournois/${tournament.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'en_cours' })
      })

      if (response.ok) {
        setTournament({ ...tournament, status: 'en_cours' })
        setShowStartModal(false)
      }
    } catch (error) {
      console.error('Erreur démarrage tournoi:', error)
    }
  }

  const assignTerrain = async (matchId: string, terrain: number) => {
    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ terrain })
      })

      if (response.ok) {
        await loadTournamentData()
      }
    } catch (error) {
      console.error('Erreur assignation terrain:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-12 shadow-2xl">
              {Icons.loader}
              <p className="mt-4 text-lg font-medium text-gray-600">Chargement du tournoi...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">Tournoi introuvable</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      {/* Particules animées */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-300 to-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 right-40 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => router.push('/dashboard')}
                className="group flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all"
              >
                ← <span className="font-medium">Retour</span>
              </button>
              
              <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
              
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl text-white shadow-lg">
                  {Icons.petanque}
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    {tournament.name}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="flex items-center">
                      {Icons.calendar}
                      <span className="ml-1">{new Date(tournament.settings.date).toLocaleDateString('fr-FR')}</span>
                    </span>
                    <span className="flex items-center">
                      {Icons.clock}
                      <span className="ml-1">{tournament.settings.time}</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      tournament.status === 'preparation' 
                        ? 'bg-yellow-100 text-yellow-700'
                        : tournament.status === 'en_cours'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {tournament.status === 'preparation' ? 'En préparation' : 
                       tournament.status === 'en_cours' ? 'En cours' : 'Terminé'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-3">
              {tournament.status === 'preparation' && isOrganizer && (
                <button
                  onClick={() => setShowStartModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center space-x-2"
                >
                  {Icons.play}
                  <span>Démarrer le tournoi</span>
                </button>
              )}
              
              {tournament.mode === 'melee_tournante' && tournament.status === 'en_cours' && isOrganizer && (
                <button
                  onClick={reformTeamsForRotation}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
                >
                  {Icons.shuffle}
                  <span>Rotation équipes</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Infos du tournoi */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[
            { 
              label: 'Mode', 
              value: tournament.mode === 'choisi' ? 'Équipes choisies' : 
                     tournament.mode === 'melee_fixe' ? 'Mêlée fixe' : 'Mêlée tournante',
              icon: Icons.users,
              gradient: 'from-blue-500 to-indigo-600'
            },
            { 
              label: 'Format', 
              value: tournament.format === 'doublette' ? 'Doublette' : 'Triplette',
              icon: Icons.petanque,
              gradient: 'from-green-500 to-emerald-600'
            },
            { 
              label: 'Équipes', 
              value: `${teams.length} équipes`,
              icon: Icons.flag,
              gradient: 'from-orange-500 to-red-600'
            },
            { 
              label: 'Terrains', 
              value: `${tournament.settings.terrains} terrains`,
              icon: Icons.grid,
              gradient: 'from-purple-500 to-pink-600'
            }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">{stat.label}</span>
                <div className={`p-2 bg-gradient-to-br ${stat.gradient} rounded-xl text-white`}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg mb-6">
          <div className="flex border-b">
            {[
              { id: 'vue', label: 'Vue d\'ensemble', icon: Icons.grid },
              { id: 'matchs', label: 'Matchs', icon: Icons.flag },
              { id: 'classement', label: tournament.mode === 'melee_tournante' ? 'Classement individuel' : 'Classement', icon: Icons.trophy },
              { id: 'equipes', label: 'Équipes', icon: Icons.users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-4 transition-all relative ${
                  activeTab === tab.id 
                    ? 'text-green-600 font-medium' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-600 to-emerald-600"></div>
                )}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* Vue d'ensemble */}
            {activeTab === 'vue' && (
              <div className="space-y-6">
                {/* Phase actuelle */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    {Icons.sparkles}
                    <span className="ml-2">Phase actuelle : {currentPhase === 'poules' ? 'Poules' : currentPhase === 'elimination' ? 'Phases finales' : 'Finale'}</span>
                  </h3>
                  
                  {currentPhase === 'poules' && (
                    <div>
                      <p className="text-gray-600 mb-4">
                        Les équipes s'affrontent dans des poules de {tournament.settings.pouleSize || 4} équipes.
                        Les {tournament.settings.pouleSize === 6 ? '3' : '2'} premiers de chaque poule se qualifient pour les phases finales.
                      </p>
                      
                      {/* Sélecteur de poule */}
                      <div className="flex space-x-2 mb-4">
                        {['A', 'B', 'C', 'D'].slice(0, Math.ceil(teams.length / (tournament.settings.pouleSize || 4))).map(poule => (
                          <button
                            key={poule}
                            onClick={() => setSelectedPoule(poule)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${
                              selectedPoule === poule
                                ? 'bg-green-600 text-white shadow-lg'
                                : 'bg-white text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            Poule {poule}
                          </button>
                        ))}
                      </div>
                      
                      {/* Matchs de la poule sélectionnée */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {matches
                          .filter(m => m.poule === selectedPoule)
                          .map(match => (
                            <div key={match.id} className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all">
                              <div className="flex justify-between items-center mb-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  match.status === 'termine' ? 'bg-gray-100 text-gray-700' :
                                  match.status === 'en_cours' ? 'bg-green-100 text-green-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {match.status === 'termine' ? 'Terminé' :
                                   match.status === 'en_cours' ? 'En cours' : 'À jouer'}
                                </span>
                                {match.terrain && (
                                  <span className="text-sm text-gray-500">Terrain {match.terrain}</span>
                                )}
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <div className="text-center flex-1">
                                  <p className="font-medium text-gray-900">{match.equipe_a?.name}</p>
                                  {match.status !== 'a_jouer' && (
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                      <p className="text-2xl font-bold text-gray-900">{match.score_a}</p>
                                      {match.status === 'termine' && match.score_a === (tournament?.settings?.maxPoints || 13) && match.score_b === 0 && (
                                        <span className="text-2xl animate-bounce" title="FANNY !">🍑</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="px-4 text-gray-400">VS</div>
                                <div className="text-center flex-1">
                                  <p className="font-medium text-gray-900">{match.equipe_b?.name}</p>
                                  {match.status !== 'a_jouer' && (
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                      <p className="text-2xl font-bold text-gray-900">{match.score_b}</p>
                                      {match.status === 'termine' && match.score_b === (tournament?.settings?.maxPoints || 13) && match.score_a === 0 && (
                                        <span className="text-2xl animate-bounce" title="FANNY !">🍑</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              {match.status === 'a_jouer' && isOrganizer && (
                                <div className="mt-3 flex space-x-2">
                                  <select
                                    value={match.terrain || ''}
                                    onChange={(e) => assignTerrain(match.id, parseInt(e.target.value))}
                                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500"
                                  >
                                    <option value="">Terrain...</option>
                                    {Array.from({ length: tournament.settings.terrains }, (_, i) => (
                                      <option key={i + 1} value={i + 1}>Terrain {i + 1}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => router.push(`/match/${match.id}`)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
                                  >
                                    Démarrer
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Statistiques rapides */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Matchs joués</span>
                      {Icons.flag}
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {matches.filter(m => m.status === 'termine').length} / {matches.length}
                    </p>
                    <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all"
                        style={{ width: `${(matches.filter(m => m.status === 'termine').length / matches.length) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Points moyens/match</span>
                      {Icons.chart}
                    </div>
                    <p className="text-3xl font-bold text-gray-900">
                      {matches.filter(m => m.status === 'termine').length > 0
                        ? Math.round(
                            matches
                              .filter(m => m.status === 'termine')
                              .reduce((acc, m) => acc + m.score_a + m.score_b, 0) /
                            matches.filter(m => m.status === 'termine').length
                          )
                        : 0}
                    </p>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Leader actuel</span>
                      {Icons.trophy}
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {(() => {
                        // Calculer le vrai leader basé sur les victoires et différence de points
                        const sortedTeams = [...teams].sort((a, b) => {
                          const aMatches = matches.filter(m =>
                            (m.equipe_a?.id === a.id || m.equipe_b?.id === b.id) && m.status === 'termine'
                          )
                          const bMatches = matches.filter(m =>
                            (m.equipe_a?.id === b.id || m.equipe_b?.id === a.id) && m.status === 'termine'
                          )

                          const aVictories = aMatches.filter(m =>
                            (m.equipe_a?.id === a.id && m.score_a > m.score_b) ||
                            (m.equipe_b?.id === a.id && m.score_b > m.score_a)
                          ).length

                          const bVictories = bMatches.filter(m =>
                            (m.equipe_a?.id === b.id && m.score_a > m.score_b) ||
                            (m.equipe_b?.id === b.id && m.score_b > m.score_a)
                          ).length

                          if (bVictories !== aVictories) return bVictories - aVictories

                          // Si égalité de victoires, comparer la différence de points
                          const aDiff = aMatches.reduce((acc, m) => {
                            if (m.equipe_a?.id === a.id) return acc + (m.score_a - m.score_b)
                            if (m.equipe_b?.id === a.id) return acc + (m.score_b - m.score_a)
                            return acc
                          }, 0)

                          const bDiff = bMatches.reduce((acc, m) => {
                            if (m.equipe_a?.id === b.id) return acc + (m.score_a - m.score_b)
                            if (m.equipe_b?.id === b.id) return acc + (m.score_b - m.score_a)
                            return acc
                          }, 0)

                          return bDiff - aDiff
                        })

                        return sortedTeams[0]?.name || 'À déterminer'
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Matchs */}
            {activeTab === 'matchs' && (
              <div className="space-y-4">
                {matches.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
                      {Icons.flag}
                    </div>
                    <p className="text-gray-500 mb-4">Aucun match généré</p>
                    {isOrganizer && tournament.status === 'preparation' && (
                      <button
                        onClick={generatePoules}
                        className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all"
                      >
                        Générer les poules
                      </button>
                    )}
                  </div>
                ) : (
                  <>
                    {/* Grouper les matchs par tour */}
                    {Array.from(new Set(matches.filter(m => m.tour !== null && m.tour !== undefined).map(m => m.tour))).sort((a, b) => a - b).map(tour => (
                      <div key={tour} className="bg-white rounded-2xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          Tour {tour}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {matches
                            .filter(m => m.tour === tour)
                            .map(match => (
                              <div key={match.id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-green-500 transition-all">
                                <div className="flex justify-between items-center mb-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    match.status === 'termine' ? 'bg-gray-100 text-gray-700' :
                                    match.status === 'en_cours' ? 'bg-green-100 text-green-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {match.status === 'termine' ? 'Terminé' :
                                     match.status === 'en_cours' ? 'En cours' : 'À jouer'}
                                  </span>
                                  {match.terrain && (
                                    <span className="text-sm text-gray-500">Terrain {match.terrain}</span>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  <div className={`flex justify-between items-center p-2 rounded-lg ${
                                    match.status === 'termine' && match.score_a > match.score_b ? 'bg-green-50' : ''
                                  }`}>
                                    <span className="font-medium">{match.equipe_a?.name}</span>
                                    {match.status !== 'a_jouer' && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xl font-bold">{match.score_a}</span>
                                        {match.status === 'termine' && match.score_a === (tournament?.settings?.maxPoints || 13) && match.score_b === 0 && (
                                          <span className="text-2xl animate-bounce" title="FANNY !">🍑</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className={`flex justify-between items-center p-2 rounded-lg ${
                                    match.status === 'termine' && match.score_b > match.score_a ? 'bg-green-50' : ''
                                  }`}>
                                    <span className="font-medium">{match.equipe_b?.name}</span>
                                    {match.status !== 'a_jouer' && (
                                      <div className="flex items-center gap-2">
                                        <span className="text-xl font-bold">{match.score_b}</span>
                                        {match.status === 'termine' && match.score_b === (tournament?.settings?.maxPoints || 13) && match.score_a === 0 && (
                                          <span className="text-2xl animate-bounce" title="FANNY !">🍑</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                {match.status === 'a_jouer' && isOrganizer && (
                                  <button
                                    onClick={() => router.push(`/match/${match.id}`)}
                                    className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition-all"
                                  >
                                    Saisir le score
                                  </button>
                                )}
                                
                                {match.status === 'en_cours' && (
                                  <button
                                    onClick={() => router.push(`/match/${match.id}`)}
                                    className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:shadow-lg transition-all animate-pulse"
                                  >
                                    Match en cours
                                  </button>
                                )}
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}

            {/* Classement */}
            {activeTab === 'classement' && (
              <div>
                {tournament.mode === 'melee_tournante' ? (
                  // Classement individuel pour mêlée tournante
                  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white">
                      <h3 className="text-xl font-bold">Classement Individuel</h3>
                      <p className="text-sm opacity-90">Mode mêlée tournante - Rotation {tournament.settings.meleeRotation === 'par_match' ? 'par match' : 'par tour'}</p>
                    </div>
                    <div className="p-4">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2">Pos</th>
                            <th className="text-left py-2">Joueur</th>
                            <th className="text-center py-2">V</th>
                            <th className="text-center py-2">D</th>
                            <th className="text-center py-2">+/-</th>
                            <th className="text-center py-2">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {individualRankings.map((player, index) => (
                            <tr key={player.id} className="border-b hover:bg-gray-50">
                              <td className="py-3">
                                {index === 0 && '🥇'}
                                {index === 1 && '🥈'}
                                {index === 2 && '🥉'}
                                {index > 2 && index + 1}
                              </td>
                              <td className="py-3 font-medium">{player.name}</td>
                              <td className="py-3 text-center">{player.victories || 0}</td>
                              <td className="py-3 text-center">{player.defeats || 0}</td>
                              <td className="py-3 text-center">{player.difference || 0}</td>
                              <td className="py-3 text-center font-bold">{player.points || 0}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  // Classement par équipe pour les autres modes
                  <div className="space-y-4">
                    {/* Classement par poule */}
                    {Object.keys(teamsByPoule).sort().map(poule => (
                      <div key={poule} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
                          <h3 className="text-xl font-bold">Poule {poule}</h3>
                        </div>
                        <div className="p-4">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2">Pos</th>
                                <th className="text-left py-2">Équipe</th>
                                <th className="text-center py-2">J</th>
                                <th className="text-center py-2 text-green-600 font-bold">V</th>
                                <th className="text-center py-2">D</th>
                                <th className="text-center py-2">+/-</th>
                                <th className="text-center py-2">PM</th>
                              </tr>
                            </thead>
                            <tbody>
                              {teamsByPoule[poule]?.map((team: any, index: number) => (
                                <tr key={team.id} className={`border-b hover:bg-gray-50 ${
                                  index < 2 ? 'bg-green-50' : ''
                                }`}>
                                  <td className="py-3">
                                    {index === 0 && '🥇'}
                                    {index === 1 && '🥈'}
                                    {index === 2 && '🥉'}
                                    {index > 2 && index + 1}
                                  </td>
                                  <td className="py-3 font-medium">{team.name}</td>
                                  <td className="py-3 text-center">{team.played || 0}</td>
                                  <td className="py-3 text-center font-bold text-green-600">{team.victories || 0}</td>
                                  <td className="py-3 text-center">{team.defeats || 0}</td>
                                  <td className="py-3 text-center">{team.difference > 0 ? '+' : ''}{team.difference || 0}</td>
                                  <td className="py-3 text-center text-gray-600">{team.pointsFor || 0}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                    
                    {/* Bouton refresh classement CORRIGÉ */}
                    <div className="text-center">
                      <button
                        onClick={async () => {
                          setRefreshingClassement(true)
                          
                          // Forcer le rechargement complet
                          setMatches([])  // Vider d'abord
                          setTeams([])    // Vider les équipes aussi
                          
                          // Attendre un peu puis recharger
                          setTimeout(async () => {
                            await loadTournamentData()
                            setRefreshingClassement(false)
                          }, 100)
                        }}
                        disabled={refreshingClassement}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 flex items-center space-x-2 mx-auto"
                      >
                        {refreshingClassement ? Icons.loader : Icons.refresh}
                        <span>Actualiser le classement</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Équipes */}
            {activeTab === 'equipes' && (
              <div className="space-y-4">
                {tournament.mode === 'choisi' && tournament.status === 'preparation' && isOrganizer && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">Mode Choisi - Formation des équipes</h3>
                    <p className="text-gray-600 mb-4">
                      Composez les équipes manuellement en assignant les joueurs.
                    </p>
                    <button
                      onClick={() => setShowTeamFormation(true)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all"
                    >
                      Composer les équipes
                    </button>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {teams.map(team => (
                    <div key={team.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                      <h3 className="text-lg font-bold text-gray-900 mb-3">{team.name}</h3>
                      
                      <div className="space-y-2">
                        {team.equipes_joueurs?.map((ej, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br ${
                              ej.joueur?.gender === 'H' ? 'from-blue-500 to-indigo-600' : 'from-pink-500 to-rose-600'
                            }`}>
                              {ej.joueur?.name?.charAt(0)}
                            </div>
                            <span className="text-sm text-gray-700">{ej.joueur?.name}</span>
                            {ej.role === 'capitaine' && (
                              <span className="text-xs text-yellow-600">👑</span>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {tournament.status === 'preparation' && isOrganizer && (
                        <button
                          onClick={() => {/* Ouvrir modal édition équipe */}}
                          className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all text-sm font-medium"
                        >
                          Modifier l'équipe
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal démarrage tournoi */}
      {showStartModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                {Icons.flag}
                <span className="ml-3">Démarrer le tournoi</span>
              </h2>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">Configuration des poules</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Taille des poules
                    </label>
                    <select
                      value={tournament.settings.pouleSize || 4}
                      onChange={(e) => setTournament({
                        ...tournament,
                        settings: { ...tournament.settings, pouleSize: parseInt(e.target.value) }
                      })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500"
                    >
                      <option value={4}>4 équipes par poule</option>
                      <option value={5}>5 équipes par poule</option>
                      <option value={6}>6 équipes par poule</option>
                    </select>
                  </div>
                  
                  {tournament.mode === 'melee_tournante' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rotation des équipes
                      </label>
                      <select
                        value={tournament.settings.meleeRotation || 'par_tour'}
                        onChange={(e) => setTournament({
                          ...tournament,
                          settings: { ...tournament.settings, meleeRotation: e.target.value as any }
                        })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500"
                      >
                        <option value="par_tour">Rotation par tour (recommandé)</option>
                        <option value="par_match">Rotation après chaque match</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600">
                  Le tournoi va démarrer avec {teams.length} équipes réparties en {Math.ceil(teams.length / (tournament.settings.pouleSize || 4))} poules.
                  Les matchs seront générés automatiquement.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowStartModal(false)}
                  className="flex-1 px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={startTournament}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all"
                >
                  Démarrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}