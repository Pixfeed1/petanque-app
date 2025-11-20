/**
 * Tableau de classement individuel pour les joueurs
 * Utilisé dans les tournois en mêlée tournante
 */

'use client'

import { Trophy } from '@/components/Icons'

export interface PlayerRanking {
  id: string
  name: string
  email?: string
  played: number
  victories: number
  defeats: number
  draws: number
  pointsFor: number
  pointsAgainst: number
  difference: number
  points: number // Points FIPJP (victoires × 3 + nuls × 1)
}

interface PlayerRankingsTableProps {
  players: PlayerRanking[]
  rotationMode?: 'par_tour' | 'par_match'
}

export default function PlayerRankingsTable({
  players,
  rotationMode
}: PlayerRankingsTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-4 text-white">
        <h3 className="text-xl font-bold">Classement Individuel</h3>
        {rotationMode && (
          <p className="text-sm opacity-90">
            Mode mêlée tournante - Rotation {rotationMode === 'par_match' ? 'par match' : 'par tour'}
          </p>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Joueur
              </th>
              <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="hidden sm:inline">Joués</span>
                <span className="sm:hidden">J</span>
              </th>
              <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="hidden sm:inline">Victoires</span>
                <span className="sm:hidden">V</span>
              </th>
              <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Nuls
              </th>
              <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                Défaites
              </th>
              <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="hidden sm:inline">Différence</span>
                <span className="sm:hidden">Diff</span>
              </th>
              <th className="px-2 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <span className="hidden sm:inline">Points</span>
                <span className="sm:hidden">Pts</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {players.map((player, index) => (
              <tr
                key={player.id}
                className={`hover:bg-gray-50 transition-colors ${
                  index < 3 ? 'bg-purple-50/30' : ''
                }`}
              >
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`text-sm font-bold ${
                      index === 0 ? 'text-yellow-600' :
                      index === 1 ? 'text-gray-600' :
                      index === 2 ? 'text-orange-600' :
                      'text-gray-400'
                    }`}>
                      {index + 1}
                    </span>
                    {index === 0 && <span className="ml-1 text-lg">🥇</span>}
                    {index === 1 && <span className="ml-1 text-lg">🥈</span>}
                    {index === 2 && <span className="ml-1 text-lg">🥉</span>}
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4">
                  <p className="text-sm font-medium text-gray-900">{player.name}</p>
                  {player.email && (
                    <p className="text-xs text-gray-500 hidden sm:block">{player.email}</p>
                  )}
                </td>
                <td className="px-2 sm:px-4 py-4 text-center text-sm text-gray-900">
                  {player.played}
                </td>
                <td className="px-2 sm:px-4 py-4 text-center text-sm font-semibold text-green-600">
                  {player.victories}
                </td>
                <td className="px-2 sm:px-4 py-4 text-center text-sm text-gray-600 hidden sm:table-cell">
                  {player.draws}
                </td>
                <td className="px-2 sm:px-4 py-4 text-center text-sm text-red-600 hidden sm:table-cell">
                  {player.defeats}
                </td>
                <td className="px-2 sm:px-4 py-4 text-center text-sm font-medium">
                  <span className={player.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {player.difference >= 0 ? '+' : ''}{player.difference}
                  </span>
                </td>
                <td className="px-2 sm:px-4 py-4 text-center text-sm font-bold text-gray-900">
                  {player.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {players.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Aucun joueur à afficher</p>
        </div>
      )}
    </div>
  )
}
