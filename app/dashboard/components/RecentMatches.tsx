// app/dashboard/components/RecentMatches.tsx
// Affichage des derniers matchs terminés

'use client'

import React from 'react'
import { Match } from '../hooks/useDashboardData'

interface RecentMatchesProps {
  matches: Match[]
  loading: boolean
}

// Icônes SVG
const Icons = {
  trophy: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v6m-3 0h6m4-13V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1H11a1 1 0 00-1 1v1.5a.5.5 0 01-.5.5H7a2 2 0 00-2 2v1c0 3.5 2.5 6 5.5 6.5m9 0c3-0.5 5.5-3 5.5-6.5V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1h-2" />
    </svg>
  ),
  clock: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function RecentMatches({ matches, loading }: RecentMatchesProps) {
  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="h-5 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-24"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Derniers matchs</h3>

      {matches.length > 0 ? (
        <div className="space-y-2">
          {matches.map((match) => {
            const winner = (match.score_a || 0) > (match.score_b || 0) ? 'a' : 'b'

            return (
              <div
                key={match.id}
                className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {/* Équipes et scores */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={`font-medium ${winner === 'a' ? 'text-green-600' : 'text-gray-600'}`}>
                        {match.equipe_a?.name || 'Équipe A'}
                      </span>
                      {winner === 'a' && <span className="text-green-600">{Icons.trophy}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-sm mt-1">
                      <span className={`font-medium ${winner === 'b' ? 'text-green-600' : 'text-gray-600'}`}>
                        {match.equipe_b?.name || 'Équipe B'}
                      </span>
                      {winner === 'b' && <span className="text-green-600">{Icons.trophy}</span>}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className={`text-sm font-bold ${winner === 'a' ? 'text-green-600' : 'text-gray-600'}`}>
                      {match.score_a || 0}
                    </div>
                    <div className={`text-sm font-bold ${winner === 'b' ? 'text-green-600' : 'text-gray-600'}`}>
                      {match.score_b || 0}
                    </div>
                  </div>
                </div>

                {/* Infos match */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    {Icons.clock}
                    {new Date(match.updated_at).toLocaleDateString('fr-FR')}
                  </span>
                  <span>Tour {match.tour}</span>
                  {match.terrain && <span>Terrain {match.terrain}</span>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">🎯</div>
          <p className="text-sm">Aucun match récent</p>
        </div>
      )}
    </div>
  )
}
