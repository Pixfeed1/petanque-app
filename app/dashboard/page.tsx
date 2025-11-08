// app/dashboard/page.tsx
// Dashboard moderne SaaS 2025 - Design minimaliste inspiré Linear/Vercel/Notion

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { loadStripe } from '@stripe/stripe-js'
import { useDashboardData } from './hooks/useDashboardData'

const stripePromise = typeof window !== 'undefined' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

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
    if (organization?.settings?.plan) {
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin" />
          <p className="text-sm text-neutral-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nouveau header moderne */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 z-50">
        <div className="h-full max-w-[1600px] mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-md bg-neutral-900 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
              </div>
              <span className="text-sm font-medium text-neutral-900">Pétanque</span>
            </button>

            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-100 rounded-md transition"
              >
                Dashboard
              </button>
              <button
                onClick={() => router.push('/tournoi/nouveau')}
                className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition"
              >
                Nouveau tournoi
              </button>
              <button
                onClick={() => router.push('/joueurs')}
                className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition"
              >
                Joueurs
              </button>
              <button
                onClick={() => router.push('/parametres')}
                className="px-3 py-1.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition"
              >
                Paramètres
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-neutral-100 rounded-md transition"
              >
                <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-neutral-200 rounded-lg shadow-xl">
                  <div className="p-3 border-b border-neutral-100">
                    <p className="text-xs font-medium text-neutral-900">{user?.email}</p>
                    <p className="text-xs text-neutral-500 mt-0.5">{organization?.name}</p>
                  </div>
                  <div className="p-1 border-t border-neutral-100">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-14">
        <div className="max-w-[1600px] mx-auto px-6 py-12">
          <div className="mb-16">
            <h1 className="text-5xl font-semibold text-neutral-900 tracking-tight mb-3">
              Dashboard
            </h1>
            <p className="text-lg text-neutral-600">
              Gérez vos tournois de pétanque en toute simplicité
            </p>
          </div>

          {/* Stats */}
          <div className="mb-16">
            <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Vue d'ensemble</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-semibold text-neutral-900">{stats.totalTournois}</span>
                  {stats.nouveauxTournois > 0 && (
                    <span className="text-sm font-medium text-emerald-600">+{stats.nouveauxTournois}</span>
                  )}
                </div>
                <p className="text-sm text-neutral-600">Tournois créés</p>
              </div>

              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-semibold text-neutral-900">{stats.totalJoueurs}</span>
                  {stats.nouveauxJoueurs > 0 && (
                    <span className="text-sm font-medium text-emerald-600">+{stats.nouveauxJoueurs}</span>
                  )}
                </div>
                <p className="text-sm text-neutral-600">Joueurs actifs</p>
              </div>

              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-semibold text-neutral-900">{stats.totalMatchs}</span>
                  {stats.nouveauxMatchs > 0 && (
                    <span className="text-sm font-medium text-emerald-600">+{stats.nouveauxMatchs}</span>
                  )}
                </div>
                <p className="text-sm text-neutral-600">Matchs joués</p>
              </div>
            </div>
          </div>

          {/* Tournois en cours */}
          {stats.tournoiEnCours > 0 && (
            <div className="mb-16">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="text-2xl font-semibold text-neutral-900">
                  {stats.tournoiEnCours} tournoi{stats.tournoiEnCours > 1 ? 's' : ''} en cours
                </h2>
              </div>
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <div className="divide-y divide-neutral-100">
                  {tournois
                    .filter(t => t.status === 'en_cours')
                    .map((tournoi) => (
                      <button
                        key={tournoi.id}
                        onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                        className="w-full flex items-center justify-between gap-4 px-6 py-4 hover:bg-neutral-50 transition text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-neutral-900">{tournoi.name}</h3>
                          <p className="text-xs text-neutral-500">{tournoi.format} · {tournoi.mode}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-neutral-500">
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
              <h2 className="text-2xl font-semibold text-neutral-900 mb-6">Activité récente</h2>
              <div className="border border-neutral-200 rounded-lg overflow-hidden">
                <div className="divide-y divide-neutral-100">
                  {recentMatches.slice(0, 5).map((match) => (
                    <div
                      key={match.id}
                      className="flex items-center justify-between px-6 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-900">
                          {match.equipe_a?.name || 'Équipe A'} vs {match.equipe_b?.name || 'Équipe B'}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Tour {match.tour} {match.terrain ? `· Terrain ${match.terrain}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-neutral-900">
                          {match.score_a} - {match.score_b}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {match.status === 'termine' ? 'Terminé' : 'En cours'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tournois */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-neutral-900">Tournois</h2>
              <button
                onClick={() => router.push('/tournoi/nouveau')}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium rounded-lg transition"
              >
                Nouveau tournoi
              </button>
            </div>

            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              {filteredTournois.length === 0 ? (
                <div className="py-24 text-center">
                  <p className="text-neutral-600">Aucun tournoi trouvé</p>
                </div>
              ) : (
                <div className="divide-y divide-neutral-100">
                  {filteredTournois.map((tournoi) => (
                    <button
                      key={tournoi.id}
                      onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                      className="w-full flex items-center gap-4 px-6 py-4 hover:bg-neutral-50 transition text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-neutral-900">{tournoi.name}</h3>
                        <p className="text-xs text-neutral-500">{tournoi.format}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
