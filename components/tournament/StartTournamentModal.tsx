/**
 * Modal de démarrage du tournoi — V4
 * Permet de configurer les poules avant de lancer
 */

'use client'

import { Flag } from '@/components/Icons'
import type { Tournament, Team } from '@/hooks/tournament'

interface StartTournamentModalProps {
  tournament: Tournament
  teams: Team[]
  onClose: () => void
  onStart: () => Promise<void>
  onUpdateTournament: (tournament: Tournament) => void
  isValidPoolConfiguration: (teamCount: number, poolSize: number) => boolean
  getValidPoolSizes: (teamCount: number) => number[]
  getPoolDistribution: (teamCount: number, poolSize: number) => number[]
}

export default function StartTournamentModal({
  tournament,
  teams,
  onClose,
  onStart,
  onUpdateTournament,
  isValidPoolConfiguration,
  getValidPoolSizes,
  getPoolDistribution
}: StartTournamentModalProps) {
  const pouleSize = tournament.settings.pouleSize || 4

  return (
    <div className="fixed inset-0 bg-petanque-bois/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-petanque-sable-pale rounded-xl border border-petanque-sable-bord max-w-md w-full overflow-hidden animate-slideUp">
        {/* Header flat V4 */}
        <div className="bg-petanque-vert px-6 py-5">
          <h2 className="text-xl font-medium text-white flex items-center">
            <Flag className="w-5 h-5" />
            <span className="ml-3">Démarrer le tournoi</span>
          </h2>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-medium text-petanque-vert-fonce mb-3">Configuration des poules</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-petanque-vert-fonce mb-1">
                  Taille des poules
                </label>
                <select
                  value={pouleSize}
                  onChange={(e) => onUpdateTournament({
                    ...tournament,
                    settings: { ...tournament.settings, pouleSize: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-2 border border-petanque-sable-bord rounded-lg bg-white text-petanque-vert-fonce focus:border-petanque-vert focus:outline-none transition-colors"
                  disabled={teams.length < 4}
                >
                  {teams.length < 4 ? (
                    <option value={teams.length}>{teams.length} équipes (minimum requis: 4)</option>
                  ) : (
                    <>
                      {getValidPoolSizes(teams.length).map(size => (
                        <option key={size} value={size}>
                          {size} équipes par poule
                        </option>
                      ))}
                      {getValidPoolSizes(teams.length).length === 0 && (
                        <option value={4}>Aucune configuration valide disponible</option>
                      )}
                    </>
                  )}
                </select>
                {teams.length < 4 ? (
                  <p className="text-xs text-petanque-cochonnet-fonce mt-1">
                    Minimum 4 équipes requises pour un tournoi par poules
                  </p>
                ) : !isValidPoolConfiguration(teams.length, pouleSize) ? (
                  <p className="text-xs text-petanque-cochonnet-fonce mt-1">
                    Configuration invalide : cette répartition créerait des poules déséquilibrées
                  </p>
                ) : null}
              </div>

              {tournament.mode === 'melee_tournante' && (
                <div>
                  <label className="block text-sm font-medium text-petanque-vert-fonce mb-1">
                    Rotation des équipes
                  </label>
                  <select
                    value={tournament.settings.meleeRotation || 'par_tour'}
                    onChange={(e) => onUpdateTournament({
                      ...tournament,
                      settings: { ...tournament.settings, meleeRotation: e.target.value as any }
                    })}
                    className="w-full px-4 py-2 border border-petanque-sable-bord rounded-lg bg-white text-petanque-vert-fonce focus:border-petanque-vert focus:outline-none transition-colors"
                  >
                    <option value="par_tour">Rotation par tour (recommandé)</option>
                    <option value="par_match">Rotation après chaque match</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {teams.length >= 4 ? (
            isValidPoolConfiguration(teams.length, pouleSize) ? (
              <div className="bg-petanque-vert-pale border border-petanque-vert/20 rounded-lg p-4 mb-6">
                <p className="text-sm text-petanque-vert-fonce mb-2">
                  ✓ Le tournoi va démarrer avec {teams.length} équipes réparties en {getPoolDistribution(teams.length, pouleSize).length} poule{getPoolDistribution(teams.length, pouleSize).length > 1 ? 's' : ''} :
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-petanque-vert-fonce">
                  {getPoolDistribution(teams.length, pouleSize).map((size, i) => (
                    <span key={i} className="bg-white border border-petanque-sable-bord px-2 py-1 rounded-md font-medium">
                      Poule {String.fromCharCode(65 + i)}: {size} équipe{size > 1 ? 's' : ''}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-petanque-bois mt-2">
                  Les matchs seront générés automatiquement.
                </p>
              </div>
            ) : (
              <div className="bg-petanque-cochonnet/10 border border-petanque-cochonnet/40 rounded-lg p-4 mb-6">
                <p className="text-sm text-petanque-cochonnet-fonce font-medium mb-2">
                  Configuration invalide : répartition déséquilibrée
                </p>
                <p className="text-xs text-petanque-bois">
                  Cette configuration créerait des poules avec trop peu d&apos;équipes. Veuillez choisir une autre taille de poule.
                </p>
              </div>
            )
          ) : (
            <div className="bg-petanque-cochonnet/10 border border-petanque-cochonnet/40 rounded-lg p-4 mb-6">
              <p className="text-sm text-petanque-cochonnet-fonce font-medium">
                Impossible de démarrer : vous avez seulement {teams.length} équipe{teams.length > 1 ? 's' : ''}.
                Minimum requis : 4 équipes pour un tournoi par poules.
              </p>
              <p className="text-xs text-petanque-bois mt-2">
                Ajoutez {4 - teams.length} équipe{4 - teams.length > 1 ? 's' : ''} supplémentaire{4 - teams.length > 1 ? 's' : ''} avant de démarrer.
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 text-petanque-bois border border-petanque-sable-bord hover:text-petanque-vert-fonce hover:bg-petanque-sable-pale rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onStart}
              disabled={teams.length < 4 || !isValidPoolConfiguration(teams.length, pouleSize)}
              className="flex-1 px-6 py-3 bg-petanque-vert text-white rounded-lg font-semibold hover:bg-petanque-vert-fonce transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-petanque-vert"
            >
              Démarrer
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
