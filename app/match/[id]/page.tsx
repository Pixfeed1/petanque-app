'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { useMatchScore } from '@/hooks/match'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import { Button, BouleSvg, FadeIn } from '@/components/ui'
import {
  Trophy, Plus, Minus, Check, Clock, ArrowLeft,
  Undo, Loader, Save, Play
} from '@/components/Icons'


export default function MatchScorePage() {
  const router = useRouter()
  const params = useParams()
  const [mounted, setMounted] = useState(false)
  const { showSuccess, showError, showWarning } = useToast()
  const { confirm, ConfirmModal } = useConfirm()
  const { organization } = useAuth()
  const [tournamentOrgId, setTournamentOrgId] = useState<string | null>(null)

  const {
    match, loading, saving, scoreA, scoreB, manches,
    currentManche, mancheScoreA, mancheScoreB, winner,
    elapsedTime, maxPoints, maxPointsPerManche,
    updateScore, finishMatch, finishManche, undoLastManche,
    saveProgress, formatTime
  } = useMatchScore({
    matchId: params?.id,
    onSuccess: showSuccess,
    onError: showError,
    onWarning: showWarning,
    onConfirm: confirm
  })

  // Determination role : fetch du tournoi pour comparer org_id
  useEffect(() => {
    const tid = match?.tournoi?.id
    if (!tid) return
    let cancelled = false
    fetch(`/api/tournois/${tid}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data) return
        setTournamentOrgId(data.org_id ? String(data.org_id) : null)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [match?.tournoi?.id])

  useEffect(() => {
    setMounted(true) }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-7 h-7 animate-spin mx-auto text-petanque-vert" />
          <p className="mt-4 text-sm text-petanque-bois">Chargement du match…</p>
        </div>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-2xl font-medium text-petanque-vert-fonce mb-2">Match introuvable</p>
          <p className="text-sm text-petanque-bois mb-6">Ce match n’existe plus ou n’est plus accessible.</p>
          <Button variant="primary" onClick={() => router.push('/dashboard')}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    )
  }

  // isAdmin = user appartient a l'organisation du tournoi (phase 2 : autoriser joueurs aussi)
  const isAdmin = !!tournamentOrgId && !!organization && String(organization.id) === tournamentOrgId
  const teamAName = match.equipe_a?.name || 'Équipe A'
  const teamBName = match.equipe_b?.name || 'Équipe B'
  const playersA = (match.equipe_a as any)?.equipes_joueurs?.map((ej: any) => ej.joueur?.name).filter(Boolean).join(' · ') || ''
  const playersB = (match.equipe_b as any)?.equipes_joueurs?.map((ej: any) => ej.joueur?.name).filter(Boolean).join(' · ') || ''
  const isLeaderA = scoreA > scoreB
  const isLeaderB = scoreB > scoreA
  const remainingA = maxPoints - scoreA
  const remainingB = maxPoints - scoreB
  const matchPointA = scoreA === maxPoints - 1
  const matchPointB = scoreB === maxPoints - 1

  // Hero contextuel
  let heroContent: React.ReactNode
  if (winner) {
    const winnerName = winner === 'A' ? teamAName : teamBName
    const high = Math.max(scoreA, scoreB)
    const low = Math.min(scoreA, scoreB)
    heroContent = <>{winnerName}, <span className="accent-italic text-petanque-vert">l’emportent {high}–{low}.</span></>
  } else if (matchPointA || matchPointB) {
    const team = matchPointA ? teamAName : teamBName
    heroContent = <>Match point, <span className="accent-italic text-petanque-vert">{team} à un point.</span></>
  } else if (isLeaderA || isLeaderB) {
    const leader = isLeaderA ? teamAName : teamBName
    heroContent = <>Première à {maxPoints} gagne, <span className="accent-italic text-petanque-vert">{leader} mènent.</span></>
  } else if (scoreA > 0 || scoreB > 0) {
    heroContent = <>Première à {maxPoints} gagne, <span className="accent-italic text-petanque-vert">à égalité.</span></>
  } else {
    heroContent = <>Match prêt à démarrer, <span className="accent-italic text-petanque-vert">la mène 1 t’attend.</span></>
  }

  return (
    <div className="min-h-screen bg-petanque-sable-pale">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-petanque-sable-pale/85 backdrop-blur-xl border-b border-petanque-sable-bord/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <button
              onClick={() => match?.tournoi?.id && router.push(`/tournoi/${match.tournoi.id}`)}
              className="text-sm text-petanque-bois hover:text-petanque-vert-fonce font-medium flex items-center gap-1.5 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Retour au tournoi</span>
            </button>
            <div className="hidden md:flex items-center gap-2 font-mono text-xs text-petanque-bois truncate">
              <span>T{match.tour}</span>
              <span className="text-petanque-sable-bord">·</span>
              <span>Match</span>
              <span className="text-petanque-sable-bord">·</span>
              <span className="truncate max-w-[260px]">{match.tournoi?.name}</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-petanque-sable-bord/60 rounded-lg font-mono text-sm text-petanque-vert-fonce font-medium flex-shrink-0">
              <Clock className="w-3.5 h-3.5 text-petanque-bois" />
              {formatTime(elapsedTime)}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">

        {/* Eyebrow + hero */}
        <FadeIn>
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            {!winner ? (
              <span className="text-petanque-vert flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-petanque-vert animate-pulse"></span>
                En cours
              </span>
            ) : (
              <span>Terminé</span>
            )}
            {match.terrain && (<><span className="text-petanque-sable-bord">·</span><span>Terrain {match.terrain}</span></>)}
            {!winner && (<><span className="text-petanque-sable-bord">·</span><span>Mène {currentManche}</span></>)}
          </p>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.1] mb-8">
            {heroContent}
          </h1>
        </FadeIn>

        {/* Récap match avec face-à-face */}
        <FadeIn delay={80}>
          <div className="bg-white border border-petanque-sable-bord/60 rounded-2xl p-5 md:p-7 mb-8">
            <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] gap-2 md:gap-5 items-center">
              {/* Équipe A */}
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <BouleSvg size={40} variant="acier" stries className="flex-shrink-0 hidden sm:block" />
                <div className="min-w-0">
                  <p className="text-sm md:text-base font-medium text-petanque-vert-fonce truncate">{teamAName}</p>
                  {playersA && <p className="text-[11px] text-petanque-bois truncate mt-0.5">{playersA}</p>}
                </div>
              </div>
              {/* Score A */}
              <p className={`font-mono text-4xl md:text-5xl font-medium leading-none tracking-tight tabular-nums ${
                isLeaderA ? 'text-petanque-vert' : isLeaderB ? 'text-petanque-bois' : 'text-petanque-vert-fonce'
              }`}>
                {scoreA}
              </p>
              {/* Sep */}
              <span className="text-petanque-sable-bord text-2xl md:text-3xl font-light">—</span>
              {/* Score B */}
              <p className={`font-mono text-4xl md:text-5xl font-medium leading-none tracking-tight tabular-nums ${
                isLeaderB ? 'text-petanque-vert' : isLeaderA ? 'text-petanque-bois' : 'text-petanque-vert-fonce'
              }`}>
                {scoreB}
              </p>
              {/* Équipe B */}
              <div className="flex items-center gap-2 md:gap-3 min-w-0 justify-end text-right">
                <div className="min-w-0">
                  <p className="text-sm md:text-base font-medium text-petanque-vert-fonce truncate">{teamBName}</p>
                  {playersB && <p className="text-[11px] text-petanque-bois truncate mt-0.5">{playersB}</p>}
                </div>
                <BouleSvg size={40} variant="cochonnet" stries className="flex-shrink-0 hidden sm:block" />
              </div>
            </div>

            {/* Barres de progression */}
            <div className="flex gap-2 mt-5 md:mt-6">
              <div className="flex-1 h-1 bg-petanque-sable-bord/40 rounded-full overflow-hidden">
                <div className="h-full bg-petanque-vert rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (scoreA / maxPoints) * 100)}%` }} />
              </div>
              <div className="flex-1 h-1 bg-petanque-sable-bord/40 rounded-full overflow-hidden">
                <div className="h-full bg-petanque-vert rounded-full transition-all duration-500" style={{ width: `${Math.min(100, (scoreB / maxPoints) * 100)}%` }} />
              </div>
            </div>
            <div className="flex justify-between items-center mt-3 text-xs text-petanque-bois">
              <span>
                {!winner && remainingA > 0 && remainingA < remainingB && <><strong className="text-petanque-vert font-medium">{remainingA} pts</strong> restants pour {teamAName}</>}
                {!winner && remainingB > 0 && remainingB < remainingA && <><strong className="text-petanque-vert font-medium">{remainingB} pts</strong> restants pour {teamBName}</>}
                {!winner && remainingA === remainingB && <>Première à {maxPoints} gagne</>}
                {winner && <>Match terminé en {formatTime(elapsedTime)}</>}
              </span>
              <span className="font-mono">{scoreA} – {scoreB}</span>
            </div>
          </div>
        </FadeIn>

        {/* SAISIE MÈNE EN COURS */}
        {!winner && isAdmin && (
          <FadeIn delay={140}>
            <div className="bg-white border border-petanque-sable-bord/60 rounded-2xl p-5 md:p-7 mb-6">
              <div className="flex items-baseline justify-between mb-6 gap-3 flex-wrap">
                <span className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em]">Mène {currentManche} en cours</span>
                <span className="accent-italic text-petanque-bois text-sm">Saisis les points marqués pendant cette mène.</span>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-5">
                <div className="flex flex-col items-center gap-3 py-2">
                  <p className="text-xs text-petanque-bois font-medium truncate max-w-full px-2">{teamAName}</p>
                  <p className="font-mono text-5xl md:text-6xl font-medium text-petanque-vert-fonce leading-none tracking-tight tabular-nums">{mancheScoreA}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateScore('A', -1)}
                      disabled={mancheScoreA === 0 || saving}
                      className="w-14 h-12 rounded-xl border border-petanque-sable-bord/60 bg-white font-mono text-lg text-petanque-bois hover:bg-petanque-sable-pale/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      −1
                    </button>
                    <button
                      onClick={() => updateScore('A', 1)}
                      disabled={mancheScoreA === maxPointsPerManche || saving}
                      className="w-14 h-12 rounded-xl bg-petanque-vert text-petanque-sable font-mono text-lg font-medium hover:bg-petanque-vert-fonce disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                    >
                      +1
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-3 py-2">
                  <p className="text-xs text-petanque-bois font-medium truncate max-w-full px-2">{teamBName}</p>
                  <p className="font-mono text-5xl md:text-6xl font-medium text-petanque-vert-fonce leading-none tracking-tight tabular-nums">{mancheScoreB}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateScore('B', -1)}
                      disabled={mancheScoreB === 0 || saving}
                      className="w-14 h-12 rounded-xl border border-petanque-sable-bord/60 bg-white font-mono text-lg text-petanque-bois hover:bg-petanque-sable-pale/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      −1
                    </button>
                    <button
                      onClick={() => updateScore('B', 1)}
                      disabled={mancheScoreB === maxPointsPerManche || saving}
                      className="w-14 h-12 rounded-xl bg-petanque-vert text-petanque-sable font-mono text-lg font-medium hover:bg-petanque-vert-fonce disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                    >
                      +1
                    </button>
                  </div>
                </div>
              </div>
              {mancheScoreA === 0 && mancheScoreB === 0 && (
                <p className="text-center mt-4 text-xs text-petanque-bois italic">Mène annulée si validée à 0–0 (cochonnet sorti).</p>
              )}
              <div className="mt-6 pt-5 border-t border-petanque-sable-bord/50 flex items-center justify-between gap-3 flex-wrap">
                <button
                  onClick={finishManche}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-petanque-vert text-petanque-sable rounded-lg font-medium text-sm hover:bg-petanque-vert-fonce disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                >
                  {saving ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Valider la mène {currentManche}
                    </>
                  )}
                </button>
                <div className="flex gap-2 flex-wrap">
                  {manches.length > 0 && (
                    <button
                      onClick={undoLastManche}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-petanque-bois hover:text-petanque-vert-fonce hover:bg-petanque-sable-pale/60 rounded-lg transition-colors font-medium"
                    >
                      <Undo className="w-3.5 h-3.5" />
                      Annuler la mène {manches.length}
                    </button>
                  )}
                  {match?.tournoi?.settings?.timeLimit === true && (scoreA > 0 || scoreB > 0) && scoreA !== scoreB && (
                    <button
                      onClick={async () => {
                        const confirmed = await confirm({ title: 'Fin au temps', message: 'Terminer le match avec le score actuel ?' })
                        if (confirmed) await finishMatch(scoreA, scoreB, manches)
                      }}
                      disabled={saving}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-petanque-cochonnet hover:text-petanque-cochonnet-fonce hover:bg-petanque-cochonnet-pale/40 rounded-lg transition-colors font-medium"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Terminer au temps
                    </button>
                  )}
                </div>
              </div>
            </div>
          </FadeIn>
        )}

        {/* TERMINÉ */}
        {winner && (
          <FadeIn delay={140}>
            <div className="bg-petanque-vert text-petanque-sable rounded-2xl p-7 md:p-10 mb-6 text-center">
              <div className="flex justify-center mb-5">
                <BouleSvg size={64} variant={winner === 'A' ? 'acier' : 'cochonnet'} stries />
              </div>
              <p className="text-[11px] uppercase tracking-[0.18em] font-medium opacity-70 mb-2">Vainqueur</p>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-medium tracking-tight mb-3">
                {winner === 'A' ? teamAName : teamBName}
              </h2>
              <p className="font-mono text-2xl mb-1">{Math.max(scoreA, scoreB)} – {Math.min(scoreA, scoreB)}</p>
              <p className="text-sm opacity-70">Match terminé en {formatTime(elapsedTime)}</p>
              {saving && (
                <div className="flex items-center justify-center mt-5 text-sm opacity-80">
                  <Loader className="w-4 h-4 animate-spin mr-2" /> Sauvegarde…
                </div>
              )}
            </div>
          </FadeIn>
        )}

        {/* HISTORIQUE DES MÈNES */}
        {(manches.length > 0 || (!winner && (mancheScoreA > 0 || mancheScoreB > 0))) && (
          <FadeIn delay={200}>
            <div>
              <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3">Détail des mènes</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                {manches.map((manche: any, i: number) => {
                  const aWon = manche.scoreA > manche.scoreB
                  const bWon = manche.scoreB > manche.scoreA
                  return (
                    <div key={i} className="bg-white border border-petanque-sable-bord/60 rounded-lg p-3">
                      <p className="font-mono text-[9px] text-petanque-bois uppercase tracking-[0.18em] mb-1.5">Mène {i + 1}</p>
                      <div className="flex justify-between items-center font-mono text-base">
                        <span className={aWon ? 'text-petanque-vert font-medium' : 'text-petanque-bois'}>{manche.scoreA}</span>
                        <span className="text-petanque-sable-bord text-xs">–</span>
                        <span className={bWon ? 'text-petanque-vert font-medium' : 'text-petanque-bois'}>{manche.scoreB}</span>
                      </div>
                    </div>
                  )
                })}
                {!winner && (mancheScoreA > 0 || mancheScoreB > 0) && (
                  <div className="bg-petanque-vert-pale/30 border border-petanque-vert/30 border-dashed rounded-lg p-3">
                    <p className="font-mono text-[9px] text-petanque-vert uppercase tracking-[0.18em] mb-1.5">Mène {currentManche}</p>
                    <div className="flex justify-between items-center font-mono text-base">
                      <span className={mancheScoreA > mancheScoreB ? 'text-petanque-vert font-medium' : 'text-petanque-bois'}>{mancheScoreA}</span>
                      <span className="text-petanque-sable-bord text-xs">–</span>
                      <span className={mancheScoreB > mancheScoreA ? 'text-petanque-vert font-medium' : 'text-petanque-bois'}>{mancheScoreB}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Bouton sauvegarder progression */}
        {!winner && isAdmin && manches.length > 0 && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => saveProgress(scoreA, scoreB, manches, false)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-petanque-bois hover:text-petanque-vert-fonce hover:bg-white border border-petanque-sable-bord/60 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Sauvegarder la progression
            </button>
          </div>
        )}
      </main>

      {ConfirmModal}
    </div>
  )
}
