'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
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

// Composants tournament (inchanges)
import {
  MatchCard,
  StandingsTable,
  PlayerRankingsTable,
  StartTournamentModal,
  RenameTeamModal,
  TeamFormationModal
} from '@/components/tournament'
import AdvancedStats from '@/components/tournament/AdvancedStats'

// Composants UI V4
import { Button, BouleSvg, Stat, FadeIn } from '@/components/ui'

// Icons
import {
  Petanque, Trophy, Users, Play, Flag, Loader, Shuffle,
  Chart, Refresh, Grid
} from '@/components/Icons'

export default function TournamentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user, organization } = useAuth()
  const { showSuccess, showError, showWarning } = useToast()
  const { confirm, ConfirmModal } = useConfirm()

  // UI state
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'vue' | 'matchs' | 'classement' | 'equipes' | 'stats'>('vue')
  const [selectedPoule, setSelectedPoule] = useState<string>('A')
  const [currentPhase, setCurrentPhase] = useState<'poules' | 'elimination' | 'finale'>('poules')
  const [showStartModal, setShowStartModal] = useState(false)

  // Hook principal
  const {
    tournament, setTournament, teams, setTeams,
    matches, setMatches, loading, isOrganizer, userPlan,
    realtimeConnected, loadTournamentData
  } = useTournamentData({ tournamentId: params?.id })

  // Hook equipes
  const {
    availablePlayers, selectedPlayerIds, newTeamNameForCreation,
    setNewTeamNameForCreation, creatingTeam, editingTeam,
    setEditingTeam, newTeamName, setNewTeamName, showTeamFormation,
    setShowTeamFormation, togglePlayerSelection, createTeamWithPlayers,
    renameTeam, getPlayersPerTeam, getTeamPlayers, resetTeamFormation
  } = useTeamManagement({
    tournament, teams, loadTournamentData,
    onSuccess: showSuccess, onError: showError, onWarning: showWarning
  })

  const handleConfirmTerrainConflict = useCallback(async (message: string) => {
    return await confirm({
      title: 'Conflit de terrain',
      message,
      confirmText: 'Assigner quand même',
      variant: 'warning'
    })
  }, [confirm])

  // Hook matchs
  const {
    isValidPoolConfiguration, getValidPoolSizes, getPoolDistribution,
    generatePoules, generateEliminationPhases, generateFinales,
    generateNextEliminationRound, assignTerrain
  } = useMatchActions({
    tournament, teams, matches, loadTournamentData, getTeamPlayers,
    onSuccess: showSuccess, onError: showError, onWarning: showWarning,
    onConfirmTerrainConflict: handleConfirmTerrainConflict
  })

  // Hook rotation
  const { isRotationAvailable, reformTeamsForRotation } = useRotation({
    tournament, teams, matches, loadTournamentData,
    onSuccess: showSuccess, onError: showError, onWarning: showWarning
  })

  // Hook classements
  const {
    teamsWithStats, teamsByPoule, individualRankings,
    refreshingClassement, loadIndividualRankings, refreshClassement
  } = useRankings({ tournament, teams, matches })

  useEffect(() => {
    if (tournament?.mode === 'melee_tournante') loadIndividualRankings()
  }, [tournament?.mode, loadIndividualRankings])

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!matches || matches.length === 0) { setCurrentPhase('poules'); return }
    const hasFinale = matches.some(m => m.type === 'finale' || m.type === 'petite_finale')
    const hasElimination = matches.some(m => m.type === 'huitieme' || m.type === 'quart' || m.type === 'demi')
    if (hasFinale) setCurrentPhase('finale')
    else if (hasElimination) setCurrentPhase('elimination')
    else setCurrentPhase('poules')
  }, [matches])

  const handleStartTournament = async () => {
    if (!tournament) return
    if (teams.length < 4) {
      showError(`Minimum 4 équipes requises. Vous avez ${teams.length} équipe(s).`)
      return
    }
    try {
      if (matches.length === 0) await generatePoules()
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

  // Loading V4
  if (loading) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto text-petanque-vert" />
          <p className="mt-4 text-sm text-petanque-bois">Chargement du tournoi…</p>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-2xl font-medium text-petanque-vert-fonce mb-2">Tournoi introuvable</p>
          <p className="text-sm text-petanque-bois mb-6">Ce tournoi n’existe plus ou tu n’y as pas accès.</p>
          <Button variant="primary" onClick={() => router.push('/dashboard')}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    )
  }

  // Helpers status
  const statusLabel = tournament.status === 'preparation' ? 'Préparation' : tournament.status === 'en_cours' ? 'En cours' : 'Terminé'
  const statusColor =
    tournament.status === 'preparation' ? 'bg-petanque-cochonnet-pale text-petanque-cochonnet-fonce' :
    tournament.status === 'en_cours' ? 'bg-petanque-vert-pale text-petanque-vert-fonce' :
    'bg-petanque-sable-pale text-petanque-bois'

  // Action contextuelle
  const showStartBtn = tournament.status === 'preparation' && isOrganizer
  const showRotationBtn = tournament.mode === 'melee_tournante' && tournament.status === 'en_cours' && isOrganizer
  const showPhasesBtn = tournament.status === 'en_cours' && isOrganizer && tournament.mode !== 'melee_tournante' && matches.some(m => m.type === 'poule' && m.status === 'termine') && !matches.some(m => ['huitieme', 'quart', 'demi', 'finale'].includes(m.type || ''))
  const huitiemes = matches.filter(m => m.type === 'huitieme')
  const quarts = matches.filter(m => m.type === 'quart')
  const allHuitTermine = huitiemes.length > 0 && huitiemes.every(m => m.status === 'termine')
  const allQuartsTermine = quarts.length > 0 && quarts.every(m => m.status === 'termine')
  const noQuarts = quarts.length === 0
  const noDemis = matches.filter(m => m.type === 'demi').length === 0
  const showQuartsBtn = tournament.status === 'en_cours' && isOrganizer && allHuitTermine && noQuarts
  const showDemisBtn = tournament.status === 'en_cours' && isOrganizer && allQuartsTermine && noDemis
  const showFinaleBtn = tournament.status === 'en_cours' && isOrganizer && matches.filter(m => m.type === 'demi' && m.status === 'termine').length === 2 && !matches.some(m => m.type === 'finale')

  // Tabs def
  const tabs = [
    { id: 'vue' as const, label: 'Vue' },
    { id: 'matchs' as const, label: 'Matchs' },
    { id: 'classement' as const, label: 'Classement' },
    { id: 'equipes' as const, label: 'Équipes' },
    ...(userPlan === 'club' ? [{ id: 'stats' as const, label: 'Stats' }] : [])
  ]

  return (
    <div className="min-h-screen bg-petanque-sable-pale">
      {/* Header sticky V4 */}
      <header className="sticky top-0 z-50 bg-petanque-sable-pale/85 backdrop-blur-xl border-b border-petanque-sable-bord/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-16">
            {/* Left */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-petanque-bois hover:text-petanque-vert-fonce text-sm font-medium transition-colors flex items-center gap-1"
                aria-label="Retour au tableau de bord"
              >
                <span>←</span>
                <span className="hidden sm:inline">Retour</span>
              </button>
              <div className="hidden sm:block w-px h-6 bg-petanque-sable-bord/60"></div>
              <div className="flex items-center gap-3 min-w-0">
                {(() => {
                  const cust = (organization?.settings as Record<string, any>)?.customization
                  if (cust?.logo_url) {
                    return <img src={cust.logo_url} alt="Club" className="w-8 h-8 rounded-lg object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  }
                  return (
                    <div className="relative flex-shrink-0">
                      <BouleSvg size={32} variant="acier" stries />
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-petanque-vert border-2 border-petanque-sable-pale"></span>
                    </div>
                  )
                })()}
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-base font-medium text-petanque-vert-fonce truncate tracking-tight">
                    {tournament.name}
                  </h1>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium ${statusColor}`}>
                      {statusLabel}
                    </span>
                    {tournament.status === 'en_cours' && realtimeConnected && (
                      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-petanque-vert font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-petanque-vert animate-pulse"></span>
                        Live
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right : actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {showStartBtn && (
                <Button variant="primary" size="sm" onClick={() => setShowStartModal(true)}>
                  <Play className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">Démarrer</span>
                </Button>
              )}
              {showRotationBtn && (
                <Button variant="secondary" size="sm" onClick={reformTeamsForRotation} disabled={!isRotationAvailable}>
                  <Shuffle className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">Rotation</span>
                </Button>
              )}
              {showPhasesBtn && (
                <Button variant="secondary" size="sm" onClick={generateEliminationPhases}>
                  <Flag className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">Phases finales</span>
                </Button>
              )}
              {(showQuartsBtn || showDemisBtn) && (
                <Button variant="secondary" size="sm" onClick={generateNextEliminationRound}>
                  <Flag className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">{showQuartsBtn ? 'Quarts' : 'Demi-finales'}</span>
                </Button>
              )}
              {showFinaleBtn && (
                <Button variant="primary" size="sm" onClick={generateFinales}>
                  <Trophy className="w-4 h-4" />
                  <span className="hidden sm:inline ml-1.5">Finale</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats inline V4 */}
        <FadeIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6 pb-8 border-b border-petanque-sable-bord/50">
            <Stat
              label="Mode"
              value={tournament.mode === 'choisi' ? 'Choisi' : tournament.mode === 'melee_fixe' ? 'Mêlée fixe' : 'Mêlée tournante'}
              size="sm"
            />
            <Stat
              label="Format"
              value={tournament.format === 'doublette' ? 'Doublette' : 'Triplette'}
              size="sm"
            />
            <Stat label="Équipes" value={`${teams.length}`} size="sm" />
            <Stat label="Terrains" value={`${tournament.settings.terrains}`} size="sm" />
          </div>
        </FadeIn>

        {/* Quick nav */}
        <FadeIn delay={80}>
          <div className="flex flex-wrap gap-2 mt-6">
            {matches.some(m => ['huitieme', 'quart', 'demi', 'finale'].includes(m.type || '')) && (
              <Button variant="ghost" size="sm" onClick={() => router.push(`/tournoi/${tournament.id}/bracket`)}>
                <Grid className="w-4 h-4" />
                <span className="ml-1.5">Tableau final</span>
              </Button>
            )}
            {tournament.status === 'termine' && (
              <Button variant="ghost" size="sm" onClick={() => router.push(`/tournoi/${tournament.id}/podium`)}>
                <Trophy className="w-4 h-4" />
                <span className="ml-1.5">Podium</span>
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => router.push(`/tournoi/${tournament.id}/export`)}>
              <Chart className="w-4 h-4" />
              <span className="ml-1.5">Export</span>
            </Button>
          </div>
        </FadeIn>

        {/* Tabs */}
        <nav className="mt-8 border-b border-petanque-sable-bord/60 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-petanque-vert-fonce'
                    : 'text-petanque-bois hover:text-petanque-vert-fonce'
                }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-petanque-vert"></span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Tab content */}
        <div className="mt-8">
          {/* Tab Vue */}
          {activeTab === 'vue' && (
            <div className="space-y-10">
              <FadeIn>
                <div>
                  <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3">
                    Phase actuelle
                  </p>
                  <h2 className="text-2xl md:text-3xl font-medium text-petanque-vert-fonce tracking-tight leading-tight">
                    {currentPhase === 'poules' ? 'Phase de poules' : currentPhase === 'elimination' ? 'Phases finales' : 'Finale'}
                    <span className="ml-2 accent-italic text-petanque-vert font-normal">
                      en cours.
                    </span>
                  </h2>
                </div>
              </FadeIn>

              {/* Selecteur poule */}
              {currentPhase === 'poules' && teams.length > 0 && (
                <FadeIn delay={100}>
                  <div className="flex flex-wrap gap-2">
                    {['A', 'B', 'C', 'D'].slice(0, Math.ceil(teams.length / (tournament.settings.pouleSize || 4))).map(poule => (
                      <button
                        key={poule}
                        onClick={() => setSelectedPoule(poule)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                          selectedPoule === poule
                            ? 'bg-petanque-vert text-petanque-sable'
                            : 'bg-white text-petanque-bois border border-petanque-sable-bord/60 hover:border-petanque-vert/40'
                        }`}
                      >
                        Poule {poule}
                      </button>
                    ))}
                  </div>
                </FadeIn>
              )}

              {/* Matchs poule selectionnee */}
              {matches.filter(m => m.poule === selectedPoule).length > 0 && (
                <FadeIn delay={150}>
                  <div>
                    <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.15em] mb-4">
                      Matchs de la poule {selectedPoule}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {matches.filter(m => m.poule === selectedPoule).map(match => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          maxPoints={tournament.settings.maxPoints || 13}
                          isOrganizer={isOrganizer}
                          getTeamPlayers={getTeamPlayers}
                          onAssignTerrain={assignTerrain}
                          availableTerrains={tournament.settings.terrains}
                          onWarning={showWarning}
                        />
                      ))}
                    </div>
                  </div>
                </FadeIn>
              )}

              {/* Stats rapides V4 */}
              <FadeIn delay={200}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-x-10 gap-y-6 pt-8 border-t border-petanque-sable-bord/50">
                  <div>
                    <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.15em] mb-2">
                      Matchs joués
                    </p>
                    <p className="font-mono text-2xl text-petanque-vert-fonce tracking-tight">
                      {matches.filter(m => m.status === 'termine').length}
                      <span className="text-petanque-bois text-base"> / {matches.length}</span>
                    </p>
                    <div className="mt-3 w-full bg-petanque-sable-bord/40 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-petanque-vert h-full transition-all"
                        style={{ width: `${matches.length > 0 ? (matches.filter(m => m.status === 'termine').length / matches.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.15em] mb-2">
                      Points moyens / match
                    </p>
                    <p className="font-mono text-2xl text-petanque-vert-fonce tracking-tight">
                      {matches.filter(m => m.status === 'termine').length > 0
                        ? Math.round(matches.filter(m => m.status === 'termine').reduce((acc, m) => acc + (m.score_a ?? 0) + (m.score_b ?? 0), 0) / matches.filter(m => m.status === 'termine').length)
                        : 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.15em] mb-2">
                      Leader actuel
                    </p>
                    <p className="text-base font-medium text-petanque-vert-fonce truncate">
                      {[...teamsWithStats].sort((a, b) => {
                        const pointsA = (a.victories || 0) * 3 + (a.draws || 0)
                        const pointsB = (b.victories || 0) * 3 + (b.draws || 0)
                        if (pointsB !== pointsA) return pointsB - pointsA
                        const diffA = (a.pointsFor || 0) - (a.pointsAgainst || 0)
                        const diffB = (b.pointsFor || 0) - (b.pointsAgainst || 0)
                        if (diffB !== diffA) return diffB - diffA
                        return (b.pointsFor || 0) - (a.pointsFor || 0)
                      })[0]?.name || 'À déterminer'}
                    </p>
                  </div>
                </div>
              </FadeIn>
            </div>
          )}

          {/* Tab Matchs */}
          {activeTab === 'matchs' && (
            <div className="space-y-8">
              {matches.length === 0 ? (
                <div className="text-center py-16">
                  <Flag className="w-12 h-12 mx-auto text-petanque-sable-bord mb-4" />
                  <p className="text-petanque-bois mb-6">Aucun match généré pour l’instant.</p>
                  {isOrganizer && tournament.status === 'preparation' && (
                    <Button variant="primary" onClick={generatePoules}>
                      Générer les poules
                    </Button>
                  )}
                </div>
              ) : (
                Array.from(new Set(matches.map(m => m.tour))).sort((a, b) => a - b).map(tour => (
                  <div key={tour}>
                    <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.15em] mb-4">
                      Tour {tour}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {matches.filter(m => m.tour === tour).map(match => (
                        <MatchCard
                          key={match.id}
                          match={match}
                          maxPoints={tournament.settings.maxPoints || 13}
                          isOrganizer={isOrganizer}
                          getTeamPlayers={getTeamPlayers}
                          onAssignTerrain={assignTerrain}
                          availableTerrains={tournament.settings.terrains}
                          onWarning={showWarning}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab Classement */}
          {activeTab === 'classement' && (
            <div>
              {tournament.mode === 'melee_tournante' ? (
                <div className="bg-white border border-petanque-sable-bord/60 rounded-xl overflow-hidden">
                  <div className="bg-petanque-vert-fonce px-5 py-3">
                    <h3 className="text-petanque-sable text-sm font-medium tracking-wide">Classement individuel</h3>
                  </div>
                  <div className="p-4">
                    <PlayerRankingsTable
                      players={individualRankings.map(player => ({
                        id: player.id, name: player.name, email: player.email,
                        played: player.played, victories: player.victories,
                        defeats: player.defeats, draws: player.draws,
                        pointsFor: player.pointsFor, pointsAgainst: player.pointsAgainst,
                        difference: player.difference, points: player.points
                      }))}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.keys(teamsByPoule).sort().map(poule => (
                    <div key={poule} className="bg-white border border-petanque-sable-bord/60 rounded-xl overflow-hidden">
                      <div className="bg-petanque-vert-fonce px-5 py-3">
                        <h3 className="text-petanque-sable text-sm font-medium tracking-wide">Poule {poule}</h3>
                      </div>
                      <div className="p-4">
                        <StandingsTable
                          poule={poule}
                          teams={teamsByPoule[poule].map(team => ({
                            id: team.id, name: team.name,
                            played: team.played || 0, victories: team.victories || 0,
                            defeats: team.defeats || 0, draws: team.draws || 0,
                            pointsFor: team.pointsFor || 0, pointsAgainst: team.pointsAgainst || 0,
                            difference: team.difference || 0,
                            points: (team.victories || 0) * 3 + (team.draws || 0)
                          }))}
                          qualifiedCount={tournament.settings.qualifiedPerPoule || 2}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="text-center pt-4">
                    <Button
                      variant="ghost"
                      onClick={() => refreshClassement(loadTournamentData)}
                      disabled={refreshingClassement}
                    >
                      {refreshingClassement ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Refresh className="w-4 h-4 mr-2" />}
                      Actualiser le classement
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab Equipes */}
          {activeTab === 'equipes' && (
            <div className="space-y-6">
              {tournament.mode === 'choisi' && tournament.status === 'preparation' && isOrganizer && (
                <div className="bg-petanque-vert-pale/30 border border-petanque-vert/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div>
                    <p className="text-sm font-medium text-petanque-vert-fonce mb-0.5">Mode Choisi</p>
                    <p className="text-sm text-petanque-bois">Compose les équipes manuellement avant le démarrage.</p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setShowTeamFormation(true)}>
                    Composer les équipes
                  </Button>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map(team => (
                  <div key={team.id} className="bg-white border border-petanque-sable-bord/60 rounded-xl p-5 transition-all hover:-translate-y-0.5 hover:border-petanque-vert/40">
                    <h3 className="text-base font-medium text-petanque-vert-fonce mb-3 tracking-tight">{team.name}</h3>
                    <div className="space-y-2">
                      {team.equipes_joueurs?.map((ej, index) => (
                        <div key={index} className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-petanque-sable text-petanque-vert-fonce">
                            {ej.joueur?.name?.charAt(0)}
                          </div>
                          <span className="text-sm text-petanque-bois">{ej.joueur?.name}</span>
                        </div>
                      ))}
                    </div>
                    {tournament.status === 'preparation' && isOrganizer && (
                      <button
                        onClick={() => { setEditingTeam(team); setNewTeamName(team.name) }}
                        className="mt-4 w-full text-xs text-petanque-bois hover:text-petanque-vert-fonce font-medium transition-colors text-left"
                      >
                        Renommer →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Stats */}
          {activeTab === 'stats' && userPlan === 'club' && (
            <AdvancedStats
              matches={matches}
              teams={teams}
              maxPoints={tournament.settings.maxPoints || 13}
            />
          )}
        </div>
      </div>

      {/* Modaux */}
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
          onClose={() => { setEditingTeam(null); setNewTeamName('') }}
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

      {ConfirmModal}
    </div>
  )
}
