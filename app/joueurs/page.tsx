// app/joueurs/page.tsx
// Liste de tous les joueurs - Style cohérent avec l'app

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { User, Users, Plus, Search, Eye, Loader } from '@/components/Icons'

interface Joueur {
  id: string
  name: string
  email?: string
  phone?: string
  gender?: 'H' | 'F'
  created_at?: string
}

// Fonction pour créer un slug à partir d'un nom
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retire les accents
    .replace(/[^a-z0-9]+/g, '-') // Remplace les caractères spéciaux par des tirets
    .replace(/^-+|-+$/g, '') // Retire les tirets au début et à la fin
}

export default function JoueursPage() {
  const router = useRouter()
  const { user, organization } = useAuth()
  const [joueurs, setJoueurs] = useState<Joueur[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [genderFilter, setGenderFilter] = useState<'all' | 'H' | 'F'>('all')
  const [mounted, setMounted] = useState(false)

  const fetchJoueurs = useCallback(async () => {
    if (!organization?.id) return

    try {
      const response = await fetch(`/api/joueurs?org_id=${organization.id}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        // Support ancien format (array) et nouveau format (objet avec pagination)
        setJoueurs(Array.isArray(data) ? data : data.joueurs || [])
      }
    } catch (error) {
      console.error('Erreur chargement joueurs:', error)
    } finally {
      setLoading(false)
    }
  }, [organization?.id])

  useEffect(() => {
    setMounted(true)
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
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <button
                onClick={() => router.push('/dashboard')}
                className="group flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all flex-shrink-0"
              >
                ← <span className="font-medium hidden sm:inline">Retour</span>
              </button>

              <div className="hidden md:block h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent flex-shrink-0"></div>

              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="min-w-0">
                  <h1 className="text-sm sm:text-2xl font-bold text-gray-900 truncate">
                    <span className="hidden sm:inline">Tous les </span>Joueurs
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{organization?.name}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard/joueurs')}
              className="px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center space-x-1 sm:space-x-2 flex-shrink-0"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="text-sm sm:text-base"><span className="hidden sm:inline">Nouveau </span>joueur</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
        {/* Stats cards */}
        <div className={`grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          {[
            { label: 'Total joueurs', value: stats.total, icon: <Users className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" /> },
            { label: 'Hommes', value: stats.hommes, icon: <span className="text-4xl sm:text-5xl text-blue-400">♂</span> },
            { label: 'Femmes', value: stats.femmes, icon: <span className="text-4xl sm:text-5xl text-pink-400">♀</span> }
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-xl p-4 sm:p-6 border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Barre de recherche et filtres */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher un joueur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              aria-label="Rechercher un joueur"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setGenderFilter('all')}
              className={`px-3 sm:px-4 py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${
                genderFilter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setGenderFilter('H')}
              className={`px-3 sm:px-4 py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${
                genderFilter === 'H'
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Hommes
            </button>
            <button
              onClick={() => setGenderFilter('F')}
              className={`px-3 sm:px-4 py-3 rounded-xl font-medium transition-all text-sm sm:text-base ${
                genderFilter === 'F'
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Femmes
            </button>
          </div>
        </div>

        {/* Liste des joueurs */}
        {filteredJoueurs.length === 0 ? (
          <div className="py-24 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
              <Users className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {searchQuery || genderFilter !== 'all' ? 'Aucun résultat' : 'Aucun joueur'}
            </h3>
            <p className="text-gray-600 mb-8">
              {searchQuery || genderFilter !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Commencez par ajouter des joueurs'}
            </p>
            {!searchQuery && genderFilter === 'all' && (
              <button
                onClick={() => router.push('/dashboard/joueurs')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Ajouter un joueur
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredJoueurs.map((joueur, index) => (
              <div
                key={joueur.id}
                onClick={() => router.push(`/joueurs/${joueur.id}-${createSlug(joueur.name)}`)}
                className="group relative cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl transform rotate-0 group-hover:rotate-1 transition-transform"></div>
                <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all group-hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar avec symbole de genre */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl ${
                        joueur.gender === 'F'
                          ? 'bg-pink-100 text-pink-600'
                          : 'bg-blue-100 text-blue-600'
                      }`}>
                        {joueur.gender === 'F' ? '♀' : '♂'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                          {joueur.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="text-gray-500">
                            {joueur.gender === 'H' ? 'Homme' : joueur.gender === 'F' ? 'Femme' : 'Non spécifié'}
                          </span>
                          {joueur.email && (
                            <span className="hidden sm:inline truncate">{joueur.email}</span>
                          )}
                          {joueur.phone && (
                            <span className="hidden md:inline">{joueur.phone}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/joueurs/${joueur.id}-${createSlug(joueur.name)}`)
                      }}
                      className="ml-4 p-3 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Footer résumé */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-center text-sm text-gray-600">
                Affichage de <span className="font-bold text-gray-900">{filteredJoueurs.length}</span> joueur{filteredJoueurs.length > 1 ? 's' : ''}
                {filteredJoueurs.length !== joueurs.length && (
                  <> sur <span className="font-bold text-gray-900">{joueurs.length}</span> au total</>
                )}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
