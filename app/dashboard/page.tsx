// app/dashboard/page.tsx
// Dashboard Pétanque Pro - Style cohérent avec l'application

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { loadStripe } from '@stripe/stripe-js'
import { useDashboardData } from './hooks/useDashboardData'
import AdBanner from '@/components/AdBanner'

const stripePromise = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

// Icônes
const Icons = {
  petanque: (
    <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="30" fill="url(#metalGradient)" stroke="#5a6978" strokeWidth="2"/>
      <circle cx="26" cy="26" r="3" fill="#ffffff" opacity="0.8"/>
      <circle cx="38" cy="38" r="2" fill="#2d3748" opacity="0.3"/>
      <circle cx="40" cy="28" r="2" fill="#2d3748" opacity="0.3"/>
      <defs>
        <radialGradient id="metalGradient">
          <stop offset="0%" stopColor="#a8b2c3"/>
          <stop offset="100%" stopColor="#8e9aaf"/>
        </radialGradient>
      </defs>
    </svg>
  ),
  trophy: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  play: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
    </svg>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { user, organization, loading: authLoading, signOut } = useAuth()
  const { loading, stats, tournois, recentMatches, refetch } = useDashboardData(organization?.id ? Number(organization.id) : undefined)

  const [userPlan, setUserPlan] = useState('free')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'preparation' | 'en_cours' | 'termine'>('all')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    if (organization?.settings?.plan && typeof organization.settings.plan === 'string') {
      setUserPlan(organization.settings.plan)
    }
  }, [organization])

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return

      switch(e.key.toLowerCase()) {
        case 'n':
          router.push('/tournoi/nouveau')
          break
        case 'j':
          router.push('/joueurs')
          break
        case '/':
          e.preventDefault()
          document.getElementById('search-input')?.focus()
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [router])

  // Actions intelligentes
  const actionItems = tournois.reduce((actions: any[], tournoi) => {
    if (tournoi.status === 'preparation' && tournoi.nb_joueurs && tournoi.nb_joueurs % 2 !== 0) {
      actions.push({
        id: `odd-${tournoi.id}`,
        priority: 'high',
        title: 'Nombre impair',
        subtitle: tournoi.name,
        label: 'Corriger',
        url: `/tournoi/${tournoi.id}`
      })
    }
    return actions
  }, [])

  const filteredTournois = tournois.filter(tournoi => {
    const matchesSearch = searchQuery === '' ||
      tournoi.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tournoi.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleLogout = async () => {
    await signOut()
  }

  const handleUpgrade = async () => {
    if (!user?.id) return

    setProcessingPayment(true)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          priceId: 'premium_yearly' // Abonnement annuel 4,99€/an
        })
      })

      const { sessionId, url } = await response.json()

      if (url) {
        // Rediriger vers Stripe Checkout
        window.location.href = url
      }
    } catch (error) {
      console.error('Erreur lors de la création de la session:', error)
      alert('Une erreur est survenue. Veuillez réessayer.')
      setProcessingPayment(false)
    }
  }

  // Afficher un loader plein écran SEULEMENT au premier chargement
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-200 border-t-green-600 rounded-full animate-spin" />
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header comme le reste de l'app */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
                {Icons.petanque}
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Dashboard Pétanque
                </h1>
                <p className="text-xs text-gray-500">{organization?.name || 'Mon organisation'}</p>
              </div>
              {loading && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs">
                  <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  <span>Actualisation...</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => router.push('/joueurs')}
                className="hidden md:flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                {Icons.users}
                <span className="text-sm">Joueurs</span>
              </button>
              <button
                onClick={() => router.push('/parametres')}
                className="hidden md:flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                {Icons.settings}
                <span className="text-sm">Paramètres</span>
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-xl transition"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{organization?.name}</p>
                      {userPlan === 'premium' && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-medium rounded-full">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Premium
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      {userPlan !== 'premium' && (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false)
                            setShowUpgradeModal(true)
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-md transition font-medium mb-1"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span>Passer à Premium</span>
                        </button>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
                      >
                        {Icons.logout}
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content - Style minimaliste */}
      <main className="pt-16">
        <div className="max-w-[1600px] mx-auto px-6 py-12">
          <div className="mb-16">
            <h1 className="text-5xl font-semibold text-gray-900 tracking-tight mb-3">
              Dashboard
            </h1>
            <p className="text-lg text-gray-600">
              Gérez vos tournois de pétanque en toute simplicité
            </p>
          </div>

          {/* Stats - Style minimaliste avec charte verte */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Vue d'ensemble</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-semibold text-gray-900">{stats.totalTournois}</span>
                  {stats.nouveauxTournois > 0 && (
                    <span className="text-sm font-medium text-green-600">+{stats.nouveauxTournois}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Tournois créés</p>
              </div>

              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-semibold text-gray-900">{stats.totalJoueurs}</span>
                  {stats.nouveauxJoueurs > 0 && (
                    <span className="text-sm font-medium text-green-600">+{stats.nouveauxJoueurs}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Joueurs actifs</p>
              </div>

              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-semibold text-gray-900">{stats.totalMatchs}</span>
                  {stats.nouveauxMatchs > 0 && (
                    <span className="text-sm font-medium text-green-600">+{stats.nouveauxMatchs}</span>
                  )}
                </div>
                <p className="text-sm text-gray-600">Matchs joués</p>
              </div>
            </div>
          </div>

          {/* Publicité 1 - Uniquement pour les utilisateurs gratuits */}
          <div className="mb-16">
            <AdBanner
              variant="responsive"
              userPlan={userPlan}
              showOnlyForFree={true}
            />
          </div>

          {/* Tournois en cours */}
          {stats.tournoiEnCours > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <h2 className="text-2xl font-semibold text-gray-900">
                  {stats.tournoiEnCours} tournoi{stats.tournoiEnCours > 1 ? 's' : ''} en cours
                </h2>
              </div>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {tournois
                    .filter(t => t.status === 'en_cours')
                    .map((tournoi) => (
                      <button
                        key={tournoi.id}
                        onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                        className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-gray-50 transition text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-gray-900">{tournoi.name}</h3>
                          <p className="text-xs text-gray-500">{tournoi.format} · {tournoi.mode}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">
                            {tournoi.nb_matchs_joues || 0}/{tournoi.nb_matchs_total || 0} matchs
                          </p>
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Activité récente */}
          {recentMatches.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Activité récente</h2>
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {recentMatches.slice(0, 5).map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between px-6 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          {match.equipe_a?.name || 'Équipe A'} vs {match.equipe_b?.name || 'Équipe B'}
                        </p>
                        <p className="text-xs text-gray-500">
                          Tour {match.tour} {match.terrain ? `· Terrain ${match.terrain}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {match.score_a} - {match.score_b}
                        </p>
                        <p className="text-xs text-gray-500">
                          {match.status === 'termine' ? 'Terminé' : 'En cours'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Publicité 2 - Uniquement pour les utilisateurs gratuits */}
          <div className="mb-16">
            <AdBanner
              variant="horizontal"
              userPlan={userPlan}
              showOnlyForFree={true}
            />
          </div>

          {/* Tournois */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Tournois</h2>
              <button
                onClick={() => router.push('/tournoi/nouveau')}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full hover:shadow-lg transition-all hover:scale-105 font-medium"
              >
                Nouveau tournoi
              </button>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {filteredTournois.length === 0 ? (
                <div className="py-24 text-center">
                  <p className="text-gray-600">Aucun tournoi trouvé</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredTournois.map((tournoi) => (
                    <button
                      key={tournoi.id}
                      onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900">{tournoi.name}</h3>
                        <p className="text-xs text-gray-500">{tournoi.format}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Modal Upgrade Premium */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
            {/* Header avec gradient vert */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Passer à Premium</h2>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  disabled={processingPayment}
                  className="text-white/80 hover:text-white transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-bold">4,99€</span>
                <span className="text-white/80">/an</span>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-6">
              {/* Avantages */}
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Sans publicité</p>
                    <p className="text-sm text-gray-600">Une expérience pure et fluide</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Accès illimité</p>
                    <p className="text-sm text-gray-600">Tous les tournois, sans limite</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Support prioritaire</p>
                    <p className="text-sm text-gray-600">Réponse rapide à vos questions</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Mises à jour gratuites</p>
                    <p className="text-sm text-gray-600">Toutes les nouvelles fonctionnalités</p>
                  </div>
                </div>
              </div>

              {/* Bouton de paiement */}
              <button
                onClick={handleUpgrade}
                disabled={processingPayment}
                className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processingPayment ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Redirection...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>S'abonner - 4,99€/an</span>
                  </>
                )}
              </button>

              <p className="text-xs text-center text-gray-500">
                Paiement sécurisé par Stripe • Satisfait ou remboursé 30 jours
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
