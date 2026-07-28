'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { AdminLayout } from '@/components/admin'
import { FadeIn, PillToggle } from '@/components/ui'
import { Loader } from '@/components/Icons'

const planLabels: Record<string, string> = {
  free: 'Gratuit',
  essentiel: 'Essentiel',
  club: 'Club'
}

const statusLabels: Record<string, string> = {
  preparation: 'En préparation',
  en_cours: 'En cours',
  termine: 'Terminé'
}

interface Stats {
  users: { total: number; today: number; thisWeek: number; thisMonth: number }
  tournois: { total: number; thisMonth: number; enCours: number; preparation: number }
  funnel: { crees: number; avecEquipes: number; avecMatchs: number; demarres: number; termines: number }
  funnelByMode: { mode: string; crees: number; avecEquipes: number; demarres: number }[]
  plans: { plan: string; count: number }[]
  recentUsers: any[]
  recentTournois: any[]
  topOrgs: any[]
}

const modeLabels: Record<string, string> = {
  choisi: 'Choisi',
  melee_fixe: 'Mêlée fixe',
  melee_tournante: 'Mêlée tournante'
}

type TabKey = 'users' | 'tournois' | 'orgs'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabKey>('users')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    } else if (user) {
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
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-7 h-7 animate-spin mx-auto text-petanque-vert" />
          <p className="mt-4 text-sm text-petanque-bois">Chargement…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3">
            Accès · refusé
          </p>
          <h1 className="text-3xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-6">
            <span className="accent-italic text-petanque-vert">{error}.</span>
          </h1>
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 bg-petanque-vert text-petanque-sable px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-petanque-vert-fonce transition-colors"
          >
            Retour au dashboard
          </button>
        </div>
      </div>
    )
  }

  if (!stats) return null

  const tabOptions: { value: TabKey; label: string }[] = [
    { value: 'users', label: 'Utilisateurs' },
    { value: 'tournois', label: 'Tournois' },
    { value: 'orgs', label: 'Organisations' }
  ]

  return (
    <AdminLayout activeTab="dashboard">
      <FadeIn>
        <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3">
          Administration · Pétanque Pro
        </p>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-3">
          Vue <span className="accent-italic text-petanque-vert">d'ensemble.</span>
        </h1>
        <p className="text-base text-petanque-bois leading-relaxed mb-12 max-w-2xl">
          Connecté en tant que {user?.email}. Tu peux suivre l'activité et modérer le contenu.
        </p>
      </FadeIn>

      <FadeIn delay={80}>
        <section className="pb-10 mb-10 border-b border-petanque-sable-bord/50">
          <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] mb-1.5">01</p>
          <h2 className="text-lg md:text-xl font-medium text-petanque-vert-fonce mb-5 tracking-tight">
            Chiffres clés
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-6">
            <StatInline label="Utilisateurs" value={stats.users.total} sub={'+' + stats.users.thisMonth + ' ce mois'} />
            <StatInline label="Inscrits aujourd'hui" value={stats.users.today} sub={'+' + stats.users.thisWeek + ' cette semaine'} />
            <StatInline label="Tournois total" value={stats.tournois.total} sub={stats.tournois.enCours + ' en cours'} />
            <StatInline label="Tournois ce mois" value={stats.tournois.thisMonth} sub={stats.tournois.preparation + ' en préparation'} />
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={120}>
        <section className="pb-10 mb-10 border-b border-petanque-sable-bord/50">
          <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] mb-1.5">02</p>
          <h2 className="text-lg md:text-xl font-medium text-petanque-vert-fonce mb-1.5 tracking-tight">
            Conversion <span className="accent-italic text-petanque-vert">— activation.</span>
          </h2>
          <p className="text-sm text-petanque-bois leading-relaxed mb-6 max-w-2xl">
            De la création au tournoi démarré. C'est ici qu'on voit où les organisateurs décrochent.
          </p>
          <FunnelRow funnel={stats.funnel} />

          {stats.funnelByMode.length > 0 && (
            <div className="mt-8">
              <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-4">
                Taux de démarrage par mode
              </p>
              <div className="flex flex-wrap gap-x-10 gap-y-5">
                {stats.funnelByMode.map((m) => {
                  const rate = m.crees > 0 ? Math.round((m.demarres / m.crees) * 100) : 0
                  return (
                    <div key={m.mode}>
                      <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-1.5">
                        {modeLabels[m.mode] || m.mode}
                      </p>
                      <p className="font-mono text-2xl md:text-3xl font-medium leading-none text-petanque-vert-fonce">
                        {rate}<span className="text-base text-petanque-bois">%</span>
                      </p>
                      <p className="text-xs text-petanque-bois mt-2">{m.demarres} démarré{m.demarres > 1 ? 's' : ''} / {m.crees} créé{m.crees > 1 ? 's' : ''}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </section>
      </FadeIn>

      <FadeIn delay={160}>
        <section className="pb-10 mb-10 border-b border-petanque-sable-bord/50">
          <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] mb-1.5">03</p>
          <h2 className="text-lg md:text-xl font-medium text-petanque-vert-fonce mb-5 tracking-tight">
            Répartition des plans
          </h2>
          <div className="flex flex-wrap gap-x-10 gap-y-4">
            {stats.plans.map((p) => (
              <div key={p.plan}>
                <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-1.5">
                  {planLabels[p.plan] || p.plan}
                </p>
                <p className="font-mono text-2xl md:text-3xl font-medium leading-none text-petanque-vert-fonce">
                  {p.count}
                </p>
              </div>
            ))}
          </div>
        </section>
      </FadeIn>

      <FadeIn delay={220}>
        <section>
          <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] mb-1.5">04</p>
          <h2 className="text-lg md:text-xl font-medium text-petanque-vert-fonce mb-5 tracking-tight">
            Activité récente
          </h2>

          <div className="mb-6">
            <PillToggle options={tabOptions} value={activeTab} onChange={setActiveTab} />
          </div>

          {activeTab === 'users' && <UsersTable users={stats.recentUsers} />}
          {activeTab === 'tournois' && <TournoisTable tournois={stats.recentTournois} />}
          {activeTab === 'orgs' && <OrgsTable orgs={stats.topOrgs} />}
        </section>
      </FadeIn>
    </AdminLayout>
  )
}

function FunnelRow({ funnel }: { funnel: Stats['funnel'] }) {
  const steps = [
    { label: 'Créés', value: funnel.crees },
    { label: 'Avec équipes', value: funnel.avecEquipes },
    { label: 'Avec matchs', value: funnel.avecMatchs },
    { label: 'Démarrés', value: funnel.demarres },
    { label: 'Terminés', value: funnel.termines },
  ]
  const base = funnel.crees || 1
  // Repérer la plus grosse chute entre deux étapes (en points de %) pour la souligner.
  let worstIdx = -1
  let worstDrop = 0
  for (let i = 1; i < steps.length; i++) {
    const drop = (steps[i - 1].value - steps[i].value) / base
    if (drop > worstDrop) { worstDrop = drop; worstIdx = i }
  }

  return (
    <div className="flex flex-wrap items-stretch gap-y-5">
      {steps.map((s, i) => {
        const pct = Math.round((s.value / base) * 100)
        const isWorst = i === worstIdx
        return (
          <div key={s.label} className="flex items-stretch">
            <div className="min-w-[92px]">
              <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-1.5">{s.label}</p>
              <p className="font-mono text-2xl md:text-3xl font-medium leading-none text-petanque-vert-fonce">{s.value}</p>
              <p className="text-xs text-petanque-bois mt-2">{pct}%</p>
            </div>
            {i < steps.length - 1 && (
              <div className="flex flex-col items-center justify-start px-3 md:px-4 pt-1">
                <span className={`font-mono text-sm leading-none ${isWorst ? 'text-petanque-cochonnet' : 'text-petanque-acier'}`}>→</span>
                {isWorst && worstDrop > 0 && (
                  <span className="font-mono text-[10px] text-petanque-cochonnet mt-1.5 whitespace-nowrap">−{Math.round(worstDrop * 100)}%</span>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StatInline({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-1.5">{label}</p>
      <p className="font-mono text-2xl md:text-3xl font-medium leading-none text-petanque-vert-fonce">{value}</p>
      <p className="text-xs text-petanque-bois mt-2">{sub}</p>
    </div>
  )
}

const thCls = "text-left px-4 py-3 font-mono text-[10px] text-petanque-bois uppercase tracking-[0.16em] font-medium"
const trCls = "border-b border-petanque-sable-bord/40 hover:bg-petanque-sable/40 transition-colors"

function UsersTable({ users }: { users: any[] }) {
  if (users.length === 0) {
    return <p className="text-sm text-petanque-bois italic py-8">Aucun utilisateur récent.</p>
  }
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-petanque-sable-bord">
            <th className={thCls}>Utilisateur</th>
            <th className={thCls}>Organisation</th>
            <th className={thCls}>Plan</th>
            <th className={thCls}>Tournois</th>
            <th className={thCls}>Inscrit le</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: any) => (
            <tr key={u.id} className={trCls}>
              <td className="px-4 py-3">
                <p className="font-medium text-petanque-vert-fonce">{u.full_name || '—'}</p>
                <p className="text-xs text-petanque-bois mt-0.5">{u.email}</p>
              </td>
              <td className="px-4 py-3 text-petanque-vert-fonce/80">{u.org_name || '—'}</td>
              <td className="px-4 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-petanque-vert font-medium">
                  {planLabels[u.plan] || 'Gratuit'}
                </span>
              </td>
              <td className="px-4 py-3 text-petanque-vert-fonce/80 font-mono text-xs">{u.nb_tournois || 0}</td>
              <td className="px-4 py-3 text-petanque-bois font-mono text-xs">{formatDate(u.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TournoisTable({ tournois }: { tournois: any[] }) {
  if (tournois.length === 0) {
    return <p className="text-sm text-petanque-bois italic py-8">Aucun tournoi récent.</p>
  }
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-petanque-sable-bord">
            <th className={thCls}>Tournoi</th>
            <th className={thCls}>Organisation</th>
            <th className={thCls}>Format</th>
            <th className={thCls}>Statut</th>
            <th className={thCls}>Équipes · Matchs</th>
            <th className={thCls}>Créé le</th>
          </tr>
        </thead>
        <tbody>
          {tournois.map((t: any) => (
            <tr key={t.id} className={trCls}>
              <td className="px-4 py-3">
                <p className="font-medium text-petanque-vert-fonce">{t.name}</p>
                <p className="text-xs text-petanque-bois mt-0.5">{t.created_by_email || '—'}</p>
              </td>
              <td className="px-4 py-3 text-petanque-vert-fonce/80">{t.org_name || '—'}</td>
              <td className="px-4 py-3 text-petanque-vert-fonce/80 font-mono text-xs">{t.format} · {t.mode}</td>
              <td className="px-4 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-petanque-vert font-medium">
                  {statusLabels[t.status] || t.status}
                </span>
              </td>
              <td className="px-4 py-3 text-petanque-vert-fonce/80 font-mono text-xs">
                {t.nb_equipes || 0} · {t.nb_matchs || 0}
              </td>
              <td className="px-4 py-3 text-petanque-bois font-mono text-xs">{formatDate(t.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function OrgsTable({ orgs }: { orgs: any[] }) {
  if (orgs.length === 0) {
    return <p className="text-sm text-petanque-bois italic py-8">Aucune organisation.</p>
  }
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-petanque-sable-bord">
            <th className={thCls}>Organisation</th>
            <th className={thCls}>Propriétaire</th>
            <th className={thCls}>Plan</th>
            <th className={thCls}>Tournois</th>
            <th className={thCls}>Créée le</th>
          </tr>
        </thead>
        <tbody>
          {orgs.map((o: any) => (
            <tr key={o.id} className={trCls}>
              <td className="px-4 py-3 font-medium text-petanque-vert-fonce">{o.name}</td>
              <td className="px-4 py-3 text-petanque-vert-fonce/80">{o.owner_email || '—'}</td>
              <td className="px-4 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-petanque-vert font-medium">
                  {planLabels[o.plan] || 'Gratuit'}
                </span>
              </td>
              <td className="px-4 py-3 text-petanque-vert-fonce font-mono text-base font-medium">{o.nb_tournois || 0}</td>
              <td className="px-4 py-3 text-petanque-bois font-mono text-xs">{formatDate(o.created_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
