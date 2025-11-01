'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { loadStripe } from '@stripe/stripe-js'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// Initialisation Stripe
const stripePromise = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

// Icônes SVG
const Icons = {
  logo: (
    <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="url(#metalGradient)" stroke="#5a6978" strokeWidth="2"/>
      <circle cx="26" cy="26" r="3" fill="#ffffff" opacity="0.8"/>
      <circle cx="38" cy="38" r="2" fill="#2d3748" opacity="0.3"/>
      <circle cx="40" cy="28" r="2" fill="#2d3748" opacity="0.3"/>
      <defs>
        <radialGradient id="metalGradient">
          <stop offset="0%" stopColor="#a8b2c3"/>
          <stop offset="100%" stopColor="#8e9aaf"/>
        </radialGradient>
      </defs>
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
    </svg>
  ),
  trophy: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v6m-3 0h6m4-13V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1H11a1 1 0 00-1 1v1.5a.5.5 0 01-.5.5H7a2 2 0 00-2 2v1c0 3.5 2.5 6 5.5 6.5m9 0c3-0.5 5.5-3 5.5-6.5V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1h-2" />
    </svg>
  ),
  users: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  gamepad: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  ),
  plus: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  bell: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  chart: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  book: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
  crown: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2l2.5 5 5.5 1-4 4 1 5.5L10 14l-5 3.5 1-5.5-4-4 5.5-1L10 2z" />
    </svg>
  ),
  play: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  trending: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  fire: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  ),
  eye: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  edit: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  loader: (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  )
}

// Type pour les actions en attente
interface PendingAction {
  type: string
  icon: React.ReactElement
  title: string
  description: string
  tournoi?: string
  action: () => void
}

export default function Dashboard() {
  const router = useRouter()
  const { user, organization, loading: authLoading, signOut } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [showStatsDetails, setShowStatsDetails] = useState(false)
  
  // États pour les données
  const [userPlan, setUserPlan] = useState('free')
  const [tournois, setTournois] = useState<any[]>([])
  const [filteredTournois, setFilteredTournois] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalTournois: 0,
    tournoiEnCours: 0,
    totalJoueurs: 0,
    totalMatchs: 0,
    growth: {
      tournois: 0,
      joueurs: 0,
      matchs: 0
    }
  })
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  const [upcomingMatches, setUpcomingMatches] = useState<any[]>([])
  const [performance, setPerformance] = useState({
    winRate: 0,
    activityLevel: 'Faible',
    lastDaysActivity: [0, 0, 0, 0, 0, 0, 0],
    totalVictoires: 0,
    totalDefaites: 0,
    moyennePoints: 0
  })
  const [detailedStats, setDetailedStats] = useState({
    byCategory: {
      victoires: { value: 0, trend: 0 },
      participation: { value: 0, trend: 0 },
      pointsMoyens: { value: 0, trend: 0 },
      efficacite: { value: 0, trend: 0 }
    },
    recentActivity: [] as any[],
    topPerformers: [] as any[]
  })

  useEffect(() => {
    setMounted(true)
    if (!authLoading && user) {
      loadDashboardData()
    }
  }, [authLoading, user])

  useEffect(() => {
    if (filter === 'all') {
      setFilteredTournois(tournois)
    } else if (filter === 'en_cours') {
      setFilteredTournois(tournois.filter(t => t.status === 'en_cours'))
    } else if (filter === 'termine') {
      setFilteredTournois(tournois.filter(t => t.status === 'termine'))
    }
  }, [filter, tournois])

  const loadDashboardData = async () => {
    if (!user || !organization) return

    try {
      // 1. Le plan de l'utilisateur vient déjà de organization.settings
      if (organization?.settings?.plan) {
        setUserPlan(organization.settings.plan)
      }

      // 2. Charger les tournois
      const tournoiResponse = await fetch(`/api/tournois?org_id=${organization.id}`, {
        credentials: 'include'
      })

      if (tournoiResponse.ok) {
        const tournoiData = await tournoiResponse.json()
        setTournois(tournoiData)

        const enCours = tournoiData.filter((t: any) => t.status === 'en_cours').length
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const recentTournois = tournoiData.filter((t: any) => new Date(t.created_at) > lastMonth).length

        setStats(prev => ({
          ...prev,
          totalTournois: tournoiData.length,
          tournoiEnCours: enCours,
          growth: {
            ...prev.growth,
            tournois: recentTournois
          }
        }))
      }

      // 3. Charger les joueurs
      const joueursResponse = await fetch(`/api/joueurs?org_id=${organization.id}`, {
        credentials: 'include'
      })

      if (joueursResponse.ok) {
        const joueursData = await joueursResponse.json()
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)
        const recentPlayers = joueursData.filter((j: any) => new Date(j.created_at) > lastMonth)

        setStats(prev => ({
          ...prev,
          totalJoueurs: joueursData.length,
          growth: {
            ...prev.growth,
            joueurs: recentPlayers.length
          }
        }))
      }

      // 4. Charger TOUS les matchs de l'organisation (via tous les tournois)
      const allMatches: any[] = []
      let tournois: any[] = []

      // On charge les matchs pour chaque tournoi
      const tournoiResponse2 = await fetch(`/api/tournois?org_id=${organization.id}`, {
        credentials: 'include'
      })

      if (tournoiResponse2.ok) {
        tournois = await tournoiResponse2.json()

        // Charger les matchs de chaque tournoi
        for (const tournoi of tournois) {
          const matchResponse = await fetch(`/api/matches?tournoi_id=${tournoi.id}`, {
            credentials: 'include'
          })
          if (matchResponse.ok) {
            const matches = await matchResponse.json()
            allMatches.push(...matches.map((m: any) => ({ ...m, tournoi })))
          }
        }
      }

      if (allMatches.length > 0) {
        const lastMonth = new Date()
        lastMonth.setMonth(lastMonth.getMonth() - 1)

        setStats(prev => ({
          ...prev,
          totalMatchs: allMatches.length,
          growth: {
            ...prev.growth,
            matchs: allMatches.filter(m => new Date(m.created_at) > lastMonth).length
          }
        }))

        // Matchs à venir
        const upcoming = allMatches
          .filter(m => m.status === 'a_jouer')
          .slice(0, 3)
        setUpcomingMatches(upcoming)

        // Calculer les performances détaillées
        const terminatedMatches = allMatches.filter(m => m.status === 'termine')
        if (terminatedMatches.length > 0) {
          const totalWins = terminatedMatches.filter(m => m.score_a > m.score_b).length
          const totalLosses = terminatedMatches.filter(m => m.score_a < m.score_b).length
          const winRate = Math.round((totalWins / terminatedMatches.length) * 100)
          
          // Points moyens
          const totalPoints = terminatedMatches.reduce((acc, m) => acc + m.score_a + m.score_b, 0)
          const avgPoints = Math.round(totalPoints / (terminatedMatches.length * 2))
          
          // Activité des 7 derniers jours
          const activityByDay = [0, 0, 0, 0, 0, 0, 0]
          const today = new Date()
          
          for (let i = 0; i < 7; i++) {
            const dayStart = new Date(today)
            dayStart.setDate(today.getDate() - i)
            dayStart.setHours(0, 0, 0, 0)
            
            const dayEnd = new Date(dayStart)
            dayEnd.setHours(23, 59, 59, 999)
            
            const dayMatches = allMatches.filter(m => {
              const matchDate = new Date(m.updated_at)
              return matchDate >= dayStart && matchDate <= dayEnd
            }).length
            
            activityByDay[6 - i] = dayMatches
          }
          
          // Niveau d'activité
          const avgActivity = activityByDay.reduce((a, b) => a + b, 0) / 7
          let activityLevel = 'Faible'
          if (avgActivity >= 5) activityLevel = 'Excellent'
          else if (avgActivity >= 3) activityLevel = 'Bon'
          else if (avgActivity >= 1) activityLevel = 'Moyen'
          
          setPerformance({
            winRate,
            activityLevel,
            lastDaysActivity: activityByDay,
            totalVictoires: totalWins,
            totalDefaites: totalLosses,
            moyennePoints: avgPoints
          })

          // Stats détaillées
          setDetailedStats({
            byCategory: {
              victoires: { 
                value: totalWins, 
                trend: Math.round((totalWins / Math.max(terminatedMatches.length, 1)) * 100)
              },
              participation: { 
                value: terminatedMatches.length, 
                trend: allMatches.filter(m => {
                  const lastWeek = new Date()
                  lastWeek.setDate(lastWeek.getDate() - 7)
                  return new Date(m.created_at) > lastWeek
                }).length
              },
              pointsMoyens: { 
                value: avgPoints, 
                trend: avgPoints > 8 ? 10 : -5 
              },
              efficacite: { 
                value: winRate, 
                trend: winRate > 50 ? 15 : -10
              }
            },
            recentActivity: terminatedMatches.slice(0, 5).map(m => ({
              date: new Date(m.updated_at).toLocaleDateString('fr-FR'),
              equipeA: m.equipe_a?.name,
              equipeB: m.equipe_b?.name,
              scoreA: m.score_a,
              scoreB: m.score_b,
              winner: m.score_a > m.score_b ? 'A' : 'B'
            })),
            topPerformers: []
          })
        }

        // Actions en attente
        const actions: PendingAction[] = []
        
        // Matchs sans score
        const matchesWithoutScore = allMatches.filter(m => 
          m.status === 'en_cours' || (m.status === 'a_jouer' && m.tour === 1)
        )
        matchesWithoutScore.forEach(match => {
          actions.push({
            type: 'match_score',
            icon: Icons.edit,
            title: 'Match à saisir',
            description: `${match.equipe_a?.name} vs ${match.equipe_b?.name}`,
            tournoi: match.tournoi?.name,
            action: () => router.push(`/match/${match.id}`)
          })
        })
        
        // Tournois à démarrer
        if (tournois) {
          const tournoiToStart = tournois.filter(t => t.status === 'preparation')
          tournoiToStart.forEach(tournoi => {
            actions.push({
              type: 'start_tournament',
              icon: Icons.lightning,
              title: 'Tournoi à démarrer',
              description: tournoi.name,
              action: () => router.push(`/tournoi/${tournoi.id}`)
            })
          })
        }
        
        setPendingActions(actions)
      }

    } catch (error) {
      console.error('Erreur chargement dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    setShowProfileMenu(false)
    await signOut()
  }

  const handleUpgrade = async () => {
    setProcessingPayment(true)
    
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email
        })
      })

      const { sessionId } = await response.json()
      
      const stripe = await stripePromise
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId })
        if (error) {
          console.error('Erreur Stripe:', error)
        }
      }
    } catch (error) {
      console.error('Erreur upgrade:', error)
      alert('Service de paiement temporairement indisponible')
    } finally {
      setProcessingPayment(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      'en_cours': {
        bg: 'from-green-400 to-emerald-500',
        text: 'En cours',
        pulse: true
      },
      'preparation': {
        bg: 'from-yellow-400 to-orange-500',
        text: 'Préparation',
        pulse: false
      },
      'termine': {
        bg: 'from-gray-400 to-gray-500',
        text: 'Terminé',
        pulse: false
      }
    }
    return configs[status as keyof typeof configs] || configs.termine
  }

  // Configuration des graphiques Chart.js
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        borderRadius: 8,
        titleFont: {
          size: 14,
          weight: 'bold' as const
        },
        bodyFont: {
          size: 12
        }
      }
    }
  }

  // Données pour les graphiques
  const activityChartData = {
    labels: ['J-6', 'J-5', 'J-4', 'J-3', 'J-2', 'Hier', "Aujourd'hui"],
    datasets: [{
      label: 'Matchs joués',
      data: performance.lastDaysActivity,
      backgroundColor: 'rgba(99, 102, 241, 0.5)',
      borderColor: 'rgba(99, 102, 241, 1)',
      borderWidth: 2,
      borderRadius: 8,
      barThickness: 20
    }]
  }

  const winRateChartData = {
    labels: ['Victoires', 'Défaites'],
    datasets: [{
      data: [performance.totalVictoires, performance.totalDefaites],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgba(34, 197, 94, 1)',
        'rgba(239, 68, 68, 1)'
      ],
      borderWidth: 2
    }]
  }

  const trendChartData = {
    labels: ['J-6', 'J-5', 'J-4', 'J-3', 'J-2', 'Hier', "Aujourd'hui"],
    datasets: [{
      label: 'Performance',
      data: performance.lastDaysActivity.map((activity, index) => {
        const base = 60
        const variation = activity * 5
        return Math.min(100, base + variation + (index * 2))
      }),
      fill: true,
      backgroundColor: 'rgba(147, 51, 234, 0.1)',
      borderColor: 'rgba(147, 51, 234, 1)',
      borderWidth: 3,
      tension: 0.4,
      pointBackgroundColor: 'rgba(147, 51, 234, 1)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-12 shadow-2xl">
              {Icons.loader}
              <p className="mt-4 text-lg font-medium text-gray-600">Chargement...</p>
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

      {/* Header avec menu profil */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="relative group">
                {Icons.logo}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Pétanque Pro
                </h1>
                <p className="text-xs text-gray-500">{organization?.name || 'Mon Club'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Cloche avec actions */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                >
                  {Icons.bell}
                  {pendingActions.length > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {pendingActions.length}
                    </span>
                  )}
                </button>
                
                {/* Dropdown notifications */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                      <h3 className="font-bold text-gray-900">
                        {pendingActions.length > 0 
                          ? `${pendingActions.length} action${pendingActions.length > 1 ? 's' : ''} en attente`
                          : 'Aucune action en attente'
                        }
                      </h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {pendingActions.length > 0 ? (
                        pendingActions.map((action, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              action.action()
                              setShowNotifications(false)
                            }}
                            className="w-full px-4 py-3 hover:bg-gray-50 transition-all flex items-start space-x-3 border-b last:border-b-0"
                          >
                            <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg text-green-600">
                              {action.icon}
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-gray-900">{action.title}</p>
                              <p className="text-sm text-gray-600">{action.description}</p>
                              {action.tournoi && (
                                <p className="text-xs text-gray-500 mt-1">{action.tournoi}</p>
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <div className="text-4xl mb-2">✨</div>
                          <p>Tout est à jour !</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="h-8 w-px bg-gray-200"></div>
              
              {/* Menu profil avec plan */}
              <div className="relative">
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 px-3 py-1.5 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {user?.full_name || user?.email?.split('@')[0] || 'Utilisateur'}
                  </span>
                  {Icons.chevronDown}
                </button>

                {/* Dropdown profil */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="p-4 border-b">
                      <p className="text-sm text-gray-500">Connecté en tant que</p>
                      <p className="font-medium text-gray-900 truncate">{user?.email}</p>
                    </div>
                    
                    <div className="p-2">
                      <div className="px-3 py-2 text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                          <span>Organisation</span>
                          <span className="font-medium text-gray-900">{organization?.name}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          setShowUpgradeModal(true)
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {userPlan === 'premium' ? Icons.crown : Icons.star}
                            <span className="text-sm font-medium">
                              Plan : {userPlan === 'premium' ? 'Premium' : 'Gratuit'}
                            </span>
                          </div>
                          {userPlan === 'free' && (
                            <span className="text-xs bg-gradient-to-r from-green-600 to-emerald-600 text-white px-2 py-1 rounded-full">
                              Upgrade
                            </span>
                          )}
                        </div>
                        {userPlan === 'premium' && (
                          <p className="text-xs text-green-600 mt-1 ml-7">✓ Sans publicité</p>
                        )}
                      </button>

                      {/* Bouton Paramètres */}
                      <button
                        onClick={() => {
                          setShowProfileMenu(false)
                          router.push('/parametres')
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-all flex items-center space-x-2"
                      >
                        {Icons.settings}
                        <span className="text-sm font-medium">Paramètres</span>
                      </button>
                      
                      <div className="border-t mt-2 pt-2">
                        <button
                          onClick={handleLogout}
                          className="w-full px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-all flex items-center space-x-2"
                        >
                          {Icons.logout}
                          <span className="text-sm font-medium">Déconnexion</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className={`mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 rounded-3xl p-8 text-white">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-24 -translate-x-24"></div>
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    Bonjour {user?.full_name?.split(' ')[0] || 'Champion'} ! 👋
                  </h1>
                  <p className="text-green-100 text-lg">
                    {stats.tournoiEnCours > 0 
                      ? `Vous avez ${stats.tournoiEnCours} tournoi${stats.tournoiEnCours > 1 ? 's' : ''} en cours`
                      : 'Prêt à organiser un nouveau tournoi ?'
                    }
                  </p>
                </div>
                
                <button 
                  onClick={() => router.push('/tournoi/nouveau')}
                  className="px-6 py-3 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-2xl font-medium transition-all hover:scale-105 flex items-center space-x-2"
                >
                  {Icons.plus}
                  <span>Nouveau tournoi</span>
                </button>
              </div>

              {/* Mini stats dans hero */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Cette semaine</p>
                      <p className="text-2xl font-bold">{stats.growth.matchs} matchs</p>
                    </div>
                    {Icons.trending}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Nouveaux joueurs</p>
                      <p className="text-2xl font-bold">+{stats.growth.joueurs}</p>
                    </div>
                    {Icons.users}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Taux victoire</p>
                      <p className="text-2xl font-bold">{performance.winRate}%</p>
                    </div>
                    {Icons.chart}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            {
              title: 'Total Tournois',
              value: stats.totalTournois,
              change: stats.growth.tournois > 0 ? `+${stats.growth.tournois}` : null,
              icon: Icons.trophy,
              gradient: 'from-blue-500 to-indigo-600',
              lightGradient: 'from-blue-50 to-indigo-50'
            },
            {
              title: 'En cours',
              value: stats.tournoiEnCours,
              change: null,
              icon: Icons.play,
              gradient: 'from-green-500 to-emerald-600',
              lightGradient: 'from-green-50 to-emerald-50',
              pulse: stats.tournoiEnCours > 0
            },
            {
              title: 'Joueurs actifs',
              value: stats.totalJoueurs,
              change: stats.growth.joueurs > 0 ? `+${stats.growth.joueurs}` : null,
              icon: Icons.users,
              gradient: 'from-purple-500 to-pink-600',
              lightGradient: 'from-purple-50 to-pink-50'
            },
            {
              title: 'Matchs joués',
              value: stats.totalMatchs,
              change: stats.growth.matchs > 0 ? `+${stats.growth.matchs}` : null,
              icon: Icons.gamepad,
              gradient: 'from-orange-500 to-red-600',
              lightGradient: 'from-orange-50 to-red-50'
            }
          ].map((stat, index) => (
            <div 
              key={index}
              className={`group relative transition-all duration-500 ${
                mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              }`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl transform rotate-1 group-hover:rotate-2 transition-transform"></div>
              <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all group-hover:-translate-y-1">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.lightGradient} opacity-50 rounded-2xl`}></div>
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-br ${stat.gradient} rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform ${stat.pulse ? 'animate-pulse' : ''}`}>
                      {stat.icon}
                    </div>
                    {stat.change && (
                      <span className="flex items-center text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                        {Icons.trending}
                        {stat.change}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  
                  <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${stat.gradient} transition-all duration-1000`}
                      style={{ width: mounted ? '75%' : '0%' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { 
              label: 'Nouveau Tournoi', 
              icon: Icons.plus, 
              color: 'from-green-500 to-emerald-600',
              featured: true,
              action: () => router.push('/tournoi/nouveau')
            },
            { 
              label: 'Gérer Joueurs', 
              icon: Icons.users, 
              color: 'from-blue-500 to-indigo-600',
              action: () => router.push('/joueurs')
            },
            { 
              label: 'Quiz', 
              icon: Icons.book, 
              color: 'from-purple-500 to-pink-600',
              action: () => router.push('/quiz')
            },
            { 
              label: 'Statistiques', 
              icon: Icons.chart, 
              color: 'from-orange-500 to-red-600',
              action: () => setShowStatsDetails(!showStatsDetails)
            }
          ].map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className={`relative group overflow-hidden rounded-2xl transition-all hover:scale-105 ${
                action.featured 
                  ? 'bg-gradient-to-br ' + action.color + ' text-white shadow-xl' 
                  : 'bg-white border-2 border-gray-100 hover:border-gray-300'
              }`}
            >
              <div className="relative p-6 text-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 transform -skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                
                <div className={`inline-flex p-3 rounded-xl mb-3 ${
                  action.featured 
                    ? 'bg-white/20 backdrop-blur' 
                    : `bg-gradient-to-br ${action.color} text-white`
                }`}>
                  {action.icon}
                </div>
                <p className={`font-semibold ${action.featured ? 'text-white' : 'text-gray-900'}`}>
                  {action.label}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Section stats détaillées avec graphiques */}
        {showStatsDetails && (
          <div className="mb-8 bg-white rounded-3xl shadow-xl p-8 animate-slideIn">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Statistiques détaillées</h2>
              <button
                onClick={() => setShowStatsDetails(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-all"
              >
                {Icons.x}
              </button>
            </div>

            {/* Graphiques */}
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              {/* Graphique activité (barres) */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Activité hebdomadaire</h3>
                <div className="h-48">
                  <Bar data={activityChartData} options={chartOptions} />
                </div>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Moyenne : {Math.round(performance.lastDaysActivity.reduce((a, b) => a + b, 0) / 7)} matchs/jour
                </p>
              </div>

              {/* Graphique victoires/défaites (donut) */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Ratio victoires</h3>
                <div className="h-48">
                  <Doughnut data={winRateChartData} options={{
                    ...chartOptions,
                    cutout: '60%',
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        ...chartOptions.plugins.tooltip,
                        callbacks: {
                          label: (context) => {
                            const label = context.label || ''
                            const value = context.parsed || 0
                            const total = performance.totalVictoires + performance.totalDefaites
                            const percentage = total > 0 ? Math.round((value / total) * 100) : 0
                            return `${label}: ${value} (${percentage}%)`
                          }
                        }
                      }
                    }
                  }} />
                </div>
                <div className="text-center mt-4">
                  <p className="text-2xl font-bold text-gray-900">{performance.winRate}%</p>
                  <p className="text-sm text-gray-600">de victoires</p>
                </div>
              </div>

              {/* Graphique de tendance (ligne) */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Tendance performance</h3>
                <div className="h-48">
                  <Line data={trendChartData} options={{
                    ...chartOptions,
                    scales: {
                      y: {
                        beginAtZero: true,
                        max: 100,
                        ticks: {
                          callback: (value) => `${value}%`
                        }
                      }
                    }
                  }} />
                </div>
                <p className="text-sm text-gray-600 mt-4 text-center">
                  Évolution : {performance.winRate > 50 ? '📈 Progression' : '📉 À améliorer'}
                </p>
              </div>
            </div>

            {/* Stats par catégorie */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {Object.entries(detailedStats.byCategory).map(([key, data]) => (
                <div key={key} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                  <h3 className="text-sm text-gray-600 mb-2 capitalize">{key}</h3>
                  <p className="text-3xl font-bold text-gray-900 mb-2">
                    {data.value}{key === 'efficacite' || key === 'pointsMoyens' ? '%' : ''}
                  </p>
                  <div className="flex items-center text-sm">
                    {data.trend > 0 ? (
                      <span className="text-green-600 flex items-center">
                        {Icons.trending}
                        <span className="ml-1">+{data.trend}%</span>
                      </span>
                    ) : (
                      <span className="text-red-600">-{Math.abs(data.trend)}%</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Activité récente */}
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Derniers matchs</h3>
              <div className="space-y-3">
                {detailedStats.recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {activity.equipeA} vs {activity.equipeB}
                      </p>
                      <p className="text-sm text-gray-500">{activity.date}</p>
                    </div>
                    <div className="text-lg font-bold">
                      <span className={activity.winner === 'A' ? 'text-green-600' : 'text-gray-400'}>
                        {activity.scoreA}
                      </span>
                      <span className="mx-2 text-gray-400">-</span>
                      <span className={activity.winner === 'B' ? 'text-green-600' : 'text-gray-400'}>
                        {activity.scoreB}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

{/* Liste des tournois et widgets */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2">
           <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
             <div className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
               <div className="flex justify-between items-center">
                 <h2 className="text-2xl font-bold text-gray-900">Mes Tournois</h2>
                 
                 <div className="flex bg-gray-200 rounded-xl p-1">
                   {['all', 'en_cours', 'termine'].map(f => (
                     <button
                       key={f}
                       onClick={() => setFilter(f)}
                       className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                         filter === f 
                           ? 'bg-white text-gray-900 shadow-md' 
                           : 'text-gray-600 hover:text-gray-900'
                       }`}
                     >
                       {f === 'all' ? 'Tous' : f === 'en_cours' ? 'En cours' : 'Terminés'}
                     </button>
                   ))}
                 </div>
               </div>
             </div>

             <div className="divide-y divide-gray-100">
               {filteredTournois.length > 0 ? (
                 filteredTournois.map((tournoi) => {
                   const statusConfig = getStatusBadge(tournoi.status)
                   
                   return (
                     <div 
                       key={tournoi.id}
                       className="group p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all"
                     >
                       <div className="flex items-center justify-between">
                         <div className="flex-1">
                           <div className="flex items-center space-x-3 mb-3">
                             <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">
                               {tournoi.name}
                             </h3>
                             <div className="relative">
                               <span className={`px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r ${statusConfig.bg} text-white`}>
                                 {statusConfig.text}
                               </span>
                               {statusConfig.pulse && (
                                 <span className={`absolute inset-0 rounded-full bg-gradient-to-r ${statusConfig.bg} animate-ping opacity-20`}></span>
                               )}
                             </div>
                           </div>
                           
                           <div className="flex items-center space-x-6 text-sm">
                             <span className="flex items-center text-gray-600">
                               {Icons.calendar}
                               <span className="ml-2">
                                 {new Date(tournoi.created_at).toLocaleDateString('fr-FR')}
                               </span>
                             </span>
                             <span className="text-gray-600">
                               {tournoi.format} • {tournoi.mode.replace('_', ' ')}
                             </span>
                           </div>
                         </div>
                         
                         <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                             className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-all hover:scale-110"
                           >
                             {Icons.eye}
                           </button>
                         </div>
                       </div>
                     </div>
                   )
                 })
               ) : (
                 <div className="p-12 text-center">
                   <div className="text-6xl mb-4">🎯</div>
                   <p className="text-xl font-medium text-gray-600 mb-2">
                     {filter === 'all' 
                       ? 'Aucun tournoi créé'
                       : filter === 'en_cours'
                       ? 'Aucun tournoi en cours'
                       : 'Aucun tournoi terminé'
                     }
                   </p>
                   {filter === 'all' && (
                     <button
                       onClick={() => router.push('/tournoi/nouveau')}
                       className="mt-4 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                     >
                       Créer mon premier tournoi
                     </button>
                   )}
                 </div>
               )}
             </div>
           </div>
         </div>

         {/* Sidebar avec widgets */}
         <div className="space-y-6">
           {/* Widget Performance avec graphique intégré */}
           <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-3xl p-6 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
             
             <div className="relative">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-bold">Performance</h3>
                 {Icons.fire}
               </div>
               
               <div className="space-y-3">
                 <div>
                   <div className="flex justify-between text-sm mb-1">
                     <span className="text-indigo-100">Taux de victoire</span>
                     <span className="font-bold">{performance.winRate}%</span>
                   </div>
                   <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                     <div 
                       className="h-full bg-white/80 rounded-full transition-all duration-1000"
                       style={{ width: `${performance.winRate}%` }}
                     />
                   </div>
                 </div>
                 
                 <div>
                   <div className="flex justify-between text-sm mb-1">
                     <span className="text-indigo-100">Activité</span>
                     <span className="font-bold">{performance.activityLevel}</span>
                   </div>
                   <div className="flex space-x-1">
                     {performance.lastDaysActivity.slice(0, 5).map((activity, i) => (
                       <div 
                         key={i} 
                         className="h-8 flex-1 bg-white/20 rounded relative overflow-hidden"
                       >
                         <div 
                           className="absolute bottom-0 left-0 right-0 bg-white/80 transition-all"
                           style={{ height: `${Math.min(activity * 10, 100)}%` }}
                         />
                       </div>
                     ))}
                   </div>
                 </div>
               </div>

               <button 
                 onClick={() => setShowStatsDetails(true)}
                 className="w-full mt-6 px-4 py-3 bg-white/20 backdrop-blur hover:bg-white/30 rounded-xl font-medium transition-all"
               >
                 Voir détails →
               </button>
             </div>
           </div>

           {/* Widget Prochains matchs */}
           <div className="bg-white rounded-3xl shadow-xl p-6">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-bold text-gray-900">Prochains matchs</h3>
               {upcomingMatches.length > 0 && (
                 <span className="text-xs px-2 py-1 bg-orange-100 text-orange-600 rounded-lg font-medium">
                   À jouer
                 </span>
               )}
             </div>
             
             <div className="space-y-3">
               {upcomingMatches.length > 0 ? (
                 upcomingMatches.map((match, i) => (
                   <div 
                     key={match.id} 
                     className="group p-3 bg-gray-50 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl transition-all cursor-pointer"
                     onClick={() => router.push(`/match/${match.id}`)}
                   >
                     <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-bold text-gray-500">Tour {match.tour}</span>
                       <span className="text-xs px-2 py-1 bg-gray-200 text-gray-600 rounded">
                         Terrain {match.terrain || '?'}
                       </span>
                     </div>
                     <div className="text-sm">
                       <div className="font-medium text-gray-900">{match.equipe_a?.name}</div>
                       <div className="text-xs text-gray-500 my-1">VS</div>
                       <div className="font-medium text-gray-900">{match.equipe_b?.name}</div>
                     </div>
                   </div>
                 ))
               ) : (
                 <div className="text-center py-8 text-gray-500">
                   <div className="text-3xl mb-2">📅</div>
                   <p className="text-sm">Aucun match programmé</p>
                 </div>
               )}
             </div>
           </div>
         </div>
       </div>
     </div>

     {/* Modal Upgrade */}
     {showUpgradeModal && (
       <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
         <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-slideUp">
           <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white relative">
             <button
               onClick={() => setShowUpgradeModal(false)}
               className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-all"
             >
               {Icons.x}
             </button>
             <h2 className="text-3xl font-bold mb-2">
               {userPlan === 'premium' ? 'Vous êtes Premium ! 🎉' : 'Passez à Premium'}
             </h2>
             <p className="text-green-100">
               {userPlan === 'premium' 
                 ? 'Profitez de toutes les fonctionnalités sans publicité'
                 : 'Supprimez les publicités et soutenez le développement'
               }
             </p>
           </div>

           <div className="p-8">
             {userPlan === 'free' ? (
               <>
                 <div className="grid md:grid-cols-2 gap-6 mb-8">
                   {/* Plan Gratuit */}
                   <div className="border-2 border-gray-200 rounded-2xl p-6">
                     <div className="flex items-center justify-between mb-4">
                       <h3 className="text-xl font-bold text-gray-900">Gratuit</h3>
                       <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                         Actuel
                       </span>
                     </div>
                     <div className="text-3xl font-bold text-gray-900 mb-4">0€</div>
                     <ul className="space-y-3">
                       <li className="flex items-start">
                         <span className="text-green-500 mr-2 mt-0.5">{Icons.check}</span>
                         <span className="text-gray-700">Tournois illimités</span>
                       </li>
                       <li className="flex items-start">
                         <span className="text-green-500 mr-2 mt-0.5">{Icons.check}</span>
                         <span className="text-gray-700">Toutes les fonctionnalités</span>
                       </li>
                       <li className="flex items-start">
                         <span className="text-orange-500 mr-2 mt-0.5">⚠️</span>
                         <span className="text-gray-700">Avec publicités</span>
                       </li>
                     </ul>
                   </div>

                   {/* Plan Premium */}
                   <div className="border-2 border-green-500 rounded-2xl p-6 relative bg-gradient-to-br from-green-50 to-emerald-50">
                     <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-bold">
                       RECOMMANDÉ
                     </div>
                     <div className="flex items-center justify-between mb-4">
                       <h3 className="text-xl font-bold text-gray-900">Premium</h3>
                       {Icons.crown}
                     </div>
                     <div className="text-3xl font-bold text-green-600 mb-1">4,99€</div>
                     <p className="text-sm text-gray-600 mb-4">Paiement unique, à vie</p>
                     <ul className="space-y-3">
                       <li className="flex items-start">
                         <span className="text-green-500 mr-2 mt-0.5">{Icons.check}</span>
                         <span className="text-gray-700 font-medium">Tournois illimités</span>
                       </li>
                       <li className="flex items-start">
                         <span className="text-green-500 mr-2 mt-0.5">{Icons.check}</span>
                         <span className="text-gray-700 font-medium">Toutes les fonctionnalités</span>
                       </li>
                       <li className="flex items-start">
                         <span className="text-green-500 mr-2 mt-0.5">{Icons.star}</span>
                         <span className="text-gray-700 font-bold">Sans publicité</span>
                       </li>
                       <li className="flex items-start">
                         <span className="text-green-500 mr-2 mt-0.5">{Icons.star}</span>
                         <span className="text-gray-700 font-bold">Support prioritaire</span>
                       </li>
                     </ul>
                   </div>
                 </div>

                 <div className="text-center">
                   <button
                     onClick={handleUpgrade}
                     disabled={processingPayment}
                     className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg rounded-full hover:shadow-2xl transition-all transform hover:scale-105 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                     {processingPayment ? (
                       <span className="flex items-center">
                         {Icons.loader}
                         <span className="ml-2">Traitement...</span>
                       </span>
                     ) : (
                       'Passer à Premium (4,99€)'
                     )}
                   </button>
                   <p className="mt-4 text-sm text-gray-500">
                     Paiement sécurisé via Stripe • Satisfaction garantie
                   </p>
                 </div>
               </>
             ) : (
               <div className="text-center py-8">
                 <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
                   {Icons.crown}
                 </div>
                 <h3 className="text-2xl font-bold text-gray-900 mb-2">
                   Merci pour votre soutien !
                 </h3>
                 <p className="text-gray-600 mb-6">
                   Vous profitez de l'application sans publicité et avec toutes les fonctionnalités.
                 </p>
                 <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
                   <h4 className="font-bold text-gray-900 mb-3">Vos avantages Premium :</h4>
                   <div className="grid grid-cols-2 gap-4 text-left">
                     <div className="flex items-start">
                       <span className="text-green-500 mr-2">{Icons.check}</span>
                       <span className="text-gray-700">Sans publicité</span>
                     </div>
                     <div className="flex items-start">
                       <span className="text-green-500 mr-2">{Icons.check}</span>
                       <span className="text-gray-700">Support prioritaire</span>
                     </div>
                     <div className="flex items-start">
                       <span className="text-green-500 mr-2">{Icons.check}</span>
                       <span className="text-gray-700">Mises à jour gratuites</span>
                     </div>
                     <div className="flex items-start">
                       <span className="text-green-500 mr-2">{Icons.check}</span>
                       <span className="text-gray-700">Accès à vie</span>
                     </div>
                   </div>
                 </div>
               </div>
             )}
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
         from { opacity: 0; transform: translateY(30px); }
         to { opacity: 1; transform: translateY(0); }
       }
       
       @keyframes slideIn {
         from { opacity: 0; transform: translateX(-20px); }
         to { opacity: 1; transform: translateX(0); }
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
         animation: slideUp 0.5s ease-out;
       }
       
       .animate-slideIn {
         animation: slideIn 0.4s ease-out;
       }
     `}</style>
   </div>
 )
}