'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import AdBanner from '@/components/AdBanner'
import type { Manche, EquipeJoueur, Joueur } from '@/lib/types'
import { Petanque, Trophy, Users, Play, Flag, Clock, Calendar, Settings, Check, X, Plus, Loader, Shuffle, Chart, Edit, Refresh, Sparkles, Lightning, Arrow, Grid, Medal } from '@/components/Icons'

// Icônes premium pour la pétanque
const Icons = {
  petanque: <Petanque className="w-8 h-8" />,
  trophy: <Trophy className="w-6 h-6" />,
  users: <Users className="w-6 h-6" />,
  play: <Play className="w-6 h-6" />,
  flag: <Flag className="w-6 h-6" />,
  clock: <Clock className="w-6 h-6" />,
  calendar: <Calendar className="w-6 h-6" />,
  settings: <Settings className="w-6 h-6" />,
  check: <Check className="w-5 h-5" />,
  x: <X className="w-5 h-5" />,
  plus: <Plus className="w-5 h-5" />,
  loader: <Loader className="animate-spin h-6 w-6" />,
  shuffle: <Shuffle className="w-6 h-6" />,
  chart: <Chart className="w-6 h-6" />,
  edit: <Edit className="w-5 h-5" />,
  refresh: <Refresh className="w-6 h-6" />,
  sparkles: <Sparkles className="w-6 h-6" />,
  lightning: <Lightning className="w-6 h-6" />,
  arrow: <Arrow className="w-5 h-5" />,
  grid: <Grid className="w-6 h-6" />,
  medal: <Medal className="w-8 h-8" />
}

// Types pour le tournoi
interface Tournament {
  id: string
  name: string
  mode: 'choisi' | 'melee_fixe' | 'melee_tournante'
  format: 'tete_a_tete' | 'doublette' | 'triplette'
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
  }
}

interface Team {
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

interface PlayerWithStats extends Joueur {
  victories: number
  defeats: number
  difference: number
  points: number
}

interface Match {
  id: string
  equipe_a: Team
  equipe_b: Team
  equipe_a_id?: string
  equipe_b_id?: string
  terrain: number
  tour: number
  status: 'a_jouer' | 'en_cours' | 'termine' | 'en_attente_validation'
  score_a: number
  score_b: number
  type?: 'poule' | 'elimination' | 'demi' | 'finale' | 'petite_finale'
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
  const [showStartModal, setShowStartModal] = useState(false)
  const [showTeamFormation, setShowTeamFormation] = useState(false)
  const [refreshingClassement, setRefreshingClassement] = useState(false)
  const [userPlan, setUserPlan] = useState('free')
  const [editingTeam, setEditingTeam] = useState<Team | null>(null)
  const [newTeamName, setNewTeamName] = useState('')

  // État pour la mêlée tournante
  const [currentRotation, setCurrentRotation] = useState(1)
  const [individualRankings, setIndividualRankings] = useState<any[]>([])

  // Récupérer le plan de l'utilisateur
  useEffect(() => {
    if (organization?.settings?.plan && typeof organization.settings.plan === 'string') {
      setUserPlan(organization.settings.plan)
    }
  }, [organization])

  // Helper function to get player names for a team
  const getTeamPlayers = (teamId: string | null | undefined): string[] => {
    if (!teamId) return []
    const team = teams.find(t => t.id === teamId)
    if (!team || !team.equipes_joueurs || team.equipes_joueurs.length === 0) return []
    return team.equipes_joueurs.map(ej => ej.joueur.name)
  }

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
    const poules: { [key: string]: Team[] } = {}

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
        // 1. Nombre de victoires (règle FIPJP)
        if ((b.victories ?? 0) !== (a.victories ?? 0)) return (b.victories ?? 0) - (a.victories ?? 0)

        // 2. Différence de points - Moyenne générale (règle FIPJP)
        if ((b.difference ?? 0) !== (a.difference ?? 0)) return (b.difference ?? 0) - (a.difference ?? 0)

        // 3. Confrontation directe (règle FIPJP)
        const directMatch = matches.find((m: Match) =>
          m.status === 'termine' && m.poule === poule &&
          ((m.equipe_a?.id === a.id && m.equipe_b?.id === b.id) ||
           (m.equipe_a?.id === b.id && m.equipe_b?.id === a.id))
        )
        if (directMatch) {
          const aWon = (directMatch.equipe_a?.id === a.id && directMatch.score_a > directMatch.score_b) ||
                       (directMatch.equipe_b?.id === a.id && directMatch.score_b > directMatch.score_a)
          if (aWon) return -1 // a gagne
          else return 1 // b gagne
        }

        // 4. Nombre de points marqués (règle FIPJP complète)
        return (b.pointsFor ?? 0) - (a.pointsFor ?? 0)
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

  const checkAndUpdateTournamentStatus = async (tournamentData: Tournament, matchesData: Match[]) => {
    if (matchesData.length === 0) return tournamentData

    // 1. Si le tournoi est en "préparation" et qu'un match a commencé ou est terminé, passer à "en_cours"
    if (tournamentData.status === 'preparation') {
      const hasStartedMatches = matchesData.some(m => m.status === 'en_cours' || m.status === 'termine')

      if (hasStartedMatches) {
        try {
          const updateResponse = await fetch(`/api/tournois/${params.id}`, {
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
    if (tournamentData.status === 'en_cours') {
      const allMatchesFinished = matchesData.every(m => m.status === 'termine')

      if (allMatchesFinished) {
        try {
          const updateResponse = await fetch(`/api/tournois/${params.id}`, {
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
  }

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
          teamsData.map(async (team: Team) => {
            if (team.joueur_ids && Array.isArray(team.joueur_ids) && team.joueur_ids.length > 0) {
              const joueursResponse = await fetch(`/api/equipes/${team.id}`, {
                credentials: 'include'
              })
              if (joueursResponse.ok) {
                const enrichedTeam = await joueursResponse.json()
                // Adapter la structure pour correspondre à l'ancienne structure Supabase
                if (enrichedTeam.joueurs) {
                  team.equipes_joueurs = enrichedTeam.joueurs.map((joueur: Joueur) => ({
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

        // Vérifier et mettre à jour le statut du tournoi si nécessaire
        const finalTournamentData = await checkAndUpdateTournamentStatus(tournamentData, matchesData)

        // Si mêlée tournante, charger le classement individuel
        if (finalTournamentData.mode === 'melee_tournante') {
          loadIndividualRankings()
        }

        // Vérifier si l'utilisateur est organisateur
        // Vérifier que le tournoi appartient bien à l'organisation de l'utilisateur
        if (user && organization && finalTournamentData.org_id === organization.id) {
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
      const playerStats = joueurs.map((joueur: Joueur): PlayerWithStats => {
        let victories = 0
        let defeats = 0
        let pointsFor = 0
        let pointsAgainst = 0

        // Trouver toutes les équipes où ce joueur a joué
        const playerTeams = equipesData.filter((eq: Team) =>
          eq.joueur_ids && eq.joueur_ids.includes(joueur.id)
        )

        // Pour chaque équipe, compter les matchs terminés
        playerTeams.forEach((team: Team) => {
          const teamMatches = matchesData.filter((m: Match) =>
            m.status === 'termine' && (m.equipe_a_id === team.id || m.equipe_b_id === team.id)
          )

          teamMatches.forEach((match: Match) => {
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

      // Trier par nombre de victoires, puis différence, puis points totaux (règle FIPJP)
      playerStats.sort((a: PlayerWithStats, b: PlayerWithStats) => {
        if (b.victories !== a.victories) return b.victories - a.victories
        if (b.difference !== a.difference) return b.difference - a.difference
        return b.points - a.points
      })

      setIndividualRankings(playerStats)
    } catch (error) {
      console.error('Erreur chargement classement individuel:', error)
    }
  }

  // Helper function to validate pool configuration
  const isValidPoolConfiguration = (teamCount: number, poolSize: number): boolean => {
    if (teamCount < 4 || poolSize < 3) return false

    const nbPoules = Math.ceil(teamCount / poolSize)
    const lastPouleSize = teamCount - (nbPoules - 1) * poolSize

    // La dernière poule doit avoir au moins 3 équipes
    // Sinon c'est déséquilibré et non viable pour la compétition
    return lastPouleSize >= 3
  }

  // Helper function to get valid pool sizes for current team count
  const getValidPoolSizes = (teamCount: number): number[] => {
    const validSizes: number[] = []

    for (let size = 3; size <= 6; size++) {
      if (isValidPoolConfiguration(teamCount, size)) {
        validSizes.push(size)
      }
    }

    return validSizes
  }

  // Helper function to calculate pool distribution
  const getPoolDistribution = (teamCount: number, poolSize: number): number[] => {
    const nbPoules = Math.ceil(teamCount / poolSize)
    const distribution: number[] = []

    for (let i = 0; i < nbPoules; i++) {
      const start = i * poolSize
      const end = Math.min((i + 1) * poolSize, teamCount)
      distribution.push(end - start)
    }

    return distribution
  }

  const generatePoules = async () => {
    if (!tournament || teams.length === 0) return

    const pouleSize = tournament.settings.pouleSize || 4

    // Validation de la configuration avant génération
    if (!isValidPoolConfiguration(teams.length, pouleSize)) {
      alert(`❌ Configuration invalide\n\nLa répartition ${teams.length} équipes en poules de ${pouleSize} créerait des poules déséquilibrées.\n\nChaque poule doit avoir au minimum 3 équipes.`)
      return
    }

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

  // Générer les phases éliminatoires après les poules
  const generateEliminationPhases = async () => {
    if (!tournament) return

    // Vérifier que tous les matchs de poule sont terminés
    const pouleMatches = matches.filter(m => m.type === 'poule')
    const allPouleMatchesFinished = pouleMatches.every(m => m.status === 'termine')

    if (!allPouleMatchesFinished) {
      alert('Tous les matchs de poule doivent être terminés avant de générer les phases finales.')
      return
    }

    // Calculer le classement de chaque poule
    const qualifiedPerPoule = tournament.settings.qualifiedPerPoule || 2
    const pouleNames = [...new Set(pouleMatches.map(m => m.poule))].filter(Boolean)
    const qualified: Team[] = []

    for (const pouleName of pouleNames) {
      // Équipes de cette poule
      const pouleTeamIds = new Set<string>()
      pouleMatches
        .filter(m => m.poule === pouleName)
        .forEach(m => {
          if (m.equipe_a_id) pouleTeamIds.add(m.equipe_a_id)
          if (m.equipe_b_id) pouleTeamIds.add(m.equipe_b_id)
        })

      const pouleTeams = teams.filter(t => pouleTeamIds.has(t.id))

      // Calculer stats pour chaque équipe
      const rankings = pouleTeams.map(team => {
        const teamMatches = pouleMatches.filter(m =>
          m.poule === pouleName &&
          (m.equipe_a_id === team.id || m.equipe_b_id === team.id) &&
          m.status === 'termine'
        )

        let victories = 0, pointsFor = 0, pointsAgainst = 0

        teamMatches.forEach(m => {
          if (m.equipe_a_id === team.id) {
            if (m.score_a > m.score_b) victories++
            pointsFor += m.score_a
            pointsAgainst += m.score_b
          } else {
            if (m.score_b > m.score_a) victories++
            pointsFor += m.score_b
            pointsAgainst += m.score_a
          }
        })

        return {
          team,
          victories,
          difference: pointsFor - pointsAgainst,
          pointsFor
        }
      }).sort((a, b) => {
        // Classement FIPJP
        if (b.victories !== a.victories) return b.victories - a.victories

        // Confrontation directe
        const directMatch = pouleMatches.find(m =>
          m.status === 'termine' && m.poule === pouleName &&
          ((m.equipe_a_id === a.team.id && m.equipe_b_id === b.team.id) ||
           (m.equipe_a_id === b.team.id && m.equipe_b_id === a.team.id))
        )
        if (directMatch) {
          const aWon = (directMatch.equipe_a_id === a.team.id && directMatch.score_a > directMatch.score_b) ||
                       (directMatch.equipe_b_id === a.team.id && directMatch.score_b > directMatch.score_a)
          if (aWon) return -1
          else return 1
        }

        return b.difference - a.difference
      })

      // Prendre les N premiers qualifiés
      qualified.push(...rankings.slice(0, qualifiedPerPoule).map(r => r.team))
    }

    if (qualified.length === 0) {
      alert('Aucune équipe qualifiée trouvée.')
      return
    }

    try {
      // Déterminer le nombre de matchs selon les qualifiés
      const nbQualified = qualified.length
      let matchType = 'finale'
      let nbMatches = 1

      if (nbQualified === 2) {
        matchType = 'finale'
        nbMatches = 1
      } else if (nbQualified === 4) {
        matchType = 'demi'
        nbMatches = 2
      } else if (nbQualified === 8) {
        matchType = 'quart'
        nbMatches = 4
      } else if (nbQualified === 16) {
        matchType = 'huitieme'
        nbMatches = 8
      } else {
        // Arrondir au prochain power of 2
        const nextPower = Math.pow(2, Math.ceil(Math.log2(nbQualified)))
        if (nextPower === 16) {
          matchType = 'huitieme'
          nbMatches = 8
        } else if (nextPower === 8) {
          matchType = 'quart'
          nbMatches = 4
        } else if (nextPower === 4) {
          matchType = 'demi'
          nbMatches = 2
        } else {
          matchType = 'finale'
          nbMatches = 1
        }
      }

      // Créer les matchs d'élimination
      for (let i = 0; i < nbMatches; i++) {
        const equipe_a = qualified[i * 2]
        const equipe_b = qualified[i * 2 + 1]

        // Ne créer le match que si on a au moins l'équipe A
        if (!equipe_a) break

        // Si pas d'équipe B, l'équipe A a un "bye" et avance automatiquement
        if (!equipe_b) {
          // Match avec bye - équipe A gagne par forfait
          await fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              tournoi_id: tournament.id,
              equipe_a_id: equipe_a.id,
              equipe_b_id: null,
              tour: 1,
              terrain: null,
              type: matchType,
              status: 'termine',
              score_a: 13,
              score_b: 0
            })
          })
        } else {
          // Match normal avec deux équipes
          await fetch('/api/matches', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              tournoi_id: tournament.id,
              equipe_a_id: equipe_a.id,
              equipe_b_id: equipe_b.id,
              tour: 1,
              terrain: null,
              type: matchType,
              status: 'a_jouer'
            })
          })
        }
      }

      alert(`Phases éliminatoires générées : ${nbMatches} match(s) de ${matchType}`)
      await loadTournamentData()
    } catch (error) {
      console.error('Erreur génération phases finales:', error)
      alert('Erreur lors de la génération des phases finales')
    }
  }

  // Générer la finale et la petite finale après les demi-finales
  const generateFinales = async () => {
    if (!tournament) return

    const demiMatches = matches.filter(m => m.type === 'demi' && m.status === 'termine')

    if (demiMatches.length < 2) {
      alert('Les deux demi-finales doivent être terminées.')
      return
    }

    // Vérifier si finales déjà créées
    const finaleExists = matches.some(m => m.type === 'finale')
    const petiteFinaleExists = matches.some(m => m.type === 'petite_finale')

    if (finaleExists && petiteFinaleExists) {
      alert('Les finales sont déjà créées.')
      return
    }

    try {
      // Récupérer gagnants et perdants des demis
      const winners: string[] = []
      const losers: string[] = []

      demiMatches.forEach(match => {
        if (match.score_a > match.score_b) {
          winners.push(match.equipe_a_id || '')
          losers.push(match.equipe_b_id || '')
        } else {
          winners.push(match.equipe_b_id || '')
          losers.push(match.equipe_a_id || '')
        }
      })

      // Créer la finale si pas encore faite
      if (!finaleExists && winners.length === 2) {
        await fetch('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            tournoi_id: tournament.id,
            equipe_a_id: winners[0],
            equipe_b_id: winners[1],
            tour: 1,
            terrain: null,
            type: 'finale',
            status: 'a_jouer'
          })
        })
      }

      // Créer la petite finale si pas encore faite
      if (!petiteFinaleExists && losers.length === 2) {
        await fetch('/api/matches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            tournoi_id: tournament.id,
            equipe_a_id: losers[0],
            equipe_b_id: losers[1],
            tour: 1,
            terrain: null,
            type: 'petite_finale',
            status: 'a_jouer'
          })
        })
      }

      alert('Finale et petite finale générées avec succès !')
      await loadTournamentData()
    } catch (error) {
      console.error('Erreur génération finales:', error)
      alert('Erreur lors de la génération des finales')
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
      const players = allPlayers.filter((p: Joueur) =>
        tournament.settings.players.includes(p.id)
      )

      if (players.length === 0) return

      // Mélanger les joueurs
      const shuffled = [...players].sort(() => Math.random() - 0.5)

      // Créer les nouvelles équipes
      const teamSize = tournament.format === 'doublette' ? 2 : 3
      const nbEquipes = Math.floor(players.length / teamSize)

      // NOTE: On ne supprime PAS les anciennes équipes pour garder l'historique des matchs
      // Les nouvelles équipes seront créées en parallèle
      // Les anciennes équipes restent dans la BD avec leurs matchs terminés

      // Utiliser un préfixe avec le nombre actuel de rotations pour noms uniques
      const rotationNumber = Math.floor(teams.length / nbEquipes) + 1
      let teamNumber = 1
      const newTeams = []

      // Si mixité NON obligatoire : formation libre
      if (!tournament.settings.mixiteObligatoire) {
        for (let i = 0; i < nbEquipes; i++) {
          const teamPlayers = shuffled.slice(i * teamSize, (i + 1) * teamSize).map(p => p.id)
          newTeams.push({ name: `R${rotationNumber}-Équipe ${teamNumber}`, joueur_ids: teamPlayers })
          teamNumber++
        }
      } else {
        // Si mixité OBLIGATOIRE : respecter H/F
        const hommes = shuffled.filter((p: Joueur) => p.gender === 'H')
        const femmes = shuffled.filter((p: Joueur) => p.gender === 'F')

        if (tournament.format === 'doublette') {
          // Pour doublette: 1H + 1F autant que possible
          while (hommes.length > 0 && femmes.length > 0 && teamNumber <= nbEquipes) {
            const teamPlayers = [hommes.shift()!.id, femmes.shift()!.id]
            newTeams.push({ name: `R${rotationNumber}-Équipe ${teamNumber}`, joueur_ids: teamPlayers })
            teamNumber++
          }

          // Équipes restantes sans mixité
          const remaining = [...hommes, ...femmes].sort(() => Math.random() - 0.5)
          while (remaining.length >= teamSize && teamNumber <= nbEquipes) {
            const teamPlayers = remaining.splice(0, teamSize).map(p => p.id)
            newTeams.push({ name: `R${rotationNumber}-Équipe ${teamNumber}`, joueur_ids: teamPlayers })
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
              newTeams.push({ name: `R${rotationNumber}-Équipe ${teamNumber}`, joueur_ids: teamPlayers })
              teamNumber++
            }
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

    // Validation : Minimum 4 équipes requises
    if (teams.length < 4) {
      alert(`❌ Impossible de démarrer le tournoi.\n\nVous avez ${teams.length} équipe${teams.length > 1 ? 's' : ''}, minimum requis : 4 équipes pour un tournoi par poules.`)
      return
    }

    // Validation : Configuration des poules doit être valide
    const pouleSize = tournament.settings.pouleSize || 4
    if (!isValidPoolConfiguration(teams.length, pouleSize)) {
      const distribution = getPoolDistribution(teams.length, pouleSize)
      alert(`❌ Configuration invalide\n\nLa répartition de ${teams.length} équipes en poules de ${pouleSize} créerait :\n${distribution.map((size, i) => `  • Poule ${String.fromCharCode(65 + i)}: ${size} équipe${size > 1 ? 's' : ''}`).join('\n')}\n\nChaque poule doit avoir au minimum 3 équipes.\nVeuillez ajuster la taille des poules dans les paramètres.`)
      return
    }

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
      // Vérifier les conflits de terrain
      const matchToAssign = matches.find(m => m.id === matchId)
      if (!matchToAssign) return

      // Chercher des matchs en cours ou à jouer sur ce terrain
      const conflicts = matches.filter(m =>
        m.id !== matchId &&
        m.terrain === terrain &&
        (m.status === 'en_cours' || m.status === 'a_jouer')
      )

      if (conflicts.length > 0) {
        const conflictNames = conflicts.map(m => {
          const playersA = getTeamPlayers(m.equipe_a_id || m.equipe_a?.id)
          const playersB = getTeamPlayers(m.equipe_b_id || m.equipe_b?.id)
          const teamADisplay = playersA.length > 0 ? `${m.equipe_a?.name} (${playersA.join(', ')})` : m.equipe_a?.name
          const teamBDisplay = playersB.length > 0 ? `${m.equipe_b?.name} (${playersB.join(', ')})` : m.equipe_b?.name
          return `${teamADisplay} vs ${teamBDisplay}`
        }).join('\n')

        const confirm = window.confirm(
          `⚠️ CONFLIT DE TERRAIN !\n\n` +
          `Le terrain ${terrain} est déjà assigné à :\n${conflictNames}\n\n` +
          `Voulez-vous quand même assigner ce terrain ?`
        )

        if (!confirm) return
      }

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

  const renameTeam = async () => {
    if (!editingTeam || !newTeamName.trim()) return

    try {
      const response = await fetch(`/api/equipes/${editingTeam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: newTeamName.trim() })
      })

      if (response.ok) {
        await loadTournamentData()
        setEditingTeam(null)
        setNewTeamName('')
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors du renommage de l\'équipe')
      }
    } catch (error) {
      console.error('Erreur renommage équipe:', error)
      alert('Erreur lors du renommage de l\'équipe')
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
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="group flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                ← <span className="hidden sm:inline font-medium">Retour</span>
              </button>

              <div className="hidden sm:block h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

              <div className="flex items-center space-x-1.5 sm:space-x-3">
                <div className="p-1 sm:p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl text-white">
                  <Petanque className="w-5 h-5 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    <span className="hidden sm:inline">{tournament.name}</span>
                    <span className="sm:hidden">{tournament.name.length > 20 ? tournament.name.substring(0, 20) + '...' : tournament.name}</span>
                  </h1>
                  <div className="flex items-center space-x-1 sm:space-x-4 text-xs text-gray-500">
                    <span className="hidden md:flex items-center">
                      {Icons.calendar}
                      <span className="ml-1">{new Date(tournament.settings.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                    </span>
                    <span className="hidden md:flex items-center">
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
                      {tournament.status === 'preparation' ? 'Prépa' :
                       tournament.status === 'en_cours' ? 'En cours' : 'Terminé'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              {tournament.status === 'preparation' && isOrganizer && (
                <button
                  onClick={() => setShowStartModal(true)}
                  className="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                >
                  {Icons.play}
                  <span className="hidden sm:inline">Démarrer le tournoi</span>
                  <span className="sm:hidden">Démarrer</span>
                </button>
              )}

              {tournament.mode === 'melee_tournante' && tournament.status === 'en_cours' && isOrganizer && (
                <button
                  onClick={reformTeamsForRotation}
                  className="px-2 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                >
                  {Icons.shuffle}
                  <span className="hidden sm:inline">Rotation équipes</span>
                  <span className="sm:hidden">Rotation</span>
                </button>
              )}

              {tournament.status === 'en_cours' && isOrganizer &&
               matches.some(m => m.type === 'poule' && m.status === 'termine') &&
               !matches.some(m => ['huitieme', 'quart', 'demi', 'finale'].includes(m.type || '')) && (
                <button
                  onClick={generateEliminationPhases}
                  className="px-2 sm:px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                >
                  {Icons.flag}
                  <span className="hidden sm:inline">Générer phases finales</span>
                  <span className="sm:hidden">Phases</span>
                </button>
              )}

              {tournament.status === 'en_cours' && isOrganizer &&
               matches.filter(m => m.type === 'demi' && m.status === 'termine').length === 2 &&
               !matches.some(m => m.type === 'finale') && (
                <button
                  onClick={generateFinales}
                  className="px-2 sm:px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                >
                  {Icons.trophy}
                  <span className="hidden sm:inline">Générer finale + petite finale</span>
                  <span className="sm:hidden">Finale</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Infos du tournoi */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

        {/* Tabs - Améliorés pour mobile */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200 bg-white/80 backdrop-blur-xl rounded-t-2xl overflow-x-auto">
            {[
              { id: 'vue', label: 'Vue d\'ensemble', shortLabel: 'Vue', icon: Icons.grid },
              { id: 'matchs', label: 'Matchs', shortLabel: 'Matchs', icon: Icons.flag },
              { id: 'classement', label: tournament.mode === 'melee_tournante' ? 'Classement individuel' : 'Classement', shortLabel: 'Classement', icon: Icons.trophy },
              { id: 'equipes', label: 'Équipes', shortLabel: 'Équipes', icon: Icons.users }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-max flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 px-3 sm:px-4 py-3 sm:py-4 transition-all relative ${
                  activeTab === tab.id
                    ? 'text-green-600 font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span className={activeTab === tab.id ? 'scale-110 transition-transform' : ''}>
                  {tab.icon}
                </span>
                <span className="text-xs sm:text-base font-medium">{tab.shortLabel}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-0.5 bg-gradient-to-r from-green-600 to-emerald-600"></div>
                )}
              </button>
            ))}
          </div>

          {/* Publicité - Uniquement pour les utilisateurs gratuits */}
          <div className="mt-6 mb-6">
              <AdBanner
                variant="responsive"
                userPlan={userPlan}
                showOnlyForFree={true}
              />
            </div>

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
                                  match.status === 'en_attente_validation' ? 'bg-orange-100 text-orange-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {match.status === 'termine' ? 'Terminé' :
                                   match.status === 'en_cours' ? 'En cours' :
                                   match.status === 'en_attente_validation' ? '⏳ En attente validation' :
                                   'À jouer'}
                                </span>
                                {match.terrain && (
                                  <span className="text-sm font-semibold text-gray-900">Terrain {match.terrain}</span>
                                )}
                              </div>
                              
                              <div className="flex justify-between items-center">
                                <div className="text-center flex-1">
                                  <p className="font-medium text-gray-900 text-xs sm:text-base truncate px-1">{match.equipe_a?.name}</p>
                                  {(() => {
                                    const players = getTeamPlayers(match.equipe_a_id || match.equipe_a?.id)
                                    if (players.length > 0) {
                                      return (
                                        <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 px-1 truncate leading-tight">
                                          {players.join(', ')}
                                        </p>
                                      )
                                    }
                                    return null
                                  })()}
                                  {match.status !== 'a_jouer' && (
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{match.score_a ?? 0}</p>
                                      {match.status === 'termine' && match.score_a === (tournament?.settings?.maxPoints || 13) && match.score_b === 0 && (
                                        <span className="text-lg sm:text-2xl animate-bounce" title="FANNY !">🍑</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="px-1 sm:px-4 text-gray-400 font-bold text-sm sm:text-base">VS</div>
                                <div className="text-center flex-1">
                                  <p className="font-medium text-gray-900 text-xs sm:text-base truncate px-1">{match.equipe_b?.name}</p>
                                  {(() => {
                                    const players = getTeamPlayers(match.equipe_b_id || match.equipe_b?.id)
                                    if (players.length > 0) {
                                      return (
                                        <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 px-1 truncate leading-tight">
                                          {players.join(', ')}
                                        </p>
                                      )
                                    }
                                    return null
                                  })()}
                                  {match.status !== 'a_jouer' && (
                                    <div className="flex items-center justify-center gap-1 mt-1">
                                      <p className="text-xl sm:text-2xl font-bold text-gray-900">{match.score_b ?? 0}</p>
                                      {match.status === 'termine' && match.score_b === (tournament?.settings?.maxPoints || 13) && match.score_a === 0 && (
                                        <span className="text-lg sm:text-2xl animate-bounce" title="FANNY !">🍑</span>
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
                        style={{ width: `${matches.length > 0 ? (matches.filter(m => m.status === 'termine').length / matches.length) * 100 : 0}%` }}
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
                            (m.equipe_a?.id === a.id || m.equipe_b?.id === a.id) && m.status === 'termine'
                          )
                          const bMatches = matches.filter(m =>
                            (m.equipe_a?.id === b.id || m.equipe_b?.id === b.id) && m.status === 'termine'
                          )

                          const aVictories = aMatches.filter(m =>
                            (m.equipe_a?.id === a.id && m.score_a > m.score_b) ||
                            (m.equipe_b?.id === a.id && m.score_b > m.score_a)
                          ).length

                          const bVictories = bMatches.filter(m =>
                            (m.equipe_a?.id === b.id && m.score_a > m.score_b) ||
                            (m.equipe_b?.id === b.id && m.score_b > m.score_a)
                          ).length

                          // 1. Nombre de victoires (règle FIPJP)
                          if (bVictories !== aVictories) return bVictories - aVictories

                          // 2. Confrontation directe (règle FIPJP)
                          const directMatch = matches.find(m =>
                            m.status === 'termine' &&
                            ((m.equipe_a?.id === a.id && m.equipe_b?.id === b.id) ||
                             (m.equipe_a?.id === b.id && m.equipe_b?.id === a.id))
                          )
                          if (directMatch) {
                            const aWon = (directMatch.equipe_a?.id === a.id && directMatch.score_a > directMatch.score_b) ||
                                         (directMatch.equipe_b?.id === a.id && directMatch.score_b > directMatch.score_a)
                            if (aWon) return -1
                            else return 1
                          }

                          // 3. Différence de points (règle FIPJP)
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
                                    match.status === 'en_attente_validation' ? 'bg-orange-100 text-orange-700' :
                                    'bg-yellow-100 text-yellow-700'
                                  }`}>
                                    {match.status === 'termine' ? 'Terminé' :
                                     match.status === 'en_cours' ? 'En cours' :
                                     match.status === 'en_attente_validation' ? '⏳ En attente validation' :
                                     'À jouer'}
                                  </span>
                                  {match.terrain && (
                                    <span className="text-sm font-semibold text-gray-900">Terrain {match.terrain}</span>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  <div className={`flex justify-between items-center p-2 sm:p-3 rounded-lg ${
                                    match.status === 'termine' && match.score_a > match.score_b ? 'bg-green-50' : ''
                                  }`}>
                                    <div className="flex-1 pr-2 min-w-0">
                                      <span className="font-medium text-xs sm:text-base truncate block">{match.equipe_a?.name}</span>
                                      {(() => {
                                        const players = getTeamPlayers(match.equipe_a_id || match.equipe_a?.id)
                                        if (players.length > 0) {
                                          return (
                                            <span className="text-[10px] sm:text-xs text-gray-600 truncate block leading-tight">
                                              {players.join(', ')}
                                            </span>
                                          )
                                        }
                                        return null
                                      })()}
                                    </div>
                                    {match.status !== 'a_jouer' && (
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xl sm:text-xl font-bold">{match.score_a ?? 0}</span>
                                        {match.status === 'termine' && match.score_a === (tournament?.settings?.maxPoints || 13) && match.score_b === 0 && (
                                          <span className="text-lg sm:text-2xl animate-bounce" title="FANNY !">🍑</span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className={`flex justify-between items-center p-2 sm:p-3 rounded-lg ${
                                    match.status === 'termine' && match.score_b > match.score_a ? 'bg-green-50' : ''
                                  }`}>
                                    <div className="flex-1 pr-2 min-w-0">
                                      <span className="font-medium text-xs sm:text-base truncate block">{match.equipe_b?.name}</span>
                                      {(() => {
                                        const players = getTeamPlayers(match.equipe_b_id || match.equipe_b?.id)
                                        if (players.length > 0) {
                                          return (
                                            <span className="text-[10px] sm:text-xs text-gray-600 truncate block leading-tight">
                                              {players.join(', ')}
                                            </span>
                                          )
                                        }
                                        return null
                                      })()}
                                    </div>
                                    {match.status !== 'a_jouer' && (
                                      <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-xl sm:text-xl font-bold">{match.score_b ?? 0}</span>
                                        {match.status === 'termine' && match.score_b === (tournament?.settings?.maxPoints || 13) && match.score_a === 0 && (
                                          <span className="text-lg sm:text-2xl animate-bounce" title="FANNY !">🍑</span>
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
                          <tr className="border-b border-gray-300">
                            <th className="text-left py-2 px-2 font-bold text-gray-900">Pos</th>
                            <th className="text-left py-2 px-2 font-bold text-gray-900">Joueur</th>
                            <th className="text-center py-2 px-2 font-bold text-purple-600">V</th>
                            <th className="text-center py-2 px-2 font-bold text-gray-900">D</th>
                            <th className="text-center py-2 px-2 font-bold text-gray-900">+/-</th>
                            <th className="text-center py-2 px-2 font-bold text-gray-900">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {individualRankings.map((player, index) => (
                            <tr key={player.id} className={`border-b hover:bg-gray-50 ${
                              index < 3 ? 'bg-purple-50' : ''
                            }`}>
                              <td className="py-3 px-2 text-gray-900 font-semibold text-lg">
                                {index === 0 && '🥇'}
                                {index === 1 && '🥈'}
                                {index === 2 && '🥉'}
                                {index > 2 && index + 1}
                              </td>
                              <td className="py-3 px-2 font-semibold text-gray-900">{player.name}</td>
                              <td className="py-3 px-2 text-center font-bold text-purple-600 text-lg">{player.victories || 0}</td>
                              <td className="py-3 px-2 text-center font-medium text-gray-900">{player.defeats || 0}</td>
                              <td className="py-3 px-2 text-center font-medium text-gray-900">{player.difference || 0}</td>
                              <td className="py-3 px-2 text-center font-bold text-gray-900 text-lg">{player.points || 0}</td>
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
                              <tr className="border-b border-gray-300">
                                <th className="text-left py-2 px-2 font-bold text-gray-900">Pos</th>
                                <th className="text-left py-2 px-2 font-bold text-gray-900">Équipe</th>
                                <th className="text-center py-2 px-2 font-bold text-gray-900">J</th>
                                <th className="text-center py-2 px-2 font-bold text-green-600">V</th>
                                <th className="text-center py-2 px-2 font-bold text-gray-900">D</th>
                                <th className="text-center py-2 px-2 font-bold text-gray-900">+/-</th>
                                <th className="text-center py-2 px-2 font-bold text-gray-900">PM</th>
                              </tr>
                            </thead>
                            <tbody>
                              {teamsByPoule[poule]?.map((team: any, index: number) => (
                                <tr key={team.id} className={`border-b hover:bg-gray-50 ${
                                  index < 2 ? 'bg-green-50' : ''
                                }`}>
                                  <td className="py-3 px-2 text-gray-900 font-semibold text-lg">
                                    {index === 0 && '🥇'}
                                    {index === 1 && '🥈'}
                                    {index === 2 && '🥉'}
                                    {index > 2 && index + 1}
                                  </td>
                                  <td className="py-3 px-2 font-semibold text-gray-900">{team.name}</td>
                                  <td className="py-3 px-2 text-center font-medium text-gray-900">{team.played || 0}</td>
                                  <td className="py-3 px-2 text-center font-bold text-green-600 text-lg">{team.victories || 0}</td>
                                  <td className="py-3 px-2 text-center font-medium text-gray-900">{team.defeats || 0}</td>
                                  <td className="py-3 px-2 text-center font-medium text-gray-900">{team.difference > 0 ? '+' : ''}{team.difference || 0}</td>
                                  <td className="py-3 px-2 text-center font-medium text-gray-900">{team.pointsFor || 0}</td>
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
                          onClick={() => {
                            setEditingTeam(team)
                            setNewTeamName(team.name)
                          }}
                          className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all text-sm font-medium"
                        >
                          ✏️ Renommer l'équipe
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
                      disabled={teams.length < 4}
                    >
                      {teams.length < 4 ? (
                        <option value={teams.length}>{teams.length} équipes (minimum requis: 4)</option>
                      ) : (
                        <>
                          {getValidPoolSizes(teams.length).map(size => (
                            <option key={size} value={size}>
                              {size} équipes par poule
                            </option>
                          ))}
                          {getValidPoolSizes(teams.length).length === 0 && (
                            <option value={4}>Aucune configuration valide disponible</option>
                          )}
                        </>
                      )}
                    </select>
                    {teams.length < 4 ? (
                      <p className="text-xs text-red-600 mt-1">
                        ⚠️ Minimum 4 équipes requises pour un tournoi par poules
                      </p>
                    ) : !isValidPoolConfiguration(teams.length, tournament.settings.pouleSize || 4) ? (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ Configuration invalide : cette répartition créerait des poules déséquilibrées
                      </p>
                    ) : null}
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

              {teams.length >= 4 ? (
                isValidPoolConfiguration(teams.length, tournament.settings.pouleSize || 4) ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-gray-600 mb-2">
                      ✓ Le tournoi va démarrer avec {teams.length} équipes réparties en {getPoolDistribution(teams.length, tournament.settings.pouleSize || 4).length} poule{getPoolDistribution(teams.length, tournament.settings.pouleSize || 4).length > 1 ? 's' : ''} :
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-700">
                      {getPoolDistribution(teams.length, tournament.settings.pouleSize || 4).map((size, i) => (
                        <span key={i} className="bg-white px-2 py-1 rounded-lg font-medium">
                          Poule {String.fromCharCode(65 + i)}: {size} équipe{size > 1 ? 's' : ''}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Les matchs seront générés automatiquement.
                    </p>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 mb-6 border-2 border-orange-300">
                    <p className="text-sm text-orange-700 font-medium mb-2">
                      ⚠️ Configuration invalide : répartition déséquilibrée
                    </p>
                    <p className="text-xs text-orange-600">
                      Cette configuration créerait des poules avec trop peu d'équipes. Veuillez choisir une autre taille de poule.
                    </p>
                  </div>
                )
              ) : (
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 mb-6 border-2 border-red-200">
                  <p className="text-sm text-red-700 font-medium">
                    ❌ Impossible de démarrer : Vous avez seulement {teams.length} équipe{teams.length > 1 ? 's' : ''}.
                    Minimum requis : 4 équipes pour un tournoi par poules.
                  </p>
                  <p className="text-xs text-red-600 mt-2">
                    Ajoutez {4 - teams.length} équipe{4 - teams.length > 1 ? 's' : ''} supplémentaire{4 - teams.length > 1 ? 's' : ''} avant de démarrer.
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowStartModal(false)}
                  className="flex-1 px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={startTournament}
                  disabled={teams.length < 4 || !isValidPoolConfiguration(teams.length, tournament.settings.pouleSize || 4)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
                >
                  Démarrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de renommage d'équipe */}
      {editingTeam && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
              <h2 className="text-2xl font-bold text-white">
                ✏️ Renommer l'équipe
              </h2>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom actuel : <span className="font-bold">{editingTeam.name}</span>
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') renameTeam()
                  }}
                  placeholder="Nouveau nom de l'équipe"
                  maxLength={50}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  {newTeamName.length}/50 caractères
                </p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600">
                  💡 <strong>Astuce :</strong> Choisissez un nom unique et amusant pour votre équipe !
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Exemples : "Les Champions", "Team Rocket", "Les Invincibles"
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setEditingTeam(null)
                    setNewTeamName('')
                  }}
                  className="flex-1 px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  onClick={renameTeam}
                  disabled={!newTeamName.trim() || newTeamName.trim() === editingTeam.name}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Renommer
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