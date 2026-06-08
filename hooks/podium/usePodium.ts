'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import confetti from 'canvas-confetti'
import type { Match, Equipe, Joueur } from '@/lib/types'
import { StatsService } from '@/lib/services'

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
    // Index des équipes depuis les objets equipe des matchs (incluent les joueurs pour l'affichage)
    const teamMap = new Map<string, Team>()
    for (const m of allMatches) {
      if (m.equipe_a?.id && !teamMap.has(m.equipe_a.id)) teamMap.set(m.equipe_a.id, m.equipe_a as unknown as Team)
      if (m.equipe_b?.id && !teamMap.has(m.equipe_b.id)) teamMap.set(m.equipe_b.id, m.equipe_b as unknown as Team)
    }

    let teamsList = Array.from(teamMap.values()).map(t => ({ id: t.id, name: t.name }))

    // Secours si aucun match exploitable : charger les équipes du tournoi
    if (teamsList.length === 0) {
      const equipesResponse = await fetch(`/api/equipes?tournoi_id=${tournoiId}`, {
        credentials: 'include'
      })
      if (equipesResponse.ok) {
        const equipesData = await equipesResponse.json()
        equipesData.forEach((e: Equipe) => teamMap.set(e.id, { id: e.id, name: e.name }))
        teamsList = equipesData.map((e: Equipe) => ({ id: e.id, name: e.name }))
      }
    }

    // Classement final : ordre = place dans le bracket (finale, petite finale, demies…),
    // sinon classement de poule. Gère le 3e via la petite finale OU le meilleur perdant de demie.
    const ranking = StatsService.computeFinalRanking(teamsList, allMatches)

    return ranking.slice(0, 3).map((r, idx) => ({
      position: idx + 1,
      team: teamMap.get(r.id) || { id: r.id, name: r.name }
    }))
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
