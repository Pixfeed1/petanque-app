'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'

// Icônes premium
const Icons = {
  trophy: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v6m-3 0h6m4-13V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1H11a1 1 0 00-1 1v1.5a.5.5 0 01-.5.5H7a2 2 0 00-2 2v1c0 3.5 2.5 6 5.5 6.5m9 0c3-0.5 5.5-3 5.5-6.5V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1h-2" />
    </svg>
  ),
  plus: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  minus: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
    </svg>
  ),
  check: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  arrowLeft: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  flag: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
    </svg>
  ),
  sparkles: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  fire: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
    </svg>
  ),
  undo: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
  ),
  loader: (
    <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  save: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
    </svg>
  ),
  petanque: (
    <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="url(#metalGradient)" stroke="currentColor" strokeWidth="2"/>
      <circle cx="26" cy="24" r="3" fill="white" opacity="0.8"/>
      <circle cx="36" cy="36" r="2" fill="currentColor" opacity="0.3"/>
      <defs>
        <radialGradient id="metalGradient">
          <stop offset="0%" stopColor="#a8b2c3"/>
          <stop offset="100%" stopColor="#8e9aaf"/>
        </radialGradient>
      </defs>
    </svg>
  )
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
      const newScore = Math.max(0, Math.min(maxPoints, mancheScoreA + delta))
      setMancheScoreA(newScore)
    } else {
      const newScore = Math.max(0, Math.min(maxPoints, mancheScoreB + delta))
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

  const finishMatch = async (finalScoreA: number, finalScoreB: number, allManches: any[]) => {
    setSaving(true)
    try {
      // Gestion des égalités - ne devrait pas arriver en pétanque normale
      if (finalScoreA === finalScoreB) {
        alert('Erreur: Le match ne peut pas se terminer sur une égalité. Veuillez jouer une mène supplémentaire.')
        setSaving(false)
        return
      }

      const response = await fetch(`/api/matches/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          score_a: finalScoreA,
          score_b: finalScoreB,
          manches_json: allManches,
          status: 'termine',
          ended_at: new Date().toISOString()
          // validated_at sera défini par l'organisateur plus tard
        })
      })

      if (response.ok) {
        // Redirection immédiate
        router.push(`/tournoi/${match.tournoi.id}`)
      }
    } catch (error) {
      console.error('Erreur sauvegarde finale:', error)
      alert('Erreur lors de la sauvegarde du match')
    } finally {
      setSaving(false)
    }
  }

  const saveProgress = async (finalScoreA: number, finalScoreB: number, allManches: any[], isFinished: boolean) => {
    setSaving(true)
    try {
      const updateData: any = {
        score_a: finalScoreA,
        score_b: finalScoreB,
        manches_json: allManches,
        status: isFinished ? 'termine' : 'en_cours',
        updated_at: new Date().toISOString()
      }

      if (!match.started_at) {
        updateData.started_at = startTime?.toISOString()
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
                onClick={() => router.push(`/tournoi/${match.tournoi.id}`)}
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
              <p className="text-sm opacity-90 mb-2">Score total • Premier à 13 points</p>
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
                    style={{ width: `${(scoreA / 13) * 100}%` }}
                  />
                </div>
                <div className="flex-1 h-3 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-white rounded-full transition-all duration-500"
                    style={{ width: `${(scoreB / 13) * 100}%` }}
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
                    <div className="animate-bounce text-5xl">🏆</div>
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
                    <div className="animate-bounce text-5xl">🏆</div>
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
                          disabled={mancheScoreA === maxPoints}
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
                          disabled={mancheScoreB === maxPoints}
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