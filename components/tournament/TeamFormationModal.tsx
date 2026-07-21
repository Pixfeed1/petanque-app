/**
 * Modal de composition d'équipes (mode choisi) — V5
 * Onboarding guidé : progression visible, nom auto, récap des équipes,
 * répartition automatique du reste, et sortie claire vers le démarrage.
 */

'use client'

import { Users, X, Check, Plus, Loader, Sparkles, Play } from '@/components/Icons'
import type { Tournament, Team } from '@/hooks/tournament'
import type { Joueur } from '@/lib/types'

interface TeamFormationModalProps {
  tournament: Tournament
  teams: Team[]
  minTeams: number
  availablePlayers: Joueur[]
  selectedPlayerIds: string[]
  newTeamName: string
  suggestedName: string
  creatingTeam: boolean
  onClose: () => void
  onNameChange: (name: string) => void
  onTogglePlayer: (playerId: string) => void
  onCreate: () => Promise<void>
  onAutoFill: () => Promise<void>
  onFinish: () => void
  getPlayersPerTeam: (format: string) => number
}

export default function TeamFormationModal({
  tournament,
  teams,
  minTeams,
  availablePlayers,
  selectedPlayerIds,
  newTeamName,
  suggestedName,
  creatingTeam,
  onClose,
  onNameChange,
  onTogglePlayer,
  onCreate,
  onAutoFill,
  onFinish,
  getPlayersPerTeam
}: TeamFormationModalProps) {
  const playersPerTeam = getPlayersPerTeam(tournament.format)
  const teamsCount = teams.length
  const remaining = availablePlayers.length
  const teamsPossible = Math.floor(remaining / playersPerTeam)
  const canStart = teamsCount >= minTeams
  const canCreate = selectedPlayerIds.length === playersPerTeam
  const allAssigned = remaining === 0

  const formatLabel =
    tournament.format === 'tete_a_tete' ? 'Tête-à-tête · 1 joueur' :
    tournament.format === 'doublette' ? 'Doublette · 2 joueurs' : 'Triplette · 3 joueurs'

  return (
    <div className="fixed inset-0 bg-petanque-bois/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-petanque-sable-pale rounded-xl border border-petanque-sable-bord max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slideUp flex flex-col">
        {/* Header */}
        <div className="bg-petanque-vert px-6 py-5 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-medium text-white flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Compose tes équipes
            </h2>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="text-white hover:bg-white/15 rounded-md p-1.5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-white/80 text-sm mt-1.5">{formatLabel}</p>
        </div>

        {/* Bandeau de progression */}
        <div className="px-6 py-3.5 bg-white border-b border-petanque-sable-bord/60 flex-shrink-0 flex items-center gap-5 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] font-medium text-petanque-bois">Équipes</p>
            <p className="text-lg font-mono font-medium text-petanque-vert-fonce leading-tight">
              {teamsCount}
              <span className="text-sm text-petanque-bois"> / min {minTeams}</span>
            </p>
          </div>
          <div className="w-px h-8 bg-petanque-sable-bord/70" />
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] font-medium text-petanque-bois">Joueurs restants</p>
            <p className="text-lg font-mono font-medium text-petanque-vert-fonce leading-tight">{remaining}</p>
          </div>
          {teamsPossible > 0 && (
            <>
              <div className="w-px h-8 bg-petanque-sable-bord/70" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] font-medium text-petanque-bois">Encore possibles</p>
                <p className="text-lg font-mono font-medium text-petanque-vert-fonce leading-tight">
                  {teamsPossible} <span className="text-sm text-petanque-bois">équipe{teamsPossible > 1 ? 's' : ''}</span>
                </p>
              </div>
            </>
          )}
          {canStart && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] font-medium text-petanque-vert-fonce bg-petanque-vert-pale border border-petanque-vert/25 rounded-full px-3 py-1">
              <Check className="w-3.5 h-3.5" /> Assez d&apos;équipes pour démarrer
            </span>
          )}
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Récap des équipes déjà composées */}
          {teamsCount > 0 && (
            <div className="mb-6">
              <p className="text-[10px] uppercase tracking-[0.16em] font-medium text-petanque-bois mb-2">
                Équipes composées
              </p>
              <div className="flex flex-wrap gap-2">
                {teams.map(team => (
                  <span
                    key={team.id}
                    className="inline-flex items-center gap-1.5 bg-white border border-petanque-sable-bord rounded-full pl-1 pr-3 py-1 text-sm text-petanque-vert-fonce"
                  >
                    <span className="w-5 h-5 rounded-full bg-petanque-vert-pale text-petanque-vert-fonce flex items-center justify-center text-[11px] font-medium">
                      <Check className="w-3 h-3" />
                    </span>
                    {team.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {allAssigned ? (
            /* État final : tous les joueurs sont répartis */
            <div className="text-center py-10 bg-white rounded-lg border border-petanque-vert/25">
              <div className="w-12 h-12 rounded-full bg-petanque-vert-pale flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-petanque-vert" />
              </div>
              <p className="text-lg font-medium text-petanque-vert-fonce mb-1">
                {teamsCount} équipe{teamsCount > 1 ? 's' : ''} composée{teamsCount > 1 ? 's' : ''}
              </p>
              <p className="text-sm text-petanque-bois max-w-sm mx-auto">
                {canStart
                  ? 'Tous les joueurs sont répartis. Tu peux lancer le tournoi.'
                  : `Il faut au moins ${minTeams} équipes pour démarrer. Ajoute des joueurs dans l'onglet Joueurs pour en composer davantage.`}
              </p>
            </div>
          ) : (
            <>
              {/* Nom de l'équipe (optionnel) */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-petanque-vert-fonce mb-2">
                  Nom de l&apos;équipe <span className="text-petanque-bois font-normal">— optionnel</span>
                </label>
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => onNameChange(e.target.value)}
                  placeholder={suggestedName}
                  maxLength={50}
                  className="w-full px-4 py-3 border border-petanque-sable-bord rounded-lg bg-white text-petanque-vert-fonce placeholder:text-petanque-bois/50 focus:border-petanque-vert focus:outline-none transition-colors"
                />
                <p className="text-xs text-petanque-bois mt-1">
                  Laisse vide pour nommer automatiquement <span className="text-petanque-vert-fonce font-medium">« {suggestedName} »</span>.
                </p>
              </div>

              {/* Sélection des joueurs */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-petanque-vert-fonce mb-2">
                  Choisis les joueurs
                  <span className={`ml-2 font-mono ${canCreate ? 'text-petanque-vert' : 'text-petanque-bois'}`}>
                    ({selectedPlayerIds.length}/{playersPerTeam})
                  </span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                  {availablePlayers.map((player) => {
                    const isSelected = selectedPlayerIds.includes(player.id)
                    const isDisabled = !isSelected && selectedPlayerIds.length >= playersPerTeam

                    return (
                      <button
                        key={player.id}
                        onClick={() => !isDisabled && onTogglePlayer(player.id)}
                        disabled={isDisabled}
                        className={`p-3.5 rounded-lg border transition-colors text-left ${
                          isSelected
                            ? 'border-petanque-vert bg-petanque-vert-pale'
                            : isDisabled
                            ? 'border-petanque-sable-bord bg-petanque-sable-pale opacity-50 cursor-not-allowed'
                            : 'border-petanque-sable-bord bg-white hover:border-petanque-vert/40 hover:bg-petanque-sable-pale'
                        }`}
                      >
                        <div className="flex items-center">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-medium mr-3 ${
                            player.gender === 'F' ? 'bg-petanque-cochonnet' : 'bg-petanque-vert'
                          }`}>
                            {player.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-petanque-vert-fonce truncate">{player.name}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              player.gender === 'F'
                                ? 'bg-petanque-cochonnet/15 text-petanque-cochonnet-fonce'
                                : 'bg-petanque-vert-pale text-petanque-vert-fonce'
                            }`}>
                              {player.gender === 'F' ? 'F' : 'H'}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="text-petanque-vert flex-shrink-0">
                              <Check className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Créer l'équipe */}
              <button
                onClick={onCreate}
                disabled={creatingTeam || !canCreate}
                className="w-full px-6 py-3 bg-petanque-vert text-white rounded-lg font-semibold hover:bg-petanque-vert-fonce transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {creatingTeam ? (
                  <><Loader className="w-5 h-5 animate-spin" /><span className="ml-2">Création…</span></>
                ) : (
                  <><Plus className="w-5 h-5" /><span className="ml-2">Créer l&apos;équipe</span></>
                )}
              </button>

              {/* Escape hatch : répartition automatique du reste */}
              {teamsPossible >= 1 && (
                <div className="mt-4 bg-white border border-petanque-sable-bord rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-5 h-5 text-petanque-cochonnet flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-petanque-vert-fonce">Trop long à la main ?</p>
                      <p className="text-xs text-petanque-bois">
                        Répartis les {remaining} joueurs restants en {teamsPossible} équipe{teamsPossible > 1 ? 's' : ''} au hasard.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onAutoFill}
                    disabled={creatingTeam}
                    className="px-4 py-2 text-sm font-medium text-petanque-vert-fonce border border-petanque-vert/40 hover:bg-petanque-vert-pale rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                  >
                    Répartir automatiquement
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Pied : fermer / démarrer */}
        <div className="px-6 py-4 bg-white border-t border-petanque-sable-bord/60 flex-shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 text-petanque-bois border border-petanque-sable-bord hover:text-petanque-vert-fonce hover:bg-petanque-sable-pale rounded-lg transition-colors"
          >
            {canStart ? 'Continuer plus tard' : 'Fermer'}
          </button>
          {canStart && (
            <button
              onClick={onFinish}
              disabled={creatingTeam}
              className="flex-1 px-6 py-3 bg-petanque-vert text-white rounded-lg font-semibold hover:bg-petanque-vert-fonce transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              <Play className="w-5 h-5" /><span className="ml-2">Démarrer le tournoi</span>
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  )
}
