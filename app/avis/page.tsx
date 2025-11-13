// app/avis/page.tsx
// Page publique affichant tous les avis avec filtres

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '../components/Navbar'
import Footer from '../components/footer'

// Icônes
const Icons = {
  star: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  filter: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
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
  created_at: string
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

  // Charger les avis
  const fetchReviews = async () => {
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

      const response = await fetch(`/api/reviews?${params.toString()}`)
      if (!response.ok) throw new Error('Erreur chargement')

      const data = await response.json()
      setReviews(data.reviews)
      setTotalReviews(data.total)
      setStats({
        average: data.stats.average,
        total: data.stats.total_approved
      })
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [page, filterRating])

  // Affichage des étoiles
  const renderStars = (rating: number, size: 'small' | 'large' = 'small') => {
    const sizeClass = size === 'large' ? 'w-8 h-8' : 'w-5 h-5'
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`${sizeClass} ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    )
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

  const scrollToSection = (sectionId: string) => {
    router.push(`/#${sectionId}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Header */}
      <div className="bg-gradient-to-br from-green-600 to-emerald-700 text-white pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Tous les avis
          </h1>
          <p className="text-xl text-green-100">
            Découvrez l'expérience de nos utilisateurs
          </p>

          {/* Stats globales */}
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <div className="flex items-center space-x-2">
              {renderStars(Math.round(stats.average), 'large')}
              <span className="text-3xl font-bold ml-3">{stats.average.toFixed(1)}/5</span>
            </div>
            <div className="bg-white/20 rounded-full px-6 py-2">
              <span className="font-semibold">{stats.total} avis vérifiés</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border-b sticky top-16 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center space-x-2">
            <span className="text-gray-700 font-medium flex items-center">
              {Icons.filter}
              <span className="ml-2">Filtrer par note :</span>
            </span>
            <button
              onClick={() => setFilterRating(null)}
              className={`px-4 py-2 rounded-full transition ${
                filterRating === null
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Tous
            </button>
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                onClick={() => setFilterRating(rating)}
                className={`px-4 py-2 rounded-full transition flex items-center ${
                  filterRating === rating
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {rating} {Icons.star}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Liste des avis */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des avis...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Aucun avis trouvé pour ce filtre</p>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all"
                >
                  <div className="flex items-center justify-between mb-4">
                    {renderStars(review.rating)}
                    {renderSourceBadge(review.source)}
                  </div>

                  <p className="text-gray-700 mb-4 italic min-h-[80px]">"{review.content}"</p>

                  <div className="border-t pt-4">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                        {review.name[0]}
                      </div>
                      <div className="ml-3">
                        <p className="font-bold text-gray-900">{review.name}</p>
                        {review.role && (
                          <p className="text-sm text-gray-600">{review.role}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(review.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalReviews > limit && (
              <div className="flex justify-center items-center space-x-4 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg border hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Précédent
                </button>

                <span className="text-gray-600">
                  Page {page} sur {Math.ceil(totalReviews / limit)}
                </span>

                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(totalReviews / limit)}
                  className="px-4 py-2 bg-white text-gray-700 rounded-lg border hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Suivant
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <Footer scrollToSection={scrollToSection} />
    </div>
  )
}
