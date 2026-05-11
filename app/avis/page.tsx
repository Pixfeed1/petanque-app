'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  FadeIn,
  PageHeader, EmptyState, PlayerAvatar
} from '@/components/ui'
import { Loader } from '@/components/Icons'
import Footer from '@/app/components/footer'

interface Review {
  id: number
  rating: number
  content: string
  name: string
  role: string
  source: string
  created_at: string
}

const sourceLabels: Record<string, string> = {
  web: 'Web',
  google_play: 'Google Play',
  app_store: 'App Store'
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

export default function AvisPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ average: 0, total: 0 })
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [page, setPage] = useState(1)
  const [totalReviews, setTotalReviews] = useState(0)
  const limit = 12

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        approved: 'true',
        limit: String(limit),
        offset: String((page - 1) * limit),
        order_by: 'created_at',
        order_dir: 'DESC'
      })
      if (filterRating) {
        params.set('rating', String(filterRating))
      }
      const response = await fetch('/api/reviews?' + params.toString())
      if (!response.ok) throw new Error('Erreur chargement')
      const data = await response.json()
      setReviews(data.reviews || [])
      setTotalReviews(data.total || 0)
      setStats({
        average: data.stats?.average || 0,
        total: data.stats?.total_approved || 0
      })
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }, [page, filterRating])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const scrollToSection = (sectionId: string) => {
    router.push('/#' + sectionId)
  }

  const totalPages = Math.ceil(totalReviews / limit)

  return (
    <div className="min-h-screen bg-petanque-sable-pale">
      <PageHeader
        backHref="/"
        backLabel="Accueil"
        title="Tous les avis"
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <FadeIn>
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3 flex flex-wrap gap-x-3 gap-y-1">
            <span>Témoignages</span>
            {stats.total > 0 && (
              <>
                <span className="text-petanque-sable-bord">·</span>
                <span>{stats.total} {stats.total > 1 ? 'avis vérifiés' : 'avis vérifié'}</span>
              </>
            )}
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-3">
            Ce qu'en disent <span className="accent-italic text-petanque-vert">les Provençaux.</span>
          </h1>
          <p className="text-base text-petanque-bois leading-relaxed mb-10 max-w-2xl">
            L'expérience des clubs et joueurs qui utilisent Pétanque Pro au quotidien pour gérer leurs tournois.
          </p>
        </FadeIn>

        {stats.total > 0 && (
          <FadeIn delay={80}>
            <div className="flex flex-wrap gap-x-8 gap-y-4 items-baseline pb-8 mb-8 border-b border-petanque-sable-bord/50">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-4xl md:text-5xl font-medium text-petanque-vert leading-none">
                  {stats.average.toFixed(1)}
                </span>
                <span className="font-mono text-base text-petanque-bois">/ 5</span>
              </div>
              <Stars rating={Math.round(stats.average)} size="lg" />
              <span className="font-mono text-[11px] text-petanque-bois uppercase tracking-[0.16em]">
                Sources · Web, Google Play, App Store
              </span>
            </div>
          </FadeIn>
        )}

        <FadeIn delay={140}>
          <div className="flex items-center gap-2 flex-wrap mb-8">
            <span className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] mr-2">
              Filtrer par note
            </span>
            <RatingPill active={filterRating === null} onClick={() => { setFilterRating(null); setPage(1) }}>
              Tous
            </RatingPill>
            {[5, 4, 3, 2, 1].map(r => (
              <RatingPill key={r} active={filterRating === r} onClick={() => { setFilterRating(r); setPage(1) }}>
                {r}<span className="ml-0.5">★</span>
              </RatingPill>
            ))}
          </div>
        </FadeIn>

        {loading ? (
          <div className="py-16 flex justify-center">
            <Loader className="w-7 h-7 animate-spin text-petanque-vert" />
          </div>
        ) : reviews.length === 0 ? (
          <EmptyState
            title="Aucun avis trouvé"
            description={filterRating
              ? 'Aucun avis ne correspond à cette note. Essaie un autre filtre.'
              : 'Aucun avis pour le moment.'}
          />
        ) : (
          <FadeIn delay={200}>
            <div className="grid md:grid-cols-2 gap-5">
              {reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex justify-center items-center gap-4 text-sm text-petanque-bois">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-petanque-vert hover:text-petanque-vert-fonce border border-petanque-sable-bord hover:border-petanque-vert/40 bg-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Précédent
                </button>
                <span className="font-mono text-xs uppercase tracking-[0.14em]">
                  Page {page} sur {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages}
                  className="text-petanque-vert hover:text-petanque-vert-fonce border border-petanque-sable-bord hover:border-petanque-vert/40 bg-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Suivant →
                </button>
              </div>
            )}
          </FadeIn>
        )}
      </main>

      <Footer scrollToSection={scrollToSection} />
    </div>
  )
}

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm'
  return (
    <span className={'inline-flex gap-0.5 ' + sizeClass}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={i <= rating ? 'text-petanque-vert' : 'text-petanque-sable-bord'}>★</span>
      ))}
    </span>
  )
}

function RatingPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  const cls = active
    ? 'bg-petanque-vert text-petanque-sable border-petanque-vert'
    : 'bg-white text-petanque-bois border-petanque-sable-bord hover:border-petanque-bois/40'
  return (
    <button
      onClick={onClick}
      className={'inline-flex items-center gap-0.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ' + cls}
    >
      {children}
    </button>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const sourceLabel = sourceLabels[review.source] || 'Web'
  return (
    <div className="flex flex-col gap-4 p-5 bg-white border border-petanque-sable-bord/60 rounded-xl">
      <div className="flex items-center justify-between">
        <Stars rating={review.rating} size="md" />
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-petanque-bois border border-petanque-sable-bord/60 px-2 py-0.5 rounded-full font-semibold">
          {sourceLabel}
        </span>
      </div>
      <p className="text-sm text-petanque-vert-fonce/85 leading-relaxed italic flex-1">
        « {review.content} »
      </p>
      <div className="flex items-center gap-3 pt-3 border-t border-petanque-sable-bord/50">
        <PlayerAvatar name={review.name} size={34} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-petanque-vert-fonce truncate">{review.name}</p>
          {review.role && (
            <p className="text-xs text-petanque-bois truncate">{review.role}</p>
          )}
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-petanque-bois flex-shrink-0">
          {formatDate(review.created_at)}
        </span>
      </div>
    </div>
  )
}
