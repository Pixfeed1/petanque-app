'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { FadeIn, BouleSvg } from '@/components/ui'
import { Loader, Trophy, Flag } from '@/components/Icons'
import type { PlayerProfile } from '@/lib/services/playerView'

// Espace joueur : les fiches liées à mon compte, mes tournois et mon prochain match.
export default function EspaceJoueur() {
  const router = useRouter()
  const { user, loading: authLoading, signOut } = useAuth()
  const [profiles, setProfiles] = useState<PlayerProfile[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user) { router.push('/login'); return }
    fetch('/api/me/player', { credentials: 'include' })
      .then(r => r.ok ? r.json() : { data: { profiles: [] } })
      .then(d => setProfiles((d?.data?.profiles ?? d?.profiles ?? []) as PlayerProfile[]))
      .catch(() => setProfiles([]))
      .finally(() => setLoading(false))
  }, [authLoading, user, router])

  const statusLabel = (s: string) =>
    s === 'termine' ? 'Terminé' : s === 'en_cours' ? 'En cours' : 'À venir'

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <Loader className="w-7 h-7 animate-spin text-petanque-vert" />
      </div>
    )
  }

  const hasProfiles = profiles && profiles.length > 0

  return (
    <div className="min-h-screen bg-petanque-sable-pale">
      <header className="border-b border-petanque-sable-bord/50 bg-white/70 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BouleSvg className="w-6 h-6" />
            <span className="font-medium text-petanque-vert-fonce">Mon espace joueur</span>
          </div>
          <button onClick={signOut} className="text-sm text-petanque-bois hover:text-petanque-vert-fonce">Déconnexion</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        <FadeIn>
          <h1 className="text-2xl md:text-3xl font-medium text-petanque-vert-fonce mb-1">Bonjour {user?.full_name || ''} 👋</h1>
          <p className="text-sm text-petanque-bois mb-8">Retrouve ici tes tournois et ton prochain match.</p>
        </FadeIn>

        {!hasProfiles ? (
          <FadeIn delay={100}>
            <div className="bg-white rounded-2xl border border-petanque-sable-bord/50 p-8 text-center">
              <BouleSvg className="w-12 h-12 mx-auto mb-4 opacity-60" />
              <p className="text-petanque-vert-fonce font-medium mb-2">Aucune fiche liée pour l&apos;instant</p>
              <p className="text-sm text-petanque-bois leading-relaxed">
                Demande à ton organisateur un <strong>lien d&apos;invitation</strong>, ou assure-toi qu&apos;il a
                bien mis <strong>ton email</strong> ({user?.email}) sur ta fiche : la liaison se fait alors automatiquement.
              </p>
            </div>
          </FadeIn>
        ) : (
          <div className="space-y-8">
            {profiles!.map((p) => (
              <FadeIn key={p.joueurId} delay={80}>
                <section>
                  <div className="flex items-baseline justify-between mb-3">
                    <h2 className="font-medium text-petanque-vert-fonce">{p.name}</h2>
                    <span className="text-xs text-petanque-bois">{p.clubName}</span>
                  </div>
                  {p.tournois.length === 0 ? (
                    <p className="text-sm text-petanque-bois bg-white rounded-xl border border-petanque-sable-bord/50 p-4">
                      Aucun tournoi en cours pour cette fiche.
                    </p>
                  ) : (
                    <ul className="space-y-3">
                      {p.tournois.map((t) => (
                        <li key={t.tournoiId} className="bg-white rounded-xl border border-petanque-sable-bord/50 p-4">
                          <div className="flex items-center justify-between gap-3 mb-2">
                            <span className="font-medium text-petanque-vert-fonce">{t.tournoiName}</span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                              t.status === 'en_cours' ? 'bg-petanque-vert-pale text-petanque-vert-fonce'
                              : t.status === 'termine' ? 'bg-petanque-sable-bord/30 text-petanque-bois'
                              : 'bg-amber-100 text-amber-700'
                            }`}>{statusLabel(t.status)}</span>
                          </div>
                          <p className="text-xs text-petanque-bois mb-3">Équipe : {t.teamName}</p>

                          {t.nextMatch ? (
                            <button
                              onClick={() => router.push(`/match/${t.nextMatch!.id}`)}
                              className="w-full flex items-center justify-between gap-3 bg-petanque-vert text-petanque-sable rounded-lg px-4 py-3 text-sm font-medium hover:bg-petanque-vert-fonce transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <Trophy className="w-4 h-4" />
                                {t.nextMatch.opponent ? `Contre ${t.nextMatch.opponent}` : 'Match à jouer'}
                              </span>
                              <span className="flex items-center gap-1 text-petanque-sable/90">
                                {t.nextMatch.terrain != null && (<><Flag className="w-3.5 h-3.5" /> Terrain {t.nextMatch.terrain}</>)}
                              </span>
                            </button>
                          ) : t.status !== 'termine' ? (
                            <p className="text-xs text-petanque-bois italic">En attente du prochain match…</p>
                          ) : (
                            <button
                              onClick={() => router.push(`/tournoi/${t.tournoiId}/podium`)}
                              className="text-sm text-petanque-vert hover:text-petanque-vert-fonce font-medium"
                            >
                              Voir le podium →
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </FadeIn>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
