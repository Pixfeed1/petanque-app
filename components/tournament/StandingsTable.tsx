/**
 * Tableau de classement pour les poules
 * Affiche les équipes triées selon règles FIPJP
 */

'use client'

import { Trophy } from '@/components/Icons'

export interface TeamStanding {
  id: string
  name: string
  played: number
  victories: number
  defeats: number
  draws: number
  pointsFor: number
  pointsAgainst: number
  difference: number
  points: number // Points FIPJP (victoires × 3 + nuls × 1)
}

interface StandingsTableProps {
  poule: string
  teams: TeamStanding[]
  showQualifiedBadge?: boolean
  qualifiedCount?: number
  onRenameTeam?: (teamId: string, newName: string) => void
  isOrganizer?: boolean
}

export default function StandingsTable({
  poule,
  teams,
  showQualifiedBadge = false,
  qualifiedCount = 0,
  onRenameTeam,
  isOrganizer = false
}: StandingsTableProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
        <h3 className="text-xl font-bold flex items-center">
          <Trophy className="w-6 h-6 mr-2" />
          {poule}
        </h3>
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
                Équipe
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
            {teams.map((team, index) => {
              const isQualified = showQualifiedBadge && index < qualifiedCount

              return (
                <tr
                  key={team.id}
                  className={`hover:bg-gray-50 transition-colors ${
                    isQualified ? 'bg-green-50/50' : ''
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
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">{team.name}</p>
                      {isQualified && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          Qualifié
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-4 text-center text-sm text-gray-900">
                    {team.played}
                  </td>
                  <td className="px-2 sm:px-4 py-4 text-center text-sm font-semibold text-green-600">
                    {team.victories}
                  </td>
                  <td className="px-2 sm:px-4 py-4 text-center text-sm text-gray-600 hidden sm:table-cell">
                    {team.draws}
                  </td>
                  <td className="px-2 sm:px-4 py-4 text-center text-sm text-red-600 hidden sm:table-cell">
                    {team.defeats}
                  </td>
                  <td className="px-2 sm:px-4 py-4 text-center text-sm font-medium">
                    <span className={team.difference >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {team.difference >= 0 ? '+' : ''}{team.difference}
                    </span>
                  </td>
                  <td className="px-2 sm:px-4 py-4 text-center text-sm font-bold text-gray-900">
                    {team.points}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
