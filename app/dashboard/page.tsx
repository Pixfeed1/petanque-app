// app/dashboard/page.tsx
// Dashboard principal avec design clean et professionnel

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { loadStripe } from '@stripe/stripe-js'

// Import des composants
import DashboardHeader from './components/DashboardHeader'
import StatsCards from './components/StatsCards'
import QuickActions from './components/QuickActions'
import TournamentList from './components/TournamentList'
import RecentMatches from './components/RecentMatches'
import { useDashboardData } from './hooks/useDashboardData'

// Initialisation Stripe
const stripePromise = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

// Icônes pour les actions en attente
const Icons = {
  edit: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  lightning: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
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
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { user, organization, loading: authLoading, signOut } = useAuth()
  const { loading, stats, tournois, recentMatches, refetch } = useDashboardData(organization?.id ? Number(organization.id) : undefined)

  const [userPlan, setUserPlan] = useState('free')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [pendingActions, setPendingActions] = useState<any[]>([])

  useEffect(() => {
    if (organization?.settings?.plan) {
      setUserPlan(organization.settings.plan)
    }
  }, [organization])

  // Calculer les actions en attente
  useEffect(() => {
    if (!tournois.length) return

    const actions: any[] = []

    // Tournois en préparation à démarrer
    const tournoiToStart = tournois.filter(t => t.status === 'preparation')
    tournoiToStart.forEach(tournoi => {
      actions.push({
        type: 'start_tournament',
        icon: Icons.lightning,
        title: 'Tournoi à démarrer',
        description: tournoi.name,
        action: () => router.push(`/tournoi/${tournoi.id}`)
      })
    })

    setPendingActions(actions)
  }, [tournois, router])

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-lg shadow-lg mb-4">
            {Icons.loader}
          </div>
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <DashboardHeader
        user={user}
        organization={organization}
        pendingActionsCount={pendingActions.length}
        pendingActions={pendingActions}
        userPlan={userPlan}
        onLogout={handleLogout}
        onOpenUpgrade={() => setShowUpgradeModal(true)}
      />

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Section de bienvenue */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bonjour {user?.full_name?.split(' ')[0] || 'Champion'} ! 👋
          </h1>
          <p className="text-gray-600">
            {stats.tournoiEnCours > 0
              ? `Vous avez ${stats.tournoiEnCours} tournoi${stats.tournoiEnCours > 1 ? 's' : ''} en cours`
              : 'Prêt à organiser un nouveau tournoi ?'
            }
          </p>
        </div>

        {/* Cartes de statistiques */}
        <div className="mb-8">
          <StatsCards stats={stats} loading={loading} />
        </div>

        {/* Actions rapides */}
        <div className="mb-8">
          <QuickActions
            onNewTournament={() => router.push('/tournoi/nouveau')}
            onManagePlayers={() => router.push('/joueurs')}
            onViewStats={() => {/* TODO: Modal stats détaillées */}}
            onQuiz={() => router.push('/quiz')}
          />
        </div>

        {/* Grille principale : Liste tournois + Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Liste des tournois (2/3) */}
          <div className="lg:col-span-2">
            <TournamentList
              tournois={tournois}
              loading={loading}
              onCreateNew={() => router.push('/tournoi/nouveau')}
            />
          </div>

          {/* Sidebar : Matchs récents (1/3) */}
          <div>
            <RecentMatches matches={recentMatches} loading={loading} />
          </div>
        </div>
      </main>

      {/* Modal Upgrade Premium */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
            {/* Header modal */}
            <div className="bg-green-600 p-6 text-white relative">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded transition-colors"
              >
                {Icons.x}
              </button>
              <h2 className="text-2xl font-bold mb-1">
                {userPlan === 'premium' ? 'Vous êtes Premium ! 🎉' : 'Passez à Premium'}
              </h2>
              <p className="text-green-100 text-sm">
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
                    {/* Plan Gratuit */}
                    <div className="border-2 border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900">Gratuit</h3>
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">
                          Actuel
                        </span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-3">0€</div>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">{Icons.check}</span>
                          <span className="text-gray-700">Tournois illimités</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">{Icons.check}</span>
                          <span className="text-gray-700">Toutes les fonctionnalités</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-orange-500 mr-2">⚠️</span>
                          <span className="text-gray-700">Avec publicités</span>
                        </li>
                      </ul>
                    </div>

                    {/* Plan Premium */}
                    <div className="border-2 border-green-500 rounded-lg p-4 bg-green-50">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-bold text-gray-900">Premium</h3>
                        <span className="text-yellow-500">{Icons.crown}</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600 mb-1">4,99€</div>
                      <p className="text-xs text-gray-600 mb-3">Paiement unique, à vie</p>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">{Icons.check}</span>
                          <span className="text-gray-700 font-medium">Tournois illimités</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">{Icons.check}</span>
                          <span className="text-gray-700 font-medium">Toutes les fonctionnalités</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">{Icons.check}</span>
                          <span className="text-gray-700 font-bold">Sans publicité</span>
                        </li>
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">{Icons.check}</span>
                          <span className="text-gray-700 font-bold">Support prioritaire</span>
                        </li>
                      </ul>
                    </div>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={handleUpgrade}
                      disabled={processingPayment}
                      className="px-6 py-3 bg-green-600 text-white text-base rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <p className="mt-3 text-xs text-gray-500">
                      Paiement sécurisé via Stripe • Satisfaction garantie
                    </p>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-3">
                    <span className="text-green-600">{Icons.crown}</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Merci pour votre soutien !
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    Vous profitez de l'application sans publicité et avec toutes les fonctionnalités.
                  </p>
                  <div className="bg-green-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2 text-sm">Vos avantages Premium :</h4>
                    <div className="grid grid-cols-2 gap-3 text-left text-sm">
                      <div className="flex items-start">
                        <span className="text-green-500 mr-2">{Icons.check}</span>
                        <span className="text-gray-700">Sans publicité</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-green-500 mr-2">{Icons.check}</span>
                        <span className="text-gray-700">Support prioritaire</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-green-500 mr-2">{Icons.check}</span>
                        <span className="text-gray-700">Mises à jour gratuites</span>
                      </div>
                      <div className="flex items-start">
                        <span className="text-green-500 mr-2">{Icons.check}</span>
                        <span className="text-gray-700">Accès à vie</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
