/**
 * Modal de composition d'équipes (mode choisi) — V4
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
    <div className="fixed inset-0 bg-petanque-bois/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-petanque-sable-pale rounded-xl border border-petanque-sable-bord max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
        {/* Header flat V4 */}
        <div className="bg-petanque-vert px-6 py-5">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medium text-white flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Composer une nouvelle équipe
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/15 rounded-md p-1.5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/80 text-sm mt-1.5">
            Format : {tournament.format === 'tete_a_tete' ? 'Tête-à-tête (1 joueur)' :
                     tournament.format === 'doublette' ? 'Doublette (2 joueurs)' : 'Triplette (3 joueurs)'}
          </p>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Nom de l'équipe */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-petanque-vert-fonce mb-2">
              Nom de l&apos;équipe *
            </label>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Ex: Les Champions, Team Rocket…"
              maxLength={50}
              className="w-full px-4 py-3 border border-petanque-sable-bord rounded-lg bg-white text-petanque-vert-fonce placeholder:text-petanque-bois/60 focus:border-petanque-vert focus:outline-none transition-colors"
            />
            <p className="text-xs text-petanque-bois mt-1">
              {newTeamName.length}/50 caractères
            </p>
          </div>

          {/* Sélection des joueurs */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-petanque-vert-fonce mb-2">
              Sélectionner les joueurs *
              <span className="ml-2 text-petanque-vert">
                ({selectedPlayerIds.length}/{playersPerTeam})
              </span>
            </label>

            {availablePlayers.length === 0 ? (
              <div className="text-center py-8 bg-white rounded-lg border border-petanque-sable-bord">
                <Users className="w-8 h-8 mx-auto mb-3 text-petanque-bois" />
                <p className="text-petanque-vert-fonce font-medium mb-2">
                  {selectedPlayerIds.length > 0
                    ? 'Tous les joueurs sont déjà assignés'
                    : 'Aucun joueur disponible'}
                </p>
                <p className="text-sm text-petanque-bois">
                  {selectedPlayerIds.length > 0
                    ? "Tous les joueurs de l'organisation sont déjà dans des équipes."
                    : "Ajoutez des joueurs dans l'onglet Joueurs d'abord"}
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
                      className={`p-4 rounded-lg border transition-colors ${
                        isSelected
                          ? 'border-petanque-vert bg-petanque-vert-pale'
                          : isDisabled
                          ? 'border-petanque-sable-bord bg-petanque-sable-pale opacity-50 cursor-not-allowed'
                          : 'border-petanque-sable-bord bg-white hover:border-petanque-vert/40 hover:bg-petanque-sable-pale'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium mr-3 ${
                          player.gender === 'F' ? 'bg-petanque-cochonnet' : 'bg-petanque-vert'
                        }`}>
                          {player.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-medium text-petanque-vert-fonce">{player.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            player.gender === 'F'
                              ? 'bg-petanque-cochonnet/15 text-petanque-cochonnet-fonce'
                              : 'bg-petanque-vert-pale text-petanque-vert-fonce'
                          }`}>
                            {player.gender === 'F' ? 'F' : 'H'}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="text-petanque-vert">
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
          <div className="bg-petanque-vert-pale border border-petanque-vert/20 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-petanque-vert mr-3">
                <Info className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-medium text-petanque-vert-fonce mb-1">Comment ça marche ?</h4>
                <p className="text-sm text-petanque-vert-fonce">
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
              className="flex-1 px-6 py-3 text-petanque-bois border border-petanque-sable-bord hover:text-petanque-vert-fonce hover:bg-petanque-sable-pale rounded-lg transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={onCreate}
              disabled={creatingTeam || !newTeamName.trim() || selectedPlayerIds.length !== playersPerTeam}
              className="flex-1 px-6 py-3 bg-petanque-vert text-white rounded-lg font-semibold hover:bg-petanque-vert-fonce transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {creatingTeam ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  <span className="ml-2">Création…</span>
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
