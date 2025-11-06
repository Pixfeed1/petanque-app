// app/dashboard/components/StatsCards.tsx
// Cartes de statistiques avec design premium

import React from 'react'
import { DashboardStats } from '../hooks/useDashboardData'

interface StatsCardsProps {
  stats: DashboardStats
  loading: boolean
}

const Icons = {
  trophy: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v6m-3 0h6m4-13V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1H11a1 1 0 00-1 1v1.5a.5.5 0 01-.5.5H7a2 2 0 00-2 2v1c0 3.5 2.5 6 5.5 6.5m9 0c3-0.5 5.5-3 5.5-6.5V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1h-2" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  gamepad: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
    </svg>
  ),
  play: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  arrowUp: (
    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  )
}

export default function StatsCards({ stats, loading }: StatsCardsProps) {
  const cards = [
    {
      title: 'Tournois',
      value: stats.totalTournois,
      change: stats.nouveauxTournois,
      icon: Icons.trophy,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-cyan-50'
    },
    {
      title: 'En cours',
      value: stats.tournoiEnCours,
      change: null,
      icon: Icons.play,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-emerald-50',
      pulse: stats.tournoiEnCours > 0
    },
    {
      title: 'Joueurs',
      value: stats.totalJoueurs,
      change: stats.nouveauxJoueurs,
      icon: Icons.users,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-pink-50'
    },
    {
      title: 'Matchs',
      value: stats.totalMatchs,
      change: stats.nouveauxMatchs,
      icon: Icons.gamepad,
      gradient: 'from-orange-500 to-red-500',
      bgGradient: 'from-orange-50 to-red-50'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="relative overflow-hidden bg-white rounded-xl border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="group relative overflow-hidden bg-white rounded-xl border border-gray-200 p-6 transition-all duration-300 hover:shadow-xl hover:border-gray-300 hover:-translate-y-1"
        >
          {/* Gradient background subtil */}
          <div className={`absolute inset-0 bg-gradient-to-br ${card.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

          {/* Contenu */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              {/* Icône avec gradient */}
              <div className={`relative p-2.5 rounded-lg bg-gradient-to-br ${card.gradient} text-white shadow-lg ${card.pulse ? 'animate-pulse' : ''}`}>
                {card.icon}
                {card.pulse && (
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-green-400 to-emerald-400 animate-ping opacity-20"></div>
                )}
              </div>

              {/* Badge changement */}
              {card.change !== null && card.change > 0 && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-semibold">
                  {Icons.arrowUp}
                  <span>+{card.change}</span>
                </div>
              )}
            </div>

            {/* Titre */}
            <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>

            {/* Valeur */}
            <p className="text-3xl font-bold text-gray-900">{card.value}</p>

            {/* Barre de progression */}
            <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${card.gradient} transition-all duration-1000 ease-out`}
                style={{ width: `${Math.min((card.value / Math.max(...cards.map(c => c.value))) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
