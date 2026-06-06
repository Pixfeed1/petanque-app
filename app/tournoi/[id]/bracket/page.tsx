'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useBracket, BracketMatch } from '@/hooks/bracket'
import { Button, BouleSvg, FadeIn } from '@/components/ui'
import { Loader } from '@/components/Icons'
import TournamentSubNav, { ViewRole } from '@/components/tournament/TournamentSubNav'
import { useAuth } from '@/app/providers/AuthProvider'
import { useEffectiveRole } from '@/hooks/useEffectiveRole'

const COL_WIDTH = 220
const HORIZONTAL_GAP = 60
const VERTICAL_GAP = 30

type Phase = {
  label: string
  shortLabel: string
  matches: (BracketMatch | null | undefined)[]
  matchCount: number
  isFinale?: boolean
}

type PhaseWithLayout = Phase & {
  positions: { top: number; center: number }[]
  colLeft: number
}

// ========================================================
// Layout calculation
// ========================================================

function buildPhases(bracketData: any, hasHuitiemes: boolean, hasQuarts: boolean, hasDemis: boolean): Phase[] {
  const phases: Phase[] = []
  const byes = bracketData.byes || []
  // Les byes sont des matchs "gagnés d'office" : ils vont au premier tour d'élim existant
  const huitiemesWithByes = hasHuitiemes ? [...(bracketData.huitiemes || []), ...byes] : []
  const quartsWithByes = (hasQuarts && !hasHuitiemes)
    ? [...(bracketData.quarts || []), ...byes]
    : (bracketData.quarts || [])

  if (hasHuitiemes) phases.push({ label: '1/8 finale', shortLabel: '1/8', matches: huitiemesWithByes, matchCount: 8 })
  if (hasQuarts) phases.push({ label: '1/4 finale', shortLabel: '1/4', matches: quartsWithByes, matchCount: 4 })
  if (hasDemis) phases.push({ label: '1/2 finale', shortLabel: '1/2', matches: bracketData.demis || [], matchCount: 2 })
  phases.push({ label: 'Finale', shortLabel: 'Finale', matches: [bracketData.finale], matchCount: 1, isFinale: true })
  return phases
}

function computeLayout(phases: Phase[]) {
  const totalRows = phases[0].matchCount
  const matchHeight = totalRows >= 8 ? 70 : 90
  const totalHeight = totalRows * matchHeight + (totalRows - 1) * VERTICAL_GAP
  const totalWidth = phases.length * COL_WIDTH + (phases.length - 1) * HORIZONTAL_GAP
  const slotHeight = matchHeight + VERTICAL_GAP

  const phasesWithLayout: PhaseWithLayout[] = phases.map((phase, phaseIdx) => {
    const matchesPerSlot = totalRows / phase.matchCount
    const positions = Array.from({ length: phase.matchCount }, (_, i) => {
      const startY = i * matchesPerSlot * slotHeight
      const center = startY + (matchesPerSlot * slotHeight - VERTICAL_GAP) / 2
      return { top: center - matchHeight / 2, center }
    })
    return { ...phase, positions, colLeft: phaseIdx * (COL_WIDTH + HORIZONTAL_GAP) }
  })

  return { phasesWithLayout, totalHeight, totalWidth, matchHeight }
}

function buildConnectors(phasesWithLayout: PhaseWithLayout[]): { points: string }[] {
  const connectors: { points: string }[] = []
  for (let i = 0; i < phasesWithLayout.length - 1; i++) {
    const current = phasesWithLayout[i]
    const next = phasesWithLayout[i + 1]
    const xExit = current.colLeft + COL_WIDTH
    const xMid = xExit + HORIZONTAL_GAP / 2
    const xEntry = next.colLeft

    next.positions.forEach((nextPos, nextIdx) => {
      const prevA = current.positions[nextIdx * 2]
      const prevB = current.positions[nextIdx * 2 + 1]
      if (!prevA || !prevB) return
      connectors.push({
        points: `${xExit},${prevA.center} ${xMid},${prevA.center} ${xMid},${nextPos.center} ${xEntry},${nextPos.center}`
      })
      connectors.push({
        points: `${xExit},${prevB.center} ${xMid},${prevB.center} ${xMid},${nextPos.center}`
      })
    })
  }
  return connectors
}

function getEmptyTeamLabel(phaseIdx: number, matchIdx: number, side: 'a' | 'b', phases: Phase[]): string {
  if (phaseIdx === 0) return 'À déterminer'
  const prevPhase = phases[phaseIdx - 1]
  const prevIdx = matchIdx * 2 + (side === 'a' ? 0 : 1)
  const phaseShort = prevPhase.shortLabel
  if (phaseShort === '1/8') return `Vainqueur 8e ${prevIdx + 1}`
  if (phaseShort === '1/4') return `Vainqueur Q${prevIdx + 1}`
  if (phaseShort === '1/2') return `Vainqueur D${prevIdx + 1}`
  return 'Vainqueur'
}

// ========================================================
// Main component
// ========================================================

export default function BracketPage() {
  const params = useParams()
  const router = useRouter()
  const tournoiId = params?.id as string

  const [previewRole, setPreviewRole] = useState<ViewRole | null>(null)
  const { organization } = useAuth()
  const { loading, tournament, bracketData, hasHuitiemes, hasQuarts, hasDemis } = useBracket({ tournoiId })

  // Detection role : organisateur seulement si user.org === tournament.org
  const isOrganizer = !!tournament && !!organization && String(tournament.org_id) === String(organization.id)
  const { effectiveRole, baseRole, isPreviewMode } = useEffectiveRole({
    tournamentId: tournament?.id,
    orgId: tournament?.org_id,
    teams: [],  // pas de match equipe necessaire sur cette page (lecture seule)
    isOrganizer,
    previewRole,
    selectedPlayerIds: null
  })
  const viewRole = effectiveRole

  if (loading) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-7 h-7 animate-spin mx-auto text-petanque-vert" />
          <p className="mt-4 text-sm text-petanque-bois">Chargement du bracket…</p>
        </div>
      </div>
    )
  }

  const phases = buildPhases(bracketData, hasHuitiemes, hasQuarts, hasDemis)
  const { phasesWithLayout, totalHeight, totalWidth, matchHeight } = computeLayout(phases)
  const connectors = buildConnectors(phasesWithLayout)

  // Status global
  const allMatches = phases.flatMap(p => p.matches.filter(Boolean) as BracketMatch[])
  const liveMatches = allMatches.filter(m => m.status === 'en_cours')
  const finishedMatches = allMatches.filter(m => m.status === 'termine')
  const finaleMatch = bracketData.finale
  const hasFinaleWinner = finaleMatch?.status === 'termine'

  // Hero contextuel
  let heroContent: React.ReactNode
  if (hasFinaleWinner && finaleMatch) {
    const winner: any = finaleMatch.score_a > finaleMatch.score_b ? finaleMatch.equipe_a : finaleMatch.equipe_b
    heroContent = <>{winner?.name || 'Le vainqueur'} <span className="accent-italic text-petanque-vert">remporte les phases finales.</span></>
  } else if (liveMatches.length > 0) {
    heroContent = <>Les phases finales sont <span className="accent-italic text-petanque-vert">en cours.</span></>
  } else if (finishedMatches.length > 0) {
    heroContent = <>Les phases finales <span className="accent-italic text-petanque-vert">progressent.</span></>
  } else {
    heroContent = <>Les phases finales <span className="accent-italic text-petanque-vert">vont commencer.</span></>
  }

  // Status pill
  let statusPill: React.ReactNode
  if (hasFinaleWinner) statusPill = <span>Terminé</span>
  else if (liveMatches.length > 0) statusPill = <span className="text-petanque-vert flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-petanque-vert animate-pulse"></span>En cours</span>
  else statusPill = <span>À venir</span>

  // Phase active pour eyebrow
  let activePhaseLabel = ''
  for (const phase of phasesWithLayout) {
    const phaseMatches = phase.matches.filter(Boolean) as BracketMatch[]
    if (phaseMatches.some(m => m.status === 'en_cours' || m.status === 'a_jouer')) {
      activePhaseLabel = phase.label
      break
    }
  }

  // Date
  const tournamentDate = (tournament?.settings as any)?.date
    ? new Date((tournament!.settings as any).date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const handleMatchClick = (match: BracketMatch | null | undefined) => {
    if (match?.id) router.push(`/match/${match.id}`)
  }

  return (
    <div className="min-h-screen bg-petanque-sable-pale">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-petanque-sable-pale/85 backdrop-blur-xl border-b border-petanque-sable-bord/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <button
              onClick={() => router.push(`/tournoi/${tournoiId}`)}
              className="text-sm text-petanque-bois hover:text-petanque-vert-fonce font-medium flex items-center gap-1.5"
            >
              <span>←</span>
              <span className="hidden sm:inline">Retour au tournoi</span>
            </button>
            <span className="font-mono text-xs text-petanque-bois truncate max-w-[300px]">
              {tournament?.name}
            </span>
            <span className="font-mono text-xs uppercase tracking-[0.16em] font-medium">
              {statusPill}
            </span>
          </div>
        </div>
      </header>

      <TournamentSubNav
        tournoiId={tournoiId}
        currentPage="bracket"
        baseRole={baseRole}
        viewRole={viewRole}
        setViewRole={(role) => setPreviewRole(role === 'organisateur' ? null : role)}
        isPreviewMode={isPreviewMode}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <FadeIn>
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>Phases finales{tournamentDate ? ` · ${tournamentDate}` : ''}</span>
            {activePhaseLabel && (
              <>
                <span className="text-petanque-sable-bord">·</span>
                <span className="text-petanque-vert flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-petanque-vert animate-pulse"></span>
                  {activePhaseLabel} en cours
                </span>
              </>
            )}
          </p>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.1] mb-10">
            {heroContent}
          </h1>
        </FadeIn>

        {/* Bracket arena */}
        <FadeIn delay={120}>
          <div className="overflow-x-auto pb-4">
            {/* Labels au-dessus des colonnes */}
            <div className="relative mx-auto mb-3" style={{ width: totalWidth }}>
              {phasesWithLayout.map((phase, i) => (
                <div
                  key={phase.label}
                  className="absolute font-mono text-[11px] uppercase tracking-[0.18em] font-medium flex items-center justify-center gap-2 h-5"
                  style={{ left: phase.colLeft, width: COL_WIDTH, color: phase.isFinale ? '#2d5530' : '#8c6f4f' }}
                >
                  {phase.isFinale && <BouleSvg size={18} variant="acier" stries />}
                  {phase.label}
                </div>
              ))}
              <div style={{ height: 20 }}></div>
            </div>

            {/* Bracket */}
            <div
              className="relative mx-auto rounded-xl border-[0.5px]"
              style={{
                width: totalWidth,
                height: totalHeight,
                background: 'rgba(244,237,224,0.4)',
                borderColor: 'rgba(216,201,168,0.5)'
              }}
            >
              {/* Connecteurs SVG */}
              <svg
                className="absolute inset-0 pointer-events-none"
                viewBox={`0 0 ${totalWidth} ${totalHeight}`}
                preserveAspectRatio="none"
                style={{ width: '100%', height: '100%' }}
              >
                <g stroke="#8c6f4f" strokeWidth="1" fill="none" strokeOpacity="0.45">
                  {connectors.map((c, i) => (
                    <polyline key={i} points={c.points} />
                  ))}
                </g>
              </svg>

              {/* Cards */}
              {phasesWithLayout.map((phase, phaseIdx) => (
                <div key={phase.label} className="absolute top-0" style={{ left: phase.colLeft, width: COL_WIDTH }}>
                  {Array.from({ length: phase.matchCount }, (_, matchIdx) => {
                    const match = phase.matches[matchIdx] as BracketMatch | undefined
                    const pos = phase.positions[matchIdx]
                    const labelA = match?.equipe_a?.name || getEmptyTeamLabel(phaseIdx, matchIdx, 'a', phases)
                    const labelB = match?.equipe_b?.name || getEmptyTeamLabel(phaseIdx, matchIdx, 'b', phases)
                    return (
                      <MatchCard
                        key={matchIdx}
                        match={match}
                        labelA={labelA}
                        labelB={labelB}
                        isFinale={!!phase.isFinale}
                        matchIdx={matchIdx}
                        top={pos.top}
                        height={matchHeight}
                        onClick={() => handleMatchClick(match)}
                      />
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Petite finale */}
        {tournament?.settings?.consolante && (
          <FadeIn delay={200}>
            <div className="mt-10 pt-8 border-t border-petanque-sable-bord/50 max-w-md">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] font-medium text-petanque-bois mb-4 flex items-center gap-2.5">
                <BouleSvg size={16} variant="cochonnet" stries />
                Petite finale · 3<sup>e</sup> place
              </p>
              <PetiteFinaleCard
                match={bracketData.petiteFinale}
                onClick={() => handleMatchClick(bracketData.petiteFinale)}
              />
            </div>
          </FadeIn>
        )}
      </main>
    </div>
  )
}

// ========================================================
// MatchCard
// ========================================================

interface MatchCardProps {
  match?: BracketMatch
  labelA: string
  labelB: string
  isFinale: boolean
  matchIdx: number
  top: number
  height: number
  onClick: () => void
}

function MatchCard({ match, labelA, labelB, isFinale, matchIdx, top, height, onClick }: MatchCardProps) {
  const isLive = match?.status === 'en_cours'
  const isBye = match?.type === 'bye'
  const isDone = !isBye && match?.status === 'termine'
  const isPending = !match || (match.status === 'a_jouer' && !isBye)

  const winnerA = isDone && match!.score_a > match!.score_b
  const winnerB = isDone && match!.score_b > match!.score_a
  const isLiveLeaderA = isLive && match!.score_a > match!.score_b
  const isLiveLeaderB = isLive && match!.score_b > match!.score_a

  const matchLabel = isFinale
    ? 'Grande finale'
    : `${match?.terrain ? `T${match.terrain} · ` : ''}M${matchIdx + 1}`

  const isClickable = !!match && !isBye

  return (
    <div
      className={`absolute rounded-lg transition-colors ${
        isLive
          ? 'border-[1.5px] border-petanque-vert bg-white'
          : isBye
          ? 'border-[0.5px] border-petanque-vert/30 bg-petanque-vert-pale/20'
          : 'border-[0.5px] border-petanque-sable-bord bg-white'
      } ${isClickable ? 'hover:border-petanque-vert/40 hover:bg-petanque-sable-pale/40 cursor-pointer' : ''}`}
      style={{
        top,
        left: 0,
        right: 0,
        height,
        padding: isLive ? '11px 14px' : '12px 15px'
      }}
      onClick={isClickable ? onClick : undefined}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-[9px] text-petanque-bois uppercase tracking-[0.14em] truncate">
          {matchLabel}
        </span>
        {isLive && (
          <span className="font-mono text-[9px] text-petanque-vert uppercase tracking-[0.14em] font-medium flex items-center gap-1 flex-shrink-0">
            <span className="w-1 h-1 rounded-full bg-petanque-vert animate-pulse"></span>
            Live
          </span>
        )}
        {isBye && (
          <span className="font-mono text-[9px] text-petanque-vert uppercase tracking-[0.14em] font-medium flex-shrink-0">
            Qualifié
          </span>
        )}
        {isDone && (
          <span className="font-mono text-[9px] text-petanque-bois uppercase tracking-[0.14em] flex-shrink-0">
            Terminé
          </span>
        )}
        {isPending && match && (
          <span className="font-mono text-[9px] text-petanque-cochonnet uppercase tracking-[0.14em] flex-shrink-0">
            À jouer
          </span>
        )}
        {!match && (
          <span className="font-mono text-[9px] text-petanque-bois uppercase tracking-[0.14em] italic flex-shrink-0">
            En attente
          </span>
        )}
      </div>
      {isBye ? (
        <>
          <div className="flex items-center gap-1.5 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-petanque-vert flex-shrink-0"></span>
            <span className="text-sm text-petanque-vert font-medium truncate">{labelA}</span>
          </div>
          <div className="py-0.5">
            <span className="text-xs italic text-petanque-bois">Qualifié direct</span>
          </div>
        </>
      ) : (
        <>
          <TeamRow
            label={labelA}
            score={match?.score_a}
            isWinner={winnerA}
            isLiveLeader={isLiveLeaderA}
            isLoser={isDone && !winnerA}
            showScore={!!match && match.status !== 'a_jouer'}
            isPlaceholder={!match}
          />
          <TeamRow
            label={labelB}
            score={match?.score_b}
            isWinner={winnerB}
            isLiveLeader={isLiveLeaderB}
            isLoser={isDone && !winnerB}
            showScore={!!match && match.status !== 'a_jouer'}
            isPlaceholder={!match}
          />
        </>
      )}
    </div>
  )
}

interface TeamRowProps {
  label: string
  score?: number
  isWinner: boolean
  isLiveLeader: boolean
  isLoser: boolean
  showScore: boolean
  isPlaceholder: boolean
}

function TeamRow({ label, score, isWinner, isLiveLeader, isLoser, showScore, isPlaceholder }: TeamRowProps) {
  const greenText = isWinner || isLiveLeader
  return (
    <div className={`flex items-center justify-between gap-2 py-0.5 ${isLoser ? 'opacity-50' : ''}`}>
      <span className={`text-sm flex items-center gap-1.5 min-w-0 flex-1 ${
        greenText ? 'text-petanque-vert font-medium' : isPlaceholder ? 'text-petanque-bois italic' : 'text-petanque-vert-fonce'
      }`}>
        {greenText && <span className="w-1.5 h-1.5 rounded-full bg-petanque-vert flex-shrink-0"></span>}
        <span className="truncate">{label}</span>
      </span>
      <span className={`font-mono text-base tabular-nums flex-shrink-0 ${
        greenText ? 'text-petanque-vert font-medium' : 'text-petanque-bois'
      }`}>
        {showScore ? score : '—'}
      </span>
    </div>
  )
}

// ========================================================
// Petite finale
// ========================================================

interface PetiteFinaleCardProps {
  match: BracketMatch | null
  onClick: () => void
}

function PetiteFinaleCard({ match, onClick }: PetiteFinaleCardProps) {
  if (!match) {
    return (
      <div className="rounded-lg bg-white border-[0.5px] border-petanque-sable-bord p-4">
        <p className="font-mono text-[9px] text-petanque-bois uppercase tracking-[0.14em] mb-2">Match consolante</p>
        <p className="text-sm text-petanque-bois italic">En attente des perdants des demi-finales.</p>
      </div>
    )
  }

  const isLive = match.status === 'en_cours'
  const isDone = match.status === 'termine'
  const winnerA = isDone && match.score_a > match.score_b
  const winnerB = isDone && match.score_b > match.score_a
  const liveA = isLive && match.score_a > match.score_b
  const liveB = isLive && match.score_b > match.score_a

  return (
    <div
      onClick={onClick}
      className={`rounded-lg bg-white p-4 cursor-pointer transition-colors ${
        isLive ? 'border-[1.5px] border-petanque-vert' : 'border-[0.5px] border-petanque-sable-bord hover:border-petanque-bois/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-[9px] text-petanque-bois uppercase tracking-[0.14em]">Match consolante</span>
        {isLive && <span className="font-mono text-[9px] text-petanque-vert uppercase tracking-[0.14em] font-medium flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-petanque-vert animate-pulse"></span>Live</span>}
        {isDone && <span className="font-mono text-[9px] text-petanque-bois uppercase tracking-[0.14em]">Terminé</span>}
        {!isDone && !isLive && <span className="font-mono text-[9px] text-petanque-cochonnet uppercase tracking-[0.14em]">À jouer</span>}
      </div>
      <TeamRow
        label={match.equipe_a?.name || 'Perdant Demi 1'}
        score={match.score_a}
        isWinner={winnerA}
        isLiveLeader={liveA}
        isLoser={isDone && !winnerA}
        showScore={match.status !== 'a_jouer'}
        isPlaceholder={!match.equipe_a}
      />
      <TeamRow
        label={match.equipe_b?.name || 'Perdant Demi 2'}
        score={match.score_b}
        isWinner={winnerB}
        isLiveLeader={liveB}
        isLoser={isDone && !winnerB}
        showScore={match.status !== 'a_jouer'}
        isPlaceholder={!match.equipe_b}
      />
    </div>
  )
}
