/**
 * Carte pour afficher un match de pétanque
 * Supporte les matchs normaux, BYE, et différents statuts
 */

'use client'

import { useRouter } from 'next/navigation'

interface Team {
  id: string
  name: string
  joueur_ids?: string[]
}

interface MatchCardProps {
  match: {
    id: string
    equipe_a: Team | null
    equipe_b: Team | null
    terrain: number | null
    status: 'a_jouer' | 'en_cours' | 'termine'
    score_a: number | null
    score_b: number | null
    type?: 'poule' | 'elimination' | 'demi' | 'finale' | 'petite_finale' | 'bye' | 'quart' | 'huitieme'
    poule?: string
  }
  maxPoints?: number
  isOrganizer: boolean
  getTeamPlayers: (teamId: string) => string[]
  onAssignTerrain?: (matchId: string, terrain: number) => void
  availableTerrains: number
}

export default function MatchCard({
  match,
  maxPoints = 13,
  isOrganizer,
  getTeamPlayers,
  onAssignTerrain,
  availableTerrains
}: MatchCardProps) {
  const router = useRouter()

  // Match BYE - Affichage spécial
  if (match.type === 'bye') {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-blue-200">
        <div className="text-center py-4">
          <p className="font-medium text-gray-900 text-base mb-2">{match.equipe_a?.name}</p>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-200">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-2xl">🎟️</span>
              <p className="text-lg font-bold text-blue-900">BYE</p>
            </div>
            <p className="text-sm text-blue-700">Qualification automatique</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border-2 border-gray-100 hover:border-green-200 transition-all hover:shadow-xl">
      {/* Header - Terrain */}
      {match.terrain && (
        <div className="flex items-center justify-center mb-4">
          <span className="text-sm font-semibold text-gray-900">Terrain {match.terrain}</span>
        </div>
      )}

      {/* Équipes */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-center">
        {/* Équipe A */}
        <div className="text-center">
          <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 truncate">
            {match.equipe_a?.name || 'En attente'}
          </p>
          {(() => {
            const players = match.equipe_a ? getTeamPlayers(match.equipe_a.id) : []
            if (players.length > 0) {
              return (
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 px-1 truncate leading-tight">
                  {players.join(', ')}
                </p>
              )
            }
            return null
          })()}
          {match.status !== 'a_jouer' && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{match.score_a ?? 0}</p>
              {match.status === 'termine' && match.score_a === maxPoints && match.score_b === 0 && (
                <span className="text-lg sm:text-2xl animate-bounce" title="FANNY !">🍑</span>
              )}
            </div>
          )}
        </div>

        {/* VS */}
        <div className="flex items-center justify-center">
          <div className="px-2 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg">
            <span className="text-xs sm:text-sm font-bold text-gray-600">VS</span>
          </div>
        </div>

        {/* Équipe B */}
        <div className="text-center">
          <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-1 truncate">
            {match.equipe_b?.name || 'En attente'}
          </p>
          {(() => {
            const players = match.equipe_b ? getTeamPlayers(match.equipe_b.id) : []
            if (players.length > 0) {
              return (
                <p className="text-[10px] sm:text-xs text-gray-600 mt-0.5 px-1 truncate leading-tight">
                  {players.join(', ')}
                </p>
              )
            }
            return null
          })()}
          {match.status !== 'a_jouer' && (
            <div className="flex items-center justify-center gap-1 mt-1">
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{match.score_b ?? 0}</p>
              {match.status === 'termine' && match.score_b === maxPoints && match.score_a === 0 && (
                <span className="text-lg sm:text-2xl animate-bounce" title="FANNY !">🍑</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Actions pour match à jouer */}
      {match.status === 'a_jouer' && isOrganizer && onAssignTerrain && (
        <div className="mt-3 flex space-x-2">
          <select
            value={match.terrain || ''}
            onChange={(e) => onAssignTerrain(match.id, parseInt(e.target.value))}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500"
          >
            <option value="">Terrain...</option>
            {Array.from({ length: availableTerrains }, (_, i) => (
              <option key={i + 1} value={i + 1}>Terrain {i + 1}</option>
            ))}
          </select>
          <button
            onClick={() => {
              if (!match.terrain) {
                alert('⚠️ Veuillez d\'abord assigner un terrain au match avant de le démarrer.')
                return
              }
              router.push(`/match/${match.id}`)
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all"
          >
            Démarrer
          </button>
        </div>
      )}

      {/* Badge statut */}
      <div className="mt-3 flex items-center justify-center">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          match.status === 'a_jouer' ? 'bg-gray-100 text-gray-700' :
          match.status === 'en_cours' ? 'bg-green-100 text-green-700' :
          'bg-blue-100 text-blue-700'
        }`}>
          {match.status === 'a_jouer' ? 'À jouer' :
           match.status === 'en_cours' ? 'En cours' :
           'Terminé'}
        </span>
      </div>
    </div>
  )
}
