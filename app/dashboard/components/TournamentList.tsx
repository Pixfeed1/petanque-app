// app/dashboard/components/TournamentList.tsx
// Liste des tournois avec filtres

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Tournament } from '../hooks/useDashboardData'

interface TournamentListProps {
  tournois: Tournament[]
  loading: boolean
  onCreateNew: () => void
}

// Icônes SVG
const Icons = {
  calendar: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  eye: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
        bg: 'bg-green-100',
        text: 'text-green-700',
        label: 'En cours',
        dot: 'bg-green-500',
        pulse: true
      },
      'preparation': {
        bg: 'bg-yellow-100',
        text: 'text-yellow-700',
        label: 'Préparation',
        dot: 'bg-yellow-500',
        pulse: false
      },
      'termine': {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        label: 'Terminé',
        dot: 'bg-gray-500',
        pulse: false
      }
    }
    return configs[status]
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="divide-y divide-gray-100">
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
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header avec filtres */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-gray-900">Mes Tournois</h2>

          <div className="flex bg-gray-200 rounded-lg p-1">
            {[
              { key: 'all', label: 'Tous' },
              { key: 'en_cours', label: 'En cours' },
              { key: 'termine', label: 'Terminés' }
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as typeof filter)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
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
      <div className="divide-y divide-gray-100">
        {filteredTournois.length > 0 ? (
          filteredTournois.map((tournoi) => {
            const statusConfig = getStatusConfig(tournoi.status)

            return (
              <div
                key={tournoi.id}
                className="group p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => router.push(`/tournoi/${tournoi.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Titre et badge */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-base font-semibold text-gray-900 group-hover:text-green-600 transition-colors truncate">
                        {tournoi.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusConfig.dot} ${statusConfig.pulse ? 'animate-pulse' : ''}`}></span>
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Informations */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        {Icons.calendar}
                        {new Date(tournoi.created_at).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="flex items-center gap-1">
                        {Icons.users}
                        {tournoi.nb_joueurs || 0} joueurs
                      </span>
                      <span className="flex items-center gap-1">
                        {Icons.gamepad}
                        {tournoi.nb_matchs_joues || 0}/{tournoi.nb_matchs_total || 0} matchs
                      </span>
                      <span className="text-gray-500">
                        {tournoi.format} • {tournoi.mode.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Bouton voir */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/tournoi/${tournoi.id}`)
                    }}
                    className="ml-4 p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    {Icons.eye}
                  </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-12 text-center">
            <div className="text-5xl mb-3">🎯</div>
            <p className="text-lg font-medium text-gray-600 mb-2">
              {filter === 'all'
                ? 'Aucun tournoi créé'
                : filter === 'en_cours'
                ? 'Aucun tournoi en cours'
                : 'Aucun tournoi terminé'
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={onCreateNew}
                className="mt-4 px-5 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                Créer mon premier tournoi
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
