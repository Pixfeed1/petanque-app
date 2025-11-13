'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import type { Joueur } from '@/lib/types'
import { sanitizeRowForCSV } from '@/lib/sanitize'
import { Users, Plus, Search, Edit, Trash, Check, X, Email, Trophy, Sparkles, Download, Upload, Filter, Star, Loader, Phone } from '@/components/Icons'

// Icônes premium
const Icons = {
  users: <Users className="w-6 h-6" />,
  plus: <Plus className="w-5 h-5" />,
  search: <Search className="w-5 h-5" />,
  edit: <Edit className="w-5 h-5" />,
  trash: <Trash className="w-5 h-5" />,
  check: <Check className="w-5 h-5" />,
  x: <X className="w-5 h-5" />,
  mail: <Email className="w-5 h-5" />,
  phone: <Phone className="w-5 h-5" />,
  trophy: <Trophy className="w-5 h-5" />,
  sparkles: <Sparkles className="w-6 h-6" />,
  download: <Download className="w-5 h-5" />,
  upload: <Upload className="w-5 h-5" />,
  filter: <Filter className="w-5 h-5" />,
  star: <Star className="w-5 h-5" />,
  loader: <Loader className="animate-spin h-5 w-5" />
}

export default function PlayersManagementPage() {
  const router = useRouter()
  const { user, organization } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [players, setPlayers] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedGender, setSelectedGender] = useState<'all' | 'H' | 'F'>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    gender: 'H' as 'H' | 'F',
    email: '',
    phone: ''
  })
  const [stats, setStats] = useState({
    total: 0,
    hommes: 0,
    femmes: 0,
    actifs: 0
  })
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState<'delete' | 'export' | null>(null)

  useEffect(() => {
    setMounted(true)
    if (user && organization) {
      loadPlayers()
    }
  }, [user, organization])

  const loadPlayers = async () => {
    if (!organization) return

    try {
      // Charger les joueurs
      const response = await fetch(`/api/joueurs?org_id=${organization.id}`, {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Erreur chargement joueurs')
      let playersData: Joueur[] = await response.json()

      // Trier par nom côté client
      playersData = playersData.sort((a: Joueur, b: Joueur) => a.name.localeCompare(b.name))

      if (playersData) {
        setPlayers(playersData)

        // Calculer les stats
        setStats({
          total: playersData.length,
          hommes: playersData.filter(p => p.gender === 'H').length,
          femmes: playersData.filter(p => p.gender === 'F').length,
          actifs: playersData.filter(p =>
            (p as any).equipes_joueurs?.some((ej: any) =>
              ej.equipe?.tournoi?.status === 'en_cours'
            )
          ).length
        })
      }
    } catch (error) {
      console.error('Erreur chargement joueurs:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePlayer = async () => {
    if (!organization) return

    try {
      if (editingPlayer) {
        // Modifier
        const response = await fetch(`/api/joueurs/${editingPlayer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: formData.name,
            gender: formData.gender,
            email: formData.email || null,
            phone: formData.phone || null
          })
        })

        if (response.ok) {
          await loadPlayers()
          closeModal()
        } else {
          const error = await response.json()
          console.error('Erreur modification:', error)
          alert(error.error || 'Erreur lors de la modification')
        }
      } else {
        // Créer
        const response = await fetch('/api/joueurs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            org_id: organization.id,
            name: formData.name,
            gender: formData.gender,
            email: formData.email || null,
            phone: formData.phone || null
          })
        })

        if (response.ok) {
          await loadPlayers()
          closeModal()
        } else {
          const error = await response.json()
          console.error('Erreur création:', error)
          alert(error.error || 'Erreur lors de la création')
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde joueur:', error)
    }
  }

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce joueur ?')) return

    try {
      const response = await fetch(`/api/joueurs/${playerId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (response.ok) {
        await loadPlayers()
      } else {
        const error = await response.json()
        alert(error.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur suppression joueur:', error)
      alert('Erreur lors de la suppression du joueur')
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Supprimer ${selectedPlayers.length} joueur(s) ?`)) return

    try {
      for (const playerId of selectedPlayers) {
        const response = await fetch(`/api/joueurs/${playerId}`, {
          method: 'DELETE',
          credentials: 'include'
        })
        if (!response.ok) {
          const error = await response.json()
          console.error(`Erreur suppression ${playerId}:`, error)
        }
      }

      setSelectedPlayers([])
      await loadPlayers()
    } catch (error) {
      console.error('Erreur bulk delete:', error)
    }
  }

  const handleExport = () => {
    const dataToExport = selectedPlayers.length > 0
      ? players.filter(p => selectedPlayers.includes(p.id))
      : filteredPlayers

    const csv = [
      ['Nom', 'Genre', 'Email', 'Téléphone'].join(','),
      ...dataToExport.map(p =>
        // ✅ Sanitization pour prévenir CSV Formula Injection
        sanitizeRowForCSV([p.name, p.gender, p.email || '', p.phone || '']).join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'joueurs.csv'
    a.click()
  }

  const openModal = (player?: Joueur) => {
    if (player) {
      setEditingPlayer(player)
      setFormData({
        name: player.name,
        gender: player.gender ?? 'H',
        email: player.email || '',
        phone: player.phone || ''
      })
    } else {
      setEditingPlayer(null)
      setFormData({
        name: '',
        gender: 'H',
        email: '',
        phone: ''
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingPlayer(null)
    setFormData({
      name: '',
      gender: 'H',
      email: '',
      phone: ''
    })
  }

  const togglePlayerSelection = (playerId: string) => {
    setSelectedPlayers(prev =>
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    )
  }

  const selectAll = () => {
    if (selectedPlayers.length === filteredPlayers.length) {
      setSelectedPlayers([])
    } else {
      setSelectedPlayers(filteredPlayers.map(p => p.id))
    }
  }

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGender = selectedGender === 'all' || player.gender === selectedGender
    return matchesSearch && matchesGender
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-12 shadow-2xl">
              {Icons.loader}
              <p className="mt-4 text-lg font-medium text-gray-600">Chargement des joueurs...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      {/* Particules animées */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-300 to-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 right-40 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header glassmorphism */}
      <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-gray-200/50 shadow-sm">
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

              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="hidden sm:block p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl text-white shadow-lg flex-shrink-0">
                  {Icons.users}
                </div>
                <div className="min-w-0">
                  <h1 className="text-base sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent truncate">
                    Gestion Joueurs
                  </h1>
                  <p className="hidden sm:block text-xs sm:text-sm text-gray-500 truncate">Gérez vos participants</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
              <button
                onClick={handleExport}
                className="w-10 h-10 sm:w-auto sm:h-auto sm:px-4 sm:py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all flex items-center justify-center sm:space-x-2"
              >
                {Icons.download}
                <span className="hidden sm:inline">Exporter</span>
              </button>

              <button
                onClick={() => openModal()}
                className="w-10 h-10 sm:w-auto sm:h-auto sm:px-6 sm:py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center sm:space-x-2"
              >
                {Icons.plus}
                <span className="hidden sm:inline">Nouveau joueur</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats cards */}
        <div className={`grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          {[
            { label: 'Total joueurs', value: stats.total, icon: Icons.users, gradient: 'from-blue-500 to-indigo-600', delay: '0ms' },
            { label: 'Hommes', value: stats.hommes, icon: Icons.users, gradient: 'from-blue-400 to-cyan-600', delay: '100ms' },
            { label: 'Femmes', value: stats.femmes, icon: Icons.users, gradient: 'from-pink-500 to-rose-600', delay: '200ms' },
            { label: 'Actifs', value: stats.actifs, icon: Icons.star, gradient: 'from-green-500 to-emerald-600', delay: '300ms' }
          ].map((stat, index) => (
            <div
              key={index}
              className="group relative animate-slideUp"
              style={{ animationDelay: stat.delay }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl sm:rounded-2xl transform rotate-1 group-hover:rotate-2 transition-transform"></div>
              <div className="relative bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 shadow-xl hover:shadow-2xl transition-all group-hover:-translate-y-1">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5 rounded-xl sm:rounded-2xl`}></div>
                <div className="relative flex flex-col sm:flex-row items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="text-center sm:text-left w-full">
                    <p className="text-xs sm:text-sm text-gray-600 mb-0.5 sm:mb-1 truncate">{stat.label}</p>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`hidden sm:flex p-3 md:p-4 bg-gradient-to-br ${stat.gradient} rounded-xl md:rounded-2xl text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                {Icons.search}
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un joueur..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all"
              />
            </div>

            {/* Filtre par genre */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              {[
                { value: 'all', label: 'Tous' },
                { value: 'H', label: 'Hommes' },
                { value: 'F', label: 'Femmes' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setSelectedGender(option.value as any)}
                  className={`flex-1 px-6 py-2 rounded-lg font-medium transition-all ${
                    selectedGender === option.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Actions groupées */}
            {selectedPlayers.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 animate-slideIn">
                <span className="text-xs sm:text-sm text-gray-600">
                  {selectedPlayers.length} sélectionné(s)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkDelete}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-all"
                  >
                    Supprimer
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-all"
                  >
                    Exporter
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Liste des joueurs */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden">
          {/* Header du tableau */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 sm:space-x-4">
                <input
                  type="checkbox"
                  checked={selectedPlayers.length === filteredPlayers.length && filteredPlayers.length > 0}
                  onChange={selectAll}
                  className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-xs sm:text-sm text-gray-600">
                  {filteredPlayers.length} joueur(s)
                </span>
              </div>
            </div>
          </div>

          {/* Liste */}
          <div className="divide-y divide-gray-100">
            {filteredPlayers.length === 0 ? (
              <div className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4">
                  {Icons.users}
                </div>
                <p className="text-gray-500 text-lg mb-4">Aucun joueur trouvé</p>
                <button
                  onClick={() => openModal()}
                  className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all"
                >
                  Ajouter le premier joueur
                </button>
              </div>
            ) : (
              filteredPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={`group px-3 sm:px-4 md:px-6 py-3 sm:py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all animate-slideIn`}
                  style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                >
                  <div className="flex items-center justify-between gap-2 sm:gap-4">
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={selectedPlayers.includes(player.id)}
                        onChange={() => togglePlayerSelection(player.id)}
                        className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 rounded focus:ring-green-500 flex-shrink-0"
                      />

                      <div className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white font-bold text-sm sm:text-base md:text-lg shadow-lg bg-gradient-to-br ${
                        player.gender === 'H' ? 'from-blue-500 to-indigo-600' : 'from-pink-500 to-rose-600'
                      } group-hover:scale-110 transition-transform flex-shrink-0`}>
                        {player.name.charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-xs sm:text-sm md:text-base lg:text-lg group-hover:text-green-600 transition-colors truncate">
                          {player.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-4 text-xs text-gray-500">
                          <span className={`px-1 sm:px-1.5 md:px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                            player.gender === 'H'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-pink-100 text-pink-700'
                          }`}>
                            {player.gender === 'H' ? 'H' : 'F'}
                          </span>
                          {player.email && (
                            <span className="hidden md:flex items-center truncate">
                              {Icons.mail}
                              <span className="ml-1 truncate">{player.email}</span>
                            </span>
                          )}
                          {player.phone && (
                            <span className="hidden lg:flex items-center">
                              {Icons.phone}
                              <span className="ml-1">{player.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-3 flex-shrink-0">
                      {/* Tournois actifs */}
                      {(player as any).equipes_joueurs?.some((ej: any) => ej.equipe?.tournoi?.status === 'en_cours') && (
                        <div className="hidden md:flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {Icons.trophy}
                          <span className="ml-1">Actif</span>
                        </div>
                      )}

                      {/* Actions - toujours visibles */}
                      <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2">
                        <button
                          onClick={() => openModal(player)}
                          className="p-1 sm:p-1.5 md:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
                          title="Modifier"
                        >
                          {Icons.edit}
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player.id)}
                          className="p-1 sm:p-1.5 md:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                          title="Supprimer"
                        >
                          {Icons.trash}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Équipes du joueur */}
                  {player.equipes_joueurs && player.equipes_joueurs.length > 0 && (
                    <div className="mt-2 sm:mt-3 ml-6 sm:ml-16 flex flex-wrap gap-1.5 sm:gap-2">
                      {player.equipes_joueurs.map((ej: any, i: number) => (
                        <span
                          key={i}
                          className="px-2 sm:px-3 py-0.5 sm:py-1 bg-gray-100 text-gray-700 rounded-lg text-xs"
                        >
                          {ej.equipe?.name} • {ej.equipe?.tournoi?.name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal ajout/modification */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center">
                {Icons.users}
                <span className="ml-3">
                  {editingPlayer ? 'Modifier le joueur' : 'Nouveau joueur'}
                </span>
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                  placeholder="Jean Dupont"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Genre *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'H', label: 'Homme', gradient: 'from-blue-500 to-indigo-600' },
                    { value: 'F', label: 'Femme', gradient: 'from-pink-500 to-rose-600' }
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => setFormData({...formData, gender: option.value as 'H' | 'F'})}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        formData.gender === option.value
                          ? `border-transparent bg-gradient-to-r ${option.gradient} text-white shadow-lg`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optionnel)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    {Icons.mail}
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    placeholder="jean@exemple.fr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone (optionnel)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    {Icons.phone}
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                    placeholder="06 12 34 56 78"
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 flex justify-end space-x-3">
              <button
                onClick={closeModal}
                className="px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleSavePlayer}
                disabled={!formData.name}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all disabled:opacity-50"
              >
                {editingPlayer ? 'Modifier' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-slideUp {
          animation: slideUp 0.6s ease-out both;
        }
        
        .animate-slideIn {
          animation: slideIn 0.4s ease-out both;
        }
      `}</style>
    </div>
  )
}