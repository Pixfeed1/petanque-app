'use client'

import { useParams, useRouter } from 'next/navigation'
import { usePodium, PodiumTeam } from '@/hooks/podium'
import { useToast } from '@/components/ui/Toast'
import { Button, BouleSvg, FadeIn } from '@/components/ui'
import { Loader, Download, Sparkles } from '@/components/Icons'

export default function PodiumPage() {
  const params = useParams()
  const router = useRouter()
  const { showSuccess } = useToast()

  const {
    loading,
    tournament,
    podium,
    showAnimation,
    animationStep,
    generatingCertificate,
    handleShare,
    generatePremiumCertificate
  } = usePodium({
    tournoiId: params?.id,
    onSuccess: showSuccess
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-7 h-7 animate-spin mx-auto text-petanque-vert" />
          <p className="mt-4 text-sm text-petanque-bois">Préparation du podium…</p>
        </div>
      </div>
    )
  }

  const tournamentDate = tournament?.settings?.date
    ? new Date(tournament.settings.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : ''

  const champion = podium[0]
  const second = podium[1]
  const third = podium[2]
  const championName = champion?.team?.name || ''

  const modeLabel = tournament?.mode === 'choisi' ? 'choisi' : tournament?.mode === 'melee_fixe' ? 'mêlée fixe' : tournament?.mode === 'melee_tournante' ? 'mêlée tournante' : ''
  const formatLabel = tournament?.format === 'doublette' ? 'Doublettes' : 'Triplettes'

  return (
    <div className="min-h-screen bg-petanque-sable-pale">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-petanque-sable-pale/85 backdrop-blur-xl border-b border-petanque-sable-bord/60 print:hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 h-14">
            <button
              onClick={() => router.push(`/tournoi/${params?.id}`)}
              className="text-sm text-petanque-bois hover:text-petanque-vert-fonce font-medium flex items-center gap-1.5"
            >
              <span>←</span>
              <span className="hidden sm:inline">Retour au tournoi</span>
            </button>
            <span className="font-mono text-xs text-petanque-bois truncate max-w-[300px]">
              {tournament?.name}
            </span>
            <button
              onClick={handleShare}
              className="w-8 h-8 border border-petanque-sable-bord/60 bg-white rounded-lg text-petanque-bois hover:text-petanque-vert-fonce flex items-center justify-center text-sm"
              title="Partager"
            >
              ⤴
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">

        {/* Hero */}
        <FadeIn>
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3">
            Champions{tournamentDate ? ` · ${tournamentDate}` : ''}
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-2">
            {championName ? (
              <>
                {championName} remporte<br />
                <span className="accent-italic text-petanque-vert">{tournament?.name?.toLowerCase().startsWith('le ') || tournament?.name?.toLowerCase().startsWith('la ') ? tournament.name : `le ${tournament?.name || 'tournoi'}`}.</span>
              </>
            ) : (
              <>Voici les <span className="accent-italic text-petanque-vert">champions du tournoi.</span></>
            )}
          </h1>
          {(modeLabel || formatLabel) && (
            <p className="text-sm md:text-base text-petanque-bois mt-3 mb-12">
              {modeLabel && <>Mode {modeLabel}</>}
              {modeLabel && formatLabel && ' · '}
              {formatLabel}
            </p>
          )}
        </FadeIn>

        {/* PODIUM en flow direct, pas de card */}
        <FadeIn delay={120}>
          <div className="grid grid-cols-3 gap-3 md:gap-6 items-end pb-12 md:pb-16">

            {/* 2e place */}
            <PodiumSpot
              position={2}
              team={second}
              animationStep={animationStep}
              generatingCertificate={generatingCertificate}
              onGenerateCertificate={() => second && generatePremiumCertificate(2, second)}
            />

            {/* Champion centre */}
            <PodiumSpot
              position={1}
              team={champion}
              animationStep={animationStep}
              generatingCertificate={generatingCertificate}
              onGenerateCertificate={() => champion && generatePremiumCertificate(1, champion)}
            />

            {/* 3e place */}
            <PodiumSpot
              position={3}
              team={third}
              animationStep={animationStep}
              generatingCertificate={generatingCertificate}
              onGenerateCertificate={() => third && generatePremiumCertificate(3, third)}
            />

          </div>
        </FadeIn>

        {/* Stats du champion */}
        {champion?.stats && (
          <FadeIn delay={200}>
            <div className="border-t border-petanque-sable-bord/50 pt-8 pb-2">
              <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-5">
                Le champion en chiffres
              </p>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-6 md:gap-8">
                <div>
                  <p className="text-[10px] text-petanque-bois uppercase tracking-[0.14em] mb-1.5 font-medium">Victoires</p>
                  <p className="font-mono text-2xl md:text-3xl font-medium text-petanque-vert-fonce leading-none">
                    {champion.stats.victories}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-petanque-bois uppercase tracking-[0.14em] mb-1.5 font-medium">Différence</p>
                  <p className="font-mono text-2xl md:text-3xl font-medium text-petanque-vert leading-none">
                    +{champion.stats.pointsFor - champion.stats.pointsAgainst}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-petanque-bois uppercase tracking-[0.14em] mb-1.5 font-medium">Points marqués</p>
                  <p className="font-mono text-2xl md:text-3xl font-medium text-petanque-vert-fonce leading-none">
                    {champion.stats.pointsFor}
                  </p>
                </div>
                <div className="hidden md:block">
                  <p className="text-[10px] text-petanque-bois uppercase tracking-[0.14em] mb-1.5 font-medium">Points encaissés</p>
                  <p className="font-mono text-2xl md:text-3xl font-medium text-petanque-bois leading-none">
                    {champion.stats.pointsAgainst}
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Actions */}
        <FadeIn delay={280}>
          <div className="border-t border-petanque-sable-bord/50 mt-12 pt-8 flex flex-wrap items-center justify-center gap-3 print:hidden">
            <Button variant="primary" onClick={handleShare}>
              Partager le podium
            </Button>
            <Button variant="ghost" onClick={() => window.print()}>
              <Download className="w-4 h-4 mr-1.5" />
              Imprimer
            </Button>
            <Button variant="ghost" onClick={() => router.push('/tournoi/nouveau')}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              Refaire un tournoi similaire
            </Button>
          </div>
        </FadeIn>

      </main>

      <style jsx>{`
        @media print {
          header, .print\\:hidden { display: none !important; }
          body { background: white !important; }
        }
      `}</style>
    </div>
  )
}

// ============================================================================
// Composant PodiumSpot
// ============================================================================

interface PodiumSpotProps {
  position: 1 | 2 | 3
  team?: PodiumTeam
  animationStep: number
  generatingCertificate: boolean
  onGenerateCertificate: () => void
}

function PodiumSpot({ position, team, animationStep, generatingCertificate, onGenerateCertificate }: PodiumSpotProps) {
  const isVisible = animationStep >= position
  const isFirst = position === 1

  const variant: 'acier' | 'cochonnet' | 'vert' = isFirst ? 'acier' : position === 2 ? 'cochonnet' : 'vert'
  const size = isFirst ? 124 : 76

  const rankLabel = isFirst ? 'Champion' : position === 2 ? '2ᵉ place' : '3ᵉ place'

  if (!team) {
    return (
      <div className="flex flex-col items-center gap-3 text-center opacity-40">
        <span className="font-mono text-[11px] text-petanque-bois uppercase tracking-[0.18em] font-medium">
          {rankLabel}
        </span>
        <div className={`rounded-full bg-petanque-sable-bord/30`} style={{ width: size, height: size }}></div>
        <p className="text-sm text-petanque-bois italic">Non déterminé</p>
      </div>
    )
  }

  const players = team.team?.players?.filter(Boolean) || []

  return (
    <div
      className={`flex flex-col items-center gap-3 md:gap-4 text-center transition-all duration-700 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      <span className={`font-mono uppercase tracking-[0.18em] font-medium ${
        isFirst ? 'text-[12px] text-petanque-vert' : 'text-[11px] text-petanque-bois'
      }`}>
        {rankLabel}
      </span>

      <BouleSvg size={size} variant={variant} stries />

      <div className="space-y-1">
        <p className={`font-medium leading-tight ${
          isFirst ? 'text-xl md:text-2xl text-petanque-vert-fonce' : 'text-base md:text-lg text-petanque-vert-fonce'
        }`}>
          {team.team?.name || 'Équipe'}
        </p>
        {players.length > 0 && (
          <p className={`text-petanque-bois leading-tight ${isFirst ? 'text-xs md:text-sm' : 'text-[11px]'}`}>
            {players.map((p: any) => p?.name).filter(Boolean).join(' · ')}
          </p>
        )}
      </div>

      {team.stats && (
        <div className={`pt-2 border-t border-petanque-sable-bord/50 w-full max-w-[140px] font-mono ${
          isFirst ? 'text-sm text-petanque-vert font-medium' : 'text-xs text-petanque-bois'
        }`}>
          {team.stats.victories}V · +{team.stats.pointsFor - team.stats.pointsAgainst}
        </div>
      )}

      <button
        onClick={onGenerateCertificate}
        disabled={generatingCertificate}
        className={`text-xs font-medium hover:text-petanque-vert-fonce transition-colors disabled:opacity-50 print:hidden ${
          isFirst ? 'text-petanque-vert' : 'text-petanque-bois'
        }`}
      >
        {generatingCertificate ? 'Génération…' : 'Certificat ↓'}
      </button>
    </div>
  )
}
