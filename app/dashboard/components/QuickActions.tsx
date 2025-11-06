// app/dashboard/components/QuickActions.tsx
// Boutons d'actions rapides avec design moderne

'use client'

import React from 'react'

interface QuickActionsProps {
  onNewTournament: () => void
  onManagePlayers: () => void
  onViewStats: () => void
  onQuiz: () => void
}

const Icons = {
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  book: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

export default function QuickActions({
  onNewTournament,
  onManagePlayers,
  onViewStats,
  onQuiz
}: QuickActionsProps) {
  const actions = [
    {
      label: 'Nouveau Tournoi',
      description: 'Créer un tournoi',
      icon: Icons.plus,
      onClick: onNewTournament,
      primary: true,
      gradient: 'from-green-500 to-emerald-600',
      color: 'text-white',
      hoverBg: 'hover:from-green-600 hover:to-emerald-700'
    },
    {
      label: 'Gérer Joueurs',
      description: 'Liste des joueurs',
      icon: Icons.users,
      onClick: onManagePlayers,
      primary: false,
      gradient: 'from-white to-gray-50',
      color: 'text-gray-900',
      hoverBg: 'hover:to-gray-100'
    },
    {
      label: 'Quiz',
      description: 'Tester vos connaissances',
      icon: Icons.book,
      onClick: onQuiz,
      primary: false,
      gradient: 'from-white to-gray-50',
      color: 'text-gray-900',
      hoverBg: 'hover:to-gray-100'
    },
    {
      label: 'Statistiques',
      description: 'Voir les stats',
      icon: Icons.chart,
      onClick: onViewStats,
      primary: false,
      gradient: 'from-white to-gray-50',
      color: 'text-gray-900',
      hoverBg: 'hover:to-gray-100'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={`group relative overflow-hidden rounded-xl p-5 transition-all duration-300 ${
            action.primary
              ? `bg-gradient-to-br ${action.gradient} shadow-lg shadow-green-600/20 hover:shadow-xl hover:shadow-green-600/30 hover:-translate-y-1`
              : `bg-gradient-to-br ${action.gradient} border border-gray-200 ${action.hoverBg} hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5`
          }`}
        >
          {/* Effet brillance au hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-10 -translate-x-full group-hover:translate-x-full transition-all duration-1000"></div>

          <div className="relative">
            {/* Icône */}
            <div className={`inline-flex p-2.5 rounded-lg mb-3 ${
              action.primary
                ? 'bg-white/20'
                : 'bg-gray-100 group-hover:bg-gray-200'
            } ${action.color} transition-colors`}>
              {action.icon}
            </div>

            {/* Texte */}
            <div className="text-left">
              <p className={`font-semibold ${action.color} mb-1`}>
                {action.label}
              </p>
              <p className={`text-xs ${action.primary ? 'text-green-50' : 'text-gray-500'}`}>
                {action.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
