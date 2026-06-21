// app/dashboard/page.tsx
// Dashboard Petanque Pro - Design system V4

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { useDashboardData } from './hooks/useDashboardData'
import { Users, Plus, Logout, Settings, Archive } from '@/components/Icons'
import { Button, Badge, Section, Stat, Boule, BouleSvg, useToast, useConfirm } from '@/components/ui'
import type { ActionItem } from '@/lib/types'

export default function Dashboard() {
  const router = useRouter()
  const { user, organization, loading: authLoading, signOut } = useAuth()
  const { loading, stats, tournois, recentMatches, refetch } = useDashboardData(
    organization?.id ? Number(organization.id) : undefined
  )
  const { showError } = useToast()
  const { confirm, ConfirmModal } = useConfirm()

  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'preparation' | 'termine'>('all')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return
      switch (e.key.toLowerCase()) {
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

  const actionItems = tournois.reduce((acc: ActionItem[], tournoi) => {
    if (
      tournoi.status === 'preparation' &&
      tournoi.nb_joueurs &&
      tournoi.nb_joueurs % 2 !== 0
    ) {
      acc.push({
        id: `odd-${tournoi.id}`,
        priority: 'high',
        title: 'Nombre impair',
        subtitle: tournoi.name,
        label: 'Corriger',
        labelColor: 'red',
        url: `/tournoi/${tournoi.id}`,
      })
    }
    return acc
  }, [])

  const tournoisEnCours = tournois.filter((t) => t.status === 'en_cours')

  const filteredTournois = tournois.filter((tournoi) => {
    if (tournoi.status === 'en_cours') return false
    const matchesSearch =
      searchQuery === '' || tournoi.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tournoi.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleLogout = async () => {
    await signOut()
  }

  const handleDeleteTournament = async (tournoiId: number | string) => {
    const confirmed = await confirm({
      title: 'Supprimer le tournoi',
      message:
        'Etes-vous sur de vouloir supprimer ce tournoi ? Cette action est irreversible.',
      confirmText: 'Supprimer',
      variant: 'danger',
    })
    if (!confirmed) return
    try {
      const response = await fetch(`/api/tournois/${tournoiId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (response.ok) refetch()
      else showError('Erreur lors de la suppression du tournoi')
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      showError('Une erreur est survenue')
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <BouleSvg size={48} variant="acier" stries spinning />
          <p className="text-sm text-petanque-bois">Chargement...</p>
        </div>
      </div>
    )
  }

  const firstName = user?.email?.split('@')[0] || 'champion'
  const totalActifs = (stats.tournoiEnCours || 0)
  const totalAVenir = filteredTournois.filter((t) => t.status === 'preparation').length

  return (
    <div className="min-h-screen bg-petanque-sable-pale">

      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-petanque-sable-bord/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">

            <div
              onClick={() => router.push('/')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <div className="relative flex-shrink-0">
                <BouleSvg size={28} variant="acier" stries className="group-hover:rotate-12 transition-transform duration-500" />
                <div className="absolute -bottom-0.5 -right-0.5">
                  <BouleSvg size={12} variant="vert" stries={false} />
                </div>
              </div>
              <span className="hidden sm:block text-base font-medium text-petanque-vert-fonce tracking-tight group-hover:text-petanque-vert transition-colors">
                Petanque Pro
              </span>
            </div>

            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-3 py-1.5 text-sm font-medium text-petanque-vert border-b-2 border-petanque-vert rounded-none"
              >
                Tableau de bord
              </button>
              <button
                onClick={() => router.push('/joueurs')}
                className="px-3 py-1.5 text-sm text-petanque-bois hover:text-petanque-vert-fonce transition-colors"
              >
                Joueurs
              </button>
              <button
                onClick={() => router.push('/dashboard/historique')}
                className="px-3 py-1.5 text-sm text-petanque-bois hover:text-petanque-vert-fonce transition-colors"
              >
                Historique
              </button>
            </nav>

            <div className="flex items-center gap-2">
              {loading && (
                <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-petanque-vert">
                  <span className="w-1.5 h-1.5 rounded-full bg-petanque-vert animate-pulse" />
                  Actualisation
                </span>
              )}
              <button
                onClick={() => router.push('/joueurs')}
                className="md:hidden p-2 text-petanque-bois hover:text-petanque-vert-fonce hover:bg-petanque-vert-pale/40 rounded-lg transition"
                aria-label="Joueurs"
              >
                <Users />
              </button>
              <button
                onClick={() => router.push('/parametres')}
                className="p-2 text-petanque-bois hover:text-petanque-vert-fonce hover:bg-petanque-vert-pale/40 rounded-lg transition"
                aria-label="Parametres"
              >
                <Settings />
              </button>

              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center justify-center w-9 h-9 rounded-full bg-petanque-vert text-petanque-sable text-sm font-medium hover:bg-petanque-vert-fonce transition-colors"
                >
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </button>

                {showProfileMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowProfileMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-petanque-sable-bord rounded-xl overflow-hidden z-20 shadow-[0_8px_24px_rgba(45,55,30,0.08)]">
                      <div className="p-4 bg-petanque-sable-pale border-b border-petanque-sable-bord/50">
                        <p className="text-sm font-medium text-petanque-vert-fonce truncate">
                          {user?.email}
                        </p>
                        <p className="text-xs text-petanque-bois mt-0.5">
                          {organization?.name}
                        </p>
                        {/* Gratuit pour tous : plus de badge de plan ni de CTA d'upgrade (Phase 2). */}
                      </div>
                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => {
                            setShowProfileMenu(false)
                            router.push('/dashboard/historique')
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-petanque-bois hover:text-petanque-vert-fonce hover:bg-petanque-sable-pale rounded-lg transition text-left"
                        >
                          <Archive className="w-4 h-4" />
                          Historique
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-petanque-bois hover:text-petanque-vert-fonce hover:bg-petanque-sable-pale rounded-lg transition text-left"
                        >
                          <Logout />
                          Deconnexion
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-16">
        <Section ambiance="interne" spacing="tight">

          <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-6 items-center mb-12">
            <div>
              <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-2">
                Bonjour {firstName}
              </p>
              <h1 className="text-3xl md:text-4xl font-medium text-petanque-vert-fonce tracking-tight leading-tight">
                {totalActifs > 0 ? (
                  <>
                    {totalActifs} tournoi{totalActifs > 1 ? 's' : ''} en cours
                    {totalAVenir > 0 && (
                      <>
                        ,<br className="hidden md:block" /> {totalAVenir} a venir.
                      </>
                    )}
                  </>
                ) : (
                  <>L'<span className="accent-italic">art</span> du tournoi, prêt a l'emploi.</>
                )}
              </h1>
            </div>
            <div className="hidden md:block">
              <Boule mode="3d" size={180} variant="acier" rotateSpeed={0.3} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 md:gap-12 mb-12 pb-12 border-b border-petanque-sable-bord/50">
            <button
              onClick={() => document.getElementById('tournois-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-left group"
            >
              <Stat
                label="Tournois crees"
                value={stats.totalTournois}
                size="lg"
              />
              {stats.nouveauxTournois > 0 && (
                <p className="text-xs font-medium text-petanque-vert mt-1">
                  +{stats.nouveauxTournois} ce mois
                </p>
              )}
            </button>
            <button
              onClick={() => router.push('/joueurs')}
              className="text-left group"
            >
              <Stat
                label="Joueurs actifs"
                value={stats.totalJoueurs}
                size="lg"
              />
              {stats.nouveauxJoueurs > 0 && (
                <p className="text-xs font-medium text-petanque-vert mt-1">
                  +{stats.nouveauxJoueurs} ce mois
                </p>
              )}
            </button>
            <button
              onClick={() => document.getElementById('recent-matches')?.scrollIntoView({ behavior: 'smooth' })}
              className="text-left group"
            >
              <Stat
                label="Matchs joues"
                value={stats.totalMatchs}
                size="lg"
              />
              {stats.nouveauxMatchs > 0 && (
                <p className="text-xs font-medium text-petanque-vert mt-1">
                  +{stats.nouveauxMatchs} ce mois
                </p>
              )}
            </button>
          </div>

          {actionItems.length > 0 && (
            <div className="mb-12">
              <h2 className="text-base font-medium text-petanque-vert-fonce mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-petanque-rouge animate-pulse" />
                Actions requises
              </h2>
              <div className="space-y-2">
                {actionItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => router.push(item.url)}
                    className="w-full text-left flex items-center justify-between gap-3 px-4 py-3 bg-white border border-petanque-rouge/30 border-l-4 border-l-petanque-rouge rounded-lg hover:bg-petanque-rouge/5 transition"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-petanque-vert-fonce">{item.title}</p>
                      <p className="text-xs text-petanque-bois truncate">{item.subtitle}</p>
                    </div>
                    <span className="text-xs font-medium text-petanque-rouge flex items-center gap-1 flex-shrink-0">
                      {item.label} →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {tournoisEnCours.length > 0 && (
            <div className="mb-12">
              <h2 className="text-base font-medium text-petanque-vert-fonce mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-petanque-vert animate-pulse" />
                En cours
              </h2>
              <div className="space-y-2">
                {tournoisEnCours.map((tournoi) => (
                  <div
                    key={tournoi.id}
                    className="group bg-white border border-petanque-sable-bord/60 border-l-4 border-l-petanque-vert rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-l-[6px]"
                  >
                    <div className="flex items-center justify-between gap-4 px-5 py-4">
                      <button
                        onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <h3 className="text-lg font-medium text-petanque-vert-fonce mb-1 group-hover:text-petanque-vert transition-colors">
                          {tournoi.name}
                        </h3>
                        <p className="text-xs text-petanque-bois mb-2 uppercase tracking-wider">
                          {tournoi.format} · {tournoi.mode}
                        </p>
                        <p className="text-sm font-mono text-petanque-bois">
                          {tournoi.nb_matchs_joues || 0}
                          <span className="opacity-50">/</span>
                          {tournoi.nb_matchs_total || 0} matchs
                        </p>
                      </button>
                      <Badge variant="success" withBoule={false}>En cours</Badge>
                      <button
                        onClick={() => handleDeleteTournament(tournoi.id)}
                        className="p-2 text-petanque-bois/50 hover:text-petanque-rouge hover:bg-petanque-rouge/5 rounded-lg transition"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentMatches.length > 0 && (
            <div id="recent-matches" className="mb-12">
              <h2 className="text-base font-medium text-petanque-vert-fonce mb-4">Activite recente</h2>
              <div className="divide-y divide-petanque-sable-bord/40">
                {recentMatches.slice(0, 5).map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between py-3 hover:bg-white/40 -mx-2 px-2 rounded-lg transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-petanque-vert-fonce">
                        <span className="font-medium">{match.equipe_a?.name || 'Equipe A'}</span>
                        <span className="text-petanque-bois mx-2">vs</span>
                        <span className="font-medium">{match.equipe_b?.name || 'Equipe B'}</span>
                      </p>
                      <p className="text-xs text-petanque-bois mt-0.5">
                        Tour {match.tour}{match.terrain ? ` · Terrain ${match.terrain}` : ''}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-mono text-base font-medium text-petanque-vert-fonce tabular-nums">
                        {match.score_a}<span className="opacity-30 mx-1">-</span>{match.score_b}
                      </p>
                      <p className="text-[11px] text-petanque-bois mt-0.5">
                        {match.status === 'termine' ? 'Termine' : 'En cours'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div id="tournois-section">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-medium text-petanque-vert-fonce">Tournois</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <input
                    id="search-input"
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-2 bg-white border border-petanque-sable-bord rounded-lg focus:ring-2 focus:ring-petanque-vert/40 focus:border-petanque-vert/40 outline-none w-44 text-sm"
                  />
                  <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-petanque-bois" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="flex gap-0.5 bg-white border border-petanque-sable-bord p-0.5 rounded-lg">
                  {(['all', 'preparation', 'termine'] as const).map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={`px-2.5 py-1 text-xs rounded transition-all ${
                        statusFilter === status
                          ? 'bg-petanque-vert text-petanque-sable'
                          : 'text-petanque-bois hover:text-petanque-vert-fonce'
                      }`}
                    >
                      {status === 'all' ? 'Tous' : status === 'preparation' ? 'Prep.' : 'Finis'}
                    </button>
                  ))}
                </div>
                <Button variant="primary" size="md" onClick={() => router.push('/tournoi/nouveau')}>
                  <Plus />
                  Nouveau
                </Button>
              </div>
            </div>

            {filteredTournois.length === 0 ? (
              <div className="py-16 text-center">
                <BouleSvg size={48} variant="acier" stries className="mx-auto mb-3 opacity-40" />
                <p className="text-sm text-petanque-bois">Aucun tournoi trouve</p>
                <button
                  onClick={() => router.push('/tournoi/nouveau')}
                  className="mt-3 text-sm text-petanque-vert hover:text-petanque-vert-fonce font-medium underline-offset-4 hover:underline"
                >
                  Creer mon premier tournoi
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTournois.map((tournoi) => {
                  const accentColor =
                    tournoi.status === 'termine'
                      ? 'border-l-petanque-bois/40'
                      : 'border-l-petanque-cochonnet'
                  return (
                    <div
                      key={tournoi.id}
                      className={`group bg-white border border-petanque-sable-bord/60 border-l-4 ${accentColor} rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:border-l-[6px]`}
                    >
                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <button
                          onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                          className="flex-1 min-w-0 text-left"
                        >
                          <h3 className="text-lg font-medium text-petanque-vert-fonce mb-1 group-hover:text-petanque-vert transition-colors">
                            {tournoi.name}
                          </h3>
                          <p className="text-xs text-petanque-bois uppercase tracking-wider mb-2">
                            {tournoi.format} · {tournoi.mode}
                          </p>
                          {(tournoi.nb_matchs_total || 0) > 0 && (
                            <p className="text-sm font-mono text-petanque-bois">
                              {tournoi.nb_matchs_joues || 0}
                              <span className="opacity-50">/</span>
                              {tournoi.nb_matchs_total || 0} matchs
                            </p>
                          )}
                        </button>
                        <Badge
                          variant={
                            tournoi.status === 'termine'
                              ? 'neutral'
                              : tournoi.status === 'en_cours'
                              ? 'success'
                              : 'warning'
                          }
                          withBoule={false}
                        >
                          {tournoi.status === 'en_cours'
                            ? 'En cours'
                            : tournoi.status === 'termine'
                            ? 'Termine'
                            : 'Preparation'}
                        </Badge>
                        <button
                          onClick={() => handleDeleteTournament(tournoi.id)}
                          className="p-2 text-petanque-bois/50 hover:text-petanque-rouge hover:bg-petanque-rouge/5 rounded-lg transition"
                          title="Supprimer"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Section>
      </main>

      {ConfirmModal}
    </div>
  )
}
