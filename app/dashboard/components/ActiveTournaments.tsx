// app/dashboard/components/ActiveTournaments.tsx
// Liste des tournois actifs avec actions contextuelles

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Tournament } from '../hooks/useDashboardData'

interface ActiveTournamentsProps {
  tournois: Tournament[]
  loading: boolean
}

const Icons = {
  users: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  eye: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  play: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
            <div className="h-4 bg-gray-100 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-100 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    )
  }

  if (activeTournois.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur rounded-xl border-2 border-stone-200 p-12 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-amber-50 rounded-2xl mb-4">
          <svg className="w-10 h-10 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-stone-900 mb-2">Aucun tournoi</h3>
        <p className="text-stone-600 mb-6">Créez votre premier tournoi pour commencer</p>
        <button
          onClick={() => router.push('/tournoi/nouveau')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-xl font-bold hover:from-orange-700 hover:to-amber-700 transition-all shadow-lg"
        >
          Créer un tournoi
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {activeTournois.map(tournoi => {
        const progress = (tournoi.nb_matchs_total || 0) > 0
          ? ((tournoi.nb_matchs_joues || 0) / (tournoi.nb_matchs_total || 1)) * 100
          : 0

        const isEnCours = tournoi.status === 'en_cours'
        const matchsRestants = (tournoi.nb_matchs_total || 0) - (tournoi.nb_matchs_joues || 0)

        // Détection des badges discrets
        const hasOddPlayers = tournoi.status === 'preparation' && tournoi.nb_joueurs && tournoi.nb_joueurs % 2 !== 0
        const isReady = tournoi.status === 'preparation' && tournoi.nb_joueurs && tournoi.nb_joueurs % 2 === 0 && tournoi.nb_joueurs >= 4
        const notEnoughPlayers = tournoi.status === 'preparation' && (!tournoi.nb_joueurs || tournoi.nb_joueurs < 4)

        return (
          <div
            key={tournoi.id}
            className={`bg-white rounded-xl border-2 transition-all overflow-hidden ${
              isEnCours
                ? 'border-orange-400 shadow-lg shadow-orange-100'
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-xl font-bold text-stone-900">{tournoi.name}</h3>

                    {/* Badge statut */}
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold ${
                      isEnCours
                        ? 'bg-orange-600 text-white'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isEnCours ? '🎯 EN COURS' : 'Préparation'}
                    </span>

                    {/* Badges discrets pour alertes */}
                    {hasOddPlayers && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
                        Nombre impair
                      </span>
                    )}
                    {isReady && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700">
                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                        Prêt
                      </span>
                    )}
                    {notEnoughPlayers && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-amber-100 text-amber-700">
                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full"></div>
                        {tournoi.nb_joueurs || 0}/4 min
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-stone-600 font-medium">
                    {tournoi.format} • {tournoi.mode.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* Stats rapides */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-stone-700">
                  {Icons.users}
                  <span className="font-bold">{tournoi.nb_joueurs || 0}</span>
                  <span className="text-stone-500">joueurs</span>
                </div>
                <div className="flex items-center gap-1.5 text-stone-700">
                  {Icons.chart}
                  <span className="font-bold">{tournoi.nb_matchs_joues || 0}/{tournoi.nb_matchs_total || 0}</span>
                  <span className="text-stone-500">matchs</span>
                </div>
                {isEnCours && matchsRestants > 0 && (
                  <div className="text-orange-600 font-bold">
                    {matchsRestants} restant{matchsRestants > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Barre de progression */}
              {(tournoi.nb_matchs_total || 0) > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-stone-600">Progression</span>
                    <span className="text-xs font-bold text-orange-600">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-stone-50 border-t-2 border-stone-100 flex items-center gap-2">
              <button
                onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone-700 hover:text-stone-900 hover:bg-white rounded-lg transition-colors"
              >
                {Icons.eye}
                Voir
              </button>
              <button
                onClick={() => router.push(`/tournoi/${tournoi.id}/bracket`)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone-700 hover:text-stone-900 hover:bg-white rounded-lg transition-colors"
              >
                {Icons.chart}
                Bracket
              </button>
              {!isEnCours ? (
                <button
                  onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 rounded-lg transition-all ml-auto shadow-md"
                >
                  {Icons.play}
                  Démarrer
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-white bg-stone-800 hover:bg-stone-900 rounded-lg transition-colors ml-auto"
                >
                  {Icons.edit}
                  Gérer
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
