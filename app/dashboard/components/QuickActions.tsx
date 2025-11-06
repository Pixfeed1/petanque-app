// app/dashboard/components/QuickActions.tsx
// Boutons d'actions rapides

'use client'

import React from 'react'

interface QuickActionsProps {
  onNewTournament: () => void
  onManagePlayers: () => void
  onViewStats: () => void
  onQuiz: () => void
}

// Icônes SVG
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
      icon: Icons.plus,
      onClick: onNewTournament,
      primary: true,
      color: 'bg-green-600 hover:bg-green-700 text-white'
    },
    {
      label: 'Gérer Joueurs',
      icon: Icons.users,
      onClick: onManagePlayers,
      primary: false,
      color: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
    },
    {
      label: 'Quiz',
      icon: Icons.book,
      onClick: onQuiz,
      primary: false,
      color: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
    },
    {
      label: 'Statistiques',
      icon: Icons.chart,
      onClick: onViewStats,
      primary: false,
      color: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-200'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={action.onClick}
          className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${action.color}`}
        >
          {action.icon}
          <span className="text-sm">{action.label}</span>
        </button>
      ))}
    </div>
  )
}
