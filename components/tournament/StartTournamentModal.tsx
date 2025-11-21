/**
 * Modal de démarrage du tournoi
 * Permet de configurer les poules avant de lancer
 */

'use client'

import { Flag, Loader } from '@/components/Icons'
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Flag className="w-6 h-6" />
            <span className="ml-3">Démarrer le tournoi</span>
          </h2>
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3">Configuration des poules</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Taille des poules
                </label>
                <select
                  value={pouleSize}
                  onChange={(e) => onUpdateTournament({
                    ...tournament,
                    settings: { ...tournament.settings, pouleSize: parseInt(e.target.value) }
                  })}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500"
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
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ Minimum 4 équipes requises pour un tournoi par poules
                  </p>
                ) : !isValidPoolConfiguration(teams.length, pouleSize) ? (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ Configuration invalide : cette répartition créerait des poules déséquilibrées
                  </p>
                ) : null}
              </div>

              {tournament.mode === 'melee_tournante' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rotation des équipes
                  </label>
                  <select
                    value={tournament.settings.meleeRotation || 'par_tour'}
                    onChange={(e) => onUpdateTournament({
                      ...tournament,
                      settings: { ...tournament.settings, meleeRotation: e.target.value as any }
                    })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-green-500"
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
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-6">
                <p className="text-sm text-gray-600 mb-2">
                  ✓ Le tournoi va démarrer avec {teams.length} équipes réparties en {getPoolDistribution(teams.length, pouleSize).length} poule{getPoolDistribution(teams.length, pouleSize).length > 1 ? 's' : ''} :
                </p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-700">
                  {getPoolDistribution(teams.length, pouleSize).map((size, i) => (
                    <span key={i} className="bg-white px-2 py-1 rounded-lg font-medium">
                      Poule {String.fromCharCode(65 + i)}: {size} équipe{size > 1 ? 's' : ''}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Les matchs seront générés automatiquement.
                </p>
              </div>
            ) : (
              <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 mb-6 border-2 border-orange-300">
                <p className="text-sm text-orange-700 font-medium mb-2">
                  ⚠️ Configuration invalide : répartition déséquilibrée
                </p>
                <p className="text-xs text-orange-600">
                  Cette configuration créerait des poules avec trop peu d&apos;équipes. Veuillez choisir une autre taille de poule.
                </p>
              </div>
            )
          ) : (
            <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 mb-6 border-2 border-red-200">
              <p className="text-sm text-red-700 font-medium">
                ❌ Impossible de démarrer : Vous avez seulement {teams.length} équipe{teams.length > 1 ? 's' : ''}.
                Minimum requis : 4 équipes pour un tournoi par poules.
              </p>
              <p className="text-xs text-red-600 mt-2">
                Ajoutez {4 - teams.length} équipe{4 - teams.length > 1 ? 's' : ''} supplémentaire{4 - teams.length > 1 ? 's' : ''} avant de démarrer.
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              Annuler
            </button>
            <button
              onClick={onStart}
              disabled={teams.length < 4 || !isValidPoolConfiguration(teams.length, pouleSize)}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg"
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
