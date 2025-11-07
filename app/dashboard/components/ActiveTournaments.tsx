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
      <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun tournoi actif</h3>
        <p className="text-gray-600 mb-6">Créez un nouveau tournoi pour commencer</p>
        <button
          onClick={() => router.push('/tournoi/nouveau')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
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

        return (
          <div
            key={tournoi.id}
            className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-all overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">{tournoi.name}</h3>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                      isEnCours
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isEnCours ? 'En cours' : 'Préparation'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {tournoi.format} • {tournoi.mode.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* Stats rapides */}
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1.5 text-gray-700">
                  {Icons.users}
                  <span className="font-medium">{tournoi.nb_joueurs || 0}</span>
                  <span className="text-gray-500">joueurs</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-700">
                  {Icons.chart}
                  <span className="font-medium">{tournoi.nb_matchs_joues || 0}/{tournoi.nb_matchs_total || 0}</span>
                  <span className="text-gray-500">matchs</span>
                </div>
                {isEnCours && matchsRestants > 0 && (
                  <div className="text-amber-600 font-medium">
                    {matchsRestants} restant{matchsRestants > 1 ? 's' : ''}
                  </div>
                )}
              </div>

              {/* Barre de progression */}
              {(tournoi.nb_matchs_total || 0) > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-600">Progression</span>
                    <span className="text-xs font-semibold text-gray-900">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 transition-all duration-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center gap-2">
              <button
                onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {Icons.eye}
                Voir
              </button>
              <button
                onClick={() => router.push(`/tournoi/${tournoi.id}/bracket`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {Icons.chart}
                Bracket
              </button>
              {!isEnCours ? (
                <button
                  onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors ml-auto"
                >
                  {Icons.play}
                  Démarrer
                </button>
              ) : (
                <button
                  onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors ml-auto"
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
