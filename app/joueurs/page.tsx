// app/joueurs/page.tsx
// Liste de tous les joueurs de l'organisation

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { Users, Plus, Search, Filter, Eye, Edit, Trash, Loader, ArrowLeft } from '@/components/Icons'

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

  useEffect(() => {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-green-600 animate-spin" />
          <p className="text-sm text-gray-600">Chargement des joueurs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Joueurs</h1>
                  <p className="text-sm text-gray-500">{organization?.name}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nouveau joueur</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total joueurs</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.total}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hommes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.hommes}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <span className="text-2xl">👨</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Femmes</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.femmes}</p>
              </div>
              <div className="p-3 bg-pink-100 rounded-lg">
                <span className="text-2xl">👩</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un joueur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            {/* Filtre genre */}
            <div className="flex gap-2">
              <button
                onClick={() => setGenderFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  genderFilter === 'all'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous
              </button>
              <button
                onClick={() => setGenderFilter('H')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  genderFilter === 'H'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👨 Hommes
              </button>
              <button
                onClick={() => setGenderFilter('F')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  genderFilter === 'F'
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                👩 Femmes
              </button>
            </div>
          </div>
        </div>

        {/* Liste des joueurs */}
        {filteredJoueurs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchQuery || genderFilter !== 'all' ? 'Aucun résultat' : 'Aucun joueur'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || genderFilter !== 'all'
                ? 'Essayez de modifier vos filtres'
                : 'Commencez par ajouter des joueurs à votre organisation'}
            </p>
            {!searchQuery && genderFilter === 'all' && (
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Ajouter un joueur
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nom
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Genre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Téléphone
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredJoueurs.map((joueur) => (
                    <tr
                      key={joueur.id}
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => router.push(`/joueurs/${joueur.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            joueur.gender === 'H' ? 'bg-blue-500' : 'bg-pink-500'
                          }`}>
                            {joueur.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{joueur.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          joueur.gender === 'H'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-pink-100 text-pink-800'
                        }`}>
                          {joueur.gender === 'H' ? '👨 Homme' : '👩 Femme'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {joueur.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {joueur.phone || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/joueurs/${joueur.id}`)
                          }}
                          className="text-green-600 hover:text-green-900 transition-colors"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Affichage de <span className="font-medium">{filteredJoueurs.length}</span> joueur{filteredJoueurs.length > 1 ? 's' : ''}
                {filteredJoueurs.length !== joueurs.length && (
                  <> sur <span className="font-medium">{joueurs.length}</span> au total</>
                )}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
