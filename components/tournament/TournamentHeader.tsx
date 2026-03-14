/**
 * En-tête du tournoi avec titre, statut et actions
 */

'use client'

import { useRouter } from 'next/navigation'
import { Petanque, Play, Calendar, Clock, Shuffle, Flag, Trophy } from '@/components/Icons'

interface TournamentHeaderProps {
  tournament: {
    id: string
    name: string
    status: 'preparation' | 'en_cours' | 'termine'
    mode: 'choisi' | 'melee_fixe' | 'melee_tournante'
    settings: {
      date: string
      time: string
    }
  }
  isOrganizer: boolean
  canGenerateElimination: boolean
  canGenerateFinale: boolean
  realtimeConnected?: boolean
  onStartTournament: () => void
  onRotateTeams?: () => void
  onGenerateElimination?: () => void
  onGenerateFinale?: () => void
}

export default function TournamentHeader({
  tournament,
  isOrganizer,
  canGenerateElimination,
  canGenerateFinale,
  realtimeConnected,
  onStartTournament,
  onRotateTeams,
  onGenerateElimination,
  onGenerateFinale
}: TournamentHeaderProps) {
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Back button and title */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="group flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              ← <span className="hidden sm:inline font-medium">Retour</span>
            </button>

            <div className="hidden sm:block h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

            <div className="flex items-center space-x-1.5 sm:space-x-3">
              <div className="p-1 sm:p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl text-white">
                <Petanque className="w-5 h-5 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-sm sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  <span className="hidden sm:inline">{tournament.name}</span>
                  <span className="sm:hidden">
                    {tournament.name.length > 20 ? tournament.name.substring(0, 20) + '...' : tournament.name}
                  </span>
                </h1>
                <div className="flex items-center space-x-1 sm:space-x-4 text-xs text-gray-500">
                  <span className="hidden md:flex items-center">
                    <Calendar className="w-4 h-4" />
                    <span className="ml-1">
                      {new Date(tournament.settings.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </span>
                  <span className="hidden md:flex items-center">
                    <Clock className="w-4 h-4" />
                    <span className="ml-1">{tournament.settings.time}</span>
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    tournament.status === 'preparation'
                      ? 'bg-yellow-100 text-yellow-700'
                      : tournament.status === 'en_cours'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {tournament.status === 'preparation' ? 'Prépa' :
                     tournament.status === 'en_cours' ? 'En cours' : 'Terminé'}
                  </span>
                  {tournament.status === 'en_cours' && realtimeConnected && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-1 sm:space-x-3">
            {/* Démarrer tournoi */}
            {tournament.status === 'preparation' && isOrganizer && (
              <button
                onClick={onStartTournament}
                className="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
              >
                <Play className="w-5 h-5" />
                <span className="hidden sm:inline">Démarrer le tournoi</span>
                <span className="sm:hidden">Démarrer</span>
              </button>
            )}

            {/* Rotation équipes (mêlée tournante) */}
            {tournament.mode === 'melee_tournante' && tournament.status === 'en_cours' && isOrganizer && onRotateTeams && (
              <button
                onClick={onRotateTeams}
                className="px-2 sm:px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
              >
                <Shuffle className="w-5 h-5" />
                <span className="hidden sm:inline">Rotation équipes</span>
                <span className="sm:hidden">Rotation</span>
              </button>
            )}

            {/* Générer phases finales */}
            {canGenerateElimination && isOrganizer && onGenerateElimination && (
              <button
                onClick={onGenerateElimination}
                className="px-2 sm:px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
              >
                <Flag className="w-5 h-5" />
                <span className="hidden sm:inline">Générer phases finales</span>
                <span className="sm:hidden">Phases</span>
              </button>
            )}

            {/* Générer finale */}
            {canGenerateFinale && isOrganizer && onGenerateFinale && (
              <button
                onClick={onGenerateFinale}
                className="px-2 sm:px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
              >
                <Trophy className="w-5 h-5" />
                <span className="hidden sm:inline">Générer finale + petite finale</span>
                <span className="sm:hidden">Finale</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
