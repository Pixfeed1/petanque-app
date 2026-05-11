'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import {
  FadeIn, BouleSvg,
  PageHeader, SearchInput, EmptyState
} from '@/components/ui'
import { Loader, Trophy } from '@/components/Icons'

interface TournoiHistorique {
  id: string
  name: string
  format: string
  mode: string
  status: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
  nb_joueurs: number
  nb_equipes: number
  nb_matchs_total: number
  nb_matchs_joues: number
  vainqueur: string | null
}

const formatLabels: Record<string, string> = {
  tete_a_tete: 'Tête à tête',
  doublette: 'Doublettes',
  triplette: 'Triplettes',
}

const modeLabels: Record<string, string> = {
  choisi: 'Choisi',
  melee_fixe: 'Mêlée fixe',
  melee_tournante: 'Mêlée tournante',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function HistoriquePage() {
  const router = useRouter()
  const { organization, loading: authLoading } = useAuth()

  const [tournois, setTournois] = useState<TournoiHistorique[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const LIMIT = 20

  const loadHistorique = useCallback(async (reset = false) => {
    if (!organization?.id) return

    const currentOffset = reset ? 0 : offset
    try {
      setLoading(true)
      const params = new URLSearchParams({
        org_id: String(organization.id),
        limit: String(LIMIT),
        offset: String(currentOffset),
      })
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      }

      const res = await fetch(`/api/tournois/historique?${params}`, {
        credentials: 'include',
      })

      if (res.ok) {
        const data: TournoiHistorique[] = await res.json()
        if (reset) {
          setTournois(data)
          setOffset(LIMIT)
        } else {
          setTournois(prev => [...prev, ...data])
          setOffset(currentOffset + LIMIT)
        }
        setHasMore(data.length === LIMIT)
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error)
    } finally {
      setLoading(false)
    }
  }, [organization?.id, offset, searchQuery])

  useEffect(() => {
    if (organization?.id) {
      loadHistorique(true)
    }
  }, [organization?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const timer = setTimeout(() => {
      if (organization?.id) {
        setOffset(0)
        loadHistorique(true)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-7 h-7 animate-spin mx-auto text-petanque-vert" />
          <p className="mt-4 text-sm text-petanque-bois">Chargement…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-petanque-sable-pale">
      <PageHeader
        backHref="/dashboard"
        backLabel="Tableau de bord"
        title="Historique"
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <FadeIn>
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3 flex flex-wrap gap-x-3 gap-y-1">
            <span>Historique</span>
            {tournois.length > 0 && (
              <>
                <span className="text-petanque-sable-bord">·</span>
                <span>
                  {tournois.length}{hasMore ? '+' : ''} {tournois.length > 1 ? 'tournois terminés' : 'tournoi terminé'}
                </span>
              </>
            )}
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-10">
            Tes tournois <span className="accent-italic text-petanque-vert">passés.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={80}>
          <div className="mb-7 max-w-md">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Rechercher un tournoi…"
            />
          </div>
        </FadeIn>

        {!loading && tournois.length === 0 ? (
          <EmptyState
            icon={<Trophy className="w-6 h-6" />}
            title={searchQuery ? 'Aucun résultat' : 'Aucun tournoi terminé'}
            description={searchQuery
              ? 'Aucun tournoi ne correspond à ta recherche. Essaie un autre mot-clé.'
              : 'Tes tournois terminés apparaîtront ici. Lance ton premier !'}
            cta={!searchQuery ? { label: '+ Créer un tournoi', onClick: () => router.push('/tournoi/nouveau') } : undefined}
          />
        ) : (
          <FadeIn delay={140}>
            <div className="divide-y divide-petanque-sable-bord/40">
              {tournois.map((tournoi) => (
                <button
                  key={tournoi.id}
                  onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                  className="group w-full text-left flex items-center gap-4 py-5 px-1 hover:bg-petanque-sable/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-base md:text-lg font-medium text-petanque-vert-fonce group-hover:text-petanque-vert transition-colors mb-1.5">
                      {tournoi.name}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] bg-white border border-petanque-sable-bord/60 text-petanque-bois px-2 py-0.5 rounded-md">
                        {modeLabels[tournoi.mode] || tournoi.mode}
                      </span>
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] bg-white border border-petanque-sable-bord/60 text-petanque-bois px-2 py-0.5 rounded-md">
                        {formatLabels[tournoi.format] || tournoi.format}
                      </span>
                    </div>
                    <p className="text-xs text-petanque-bois flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span>{tournoi.nb_joueurs} joueur{tournoi.nb_joueurs > 1 ? 's' : ''}</span>
                      <span className="text-petanque-sable-bord">·</span>
                      <span>{tournoi.nb_equipes} équipe{tournoi.nb_equipes > 1 ? 's' : ''}</span>
                      <span className="text-petanque-sable-bord">·</span>
                      <span>{tournoi.nb_matchs_joues} match{tournoi.nb_matchs_joues > 1 ? 's' : ''}</span>
                      <span className="text-petanque-sable-bord">·</span>
                      <span>{formatDate(tournoi.updated_at)}</span>
                    </p>
                  </div>
                  {tournoi.vainqueur && (
                    <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                      <BouleSvg size={18} variant="acier" stries />
                      <span className="text-sm font-medium text-petanque-vert-fonce">
                        {tournoi.vainqueur}
                      </span>
                    </div>
                  )}
                  <span className="text-lg text-petanque-bois group-hover:text-petanque-vert transition-colors flex-shrink-0">→</span>
                </button>
              ))}

              {loading && tournois.length > 0 && (
                <div className="py-6 flex justify-center">
                  <Loader className="w-5 h-5 animate-spin text-petanque-vert" />
                </div>
              )}
            </div>

            {hasMore && !loading && (
              <div className="mt-8 flex justify-center">
                <button
                  onClick={() => loadHistorique(false)}
                  className="text-sm font-medium text-petanque-vert hover:text-petanque-vert-fonce border border-petanque-sable-bord hover:border-petanque-vert/40 bg-white px-5 py-2.5 rounded-xl transition-colors"
                >
                  Charger plus de tournois
                </button>
              </div>
            )}
          </FadeIn>
        )}

        {loading && tournois.length === 0 && (
          <div className="py-12 flex justify-center">
            <Loader className="w-6 h-6 animate-spin text-petanque-vert" />
          </div>
        )}
      </main>
    </div>
  )
}
