// app/admin/page.tsx
// Tableau de bord administrateur

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'

interface AdminStats {
  users: { total: number; today: number; thisWeek: number; thisMonth: number }
  tournois: { total: number; enCours: number; preparation: number; termine: number; today: number; thisMonth: number }
  plans: { plan: string; count: number }[]
  recentUsers: any[]
  recentTournois: any[]
  topOrgs: any[]
}

const planLabels: Record<string, string> = {
  free: 'Gratuit',
  essentiel: 'Essentiel',
  club: 'Club',
  premium: 'Premium (legacy)',
}

const planColors: Record<string, string> = {
  free: 'bg-gray-100 text-gray-700',
  essentiel: 'bg-green-100 text-green-700',
  club: 'bg-amber-100 text-amber-700',
  premium: 'bg-purple-100 text-purple-700',
}

const statusColors: Record<string, string> = {
  preparation: 'bg-blue-100 text-blue-700',
  en_cours: 'bg-green-100 text-green-700',
  termine: 'bg-gray-100 text-gray-700',
}

const statusLabels: Record<string, string> = {
  preparation: 'Préparation',
  en_cours: 'En cours',
  termine: 'Terminé',
}

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'tournois' | 'orgs'>('overview')

  useEffect(() => {
    if (!authLoading && user) {
      fetchStats()
    }
  }, [authLoading, user])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/stats', { credentials: 'include' })
      if (!res.ok) {
        if (res.status === 403) {
          setError('Accès réservé aux administrateurs')
          return
        }
        throw new Error('Erreur serveur')
      }
      const data = await res.json()
      setStats(data)
    } catch (err) {
      setError('Impossible de charger les statistiques')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{error}</h1>
          <button onClick={() => router.push('/dashboard')} className="text-green-600 hover:underline">
            Retour au dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Administration</h1>
              <p className="text-sm text-gray-500">Connecté en tant que {user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => router.push('/admin/reviews')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
          >
            Modérer les avis
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Cards stats principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Utilisateurs"
            value={stats.users.total}
            sub={`+${stats.users.thisMonth} ce mois`}
            color="blue"
          />
          <StatCard
            label="Tournois"
            value={stats.tournois.total}
            sub={`${stats.tournois.enCours} en cours`}
            color="green"
          />
          <StatCard
            label="Inscrits aujourd'hui"
            value={stats.users.today}
            sub={`+${stats.users.thisWeek} cette semaine`}
            color="purple"
          />
          <StatCard
            label="Tournois ce mois"
            value={stats.tournois.thisMonth}
            sub={`${stats.tournois.preparation} en préparation`}
            color="amber"
          />
        </div>

        {/* Répartition des plans */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Répartition des plans</h2>
          <div className="flex flex-wrap gap-4">
            {stats.plans.map((p) => (
              <div key={p.plan} className="flex items-center gap-3 bg-gray-50 rounded-lg px-4 py-3">
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${planColors[p.plan] || 'bg-gray-100 text-gray-700'}`}>
                  {planLabels[p.plan] || p.plan}
                </span>
                <span className="text-2xl font-bold text-gray-900">{p.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
          {[
            { key: 'users', label: 'Utilisateurs récents' },
            { key: 'tournois', label: 'Tournois récents' },
            { key: 'orgs', label: 'Top organisations' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === tab.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {activeTab === 'users' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Utilisateur</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Organisation</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Tournois</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Inscrit le</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Dernière connexion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recentUsers.map((u: any) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{u.full_name || '—'}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{u.org_name || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${planColors[u.plan] || planColors.free}`}>
                          {planLabels[u.plan] || 'Gratuit'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{u.nb_tournois || 0}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                      <td className="px-4 py-3 text-gray-500">{u.last_login_at ? formatDate(u.last_login_at) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'tournois' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Tournoi</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Organisation</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Format</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Statut</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Équipes</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Matchs</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Créé par</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.recentTournois.map((t: any) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{t.name}</td>
                      <td className="px-4 py-3 text-gray-700">{t.org_name || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{t.format} / {t.mode}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[t.status] || 'bg-gray-100 text-gray-700'}`}>
                          {statusLabels[t.status] || t.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{t.nb_equipes || 0}</td>
                      <td className="px-4 py-3 text-gray-700">{t.nb_matchs || 0}</td>
                      <td className="px-4 py-3">
                        <p className="text-gray-700">{t.created_by_name || '—'}</p>
                        <p className="text-xs text-gray-500">{t.created_by_email}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'orgs' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Organisation</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Propriétaire</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Plan</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Tournois</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Créée le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.topOrgs.map((o: any) => (
                    <tr key={o.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{o.name}</td>
                      <td className="px-4 py-3 text-gray-700">{o.owner_email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${planColors[o.plan] || planColors.free}`}>
                          {planLabels[o.plan] || 'Gratuit'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-medium">{o.nb_tournois || 0}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  const colors: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    amber: 'from-amber-500 to-amber-600',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  )
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
