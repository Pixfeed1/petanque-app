// app/admin/reviews/page.tsx
// Panel admin pour modérer les avis utilisateurs

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { StarRating } from '@/components/StarRating'

// Icônes
const Icons = {
  star: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  back: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  ),
  refresh: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

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

export default function AdminReviews() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [reviews, setReviews] = useState<Review[]>([])
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('pending')
  const [moderating, setModerating] = useState<number | null>(null)

  // Charger les avis
  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/reviews/moderate?status=${filter}`, {
        credentials: 'include'
      })

      if (response.status === 403) {
        alert('Accès refusé - Vous n\'êtes pas administrateur')
        router.push('/dashboard')
        return
      }

      if (!response.ok) throw new Error('Erreur chargement avis')

      const data = await response.json()
      setReviews(data.reviews)
      setStats(data.stats)
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors du chargement des avis')
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

  // Modérer un avis
  const handleModerate = async (reviewId: number, action: 'approve' | 'reject') => {
    if (!confirm(`Êtes-vous sûr de vouloir ${action === 'approve' ? 'approuver' : 'refuser'} cet avis ?`)) {
      return
    }

    try {
      setModerating(reviewId)

      const response = await fetch('/api/reviews/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ review_id: reviewId, action })
      })

      if (!response.ok) throw new Error('Erreur modération')

      const data = await response.json()
      alert(data.message)

      // Recharger les avis
      fetchReviews()
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de la modération')
    } finally {
      setModerating(null)
    }
  }

  // Badge source
  const renderSourceBadge = (source: string) => {
    const badges = {
      web: { text: 'Web', color: 'bg-blue-100 text-blue-700' },
      google_play: { text: 'Google Play', color: 'bg-green-100 text-green-700' },
      app_store: { text: 'App Store', color: 'bg-gray-100 text-gray-700' }
    }

    const badge = badges[source as keyof typeof badges] || badges.web

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.text}
      </span>
    )
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {Icons.back}
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Modération des avis</h1>
                <p className="text-gray-600 mt-1">Gérer les avis utilisateurs</p>
              </div>
            </div>
            <button
              onClick={fetchReviews}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              {Icons.refresh}
              <span className="ml-2">Actualiser</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-orange-50 rounded-lg p-4">
              <p className="text-sm text-orange-600 font-medium">En attente</p>
              <p className="text-3xl font-bold text-orange-700 mt-1">{stats.pending}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 font-medium">Approuvés</p>
              <p className="text-3xl font-bold text-green-700 mt-1">{stats.approved}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-600 font-medium">Total</p>
              <p className="text-3xl font-bold text-blue-700 mt-1">{stats.total}</p>
            </div>
          </div>

          {/* Filtres */}
          <div className="flex space-x-2 mt-6">
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'pending'
                  ? 'bg-orange-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              En attente ({stats.pending})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'approved'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Approuvés ({stats.approved})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Tous ({stats.total})
            </button>
          </div>
        </div>
      </div>

      {/* Liste des avis */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">Aucun avis à afficher</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <StarRating rating={review.rating} />
                      {renderSourceBadge(review.source)}
                      {review.approved && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Approuvé
                        </span>
                      )}
                    </div>

                    <p className="text-gray-800 text-lg mb-3 italic">"{review.content}"</p>

                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="font-medium">{review.name}</span>
                      {review.role && <span>• {review.role}</span>}
                      {review.user_email && <span>• {review.user_email}</span>}
                      <span>• {new Date(review.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>

                  {!review.approved && (
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleModerate(review.id, 'approve')}
                        disabled={moderating === review.id}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                      >
                        {Icons.check}
                        <span className="ml-2">Approuver</span>
                      </button>
                      <button
                        onClick={() => handleModerate(review.id, 'reject')}
                        disabled={moderating === review.id}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                      >
                        {Icons.x}
                        <span className="ml-2">Refuser</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
