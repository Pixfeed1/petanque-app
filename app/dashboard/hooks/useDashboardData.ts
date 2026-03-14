// app/dashboard/hooks/useDashboardData.ts
// Hook personnalisé pour gérer toutes les données du dashboard

import { useState, useEffect } from 'react'
import type { Joueur } from '@/lib/types'

// Helper pour calculer la date du mois dernier (evite la duplication)
const getLastMonthDate = () => {
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  return lastMonth
}

export interface DashboardStats {
  totalTournois: number
  tournoiEnCours: number
  totalJoueurs: number
  totalMatchs: number
  nouveauxTournois: number
  nouveauxJoueurs: number
  nouveauxMatchs: number
}

export interface Tournament {
  id: number
  name: string
  format: string
  mode: string
  status: 'preparation' | 'en_cours' | 'termine'
  created_at: string
  nb_joueurs?: number
  nb_matchs_total?: number
  nb_matchs_joues?: number
}

export interface Match {
  id: number
  tournoi_id: number
  status: string
  tour: number
  terrain?: number
  score_a?: number
  score_b?: number
  equipe_a?: { name: string }
  equipe_b?: { name: string }
  created_at: string
  updated_at: string
}

export function useDashboardData(organizationId: number | undefined) {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalTournois: 0,
    tournoiEnCours: 0,
    totalJoueurs: 0,
    totalMatchs: 0,
    nouveauxTournois: 0,
    nouveauxJoueurs: 0,
    nouveauxMatchs: 0
  })
  const [tournois, setTournois] = useState<Tournament[]>([])
  const [recentMatches, setRecentMatches] = useState<Match[]>([])

  useEffect(() => {
    if (!organizationId) return

    loadData()
  }, [organizationId])

  const loadData = async () => {
    if (!organizationId) return

    try {
      setLoading(true)

      // Charger les tournois (une seule fois)
      const tournoiRes = await fetch(`/api/tournois?org_id=${organizationId}`, {
        credentials: 'include'
      })

      let tournoiData: Tournament[] = []
      if (tournoiRes.ok) {
        tournoiData = await tournoiRes.json()
        setTournois(tournoiData)

        // Calculer les stats des tournois
        const enCours = tournoiData.filter(t => t.status === 'en_cours').length
        const lastMonth = getLastMonthDate()
        const recentTournois = tournoiData.filter(
          t => new Date(t.created_at) > lastMonth
        ).length

        setStats(prev => ({
          ...prev,
          totalTournois: tournoiData.length,
          tournoiEnCours: enCours,
          nouveauxTournois: recentTournois
        }))
      }

      // Charger les joueurs
      const joueursRes = await fetch(`/api/joueurs?org_id=${organizationId}`, {
        credentials: 'include'
      })

      if (joueursRes.ok) {
        const data = await joueursRes.json()
        const joueursData: Joueur[] = Array.isArray(data) ? data : data.joueurs || []
        const lastMonth = getLastMonthDate()
        const recentPlayers = joueursData.filter(
          (j: Joueur) => j.created_at && new Date(j.created_at) > lastMonth
        ).length

        setStats(prev => ({
          ...prev,
          totalJoueurs: joueursData.length,
          nouveauxJoueurs: recentPlayers
        }))
      }

      // Charger tous les matchs de l'org en une seule requête via le endpoint dashboard stats
      const matchesRes = await fetch(`/api/dashboard/matches?org_id=${organizationId}`, {
        credentials: 'include'
      })
      const allMatches: Match[] = matchesRes.ok ? await matchesRes.json() : []

      if (allMatches.length > 0) {
        const lastMonth = getLastMonthDate()
        const recentMatchs = allMatches.filter(
          m => new Date(m.created_at) > lastMonth
        ).length

        setStats(prev => ({
          ...prev,
          totalMatchs: allMatches.length,
          nouveauxMatchs: recentMatchs
        }))

        // Recuperer les 5 derniers matchs termines
        const recent = allMatches
          .filter(m => m.status === 'termine')
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
          .slice(0, 5)

        setRecentMatches(recent)
      }

    } catch (error) {
      console.error('Erreur chargement donnees dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    stats,
    tournois,
    recentMatches,
    refetch: loadData
  }
}
