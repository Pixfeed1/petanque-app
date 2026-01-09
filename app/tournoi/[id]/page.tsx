/**
 * Page de détail d'un tournoi - Version refactorisée
 * Utilise les hooks extraits pour une meilleure maintenabilité
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import AdBanner from '@/components/AdBanner'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'

// Hooks
import {
  useTournamentData,
  useTeamManagement,
  useMatchActions,
  useRotation,
  useRankings
} from '@/hooks/tournament'

// Composants
import {
  TournamentHeader,
  TournamentInfoCards,
  MatchCard,
  StandingsTable,
  PlayerRankingsTable,
  StartTournamentModal,
  RenameTeamModal,
  TeamFormationModal
} from '@/components/tournament'
import type { TeamStanding, PlayerRanking } from '@/components/tournament'

// Icons
import {
  Petanque, Trophy, Users, Play, Flag, Clock, Calendar,
  Settings, Check, X, Plus, Loader, Shuffle, Chart,
  Edit, Refresh, Sparkles, Lightning, Arrow, Grid, Medal, Info
} from '@/components/Icons'

export default function TournamentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const { showSuccess, showError, showWarning } = useToast()
  const { confirm, ConfirmModal } = useConfirm()

  // UI state
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'matchs' | 'classement' | 'equipes'>('matchs')
  const [currentPhase, setCurrentPhase] = useState<'poules' | 'elimination' | 'finale'>('poules')
  const [showStartModal, setShowStartModal] = useState(false)
  const [generatingPhases, setGeneratingPhases] = useState(false)  // C5 FIX: Loader pour génération phases

  // Hook principal - données du tournoi
  const {
    tournament,
    setTournament,
    teams,
    setTeams,
    matches,
    setMatches,
    loading,
    error,  // C4 FIX: Récupérer l'erreur du hook
    isOrganizer,
    userPlan,
    loadTournamentData
  } = useTournamentData({ tournamentId: params.id })

  // Hook gestion des équipes
  const {
    availablePlayers,
    selectedPlayerIds,
    newTeamNameForCreation,
    setNewTeamNameForCreation,
    creatingTeam,
    editingTeam,
    setEditingTeam,
    newTeamName,
    setNewTeamName,
    showTeamFormation,
    setShowTeamFormation,
    togglePlayerSelection,
    createTeamWithPlayers,
    renameTeam,
    getPlayersPerTeam,
    getTeamPlayers,
    resetTeamFormation
  } = useTeamManagement({
    tournament,
    teams,
    loadTournamentData,
    onSuccess: showSuccess,
    onError: showError,
    onWarning: showWarning
  })

  // Callback pour confirmation de conflit terrain
  const handleConfirmTerrainConflict = useCallback(async (message: string) => {
    return await confirm({
      title: 'Conflit de terrain',
      message,
      confirmText: 'Assigner quand même',
      variant: 'warning'
    })
  }, [confirm])

  // Hook gestion des matchs
  const {
    isValidPoolConfiguration,
    getValidPoolSizes,
    getPoolDistribution,
    generatePoules,
    generateEliminationPhases,
    generateFinales,
    assignTerrain,
    autoAssignTerrain  // A3 FIX: Auto-assignation terrain
  } = useMatchActions({
    tournament,
    teams,
    matches,
    loadTournamentData,
    getTeamPlayers,
    onSuccess: showSuccess,
    onError: showError,
    onWarning: showWarning,
    onConfirmTerrainConflict: handleConfirmTerrainConflict
  })

  // Hook rotation (mêlée tournante)
  const {
    currentRotation,
    isRotationAvailable,
    reformTeamsForRotation
  } = useRotation({
    tournament,
    teams,
    matches,
    loadTournamentData,
    onSuccess: showSuccess,
    onError: showError,
    onWarning: showWarning
  })

  // Hook classements
  const {
    teamsWithStats,
    teamsByPoule,
    individualRankings,
    refreshingClassement,
    loadIndividualRankings,
    refreshClassement
  } = useRankings({
    tournament,
    teams,
    matches
  })

  // Effet pour charger les classements individuels
  useEffect(() => {
    if (tournament?.mode === 'melee_tournante') {
      loadIndividualRankings()
    }
  }, [tournament?.mode, loadIndividualRankings])

  // Monté
  useEffect(() => {
    setMounted(true)
  }, [])

  // FIX UX Mode Choisi: Afficher l'onglet Équipes par défaut si aucune équipe n'existe
  useEffect(() => {
    if (tournament?.mode === 'choisi' && teams.length === 0 && tournament.status === 'preparation') {
      setActiveTab('equipes')
    }
  }, [tournament?.mode, tournament?.status, teams.length])

  // Mettre a jour la phase actuelle en fonction des matchs
  useEffect(() => {
    if (!matches || matches.length === 0) {
      setCurrentPhase('poules')
      return
    }

    const hasFinale = matches.some(m => m.type === 'finale' || m.type === 'petite_finale')
    const hasElimination = matches.some(m =>
      m.type === 'huitieme' || m.type === 'quart' || m.type === 'demi'
    )

    if (hasFinale) {
      setCurrentPhase('finale')
    } else if (hasElimination) {
      setCurrentPhase('elimination')
    } else {
      setCurrentPhase('poules')
    }
  }, [matches])


  // Démarrer le tournoi
  const handleStartTournament = async () => {
    if (!tournament) return

    // Validation
    if (teams.length < 4) {
      showError(`Minimum 4 équipes requises. Vous avez ${teams.length} équipe(s).`)
      return
    }

    try {
      if (matches.length === 0) {
        await generatePoules()
      }

      const response = await fetch(`/api/tournois/${tournament.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'en_cours' })
      })

      if (response.ok) {
        setTournament({ ...tournament, status: 'en_cours' })
        setShowStartModal(false)
      }
    } catch (error) {
      console.error('Erreur démarrage tournoi:', error)
    }
  }

  // C5 FIX: Handler pour génération phases finales avec loader
  const handleGenerateEliminationPhases = async () => {
    setGeneratingPhases(true)
    try {
      await generateEliminationPhases()
    } finally {
      setGeneratingPhases(false)
    }
  }

  // C5 FIX: Handler pour génération finale avec loader
  const handleGenerateFinales = async () => {
    setGeneratingPhases(true)
    try {
      await generateFinales()
    } finally {
      setGeneratingPhases(false)
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-12 shadow-2xl">
              <Loader className="w-12 h-12 animate-spin mx-auto text-green-600" />
              <p className="mt-4 text-lg font-medium text-gray-600">Chargement du tournoi...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // C4 FIX: Afficher l'erreur à l'utilisateur
  if (error || !tournament) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-white rounded-3xl p-8 shadow-2xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {error ? 'Erreur de chargement' : 'Tournoi introuvable'}
            </p>
            {error && (
              <p className="text-gray-600 mb-4">{error}</p>
            )}
            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
            >
              Retour au dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      {/* Particules animées */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-300 to-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="group flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                ← <span className="hidden sm:inline font-medium">Retour</span>
              </button>

              <div className="hidden sm:block h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

              <div className="flex items-center space-x-1.5 sm:space-x-3">
                <div className="p-1 sm:p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl text-white">
                  <Petanque className="w-5 h-5 sm:w-8 sm:h-8" />
                </div>
                <div>
                  <h1 className="text-sm sm:text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    {tournament.name}
                  </h1>
                  <div className="flex items-center space-x-1 sm:space-x-4 text-xs text-gray-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      tournament.status === 'preparation'
                        ? 'bg-yellow-100 text-yellow-700'
                        : tournament.status === 'en_cours'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {tournament.status === 'preparation' ? 'Prépa' :
                       tournament.status === 'en_cours' ? 'En cours' : 'Terminé'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 sm:space-x-3">
              {/* Bouton Exporter - toujours visible */}
              <button
                onClick={() => router.push(`/tournoi/${params.id}/export`)}
                className="px-2 sm:px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all flex items-center space-x-1 sm:space-x-2 text-sm"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden sm:inline">Exporter</span>
              </button>

              {/* Bouton Podium - visible quand tournoi terminé */}
              {tournament.status === 'termine' && (
                <button
                  onClick={() => router.push(`/tournoi/${params.id}/podium`)}
                  className="px-2 sm:px-4 py-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                >
                  <Trophy className="w-5 h-5" />
                  <span className="hidden sm:inline">Podium</span>
                </button>
              )}

              {tournament.status === 'preparation' && isOrganizer && (
                <button
                  onClick={() => setShowStartModal(true)}
                  className="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base"
                >
                  <Play className="w-5 h-5" />
                  <span className="hidden sm:inline">Démarrer le tournoi</span>
                </button>
              )}

              {tournament.mode === 'melee_tournante' && tournament.status === 'en_cours' && isOrganizer && (
                <button
                  onClick={reformTeamsForRotation}
                  disabled={!isRotationAvailable}
                  className={`px-2 sm:px-4 py-2 rounded-xl font-bold shadow-lg transition-all flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base ${
                    isRotationAvailable
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-xl cursor-pointer'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Shuffle className="w-5 h-5" />
                  <span className="hidden sm:inline">Rotation équipes</span>
                </button>
              )}

              {/* C5 FIX: Bouton génération phases finales avec loader */}
              {/* FIX: Afficher aussi si status preparation mais matchs de poule terminés */}
              {(tournament.status === 'en_cours' || tournament.status === 'preparation') && isOrganizer &&
               tournament.mode !== 'melee_tournante' &&
               matches.filter(m => m.type === 'poule').every(m => m.status === 'termine') &&
               matches.filter(m => m.type === 'poule').length > 0 &&
               !matches.some(m => ['huitieme', 'quart', 'demi', 'finale'].includes(m.type || '')) && (
                <button
                  onClick={handleGenerateEliminationPhases}
                  disabled={generatingPhases}
                  className="px-2 sm:px-4 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base disabled:opacity-50"
                >
                  {generatingPhases ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Flag className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">{generatingPhases ? 'Génération...' : 'Générer phases finales'}</span>
                </button>
              )}

              {/* C5 FIX: Bouton génération finale avec loader */}
              {/* FIX: Afficher aussi si status preparation */}
              {(tournament.status === 'en_cours' || tournament.status === 'preparation') && isOrganizer &&
               matches.filter(m => m.type === 'demi' && m.status === 'termine').length === 2 &&
               !matches.some(m => m.type === 'finale') && (
                <button
                  onClick={handleGenerateFinales}
                  disabled={generatingPhases}
                  className="px-2 sm:px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base disabled:opacity-50"
                >
                  {generatingPhases ? (
                    <Loader className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trophy className="w-5 h-5" />
                  )}
                  <span className="hidden sm:inline">{generatingPhases ? 'Génération...' : 'Générer finale'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Mode', value: tournament.mode === 'choisi' ? 'Choisi' : tournament.mode === 'melee_fixe' ? 'Mêlée fixe' : 'Mêlée tournante', icon: <Users className="w-5 h-5" />, gradient: 'from-blue-500 to-indigo-600' },
            { label: 'Format', value: tournament.format === 'doublette' ? 'Doublette' : 'Triplette', icon: <Petanque className="w-5 h-5" />, gradient: 'from-green-500 to-emerald-600' },
            { label: 'Équipes', value: `${teams.length}`, icon: <Flag className="w-5 h-5" />, gradient: 'from-orange-500 to-red-600' },
            { label: 'Terrains', value: `${tournament.settings.terrains}`, icon: <Grid className="w-5 h-5" />, gradient: 'from-purple-500 to-pink-600' }
          ].map((stat, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 hover:shadow-xl transition-all">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm text-gray-600">{stat.label}</span>
                <div className={`p-1.5 sm:p-2 bg-gradient-to-br ${stat.gradient} rounded-lg sm:rounded-xl text-white`}>
                  {stat.icon}
                </div>
              </div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs - 3 onglets (Vue d'ensemble supprimée car redondante avec Matchs) */}
        <div className="mb-6">
          <div className="flex border-b border-gray-200 bg-white/80 backdrop-blur-xl rounded-t-2xl overflow-x-auto">
            {[
              { id: 'matchs', label: 'Matchs', icon: <Flag className="w-5 h-5" /> },
              { id: 'classement', label: 'Classement', icon: <Trophy className="w-5 h-5" /> },
              { id: 'equipes', label: 'Équipes', icon: <Users className="w-5 h-5" /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 min-w-max flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 px-3 sm:px-4 py-3 sm:py-4 transition-all relative ${
                  activeTab === tab.id
                    ? 'text-green-600 font-bold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                <span className="text-xs sm:text-base font-medium">{tab.label}</span>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-0.5 bg-gradient-to-r from-green-600 to-emerald-600"></div>
                )}
              </button>
            ))}
          </div>

          {/* Pub */}
          <div className="mt-6 mb-6">
            <AdBanner userPlan={userPlan} showOnlyForFree={true} />
          </div>

          {/* Contenu des tabs */}
          {activeTab === 'matchs' && (
            <div className="space-y-4">
              {matches.length === 0 ? (
                <div className="text-center py-12">
                  <Flag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 mb-2">Aucun match généré</p>
                  {/* FIX UX: Message d'aide si moins de 4 équipes */}
                  {isOrganizer && tournament.status === 'preparation' && teams.length < 4 ? (
                    <div className="max-w-md mx-auto">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                        <div className="flex items-start gap-3">
                          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <div className="text-left">
                            <p className="text-amber-800 font-medium">
                              Minimum 4 équipes requises
                            </p>
                            <p className="text-amber-700 text-sm mt-1">
                              Vous avez actuellement {teams.length} équipe{teams.length > 1 ? 's' : ''}.
                              {tournament.mode === 'choisi' && (
                                <span> Composez vos équipes dans l'onglet Équipes.</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setActiveTab('equipes')}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all"
                      >
                        <Users className="w-5 h-5 inline mr-2" />
                        Aller aux équipes
                      </button>
                    </div>
                  ) : isOrganizer && tournament.status === 'preparation' && (
                    <button
                      onClick={generatePoules}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg"
                    >
                      Générer les poules
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Stats rapides + Actions */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 mb-4">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">
                            {matches.filter(m => m.status === 'termine').length}/{matches.length}
                          </p>
                          <p className="text-xs text-gray-600">Matchs terminés</p>
                        </div>
                        <div className="h-10 w-px bg-gray-300"></div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-green-600">
                            {matches.filter(m => m.status === 'en_cours').length}
                          </p>
                          <p className="text-xs text-gray-600">En cours</p>
                        </div>
                        <div className="h-10 w-px bg-gray-300"></div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-400">
                            {matches.filter(m => m.status === 'a_jouer').length}
                          </p>
                          <p className="text-xs text-gray-600">À jouer</p>
                        </div>
                      </div>
                      <button
                        onClick={() => router.push(`/tournoi/${params.id}/poules`)}
                        className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
                      >
                        <Grid className="w-4 h-4" />
                        <span>Vue complète poules</span>
                      </button>
                    </div>
                  </div>

                  {/* Matchs de POULE - groupés par poule (A, B, C...) */}
                  {(() => {
                    const pouleMatches = matches.filter(m => m.type === 'poule' && m.poule)
                    const pouleNames = [...new Set(pouleMatches.map(m => m.poule))].sort()

                    if (pouleNames.length === 0) return null

                    return (
                      <div className="space-y-4">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <Grid className="w-6 h-6 text-green-600" />
                          Phase de poules
                        </h2>
                        {pouleNames.map(pouleName => {
                          const pouleMatchList = pouleMatches.filter(m => m.poule === pouleName)
                          const playedCount = pouleMatchList.filter(m => m.status === 'termine').length
                          const totalCount = pouleMatchList.length

                          return (
                            <div key={pouleName} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                              <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white flex items-center justify-between">
                                <h3 className="text-lg font-bold">Poule {pouleName}</h3>
                                <span className="text-sm opacity-90">
                                  {playedCount}/{totalCount} termines
                                </span>
                              </div>
                              <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {pouleMatchList.map(match => (
                                    <MatchCard
                                      key={match.id}
                                      match={match}
                                      maxPoints={tournament.settings.maxPoints || 13}
                                      isOrganizer={isOrganizer}
                                      getTeamPlayers={getTeamPlayers}
                                      onAssignTerrain={assignTerrain}
                                      onAutoAssignTerrain={autoAssignTerrain}
                                      availableTerrains={tournament.settings.terrains}
                                      onWarning={showWarning}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}

                  {/* Matchs ELIMINATOIRES - groupés par type (huitièmes, quarts, demis, finale) */}
                  {/* Ne pas afficher en mêlée tournante (classement individuel, pas d'élimination) */}
                  {tournament.mode !== 'melee_tournante' && (() => {
                    const eliminationTypes = [
                      { type: 'huitieme', label: 'Huitièmes de finale', gradient: 'from-blue-500 to-indigo-600' },
                      { type: 'quart', label: 'Quarts de finale', gradient: 'from-purple-500 to-indigo-600' },
                      { type: 'demi', label: 'Demi-finales', gradient: 'from-orange-500 to-red-600' },
                      { type: 'finale', label: 'Finale', gradient: 'from-yellow-500 to-orange-600' },
                      { type: 'petite_finale', label: 'Petite finale', gradient: 'from-gray-500 to-gray-600' }
                    ]

                    const eliminationMatches = matches.filter(m =>
                      m.type && ['huitieme', 'quart', 'demi', 'finale', 'petite_finale'].includes(m.type)
                    )

                    if (eliminationMatches.length === 0) return null

                    return (
                      <div className="space-y-4 mt-8">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                          <Trophy className="w-6 h-6 text-yellow-500" />
                          Phases finales
                        </h2>
                        {eliminationTypes.map(({ type, label, gradient }) => {
                          const typeMatches = eliminationMatches.filter(m => m.type === type)
                          if (typeMatches.length === 0) return null

                          return (
                            <div key={type} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                              <div className={`bg-gradient-to-r ${gradient} p-4 text-white`}>
                                <h3 className="text-lg font-bold">{label}</h3>
                              </div>
                              <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                  {typeMatches.map(match => (
                                    <MatchCard
                                      key={match.id}
                                      match={match}
                                      maxPoints={tournament.settings.maxPoints || 13}
                                      isOrganizer={isOrganizer}
                                      getTeamPlayers={getTeamPlayers}
                                      onAssignTerrain={assignTerrain}
                                      onAutoAssignTerrain={autoAssignTerrain}
                                      availableTerrains={tournament.settings.terrains}
                                      onWarning={showWarning}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })()}

                  {/* Matchs BYE (si présents, pour debug/info) */}
                  {(() => {
                    const byeMatches = matches.filter(m => m.type === 'bye')
                    if (byeMatches.length === 0) return null

                    return (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">
                          {byeMatches.length} match(s) BYE (qualifications automatiques)
                        </p>
                      </div>
                    )
                  })()}
                </>
              )}
            </div>
          )}

          {activeTab === 'classement' && (
            <div>
              {tournament.mode === 'melee_tournante' ? (
                <PlayerRankingsTable
                  players={individualRankings.map(player => ({
                    id: player.id,
                    name: player.name,
                    email: player.email,
                    played: player.played,
                    victories: player.victories,
                    defeats: player.defeats,
                    draws: player.draws,
                    pointsFor: player.pointsFor,
                    pointsAgainst: player.pointsAgainst,
                    difference: player.difference,
                    points: player.points
                  }))}
                  rotationMode={tournament.settings.meleeRotation}
                />
              ) : (
                <div className="space-y-4">
                  {Object.keys(teamsByPoule).sort().map(poule => (
                    <StandingsTable
                      key={poule}
                      poule={poule}
                      teams={teamsByPoule[poule].map(team => ({
                        id: team.id,
                        name: team.name,
                        played: team.played || 0,
                        victories: team.victories || 0,
                        defeats: team.defeats || 0,
                        draws: team.draws || 0,
                        pointsFor: team.pointsFor || 0,
                        pointsAgainst: team.pointsAgainst || 0,
                        difference: team.difference || 0,
                        points: (team.victories || 0) * 3 + (team.draws || 0)
                      }))}
                      qualifiedCount={tournament.settings.qualifiedPerPoule || 2}
                    />
                  ))}
                  <div className="text-center">
                    <button
                      onClick={() => refreshClassement(loadTournamentData)}
                      disabled={refreshingClassement}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50"
                    >
                      {refreshingClassement ? <Loader className="w-5 h-5 animate-spin inline mr-2" /> : <Refresh className="w-5 h-5 inline mr-2" />}
                      Actualiser
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'equipes' && (
            <div className="space-y-4">
              {tournament.mode === 'choisi' && tournament.status === 'preparation' && isOrganizer && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Mode Choisi - Formation des équipes</h3>
                  <button
                    onClick={() => setShowTeamFormation(true)}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg"
                  >
                    Composer les équipes
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map(team => (
                  <div key={team.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">{team.name}</h3>
                    <div className="space-y-2">
                      {team.equipes_joueurs?.map((ej, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-gradient-to-br ${
                            ej.joueur?.gender === 'H' ? 'from-blue-500 to-indigo-600' : 'from-pink-500 to-rose-600'
                          }`}>
                            {ej.joueur?.name?.charAt(0)}
                          </div>
                          <span className="text-sm text-gray-700">{ej.joueur?.name}</span>
                        </div>
                      ))}
                    </div>
                    {tournament.status === 'preparation' && isOrganizer && (
                      <button
                        onClick={() => {
                          setEditingTeam(team)
                          setNewTeamName(team.name)
                        }}
                        className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all text-sm font-medium"
                      >
                        ✏️ Renommer
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Section Tournoi Terminé */}
        {tournament.status === 'termine' && (
          <div className="mt-8 bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 rounded-3xl p-8 text-center border-2 border-yellow-200">
            <div className="mb-4">
              <div className="inline-block p-4 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Tournoi terminé !</h2>
            <p className="text-gray-600 mb-6">Félicitations à tous les participants</p>
            <div className="flex flex-wrap justify-center gap-4">
              <button
                onClick={() => router.push(`/tournoi/${params.id}/podium`)}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
              >
                <Medal className="w-5 h-5" />
                <span>Voir le podium</span>
              </button>
              <button
                onClick={() => router.push(`/tournoi/${params.id}/export`)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all flex items-center space-x-2"
              >
                <Settings className="w-5 h-5" />
                <span>Exporter les résultats</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showStartModal && tournament && (
        <StartTournamentModal
          tournament={tournament}
          teams={teams}
          onClose={() => setShowStartModal(false)}
          onStart={handleStartTournament}
          onUpdateTournament={setTournament}
          isValidPoolConfiguration={isValidPoolConfiguration}
          getValidPoolSizes={getValidPoolSizes}
          getPoolDistribution={getPoolDistribution}
        />
      )}

      {editingTeam && (
        <RenameTeamModal
          editingTeam={editingTeam}
          newTeamName={newTeamName}
          onNameChange={setNewTeamName}
          onClose={() => {
            setEditingTeam(null)
            setNewTeamName('')
          }}
          onRename={renameTeam}
        />
      )}

      {showTeamFormation && tournament && (
        <TeamFormationModal
          tournament={tournament}
          availablePlayers={availablePlayers}
          selectedPlayerIds={selectedPlayerIds}
          newTeamName={newTeamNameForCreation}
          creatingTeam={creatingTeam}
          onClose={resetTeamFormation}
          onNameChange={setNewTeamNameForCreation}
          onTogglePlayer={togglePlayerSelection}
          onCreate={createTeamWithPlayers}
          getPlayersPerTeam={getPlayersPerTeam}
        />
      )}

      {/* Modal de confirmation */}
      {ConfirmModal}

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  )
}
