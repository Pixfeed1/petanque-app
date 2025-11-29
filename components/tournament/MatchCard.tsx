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
    status: 'a_jouer' | 'en_cours' | 'termine' | 'en_attente_validation'
    score_a: number | null
    score_b: number | null
    type?: 'poule' | 'elimination' | 'demi' | 'finale' | 'petite_finale' | 'bye' | 'quart' | 'huitieme'
    poule?: string
  }
  maxPoints?: number
  isOrganizer: boolean
  getTeamPlayers: (teamId: string) => string[]
  onAssignTerrain?: (matchId: string, terrain: number) => void
  onAutoAssignTerrain?: (matchId: string) => void  // A3 FIX: Auto-assignation terrain
  availableTerrains: number
  onWarning?: (message: string) => void
}

export default function MatchCard({
  match,
  maxPoints = 13,
  isOrganizer,
  getTeamPlayers,
  onAssignTerrain,
  onAutoAssignTerrain,  // A3 FIX: Auto-assignation terrain
  availableTerrains,
  onWarning
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
    <div className="bg-white rounded-xl p-4 shadow-md hover:shadow-lg transition-all">
      {/* Header - Statut et Terrain */}
      <div className="flex justify-between items-center mb-2">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          match.status === 'termine' ? 'bg-gray-100 text-gray-700' :
          match.status === 'en_cours' ? 'bg-green-100 text-green-700' :
          match.status === 'en_attente_validation' ? 'bg-orange-100 text-orange-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {match.status === 'termine' ? 'Terminé' :
           match.status === 'en_cours' ? 'En cours' :
           match.status === 'en_attente_validation' ? '⏳ En attente validation' :
           'À jouer'}
        </span>
        {/* A3 FIX: Affichage terrain amélioré */}
        {match.terrain ? (
          <span className="text-sm font-semibold text-gray-900">Terrain {match.terrain}</span>
        ) : match.status === 'a_jouer' && (
          <span className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
            À assigner
          </span>
        )}
      </div>

      {/* Équipes */}
      <div className="flex justify-between items-center">
        {/* Équipe A */}
        <div className="text-center flex-1">
          <p className="font-medium text-gray-900 text-xs sm:text-base truncate px-1">
            {match.equipe_a?.name || 'En attente'}
          </p>
          {/* I4 FIX: Noms joueurs plus lisibles */}
          {(() => {
            const players = match.equipe_a ? getTeamPlayers(match.equipe_a.id) : []
            if (players.length > 0) {
              return (
                <p className="text-xs text-gray-500 mt-0.5 px-1 truncate" title={players.join(', ')}>
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
        <div className="px-1 sm:px-4 text-gray-400 font-bold text-sm sm:text-base">VS</div>

        {/* Équipe B */}
        <div className="text-center flex-1">
          <p className="font-medium text-gray-900 text-xs sm:text-base truncate px-1">
            {match.equipe_b?.name || 'En attente'}
          </p>
          {/* I4 FIX: Noms joueurs plus lisibles */}
          {(() => {
            const players = match.equipe_b ? getTeamPlayers(match.equipe_b.id) : []
            if (players.length > 0) {
              return (
                <p className="text-xs text-gray-500 mt-0.5 px-1 truncate" title={players.join(', ')}>
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

      {/* A3 FIX: Actions pour match à jouer avec choix auto/manuel */}
      {match.status === 'a_jouer' && isOrganizer && onAssignTerrain && (
        <div className="mt-3 flex flex-col gap-2">
          {/* Ligne 1: Choix terrain (auto ou manuel) */}
          <div className="flex space-x-2">
            {/* Bouton Auto - assigne le premier terrain libre */}
            {onAutoAssignTerrain && !match.terrain && (
              <button
                onClick={() => onAutoAssignTerrain(match.id)}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium flex items-center gap-1"
                title="Assigner automatiquement le premier terrain libre"
              >
                <span>⚡</span> Auto
              </button>
            )}
            {/* Dropdown pour choix manuel */}
            <select
              value={match.terrain || ''}
              onChange={(e) => onAssignTerrain(match.id, parseInt(e.target.value))}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:border-green-500 text-sm"
              aria-label={`Sélectionner terrain pour ${match.equipe_a?.name || 'Équipe A'} vs ${match.equipe_b?.name || 'Équipe B'}`}
            >
              <option value="">Choisir terrain...</option>
              {Array.from({ length: availableTerrains }, (_, i) => (
                <option key={i + 1} value={i + 1}>Terrain {i + 1}</option>
              ))}
            </select>
          </div>
          {/* Ligne 2: Bouton Démarrer (apparaît quand terrain assigné) */}
          {match.terrain && (
            <button
              onClick={() => router.push(`/match/${match.id}`)}
              className="w-full px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all font-medium shadow-md"
            >
              ▶ Démarrer le match
            </button>
          )}
        </div>
      )}

    </div>
  )
}
