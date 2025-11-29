'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import confetti from 'canvas-confetti'
import type { Match, Equipe, Joueur } from '@/lib/types'

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
    pointsFor: number
    pointsAgainst: number
  }
}

interface TeamClassement {
  team: Equipe
  victories: number
  draws: number
  points: number
  difference: number
  pointsFor: number
}

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
    // 🔧 FIX: Vérifier que equipesData est un tableau avant .map()
    const equipes = Array.isArray(equipesData) ? equipesData : equipesData.equipes || []
    if (equipes.length === 0) return

    const classement: TeamClassement[] = equipes.map((team: Equipe) => {
      const teamMatches = allMatches.filter((m: Match) =>
        m.status === 'termine' && m.type === 'poule' &&
        (m.equipe_a_id === team.id || m.equipe_b_id === team.id)
      )
      // 🔧 FIX: Ajouter comptage des nuls pour points FIPJP
      let victories = 0, draws = 0, pointsFor = 0, pointsAgainst = 0
      teamMatches.forEach((m: Match) => {
        const scoreA = m.score_a ?? 0
        const scoreB = m.score_b ?? 0

        if (m.equipe_a_id === team.id) {
          if (scoreA > scoreB) victories++
          else if (scoreA === scoreB) draws++
          pointsFor += scoreA
          pointsAgainst += scoreB
        } else if (m.equipe_b_id === team.id) {
          if (scoreB > scoreA) victories++
          else if (scoreB === scoreA) draws++
          pointsFor += scoreB
          pointsAgainst += scoreA
        }
      })
      // Points FIPJP = victoires × 3 + nuls × 1
      const points = victories * 3 + draws
      return { team, victories, draws, points, difference: pointsFor - pointsAgainst, pointsFor }
    }).sort((a: TeamClassement, b: TeamClassement) => {
      // 🔧 FIX: Tri par points FIPJP au lieu de victoires seules
      // 1. Points FIPJP (victoires × 3 + nuls × 1)
      if (b.points !== a.points) return b.points - a.points
      // 2. Difference de points
      if (b.difference !== a.difference) return b.difference - a.difference
      // 3. Confrontation directe
      const directMatch = allMatches.find((m: Match) =>
        m.status === 'termine' && m.type === 'poule' &&
        ((m.equipe_a_id === a.team.id && m.equipe_b_id === b.team.id) ||
         (m.equipe_a_id === b.team.id && m.equipe_b_id === a.team.id))
      )
      if (directMatch) {
        const dmScoreA = directMatch.score_a ?? 0
        const dmScoreB = directMatch.score_b ?? 0
        // 🔧 FIX: Utiliser equipe_a_id au lieu de equipe_a?.id pour cohérence
        const aWon = (directMatch.equipe_a_id === a.team.id && dmScoreA > dmScoreB) ||
                     (directMatch.equipe_b_id === a.team.id && dmScoreB > dmScoreA)
        if (aWon) return -1
        else return 1
      }
      // 4. Nombre de points marques
      return b.pointsFor - a.pointsFor
    })

    if (classement[0]) podiumData.push({ position: 1, team: classement[0].team, score: classement[0].pointsFor })
    if (classement[1]) podiumData.push({ position: 2, team: classement[1].team, score: classement[1].pointsFor })
    if (classement[2]) podiumData.push({ position: 3, team: classement[2].team, score: classement[2].pointsFor })
  }

  const loadTeamStats = async (podiumData: PodiumTeam[], allMatches: Match[]) => {
    for (const item of podiumData) {
      if (!item.team?.id) continue

      const matchesData = allMatches.filter((match: Match) =>
        match.status === 'termine' &&
        (match.equipe_a_id === item.team.id || match.equipe_b_id === item.team.id)
      )

      if (matchesData.length > 0) {
        const stats = {
          victories: 0,
          defeats: 0,
          pointsFor: 0,
          pointsAgainst: 0
        }

        matchesData.forEach((match: Match) => {
          const scoreA = match.score_a ?? 0
          const scoreB = match.score_b ?? 0

          // 🔧 FIX: Utiliser equipe_a_id/equipe_b_id au lieu de equipe_a?.id pour cohérence
          if (match.equipe_a_id === item.team.id) {
            if (scoreA > scoreB) stats.victories++
            else if (scoreA < scoreB) stats.defeats++
            stats.pointsFor += scoreA
            stats.pointsAgainst += scoreB
          } else if (match.equipe_b_id === item.team.id) {
            if (scoreB > scoreA) stats.victories++
            else if (scoreB < scoreA) stats.defeats++
            stats.pointsFor += scoreB
            stats.pointsAgainst += scoreA
          }
        })

        item.stats = stats
      }
    }
  }

  // A1 FIX: Animations podium plus rapides
  const animatePodium = () => {
    // Stocker les timeouts pour cleanup
    animationTimeoutsRef.current = [
      setTimeout(() => setAnimationStep(3), 200),  // 3eme (était 300)
      setTimeout(() => setAnimationStep(2), 400),  // 2eme (était 600)
      setTimeout(() => setAnimationStep(1), 600),  // 1er (était 900)
      setTimeout(() => fireConfetti(), 800)       // (était 1200)
    ]
  }

  const fireConfetti = useCallback(() => {
    const duration = 3000  // A1 FIX: Réduire de 5s à 3s
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
    const shareData = {
      title: `Podium - ${tournament?.name}`,
      text: `🏆 Champion: ${podium[0]?.team.name}\n🥈 Finaliste: ${podium[1]?.team.name}\n🥉 3eme: ${podium[2]?.team.name}`,
      url: window.location.href
    }

    try {
      if (navigator.share) {
        await navigator.share(shareData)
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`)
        if (onSuccess) {
          onSuccess('Lien copié dans le presse-papier !')
        }
      }
    } catch (error) {
      console.error('Erreur partage:', error)
    }
  }

  const generatePremiumCertificate = async (position: number, team: PodiumTeam) => {
    setGeneratingCertificate(true)

    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = 1200 * scale
    canvas.height = 850 * scale
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      setGeneratingCertificate(false)
      return
    }

    ctx.scale(scale, scale)

    // Fond premium
    drawCertificateBackground(ctx, position)

    // Motif de fond
    drawBackgroundPattern(ctx, position)

    // Bordures
    drawCertificateBorders(ctx, position)

    // Logo petanque
    drawPetanqueLogo(ctx)

    // Titre
    drawCertificateTitle(ctx)

    // Position et medaille
    drawPositionBadge(ctx, position)

    // Nom de l'equipe
    drawTeamName(ctx, position, team.team.name)

    // Details du tournoi
    drawTournamentDetails(ctx, tournament)

    // Stats si disponibles
    if (team.stats) {
      drawStats(ctx, team.stats)
    }

    // Signature
    drawSignature(ctx)

    // Filigrane
    drawWatermark(ctx)

    // Telecharger
    canvas.toBlob(blob => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `certificat-${position === 1 ? 'champion' : position === 2 ? 'finaliste' : '3eme'}-${team.team.name.replace(/\s/g, '-').toLowerCase()}.png`
        a.click()
        URL.revokeObjectURL(url)
      }
      setGeneratingCertificate(false)
    }, 'image/png', 1.0)
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

// ============================================================================
// Fonctions de dessin du certificat
// ============================================================================

function getPositionColor(position: number): { primary: string; secondary: string; tertiary: string } {
  if (position === 1) {
    return { primary: '#FFD700', secondary: '#FFA500', tertiary: '#ffecb3' }
  } else if (position === 2) {
    return { primary: '#C0C0C0', secondary: '#E5E5E5', tertiary: '#e0e0e0' }
  }
  return { primary: '#CD7F32', secondary: '#DDA15E', tertiary: '#ffcc80' }
}

function drawCertificateBackground(ctx: CanvasRenderingContext2D, position: number) {
  const bgGradient = ctx.createLinearGradient(0, 0, 1200, 850)
  if (position === 1) {
    bgGradient.addColorStop(0, '#fff9e6')
    bgGradient.addColorStop(0.5, '#fff4cc')
    bgGradient.addColorStop(1, '#ffecb3')
  } else if (position === 2) {
    bgGradient.addColorStop(0, '#f5f5f5')
    bgGradient.addColorStop(0.5, '#eeeeee')
    bgGradient.addColorStop(1, '#e0e0e0')
  } else {
    bgGradient.addColorStop(0, '#fff3e0')
    bgGradient.addColorStop(0.5, '#ffe0b2')
    bgGradient.addColorStop(1, '#ffcc80')
  }
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, 1200, 850)
}

function drawBackgroundPattern(ctx: CanvasRenderingContext2D, position: number) {
  const colors = getPositionColor(position)
  ctx.globalAlpha = 0.05
  for (let i = 0; i < 20; i++) {
    for (let j = 0; j < 15; j++) {
      ctx.beginPath()
      ctx.arc(i * 60 + 30, j * 60 + 30, 20, 0, Math.PI * 2)
      ctx.strokeStyle = colors.primary
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
}

function drawCertificateBorders(ctx: CanvasRenderingContext2D, position: number) {
  const colors = getPositionColor(position)

  // Bordure exterieure
  const borderGradient = ctx.createLinearGradient(0, 0, 1200, 850)
  borderGradient.addColorStop(0, colors.primary)
  borderGradient.addColorStop(0.5, colors.secondary)
  borderGradient.addColorStop(1, colors.primary)

  ctx.strokeStyle = borderGradient
  ctx.lineWidth = 15
  ctx.strokeRect(20, 20, 1160, 810)

  // Bordure interieure
  ctx.strokeStyle = colors.primary
  ctx.lineWidth = 2
  ctx.strokeRect(40, 40, 1120, 770)

  // Coins decoratifs
  ctx.strokeStyle = colors.primary
  ctx.lineWidth = 3

  // Coin haut gauche
  ctx.beginPath()
  ctx.moveTo(40, 100)
  ctx.lineTo(40, 40)
  ctx.lineTo(100, 40)
  ctx.stroke()

  // Coin haut droit
  ctx.beginPath()
  ctx.moveTo(1100, 40)
  ctx.lineTo(1160, 40)
  ctx.lineTo(1160, 100)
  ctx.stroke()

  // Coin bas gauche
  ctx.beginPath()
  ctx.moveTo(40, 750)
  ctx.lineTo(40, 810)
  ctx.lineTo(100, 810)
  ctx.stroke()

  // Coin bas droit
  ctx.beginPath()
  ctx.moveTo(1100, 810)
  ctx.lineTo(1160, 810)
  ctx.lineTo(1160, 750)
  ctx.stroke()
}

function drawPetanqueLogo(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.translate(600, 150)

  // Boule principale
  const bouleGradient = ctx.createRadialGradient(0, 0, 5, 0, 0, 40)
  bouleGradient.addColorStop(0, '#e0e0e0')
  bouleGradient.addColorStop(0.5, '#a8a8a8')
  bouleGradient.addColorStop(1, '#707070')
  ctx.fillStyle = bouleGradient
  ctx.beginPath()
  ctx.arc(0, 0, 40, 0, Math.PI * 2)
  ctx.fill()

  // Reflet
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
  ctx.beginPath()
  ctx.arc(-10, -10, 12, 0, Math.PI * 2)
  ctx.fill()

  // Cochonnet
  ctx.fillStyle = '#FFD700'
  ctx.beginPath()
  ctx.arc(25, 25, 8, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function drawCertificateTitle(ctx: CanvasRenderingContext2D) {
  ctx.shadowColor = 'rgba(0, 0, 0, 0.2)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetY = 3
  ctx.fillStyle = '#1a1a1a'
  ctx.font = 'bold 72px "Inter", "Helvetica", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('CERTIFICAT', 600, 250)
  ctx.shadowBlur = 0

  ctx.font = '36px "Inter", "Helvetica", sans-serif'
  ctx.fillStyle = '#4a4a4a'
  ctx.fillText('DE REUSSITE', 600, 300)
}

function drawPositionBadge(ctx: CanvasRenderingContext2D, position: number) {
  const positionY = 380
  const colors = getPositionColor(position)

  // Medaille emoji
  ctx.font = '80px serif'
  ctx.fillText(position === 1 ? '🥇' : position === 2 ? '🥈' : '🥉', 600, positionY)

  // Texte position
  ctx.font = 'bold 48px "Inter", "Helvetica", sans-serif'
  const positionText = position === 1 ? 'CHAMPION' : position === 2 ? 'FINALISTE' : 'TROISIEME PLACE'

  const textGradient = ctx.createLinearGradient(400, positionY, 800, positionY)
  textGradient.addColorStop(0, colors.primary)
  textGradient.addColorStop(0.5, colors.secondary)
  textGradient.addColorStop(1, colors.primary)

  ctx.fillStyle = textGradient
  ctx.fillText(positionText, 600, positionY + 70)
}

function drawTeamName(ctx: CanvasRenderingContext2D, position: number, teamName: string) {
  const colors = getPositionColor(position)

  ctx.strokeStyle = colors.primary
  ctx.lineWidth = 3
  ctx.strokeRect(200, 480, 800, 80)

  ctx.font = 'bold 42px "Inter", "Helvetica", sans-serif'
  ctx.fillStyle = '#1a1a1a'
  ctx.fillText(teamName.toUpperCase(), 600, 530)
}

function drawTournamentDetails(ctx: CanvasRenderingContext2D, tournament: any) {
  ctx.font = '28px "Inter", "Helvetica", sans-serif'
  ctx.fillStyle = '#4a4a4a'
  ctx.fillText(tournament?.name || 'Tournoi de Petanque', 600, 610)

  if (tournament?.settings?.location) {
    ctx.font = '24px "Inter", "Helvetica", sans-serif'
    ctx.fillStyle = '#6a6a6a'
    ctx.fillText(`📍 ${tournament.settings.location}`, 600, 645)
  }

  ctx.font = '24px "Inter", "Helvetica", sans-serif'
  ctx.fillStyle = '#6a6a6a'
  const date = new Date(tournament?.settings?.date || new Date())
  const formattedDate = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  ctx.fillText(formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1), 600, 680)
}

function drawStats(ctx: CanvasRenderingContext2D, stats: { victories: number; pointsFor: number; pointsAgainst: number }) {
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)'
  ctx.lineWidth = 1
  ctx.strokeRect(350, 710, 500, 60)

  ctx.font = '20px "Inter", "Helvetica", sans-serif'
  ctx.fillStyle = '#6a6a6a'
  const statsText = `${stats.victories} victoires • ${stats.pointsFor} points marques • Difference: +${stats.pointsFor - stats.pointsAgainst}`
  ctx.fillText(statsText, 600, 745)
}

function drawSignature(ctx: CanvasRenderingContext2D) {
  ctx.font = 'italic 20px "Inter", "Helvetica", sans-serif'
  ctx.fillStyle = '#8a8a8a'
  ctx.fillText("Le Comite d'Organisation", 600, 800)

  ctx.beginPath()
  ctx.moveTo(450, 810)
  ctx.lineTo(750, 810)
  ctx.strokeStyle = '#cccccc'
  ctx.lineWidth = 1
  ctx.stroke()
}

function drawWatermark(ctx: CanvasRenderingContext2D) {
  ctx.save()
  ctx.globalAlpha = 0.03
  ctx.translate(600, 425)
  ctx.rotate(-Math.PI / 8)
  ctx.font = 'bold 120px "Inter", "Helvetica", sans-serif'
  ctx.fillStyle = '#000000'
  ctx.textAlign = 'center'
  ctx.fillText('PETANQUE', 0, 0)
  ctx.restore()
}
