// app/dashboard/historique/page.tsx
// Page d'historique des tournois terminés (Plan Gratuit)

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../providers/AuthProvider'
import { Petanque, Trophy, Search, Back, Loader } from '@/components/Icons'

interface TournoiHistorique {
  id: string
  name: string
  format: string
  mode: string
  status: string
  settings: Record<string, unknown>
  created_at: string
  updated_at: string
  nb_joueurs: number
  nb_equipes: number
  nb_matchs_total: number
  nb_matchs_joues: number
  vainqueur: string | null
}

const formatLabels: Record<string, string> = {
  tete_a_tete: 'Tête à tête',
  doublette: 'Doublette',
  triplette: 'Triplette',
}

const modeLabels: Record<string, string> = {
  choisi: 'Équipes choisies',
  melee_fixe: 'Mêlée fixe',
  melee_tournante: 'Mêlée tournante',
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default function HistoriquePage() {
  const router = useRouter()
  const { user, organization, loading: authLoading } = useAuth()

  const [tournois, setTournois] = useState<TournoiHistorique[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [hasMore, setHasMore] = useState(false)
  const [offset, setOffset] = useState(0)
  const LIMIT = 20

  const loadHistorique = useCallback(async (reset = false) => {
    if (!organization?.id) return

    const currentOffset = reset ? 0 : offset
    try {
      setLoading(true)
      const params = new URLSearchParams({
        org_id: String(organization.id),
        limit: String(LIMIT),
        offset: String(currentOffset),
      })
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim())
      }

      const res = await fetch(`/api/tournois/historique?${params}`, {
        credentials: 'include',
      })

      if (res.ok) {
        const data: TournoiHistorique[] = await res.json()
        if (reset) {
          setTournois(data)
          setOffset(LIMIT)
        } else {
          setTournois(prev => [...prev, ...data])
          setOffset(currentOffset + LIMIT)
        }
        setHasMore(data.length === LIMIT)
      }
    } catch (error) {
      console.error('Erreur chargement historique:', error)
    } finally {
      setLoading(false)
    }
  }, [organization?.id, offset, searchQuery])

  useEffect(() => {
    if (organization?.id) {
      loadHistorique(true)
    }
  }, [organization?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Recherche avec debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (organization?.id) {
        setOffset(0)
        loadHistorique(true)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery]) // eslint-disable-line react-hooks/exhaustive-deps

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-green-600 animate-spin" />
          <p className="text-sm text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div
              onClick={() => router.push('/')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <Petanque className="w-10 h-10" />
              <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Pétanque Pro
              </span>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
            >
              <Back className="w-5 h-5" />
              <span className="text-sm">Dashboard</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Titre + recherche */}
          <div className="mb-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
              <div>
                <h1 className="text-5xl font-semibold text-gray-900 tracking-tight mb-3">
                  Historique
                </h1>
                <p className="text-lg text-gray-600">
                  Retrouvez tous vos tournois terminés
                </p>
              </div>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Rechercher un tournoi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent w-full sm:w-64"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Liste des tournois */}
          {!loading && tournois.length === 0 ? (
            <div className="py-24 text-center bg-gray-50 rounded-2xl">
              <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg mb-2">Aucun tournoi terminé</p>
              <p className="text-gray-400 text-sm">
                {searchQuery
                  ? 'Aucun résultat pour cette recherche'
                  : 'Vos tournois terminés apparaîtront ici'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {tournois.map((tournoi) => (
                <button
                  key={tournoi.id}
                  onClick={() => router.push(`/tournoi/${tournoi.id}`)}
                  className="w-full text-left bg-gray-50 hover:bg-gray-100 rounded-2xl p-6 sm:p-8 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors truncate">
                        {tournoi.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-3">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-200 text-gray-700 font-medium">
                          {formatLabels[tournoi.format] || tournoi.format}
                        </span>
                        <span className="text-gray-300">·</span>
                        <span>{modeLabels[tournoi.mode] || tournoi.mode}</span>
                        <span className="text-gray-300">·</span>
                        <span>{formatDate(tournoi.updated_at)}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <span>{tournoi.nb_joueurs} joueur{tournoi.nb_joueurs > 1 ? 's' : ''}</span>
                        <span>{tournoi.nb_equipes} équipe{tournoi.nb_equipes > 1 ? 's' : ''}</span>
                        <span>{tournoi.nb_matchs_joues} match{tournoi.nb_matchs_joues > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                    {tournoi.vainqueur && (
                      <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
                        <Trophy className="w-5 h-5 text-amber-500" />
                        <span className="text-sm font-semibold text-amber-800">
                          {tournoi.vainqueur}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}

              {/* Loader pendant chargement */}
              {loading && (
                <div className="py-8 flex justify-center">
                  <Loader className="w-6 h-6 text-green-600 animate-spin" />
                </div>
              )}

              {/* Bouton charger plus */}
              {hasMore && !loading && (
                <div className="pt-4 flex justify-center">
                  <button
                    onClick={() => loadHistorique(false)}
                    className="px-6 py-3 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-xl font-medium transition-all"
                  >
                    Charger plus de tournois
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
