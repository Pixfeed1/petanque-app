// app/joueurs/page.tsx
// Liste de tous les joueurs - Style cohérent avec l'app

'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    setMounted(true)
    if (organization?.id) {
      fetchJoueurs()
    }
  }, [organization])

  const fetchJoueurs = async () => {
    try {
      const response = await fetch(`/api/joueurs?org_id=${organization?.id}`, {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setJoueurs(data)
      }
    } catch (error) {
      console.error('Erreur chargement joueurs:', error)
    } finally {
      setLoading(false)
    }
  }

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
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
              <button
                onClick={() => router.push('/dashboard')}
                className="group flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all flex-shrink-0"
              >
                <span className="text-lg">←</span>
                <span className="hidden sm:inline font-medium">Retour</span>
              </button>

              <div className="hidden sm:block h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent flex-shrink-0"></div>

              <div className="flex items-center space-x-3 min-w-0">
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                    Joueurs
                  </h1>
                  <p className="hidden sm:block text-xs sm:text-sm text-gray-500 truncate">{organization?.name}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard/joueurs')}
              className="ml-2 sm:ml-4 flex-shrink-0 w-10 h-10 sm:w-auto sm:h-auto sm:px-6 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center sm:space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nouveau joueur</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 pt-20 pb-8">
        {/* Stats cards */}
        <div className={`grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 mb-6 sm:mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          {[
            { label: 'Total', value: stats.total, icon: <Users className="w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400" /> },
            { label: 'Hommes', value: stats.hommes, icon: <User className="w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400" /> },
            { label: 'Femmes', value: stats.femmes, icon: <User className="w-6 h-6 sm:w-10 sm:h-10 md:w-12 md:h-12 text-gray-400" /> }
          ].map((stat, index) => (
            <div
              key={index}
              className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-4 md:p-6 border border-gray-200"
            >
              <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-1 sm:gap-0">
                <div className="text-center sm:text-left w-full">
                  <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                </div>
                <div className="hidden sm:block">
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Barre de recherche et filtres */}
        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:gap-4">
          <div className="relative">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base bg-white border border-gray-200 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setGenderFilter('all')}
              className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-xs sm:text-sm ${
                genderFilter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setGenderFilter('H')}
              className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-xs sm:text-sm ${
                genderFilter === 'H'
                  ? 'bg-green-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Hommes
            </button>
            <button
              onClick={() => setGenderFilter('F')}
              className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all text-xs sm:text-sm ${
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
          <div className="space-y-2 sm:space-y-3">
            {filteredJoueurs.map((joueur, index) => (
              <div
                key={joueur.id}
                onClick={() => router.push(`/joueurs/${joueur.id}-${createSlug(joueur.name)}`)}
                className="group relative cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl sm:rounded-2xl transform rotate-0 group-hover:rotate-1 transition-transform"></div>
                <div className="relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-6 shadow-lg hover:shadow-2xl transition-all group-hover:-translate-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-gray-400 font-bold text-xl sm:text-2xl flex-shrink-0">
                        {joueur.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-0.5 sm:mb-1 group-hover:text-green-600 transition-colors truncate">
                          {joueur.name}
                        </h3>
                        <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <span className="text-gray-500 flex-shrink-0">
                            {joueur.gender === 'H' ? 'H' : joueur.gender === 'F' ? 'F' : '-'}
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
                      className="ml-2 sm:ml-4 p-2 sm:p-3 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg sm:rounded-xl transition-all flex-shrink-0"
                    >
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
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
