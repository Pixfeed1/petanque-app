// app/dashboard/page.tsx
// Dashboard moderne 2025 - Mobile-first, épuré

'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { useDashboardData } from './hooks/useDashboardData'

const Icons = {
  trophy: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
    </svg>
  ),
  target: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  check: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  plus: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  user: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  stats: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  book: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  home: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  settings: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const { user, organization, loading: authLoading, signOut } = useAuth()
  const { loading, stats, tournois, refetch } = useDashboardData(organization?.id ? Number(organization.id) : undefined)

  const [activeTab, setActiveTab] = useState('active')

  // Calculer stats manquantes
  const activeTournaments = useMemo(() =>
    tournois.filter(t => t.status !== 'termine'),
    [tournois]
  )

  const finishedTournaments = useMemo(() =>
    tournois.filter(t => t.status === 'termine').length,
    [tournois]
  )

  const todayMatches = stats.nouveauxMatchs || 0

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center">
        <div className="animate-pulse text-green-600" aria-label="Chargement">
          <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-amber-50 pb-20 lg:pb-0">
      {/* Header simple */}
      <header className="bg-white/80 backdrop-blur sticky top-0 z-40 px-4 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-700">Bonjour {user?.full_name?.split(' ')[0] || 'Organisateur'}</p>
              <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="text-green-600">
                {Icons.trophy}
              </div>
              <span className="text-sm font-semibold text-gray-900">{stats.totalTournois}</span>
            </div>
          </div>

          {/* Live bar */}
          {activeTournaments.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">
                {activeTournaments.length} tournoi{activeTournaments.length > 1 ? 's' : ''} en cours
              </span>
              {todayMatches > 0 && (
                <span className="text-xs text-green-600">• {todayMatches} matchs aujourd'hui</span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Layout mobile avec tabs */}
      <div className="lg:hidden">
        {/* Stats rapides - Horizontal scroll */}
        <div className="px-4 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
            <StatCard icon={Icons.target} label="Aujourd'hui" value={`${todayMatches} matchs`} color="from-green-500 to-emerald-600" />
            <StatCard icon={Icons.users} label="Joueurs" value={stats.totalJoueurs} color="from-green-400 to-green-500" />
            <StatCard icon={Icons.chart} label="En cours" value={activeTournaments.length} color="from-emerald-500 to-teal-600" />
            <StatCard icon={Icons.check} label="Terminés" value={finishedTournaments} color="from-amber-500 to-orange-600" />
          </div>
        </div>

        {/* Tabs simples */}
        <div className="px-4 mb-4">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition ${
                activeTab === 'active'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                  : 'bg-white text-gray-700'
              }`}
              aria-label={`Tournois actifs (${activeTournaments.length})`}
            >
              Actifs ({activeTournaments.length})
            </button>
            <button
              onClick={() => setActiveTab('actions')}
              className={`flex-1 py-3 px-4 rounded-xl font-medium transition ${
                activeTab === 'actions'
                  ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                  : 'bg-white text-gray-700'
              }`}
              aria-label="Actions rapides"
            >
              Actions rapides
            </button>
          </div>
        </div>

        {/* Contenu principal mobile */}
        <main className="px-4">
          {activeTab === 'active' ? (
            <div className="space-y-3">
              {activeTournaments.length > 0 ? (
                activeTournaments.map(tournoi => (
                  <TournamentCard
                    key={tournoi.id}
                    tournament={tournoi}
                    onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                  />
                ))
              ) : (
                <EmptyState onCreateNew={() => router.push('/tournoi/nouveau')} />
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <ActionButton
                icon={Icons.trophy}
                label="Nouveau tournoi"
                onClick={() => router.push('/tournoi/nouveau')}
              />
              <ActionButton
                icon={Icons.user}
                label="Gérer les joueurs"
                onClick={() => router.push('/joueurs')}
              />
              <ActionButton
                icon={Icons.stats}
                label="Voir les statistiques"
                onClick={() => router.push('/dashboard')}
              />
              <ActionButton
                icon={Icons.book}
                label="Quiz pétanque"
                onClick={() => router.push('/quizz')}
              />
            </div>
          )}
        </main>
      </div>

      {/* Layout desktop avec colonnes */}
      <div className="hidden lg:block max-w-7xl mx-auto px-6 py-6">
        {/* Stats en grid */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard icon={Icons.target} label="Aujourd'hui" value={`${todayMatches} matchs`} color="from-green-500 to-emerald-600" />
          <StatCard icon={Icons.users} label="Joueurs" value={stats.totalJoueurs} color="from-green-400 to-green-500" />
          <StatCard icon={Icons.chart} label="En cours" value={activeTournaments.length} color="from-emerald-500 to-teal-600" />
          <StatCard icon={Icons.check} label="Terminés" value={finishedTournaments} color="from-amber-500 to-orange-600" />
        </div>

        {/* Layout 2 colonnes: tournois + actions */}
        <div className="grid grid-cols-3 gap-6">
          {/* Colonne principale: tournois */}
          <div className="col-span-2">
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Tournois actifs</h2>
              <div className="space-y-3">
                {activeTournaments.length > 0 ? (
                  activeTournaments.map(tournoi => (
                    <TournamentCard
                      key={tournoi.id}
                      tournament={tournoi}
                      onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                    />
                  ))
                ) : (
                  <EmptyState onCreateNew={() => router.push('/tournoi/nouveau')} />
                )}
              </div>
            </div>
          </div>

          {/* Sidebar: actions rapides */}
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur rounded-2xl p-6 shadow-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Actions rapides</h3>
              <div className="space-y-3">
                <ActionButton
                  icon={Icons.trophy}
                  label="Nouveau tournoi"
                  onClick={() => router.push('/tournoi/nouveau')}
                />
                <ActionButton
                  icon={Icons.user}
                  label="Gérer les joueurs"
                  onClick={() => router.push('/joueurs')}
                />
                <ActionButton
                  icon={Icons.stats}
                  label="Voir les statistiques"
                  onClick={() => router.push('/dashboard')}
                />
                <ActionButton
                  icon={Icons.book}
                  label="Quiz pétanque"
                  onClick={() => router.push('/quizz')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Mobile - cachée sur desktop */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200" role="navigation" aria-label="Navigation principale">
        <div className="flex justify-around py-2">
          <NavButton
            icon={Icons.home}
            label="Accueil"
            active
            onClick={() => router.push('/dashboard')}
          />
          <NavButton
            icon={Icons.plus}
            label="Créer"
            primary
            onClick={() => router.push('/tournoi/nouveau')}
          />
          <NavButton
            icon={Icons.users}
            label="Joueurs"
            onClick={() => router.push('/joueurs')}
          />
          <NavButton
            icon={Icons.settings}
            label="Paramètres"
            onClick={() => router.push('/parametres')}
          />
        </div>
      </nav>
    </div>
  )
}

// Composants simplifiés
function StatCard({ icon, label, value, color }: any) {
  return (
    <div className={`flex-shrink-0 snap-start w-32 p-4 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg`}>
      <div className="mb-2">{icon}</div>
      <div className="text-xs opacity-90 font-medium">{label}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  )
}

function TournamentCard({ tournament, onClick }: any) {
  const progress = tournament.nb_matchs_total > 0
    ? Math.round((tournament.nb_matchs_joues / tournament.nb_matchs_total) * 100)
    : 0

  // Détections pour badges
  const hasOddPlayers = tournament.status === 'preparation' && tournament.nb_joueurs && tournament.nb_joueurs % 2 !== 0
  const isReady = tournament.status === 'preparation' && tournament.nb_joueurs && tournament.nb_joueurs >= 4 && tournament.nb_joueurs % 2 === 0
  const notEnoughPlayers = tournament.status === 'preparation' && (!tournament.nb_joueurs || tournament.nb_joueurs < 4)

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl p-4 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer animate-in fade-in slide-in-from-bottom-2 duration-300"
      role="button"
      tabIndex={0}
      aria-label={`Voir le tournoi ${tournament.name}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-gray-900">{tournament.name}</h3>
          <p className="text-sm text-gray-700">{tournament.format} • {tournament.nb_joueurs || 0} joueurs</p>
        </div>
        {tournament.status === 'en_cours' && (
          <div className="text-2xl font-bold text-green-600">{progress}%</div>
        )}
      </div>

      {/* Badges d'alerte */}
      {tournament.status === 'preparation' && (
        <div className="flex flex-wrap gap-2 mb-3">
          {hasOddPlayers && (
            <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold animate-pulse">
              ⚠️ Nombre impair
            </span>
          )}
          {isReady && (
            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
              ✅ Prêt à démarrer
            </span>
          )}
          {notEnoughPlayers && (
            <span className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">
              👥 Manque de joueurs
            </span>
          )}
        </div>
      )}

      {/* Progress bar pour tournois en cours */}
      {tournament.status === 'en_cours' && (
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progression: ${progress}%`}
          />
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${
          tournament.status === 'en_cours' ? 'text-green-600' :
          tournament.status === 'preparation' ? 'text-amber-600' :
          'text-gray-600'
        }`}>
          {tournament.status === 'en_cours' && '🎯 En cours'}
          {tournament.status === 'preparation' && '⏳ En préparation'}
          {tournament.status === 'termine' && '✅ Terminé'}
        </span>
        {tournament.status === 'en_cours' && tournament.nb_matchs_total > 0 && (
          <span className="text-gray-600">
            {tournament.nb_matchs_joues || 0}/{tournament.nb_matchs_total} matchs
          </span>
        )}
      </div>
    </div>
  )
}

function EmptyState({ onCreateNew }: any) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun tournoi actif</h3>
      <p className="text-gray-700 mb-6">Créez votre premier tournoi de pétanque</p>
      <button
        onClick={onCreateNew}
        className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-semibold shadow-lg active:scale-95 transition"
        aria-label="Créer un nouveau tournoi"
      >
        Créer un tournoi
      </button>
    </div>
  )
}

function ActionButton({ icon, label, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 bg-white rounded-2xl shadow-md active:scale-95 transition"
      aria-label={label}
    >
      <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center text-green-600">
        {icon}
      </div>
      <span className="font-semibold text-gray-900">{label}</span>
      <div className="text-gray-400 ml-auto">
        {Icons.arrow}
      </div>
    </button>
  )
}

function NavButton({ icon, label, active, primary, onClick }: any) {
  if (primary) {
    return (
      <button
        onClick={onClick}
        className="relative -mt-4"
        aria-label={label}
      >
        <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white shadow-lg active:scale-95 transition">
          {icon}
        </div>
      </button>
    )
  }

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 p-2"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
    >
      <div className={`${active ? 'text-green-600' : 'text-gray-400'}`}>
        {icon}
      </div>
      <span className={`text-xs ${active ? 'text-green-600 font-semibold' : 'text-gray-600'}`}>
        {label}
      </span>
    </button>
  )
}
