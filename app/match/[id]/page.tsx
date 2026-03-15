'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useMatchScore } from '@/hooks/match'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import {
  Trophy, Plus, Minus, Check, Clock, ArrowLeft,
  Undo, Loader, Save, Petanque
} from '@/components/Icons'

/**
 * Page de scoring d'un match de pétanque
 * - Affichage des équipes et scores
 * - Saisie des points par mène
 * - Timer
 * - Historique des mènes
 */
export default function MatchScorePage() {
  const router = useRouter()
  const params = useParams()
  const [mounted, setMounted] = useState(false)
  const { showSuccess, showError, showWarning } = useToast()
  const { confirm, ConfirmModal } = useConfirm()

  // Hook principal pour la gestion du match
  const {
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
  } = useMatchScore({
    matchId: params?.id,
    onSuccess: showSuccess,
    onError: showError,
    onWarning: showWarning,
    onConfirm: confirm
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-12 shadow-2xl">
              <Loader className="animate-spin h-6 w-6" />
              <p className="mt-4 text-lg font-medium text-gray-600">Chargement du match...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Match not found
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
      <AnimatedBackground />

      {/* Header */}
      <MatchHeader
        match={match}
        elapsedTime={elapsedTime}
        formatTime={formatTime}
        currentManche={currentManche}
        winner={winner}
        onBack={() => match?.tournoi?.id && router.push(`/tournoi/${match.tournoi.id}`)}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Carte principale du match */}
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-8">
          {/* Barre de score en haut */}
          <ScoreHeader scoreA={scoreA} scoreB={scoreB} maxPoints={maxPoints} />

          {/* Zone principale */}
          <div className="p-4 sm:p-8">
            {/* Équipes */}
            <TeamsDisplay
              match={match}
              scoreA={scoreA}
              scoreB={scoreB}
              winner={winner}
            />

            {/* Zone de saisie des points */}
            {!winner && (
              <ScoreInput
                match={match}
                currentManche={currentManche}
                mancheScoreA={mancheScoreA}
                mancheScoreB={mancheScoreB}
                maxPointsPerManche={maxPointsPerManche}
                saving={saving}
                updateScore={updateScore}
                finishManche={finishManche}
              />
            )}

            {/* Message de victoire */}
            {winner && (
              <VictoryMessage
                match={match}
                winner={winner}
                scoreA={scoreA}
                scoreB={scoreB}
                elapsedTime={elapsedTime}
                formatTime={formatTime}
                saving={saving}
              />
            )}

            {/* Historique des mènes */}
            {manches.length > 0 && (
              <ManchesHistory
                manches={manches}
                winner={winner}
                undoLastManche={undoLastManche}
              />
            )}
          </div>
        </div>

        {/* Bouton de sauvegarde flottant */}
        {!winner && manches.length > 0 && (
          <FloatingSaveButton
            saving={saving}
            onSave={() => saveProgress(scoreA, scoreB, manches, false)}
          />
        )}
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>

      {ConfirmModal}
    </div>
  )
}

// ============================================================================
// Composants internes
// ============================================================================

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-300 to-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-40 right-40 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
  )
}

interface MatchHeaderProps {
  match: any
  elapsedTime: number
  formatTime: (s: number) => string
  currentManche: number
  winner: 'A' | 'B' | null
  onBack: () => void
}

function MatchHeader({ match, elapsedTime, formatTime, currentManche, winner, onBack }: MatchHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          {/* Section gauche */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
            <button
              onClick={onBack}
              className="group flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium hidden sm:inline">Retour</span>
            </button>

            <div className="hidden md:block h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent flex-shrink-0"></div>

            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl text-white flex-shrink-0">
                <Petanque className="w-4 h-4 sm:w-8 sm:h-8" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm sm:text-xl font-bold text-gray-900 truncate">
                  <span className="hidden sm:inline">Match - </span>T{match.tour}<span className="hidden sm:inline"> - Terrain</span><span className="sm:hidden"> T</span>{match.terrain || '?'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 truncate">{match.tournoi?.name}</p>
              </div>
            </div>
          </div>

          {/* Section droite */}
          <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6 flex-shrink-0">
            {/* Timer */}
            <div className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-gray-100 rounded-lg sm:rounded-xl">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-mono font-bold text-sm sm:text-lg">{formatTime(elapsedTime)}</span>
            </div>

            {/* Mène actuelle */}
            {!winner && (
              <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-lg sm:rounded-xl">
                <span className="text-xs sm:text-sm text-gray-600 hidden sm:inline">Mène </span>
                <span className="sm:ml-2 font-bold text-sm sm:text-lg text-green-700">{currentManche}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

interface ScoreHeaderProps {
  scoreA: number
  scoreB: number
  maxPoints: number
}

function ScoreHeader({ scoreA, scoreB, maxPoints }: ScoreHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
      <div className="text-center text-white">
        <p className="text-sm opacity-90 mb-2">Score total - Premier a {maxPoints} points</p>
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
  )
}

interface TeamsDisplayProps {
  match: any
  scoreA: number
  scoreB: number
  winner: 'A' | 'B' | null
}

function TeamsDisplay({ match, scoreA, scoreB, winner }: TeamsDisplayProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
      {/* Équipe A */}
      <div className="md:col-span-2">
        <TeamCard
          name={match.equipe_a?.name}
          score={scoreA}
          isWinner={winner === 'A'}
          colorScheme="blue"
        />
      </div>

      {/* VS au centre */}
      <div className="md:col-span-1 flex justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full blur-2xl opacity-20"></div>
          <div className="relative bg-white rounded-full p-4 sm:p-8 shadow-2xl text-center">
            <span className="text-3xl sm:text-5xl font-black bg-gradient-to-br from-gray-600 to-gray-800 bg-clip-text text-transparent">VS</span>
          </div>
        </div>
      </div>

      {/* Équipe B */}
      <div className="md:col-span-2">
        <TeamCard
          name={match.equipe_b?.name}
          score={scoreB}
          isWinner={winner === 'B'}
          colorScheme="green"
        />
      </div>
    </div>
  )
}

interface TeamCardProps {
  name: string
  score: number
  isWinner: boolean
  colorScheme: 'blue' | 'green'
}

function TeamCard({ name, score, isWinner, colorScheme }: TeamCardProps) {
  const bgClass = isWinner
    ? 'bg-gradient-to-br from-yellow-50 to-orange-50 scale-105 shadow-2xl'
    : colorScheme === 'blue'
      ? 'bg-gradient-to-br from-blue-50 to-indigo-50'
      : 'bg-gradient-to-br from-green-50 to-emerald-50'

  const scoreClass = isWinner
    ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-2xl animate-pulse'
    : colorScheme === 'blue'
      ? 'bg-gradient-to-br from-blue-100 to-indigo-200 text-blue-900'
      : 'bg-gradient-to-br from-green-100 to-emerald-200 text-green-900'

  return (
    <div className={`p-4 sm:p-6 rounded-2xl text-center transition-all ${bgClass}`}>
      <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">{name}</h2>
      <div className={`inline-flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 rounded-full font-bold text-5xl sm:text-6xl mb-3 sm:mb-4 transition-all ${scoreClass}`}>
        {score}
      </div>
      {isWinner && (
        <div className="animate-bounce">
          <Trophy className="w-12 h-12 sm:w-16 sm:h-16 text-yellow-500 mx-auto" />
        </div>
      )}
    </div>
  )
}

interface ScoreInputProps {
  match: any
  currentManche: number
  mancheScoreA: number
  mancheScoreB: number
  maxPointsPerManche: number
  saving: boolean
  updateScore: (team: 'A' | 'B', delta: number) => void
  finishManche: () => Promise<void>
}

function ScoreInput({
  match, currentManche, mancheScoreA, mancheScoreB,
  maxPointsPerManche, saving, updateScore, finishManche
}: ScoreInputProps) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 sm:p-6 mt-6 sm:mt-8">
      <h3 className="text-center text-lg sm:text-xl font-bold text-gray-700 mb-4 sm:mb-6">
        Points de la mene {currentManche}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* Contrôles Équipe A */}
        <div className="md:col-span-2 text-center">
          <p className="text-sm font-semibold text-blue-800 mb-2 md:hidden">{match.equipe_a?.name}</p>
          <ScoreControls
            score={mancheScoreA}
            maxScore={maxPointsPerManche}
            colorScheme="blue"
            onUpdate={(delta) => updateScore('A', delta)}
          />
        </div>

        {/* Espace central */}
        <div className="hidden md:block md:col-span-1"></div>

        {/* Contrôles Équipe B */}
        <div className="md:col-span-2 text-center">
          <p className="text-sm font-semibold text-green-800 mb-2 md:hidden">{match.equipe_b?.name}</p>
          <ScoreControls
            score={mancheScoreB}
            maxScore={maxPointsPerManche}
            colorScheme="green"
            onUpdate={(delta) => updateScore('B', delta)}
          />
        </div>
      </div>

      {/* Bouton valider */}
      <div className="mt-8 text-center">
        <button
          onClick={finishManche}
          disabled={(mancheScoreA === 0 && mancheScoreB === 0) || saving}
          className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
        >
          {saving ? (
            <>
              <Loader className="animate-spin h-6 w-6" />
              <span className="ml-2">Enregistrement...</span>
            </>
          ) : (
            <>
              <Check className="w-6 h-6" />
              <span className="ml-2">Valider la mene {currentManche}</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}

interface ScoreControlsProps {
  score: number
  maxScore: number
  colorScheme: 'blue' | 'green'
  onUpdate: (delta: number) => void
}

function ScoreControls({ score, maxScore, colorScheme, onUpdate }: ScoreControlsProps) {
  const textClass = colorScheme === 'blue' ? 'text-blue-900' : 'text-green-900'

  return (
    <div className="bg-white rounded-2xl p-4 shadow-lg">
      <div className={`text-4xl sm:text-5xl font-bold ${textClass} mb-4`}>
        {score}
      </div>
      <div className="flex justify-center space-x-3">
        <button
          onClick={() => onUpdate(-1)}
          className="p-3 sm:p-4 bg-white hover:bg-red-50 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all group hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={score === 0}
        >
          <Minus className="w-6 h-6 sm:w-8 sm:h-8 text-red-500" />
        </button>
        <button
          onClick={() => onUpdate(1)}
          className="p-3 sm:p-4 bg-white hover:bg-green-50 rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all group hover:scale-110 disabled:opacity-30 disabled:cursor-not-allowed"
          disabled={score === maxScore}
        >
          <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
        </button>
      </div>
    </div>
  )
}

interface VictoryMessageProps {
  match: any
  winner: 'A' | 'B'
  scoreA: number
  scoreB: number
  elapsedTime: number
  formatTime: (s: number) => string
  saving: boolean
}

function VictoryMessage({ match, winner, scoreA, scoreB, elapsedTime, formatTime, saving }: VictoryMessageProps) {
  const winnerName = winner === 'A' ? match.equipe_a?.name : match.equipe_b?.name

  return (
    <div className="mt-6 sm:mt-8 text-center px-2">
      <div className="inline-block bg-gradient-to-r from-yellow-400 to-orange-500 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl max-w-full">
        <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎉</div>
        <h2 className="text-xl sm:text-3xl font-bold text-white mb-2 px-2">
          Victoire de {winnerName} !
        </h2>
        <p className="text-white/90 text-base sm:text-xl px-2">
          Score final : {scoreA} - {scoreB}
        </p>
        <p className="text-white/80 text-xs sm:text-sm mt-3 sm:mt-4">
          Match termine en {formatTime(elapsedTime)}
        </p>
        {saving && (
          <div className="mt-3 sm:mt-4 flex items-center justify-center text-white">
            <Loader className="animate-spin h-6 w-6" />
            <span className="ml-2 text-sm sm:text-base">Retour au tournoi...</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface ManchesHistoryProps {
  manches: Array<{ scoreA: number; scoreB: number }>
  winner: 'A' | 'B' | null
  undoLastManche: () => void
}

function ManchesHistory({ manches, winner, undoLastManche }: ManchesHistoryProps) {
  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-700">Detail des menes</h3>
        {!winner && manches.length > 0 && (
          <button
            onClick={undoLastManche}
            className="flex items-center px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
          >
            <Undo className="w-5 h-5" />
            <span className="ml-2">Annuler derniere mene</span>
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {manches.map((manche, index) => (
          <div key={index} className="bg-white rounded-xl p-3 shadow-md hover:shadow-lg transition-all">
            <p className="text-xs text-gray-500 mb-1 text-center">Mene {index + 1}</p>
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
  )
}

interface FloatingSaveButtonProps {
  saving: boolean
  onSave: () => void
}

function FloatingSaveButton({ saving, onSave }: FloatingSaveButtonProps) {
  return (
    <div className="fixed bottom-8 right-8">
      <button
        onClick={onSave}
        disabled={saving}
        className="group p-4 bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all transform hover:scale-110"
        title="Sauvegarder la progression"
      >
        {saving ? <Loader className="animate-spin h-6 w-6" /> : <Save className="w-6 h-6" />}
        <span className="absolute right-full mr-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Sauvegarder la progression
        </span>
      </button>
    </div>
  )
}
