// app/dashboard/page.tsx
// Dashboard club de pétanque - Style moderne et convivial

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { loadStripe } from '@stripe/stripe-js'

// Import des composants
import DashboardHeader from './components/DashboardHeader'
import ActiveTournaments from './components/ActiveTournaments'
import { useDashboardData } from './hooks/useDashboardData'

// Initialisation Stripe
const stripePromise = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

const Icons = {
  x: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  crown: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2l2.5 5 5.5 1-4 4 1 5.5L10 14l-5 3.5 1-5.5-4-4 5.5-1L10 2z" />
    </svg>
  ),
  loader: (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  trophy: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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

  // États pour recherche et filtres
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'preparation' | 'en_cours' | 'termine'>('all')

  useEffect(() => {
    if (organization?.settings?.plan) {
      setUserPlan(organization.settings.plan)
    }
  }, [organization])

  // Raccourcis clavier (pas affichés)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return

      switch(e.key.toLowerCase()) {
        case 'n':
          router.push('/tournoi/nouveau')
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

  // Filtrer les tournois selon recherche et statut
  const filteredTournois = tournois.filter(tournoi => {
    const matchesSearch = searchQuery === '' ||
      tournoi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournoi.format.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || tournoi.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const handleLogout = async () => {
    await signOut()
  }

  const handleUpgrade = async () => {
    setProcessingPayment(true)

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email
        })
      })

      const { sessionId } = await response.json()

      const stripe = await stripePromise
      if (stripe) {
        const { error } = await stripe.redirectToCheckout({ sessionId })
        if (error) {
          console.error('Erreur Stripe:', error)
        }
      }
    } catch (error) {
      console.error('Erreur upgrade:', error)
      alert('Service de paiement temporairement indisponible')
    } finally {
      setProcessingPayment(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-xl shadow-lg mb-4">
            {Icons.loader}
          </div>
          <p className="text-sm text-stone-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50">
      {/* Header */}
      <DashboardHeader
        user={user}
        organization={organization}
        userPlan={userPlan}
        onLogout={handleLogout}
        onOpenUpgrade={() => setShowUpgradeModal(true)}
      />

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header section avec CTA */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-stone-900 mb-1">Mes Tournois</h1>
              <p className="text-stone-600">
                {filteredTournois.length} tournoi{filteredTournois.length > 1 ? 's' : ''}
              </p>
            </div>

            {/* Gros bouton CTA */}
            <button
              onClick={() => router.push('/tournoi/nouveau')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white font-semibold rounded-xl hover:from-orange-700 hover:to-amber-700 shadow-lg shadow-orange-200 transition-all"
            >
              {Icons.plus}
              Nouveau tournoi
            </button>
          </div>

          {/* Barre de recherche */}
          <div className="mb-4">
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="search-input"
                type="text"
                placeholder="Rechercher un tournoi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border-2 border-stone-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {Icons.x}
                </button>
              )}
            </div>
          </div>

          {/* Filtres de statut */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'preparation', 'en_cours', 'termine'] as const).map(status => {
              const labels = {
                all: 'Tous',
                preparation: 'En préparation',
                en_cours: 'En cours',
                termine: 'Terminés'
              }
              const counts = {
                all: tournois.length,
                preparation: tournois.filter(t => t.status === 'preparation').length,
                en_cours: tournois.filter(t => t.status === 'en_cours').length,
                termine: tournois.filter(t => t.status === 'termine').length
              }

              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    statusFilter === status
                      ? 'bg-orange-600 text-white shadow-md'
                      : 'bg-white text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {labels[status]} <span className="opacity-75">({counts[status]})</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Layout 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Tournois actifs - 3/4 */}
          <div className="lg:col-span-3">
            <ActiveTournaments tournois={filteredTournois} loading={loading} />
          </div>

          {/* Sidebar stats - 1/4 */}
          <div>
            <div className="bg-white/80 backdrop-blur rounded-xl border-2 border-stone-200 p-6 sticky top-24">
              <h3 className="font-bold text-stone-900 mb-6 text-lg flex items-center gap-2">
                {Icons.trophy}
                Tableau de bord
              </h3>

              <div className="space-y-6">
                {/* Tournois */}
                <div>
                  <div className="text-4xl font-bold text-orange-600 mb-1">{stats.totalTournois}</div>
                  <div className="text-sm text-stone-600 font-medium">Tournois</div>
                  <div className="text-xs text-stone-500 mt-1">{stats.tournoiEnCours} en cours</div>
                </div>

                {/* Joueurs */}
                <div className="pt-6 border-t-2 border-stone-100">
                  <div className="text-4xl font-bold text-amber-600 mb-1">{stats.totalJoueurs}</div>
                  <div className="text-sm text-stone-600 font-medium">Joueurs</div>
                </div>

                {/* Matchs */}
                <div className="pt-6 border-t-2 border-stone-100">
                  <div className="text-4xl font-bold text-stone-700 mb-1">{stats.totalMatchs}</div>
                  <div className="text-sm text-stone-600 font-medium">Matchs joués</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Upgrade Premium */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden">
            <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6 text-white relative">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded transition-colors"
              >
                {Icons.x}
              </button>
              <h2 className="text-2xl font-bold mb-1">
                {userPlan === 'premium' ? 'Vous êtes Premium' : 'Passez à Premium'}
              </h2>
              <p className="text-orange-100 text-sm">
                {userPlan === 'premium'
                  ? 'Profitez de toutes les fonctionnalités sans publicité'
                  : 'Supprimez les publicités et soutenez le développement'
                }
              </p>
            </div>

            <div className="p-6">
              {userPlan === 'free' ? (
                <>
                  <div className="grid md:grid-cols-2 gap-4 mb-6">
                    <div className="border-2 border-stone-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-stone-900">Gratuit</h3>
                        <span className="px-2 py-1 bg-stone-100 text-stone-600 rounded text-xs font-medium">
                          Actuel
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-stone-900 mb-3">0€</div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <span className="text-orange-500 mr-2">{Icons.check}</span>
                          <span className="text-stone-700">Tournois illimités</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-orange-500 mr-2">{Icons.check}</span>
                          <span className="text-stone-700">Toutes les fonctionnalités</span>
                        </li>
                        <li className="flex items-start">
                          <svg className="w-5 h-5 text-amber-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-stone-700">Avec publicités</span>
                        </li>
                      </ul>
                    </div>

                    <div className="border-2 border-orange-500 rounded-xl p-4 bg-orange-50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-stone-900">Premium</h3>
                        <span className="text-amber-500">{Icons.crown}</span>
                      </div>
                      <div className="text-2xl font-bold text-orange-600 mb-1">4,99€</div>
                      <p className="text-xs text-stone-600 mb-3">Paiement unique, à vie</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <span className="text-orange-500 mr-2">{Icons.check}</span>
                          <span className="text-stone-700 font-medium">Tournois illimités</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-orange-500 mr-2">{Icons.check}</span>
                          <span className="text-stone-700 font-medium">Toutes les fonctionnalités</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-orange-500 mr-2">{Icons.check}</span>
                          <span className="text-stone-700 font-bold">Sans publicité</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-orange-500 mr-2">{Icons.check}</span>
                          <span className="text-stone-700 font-bold">Support prioritaire</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={handleUpgrade}
                      disabled={processingPayment}
                      className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-base rounded-xl hover:from-orange-700 hover:to-amber-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                      {processingPayment ? (
                        <span className="flex items-center justify-center">
                          {Icons.loader}
                          <span className="ml-2">Traitement...</span>
                        </span>
                      ) : (
                        'Passer à Premium (4,99€)'
                      )}
                    </button>
                    <p className="mt-3 text-xs text-stone-500">
                      Paiement sécurisé via Stripe • Satisfaction garantie
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-3">
                    <span className="text-orange-600">{Icons.crown}</span>
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">
                    Merci pour votre soutien
                  </h3>
                  <p className="text-stone-600 mb-4 text-sm">
                    Vous profitez de l'application sans publicité
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
