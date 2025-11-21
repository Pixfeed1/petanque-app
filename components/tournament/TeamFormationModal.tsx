/**
 * Modal de composition d'équipes (mode choisi)
 */

'use client'

import { Users, X, Check, Plus, Loader, Info } from '@/components/Icons'
import type { Tournament } from '@/hooks/tournament'
import type { Joueur } from '@/lib/types'

interface TeamFormationModalProps {
  tournament: Tournament
  availablePlayers: Joueur[]
  selectedPlayerIds: string[]
  newTeamName: string
  creatingTeam: boolean
  onClose: () => void
  onNameChange: (name: string) => void
  onTogglePlayer: (playerId: string) => void
  onCreate: () => Promise<void>
  getPlayersPerTeam: (format: string) => number
}

export default function TeamFormationModal({
  tournament,
  availablePlayers,
  selectedPlayerIds,
  newTeamName,
  creatingTeam,
  onClose,
  onNameChange,
  onTogglePlayer,
  onCreate,
  getPlayersPerTeam
}: TeamFormationModalProps) {
  const playersPerTeam = getPlayersPerTeam(tournament.format)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Users className="w-6 h-6 mr-2" />
              Composer une nouvelle équipe
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-blue-100 mt-2">
            Format : {tournament.format === 'tete_a_tete' ? 'Tête-à-tête (1 joueur)' :
                     tournament.format === 'doublette' ? 'Doublette (2 joueurs)' : 'Triplette (3 joueurs)'}
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Nom de l'équipe */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nom de l&apos;équipe *
            </label>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Ex: Les Champions, Team Rocket..."
              maxLength={50}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all"
            />
            <p className="text-xs text-gray-500 mt-1">
              {newTeamName.length}/50 caractères
            </p>
          </div>

          {/* Sélection des joueurs */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sélectionner les joueurs *
              <span className="ml-2 text-blue-600">
                ({selectedPlayerIds.length}/{playersPerTeam})
              </span>
            </label>

            {availablePlayers.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-gray-200">
                <div className="text-4xl mb-3">
                  {selectedPlayerIds.length > 0 ? '✅' : '👥'}
                </div>
                <p className="text-gray-700 font-medium mb-2">
                  {selectedPlayerIds.length > 0
                    ? 'Tous les joueurs sont déjà assignés'
                    : 'Aucun joueur disponible'}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedPlayerIds.length > 0
                    ? 'Tous les joueurs de l\'organisation sont déjà dans des équipes.'
                    : 'Ajoutez des joueurs dans l\'onglet "Joueurs" d\'abord'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {availablePlayers.map((player) => {
                  const isSelected = selectedPlayerIds.includes(player.id)
                  const isDisabled = !isSelected && selectedPlayerIds.length >= playersPerTeam

                  return (
                    <button
                      key={player.id}
                      onClick={() => !isDisabled && onTogglePlayer(player.id)}
                      disabled={isDisabled}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : isDisabled
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold mr-3 ${
                          player.gender === 'F' ? 'bg-gradient-to-br from-pink-500 to-rose-600' : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                        }`}>
                          {player.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-medium text-gray-900">{player.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            player.gender === 'F'
                              ? 'bg-pink-100 text-pink-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {player.gender === 'F' ? 'F' : 'H'}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="text-blue-500">
                            <Check className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
            <div className="flex items-start">
              <div className="text-blue-600 mr-3">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 mb-1">Comment ça marche ?</h4>
                <p className="text-sm text-blue-700">
                  1. Donnez un nom à votre équipe<br/>
                  2. Sélectionnez {tournament.format === 'tete_a_tete' ? '1 joueur' :
                                   tournament.format === 'doublette' ? '2 joueurs' : '3 joueurs'}<br/>
                  3. Cliquez sur &quot;Créer l&apos;équipe&quot;<br/>
                  4. Répétez pour créer toutes les équipes du tournoi
                </p>
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              Fermer
            </button>
            <button
              onClick={onCreate}
              disabled={creatingTeam || !newTeamName.trim() || selectedPlayerIds.length !== playersPerTeam}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {creatingTeam ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span className="ml-2">Création...</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span className="ml-2">Créer l&apos;équipe</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}
