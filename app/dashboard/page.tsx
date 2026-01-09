// app/dashboard/page.tsx
// Dashboard Pétanque Pro - Style cohérent avec l'application

'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { loadStripe } from '@stripe/stripe-js'
import { useDashboardData } from './hooks/useDashboardData'
import AdBanner from '@/components/AdBanner'
import { Petanque, Trophy, Users, Play, Chart, Plus, Logout, Settings } from '@/components/Icons'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import type { ActionItem } from '@/lib/types'

const stripePromise = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

// Icônes
const Icons = {
  petanque: <Petanque className="w-10 h-10" />,
  trophy: <Trophy />,
  users: <Users />,
  play: <Play />,
  chart: <Chart />,
  plus: <Plus />,
  logout: <Logout />,
  settings: <Settings />
}

export default function Dashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, organization, loading: authLoading, signOut, hasPackClub } = useAuth()
  const { loading, stats, tournois, recentMatches, joueurs, refetch } = useDashboardData(organization?.id ? Number(organization.id) : undefined)

  // Helper pour afficher les noms des joueurs d'une équipe
  const getTeamDisplay = (equipe: { name: string; joueur_ids?: number[] } | undefined) => {
    if (!equipe) return 'Équipe ?'
    // Si on a des joueur_ids, afficher les noms des joueurs
    if (equipe.joueur_ids && equipe.joueur_ids.length > 0 && joueurs.length > 0) {
      const playerNames = equipe.joueur_ids
        .map(id => joueurs.find(j => String(j.id) === String(id)))
        .filter(Boolean)
        .map(j => j!.name || 'Joueur')
      if (playerNames.length > 0) {
        return playerNames.join(' / ')
      }
    }
    // Fallback sur le nom de l'équipe
    return equipe.name || 'Équipe ?'
  }
  const { showSuccess, showError } = useToast()
  const { confirm, ConfirmModal } = useConfirm()

  const [userPlan, setUserPlan] = useState('free')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)
  const [processingPayment, setProcessingPayment] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'preparation' | 'termine'>('all')
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)  // I7 FIX: Ref pour click-outside

  // I7 FIX: Fermer le menu profile au clic en dehors
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false)
      }
    }
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])

  useEffect(() => {
    if (organization?.settings?.plan && typeof organization.settings.plan === 'string') {
      setUserPlan(organization.settings.plan)
    }
  }, [organization])

  // Détecter le paramètre ?upgrade=true pour ouvrir automatiquement la modal de paiement
  useEffect(() => {
    const upgrade = searchParams.get('upgrade')
    if (upgrade === 'true' && user && !authLoading) {
      setShowUpgradeModal(true)
      // Nettoyer l'URL après ouverture de la modal
      router.replace('/dashboard', { scroll: false })
    }
  }, [searchParams, user, authLoading, router])

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
  const actionItems = tournois.reduce((actions: ActionItem[], tournoi) => {
    if (tournoi.status === 'preparation' && tournoi.nb_joueurs && tournoi.nb_joueurs % 2 !== 0) {
      actions.push({
        id: `odd-${tournoi.id}`,
        priority: 'high',
        title: 'Nombre impair',
        subtitle: tournoi.name,
        label: 'Corriger',
        labelColor: 'red',
        url: `/tournoi/${tournoi.id}`
      })
    }
    return actions
  }, [])

  // Filtrer les tournois - EXCLURE ceux en cours (deja affiches dans section separee)
  const filteredTournois = tournois.filter(tournoi => {
    // Exclure les tournois en cours car ils ont leur propre section
    if (tournoi.status === 'en_cours') return false
    const matchesSearch = searchQuery === '' ||
      tournoi.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tournoi.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleLogout = async () => {
    await signOut()
  }

  const handleUpgrade = async (productType: 'premium' | 'premium_bundle' = 'premium') => {
    if (!user?.id) return

    setProcessingPayment(true)
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          product: productType
        })
      })

      const { sessionId, url } = await response.json()

      if (url) {
        // Rediriger vers Stripe Checkout
        window.location.href = url
      }
    } catch (error) {
      console.error('Erreur lors de la création de la session:', error)
      showError('Une erreur est survenue. Veuillez réessayer.')
      setProcessingPayment(false)
    }
  }

  const handleManageSubscription = async () => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      })

      const { url, error } = await response.json()

      if (error) {
        showError(error)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du portail:', error)
      showError('Une erreur est survenue. Veuillez réessayer.')
    }
  }

  const handleDeleteTournament = async (tournoiId: number | string) => {
    const confirmed = await confirm({
      title: 'Supprimer le tournoi',
      message: 'Êtes-vous sûr de vouloir supprimer ce tournoi ? Cette action est irréversible.',
      confirmText: 'Supprimer',
      variant: 'danger'
    })

    if (!confirmed) return

    try {
      const response = await fetch(`/api/tournois/${tournoiId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        showSuccess('Tournoi supprimé avec succès')
        refetch()
      } else {
        showError('Erreur lors de la suppression du tournoi')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      showError('Une erreur est survenue')
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
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div
              onClick={() => router.push('/')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              {Icons.petanque}
              <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Pétanque Pro
              </span>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {loading && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-600 rounded-full text-xs">
                  <div className="w-3 h-3 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                  <span>Actualisation...</span>
                </div>
              )}
              <button
                onClick={() => router.push('/joueurs')}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                {Icons.users}
                <span className="text-sm hidden sm:inline">Joueurs</span>
              </button>
              <button
                onClick={() => router.push('/parametres')}
                className="hidden md:flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              >
                {Icons.settings}
                <span className="text-sm">Paramètres</span>
              </button>
              {/* I7 FIX: Ajout ref pour click-outside */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-xl transition"
                  aria-label="Menu profil"
                  aria-expanded={showProfileMenu}
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
                      {userPlan === 'premium' && !hasPackClub && (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false)
                            router.push('/pack-club')
                          }}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-md transition font-medium mb-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                          </svg>
                          <span>Pack Club - 9,99€</span>
                        </button>
                      )}
                      {userPlan === 'premium' && hasPackClub && (
                        <div className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 bg-blue-50 rounded-xl mb-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span>Pack Club actif</span>
                        </div>
                      )}
                      {userPlan === 'premium' && (
                        <button
                          onClick={handleManageSubscription}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span>Gerer mon abonnement</span>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
              {/* I3 FIX: Skeleton loaders pendant le chargement */}
              {loading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="p-4 rounded-xl animate-pulse">
                      <div className="flex items-baseline gap-2 mb-2">
                        <div className="h-10 w-16 bg-gray-200 rounded" />
                      </div>
                      <div className="h-4 w-24 bg-gray-200 rounded" />
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      document.getElementById('tournois-section')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="text-left hover:bg-gray-50 p-4 rounded-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-semibold text-gray-900">{stats.totalTournois}</span>
                      {stats.nouveauxTournois > 0 && (
                        <span className="text-sm font-medium text-green-600">+{stats.nouveauxTournois}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Tournois créés</p>
                  </button>

                  <button
                    onClick={() => router.push('/joueurs')}
                    className="text-left hover:bg-gray-50 p-4 rounded-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-semibold text-gray-900">{stats.totalJoueurs}</span>
                      {stats.nouveauxJoueurs > 0 && (
                        <span className="text-sm font-medium text-green-600">+{stats.nouveauxJoueurs}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Joueurs actifs</p>
                  </button>

                  <button
                    onClick={() => {
                      document.getElementById('recent-matches')?.scrollIntoView({ behavior: 'smooth' })
                    }}
                    className="text-left hover:bg-gray-50 p-4 rounded-xl transition-all cursor-pointer"
                  >
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-semibold text-gray-900">{stats.totalMatchs}</span>
                      {stats.nouveauxMatchs > 0 && (
                        <span className="text-sm font-medium text-green-600">+{stats.nouveauxMatchs}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">Matchs joués</p>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Publicité 1 - Uniquement pour les utilisateurs gratuits */}
          <div className="mb-16">
            <AdBanner
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
              <div className="space-y-3">
                {tournois
                  .filter(t => t.status === 'en_cours')
                  .map((tournoi) => (
                    <div
                      key={tournoi.id}
                      className="bg-gray-50 hover:bg-gray-100 rounded-2xl p-8 transition-all group"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <button
                          onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <h3 className="text-4xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">{tournoi.name}</h3>
                          <p className="text-xl text-gray-600 mb-2">{tournoi.format} · {tournoi.mode}</p>
                          <p className="text-lg text-gray-500">
                            {tournoi.nb_matchs_joues || 0}/{tournoi.nb_matchs_total || 0} matchs joués
                          </p>
                        </button>
                        <button
                          onClick={() => handleDeleteTournament(tournoi.id)}
                          className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Supprimer le tournoi"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Activité récente */}
          {recentMatches.length > 0 && (
            <div id="recent-matches" className="mb-16">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Activité récente</h2>
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="divide-y divide-gray-100">
                  {recentMatches.slice(0, 5).map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between px-8 py-5 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-gray-900 mb-1">
                          {getTeamDisplay(match.equipe_a)} vs {getTeamDisplay(match.equipe_b)}
                        </p>
                        <p className="text-sm text-gray-500">
                          Tour {match.tour} {match.terrain ? `· Terrain ${match.terrain}` : ''}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-gray-900 mb-1">
                          {match.score_a} - {match.score_b}
                        </p>
                        <p className="text-sm text-gray-500">
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
              userPlan={userPlan}
              showOnlyForFree={true}
            />
          </div>

          {/* Actions requises */}
          {actionItems.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                Actions requises
              </h2>
              <div className="space-y-3">
                {actionItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => router.push(item.url)}
                    className="w-full text-left bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl p-4 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-red-800">{item.title}</p>
                        <p className="text-sm text-red-600">{item.subtitle}</p>
                      </div>
                      <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full">
                        {item.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tournois */}
          <div id="tournois-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Tournois</h2>
              <div className="flex items-center gap-3">
                {/* Barre de recherche */}
                <div className="relative">
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent w-48"
                    aria-label="Rechercher un tournoi"
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {/* Filtres de statut */}
                <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
                  {(['all', 'preparation', 'termine'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-all ${
                        statusFilter === status
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {status === 'all' ? 'Tous' : status === 'preparation' ? 'Prep.' : 'Finis'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => router.push('/tournoi/nouveau')}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full hover:shadow-lg transition-all hover:scale-105 font-medium"
                >
                  Nouveau tournoi
                </button>
              </div>
            </div>

{filteredTournois.length === 0 ? (
              <div className="py-24 text-center bg-gray-50 rounded-2xl">
                <p className="text-gray-600">Aucun tournoi trouvé</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTournois.map((tournoi) => (
                  <div
                    key={tournoi.id}
                    className="bg-gray-50 hover:bg-gray-100 rounded-2xl p-8 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <button
                        onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <h3 className="text-4xl font-bold text-gray-900 mb-3 group-hover:text-green-600 transition-colors">{tournoi.name}</h3>
                        <p className="text-xl text-gray-600 mb-3">{tournoi.format} · {tournoi.mode}</p>
                        <div className="flex items-center gap-3 text-lg text-gray-500">
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-base font-medium ${
                            tournoi.status === 'en_cours' ? 'bg-green-100 text-green-800' :
                            tournoi.status === 'termine' ? 'bg-gray-200 text-gray-700' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {tournoi.status === 'en_cours' ? 'En cours' :
                             tournoi.status === 'termine' ? 'Terminé' :
                             'Préparation'}
                          </span>
                          {(tournoi.nb_matchs_total || 0) > 0 && (
                            <span>{tournoi.nb_matchs_joues || 0}/{tournoi.nb_matchs_total || 0} matchs</span>
                          )}
                        </div>
                      </button>
                      <button
                        onClick={() => handleDeleteTournament(tournoi.id)}
                        className="p-3 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Supprimer le tournoi"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal Upgrade */}
      {showUpgradeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Choisissez votre formule</h2>
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
            </div>

            {/* Contenu */}
            <div className="p-6 space-y-4">
              {/* Option Premium */}
              <div className="border-2 border-green-400 rounded-xl p-4 bg-green-50/50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900">Premium</h3>
                    <p className="text-sm text-gray-600">Sans publicite</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-green-600">19,99€</span>
                    <span className="text-gray-500 text-sm">/an</span>
                  </div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Experience sans pub
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Support prioritaire
                  </li>
                </ul>
                <button
                  onClick={() => handleUpgrade('premium')}
                  disabled={processingPayment}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Redirection...</span>
                    </>
                  ) : (
                    <span>Choisir Premium</span>
                  )}
                </button>
              </div>

              {/* Option Premium + Pack Club */}
              <div className="border-2 border-blue-400 rounded-xl p-4 bg-blue-50/50 relative">
                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-blue-600 text-white text-xs font-medium rounded-full">
                  Recommande pour les clubs
                </div>
                <div className="flex items-start justify-between mb-3 mt-1">
                  <div>
                    <h3 className="font-bold text-gray-900">Premium + Pack Club</h3>
                    <p className="text-sm text-gray-600">Sans pub + regles personnalisees</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-blue-600">29,98€</span>
                    <span className="text-gray-500 text-sm">/an</span>
                  </div>
                </div>
                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Tout Premium inclus
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Regles de tournoi personnalisees
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Presets de club illimites
                  </li>
                </ul>
                <button
                  onClick={() => handleUpgrade('premium_bundle')}
                  disabled={processingPayment}
                  className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processingPayment ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Redirection...</span>
                    </>
                  ) : (
                    <span>Choisir Pack Complet</span>
                  )}
                </button>
              </div>

              <p className="text-xs text-center text-gray-500">
                Paiement securise par Stripe - Abonnement annuel resiliable
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmation */}
      {ConfirmModal}
    </div>
  )
}
