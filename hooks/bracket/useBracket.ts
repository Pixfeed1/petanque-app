'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  // 'en_attente' = slot double élim pas encore prêt ; type "de:*" pour la double élim
  status: 'a_jouer' | 'en_cours' | 'termine' | 'en_attente'
  terrain?: number
  type: string
  round?: string
}

// Vue double élimination : rounds du tableau gagnants (WB), des repêchages (LB)
// et la grande finale. Dérivée des matchs dont type commence par "de:".
export interface DERound {
  round: number
  matches: BracketMatch[]
}
export interface DEBracketView {
  wbRounds: DERound[]
  lbRounds: DERound[]
  gf: BracketMatch | null
}

export interface Tournament {
  id: string
  name: string
  org_id?: string
  mode?: string
  settings: {
    consolante?: boolean
  }
}

export interface BracketData {
  huitiemes: BracketMatch[]
  quarts: BracketMatch[]
  demis: BracketMatch[]
  byes: BracketMatch[]
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
  isDouble: boolean
  doubleElim: DEBracketView
  handleUpdateScore: (matchId: string) => void
}

// ============================================================================
// Hook principal
// ============================================================================

export function useBracket({ tournoiId }: UseBracketProps): UseBracketReturn {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [matches, setMatches] = useState<BracketMatch[]>([])
  const [bracketData, setBracketData] = useState<BracketData>({
    huitiemes: [],
    quarts: [],
    demis: [],
    byes: [],
    finale: null,
    petiteFinale: null
  })
  const [doubleElim, setDoubleElim] = useState<DEBracketView>({ wbRounds: [], lbRounds: [], gf: null })

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

      // Double élimination : matchs dont type commence par "de:" (de:W1-0, de:L2-1, de:GF)
      const deRaw = allMatches.filter((m: BracketMatch) => typeof m.type === 'string' && m.type.startsWith('de:'))
      if (deRaw.length > 0) {
        const wbMap = new Map<number, BracketMatch[]>()
        const lbMap = new Map<number, BracketMatch[]>()
        let gf: BracketMatch | null = null
        for (const m of deRaw) {
          const slot = m.type.slice(3) // "W1-0" | "L2-1" | "GF"
          if (slot === 'GF') { gf = m; continue }
          const mm = /^([WL])(\d+)-(\d+)$/.exec(slot)
          if (!mm) continue
          const round = parseInt(mm[2], 10)
          const map = mm[1] === 'W' ? wbMap : lbMap
          if (!map.has(round)) map.set(round, [])
          map.get(round)!.push(m)
        }
        const idxOf = (m: BracketMatch) => parseInt(m.type.slice(3).split('-')[1] || '0', 10)
        const toRounds = (map: Map<number, BracketMatch[]>): DERound[] =>
          [...map.entries()]
            .sort((a, b) => a[0] - b[0])
            .map(([round, ms]) => ({ round, matches: ms.sort((a, b) => idxOf(a) - idxOf(b)) }))
        setDoubleElim({ wbRounds: toRounds(wbMap), lbRounds: toRounds(lbMap), gf })
      }

      // Filtrer pour garder seulement les phases finales (élim simple)
      const matchesData = allMatches.filter((m: BracketMatch) =>
        ['huitieme', 'quart', 'demi', 'finale', 'petite_finale', 'bye'].includes(m.type)
      )

      if (matchesData) {
        setMatches(matchesData)

        // Tri stable par id (= ordre de creation) pour figer le placement dans le bracket
        const sortById = (a: BracketMatch, b: BracketMatch) => Number(a.id) - Number(b.id)

        // Organiser les matchs par type
        const organized: BracketData = {
          huitiemes: matchesData.filter((m: BracketMatch) => m.type === 'huitieme').sort(sortById),
          quarts: matchesData.filter((m: BracketMatch) => m.type === 'quart').sort(sortById),
          demis: matchesData.filter((m: BracketMatch) => m.type === 'demi').sort(sortById),
          byes: matchesData.filter((m: BracketMatch) => m.type === 'bye').sort(sortById),
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
    router.push(`/match/${matchId}`)
  }

  // Determiner les phases disponibles
  const hasHuitiemes = bracketData.huitiemes.length > 0
  const hasQuarts = bracketData.quarts.length > 0
  const hasDemis = bracketData.demis.length > 0
  const isDouble = doubleElim.wbRounds.length > 0 || doubleElim.gf !== null

  return {
    loading,
    tournament,
    matches,
    bracketData,
    hasHuitiemes,
    hasQuarts,
    hasDemis,
    isDouble,
    doubleElim,
    handleUpdateScore
  }
}
