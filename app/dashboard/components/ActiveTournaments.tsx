// app/dashboard/components/ActiveTournaments.tsx
// Liste plate moderne - Sans cards

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Tournament } from '../hooks/useDashboardData'

interface ActiveTournamentsProps {
  tournois: Tournament[]
  loading: boolean
}

const Icons = {
  arrowRight: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

export default function ActiveTournaments({ tournois, loading }: ActiveTournamentsProps) {
  const router = useRouter()

  // Filtrer les tournois actifs (en cours ou en préparation)
  const activeTournois = tournois.filter(t =>
    t.status === 'en_cours' || t.status === 'preparation'
  )

  if (loading) {
    return (
      <div className="space-y-8">
        {[1, 2].map(i => (
          <div key={i} className="animate-pulse py-8 border-b border-gray-200">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-100 rounded w-1/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (activeTournois.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-4">🎯</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Aucun tournoi</h3>
        <p className="text-gray-500 mb-8">Créez votre premier tournoi pour commencer</p>
        <button
          onClick={() => router.push('/tournoi/nouveau')}
          className="inline-flex items-center gap-3 px-8 py-4 bg-gray-900 text-white font-semibold hover:bg-gray-800 transition-colors"
        >
          Créer un tournoi
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {activeTournois.map((tournoi, index) => {
        const progress = (tournoi.nb_matchs_total || 0) > 0
          ? ((tournoi.nb_matchs_joues || 0) / (tournoi.nb_matchs_total || 1)) * 100
          : 0

        const isEnCours = tournoi.status === 'en_cours'
        const matchsRestants = (tournoi.nb_matchs_total || 0) - (tournoi.nb_matchs_joues || 0)

        // Détection des badges
        const hasOddPlayers = tournoi.status === 'preparation' && tournoi.nb_joueurs && tournoi.nb_joueurs % 2 !== 0
        const isReady = tournoi.status === 'preparation' && tournoi.nb_joueurs && tournoi.nb_joueurs % 2 === 0 && tournoi.nb_joueurs >= 4
        const notEnoughPlayers = tournoi.status === 'preparation' && (!tournoi.nb_joueurs || tournoi.nb_joueurs < 4)

        return (
          <div
            key={tournoi.id}
            className="py-8 border-b border-gray-200 last:border-b-0 hover:bg-gray-50/50 transition-colors cursor-pointer group"
            onClick={() => router.push(`/tournoi/${tournoi.id}`)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  {/* Titre */}
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-gray-700 transition-colors">
                    {tournoi.name}
                  </h3>

                  {/* Badge statut simple */}
                  {isEnCours && (
                    <span className="inline-flex items-center gap-2 px-3 py-1 bg-gray-900 text-white text-xs font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      En cours
                    </span>
                  )}

                  {/* Badges discrets */}
                  {hasOddPlayers && (
                    <span className="text-xs text-red-600 font-medium">
                      ⚠️ {tournoi.nb_joueurs} joueurs
                    </span>
                  )}
                  {isReady && (
                    <span className="text-xs text-green-600 font-medium">
                      ✓ Prêt
                    </span>
                  )}
                  {notEnoughPlayers && (
                    <span className="text-xs text-amber-600 font-medium">
                      {tournoi.nb_joueurs || 0}/4 joueurs
                    </span>
                  )}
                </div>

                {/* Meta info */}
                <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                  <span className="font-medium">{tournoi.format}</span>
                  <span>•</span>
                  <span>{tournoi.mode.replace('_', ' ')}</span>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    {Icons.users}
                    <span>{tournoi.nb_joueurs || 0} joueurs</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1.5">
                    {Icons.chart}
                    <span>{tournoi.nb_matchs_joues || 0}/{tournoi.nb_matchs_total || 0} matchs</span>
                  </div>
                  {isEnCours && matchsRestants > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-gray-900 font-bold">
                        {matchsRestants} restant{matchsRestants > 1 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>

                {/* Barre de progression minimaliste */}
                {(tournoi.nb_matchs_total || 0) > 0 && (
                  <div className="max-w-md">
                    <div className="flex items-center justify-between mb-2 text-xs text-gray-500">
                      <span>Progression</span>
                      <span className="font-bold text-gray-900">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-900 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Flèche */}
              <div className="flex-shrink-0 text-gray-400 group-hover:text-gray-900 transition-colors">
                {Icons.arrowRight}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
