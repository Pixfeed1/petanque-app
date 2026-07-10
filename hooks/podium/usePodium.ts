'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import confetti from 'canvas-confetti'
import type { Match, Equipe, Match as MatchType, Joueur } from '@/lib/types'
import { StatsService } from '@/lib/services'
import { thirdPlaceTeamId } from '@/lib/services/doubleEliminationIntegration'

// ============================================================================
// Types
// ============================================================================

interface Team {
  id: string
  name: string
  players?: Joueur[]
}

export interface PodiumTeam {
  position: number
  team: Team
  score?: number
  stats?: {
    victories: number
    defeats: number
    draws: number
    pointsFor: number
    pointsAgainst: number
  }
}

// TeamClassement removed — using StatsService.TeamStats + sortTeamsByFIPJPRules

interface UsePodiumProps {
  tournoiId: string | string[] | undefined
  onSuccess?: (message: string) => void
}

interface UsePodiumReturn {
  loading: boolean
  tournament: any
  podium: PodiumTeam[]
  showAnimation: boolean
  animationStep: number
  generatingCertificate: boolean
  handleShare: () => Promise<void>
  generatePremiumCertificate: (position: number, team: PodiumTeam) => Promise<void>
  fireConfetti: () => void
}

// ============================================================================
// Hook principal
// ============================================================================

export function usePodium({ tournoiId, onSuccess }: UsePodiumProps): UsePodiumReturn {
  const [loading, setLoading] = useState(true)
  const [tournament, setTournament] = useState<any>(null)
  const [podium, setPodium] = useState<PodiumTeam[]>([])
  const [showAnimation, setShowAnimation] = useState(false)
  const [animationStep, setAnimationStep] = useState(0)
  const [generatingCertificate, setGeneratingCertificate] = useState(false)

  // Refs pour cleanup des timers
  const confettiIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const animationTimeoutsRef = useRef<NodeJS.Timeout[]>([])

  // Cleanup au demontage du composant
  useEffect(() => {
    return () => {
      // Nettoyer l'interval des confettis
      if (confettiIntervalRef.current) {
        clearInterval(confettiIntervalRef.current)
      }
      // Nettoyer tous les timeouts d'animation
      animationTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  // Chargement des donnees du podium
  useEffect(() => {
    if (tournoiId) {
      loadPodiumData()
    }
  }, [tournoiId])

  const loadPodiumData = async () => {
    try {
      // Charger le tournoi
      const tournamentResponse = await fetch(`/api/tournois/${tournoiId}`, {
        credentials: 'include'
      })
      if (!tournamentResponse.ok) throw new Error('Erreur chargement tournoi')
      const tournamentData = await tournamentResponse.json()
      setTournament(tournamentData)

      // Charger tous les matchs du tournoi
      const matchesResponse = await fetch(`/api/matches?tournoi_id=${tournoiId}`, {
        credentials: 'include'
      })
      if (!matchesResponse.ok) throw new Error('Erreur chargement matchs')
      const allMatches = await matchesResponse.json()

      // Construire le podium
      const podiumData = await buildPodium(allMatches, tournoiId as string)

      // Charger les stats completes pour chaque equipe
      await loadTeamStats(podiumData, allMatches)

      setPodium(podiumData)

      // Lancer l'animation apres chargement
      setTimeout(() => {
        setShowAnimation(true)
        animatePodium()
      }, 500)

    } catch (error) {
      console.error('Erreur chargement podium:', error)
    } finally {
      setLoading(false)
    }
  }

  const buildPodium = async (allMatches: Match[], tournoiId: string): Promise<PodiumTeam[]> => {
    const podiumData: PodiumTeam[] = []

    // FIX BUG : reconnaître la double élimination (types "de:*"). Sans ça, le podium
    // retombait sur le classement de poules et n'affichait jamais le vrai champion.
    if (buildPodiumFromDoubleElim(podiumData, allMatches)) {
      return podiumData
    }

    // Trouver la finale et la petite finale
    const finaleData = allMatches.find((m: Match) => m.type === 'finale')
    const petiteFinaleData = allMatches.find((m: Match) => m.type === 'petite_finale')

    // Champion (1er) et Finaliste (2e)
    if (finaleData && finaleData.status === 'termine') {
      const scoreA = finaleData.score_a ?? 0
      const scoreB = finaleData.score_b ?? 0
      const champion = scoreA > scoreB
        ? finaleData.equipe_a
        : finaleData.equipe_b
      const finaliste = scoreA > scoreB
        ? finaleData.equipe_b
        : finaleData.equipe_a

      if (champion) {
        podiumData.push({
          position: 1,
          team: champion,
          score: Math.max(scoreA, scoreB)
        })
      }

      if (finaliste) {
        podiumData.push({
          position: 2,
          team: finaliste,
          score: Math.min(scoreA, scoreB)
        })
      }
    } else {
      // Fallback: Utiliser le classement general des poules
      await buildPodiumFromPoules(podiumData, allMatches, tournoiId)
    }

    // 3eme place (ecrase le fallback si petite finale existe)
    if (petiteFinaleData && petiteFinaleData.status === 'termine') {
      const pScoreA = petiteFinaleData.score_a ?? 0
      const pScoreB = petiteFinaleData.score_b ?? 0
      const troisieme = pScoreA > pScoreB
        ? petiteFinaleData.equipe_a
        : petiteFinaleData.equipe_b

      if (troisieme) {
        const idx = podiumData.findIndex(p => p.position === 3)
        const newThird = {
          position: 3,
          team: troisieme,
          score: Math.max(pScoreA, pScoreB)
        }
        if (idx >= 0) podiumData[idx] = newThird
        else podiumData.push(newThird)
      }
    }

    return podiumData
  }

  /**
   * Construit le podium à partir d'un bracket à double élimination (types "de:*").
   * Champion = vainqueur de la grande finale (de:GF), 2e = finaliste,
   * 3e = perdant de la finale du losers bracket (via thirdPlaceTeamId).
   * Renvoie true si un bracket DE a été trouvé et traité.
   */
  const buildPodiumFromDoubleElim = (podiumData: PodiumTeam[], allMatches: Match[]): boolean => {
    const deMatches = allMatches.filter(
      (m: Match) => typeof m.type === 'string' && m.type.startsWith('de:')
    )
    if (deMatches.length === 0) return false

    // Index id -> équipe (nom) à partir des équipes présentes dans les matchs
    const teamById = new Map<string, Team>()
    for (const m of allMatches) {
      if (m.equipe_a?.id) teamById.set(m.equipe_a.id, m.equipe_a as Team)
      if (m.equipe_b?.id) teamById.set(m.equipe_b.id, m.equipe_b as Team)
    }

    // Match décisif : la GF2 (bracket reset) SI elle a réellement été jouée
    // (2 équipes + terminée) ; sinon la grande finale GF.
    const gf2 = deMatches.find((m: Match) => (m.type as string) === 'de:GF2')
    const gf2Played = !!gf2 && gf2.status === 'termine' && !!gf2.equipe_a_id && !!gf2.equipe_b_id
    const grandFinale = gf2Played
      ? gf2!
      : deMatches.find((m: Match) => (m.type as string) === 'de:GF')
    if (!grandFinale || grandFinale.status !== 'termine') {
      // Bracket DE en cours : pas encore de podium définitif → on ne bascule pas
      // sur le fallback poules (qui serait faux), on renvoie true avec un podium vide.
      return true
    }

    const scoreA = grandFinale.score_a ?? 0
    const scoreB = grandFinale.score_b ?? 0
    const championTeam = grandFinale.winner_id
      ? teamById.get(grandFinale.winner_id)
      : scoreA > scoreB ? (grandFinale.equipe_a as Team) : (grandFinale.equipe_b as Team)
    const finalisteTeam = grandFinale.winner_id
      ? (grandFinale.equipe_a?.id === grandFinale.winner_id ? grandFinale.equipe_b : grandFinale.equipe_a) as Team
      : scoreA > scoreB ? (grandFinale.equipe_b as Team) : (grandFinale.equipe_a as Team)

    if (championTeam) podiumData.push({ position: 1, team: championTeam, score: Math.max(scoreA, scoreB) })
    if (finalisteTeam) podiumData.push({ position: 2, team: finalisteTeam, score: Math.min(scoreA, scoreB) })

    const thirdId = thirdPlaceTeamId(
      deMatches.map((m: Match) => ({
        type: m.type,
        equipe_a_id: m.equipe_a_id ?? null,
        equipe_b_id: m.equipe_b_id ?? null,
        status: m.status,
        winner_id: m.winner_id ?? null
      }))
    )
    if (thirdId) {
      const t = teamById.get(thirdId)
      if (t) podiumData.push({ position: 3, team: t })
    }

    return true
  }

  const buildPodiumFromPoules = async (
    podiumData: PodiumTeam[],
    allMatches: Match[],
    tournoiId: string
  ) => {
    const equipesResponse = await fetch(`/api/equipes?tournoi_id=${tournoiId}`, {
      credentials: 'include'
    })
    if (!equipesResponse.ok) return

    const equipesData = await equipesResponse.json()

    // Filtrer uniquement les matchs de poule pour le classement
    const pouleMatches = allMatches.filter((m: Match) => m.type === 'poule')

    // Calculer les stats FIPJP pour chaque équipe
    const teamStats = equipesData.map((team: Equipe) =>
      StatsService.calculateTeamStats(team.id, team.name, pouleMatches)
    )

    // Tri FIPJP officiel (points, différence, confrontation directe, multi-way ties)
    const classement = StatsService.sortTeamsByFIPJPRules(teamStats, pouleMatches)

    if (classement[0]) podiumData.push({ position: 1, team: { id: classement[0].id, name: classement[0].name }, score: classement[0].pointsFor })
    if (classement[1]) podiumData.push({ position: 2, team: { id: classement[1].id, name: classement[1].name }, score: classement[1].pointsFor })
    if (classement[2]) podiumData.push({ position: 3, team: { id: classement[2].id, name: classement[2].name }, score: classement[2].pointsFor })
  }

  const loadTeamStats = async (podiumData: PodiumTeam[], allMatches: Match[]) => {
    for (const item of podiumData) {
      if (!item.team?.id) continue

      const matchesData = allMatches.filter((match: Match) =>
        match.status === 'termine' &&
        match.type !== 'bye' &&
        (match.equipe_a_id === item.team.id || match.equipe_b_id === item.team.id)
      )

      if (matchesData.length > 0) {
        const stats = {
          victories: 0,
          defeats: 0,
          draws: 0,
          pointsFor: 0,
          pointsAgainst: 0
        }

        matchesData.forEach((match: Match) => {
          const scoreA = match.score_a ?? 0
          const scoreB = match.score_b ?? 0
          if (match.equipe_a?.id === item.team.id) {
            if (scoreA > scoreB) stats.victories++
            else if (scoreA < scoreB) stats.defeats++
            else stats.draws++
            stats.pointsFor += scoreA
            stats.pointsAgainst += scoreB
          } else if (match.equipe_b?.id === item.team.id) {
            if (scoreB > scoreA) stats.victories++
            else if (scoreB < scoreA) stats.defeats++
            else stats.draws++
            stats.pointsFor += scoreB
            stats.pointsAgainst += scoreA
          }
        })

        item.stats = stats
      }
    }
  }

  const animatePodium = () => {
    // Stocker les timeouts pour cleanup
    animationTimeoutsRef.current = [
      setTimeout(() => setAnimationStep(3), 300),  // 3eme
      setTimeout(() => setAnimationStep(2), 600),  // 2eme
      setTimeout(() => setAnimationStep(1), 900),  // 1er
      setTimeout(() => fireConfetti(), 1200)
    ]
  }

  const fireConfetti = useCallback(() => {
    const duration = 5000
    const animationEnd = Date.now() + duration
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

    function randomInRange(min: number, max: number) {
      return Math.random() * (max - min) + min
    }

    // Stocker l'interval pour cleanup
    confettiIntervalRef.current = setInterval(function() {
      const timeLeft = animationEnd - Date.now()

      if (timeLeft <= 0) {
        if (confettiIntervalRef.current) {
          clearInterval(confettiIntervalRef.current)
          confettiIntervalRef.current = null
        }
        return
      }

      const particleCount = 50 * (timeLeft / duration)

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#4CAF50', '#2196F3']
      })

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#FFD700', '#FFA500', '#FF6347', '#4CAF50', '#2196F3']
      })
    }, 250)
  }, [])

  const handleShare = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      onSuccess?.('Lien copié dans le presse-papier !')
    } catch {
      onSuccess?.('Copie impossible. Lien : ' + url)
    }
  }

  const generatePremiumCertificate = async (position: number, team: PodiumTeam) => {
    setGeneratingCertificate(true)
    try {
      const { jsPDF } = await import('jspdf')
      await import('svg2pdf.js')
      const { buildCertificateSVG } = await import('@/lib/certificat/certificateSvg')

      const svgString = buildCertificateSVG({
        position,
        teamName: team.team.name,
        tournamentName: tournament?.name || 'Tournoi de pétanque',
        location: tournament?.settings?.location,
        date: new Date(tournament?.settings?.date || Date.now()),
        stats: team.stats
      })

      const wrapper = document.createElement('div')
      wrapper.style.position = 'fixed'
      wrapper.style.left = '-99999px'
      wrapper.style.top = '0'
      wrapper.innerHTML = svgString
      document.body.appendChild(wrapper)
      const svgEl = wrapper.querySelector('svg') as unknown as SVGSVGElement

      try {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
        await (doc as any).svg(svgEl, { x: 0, y: 0, width: 842, height: 595 })
        const label = position === 1 ? 'champion' : position === 2 ? 'finaliste' : '3eme'
        const slug = team.team.name.replace(/\s+/g, '-').toLowerCase()
        doc.save(`certificat-${label}-${slug}.pdf`)
      } finally {
        document.body.removeChild(wrapper)
      }
    } catch (error) {
      console.error('Erreur generation certificat:', error)
    } finally {
      setGeneratingCertificate(false)
    }
  }

  return {
    loading,
    tournament,
    podium,
    showAnimation,
    animationStep,
    generatingCertificate,
    handleShare,
    generatePremiumCertificate,
    fireConfetti
  }
}
