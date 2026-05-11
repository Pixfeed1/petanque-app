'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import {
  FadeIn,
  PageHeader, PlayerAvatar
} from '@/components/ui'
import { Loader } from '@/components/Icons'

interface JoueurDetail {
  id: string
  name: string
  email?: string
  phone?: string
  gender?: 'H' | 'F'
  created_at?: string
  stats?: {
    tournois?: number
    victoires?: number
    taux?: number
  }
}

export default function JoueurDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { organization } = useAuth()
  const [loading, setLoading] = useState(true)
  const [joueur, setJoueur] = useState<JoueurDetail | null>(null)

  const joueurId = params?.id ? String(params.id).split('-')[0] : null

  const fetchJoueur = useCallback(async () => {
    if (!joueurId) return
    try {
      const response = await fetch('/api/joueurs/' + joueurId, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setJoueur(data)
      } else {
        router.push('/joueurs')
      }
    } catch (error) {
      console.error('Erreur chargement joueur:', error)
      router.push('/joueurs')
    } finally {
      setLoading(false)
    }
  }, [joueurId, router])

  useEffect(() => {
    if (joueurId && organization?.id) {
      fetchJoueur()
    }
  }, [joueurId, organization?.id, fetchJoueur])

  if (loading) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-7 h-7 animate-spin mx-auto text-petanque-vert" />
          <p className="mt-4 text-sm text-petanque-bois">Chargement du profil…</p>
        </div>
      </div>
    )
  }

  if (!joueur) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center">
          <p className="text-base text-petanque-vert-fonce mb-4">Joueur introuvable.</p>
          <button onClick={() => router.push('/joueurs')} className="text-sm font-medium text-petanque-vert hover:text-petanque-vert-fonce border border-petanque-sable-bord bg-white px-5 py-2.5 rounded-lg">
            Retour à la liste
          </button>
        </div>
      </div>
    )
  }

  const nameParts = joueur.name.trim().split(/\s+/)
  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : ''
  const lastName = nameParts[nameParts.length - 1]

  const tournois = joueur.stats?.tournois || 0
  const victoires = joueur.stats?.victoires || 0
  const taux = joueur.stats?.taux || 0

  const mailtoHref = joueur.email ? 'mailto:' + joueur.email : ''
  const telHref = joueur.phone ? 'tel:' + joueur.phone : ''

  return (
    <div className="min-h-screen bg-petanque-sable-pale">
      <PageHeader
        backHref="/joueurs"
        backLabel="Tous les joueurs"
        title="Joueur"
        actions={
          <button onClick={() => router.push('/dashboard/joueurs')} className="text-xs font-medium text-petanque-vert hover:text-petanque-vert-fonce border border-petanque-sable-bord px-3 py-1.5 rounded-lg bg-white whitespace-nowrap">
            Gérer mes joueurs
          </button>
        }
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <FadeIn>
          <div className="flex flex-col sm:flex-row gap-6 sm:gap-7 items-start sm:items-center pb-9 mb-9 border-b border-petanque-sable-bord/50">
            <PlayerAvatar name={joueur.name} size={84} />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3 flex flex-wrap gap-x-2 gap-y-1">
                <span>Profil joueur</span>
                {joueur.gender && (
                  <>
                    <span className="text-petanque-sable-bord">·</span>
                    <span>{joueur.gender === 'H' ? 'Homme' : 'Femme'}</span>
                  </>
                )}
                {joueur.created_at && (
                  <>
                    <span className="text-petanque-sable-bord">·</span>
                    <span className="normal-case tracking-[0.06em]">
                      Membre depuis {new Date(joueur.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
                    </span>
                  </>
                )}
              </p>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05]">
                {firstName ? <span>{firstName} </span> : null}
                <span className="accent-italic text-petanque-vert">{lastName}.</span>
              </h1>
            </div>
          </div>
        </FadeIn>

        {(joueur.email || joueur.phone) && (
          <FadeIn delay={80}>
            <section className="pb-9 mb-9 border-b border-petanque-sable-bord/50">
              <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-4">Contact</p>
              <div className="divide-y divide-petanque-sable-bord/40">
                {joueur.email && (
                  <div className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span className="text-petanque-bois flex-shrink-0">Email</span>
                    <a href={mailtoHref} className="font-medium text-petanque-vert hover:text-petanque-vert-fonce transition-colors truncate">{joueur.email}</a>
                  </div>
                )}
                {joueur.phone && (
                  <div className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span className="text-petanque-bois flex-shrink-0">Téléphone</span>
                    <a href={telHref} className="font-medium text-petanque-vert hover:text-petanque-vert-fonce transition-colors">{joueur.phone}</a>
                  </div>
                )}
              </div>
            </section>
          </FadeIn>
        )}

        <FadeIn delay={140}>
          <section>
            <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-5">Statistiques</p>
            <div className="flex flex-wrap gap-x-10 gap-y-5 mb-6">
              <StatBlock label="Tournois joués" value={tournois + ''} />
              <StatBlock label="Victoires" value={victoires + ''} highlight={victoires > 0} />
              <StatBlock label="Taux de victoire" value={taux + '%'} />
            </div>
            {tournois === 0 && (
              <div className="px-4 py-3 bg-petanque-sable/60 border border-petanque-sable-bord/40 rounded-lg text-xs text-petanque-bois italic">
                Les statistiques apparaîtront après participation à des tournois.
              </div>
            )}
          </section>
        </FadeIn>
      </main>
    </div>
  )
}

function StatBlock({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-1.5">{label}</p>
      <p className={'font-mono text-2xl md:text-3xl font-medium leading-none ' + (highlight ? 'text-petanque-vert' : 'text-petanque-vert-fonce')}>
        {value}
      </p>
    </div>
  )
}
