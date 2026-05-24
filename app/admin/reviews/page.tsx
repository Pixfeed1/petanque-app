// app/admin/reviews/page.tsx
// Panel admin pour modérer les avis utilisateurs — refonte V4

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { StarRating } from '@/components/StarRating'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import { AdminLayout } from '@/components/admin'
import { FadeIn, PillToggle } from '@/components/ui'
import { Loader } from '@/components/Icons'

interface Review {
  id: number
  rating: number
  content: string
  name: string
  role: string
  source: string
  approved: boolean
  created_at: string
  user_email: string | null
}

interface Stats {
  pending: number
  approved: number
  total: number
}

type FilterKey = 'all' | 'pending' | 'approved'

const sourceLabels: Record<string, string> = {
  web: 'Web',
  google_play: 'Google Play',
  app_store: 'App Store'
}

export default function AdminReviews() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { showError, showSuccess } = useToast()
  const { confirm, ConfirmModal } = useConfirm()

  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterKey>('pending')
  const [moderating, setModerating] = useState<number | null>(null)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/reviews/moderate?status=' + filter, {
        credentials: 'include'
      })

      if (response.status === 403) {
        showError('Accès refusé')
        router.push('/dashboard')
        return
      }

      if (!response.ok) throw new Error('Erreur chargement avis')

      const data = await response.json()
      setReviews(data.reviews)
      setStats(data.stats)
    } catch (error) {
      console.error('Erreur:', error)
      showError('Erreur lors du chargement des avis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
      fetchReviews()
    }
  }, [authLoading, user, filter])

  const handleModerate = async (reviewId: number, action: 'approve' | 'reject') => {
    const confirmed = await confirm({
      title: action === 'approve' ? 'Approuver cet avis' : 'Refuser cet avis',
      message: 'Êtes-vous sûr de vouloir ' + (action === 'approve' ? 'approuver' : 'refuser') + ' cet avis ?',
      confirmText: action === 'approve' ? 'Approuver' : 'Refuser',
      variant: action === 'approve' ? 'default' : 'danger'
    })

    if (!confirmed) return

    try {
      setModerating(reviewId)
      const response = await fetch('/api/reviews/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ review_id: reviewId, action })
      })

      if (!response.ok) throw new Error('Erreur modération')

      showSuccess(action === 'approve' ? 'Avis approuvé' : 'Avis refusé')
      fetchReviews()
    } catch (error) {
      console.error('Erreur:', error)
      showError('Erreur lors de la modération')
    } finally {
      setModerating(null)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-7 h-7 animate-spin mx-auto text-petanque-vert" />
          <p className="mt-4 text-sm text-petanque-bois">Chargement…</p>
        </div>
      </div>
    )
  }

  const filterOptions: { value: FilterKey; label: string }[] = [
    { value: 'pending', label: 'En attente · ' + stats.pending },
    { value: 'approved', label: 'Approuvés' },
    { value: 'all', label: 'Tous' }
  ]

  return (
    <AdminLayout activeTab="reviews">
      <FadeIn>
        <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3">
          Administration · modération
        </p>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-3">
          Modération des <span className="accent-italic text-petanque-vert">avis.</span>
        </h1>
        <p className="text-base text-petanque-bois leading-relaxed mb-12 max-w-2xl">
          {stats.pending > 0 ? stats.pending + ' avis ' + (stats.pending > 1 ? 'sont' : 'est') + ' en attente de modération.' : 'Aucun avis en attente.'}
        </p>
      </FadeIn>

      {/* SECTION 01 : Stats */}
      <FadeIn delay={80}>
        <section className="pb-10 mb-10 border-b border-petanque-sable-bord/50">
          <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] mb-1.5">01</p>
          <h2 className="text-lg md:text-xl font-medium text-petanque-vert-fonce mb-5 tracking-tight">
            Chiffres clés
          </h2>
          <div className="grid grid-cols-3 gap-x-8 gap-y-6">
            <ReviewStat label="En attente" value={stats.pending} />
            <ReviewStat label="Approuvés" value={stats.approved} />
            <ReviewStat label="Total" value={stats.total} />
          </div>
        </section>
      </FadeIn>

      {/* SECTION 02 : Liste */}
      <FadeIn delay={140}>
        <section>
          <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] mb-1.5">02</p>
          <h2 className="text-lg md:text-xl font-medium text-petanque-vert-fonce mb-5 tracking-tight">
            Avis à examiner
          </h2>

          <div className="mb-6">
            <PillToggle options={filterOptions} value={filter} onChange={setFilter} />
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-petanque-bois italic py-12 text-center">
              Aucun avis à afficher.
            </p>
          ) : (
            <div className="divide-y divide-petanque-sable-bord/40">
              {reviews.map(review => (
                <ReviewRow
                  key={review.id}
                  review={review}
                  moderating={moderating === review.id}
                  onApprove={() => handleModerate(review.id, 'approve')}
                  onReject={() => handleModerate(review.id, 'reject')}
                />
              ))}
            </div>
          )}
        </section>
      </FadeIn>

      {ConfirmModal}
    </AdminLayout>
  )
}

function ReviewStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-1.5">{label}</p>
      <p className="font-mono text-2xl md:text-3xl font-medium leading-none text-petanque-vert-fonce">{value}</p>
    </div>
  )
}

function ReviewRow({ review, moderating, onApprove, onReject }: {
  review: Review
  moderating: boolean
  onApprove: () => void
  onReject: () => void
}) {
  const dateStr = new Date(review.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

  return (
    <article className="py-6">
      <div className="flex items-center gap-3 flex-wrap mb-3">
        <StarRating rating={review.rating} />
        <span className="text-petanque-sable-bord">·</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-petanque-bois">
          {sourceLabels[review.source] || review.source}
        </span>
        {review.approved && (
          <>
            <span className="text-petanque-sable-bord">·</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-petanque-vert font-medium">
              Approuvé
            </span>
          </>
        )}
      </div>

      <p className="text-base text-petanque-vert-fonce/90 leading-relaxed mb-3 italic">
        « {review.content} »
      </p>

      <div className="flex items-center gap-3 flex-wrap text-xs text-petanque-bois mb-4">
        <span className="font-medium text-petanque-vert-fonce">{review.name}</span>
        {review.role && (
          <>
            <span className="text-petanque-sable-bord">·</span>
            <span>{review.role}</span>
          </>
        )}
        {review.user_email && (
          <>
            <span className="text-petanque-sable-bord">·</span>
            <span className="font-mono">{review.user_email}</span>
          </>
        )}
        <span className="text-petanque-sable-bord">·</span>
        <span className="font-mono">{dateStr}</span>
      </div>

      {!review.approved && (
        <div className="flex gap-3">
          <button
            onClick={onApprove}
            disabled={moderating}
            className="text-xs font-medium text-petanque-vert hover:text-petanque-vert-fonce transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {moderating ? 'En cours…' : '✓ Approuver'}
          </button>
          <button
            onClick={onReject}
            disabled={moderating}
            className="text-xs font-medium text-petanque-cochonnet-fonce hover:text-petanque-cochonnet hover:underline decoration-petanque-cochonnet/40 underline-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            × Refuser
          </button>
        </div>
      )}
    </article>
  )
}
