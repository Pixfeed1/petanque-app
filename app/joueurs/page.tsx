'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import {
  FadeIn,
  PageHeader, SearchInput, PillToggle, EmptyState, PlayerAvatar
} from '@/components/ui'
import { Loader, Users } from '@/components/Icons'

interface Joueur {
  id: string
  name: string
  email?: string
  phone?: string
  gender?: 'H' | 'F'
  created_at?: string
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function JoueursPage() {
  const router = useRouter()
  const { organization } = useAuth()
  const [joueurs, setJoueurs] = useState<Joueur[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState<'all' | 'H' | 'F'>('all')

  const fetchJoueurs = useCallback(async () => {
    if (!organization?.id) return
    try {
      const response = await fetch(`/api/joueurs?org_id=${organization.id}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setJoueurs(Array.isArray(data) ? data : data.joueurs || [])
      }
    } catch (error) {
      console.error('Erreur chargement joueurs:', error)
    } finally {
      setLoading(false)
    }
  }, [organization?.id])

  useEffect(() => {
    fetchJoueurs()
  }, [fetchJoueurs])

  const filteredJoueurs = joueurs.filter(joueur => {
    const matchesSearch = searchQuery === '' ||
      joueur.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      joueur.email?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesGender = genderFilter === 'all' || joueur.gender === genderFilter
    return matchesSearch && matchesGender
  })

  const stats = {
    total: joueurs.length,
    hommes: joueurs.filter(j => j.gender === 'H').length,
    femmes: joueurs.filter(j => j.gender === 'F').length
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-petanque-sable-pale flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-7 h-7 animate-spin mx-auto text-petanque-vert" />
          <p className="mt-4 text-sm text-petanque-bois">Chargement des joueurs…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-petanque-sable-pale">
      <PageHeader
        backHref="/dashboard"
        backLabel="Tableau de bord"
        title="Joueurs"
        actions={
          <button
            onClick={() => router.push('/dashboard/joueurs')}
            className="text-xs font-medium text-petanque-vert hover:text-petanque-vert-fonce border border-petanque-sable-bord px-3 py-1.5 rounded-lg bg-white whitespace-nowrap"
          >
            Gérer mes joueurs
          </button>
        }
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <FadeIn>
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3 flex flex-wrap gap-x-3 gap-y-1">
            <span>Roster public</span>
            {organization?.name && (
              <>
                <span className="text-petanque-sable-bord">·</span>
                <span className="normal-case tracking-[0.06em]">{organization.name}</span>
              </>
            )}
            <span className="text-petanque-sable-bord">·</span>
            <span>{stats.total} {stats.total > 1 ? 'joueurs' : 'joueur'}</span>
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-12">
            Tous les <span className="accent-italic text-petanque-vert">joueurs.</span>
          </h1>
        </FadeIn>

        <FadeIn delay={80}>
          <div className="flex flex-wrap gap-x-10 gap-y-4 pb-8 mb-8 border-b border-petanque-sable-bord/50">
            <Stat label="Total" value={stats.total} />
            <Stat label="Hommes" value={stats.hommes} />
            <Stat label="Femmes" value={stats.femmes} />
          </div>
        </FadeIn>

        <FadeIn delay={140}>
          <div className="flex items-center gap-3 flex-wrap mb-5">
            <SearchInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Rechercher un joueur…"
            />
            <PillToggle<'all' | 'H' | 'F'>
              options={[
                { value: 'all', label: 'Tous' },
                { value: 'H', label: 'Hommes' },
                { value: 'F', label: 'Femmes' }
              ]}
              value={genderFilter}
              onChange={setGenderFilter}
            />
          </div>
        </FadeIn>

        <FadeIn delay={200}>
          {filteredJoueurs.length === 0 ? (
            stats.total === 0 ? (
              <EmptyState
                icon={<Users className="w-6 h-6" />}
                title="Aucun joueur"
                description="Le roster public sera disponible dès que des joueurs auront été ajoutés."
                cta={{ label: 'Gérer mes joueurs', onClick: () => router.push('/dashboard/joueurs') }}
              />
            ) : (
              <EmptyState
                icon={<Users className="w-6 h-6" />}
                title="Aucun joueur trouvé"
                description="Aucun joueur ne correspond à tes filtres. Essaie une autre recherche."
              />
            )
          ) : (
            <div className="divide-y divide-petanque-sable-bord/40">
              <div className="flex items-center gap-3 py-2 pl-1 text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em]">
                <span>{filteredJoueurs.length} {filteredJoueurs.length > 1 ? 'joueurs' : 'joueur'}</span>
                {filteredJoueurs.length !== joueurs.length && (
                  <>
                    <span className="text-petanque-sable-bord">·</span>
                    <span>sur {joueurs.length} au total</span>
                  </>
                )}
              </div>
              {filteredJoueurs.map((joueur) => (
                <button
                  key={joueur.id}
                  onClick={() => router.push(`/joueurs/${joueur.id}-${createSlug(joueur.name)}`)}
                  className="group w-full text-left flex items-center gap-4 py-4 px-1 hover:bg-petanque-sable/30 transition-colors"
                >
                  <PlayerAvatar name={joueur.name} size={40} />
                  <div className="flex-1 min-w-0">
                    <p className="text-base md:text-lg font-medium text-petanque-vert-fonce group-hover:text-petanque-vert transition-colors">
                      {joueur.name}
                    </p>
                    <div className="mt-1 text-xs text-petanque-bois flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="font-mono uppercase tracking-[0.14em]">
                        {joueur.gender === 'H' ? 'Homme' : joueur.gender === 'F' ? 'Femme' : 'Non spécifié'}
                      </span>
                      {joueur.email && (<><span className="text-petanque-sable-bord">·</span><span className="truncate">{joueur.email}</span></>)}
                      {joueur.phone && (<><span className="text-petanque-sable-bord">·</span><span>{joueur.phone}</span></>)}
                    </div>
                  </div>
                  <span className="text-lg text-petanque-bois group-hover:text-petanque-vert transition-colors flex-shrink-0">→</span>
                </button>
              ))}
            </div>
          )}
        </FadeIn>
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-1.5">{label}</p>
      <p className="font-mono text-2xl md:text-3xl font-medium leading-none text-petanque-vert-fonce">
        {value}
      </p>
    </div>
  )
}
