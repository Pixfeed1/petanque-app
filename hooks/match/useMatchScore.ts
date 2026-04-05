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
    }
  }
}

interface UseMatchScoreProps {
  matchId: string | string[] | undefined
  onSuccess?: (message: string) => void
  onError?: (message: string) => void
  onWarning?: (message: string) => void
  onConfirm?: (options: { title: string; message: string; confirmText?: string; cancelText?: string; variant?: 'danger' | 'warning' | 'default' }) => Promise<boolean>
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
  winner: 'A' | 'B' | null
  elapsedTime: number

  // Computed
  maxPoints: number
  maxPointsPerManche: number

  // Actions
  updateScore: (team: 'A' | 'B', delta: number) => void
  finishManche: () => Promise<void>
  undoLastManche: () => void
  saveProgress: (finalScoreA: number, finalScoreB: number, allManches: Manche[], isFinished: boolean) => Promise<void>

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
  const [winner, setWinner] = useState<'A' | 'B' | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Computed
  const maxPoints = match?.tournoi?.settings?.maxPoints || 13

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
        setScoreA(data.score_a || 0)
        setScoreB(data.score_b || 0)
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
          setWinner(data.score_a > data.score_b ? 'A' : 'B')
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

  // Finish match
  const finishMatch = useCallback(async (finalScoreA: number, finalScoreB: number, allManches: Manche[]) => {
    setSaving(true)
    try {
      if (finalScoreA === finalScoreB) {
        notify.error('Le match ne peut pas se terminer sur une égalité.')
        return
      }

      const timeLimit = match?.tournoi?.settings?.timeLimit === true
      if (finalScoreA < maxPoints && finalScoreB < maxPoints && !timeLimit) {
        notify.error(`Le match doit se terminer quand une équipe atteint ${maxPoints} points.`)
        return
      }

      const winnerId = finalScoreA > finalScoreB ? match?.equipe_a_id : match?.equipe_b_id

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
        notify.success('Match terminé !')
        if (match?.tournoi?.id) {
          router.push(`/tournoi/${match.tournoi.id}`)
        }
      }
    } catch (error) {
      console.error('Erreur finale:', error)
      notify.error('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }, [matchId, match, maxPoints, router])

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
        ? await onConfirm({ title: 'Fin du match', message: `Terminer et déclarer ${winnerName} vainqueur ?` })
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
    updateScore,
    finishManche,
    undoLastManche,
    saveProgress,
    formatTime
  }
}

export default useMatchScore
