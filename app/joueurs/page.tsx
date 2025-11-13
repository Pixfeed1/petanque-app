// app/joueurs/page.tsx
// Liste de tous les joueurs - Style cohérent avec l'app

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { Users, Plus, Search, Eye, Loader } from '@/components/Icons'

interface Joueur {
  id: string
  name: string
  email?: string
  phone?: string
  gender?: 'H' | 'F'
  created_at?: string
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="group flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl transition-all"
              >
                ← <span className="font-medium">Retour</span>
              </button>

              <div className="h-10 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>

              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Tous les Joueurs
                  </h1>
                  <p className="text-sm text-gray-500">{organization?.name}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Nouveau joueur</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-28 pb-8">
        {/* Stats cards */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          {[
            { label: 'Total joueurs', value: stats.total, icon: <Users className="w-6 h-6" />, gradient: 'from-blue-500 to-indigo-600', delay: '0ms' },
            { label: 'Hommes', value: stats.hommes, icon: <span className="text-2xl">👨</span>, gradient: 'from-blue-400 to-cyan-600', delay: '100ms' },
            { label: 'Femmes', value: stats.femmes, icon: <span className="text-2xl">👩</span>, gradient: 'from-pink-500 to-rose-600', delay: '200ms' }
          ].map((stat, index) => (
            <div
              key={index}
              className="group relative"
              style={{ animationDelay: stat.delay }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl transform rotate-1 group-hover:rotate-2 transition-transform"></div>
              <div className="relative bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all group-hover:-translate-y-1">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-2xl`}></div>
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-4xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-4 bg-gradient-to-br ${stat.gradient} rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                    {stat.icon}
                  </div>
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
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setGenderFilter('all')}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                genderFilter === 'all'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setGenderFilter('H')}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                genderFilter === 'H'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              👨 Hommes
            </button>
            <button
              onClick={() => setGenderFilter('F')}
              className={`px-4 py-3 rounded-xl font-medium transition-all ${
                genderFilter === 'F'
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              👩 Femmes
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
                onClick={() => router.push('/dashboard')}
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
                onClick={() => router.push(`/joueurs/${joueur.id}`)}
                className="group relative cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl transform rotate-0 group-hover:rotate-1 transition-transform"></div>
                <div className="relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all group-hover:-translate-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg ${
                        joueur.gender === 'H'
                          ? 'bg-gradient-to-br from-blue-500 to-indigo-600'
                          : 'bg-gradient-to-br from-pink-500 to-rose-600'
                      }`}>
                        {joueur.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-green-600 transition-colors">
                          {joueur.name}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg font-medium ${
                            joueur.gender === 'H'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-pink-50 text-pink-700'
                          }`}>
                            {joueur.gender === 'H' ? '👨 Homme' : '👩 Femme'}
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
                        router.push(`/joueurs/${joueur.id}`)
                      }}
                      className="ml-4 p-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all group-hover:scale-110"
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
