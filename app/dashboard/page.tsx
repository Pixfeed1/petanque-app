// app/dashboard/page.tsx
// Dashboard professionnel optimisé pour organisateurs de tournois

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { loadStripe } from '@stripe/stripe-js'

// Import des composants
import DashboardHeader from './components/DashboardHeader'
import ActionCenter, { ActionItem } from './components/ActionCenter'
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
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  book: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
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
  const [actionItems, setActionItems] = useState<ActionItem[]>([])

  // États pour recherche et filtres
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'preparation' | 'en_cours' | 'termine'>('all')

  useEffect(() => {
    if (organization?.settings?.plan) {
      setUserPlan(organization.settings.plan)
    }
  }, [organization])

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignorer si focus dans un input
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

  // Générer les actions requises - INTELLIGENT
  useEffect(() => {
    if (!tournois.length) return

    const actions: ActionItem[] = []
    const now = new Date()

    tournois.forEach(tournoi => {
      // 1. Tournois avec nombre de joueurs impair (impossible de faire des équipes)
      if (tournoi.status === 'preparation' && tournoi.nb_joueurs && tournoi.nb_joueurs % 2 !== 0) {
        actions.push({
          id: `odd-players-${tournoi.id}`,
          type: 'tournament_delayed',
          priority: 'high',
          title: 'Nombre de joueurs impair',
          description: tournoi.name,
          actionLabel: 'Corriger',
          actionUrl: `/tournoi/${tournoi.id}`,
          meta: `${tournoi.nb_joueurs} joueurs (impossible de créer des équipes)`
        })
      }

      // 2. Tournois prêts à démarrer (avec joueurs pairs)
      if (tournoi.status === 'preparation' && tournoi.nb_joueurs && tournoi.nb_joueurs % 2 === 0 && tournoi.nb_joueurs >= 4) {
        actions.push({
          id: `start-${tournoi.id}`,
          type: 'tournament_ready',
          priority: 'high',
          title: 'Tournoi prêt à démarrer',
          description: tournoi.name,
          actionLabel: 'Démarrer',
          actionUrl: `/tournoi/${tournoi.id}`,
          meta: `${tournoi.nb_joueurs} joueurs inscrits`
        })
      }

      // 3. Tournois en préparation avec trop peu de joueurs
      if (tournoi.status === 'preparation' && (!tournoi.nb_joueurs || tournoi.nb_joueurs < 4)) {
        actions.push({
          id: `low-players-${tournoi.id}`,
          type: 'tournament_delayed',
          priority: 'medium',
          title: 'Pas assez de joueurs',
          description: tournoi.name,
          actionLabel: 'Ajouter',
          actionUrl: `/tournoi/${tournoi.id}`,
          meta: `${tournoi.nb_joueurs || 0} joueurs (minimum 4 requis)`
        })
      }

      // 4. Tournois en cours avec matchs restants
      if (tournoi.status === 'en_cours') {
        const restants = (tournoi.nb_matchs_total || 0) - (tournoi.nb_matchs_joues || 0)
        if (restants > 0) {
          actions.push({
            id: `manage-${tournoi.id}`,
            type: 'match_pending',
            priority: 'medium',
            title: 'Matchs en attente',
            description: tournoi.name,
            actionLabel: 'Gérer',
            actionUrl: `/tournoi/${tournoi.id}`,
            meta: `${restants} match${restants > 1 ? 's' : ''} restant${restants > 1 ? 's' : ''}`
          })
        }
      }

      // 5. Tournois terminés depuis >24h (à clôturer)
      if (tournoi.status === 'termine') {
        const createdAt = new Date(tournoi.created_at)
        const hoursSinceEnd = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
        if (hoursSinceEnd > 24) {
          actions.push({
            id: `close-${tournoi.id}`,
            type: 'tournament_delayed',
            priority: 'low',
            title: 'Tournoi à clôturer',
            description: tournoi.name,
            actionLabel: 'Voir résultats',
            actionUrl: `/tournoi/${tournoi.id}/podium`,
            meta: `Terminé il y a ${Math.floor(hoursSinceEnd)}h`
          })
        }
      }
    })

    // Trier par priorité : high > medium > low
    const priorityOrder: Record<'high' | 'medium' | 'low', number> = { high: 0, medium: 1, low: 2 }
    actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])

    setActionItems(actions)
  }, [tournois])

  // Générer les actions rapides pour les notifications header
  const pendingActionsForHeader = actionItems.map(action => ({
    type: action.type,
    icon: Icons.plus,
    title: action.title,
    description: action.description,
    action: () => router.push(action.actionUrl)
  }))

  // Filtrer les tournois selon recherche et statut
  const filteredTournois = tournois.filter(tournoi => {
    // Filtre de recherche
    const matchesSearch = searchQuery === '' ||
      tournoi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tournoi.format.toLowerCase().includes(searchQuery.toLowerCase())

    // Filtre de statut
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
        pendingActionsCount={actionItems.length}
        pendingActions={pendingActionsForHeader}
        userPlan={userPlan}
        onLogout={handleLogout}
        onOpenUpgrade={() => setShowUpgradeModal(true)}
      />

      {/* Contenu principal */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Action Center - priorité #1 */}
        <div className="mb-8">
          <ActionCenter actions={actionItems} loading={loading} />
        </div>

        {/* Layout 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tournois actifs - 2/3 */}
          <div className="lg:col-span-2">
            {/* Header avec recherche et filtres */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Tournois actifs</h2>
                  <p className="text-gray-600 text-sm mt-1">
                    {filteredTournois.length} tournoi{filteredTournois.length > 1 ? 's' : ''} trouvé{filteredTournois.length > 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">
                  Raccourcis: <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border">N</kbd> nouveau, <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border">J</kbd> joueurs, <kbd className="font-mono bg-white px-1.5 py-0.5 rounded border">/</kbd> recherche
                </div>
              </div>

              {/* Barre de recherche */}
              <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Rechercher un tournoi par nom ou format..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {Icons.x}
                    </button>
                  )}
                </div>
              </div>

              {/* Filtres de statut */}
              <div className="flex gap-2">
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
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        statusFilter === status
                          ? 'bg-green-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      {labels[status]} <span className="text-xs opacity-75">({counts[status]})</span>
                    </button>
                  )
                })}
              </div>
            </div>
            <ActiveTournaments tournois={filteredTournois} loading={loading} />
          </div>

          {/* Sidebar - 1/3 */}
          <div className="space-y-6">
            {/* Actions rapides */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Actions rapides</h3>
              <div className="space-y-2">
                <button
                  onClick={() => router.push('/tournoi/nouveau')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                >
                  {Icons.plus}
                  <span className="font-medium text-gray-900">Nouveau tournoi</span>
                </button>
                <button
                  onClick={() => router.push('/joueurs')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                >
                  {Icons.users}
                  <span className="font-medium text-gray-900">Gérer les joueurs</span>
                </button>
                <button
                  onClick={() => router.push('/quiz')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 rounded-lg transition-colors border border-gray-200"
                >
                  {Icons.book}
                  <span className="font-medium text-gray-900">Quiz pétanque</span>
                </button>
              </div>
            </div>

            {/* Stats essentielles avec tendances */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Statistiques</h3>
              <div className="space-y-4">
                {/* Tournois */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Tournois totaux</span>
                    <span className="text-2xl font-bold text-gray-900">{stats.totalTournois}</span>
                  </div>
                  {stats.nouveauxTournois > 0 ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold text-green-600">+{stats.nouveauxTournois}</span>
                      <span className="text-gray-500">ce mois</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Aucun nouveau</span>
                    </div>
                  )}
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((stats.tournoiEnCours / stats.totalTournois) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stats.tournoiEnCours} en cours</p>
                </div>

                {/* Joueurs */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Joueurs actifs</span>
                    <span className="text-2xl font-bold text-gray-900">{stats.totalJoueurs}</span>
                  </div>
                  {stats.nouveauxJoueurs > 0 ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold text-green-600">+{stats.nouveauxJoueurs}</span>
                      <span className="text-gray-500">ce mois</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Aucun nouveau</span>
                    </div>
                  )}
                </div>

                {/* Matchs */}
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Matchs joués</span>
                    <span className="text-2xl font-bold text-gray-900">{stats.totalMatchs}</span>
                  </div>
                  {stats.nouveauxMatchs > 0 ? (
                    <div className="flex items-center gap-1.5 text-xs">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold text-green-600">+{stats.nouveauxMatchs}</span>
                      <span className="text-gray-500">ce mois</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>Aucun nouveau</span>
                    </div>
                  )}
                  {stats.totalMatchs > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Moyenne: {(stats.totalMatchs / Math.max(stats.totalTournois, 1)).toFixed(1)} matchs/tournoi
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Upgrade Premium - identique */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden">
            <div className="bg-green-600 p-6 text-white relative">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded transition-colors"
              >
                {Icons.x}
              </button>
              <h2 className="text-2xl font-bold mb-1">
                {userPlan === 'premium' ? 'Vous êtes Premium' : 'Passez à Premium'}
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
                          <svg className="w-5 h-5 text-orange-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          <span className="text-gray-700">Avec publicités</span>
                        </li>
                      </ul>
                    </div>

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
                    Merci pour votre soutien
                  </h3>
                  <p className="text-gray-600 mb-4 text-sm">
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
