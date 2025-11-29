'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTournamentData } from '@/hooks/tournament/useTournamentData'
import { useRankings } from '@/hooks/tournament/useRankings'
import { StandingsTable } from '@/components/tournament'
import { useToast } from '@/components/ui/Toast'
import {
  Petanque, Trophy, Users, Flag, Loader, Grid, Chart,
  Check, Clock, Play, ArrowRight
} from '@/components/Icons'

/**
 * Page dédiée aux poules du tournoi
 * - Vue globale de TOUTES les poules
 * - Classement + Matchs pour chaque poule
 * - Navigation directe vers les matchs
 */
export default function PoulesPage() {
  const params = useParams()
  const router = useRouter()
  const { showWarning } = useToast()

  const {
    tournament,
    teams,
    matches,
    loading,
    isOrganizer
  } = useTournamentData({ tournamentId: params.id })

  const {
    teamsByPoule,
    teamsWithStats
  } = useRankings({
    tournament,
    teams,
    matches
  })

  // Filtrer uniquement les matchs de poule
  const pouleMatches = useMemo(() => {
    return matches.filter(m => m.type === 'poule')
  }, [matches])

  // Grouper les matchs par poule
  const matchesByPoule = useMemo(() => {
    const grouped: { [key: string]: typeof matches } = {}
    pouleMatches.forEach(match => {
      const poule = match.poule || 'A'
      if (!grouped[poule]) grouped[poule] = []
      grouped[poule].push(match)
    })
    return grouped
  }, [pouleMatches])

  // Stats globales des poules
  const pouleStats = useMemo(() => {
    const total = pouleMatches.length
    const played = pouleMatches.filter(m => m.status === 'termine').length
    const inProgress = pouleMatches.filter(m => m.status === 'en_cours').length
    const pending = pouleMatches.filter(m => m.status === 'a_jouer').length
    return { total, played, inProgress, pending, progress: total > 0 ? (played / total) * 100 : 0 }
  }, [pouleMatches])

  // Noms des poules triés
  const pouleNames = useMemo(() => {
    return Object.keys(teamsByPoule).sort()
  }, [teamsByPoule])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-12 shadow-2xl">
              <Loader className="w-12 h-12 animate-spin mx-auto text-green-600" />
              <p className="mt-4 text-lg font-medium text-gray-600">Chargement des poules...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">Tournoi introuvable</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 px-6 py-3 bg-green-600 text-white rounded-xl"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push(`/tournoi/${params.id}`)}
                className="group flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                <span>←</span>
                <span className="font-medium">Retour au tournoi</span>
              </button>

              <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
                  <Grid className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Poules du tournoi
                  </h1>
                  <p className="text-sm text-gray-500">{tournament.name}</p>
                </div>
              </div>
            </div>

            {/* Actions rapides */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => router.push(`/tournoi/${params.id}/export`)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                Exporter
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats globales des poules */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Phase de poules</h2>
              <p className="text-gray-600">
                {pouleNames.length} poule{pouleNames.length > 1 ? 's' : ''} -
                {teams.length} equipe{teams.length > 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{pouleStats.played}</p>
                <p className="text-sm text-gray-500">Termines</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-500">{pouleStats.inProgress}</p>
                <p className="text-sm text-gray-500">En cours</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-400">{pouleStats.pending}</p>
                <p className="text-sm text-gray-500">A jouer</p>
              </div>
            </div>
          </div>

          {/* Barre de progression globale */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Progression globale</span>
              <span className="text-sm font-bold text-gray-900">{Math.round(pouleStats.progress)}%</span>
            </div>
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${pouleStats.progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Message si pas de poules */}
        {pouleNames.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Grid className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune poule generee</h3>
            <p className="text-gray-600 mb-6">
              Les poules seront creees au demarrage du tournoi.
            </p>
            <button
              onClick={() => router.push(`/tournoi/${params.id}`)}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold"
            >
              Retour au tournoi
            </button>
          </div>
        )}

        {/* Grille des poules */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {pouleNames.map(pouleName => {
            const pouleTeams = teamsByPoule[pouleName] || []
            const pouleMatchList = matchesByPoule[pouleName] || []
            const playedCount = pouleMatchList.filter(m => m.status === 'termine').length
            const totalCount = pouleMatchList.length

            return (
              <div key={pouleName} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Header de la poule */}
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold flex items-center">
                      <Trophy className="w-6 h-6 mr-2" />
                      Poule {pouleName}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm opacity-80">
                        {playedCount}/{totalCount} matchs
                      </span>
                      {playedCount === totalCount && totalCount > 0 && (
                        <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-bold">
                          Complete
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Classement de la poule */}
                <div className="p-4 border-b border-gray-100">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                    <Chart className="w-4 h-4 mr-2" />
                    Classement
                  </h4>
                  {pouleTeams.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-500 text-xs">
                            <th className="text-left py-2 px-2">#</th>
                            <th className="text-left py-2 px-2">Equipe</th>
                            <th className="text-center py-2 px-1">J</th>
                            <th className="text-center py-2 px-1">V</th>
                            <th className="text-center py-2 px-1">Diff</th>
                            <th className="text-center py-2 px-1">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {pouleTeams.map((team, index) => (
                            <tr key={team.id} className={`border-t border-gray-50 ${
                              index < (tournament.settings.qualifiedPerPoule || 2)
                                ? 'bg-green-50/50'
                                : ''
                            }`}>
                              <td className="py-2 px-2 font-bold text-gray-600">
                                {index === 0 && '🥇'}
                                {index === 1 && '🥈'}
                                {index === 2 && '🥉'}
                                {index > 2 && (index + 1)}
                              </td>
                              {/* I3 FIX: Noms équipes plus lisibles sur mobile */}
                              <td className="py-2 px-2 font-medium text-gray-900 max-w-[150px] sm:max-w-none">
                                <span className="block truncate" title={team.name}>{team.name}</span>
                              </td>
                              <td className="py-2 px-1 text-center text-gray-600">
                                {team.played || 0}
                              </td>
                              <td className="py-2 px-1 text-center font-bold text-green-600">
                                {team.victories || 0}
                              </td>
                              <td className="py-2 px-1 text-center">
                                <span className={`font-medium ${
                                  (team.difference || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {(team.difference || 0) >= 0 ? '+' : ''}{team.difference || 0}
                                </span>
                              </td>
                              <td className="py-2 px-1 text-center font-bold text-gray-900">
                                {(team.victories || 0) * 3 + (team.draws || 0)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Aucune equipe</p>
                  )}
                </div>

                {/* Matchs de la poule */}
                <div className="p-4">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                    <Flag className="w-4 h-4 mr-2" />
                    Matchs
                  </h4>
                  {pouleMatchList.length > 0 ? (
                    <div className="space-y-2">
                      {pouleMatchList.map(match => (
                        <div
                          key={match.id}
                          onClick={() => {
                            if (match.status === 'a_jouer' && !match.terrain) {
                              showWarning('Assignez d\'abord un terrain au match')
                              return
                            }
                            router.push(`/match/${match.id}`)
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                            match.status === 'termine'
                              ? 'bg-gray-50 hover:bg-gray-100'
                              : match.status === 'en_cours'
                              ? 'bg-green-50 hover:bg-green-100 border-2 border-green-200'
                              : 'bg-yellow-50 hover:bg-yellow-100'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 truncate text-sm">
                                {match.equipe_a?.name || 'Equipe A'}
                              </span>
                              <span className="text-gray-400 text-xs">vs</span>
                              <span className="font-medium text-gray-900 truncate text-sm">
                                {match.equipe_b?.name || 'Equipe B'}
                              </span>
                            </div>
                            {match.terrain && (
                              <p className="text-xs text-gray-500 mt-1">Terrain {match.terrain}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2 ml-2">
                            {match.status === 'termine' ? (
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-gray-900">
                                  {match.score_a} - {match.score_b}
                                </span>
                                <Check className="w-4 h-4 text-green-600" />
                              </div>
                            ) : match.status === 'en_cours' ? (
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-green-700">
                                  {match.score_a ?? 0} - {match.score_b ?? 0}
                                </span>
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-yellow-600">
                                <Clock className="w-4 h-4" />
                                <span className="text-xs font-medium">A jouer</span>
                              </div>
                            )}
                            <ArrowRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">Aucun match</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions en bas de page */}
        {pouleStats.progress === 100 && pouleNames.length > 0 && (
          <div className="mt-8 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Phase de poules terminee !
            </h3>
            <p className="text-gray-600 mb-4">
              Vous pouvez maintenant generer les phases finales.
            </p>
            <button
              onClick={() => router.push(`/tournoi/${params.id}`)}
              className="px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
            >
              Generer les phases finales
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
