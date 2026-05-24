'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTournamentExport, ExportOptions } from '@/hooks/export'
import { FadeIn, BouleSvg, PageHeader } from '@/components/ui'
import TournamentSubNav, { ViewRole } from '@/components/tournament/TournamentSubNav'
import { Loader } from '@/components/Icons'

export default function ExportTournamentPage() {
  const params = useParams()
  const router = useRouter()
  const tournoiId = params?.id as string
  const [viewRole, setViewRole] = useState<ViewRole>('organisateur')

  const {
    loading,
    exporting,
    tournament,
    teams,
    matches,
    players,
    rankings,
    exportOptions,
    setExportOptions,
    exportToPDF,
    exportToExcel,
    handlePrint
  } = useTournamentExport({ tournoiId })

  if (loading) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-7 h-7 animate-spin mx-auto text-petanque-vert" />
          <p className="mt-4 text-sm text-petanque-bois">Chargement des données…</p>
        </div>
      </div>
    )
  }

  const isMeleeTournante = tournament?.mode === 'melee_tournante'
  const playedMatchesCount = matches.filter((m: any) => m.status === 'termine').length

  const modeLabel = tournament?.mode === 'choisi' ? 'Équipes choisies' :
                    tournament?.mode === 'melee_fixe' ? 'Mêlée fixe' :
                    tournament?.mode === 'melee_tournante' ? 'Mêlée tournante' : '—'
  const formatLabel = tournament?.format === 'doublette' ? 'Doublettes' :
                      tournament?.format === 'triplette' ? 'Triplettes' :
                      tournament?.format === 'tete_a_tete' ? 'Tête à tête' : '—'

  const subNavSections: any[] = [
    { id: 'apercu', label: 'Aperçu', isActive: false, onClick: () => router.push('/tournoi/' + tournoiId) },
    { id: 'matchs', label: 'Tous les matchs', isActive: false, onClick: () => router.push('/tournoi/' + tournoiId) },
    { id: 'classement', label: 'Classement', isActive: false, onClick: () => router.push('/tournoi/' + tournoiId) },
    { id: 'equipes', label: 'Équipes', isActive: false, onClick: () => router.push('/tournoi/' + tournoiId) },
    { id: 'bracket', label: 'Bracket', isActive: false, onClick: () => router.push('/tournoi/' + tournoiId + '/bracket') },
    { id: 'export', label: 'Export', isActive: true, onClick: () => {} }
  ]

  const optionsList: { key: keyof ExportOptions; label: string }[] = [
    { key: 'includeMatches', label: 'Les matchs' },
    { key: 'includeRankings', label: isMeleeTournante ? 'Le classement individuel' : 'Le classement' },
    { key: 'includeStatistics', label: 'Les statistiques' },
    { key: 'includePoules', label: 'Les poules' },
    { key: 'includePhaseFinale', label: 'Les phases finales' },
    { key: 'includeMenes', label: 'Le détail des mènes' },
    { key: 'includeContacts', label: 'Les contacts joueurs' }
  ]

  return (
    <div className="min-h-screen bg-petanque-sable-pale">
      <PageHeader
        backHref={'/tournoi/' + tournoiId}
        backLabel="Retour au tournoi"
        title="Export"
      />

      <TournamentSubNav
        sections={subNavSections}
        viewRole={viewRole}
        setViewRole={setViewRole}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <FadeIn>
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3 flex flex-wrap gap-x-3 gap-y-1">
            <span>Export</span>
            {tournament?.name && (
              <>
                <span className="text-petanque-sable-bord">·</span>
                <span className="normal-case tracking-[0.06em]">{tournament.name}</span>
              </>
            )}
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-3">
            Télécharger ton <span className="accent-italic text-petanque-vert">tournoi.</span>
          </h1>
          <p className="text-base text-petanque-bois leading-relaxed mb-12 max-w-2xl">
            Choisis ce que tu veux inclure et le format. Le PDF garde la mise en page, l'Excel facilite l'analyse.
          </p>
        </FadeIn>

        <div className="grid md:grid-cols-[1fr_1.6fr] gap-x-10 gap-y-10">

          <FadeIn delay={80}>
            <section>
              <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] mb-1.5">01</p>
              <h2 className="text-lg md:text-xl font-medium text-petanque-vert-fonce mb-4 tracking-tight">
                Que veux-tu inclure ?
              </h2>
              <div className="divide-y divide-petanque-sable-bord/40">
                {optionsList.map(opt => (
                  <label key={opt.key} className="flex items-center gap-3 py-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={Boolean(exportOptions[opt.key])}
                      onChange={(e) => setExportOptions({ ...exportOptions, [opt.key]: e.target.checked })}
                      className="w-4 h-4 rounded border-petanque-sable-bord accent-petanque-vert"
                    />
                    <span className="text-sm text-petanque-vert-fonce/90 group-hover:text-petanque-vert-fonce">
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </section>
          </FadeIn>

          <div className="flex flex-col gap-10">

            <FadeIn delay={140}>
              <section className="pb-8 border-b border-petanque-sable-bord/50">
                <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] mb-1.5">02</p>
                <h2 className="text-lg md:text-xl font-medium text-petanque-vert-fonce mb-5 tracking-tight">
                  Résumé du tournoi
                </h2>
                <div className="flex flex-wrap gap-x-10 gap-y-4">
                  <StatBlock label="Mode" value={modeLabel} small />
                  <StatBlock label="Format" value={formatLabel} small />
                  <StatBlock
                    label={isMeleeTournante ? 'Joueurs' : 'Équipes'}
                    value={String(isMeleeTournante ? players.length : teams.length)}
                  />
                  <StatBlock label="Matchs joués" value={playedMatchesCount + '/' + matches.length} />
                </div>
              </section>
            </FadeIn>

            {rankings.length > 0 && (
              <FadeIn delay={200}>
                <section className="pb-8 border-b border-petanque-sable-bord/50">
                  <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] mb-1.5">03</p>
                  <h2 className="text-lg md:text-xl font-medium text-petanque-vert-fonce mb-5 tracking-tight">
                    {isMeleeTournante ? 'Top 3 joueurs' : 'Podium provisoire'}
                  </h2>
                  <div className="divide-y divide-petanque-sable-bord/40">
                    {rankings.slice(0, 3).map((item: any, index: number) => (
                      <PodiumRow key={index} index={index} item={item} />
                    ))}
                  </div>
                </section>
              </FadeIn>
            )}

            <FadeIn delay={260}>
              <section>
                <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] mb-1.5">{rankings.length > 0 ? '04' : '03'}</p>
                <h2 className="text-lg md:text-xl font-medium text-petanque-vert-fonce mb-5 tracking-tight">
                  Choisir un format
                </h2>
                <div className="divide-y divide-petanque-sable-bord/40">
                  <ExportAction
                    code="PDF"
                    title="Document PDF"
                    description="Document complet prêt à imprimer, mise en page soignée."
                    onClick={exportToPDF}
                    loading={exporting}
                  />
                  <ExportAction
                    code="XLS"
                    title="Tableau Excel"
                    description="Plusieurs feuilles pour analyses et statistiques."
                    onClick={exportToExcel}
                    loading={exporting}
                  />
                  <ExportAction
                    code="IMP"
                    title="Imprimer directement"
                    description="Lance l'impression du document depuis ton navigateur."
                    onClick={handlePrint}
                  />
                </div>
              </section>
            </FadeIn>

          </div>
        </div>
      </main>
    </div>
  )
}

function StatBlock({ label, value, small }: { label: string; value: string; small?: boolean }) {
  const sizeCls = small ? 'text-base md:text-lg' : 'text-2xl md:text-3xl'
  return (
    <div>
      <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-1.5">{label}</p>
      <p className={'font-mono ' + sizeCls + ' font-medium leading-none text-petanque-vert-fonce'}>
        {value}
      </p>
    </div>
  )
}

function PodiumRow({ index, item }: { index: number; item: any }) {
  const variant: 'acier' | 'cochonnet' | 'vert' = index === 0 ? 'acier' : index === 1 ? 'cochonnet' : 'vert'
  return (
    <div className="flex items-center gap-3.5 py-3">
      <BouleSvg size={26} variant={variant} stries />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-petanque-vert-fonce">{item.name}</p>
        <p className="text-xs text-petanque-bois mt-0.5">
          {item.victories} victoire{item.victories > 1 ? 's' : ''} · {item.difference > 0 ? '+' : ''}{item.difference} pts
        </p>
      </div>
      <span className="font-mono text-base font-medium text-petanque-vert">
        {item.points} pts
      </span>
    </div>
  )
}

function ExportAction({ code, title, description, onClick, loading }: { code: string; title: string; description: string; onClick: () => void; loading?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="group w-full text-left flex items-center gap-4 py-5 px-1 hover:bg-petanque-sable/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <div className="w-12 h-12 rounded-xl bg-petanque-vert-pale/20 text-petanque-vert-fonce flex items-center justify-center flex-shrink-0">
        <span className="font-mono text-[11px] font-semibold tracking-[0.08em]">{code}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm md:text-base font-medium text-petanque-vert-fonce group-hover:text-petanque-vert">
          {title}
        </p>
        <p className="text-xs text-petanque-bois mt-1 leading-relaxed">{description}</p>
      </div>
      {loading ? (
        <Loader className="w-4 h-4 animate-spin text-petanque-vert flex-shrink-0" />
      ) : (
        <span className="text-lg text-petanque-bois group-hover:text-petanque-vert transition-colors flex-shrink-0">→</span>
      )}
    </button>
  )
}
