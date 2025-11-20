/**
 * Cartes d'information du tournoi (mode, format, équipes, terrains)
 */

'use client'

import { ReactNode } from 'react'

interface InfoCard {
  label: string
  value: string | number
  icon: ReactNode
}

interface TournamentInfoCardsProps {
  cards: InfoCard[]
}

export default function TournamentInfoCards({ cards }: TournamentInfoCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl p-6 shadow-lg border-2 border-gray-100 hover:border-green-200 transition-all hover:shadow-xl"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                {card.label}
              </p>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl text-green-600">
              {card.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
