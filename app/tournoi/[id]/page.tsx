'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'

import {
  useTournamentData, useTeamManagement, useMatchActions,
  useRotation, useRankings
} from '@/hooks/tournament'

import {
  MatchCard, StandingsTable, PlayerRankingsTable,
  StartTournamentModal, RenameTeamModal, TeamFormationModal
} from '@/components/tournament'
import AdvancedStats from '@/components/tournament/AdvancedStats'

import { Button, BouleSvg, FadeIn } from '@/components/ui'

import {
  Trophy, Users, Play, Flag, Loader, Shuffle,
  Chart, Refresh, Grid
} from '@/components/Icons'

import { useEffectiveRole, type ViewRole } from '@/hooks/useEffectiveRole'
import TournamentSubNav from '@/components/tournament/TournamentSubNav'
type ActiveSection = 'apercu' | 'matchs' | 'classement' | 'equipes' | 'stats'

export default function TournamentDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { organization } = useAuth()
  const { showSuccess, showError, showWarning } = useToast()
  const { confirm, ConfirmModal } = useConfirm()

  const [activeSection, setActiveSection] = useState<ActiveSection>('apercu')
  const [selectedPoule, setSelectedPoule] = useState<string>('A')
  const [currentPhase, setCurrentPhase] = useState<'poules' | 'elimination' | 'finale'>('poules')
  const [showStartModal, setShowStartModal] = useState(false)
  const [previewRole, setPreviewRole] = useState<ViewRole | null>(null)
  const [showRoleMenu, setShowRoleMenu] = useState(false)
  const [showActionsMenu, setShowActionsMenu] = useState(false)
  const [dismissedInsights, setDismissedInsights] = useState<Set<string>>(new Set())
  const [matchsFilter, setMatchsFilter] = useState<'all' | 'a_venir' | 'en_cours' | 'termine'>('all')

  const {
    tournament, setTournament, teams, matches,
    loading, isOrganizer, userPlan, realtimeConnected, loadTournamentData
  } = useTournamentData({ tournamentId: params?.id })

  // Detection automatique du role (organisateur / joueur / spectateur)
  // En mode 'joueur', identifie l'equipe du user via son email
  const {
    effectiveRole,
    baseRole,
    myEquipeId,
    isPreviewMode,
    canManage
  } = useEffectiveRole({
    tournamentId: tournament?.id,
    orgId: tournament?.org_id,
    teams,
    isOrganizer,
    previewRole,
    selectedPlayerIds: (tournament?.settings?.players as string[] | undefined) ?? null
  })

  // Alias pour compat avec le code existant
  const viewRole = effectiveRole

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
      title: 'Conflit de terrain', message,
      confirmText: 'Assigner quand même', variant: 'warning'
    })
  }, [confirm])

  const {
    isValidPoolConfiguration, getValidPoolSizes, getPoolDistribution,
    generatePoules, generateEliminationPhases, generateFinales,
    generateNextEliminationRound, assignTerrain
  } = useMatchActions({
    tournament, teams, matches, loadTournamentData, getTeamPlayers,
    onSuccess: showSuccess, onError: showError, onWarning: showWarning,
    onConfirmTerrainConflict: handleConfirmTerrainConflict
  })

  const { currentRotation, isRotationAvailable, reformTeamsForRotation } = useRotation({
    tournament, teams, matches, loadTournamentData,
    onSuccess: showSuccess, onError: showError, onWarning: showWarning
  })

  const {
    teamsWithStats, teamsByPoule, individualRankings,
    refreshingClassement, loadIndividualRankings, refreshClassement
  } = useRankings({ tournament, teams, matches })

  useEffect(() => {
    if (tournament?.mode === 'melee_tournante') loadIndividualRankings()
  }, [tournament?.mode, loadIndividualRankings])

  useEffect(() => {
    if (!matches || matches.length === 0) { setCurrentPhase('poules'); return }
    const hasFinale = matches.some(m => m.type === 'finale' || m.type === 'petite_finale')
    const hasElim = matches.some(m => m.type === 'huitieme' || m.type === 'quart' || m.type === 'demi')
    if (hasFinale) setCurrentPhase('finale')
    else if (hasElim) setCurrentPhase('elimination')
    else setCurrentPhase('poules')
  }, [matches])

  const leadersByPoule = useMemo(() => {
    if (!teamsByPoule) return []
    return Object.keys(teamsByPoule).sort().map(poule => {
      const sorted = [...teamsByPoule[poule]].sort((a, b) => {
        const pA = (a.victories || 0) * 3 + (a.draws || 0)
        const pB = (b.victories || 0) * 3 + (b.draws || 0)
        if (pB !== pA) return pB - pA
        const dA = (a.pointsFor || 0) - (a.pointsAgainst || 0)
        const dB = (b.pointsFor || 0) - (b.pointsAgainst || 0)
        return dB - dA
      })
      return { poule, leader: sorted[0] }
    }).filter(x => x.leader)
  }, [teamsByPoule])

  const liveMatches = useMemo(() =>
    matches.filter(m => m.status === 'en_cours').slice(0, 6),
  [matches])

  const recentActivity = useMemo(() => {
    return [...matches]
      .filter(m => m.status === 'termine' && m.score_a !== null && m.score_b !== null)
      .sort((a: any, b: any) => (b.tour || 0) - (a.tour || 0))
      .slice(0, 4)
  }, [matches])

  const phasesSteps = useMemo(() => {
    const has8 = matches.some(m => m.type === 'huitieme')
    const hasQ = matches.some(m => m.type === 'quart')
    const hasD = matches.some(m => m.type === 'demi')
    const hasF = matches.some(m => m.type === 'finale')
    const poulesDone = matches.filter(m => m.type === 'poule').length > 0 && matches.filter(m => m.type === 'poule').every(m => m.status === 'termine')
    const _8Done = has8 && matches.filter(m => m.type === 'huitieme').every(m => m.status === 'termine')
    const qDone = hasQ && matches.filter(m => m.type === 'quart').every(m => m.status === 'termine')
    const dDone = hasD && matches.filter(m => m.type === 'demi').every(m => m.status === 'termine')
    const fDone = hasF && matches.filter(m => m.type === 'finale').every(m => m.status === 'termine')

    // Determiner le nombre de qualifies pour ne montrer que les tours qui existeront vraiment
    const pouleMatchesForSteps = matches.filter(m => m.type === 'poule')
    const poulesSet = new Set(pouleMatchesForSteps.map(m => m.poule).filter(Boolean))
    const pouleSizeCfg = (tournament?.settings as any)?.pouleSize || 6
    const nbPoules = poulesSet.size > 0 ? poulesSet.size : Math.max(1, Math.ceil(teams.length / pouleSizeCfg))
    const qpp = (tournament?.settings as any)?.qualifiedPerPoule || 2
    const nbQualifies = Math.max(2, nbPoules * qpp)
    const bracketSize = Math.pow(2, Math.ceil(Math.log2(nbQualifies)))

    // Un tour s'affiche s'il est prevu par la config OU s'il existe deja en base
    const showHuit = bracketSize >= 16 || has8
    const showQuart = bracketSize >= 8 || hasQ
    const showDemi = bracketSize >= 4 || hasD
    const anyFinalsStarted = has8 || hasQ || hasD || hasF

    const steps = [
      { id: 'poules', label: 'Poules', done: poulesDone, current: !poulesDone && !anyFinalsStarted },
    ]
    if (showHuit) steps.push({ id: 'huit', label: '8e', done: _8Done, current: has8 && !_8Done })
    if (showQuart) steps.push({ id: 'quarts', label: 'Quarts', done: qDone, current: hasQ && !qDone })
    if (showDemi) steps.push({ id: 'demis', label: 'Demis', done: dDone, current: hasD && !dDone })
    steps.push({ id: 'finale', label: 'Finale', done: fDone, current: hasF && !fDone })
    return steps
  }, [matches, teams.length, tournament?.settings])

  const antiRematchInsight = useMemo(() => {
    if (currentPhase !== 'poules' || tournament?.mode === 'melee_tournante') return null
    if (leadersByPoule.length < 2) return null
    if (matches.some(m => ['huitieme', 'quart', 'demi', 'finale'].includes(m.type || ''))) return null
    if (dismissedInsights.has('anti-rematch')) return null
    for (let i = 0; i < leadersByPoule.length; i++) {
      for (let j = i + 1; j < leadersByPoule.length; j++) {
        const t1 = (leadersByPoule[i].leader as any).id
        const t2 = (leadersByPoule[j].leader as any).id
        const rematch = matches.some((m: any) =>
          m.type === 'poule' &&
          ((m.equipe_a_id === t1 && m.equipe_b_id === t2) ||
           (m.equipe_a_id === t2 && m.equipe_b_id === t1))
        )
        if (rematch) return { team1: leadersByPoule[i].leader.name, team2: leadersByPoule[j].leader.name }
      }
    }
    return null
  }, [leadersByPoule, matches, currentPhase, tournament?.mode, dismissedInsights])

  const handleStartTournament = async () => {
    if (!tournament) return
    if (teams.length < 4) { showError(`Minimum 4 équipes requises. Vous avez ${teams.length} équipe(s).`); return }
    try {
      // Mêlée tournante : les matchs de la ronde 1 sont créés à la création du
      // tournoi (pas de poules à générer ici).
      if (tournament.mode !== 'melee_tournante') {
        // FIX : (re)générer les poules si aucune n'existe OU si des équipes ont été
        // ajoutées après coup et ne sont couvertes par aucun match (équipe orpheline).
        const pouleMatches = matches.filter(m => m.type === 'poule')
        const covered = new Set<string>()
        pouleMatches.forEach(m => {
          if (m.equipe_a_id) covered.add(m.equipe_a_id)
          if (m.equipe_b_id) covered.add(m.equipe_b_id)
        })
        const allTeamsCovered = teams.every(t => covered.has(t.id))
        if (pouleMatches.length === 0 || !allTeamsCovered) {
          // FIX : ne PAS démarrer si la génération échoue (sinon tournoi en_cours sans matchs)
          const ok = await generatePoules()
          if (!ok) { showError('Les poules n\'ont pas pu être générées — le tournoi n\'a pas démarré.'); return }
        }
      }
      const response = await fetch(`/api/tournois/${tournament.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: 'en_cours' })
      })
      if (response.ok) { setTournament({ ...tournament, status: 'en_cours' }); setShowStartModal(false) }
      else { showError('Échec du démarrage du tournoi.') }
    } catch (error) {
      console.error('Erreur démarrage tournoi:', error)
      showError('Erreur lors du démarrage du tournoi.')
    }
  }

  // Met à jour le statut du tournoi (clôture / réouverture) via l'API
  const updateTournamentStatus = async (status: 'en_cours' | 'termine') => {
    if (!tournament) return false
    try {
      const response = await fetch(`/api/tournois/${tournament.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status })
      })
      if (!response.ok) { showError('Échec de la mise à jour du tournoi.'); return false }
      setTournament({ ...tournament, status })
      return true
    } catch (error) {
      console.error('Erreur mise à jour statut tournoi:', error)
      showError('Erreur lors de la mise à jour du tournoi.')
      return false
    }
  }

  // Clôture le tournoi. En mêlée tournante, le classement individuel devient le résultat final.
  const handleFinishTournament = async () => {
    if (!tournament) return
    setShowActionsMenu(false)
    const isMelee = tournament.mode === 'melee_tournante'
    const ok = await confirm({
      title: 'Clôturer le tournoi',
      message: isMelee
        ? 'Le tournoi sera figé et le classement individuel deviendra le résultat final. Plus aucune rotation ne sera possible.'
        : 'Le tournoi sera marqué comme terminé. Tu pourras toujours le rouvrir ensuite.',
      confirmText: 'Clôturer',
      variant: 'warning'
    })
    if (!ok) return
    if (await updateTournamentStatus('termine')) {
      showSuccess('Tournoi clôturé.')
      await loadTournamentData()
    }
  }

  // Rouvre un tournoi clôturé (repasse en cours)
  const handleReopenTournament = async () => {
    if (!tournament) return
    setShowActionsMenu(false)
    const ok = await confirm({
      title: 'Rouvrir le tournoi',
      message: 'Le tournoi repassera « en cours ». Tu pourras de nouveau saisir des scores et, en mêlée tournante, lancer des rotations.',
      confirmText: 'Rouvrir',
      variant: 'warning'
    })
    if (!ok) return
    if (await updateTournamentStatus('en_cours')) {
      showSuccess('Tournoi rouvert.')
      await loadTournamentData()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-7 h-7 animate-spin mx-auto text-petanque-vert" />
          <p className="mt-4 text-sm text-petanque-bois">Chargement…</p>
        </div>
      </div>
    )
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-2xl font-medium text-petanque-vert-fonce mb-2">Tournoi introuvable</p>
          <p className="text-sm text-petanque-bois mb-6">Ce tournoi n\u2019existe plus ou tu n\u2019y as pas accès.</p>
          <Button variant="primary" onClick={() => router.push('/dashboard')}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    )
  }

  const isAdmin = canManage  // alias pour compat (fourni par useEffectiveRole)
  // Mode choisi : guider vers la composition tant qu'il manque des équipes (min 4 pour démarrer)
  const needsTeams = tournament.mode === 'choisi' && teams.length < 4
  const statusLabel = tournament.status === 'preparation' ? 'Préparation' : tournament.status === 'en_cours' ? 'En cours' : 'Terminé'
  const formatLabel = tournament.format === 'tete_a_tete' ? 'Tête-à-tête' : tournament.format === 'doublette' ? 'Doublettes' : 'Triplettes'
  const isMelee = tournament.mode === 'melee_tournante'
  // En mêlée tournante, le nombre d'équipes cumule les rotations (R1-, R2-, …) → ne pas l'afficher.
  // On affiche le nombre réel de joueurs + la rotation courante.
  const playerCount = Array.isArray(tournament.settings?.players)
    ? (tournament.settings.players as string[]).length
    : teams.length

  // Section helper
  const sections: { id: ActiveSection; label: string; meta?: string }[] = [
    { id: 'apercu', label: 'Aperçu' },
    { id: 'matchs', label: 'Tous les matchs', meta: `${matches.length}` },
    { id: 'classement', label: 'Classement', meta: `${teams.length} équipes` },
    { id: 'equipes', label: 'Équipes', meta: `${teams.length}` },
    ...(userPlan === 'club' ? [{ id: 'stats' as ActiveSection, label: 'Stats' }] : [])
  ]

  return (
    <div className="min-h-screen bg-petanque-sable-pale">
      {/* HEADER compact */}
      <header className="sticky top-0 z-50 bg-petanque-sable-pale/85 backdrop-blur-xl border-b border-petanque-sable-bord/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-sm text-petanque-bois hover:text-petanque-vert-fonce font-medium flex items-center gap-1"
            >
              <span>←</span><span className="hidden sm:inline">Retour</span>
            </button>
            <div className="flex items-center gap-3 min-w-0">
              <h1 className="text-sm sm:text-base font-medium text-petanque-vert-fonce truncate">
                {tournament.name}
              </h1>
              <span className="text-petanque-sable-bord">·</span>
              {tournament.status === 'en_cours' && realtimeConnected ? (
                <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-petanque-vert font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-petanque-vert animate-pulse"></span>
                  Live
                </span>
              ) : (
                <span className="text-[10px] uppercase tracking-wider text-petanque-bois font-medium">
                  {statusLabel}
                </span>
              )}
            </div>
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setShowActionsMenu(v => !v)}
                aria-haspopup="menu"
                aria-expanded={showActionsMenu}
                aria-label="Actions du tournoi"
                className="w-8 h-8 border border-petanque-sable-bord/60 bg-white rounded-lg text-petanque-bois hover:text-petanque-vert-fonce flex items-center justify-center text-sm"
              >⋯</button>
              {showActionsMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowActionsMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 bg-white border border-petanque-sable-bord rounded-lg shadow-lg py-1 z-50 min-w-[220px]">
                    {isAdmin && tournament.status === 'en_cours' && (
                      <button
                        onClick={handleFinishTournament}
                        className="w-full text-left px-3 py-2.5 text-sm text-petanque-vert-fonce hover:bg-petanque-sable-pale flex items-start gap-2.5"
                      >
                        <Flag className="w-4 h-4 mt-0.5 flex-shrink-0 text-petanque-cochonnet" />
                        <span>
                          <span className="block font-medium">Clôturer le tournoi</span>
                          <span className="block text-[11px] text-petanque-bois">
                            {tournament.mode === 'melee_tournante'
                              ? 'Fige le classement individuel comme résultat final'
                              : 'Marque le tournoi comme terminé'}
                          </span>
                        </span>
                      </button>
                    )}
                    {isAdmin && tournament.status === 'termine' && (
                      <button
                        onClick={handleReopenTournament}
                        className="w-full text-left px-3 py-2.5 text-sm text-petanque-vert-fonce hover:bg-petanque-sable-pale flex items-start gap-2.5"
                      >
                        <Refresh className="w-4 h-4 mt-0.5 flex-shrink-0 text-petanque-vert" />
                        <span className="font-medium">Rouvrir le tournoi</span>
                      </button>
                    )}
                    <button
                      onClick={() => { setShowActionsMenu(false); router.push(`/tournoi/${tournament.id}/export`) }}
                      className="w-full text-left px-3 py-2.5 text-sm text-petanque-vert-fonce hover:bg-petanque-sable-pale flex items-center gap-2.5"
                    >
                      <Grid className="w-4 h-4 flex-shrink-0 text-petanque-bois" />
                      <span className="font-medium">Exporter / imprimer</span>
                    </button>
                    {!isAdmin && tournament.status !== 'termine' && (
                      <p className="px-3 py-2 text-[11px] text-petanque-bois italic">Aucune autre action disponible</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>
      <TournamentSubNav
        tournoiId={tournament.id}
        mode={tournament.mode}
        currentPage="apercu"
        currentSection={activeSection}
        onSectionChange={(id) => setActiveSection(id as any)}
        userPlan={userPlan}
        baseRole={baseRole}
        viewRole={viewRole}
        setViewRole={(role) => setPreviewRole(role === 'organisateur' ? null : role)}
        isPreviewMode={isPreviewMode}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

        {/* APERÇU */}
        {activeSection === 'apercu' && (
          <div>
            {/* Hero contextuel */}
            <FadeIn>
              <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3">
                {tournament.status === 'preparation' ? 'En préparation' :
                 tournament.status === 'en_cours' ? `En cours · ${currentPhase === 'poules' ? 'Phase de poules' : currentPhase === 'elimination' ? 'Phases finales' : 'Finale'}` :
                 'Tournoi terminé'}
              </p>
              <h2 className="text-4xl md:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-3">
                {tournament.status === 'preparation' && (
                  needsTeams ? (
                    <>Compose tes équipes, <span className="accent-italic text-petanque-vert">puis lance la partie.</span></>
                  ) : (
                    <>Tout est prêt, <span className="accent-italic text-petanque-vert">démarre quand tu veux.</span></>
                  )
                )}
                {tournament.status === 'en_cours' && liveMatches.length > 0 && (
                  <>{liveMatches.length} match{liveMatches.length > 1 ? 's' : ''} en parallèle, <span className="accent-italic text-petanque-vert">{currentPhase === 'poules' ? 'la phase de poules avance.' : 'phases finales.'}</span></>
                )}
                {tournament.status === 'en_cours' && liveMatches.length === 0 && (
                  <>Tour en attente, <span className="accent-italic text-petanque-vert">prochain tour à lancer.</span></>
                )}
                {tournament.status === 'termine' && (
                  <>Champions, <span className="accent-italic text-petanque-vert">le podium est fait.</span></>
                )}
              </h2>
              <p className="text-base text-petanque-bois">
                Mode <span className="text-petanque-vert font-medium">{tournament.mode === 'choisi' ? 'choisi' : tournament.mode === 'melee_fixe' ? 'mêlée fixe' : 'mêlée tournante'}</span>
                {' · '}{formatLabel}
                {' · '}{isMelee
                  ? <>{playerCount} joueur{playerCount > 1 ? 's' : ''}{tournament.status !== 'preparation' ? ` · Rotation ${currentRotation}` : ''}</>
                  : <>{teams.length} équipe{teams.length > 1 ? 's' : ''}</>}
                {' · '}{tournament.settings.terrains} terrain{tournament.settings.terrains > 1 ? 's' : ''}
              </p>
            </FadeIn>

            {/* Stepper de phases (en_cours et termine seulement, pas mêlée tournante) */}
            {tournament.status !== 'preparation' && tournament.mode !== 'melee_tournante' && phasesSteps.length > 0 && (
              <FadeIn delay={80}>
                <div className="my-8 py-5 border-y border-petanque-sable-bord/50 flex items-center overflow-x-auto">
                  {phasesSteps.map((step, i) => (
                    <div
                      key={step.id}
                      onClick={(step.done || step.current) ? () => {
                        if (step.id === 'poules') setActiveSection('classement')
                        else router.push(`/tournoi/${tournament.id}/bracket`)
                      } : undefined}
                      className={`flex items-center flex-shrink-0 ${(step.done || step.current) ? 'cursor-pointer hover:opacity-75 transition-opacity' : ''}`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-medium ${
                        step.current ? 'bg-petanque-vert text-petanque-sable ring-4 ring-petanque-vert/20' :
                        step.done ? 'bg-petanque-vert text-petanque-sable' :
                        'bg-white border border-petanque-sable-bord text-petanque-bois/60'
                      }`}>
                        {step.done ? '✓' : i + 1}
                      </div>
                      <span className={`text-[11px] uppercase tracking-wider ml-2.5 ${
                        step.current ? 'text-petanque-vert-fonce font-medium' : 'text-petanque-bois'
                      }`}>
                        {step.label}
                      </span>
                      {i < phasesSteps.length - 1 && (
                        <div className={`w-12 md:w-16 h-px mx-3 ${step.done ? 'bg-petanque-vert' : 'bg-petanque-sable-bord'}`}></div>
                      )}
                    </div>
                  ))}
                </div>
              </FadeIn>
            )}

            {/* Action requise — préparation : composer les équipes OU démarrer */}
            {tournament.status === 'preparation' && isAdmin && (
              <FadeIn delay={120}>
                {needsTeams ? (
                  <div className="bg-petanque-cochonnet/10 border border-petanque-cochonnet/40 rounded-xl px-5 py-4 mb-8 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] font-medium text-petanque-cochonnet-fonce mb-1">Action requise</p>
                      <p className="text-sm text-petanque-vert-fonce">
                        {teams.length === 0
                          ? "Aucune équipe pour l'instant. Compose tes équipes pour pouvoir démarrer."
                          : `${teams.length} équipe${teams.length > 1 ? 's' : ''} composée${teams.length > 1 ? 's' : ''} · il en faut au moins 4 pour démarrer.`}
                      </p>
                    </div>
                    <Button variant="primary" onClick={() => { setActiveSection('equipes'); setShowTeamFormation(true) }}>
                      <Users className="w-4 h-4 mr-1.5" />Créer les équipes
                    </Button>
                  </div>
                ) : (
                  <div className="bg-petanque-vert-pale/30 border border-petanque-vert/30 rounded-xl px-5 py-4 mb-8 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] font-medium text-petanque-vert-fonce mb-1">Prêt à démarrer</p>
                      <p className="text-sm text-petanque-vert-fonce">{teams.length} équipes inscrites · Mode et format paramétrés.</p>
                    </div>
                    <Button variant="primary" onClick={() => setShowStartModal(true)}>
                      <Play className="w-4 h-4 mr-1.5" />Démarrer le tournoi
                    </Button>
                  </div>
                )}
              </FadeIn>
            )}

            {/* Action requise — phases finales à générer */}
            {tournament.status === 'en_cours' && isAdmin && tournament.mode !== 'melee_tournante' &&
             matches.some(m => m.type === 'poule' && m.status === 'termine') &&
             matches.filter(m => m.type === 'poule').every(m => m.status === 'termine') &&
             !matches.some(m => ['huitieme', 'quart', 'demi', 'finale'].includes(m.type || '')) && (
              <FadeIn delay={120}>
                <div className="bg-petanque-vert-pale/30 border border-petanque-vert/30 rounded-xl px-5 py-4 mb-8 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] font-medium text-petanque-vert-fonce mb-1">Prochaine étape</p>
                    <p className="text-sm text-petanque-vert-fonce">Toutes les poules ont fini. Génère les phases finales pour continuer.</p>
                  </div>
                  <Button variant="primary" onClick={async () => { await generateEliminationPhases(); router.push(`/tournoi/${tournament.id}/bracket`) }}>
                    <Flag className="w-4 h-4 mr-1.5" />Lancer les phases finales →
                  </Button>
                </div>
              </FadeIn>
            )}

            {/* Action requise — quarts/demis/finale */}
            {tournament.status === 'en_cours' && isAdmin && (() => {
              const huit = matches.filter(m => m.type === 'huitieme')
              const quart = matches.filter(m => m.type === 'quart')
              const demi = matches.filter(m => m.type === 'demi')
              const allHuit = huit.length > 0 && huit.every(m => m.status === 'termine')
              const allQuart = quart.length > 0 && quart.every(m => m.status === 'termine')
              const noQuart = quart.length === 0
              const noDemi = demi.length === 0
              if (allHuit && noQuart) return { label: 'Lancer les quarts', action: generateNextEliminationRound }
              if (allQuart && noDemi) return { label: 'Lancer les demi-finales', action: generateNextEliminationRound }
              if (demi.filter(m => m.status === 'termine').length === 2 && !matches.some(m => m.type === 'finale')) return { label: 'Lancer la finale', action: generateFinales }
              return null
            })() && (() => {
              const next = (() => {
                const huit = matches.filter(m => m.type === 'huitieme')
                const quart = matches.filter(m => m.type === 'quart')
                const demi = matches.filter(m => m.type === 'demi')
                const allHuit = huit.length > 0 && huit.every(m => m.status === 'termine')
                const allQuart = quart.length > 0 && quart.every(m => m.status === 'termine')
                const noQuart = quart.length === 0
                const noDemi = demi.length === 0
                if (allHuit && noQuart) return { label: 'Lancer les quarts', action: generateNextEliminationRound }
                if (allQuart && noDemi) return { label: 'Lancer les demi-finales', action: generateNextEliminationRound }
                if (demi.filter(m => m.status === 'termine').length === 2 && !matches.some(m => m.type === 'finale')) return { label: 'Lancer la finale', action: generateFinales }
                return null
              })()
              return (
                <FadeIn delay={120}>
                  <div className="bg-petanque-vert-pale/30 border border-petanque-vert/30 rounded-xl px-5 py-4 mb-8 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] font-medium text-petanque-vert-fonce mb-1">Prochaine étape</p>
                      <p className="text-sm text-petanque-vert-fonce">Le tour précédent est terminé.</p>
                    </div>
                    <Button variant="primary" onClick={async () => { await next!.action(); router.push(`/tournoi/${tournament.id}/bracket`) }}>
                      <Flag className="w-4 h-4 mr-1.5" />{next!.label} →
                    </Button>
                  </div>
                </FadeIn>
              )
            })()}

            {/* Phase finale : matchs en attente d'etre joues */}
            {tournament.status === 'en_cours' && isAdmin && (() => {
              const finalsTypes = ['huitieme', 'quart', 'demi', 'finale']
              const playable = matches.filter(m =>
                finalsTypes.includes(m.type || '') && m.status === 'a_jouer'
              )
              if (playable.length === 0) return null
              const phaseType = playable.some(m => m.type === 'finale') ? 'finale'
                : playable.some(m => m.type === 'demi') ? 'demi'
                : playable.some(m => m.type === 'quart') ? 'quart'
                : 'huitieme'
              const count = playable.filter(m => m.type === phaseType).length
              const labels: Record<string, [string, string]> = {
                huitieme: ['huitième de finale', 'huitièmes de finale'],
                quart: ['quart de finale', 'quarts de finale'],
                demi: ['demi-finale', 'demi-finales'],
                finale: ['finale', 'finales']
              }
              const [singular, plural] = labels[phaseType]
              const phaseLabel = count > 1 ? plural : singular
              return (
                <FadeIn delay={120}>
                  <div className="bg-petanque-vert-pale/30 border border-petanque-vert/30 rounded-xl px-5 py-4 mb-8 flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.16em] font-medium text-petanque-vert-fonce mb-1">Matchs en attente</p>
                      <p className="text-sm text-petanque-vert-fonce">{count} {phaseLabel} à jouer.</p>
                    </div>
                    <Button variant="primary" onClick={() => router.push(`/tournoi/${tournament.id}/bracket`)}>
                      <Flag className="w-4 h-4 mr-1.5" />Voir la phase finale →
                    </Button>
                  </div>
                </FadeIn>
              )
            })()}

            {/* Insight anti-rematch */}
            {antiRematchInsight && isAdmin && (
              <FadeIn delay={140}>
                <div className="bg-white border border-petanque-sable-bord/60 rounded-xl px-4 py-3 mb-8 flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-petanque-sable-pale flex items-center justify-center text-[12px] font-medium text-petanque-vert italic font-serif flex-shrink-0 mt-0.5">i</span>
                  <div className="flex-1">
                    <p className="text-sm text-petanque-vert-fonce leading-relaxed">
                      {antiRematchInsight.team1} et {antiRematchInsight.team2} se sont déjà affrontés en poule.{' '}
                      <span className="accent-italic text-petanque-bois">Veux-tu éviter ce rematch en quart ?</span>
                    </p>
                    <div className="flex gap-4 mt-2">
                      <button className="text-xs text-petanque-vert font-medium hover:text-petanque-vert-fonce">Oui, éviter</button>
                      <button onClick={() => setDismissedInsights(s => new Set(s).add('anti-rematch'))} className="text-xs text-petanque-bois hover:text-petanque-vert-fonce">Garder le tirage classique</button>
                    </div>
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Mêlée tournante : action rotation */}
            {tournament.mode === 'melee_tournante' && tournament.status === 'en_cours' && isAdmin && (
              <FadeIn delay={140}>
                <div className="bg-petanque-vert-pale/30 border border-petanque-vert/30 rounded-xl px-5 py-4 mb-8 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] font-medium text-petanque-vert-fonce mb-1">Rotation</p>
                    <p className="text-sm text-petanque-vert-fonce">Régénère les équipes pour le prochain tour.</p>
                  </div>
                  <Button variant="primary" onClick={reformTeamsForRotation} disabled={!isRotationAvailable}>
                    <Shuffle className="w-4 h-4 mr-1.5" />Nouvelle rotation
                  </Button>
                </div>
              </FadeIn>
            )}

            {/* EN CE MOMENT */}
            {tournament.status === 'en_cours' && liveMatches.length > 0 && (
              <FadeIn delay={160}>
                <div className="mt-14">
                  <div className="flex items-baseline justify-between mb-4">
                    <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em]">En ce moment</p>
                    <button onClick={() => setActiveSection('matchs')} className="text-xs text-petanque-vert hover:text-petanque-vert-fonce">Tous les matchs →</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {liveMatches.map(match => (
                      <MatchCard
                        key={match.id}
                        match={match}
                        maxPoints={tournament.settings.maxPoints || 13}
                        isOrganizer={isAdmin}
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

            {tournament.status === 'en_cours' && currentPhase === 'poules' && tournament.mode !== 'melee_tournante' && leadersByPoule.length > 0 && teamsByPoule && !matches.some(m => m.type === 'poule' && m.status === 'termine') && (
              <FadeIn delay={200}>
                <div className="mt-14">
                  <div className="flex items-baseline justify-between mb-4">
                    <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em]">Composition des poules</p>
                    <button onClick={() => setActiveSection('classement')} className="text-xs text-petanque-vert hover:text-petanque-vert-fonce">Voir les équipes →</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.keys(teamsByPoule).sort().map(poule => (
                      <div key={poule} className="bg-white border border-petanque-sable-bord/60 border-l-[3px] border-l-petanque-bois/40 rounded-r-lg p-4">
                        <p className="font-mono text-[9px] text-petanque-bois uppercase tracking-[0.18em] mb-2">Poule {poule}</p>
                        <ul className="space-y-1">
                          {teamsByPoule[poule].map((t: any, i: number) => (
                            <li key={i} className="text-sm text-petanque-vert-fonce truncate">{t.name}</li>
                          ))}
                        </ul>
                        <p className="font-mono text-[9px] text-petanque-bois mt-2 italic">Aucun match joué</p>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}

            {/* LEADERS de chaque poule */}
            {tournament.status === 'en_cours' && currentPhase === 'poules' && tournament.mode !== 'melee_tournante' && leadersByPoule.length > 0 && matches.some(m => m.type === 'poule' && m.status === 'termine') && (
              <FadeIn delay={200}>
                <div className="mt-14">
                  <div className="flex items-baseline justify-between mb-4">
                    <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em]">Leaders de chaque poule</p>
                    <button onClick={() => setActiveSection('classement')} className="text-xs text-petanque-vert hover:text-petanque-vert-fonce">Classement complet →</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {leadersByPoule.map(({ poule, leader }) => (
                      <div key={poule} className="bg-white border border-petanque-sable-bord/60 border-l-[3px] border-l-petanque-vert rounded-r-lg p-4">
                        <p className="font-mono text-[9px] text-petanque-bois uppercase tracking-[0.18em] mb-1">Poule {poule}</p>
                        <p className="text-base font-medium text-petanque-vert-fonce truncate mb-1">{leader.name}</p>
                        <p className="font-mono text-[10px] text-petanque-bois">
                          {leader.victories || 0}V {leader.draws ? `${leader.draws}N ` : ''}{leader.defeats || 0}D · {(leader.pointsFor || 0) - (leader.pointsAgainst || 0) >= 0 ? '+' : ''}{(leader.pointsFor || 0) - (leader.pointsAgainst || 0)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Mêlée tournante : top individuel */}
            {tournament.mode === 'melee_tournante' && tournament.status === 'en_cours' && individualRankings.length > 0 && (
              <FadeIn delay={200}>
                <div className="mt-14">
                  <div className="flex items-baseline justify-between mb-4">
                    <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em]">Top 5 individuel</p>
                    <button onClick={() => setActiveSection('classement')} className="text-xs text-petanque-vert hover:text-petanque-vert-fonce">Classement complet →</button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {individualRankings.slice(0, 5).map((p, i) => (
                      <div key={p.id} className="bg-white border border-petanque-sable-bord/60 border-l-[3px] border-l-petanque-vert rounded-r-lg p-4">
                        <p className="font-mono text-[9px] text-petanque-bois uppercase tracking-[0.18em] mb-1">#{String(i + 1).padStart(2, '0')}</p>
                        <p className="text-base font-medium text-petanque-vert-fonce truncate mb-1">{p.name}</p>
                        <p className="font-mono text-[10px] text-petanque-bois">{p.victories}V · {p.points} pts</p>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            )}

            {/* PODIUM (terminé) — en mêlée tournante, le podium = classement individuel */}
            {tournament.status === 'termine' && (
              <FadeIn delay={160}>
                <div className="mt-10 grid grid-cols-3 gap-4">
                  {[
                    { rank: 1, label: 'Champion', boule: 'acier' as const },
                    { rank: 2, label: '2e place', boule: 'cochonnet' as const },
                    { rank: 3, label: '3e place', boule: 'vert' as const },
                  ].map((p, i) => {
                    const winner = isMelee ? individualRankings[i] : teamsWithStats[i]
                    if (!winner) return null
                    return (
                      <div key={p.rank} className="bg-white border border-petanque-sable-bord/60 rounded-xl p-5 text-center">
                        <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.18em] mb-3">{p.label}</p>
                        <div className="flex justify-center mb-3">
                          <BouleSvg size={56} variant={p.boule} stries />
                        </div>
                        <p className="text-base font-medium text-petanque-vert-fonce truncate">{winner.name}</p>
                      </div>
                    )
                  })}
                </div>
                <div className="text-center mt-6">
                  {isMelee ? (
                    <Button variant="primary" onClick={() => setActiveSection('classement')}>
                      <Trophy className="w-4 h-4 mr-1.5" />Voir le classement complet
                    </Button>
                  ) : (
                    <Button variant="primary" onClick={() => router.push(`/tournoi/${tournament.id}/podium`)}>
                      <Trophy className="w-4 h-4 mr-1.5" />Voir le podium détaillé
                    </Button>
                  )}
                </div>
              </FadeIn>
            )}

            {/* ACTIVITE RECENTE */}
            {recentActivity.length > 0 && (
              <FadeIn delay={240}>
                <div className="mt-14">
                  <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-4">Activité récente</p>
                  <div className="flex flex-col">
                    {recentActivity.map((m: any, i) => {
                      const eqA = teams.find(t => t.id === m.equipe_a_id)?.name || 'Équipe A'
                      const eqB = teams.find(t => t.id === m.equipe_b_id)?.name || 'Équipe B'
                      const winner = m.score_a > m.score_b ? eqA : eqB
                      const score = m.score_a > m.score_b ? `${m.score_a}–${m.score_b}` : `${m.score_b}–${m.score_a}`
                      const loser = m.score_a > m.score_b ? eqB : eqA
                      const phaseLabel = (() => {
                        if (m.type === 'poule') return m.poule ? `Poule ${m.poule}` : 'Poule'
                        if (m.type === 'huitieme') return '8e de finale'
                        if (m.type === 'quart') return 'Quart de finale'
                        if (m.type === 'demi') return 'Demi-finale'
                        if (m.type === 'finale') return 'Finale'
                        if (m.type === 'petite_finale') return 'Petite finale'
                        return `Tour ${m.tour}`
                      })()
                      return (
                        <div key={m.id} className="flex items-center justify-between py-3 border-b border-petanque-sable-bord/40 last:border-b-0 text-sm">
                          <span className="text-petanque-vert-fonce">
                            <span className="text-petanque-bois">Match terminé · </span>
                            <span className="font-medium">{winner}</span> {score} {loser}
                          </span>
                          <span className="font-mono text-[11px] text-petanque-bois">{phaseLabel}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </FadeIn>
            )}

            {/* Empty state si pas encore de matchs et préparation */}
            {tournament.status === 'preparation' && matches.length === 0 && (
              <FadeIn delay={200}>
                <div className="mt-10 text-center py-12 bg-white border border-petanque-sable-bord/60 rounded-xl">
                  <BouleSvg size={48} variant="acier" stries className="mx-auto mb-4" />
                  <p className="text-petanque-bois text-sm">
                    {needsTeams
                      ? "Crée tes équipes dans l'onglet Équipes, puis démarre le tournoi pour générer les matchs."
                      : "Les matchs seront générés automatiquement au démarrage du tournoi."}
                  </p>
                </div>
              </FadeIn>
            )}
          </div>
        )}

        {/* TOUS LES MATCHS - liste pro tailles agrandies */}
        {activeSection === 'matchs' && (() => {
          const isAvenir = (m: any) => m.status !== 'en_cours' && m.status !== 'termine'
          const applyFilter = (list: any[]) => {
            if (matchsFilter === 'all') return list
            if (matchsFilter === 'a_venir') return list.filter(isAvenir)
            return list.filter(m => m.status === matchsFilter)
          }
          const filtered = applyFilter(matches)
          const counts = {
            all: matches.length,
            a_venir: matches.filter(isAvenir).length,
            en_cours: matches.filter(m => m.status === 'en_cours').length,
            termine: matches.filter(m => m.status === 'termine').length,
          }
          return (
            <div>
              {matches.length === 0 ? (
                <div className="text-center py-16">
                  <Flag className="w-14 h-14 mx-auto text-petanque-sable-bord mb-4" />
                  <p className="text-petanque-bois mb-6 text-base">Aucun match généré pour le moment.</p>
                  {isAdmin && tournament.status === 'preparation' && (
                    <Button variant="primary" onClick={generatePoules}>Générer les poules</Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
                    <div className="flex flex-wrap gap-2.5">
                      {([
                        { id: 'all', label: 'Tous' },
                        { id: 'a_venir', label: 'À venir' },
                        { id: 'en_cours', label: 'En cours' },
                        { id: 'termine', label: 'Terminés' },
                      ] as const).map(f => (
                        <button
                          key={f.id}
                          onClick={() => setMatchsFilter(f.id)}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            matchsFilter === f.id
                              ? 'bg-petanque-vert text-petanque-sable'
                              : 'bg-white text-petanque-bois border border-petanque-sable-bord/60 hover:border-petanque-vert/40'
                          }`}
                        >
                          {f.label}
                          <span className={`font-mono text-xs ${matchsFilter === f.id ? 'text-petanque-sable/70' : 'text-petanque-bois/60'}`}>{counts[f.id]}</span>
                        </button>
                      ))}
                    </div>
                    <p className="font-mono text-sm text-petanque-bois">
                      {filtered.length} affiché{filtered.length > 1 ? 's' : ''}
                    </p>
                  </div>

                  <div className="bg-white border border-petanque-sable-bord/60 rounded-xl overflow-hidden">
                    {Array.from(new Set(filtered.map((m: any) => m.tour))).sort((a, b) => (a as number) - (b as number)).map((tour, idx) => {
                      const tourMatchs = filtered.filter((m: any) => m.tour === tour)
                      if (tourMatchs.length === 0) return null
                      const tT = tourMatchs.filter((m: any) => m.status === 'termine').length
                      const tEC = tourMatchs.filter((m: any) => m.status === 'en_cours').length
                      const tAV = tourMatchs.filter(isAvenir).length
                      return (
                        <div key={tour as any}>
                          <div className={`bg-petanque-sable-pale px-6 py-3.5 flex items-center justify-between ${idx > 0 ? 'border-t border-petanque-sable-bord/60' : ''}`}>
                            <span className="text-xs uppercase tracking-[0.16em] font-medium text-petanque-bois">Tour {tour as any}</span>
                            <span className="font-mono text-xs text-petanque-bois">
                              {tT > 0 && <>{tT} terminé{tT > 1 ? 's' : ''}</>}
                              {tT > 0 && tEC > 0 && ' · '}
                              {tEC > 0 && <span className="text-petanque-vert">{tEC} en cours</span>}
                              {(tT > 0 || tEC > 0) && tAV > 0 && ' · '}
                              {tAV > 0 && <>{tAV} à venir</>}
                            </span>
                          </div>
                          {tourMatchs.map((match: any) => {
                            const eqA = teams.find(t => t.id === match.equipe_a_id)?.name || 'Équipe A'
                            const eqB = teams.find(t => t.id === match.equipe_b_id)?.name || 'Équipe B'
                            const hasScore = match.score_a !== null && match.score_b !== null
                            const aLead = hasScore && match.score_a > match.score_b
                            const bLead = hasScore && match.score_b > match.score_a
                            const statusLabel = match.status === 'en_cours' ? 'En cours' : match.status === 'termine' ? 'Terminé' : 'À venir'
                            const statusColor = match.status === 'en_cours' ? 'text-petanque-vert' : match.status === 'termine' ? 'text-petanque-bois' : 'text-petanque-cochonnet'
                            return (
                              <button
                                key={match.id}
                                onClick={() => router.push(`/match/${match.id}`)}
                                className="w-full px-6 py-5 flex items-center gap-5 border-t border-petanque-sable-bord/40 hover:bg-petanque-sable-pale/40 transition-colors text-left group"
                              >
                                <div className="font-mono text-sm text-petanque-bois w-12 flex-shrink-0">
                                  {match.terrain ? `T${match.terrain}` : '—'}
                                </div>
                                <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-8 gap-y-2">
                                  <div className="flex items-center justify-between gap-3 min-w-0">
                                    <span className={`text-base truncate text-petanque-vert-fonce ${aLead ? 'font-medium' : ''}`}>{eqA}</span>
                                    <span className={`font-mono text-xl flex-shrink-0 ${aLead ? 'text-petanque-vert font-medium' : 'text-petanque-bois'}`}>
                                      {match.score_a ?? '–'}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between gap-3 min-w-0">
                                    <span className={`text-base truncate text-petanque-vert-fonce ${bLead ? 'font-medium' : ''}`}>{eqB}</span>
                                    <span className={`font-mono text-xl flex-shrink-0 ${bLead ? 'text-petanque-vert font-medium' : 'text-petanque-bois'}`}>
                                      {match.score_b ?? '–'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0 w-28 justify-end">
                                  {match.status === 'en_cours' && <span className="w-1.5 h-1.5 rounded-full bg-petanque-vert animate-pulse"></span>}
                                  <span className={`text-xs uppercase tracking-widest font-medium ${statusColor}`}>
                                    {statusLabel}
                                  </span>
                                </div>
                                <span className="text-petanque-bois/30 flex-shrink-0 group-hover:text-petanque-vert transition-colors text-lg">→</span>
                              </button>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )
        })()}

        {/* CLASSEMENT */}
        {activeSection === 'classement' && (
          <div>
            {tournament.mode === 'melee_tournante' ? (
              <PlayerRankingsTable players={individualRankings.map((player: any) => ({
                id: player.id, name: player.name, email: player.email,
                played: player.played, victories: player.victories,
                defeats: player.defeats, draws: player.draws,
                pointsFor: player.pointsFor, pointsAgainst: player.pointsAgainst,
                difference: player.difference, points: player.points
              }))} />
            ) : (
              <div className="space-y-6">
                {Object.keys(teamsByPoule).sort().map(poule => (
                  <StandingsTable
                    key={poule}
                    poule={poule}
                    teams={teamsByPoule[poule].map((t: any) => ({
                      id: t.id, name: t.name, played: t.played || 0,
                      victories: t.victories || 0, defeats: t.defeats || 0, draws: t.draws || 0,
                      pointsFor: t.pointsFor || 0, pointsAgainst: t.pointsAgainst || 0,
                      difference: t.difference || 0,
                      points: (t.victories || 0) * 3 + (t.draws || 0)
                    }))}
                    qualifiedCount={tournament.settings.qualifiedPerPoule || 2}
                  />
                ))}
                <div className="text-center pt-2">
                  <Button variant="ghost" onClick={() => refreshClassement(loadTournamentData)} disabled={refreshingClassement}>
                    {refreshingClassement ? <Loader className="w-4 h-4 animate-spin mr-2" /> : <Refresh className="w-4 h-4 mr-2" />}
                    Actualiser
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* EQUIPES */}
        {activeSection === 'equipes' && (
          <div className="space-y-6">
            {tournament.mode === 'choisi' && tournament.status === 'preparation' && isAdmin && (
              teams.length === 0 ? (
                <div className="bg-petanque-cochonnet/10 border border-petanque-cochonnet/40 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div>
                    <p className="text-sm font-medium text-petanque-cochonnet-fonce mb-0.5">Aucune équipe pour l&apos;instant</p>
                    <p className="text-sm text-petanque-bois">Compose tes équipes manuellement — il en faut au moins 4 pour démarrer.</p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setShowTeamFormation(true)}>
                    Composer les équipes
                  </Button>
                </div>
              ) : (
                <div className="bg-petanque-vert-pale/30 border border-petanque-vert/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div>
                    <p className="text-sm font-medium text-petanque-vert-fonce mb-0.5">{teams.length} équipe{teams.length > 1 ? 's' : ''} composée{teams.length > 1 ? 's' : ''}</p>
                    <p className="text-sm text-petanque-bois">
                      {teams.length < 4
                        ? `Encore ${4 - teams.length} équipe${4 - teams.length > 1 ? 's' : ''} pour pouvoir démarrer.`
                        : "Tu peux démarrer le tournoi, ou ajouter d'autres équipes."}
                    </p>
                  </div>
                  <Button variant="primary" size="sm" onClick={() => setShowTeamFormation(true)}>
                    + Ajouter une équipe
                  </Button>
                </div>
              )
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map(team => (
                <div key={team.id} className="bg-white border border-petanque-sable-bord/60 rounded-xl p-5">
                  <h3 className="text-base font-medium text-petanque-vert-fonce mb-3">{team.name}</h3>
                  <div className="space-y-2">
                    {team.equipes_joueurs?.map((ej: any, i: number) => (
                      <div key={i} className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium bg-petanque-sable text-petanque-vert-fonce">
                          {ej.joueur?.name?.charAt(0)}
                        </div>
                        <span className="text-sm text-petanque-bois">{ej.joueur?.name}</span>
                      </div>
                    ))}
                  </div>
                  {tournament.status === 'preparation' && isAdmin && (
                    <button
                      onClick={() => { setEditingTeam(team); setNewTeamName(team.name) }}
                      className="mt-4 text-xs text-petanque-bois hover:text-petanque-vert-fonce font-medium"
                    >
                      Renommer →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STATS */}
        {activeSection === 'stats' && userPlan === 'club' && (
          <AdvancedStats matches={matches} teams={teams} maxPoints={tournament.settings.maxPoints || 13} />
        )}
      </main>

      {/* Modaux (admin only) */}
      {isAdmin && showStartModal && tournament && (
        <StartTournamentModal
          tournament={tournament} teams={teams}
          onClose={() => setShowStartModal(false)}
          onStart={handleStartTournament}
          onUpdateTournament={setTournament}
          isValidPoolConfiguration={isValidPoolConfiguration}
          getValidPoolSizes={getValidPoolSizes}
          getPoolDistribution={getPoolDistribution}
        />
      )}
      {isAdmin && editingTeam && (
        <RenameTeamModal
          editingTeam={editingTeam}
          newTeamName={newTeamName}
          onNameChange={setNewTeamName}
          onClose={() => { setEditingTeam(null); setNewTeamName('') }}
          onRename={renameTeam}
        />
      )}
      {isAdmin && showTeamFormation && tournament && (
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
