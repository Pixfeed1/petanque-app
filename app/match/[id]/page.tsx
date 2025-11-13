'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import type { Manche } from '@/lib/types'
import { Trophy, Plus, Minus, Check, Clock, ArrowLeft, Flag, Sparkles, Fire, Undo, Loader, Save, Petanque } from '@/components/Icons'

// Icônes premium
const Icons = {
  trophy: <Trophy className="w-6 h-6" />,
  plus: <Plus className="w-8 h-8" />,
  minus: <Minus className="w-8 h-8" />,
  check: <Check className="w-6 h-6" />,
  clock: <Clock className="w-5 h-5" />,
  arrowLeft: <ArrowLeft className="w-5 h-5" />,
  flag: <Flag className="w-6 h-6" />,
  sparkles: <Sparkles className="w-6 h-6" />,
  fire: <Fire className="w-8 h-8" />,
  undo: <Undo className="w-5 h-5" />,
  loader: <Loader className="animate-spin h-6 w-6" />,
  save: <Save className="w-6 h-6" />,
  petanque: <Petanque className="w-8 h-8" />
}

export default function MatchScorePage() {
  const router = useRouter()
  const params = useParams()
  const { user, organization } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [match, setMatch] = useState<any>(null)
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [manches, setManches] = useState<Array<{scoreA: number, scoreB: number}>>([])
  const [currentManche, setCurrentManche] = useState(1)
  const [mancheScoreA, setMancheScoreA] = useState(0)
  const [mancheScoreB, setMancheScoreB] = useState(0)
  const [winner, setWinner] = useState<'A' | 'B' | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)

  // Récupérer maxPoints depuis les settings du tournoi (défaut: 13)
  const maxPoints = match?.tournoi?.settings?.maxPoints || 13

  // Points maximum par mène selon le format (règles FIPJP officielles)
  const getMaxPointsPerManche = () => {
    const format = match?.tournoi?.format
    if (format === 'tete_a_tete') return 3  // 3 boules par joueur (max 3 points)
    if (format === 'doublette') return 6     // 6 boules total (3x2 = max 6 points)
    if (format === 'triplette') return 6     // 12 boules total (2x3x2 = max 6 points comptés)
    return 13 // Fallback
  }

  const maxPointsPerManche = getMaxPointsPerManche()

  useEffect(() => {
    setMounted(true)
    loadMatch()
    setStartTime(new Date())
  }, [params.id])

  // Timer
  useEffect(() => {
    if (startTime && !winner) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((new Date().getTime() - startTime.getTime()) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [startTime, winner])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const loadMatch = async () => {
    try {
      const response = await fetch(`/api/matches/${params.id}`, {
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
        }
        // Si le match est déjà terminé
        if (data.status === 'termine') {
          if (data.score_a === data.score_b) {
            console.error('Match terminé avec égalité - erreur de données')
          } else {
            setWinner(data.score_a > data.score_b ? 'A' : 'B')
          }
        }
      }
    } catch (error) {
      console.error('Erreur chargement match:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateScore = (team: 'A' | 'B', delta: number) => {
    if (team === 'A') {
      const newScore = Math.max(0, Math.min(maxPointsPerManche, mancheScoreA + delta))
      setMancheScoreA(newScore)
    } else {
      const newScore = Math.max(0, Math.min(maxPointsPerManche, mancheScoreB + delta))
      setMancheScoreB(newScore)
    }
  }

  const finishManche = async () => {
    if (mancheScoreA === 0 && mancheScoreB === 0) return

    const newManches = [...manches, { scoreA: mancheScoreA, scoreB: mancheScoreB }]
    setManches(newManches)

    const totalA = scoreA + mancheScoreA
    const totalB = scoreB + mancheScoreB

    setScoreA(totalA)
    setScoreB(totalB)

    // Vérifier si quelqu'un a gagné (maxPoints)
    if (totalA >= maxPoints || totalB >= maxPoints) {
      // Demander confirmation avant de terminer
      const winnerName = totalA >= maxPoints ? match.equipe_a?.name : match.equipe_b?.name
      if (confirm(`Terminer le match et déclarer ${winnerName} vainqueur ?`)) {
        setWinner(totalA >= maxPoints ? 'A' : 'B')
        await finishMatch(totalA, totalB, newManches)
      } else {
        // Annuler - retirer la dernière mène
        setManches(manches)
        setScoreA(scoreA)
        setScoreB(scoreB)
      }
    } else {
      // Sauvegarder la progression
      await saveProgress(totalA, totalB, newManches, false)
      // Prochaine mène
      setCurrentManche(currentManche + 1)
      setMancheScoreA(0)
      setMancheScoreB(0)
    }
  }

  const finishMatch = async (finalScoreA: number, finalScoreB: number, allManches: Manche[]) => {
    setSaving(true)
    try {
      // Gestion des égalités - ne devrait pas arriver en pétanque normale
      if (finalScoreA === finalScoreB) {
        alert('Erreur: Le match ne peut pas se terminer sur une égalité. Veuillez jouer une mène supplémentaire.')
        setSaving(false)
        return
      }

      // Double validation : le match passe en "en_attente_validation"
      // L'autre équipe devra confirmer le score
      const response = await fetch(`/api/matches/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          score_a: finalScoreA,
          score_b: finalScoreB,
          manches_json: allManches,
          status: 'en_attente_validation',
          ended_at: new Date().toISOString(),
          proposed_by: user?.id, // Qui a proposé le score
          proposed_at: new Date().toISOString()
        })
      })

      if (response.ok) {
        alert('Score enregistré ! L\'équipe adverse doit maintenant confirmer le résultat.')
        // Redirection vers le tournoi
        if (match?.tournoi?.id) {
          router.push(`/tournoi/${match.tournoi.id}`)
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde finale:', error)
      alert('Erreur lors de la sauvegarde du match')
    } finally {
      setSaving(false)
    }
  }

  const saveProgress = async (finalScoreA: number, finalScoreB: number, allManches: Manche[], isFinished: boolean) => {
    setSaving(true)
    try {
      const updateData: Partial<{
        score_a: number
        score_b: number
        manches_json: Manche[]
        status: string
        updated_at: string
        started_at?: string
        ended_at?: string
        validated_at?: string
        winner_id?: string
      }> = {
        score_a: finalScoreA,
        score_b: finalScoreB,
        manches_json: allManches,
        status: isFinished ? 'termine' : 'en_cours',
        updated_at: new Date().toISOString()
      }

      if (!match.started_at) {
        // Utiliser startTime ou now() comme fallback si startTime est null
        updateData.started_at = startTime ? startTime.toISOString() : new Date().toISOString()
      }

      if (isFinished) {
        updateData.ended_at = new Date().toISOString()
        updateData.validated_at = new Date().toISOString()
      }

      const response = await fetch(`/api/matches/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        console.error('Erreur sauvegarde')
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
    } finally {
      setSaving(false)
    }
  }

  const undoLastManche = () => {
    if (manches.length > 0 && !winner) {
      const newManches = [...manches]
      const lastManche = newManches.pop()
      if (lastManche) {
        setScoreA(scoreA - lastManche.scoreA)
        setScoreB(scoreB - lastManche.scoreB)
        setManches(newManches)
        setCurrentManche(currentManche - 1)
        setMancheScoreA(0)
        setMancheScoreB(0)
        // Sauvegarder après annulation
        saveProgress(scoreA - lastManche.scoreA, scoreB - lastManche.scoreB, newManches, false)
      }
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
              <p className="mt-4 text-lg font-medium text-gray-600">Chargement du match...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-4">Match introuvable</p>
          <button 
            onClick={() => router.push('/dashboard')}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl hover:shadow-2xl transition-all transform hover:scale-105"
          >
            Retour au dashboard
          </button>
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
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => match?.tournoi?.id && router.push(`/tournoi/${match.tournoi.id}`)}
                className="group flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all"
              >
                {Icons.arrowLeft}
                <span className="font-medium">Retour au tournoi</span>
              </button>
              
              <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
              
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
                  {Icons.petanque}
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Match • Tour {match.tour} • Terrain {match.terrain || '?'}
                  </h1>
                  <p className="text-sm text-gray-500">{match.tournoi?.name}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-6">
              {/* Timer */}
              <div className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-xl">
                {Icons.clock}
                <span className="font-mono font-bold text-lg">{formatTime(elapsedTime)}</span>
              </div>

              {/* Mène actuelle */}
              {!winner && (
                <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl">
                  <span className="text-sm text-gray-600">Mène</span>
                  <span className="ml-2 font-bold text-lg text-green-700">{currentManche}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Carte principale du match */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
          {/* Barre de score en haut */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
            <div className="text-center text-white">
              <p className="text-sm opacity-90 mb-2">Score total • Premier à {maxPoints} points</p>
              <div className="flex items-center justify-center space-x-8">
                <span className="text-5xl font-bold">{scoreA}</span>
                <span className="text-3xl opacity-70">-</span>
                <span className="text-5xl font-bold">{scoreB}</span>
              </div>
              
              {/* Barres de progression */}
              <div className="flex space-x-2 mt-4">
                <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${(scoreA / maxPoints) * 100}%` }}
                  />
                </div>
                <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${(scoreB / maxPoints) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Zone principale : Équipes côte à côte avec gros VS */}
          <div className="p-8">
            <div className="grid grid-cols-5 gap-4 items-center">
              {/* Équipe A - Gauche */}
              <div className="col-span-2">
                <div className={`p-6 rounded-2xl text-center transition-all ${
                  winner === 'A' 
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 scale-105 shadow-2xl' 
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50'
                }`}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {match.equipe_a?.name}
                  </h2>
                  
                  <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full font-bold text-6xl mb-4 transition-all ${
                    winner === 'A' 
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-2xl animate-pulse' 
                      : 'bg-gradient-to-br from-blue-100 to-indigo-200 text-blue-900'
                  }`}>
                    {scoreA}
                  </div>
                  
                  {winner === 'A' && (
                    <div className="animate-bounce">
                      <Trophy className="w-16 h-16 text-yellow-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* VS au centre - Plus gros */}
              <div className="col-span-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full blur-2xl opacity-20"></div>
                  <div className="relative bg-white rounded-full p-8 shadow-2xl text-center">
                    <span className="text-5xl font-black bg-gradient-to-br from-gray-600 to-gray-800 bg-clip-text text-transparent">VS</span>
                  </div>
                </div>
              </div>

              {/* Équipe B - Droite */}
              <div className="col-span-2">
                <div className={`p-6 rounded-2xl text-center transition-all ${
                  winner === 'B' 
                    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 scale-105 shadow-2xl' 
                    : 'bg-gradient-to-br from-green-50 to-emerald-50'
                }`}>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    {match.equipe_b?.name}
                  </h2>
                  
                  <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full font-bold text-6xl mb-4 transition-all ${
                    winner === 'B' 
                      ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-2xl animate-pulse' 
                      : 'bg-gradient-to-br from-green-100 to-emerald-200 text-green-900'
                  }`}>
                    {scoreB}
                  </div>
                  
                  {winner === 'B' && (
                    <div className="animate-bounce">
                      <Trophy className="w-16 h-16 text-yellow-500" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Zone de saisie des points */}
            {!winner && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 mt-8">
                <h3 className="text-center text-xl font-bold text-gray-700 mb-6">
                  Points de la mène {currentManche}
                </h3>
                
                <div className="grid grid-cols-5 gap-4 items-center">
                  {/* Contrôles Équipe A */}
                  <div className="col-span-2 text-center">
                    <div className="bg-white rounded-2xl p-4 shadow-lg">
                      <div className="text-5xl font-bold text-blue-900 mb-4">
                        {mancheScoreA}
                      </div>
                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={() => updateScore('A', -1)}
                          className="p-4 bg-white hover:bg-red-50 rounded-2xl shadow-lg hover:shadow-xl transition-all group hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={mancheScoreA === 0}
                        >
                          <span className="text-red-500 group-hover:scale-110 transition-transform block">
                            {Icons.minus}
                          </span>
                        </button>
                        <button
                          onClick={() => updateScore('A', 1)}
                          className="p-4 bg-white hover:bg-green-50 rounded-2xl shadow-lg hover:shadow-xl transition-all group hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={mancheScoreA === maxPointsPerManche}
                        >
                          <span className="text-green-500 group-hover:scale-110 transition-transform block">
                            {Icons.plus}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Espace central */}
                  <div className="col-span-1"></div>

                  {/* Contrôles Équipe B */}
                  <div className="col-span-2 text-center">
                    <div className="bg-white rounded-2xl p-4 shadow-lg">
                      <div className="text-5xl font-bold text-green-900 mb-4">
                        {mancheScoreB}
                      </div>
                      <div className="flex justify-center space-x-3">
                        <button
                          onClick={() => updateScore('B', -1)}
                          className="p-4 bg-white hover:bg-red-50 rounded-2xl shadow-lg hover:shadow-xl transition-all group hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={mancheScoreB === 0}
                        >
                          <span className="text-red-500 group-hover:scale-110 transition-transform block">
                            {Icons.minus}
                          </span>
                        </button>
                        <button
                          onClick={() => updateScore('B', 1)}
                          className="p-4 bg-white hover:bg-green-50 rounded-2xl shadow-lg hover:shadow-xl transition-all group hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
                          disabled={mancheScoreB === maxPointsPerManche}
                        >
                          <span className="text-green-500 group-hover:scale-110 transition-transform block">
                            {Icons.plus}
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bouton valider la mène */}
                <div className="mt-8 text-center">
                  <button
                    onClick={finishManche}
                    disabled={(mancheScoreA === 0 && mancheScoreB === 0) || saving}
                    className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                  >
                    {saving ? (
                      <>
                        {Icons.loader}
                        <span className="ml-2">Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        {Icons.check}
                        <span className="ml-2">Valider la mène {currentManche}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Message de victoire */}
            {winner && (
              <div className="mt-8 text-center">
                <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 rounded-3xl p-8 shadow-2xl">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Victoire de {winner === 'A' ? match.equipe_a?.name : match.equipe_b?.name} !
                  </h2>
                  <p className="text-white/90 text-xl">
                    Score final : {scoreA} - {scoreB}
                  </p>
                  <p className="text-white/80 text-sm mt-4">
                    Match terminé en {formatTime(elapsedTime)}
                  </p>
                  {saving && (
                    <div className="mt-4 flex items-center justify-center text-white">
                      {Icons.loader}
                      <span className="ml-2">Retour au tournoi...</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Historique des mènes */}
            {manches.length > 0 && (
              <div className="mt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-700">Détail des mènes</h3>
                  {!winner && manches.length > 0 && (
                    <button
                      onClick={undoLastManche}
                      className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
                    >
                      {Icons.undo}
                      <span className="ml-2">Annuler dernière mène</span>
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {manches.map((manche, index) => (
                    <div key={index} className="bg-white rounded-xl p-3 shadow-md hover:shadow-lg transition-all">
                      <p className="text-xs text-gray-500 mb-1 text-center">Mène {index + 1}</p>
                      <div className="flex justify-around items-center text-lg font-bold">
                        <span className={manche.scoreA > manche.scoreB ? 'text-blue-600' : 'text-gray-600'}>
                          {manche.scoreA}
                        </span>
                        <span className="text-gray-400">-</span>
                        <span className={manche.scoreB > manche.scoreA ? 'text-green-600' : 'text-gray-600'}>
                          {manche.scoreB}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bouton de sauvegarde flottant */}
        {!winner && manches.length > 0 && (
          <div className="fixed bottom-8 right-8">
            <button
              onClick={() => saveProgress(scoreA, scoreB, manches, false)}
              disabled={saving}
              className="group p-4 bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-110"
              title="Sauvegarder la progression"
            >
              {saving ? Icons.loader : Icons.save}
              <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Sauvegarder la progression
              </span>
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
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
      `}</style>
    </div>
  )
}