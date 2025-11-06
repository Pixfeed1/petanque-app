// app/dashboard/components/TournamentList.tsx
// Liste des tournois avec design premium

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tournament } from '../hooks/useDashboardData'

interface TournamentListProps {
  tournois: Tournament[]
  loading: boolean
  onCreateNew: () => void
}

const Icons = {
  calendar: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  users: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  gamepad: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  ),
  arrowRight: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  )
}

export default function TournamentList({ tournois, loading, onCreateNew }: TournamentListProps) {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'en_cours' | 'termine'>('all')
  const [filteredTournois, setFilteredTournois] = useState<Tournament[]>([])

  useEffect(() => {
    if (filter === 'all') {
      setFilteredTournois(tournois)
    } else {
      setFilteredTournois(tournois.filter(t => t.status === filter))
    }
  }, [filter, tournois])

  const getStatusConfig = (status: Tournament['status']) => {
    const configs = {
      'en_cours': {
        bg: 'bg-green-500',
        text: 'text-white',
        label: 'En cours',
        ring: 'ring-green-500/20'
      },
      'preparation': {
        bg: 'bg-amber-500',
        text: 'text-white',
        label: 'Préparation',
        ring: 'ring-amber-500/20'
      },
      'termine': {
        bg: 'bg-gray-400',
        text: 'text-white',
        label: 'Terminé',
        ring: 'ring-gray-400/20'
      }
    }
    return configs[status]
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-40"></div>
        </div>
        <div className="divide-y divide-gray-200">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-48 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* Header avec filtres */}
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Mes Tournois</h2>
            <p className="text-sm text-gray-500 mt-1">{tournois.length} tournoi{tournois.length > 1 ? 's' : ''} au total</p>
          </div>

          <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
            {[
              { key: 'all', label: 'Tous' },
              { key: 'en_cours', label: 'En cours' },
              { key: 'termine', label: 'Terminés' }
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as typeof filter)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  filter === f.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des tournois */}
      <div className="divide-y divide-gray-200">
        {filteredTournois.length > 0 ? (
          filteredTournois.map((tournoi) => {
            const statusConfig = getStatusConfig(tournoi.status)
            const progress = (tournoi.nb_matchs_total || 0) > 0
              ? ((tournoi.nb_matchs_joues || 0) / (tournoi.nb_matchs_total || 1)) * 100
              : 0

            return (
              <div
                key={tournoi.id}
                className="group p-6 hover:bg-gray-50 transition-all cursor-pointer relative"
                onClick={() => router.push(`/tournoi/${tournoi.id}`)}
              >
                {/* Bande colorée à gauche */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${statusConfig.bg} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* En-tête */}
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors truncate">
                        {tournoi.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusConfig.bg} ${statusConfig.text} ring-4 ${statusConfig.ring}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Informations */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                      <span className="inline-flex items-center gap-1.5">
                        {Icons.calendar}
                        {new Date(tournoi.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        {Icons.users}
                        <span className="font-medium">{tournoi.nb_joueurs || 0}</span> joueurs
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        {Icons.gamepad}
                        <span className="font-medium">{tournoi.nb_matchs_joues || 0}/{tournoi.nb_matchs_total || 0}</span> matchs
                      </span>
                      <span className="text-gray-500 hidden sm:inline">
                        {tournoi.format} • {tournoi.mode.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Barre de progression */}
                    {(tournoi.nb_matchs_total || 0) > 0 && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs font-medium text-gray-600 min-w-[3rem] text-right">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Bouton */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/tournoi/${tournoi.id}`)
                    }}
                    className="ml-4 p-2 text-gray-400 group-hover:text-green-600 group-hover:bg-green-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    {Icons.arrowRight}
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all'
                ? 'Aucun tournoi'
                : filter === 'en_cours'
                ? 'Aucun tournoi en cours'
                : 'Aucun tournoi terminé'
              }
            </h3>
            {filter === 'all' && (
              <>
                <p className="text-gray-500 mb-6">Créez votre premier tournoi pour commencer</p>
                <button
                  onClick={onCreateNew}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-lg shadow-green-600/20"
                >
                  {Icons.plus}
                  Créer un tournoi
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
