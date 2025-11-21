'use client'

import { useState, useEffect } from 'react'
import type { Joueur } from '@/lib/types'

// ============================================================================
// Types
// ============================================================================

interface Team {
  id: string
  name: string
  players?: Joueur[]
}

export interface BracketMatch {
  id: string
  equipe_a: Team
  equipe_b: Team
  score_a: number
  score_b: number
  status: 'a_jouer' | 'en_cours' | 'termine'
  terrain?: number
  type: 'poule' | 'huitieme' | 'quart' | 'demi' | 'finale' | 'petite_finale'
  round?: string
}

export interface Tournament {
  id: string
  name: string
  settings: {
    consolante?: boolean
  }
}

export interface BracketData {
  huitiemes: BracketMatch[]
  quarts: BracketMatch[]
  demis: BracketMatch[]
  finale: BracketMatch | null
  petiteFinale: BracketMatch | null
}

interface UseBracketProps {
  tournoiId: string | string[] | undefined
}

interface UseBracketReturn {
  loading: boolean
  tournament: Tournament | null
  matches: BracketMatch[]
  bracketData: BracketData
  hasHuitiemes: boolean
  hasQuarts: boolean
  hasDemis: boolean
  handleUpdateScore: (matchId: string) => void
}

// ============================================================================
// Hook principal
// ============================================================================

export function useBracket({ tournoiId }: UseBracketProps): UseBracketReturn {
  const [loading, setLoading] = useState(true)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<BracketMatch[]>([])
  const [bracketData, setBracketData] = useState<BracketData>({
    huitiemes: [],
    quarts: [],
    demis: [],
    finale: null,
    petiteFinale: null
  })

  useEffect(() => {
    if (tournoiId) {
      loadBracketData()
    }
  }, [tournoiId])

  const loadBracketData = async () => {
    try {
      // Charger le tournoi
      const tournamentResponse = await fetch(`/api/tournois/${tournoiId}`, {
        credentials: 'include'
      })

      if (!tournamentResponse.ok) throw new Error('Erreur chargement tournoi')
      const tournamentData = await tournamentResponse.json()
      setTournament(tournamentData)

      // Charger les matchs de phases finales
      const matchesResponse = await fetch(`/api/matches?tournoi_id=${tournoiId}`, {
        credentials: 'include'
      })

      if (!matchesResponse.ok) throw new Error('Erreur chargement matchs')
      const allMatches = await matchesResponse.json()

      // Filtrer pour garder seulement les phases finales
      const matchesData = allMatches.filter((m: BracketMatch) =>
        ['huitieme', 'quart', 'demi', 'finale', 'petite_finale'].includes(m.type)
      )

      if (matchesData) {
        setMatches(matchesData)

        // Organiser les matchs par type
        const organized: BracketData = {
          huitiemes: matchesData.filter((m: BracketMatch) => m.type === 'huitieme'),
          quarts: matchesData.filter((m: BracketMatch) => m.type === 'quart'),
          demis: matchesData.filter((m: BracketMatch) => m.type === 'demi'),
          finale: matchesData.find((m: BracketMatch) => m.type === 'finale') || null,
          petiteFinale: matchesData.find((m: BracketMatch) => m.type === 'petite_finale') || null
        }

        setBracketData(organized)
      }
    } catch (error) {
      console.error('Erreur chargement bracket:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateScore = (matchId: string) => {
    // Navigation geree par le composant parent via router
    // On retourne juste l'ID du match
    if (typeof window !== 'undefined') {
      window.location.href = `/match/${matchId}`
    }
  }

  // Determiner les phases disponibles
  const hasHuitiemes = bracketData.huitiemes.length > 0
  const hasQuarts = bracketData.quarts.length > 0
  const hasDemis = bracketData.demis.length > 0

  return {
    loading,
    tournament,
    matches,
    bracketData,
    hasHuitiemes,
    hasQuarts,
    hasDemis,
    handleUpdateScore
  }
}
