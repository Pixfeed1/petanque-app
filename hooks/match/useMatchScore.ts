/**
 * Hook pour la gestion du scoring d'un match
 * - Chargement du match
 * - Gestion des scores et mènes
 * - Timer
 * - Sauvegarde
 */

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { Manche } from '@/lib/types'

interface Match {
  id: string
  equipe_a: { id: string; name: string } | null
  equipe_b: { id: string; name: string } | null
  equipe_a_id: string
  equipe_b_id: string
  score_a: number
  score_b: number
  status: string
  tour: number
  terrain: number | null
  manches_json: Manche[] | null
  started_at: string | null
  tournoi?: {
    id: string
    name: string
    format: string
    settings?: {
      maxPoints?: number
      timeLimit?: boolean
      timeLimitMinutes?: number
    }
  }
}

interface UseMatchScoreProps {
  matchId: string | string[] | undefined
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
  onWarning?: (message: string) => void
  onConfirm?: (message: string) => Promise<boolean>
}

interface UseMatchScoreReturn {
  // State
  match: Match | null
  loading: boolean
  saving: boolean
  scoreA: number
  scoreB: number
  manches: Manche[]
  currentManche: number
  mancheScoreA: number
  mancheScoreB: number
  winner: 'A' | 'B' | 'draw' | null
  elapsedTime: number

  // Computed
  maxPoints: number
  maxPointsPerManche: number
  timeLimit: boolean
  timeLimitMinutes: number
  isTimeLimitReached: boolean

  // Actions
  updateScore: (team: 'A' | 'B', delta: number) => void
  finishManche: () => Promise<void>
  undoLastManche: () => void
  saveProgress: (finalScoreA: number, finalScoreB: number, allManches: Manche[], isFinished: boolean) => Promise<void>
  finishByTimeLimit: () => Promise<void>
  declareForfeit: (forfeitingTeam: 'A' | 'B') => Promise<void>

  // Helpers
  formatTime: (seconds: number) => string
}

export function useMatchScore({
  matchId,
  onSuccess,
  onError,
  onWarning,
  onConfirm
}: UseMatchScoreProps): UseMatchScoreReturn {
  const router = useRouter()

  // Système de notification avec fallback
  const notify = {
    success: (msg: string) => onSuccess ? onSuccess(msg) : console.log(msg),
    error: (msg: string) => onError ? onError(msg) : console.error(msg),
    warning: (msg: string) => onWarning ? onWarning(msg) : console.warn(msg)
  }

  // State
  const [match, setMatch] = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [manches, setManches] = useState<Manche[]>([])
  const [currentManche, setCurrentManche] = useState(1)
  const [mancheScoreA, setMancheScoreA] = useState(0)
  const [mancheScoreB, setMancheScoreB] = useState(0)
  const [winner, setWinner] = useState<'A' | 'B' | 'draw' | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Computed
  const maxPoints = match?.tournoi?.settings?.maxPoints || 13
  const timeLimit = match?.tournoi?.settings?.timeLimit || false
  const timeLimitMinutes = match?.tournoi?.settings?.timeLimitMinutes || 60
  const isTimeLimitReached = timeLimit && elapsedTime >= timeLimitMinutes * 60

  const maxPointsPerManche = (() => {
    const format = match?.tournoi?.format
    if (format === 'tete_a_tete') return 3
    if (format === 'doublette') return 6
    if (format === 'triplette') return 6
    return 13
  })()

  // Timer
  useEffect(() => {
    if (startTime && !winner) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [startTime, winner])

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  // Load match
  const loadMatch = useCallback(async () => {
    if (!matchId) return

    try {
      const response = await fetch(`/api/matches/${matchId}`, {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Erreur chargement match')
      const data = await response.json()

      if (data) {
        setMatch(data)
        setScoreA(data.score_a ?? 0)
        setScoreB(data.score_b ?? 0)
        if (data.manches_json && Array.isArray(data.manches_json)) {
          setManches(data.manches_json)
          setCurrentManche(data.manches_json.length + 1)
        }
        if (data.status === 'en_cours' && data.started_at) {
          setStartTime(new Date(data.started_at))
        } else {
          setStartTime(new Date())
        }
        if (data.status === 'termine') {
          // 🔧 FIX: Gérer les égalités (match nul en mode timeLimit)
          if (data.score_a > data.score_b) {
            setWinner('A')
          } else if (data.score_a < data.score_b) {
            setWinner('B')
          } else {
            setWinner('draw')
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement match:', error)
    } finally {
      setLoading(false)
    }
  }, [matchId])

  useEffect(() => {
    loadMatch()
  }, [loadMatch])

  // Update score
  const updateScore = useCallback((team: 'A' | 'B', delta: number) => {
    if (team === 'A') {
      setMancheScoreA(prev => Math.max(0, Math.min(maxPointsPerManche, prev + delta)))
    } else {
      setMancheScoreB(prev => Math.max(0, Math.min(maxPointsPerManche, prev + delta)))
    }
  }, [maxPointsPerManche])

  // Save progress
  const saveProgress = useCallback(async (
    finalScoreA: number,
    finalScoreB: number,
    allManches: Manche[],
    isFinished: boolean
  ) => {
    setSaving(true)
    try {
      const updateData: Record<string, unknown> = {
        score_a: finalScoreA,
        score_b: finalScoreB,
        manches_json: allManches,
        status: isFinished ? 'termine' : 'en_cours',
        updated_at: new Date().toISOString()
      }

      if (!match?.started_at) {
        updateData.started_at = startTime?.toISOString() || new Date().toISOString()
      }

      if (isFinished) {
        updateData.ended_at = new Date().toISOString()
        updateData.validated_at = new Date().toISOString()
      }

      await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData)
      })
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
    } finally {
      setSaving(false)
    }
  }, [matchId, match?.started_at, startTime])

  // Finish match (avec ou sans égalité selon timeLimit)
  const finishMatch = useCallback(async (
    finalScoreA: number,
    finalScoreB: number,
    allManches: Manche[],
    byTimeLimit: boolean = false
  ) => {
    setSaving(true)
    try {
      // Identifier les matchs BYE (pas d'équipe B)
      const isByeMatch = !match?.equipe_b_id

      // Les matchs BYE ne devraient pas être terminés manuellement
      if (isByeMatch) {
        notify.error('Les matchs BYE sont validés automatiquement.')
        setSaving(false)
        return
      }

      // Vérifier les conditions de fin selon le mode
      if (finalScoreA === finalScoreB && !byTimeLimit) {
        notify.error('Le match ne peut pas se terminer sur une égalité.')
        return
      }

      if (!byTimeLimit && finalScoreA < maxPoints && finalScoreB < maxPoints) {
        notify.error(`Le match doit se terminer quand une équipe atteint ${maxPoints} points.`)
        return
      }

      // Déterminer le gagnant (null si égalité en mode timeLimit)
      let winnerId: string | null = null
      if (finalScoreA !== finalScoreB) {
        winnerId = finalScoreA > finalScoreB ? match?.equipe_a_id || null : match?.equipe_b_id || null
      }

      const response = await fetch(`/api/matches/${matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          score_a: finalScoreA,
          score_b: finalScoreB,
          manches_json: allManches,
          status: 'termine',
          winner_id: winnerId,
          ended_at: new Date().toISOString(),
          validated_at: new Date().toISOString()
        })
      })

      if (response.ok) {
        const resultMessage = finalScoreA === finalScoreB
          ? 'Match nul !'
          : 'Match terminé !'
        notify.success(resultMessage)
        if (match?.tournoi?.id) {
          router.push(`/tournoi/${match.tournoi.id}`)
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
        notify.error(errorData.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur finale:', error)
      notify.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }, [matchId, match, maxPoints, router])

  // Finish match by time limit (permet égalité)
  const finishByTimeLimit = useCallback(async () => {
    if (!timeLimit) {
      notify.error('La limite de temps n\'est pas activée pour ce tournoi')
      return
    }

    const message = scoreA === scoreB
      ? `Terminer le match en égalité (${scoreA}-${scoreB}) ?`
      : `Terminer le match avec le score actuel (${scoreA}-${scoreB}) ?`

    const confirmed = onConfirm
      ? await onConfirm(message)
      : window.confirm(message)

    if (confirmed) {
      if (scoreA === scoreB) {
        setWinner('draw')
      } else {
        setWinner(scoreA > scoreB ? 'A' : 'B')
      }
      await finishMatch(scoreA, scoreB, manches, true)
    }
  }, [timeLimit, scoreA, scoreB, manches, finishMatch, onConfirm])

  // Declare forfeit - l'équipe qui déclare forfait perd 0-13 (ou maxPoints)
  const declareForfeit = useCallback(async (forfeitingTeam: 'A' | 'B') => {
    const forfeitingName = forfeitingTeam === 'A' ? match?.equipe_a?.name : match?.equipe_b?.name
    const winnerName = forfeitingTeam === 'A' ? match?.equipe_b?.name : match?.equipe_a?.name

    const message = `Déclarer forfait pour ${forfeitingName} ? ${winnerName} gagnera ${maxPoints}-0.`

    const confirmed = onConfirm
      ? await onConfirm(message)
      : window.confirm(message)

    if (confirmed) {
      setSaving(true)
      try {
        // Score: équipe qui forfait = 0, équipe gagnante = maxPoints
        const finalScoreA = forfeitingTeam === 'A' ? 0 : maxPoints
        const finalScoreB = forfeitingTeam === 'B' ? 0 : maxPoints
        const winnerId = forfeitingTeam === 'A' ? match?.equipe_b_id : match?.equipe_a_id

        const response = await fetch(`/api/matches/${matchId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            score_a: finalScoreA,
            score_b: finalScoreB,
            manches_json: [], // Forfait = pas de mènes jouées
            status: 'termine',
            winner_id: winnerId,
            forfeit: true,
            forfeit_team: forfeitingTeam,
            ended_at: new Date().toISOString(),
            validated_at: new Date().toISOString()
          })
        })

        if (response.ok) {
          setWinner(forfeitingTeam === 'A' ? 'B' : 'A')
          setScoreA(finalScoreA)
          setScoreB(finalScoreB)
          notify.success(`Forfait déclaré. ${winnerName} remporte le match.`)
          if (match?.tournoi?.id) {
            router.push(`/tournoi/${match.tournoi.id}`)
          }
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Erreur inconnue' }))
          notify.error(errorData.error || 'Erreur lors de la déclaration du forfait')
        }
      } catch (error) {
        console.error('Erreur forfait:', error)
        notify.error('Erreur lors de la déclaration du forfait')
      } finally {
        setSaving(false)
      }
    }
  }, [matchId, match, maxPoints, router, onConfirm])

  // Finish manche
  const finishManche = useCallback(async () => {
    if (mancheScoreA === 0 && mancheScoreB === 0) {
      notify.warning('Vous devez saisir le score de la mène.')
      return
    }

    if (mancheScoreA > 0 && mancheScoreB > 0) {
      notify.error('En pétanque, une seule équipe marque par mène.')
      return
    }

    const newManches = [...manches, { scoreA: mancheScoreA, scoreB: mancheScoreB }]
    setManches(newManches)

    const totalA = scoreA + mancheScoreA
    const totalB = scoreB + mancheScoreB

    setScoreA(totalA)
    setScoreB(totalB)

    if (totalA >= maxPoints || totalB >= maxPoints) {
      const winnerName = totalA >= maxPoints ? match?.equipe_a?.name : match?.equipe_b?.name
      const confirmed = onConfirm
        ? await onConfirm(`Terminer et déclarer ${winnerName} vainqueur ?`)
        : window.confirm(`Terminer et déclarer ${winnerName} vainqueur ?`)

      if (confirmed) {
        setWinner(totalA >= maxPoints ? 'A' : 'B')
        await finishMatch(totalA, totalB, newManches)
      } else {
        setManches(manches)
        setScoreA(scoreA)
        setScoreB(scoreB)
      }
    } else {
      await saveProgress(totalA, totalB, newManches, false)
      setCurrentManche(prev => prev + 1)
      setMancheScoreA(0)
      setMancheScoreB(0)
    }
  }, [mancheScoreA, mancheScoreB, manches, scoreA, scoreB, maxPoints, match, finishMatch, saveProgress, onConfirm])

  // Undo last manche
  const undoLastManche = useCallback(() => {
    if (manches.length > 0 && !winner) {
      const newManches = [...manches]
      const lastManche = newManches.pop()
      if (lastManche) {
        const newScoreA = scoreA - lastManche.scoreA
        const newScoreB = scoreB - lastManche.scoreB
        setScoreA(newScoreA)
        setScoreB(newScoreB)
        setManches(newManches)
        setCurrentManche(prev => prev - 1)
        setMancheScoreA(0)
        setMancheScoreB(0)
        saveProgress(newScoreA, newScoreB, newManches, false)
      }
    }
  }, [manches, winner, scoreA, scoreB, saveProgress])

  return {
    match,
    loading,
    saving,
    scoreA,
    scoreB,
    manches,
    currentManche,
    mancheScoreA,
    mancheScoreB,
    winner,
    elapsedTime,
    maxPoints,
    maxPointsPerManche,
    timeLimit,
    timeLimitMinutes,
    isTimeLimitReached,
    updateScore,
    finishManche,
    undoLastManche,
    saveProgress,
    finishByTimeLimit,
    declareForfeit,
    formatTime
  }
}

export default useMatchScore
