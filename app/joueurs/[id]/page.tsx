'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

// Icônes premium
const Icons = {
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  plus: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  search: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  edit: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  trash: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  mail: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  phone: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  ),
  trophy: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v6m-3 0h6m4-13V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1H11a1 1 0 00-1 1v1.5a.5.5 0 01-.5.5H7a2 2 0 00-2 2v1c0 3.5 2.5 6 5.5 6.5m9 0c3-0.5 5.5-3 5.5-6.5V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1h-2" />
    </svg>
  ),
  sparkles: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  download: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  upload: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
  ),
  filter: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  star: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  loader: (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  )
}

export default function PlayersManagementPage() {
  const router = useRouter()
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
    loadPlayers()
  }, [])

  const loadPlayers = async () => {
    try {
      // Récupérer l'organisation de l'utilisateur
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('org_id')
        .eq('user_id', user.id)
        .single()

      if (!userRole) return

      // Charger les joueurs
      const { data: playersData } = await supabase
        .from('joueurs')
        .select(`
          *,
          equipes_joueurs(
            equipe:equipes(
              name,
              tournoi:tournois(name, status)
            )
          )
        `)
        .eq('org_id', userRole.org_id)
        .order('name')

      if (playersData) {
        setPlayers(playersData)
        
        // Calculer les stats
        setStats({
          total: playersData.length,
          hommes: playersData.filter(p => p.gender === 'H').length,
          femmes: playersData.filter(p => p.gender === 'F').length,
          actifs: playersData.filter(p => 
            p.equipes_joueurs?.some((ej>: Record<string, unknown>) => 
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
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('org_id')
        .eq('user_id', user!.id)
        .single()

      if (editingPlayer) {
        // Modifier
        const { error } = await supabase
          .from('joueurs')
          .update({
            name: formData.name,
            gender: formData.gender,
            email: formData.email || null,
            phone: formData.phone || null
          })
          .eq('id', editingPlayer.id)

        if (!error) {
          await loadPlayers()
          closeModal()
        }
      } else {
        // Créer
        const { error } = await supabase
          .from('joueurs')
          .insert({
            org_id: userRole!.org_id,
            name: formData.name,
            gender: formData.gender,
            email: formData.email || null,
            phone: formData.phone || null
          })

        if (!error) {
          await loadPlayers()
          closeModal()
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde joueur:', error)
    }
  }

  const handleDeletePlayer = async (playerId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce joueur ?')) return

    const { error } = await supabase
      .from('joueurs')
      .delete()
      .eq('id', playerId)

    if (!error) {
      await loadPlayers()
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Supprimer ${selectedPlayers.length} joueur(s) ?`)) return

    for (const playerId of selectedPlayers) {
      await supabase.from('joueurs').delete().eq('id', playerId)
    }

    setSelectedPlayers([])
    await loadPlayers()
  }

  const handleExport = () => {
    const dataToExport = selectedPlayers.length > 0 
      ? players.filter(p => selectedPlayers.includes(p.id))
      : filteredPlayers

    const csv = [
      ['Nom', 'Genre', 'Email', 'Téléphone'].join(','),
      ...dataToExport.map(p => 
        [p.name, p.gender, p.email || '', p.phone || ''].join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'joueurs.csv'
    a.click()
  }

  const openModal = (player?>: Record<string, unknown>) => {
    if (player) {
      setEditingPlayer(player)
      setFormData({
        name: player.name,
        gender: player.gender,
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
                  {Icons.users}
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                    Gestion des Joueurs
                  </h1>
                  <p className="text-sm text-gray-500">Gérez vos participants</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleExport}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all flex items-center space-x-2"
              >
                {Icons.download}
                <span>Exporter</span>
              </button>
              
              <button
                onClick={() => openModal()}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center space-x-2"
              >
                {Icons.plus}
                <span>Nouveau joueur</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats cards */}
        <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
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
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
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
              <div className="flex items-center space-x-2 animate-slideIn">
                <span className="text-sm text-gray-600">
                  {selectedPlayers.length} sélectionné(s)
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                >
                  Supprimer
                </button>
                <button
                  onClick={handleExport}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
                >
                  Exporter
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Liste des joueurs */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header du tableau */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <input
                  type="checkbox"
                  checked={selectedPlayers.length === filteredPlayers.length && filteredPlayers.length > 0}
                  onChange={selectAll}
                  className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                />
                <span className="text-sm text-gray-600">
                  {filteredPlayers.length} joueur(s) trouvé(s)
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
                  className={`group px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all animate-slideIn`}
                  style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <input
                        type="checkbox"
                        checked={selectedPlayers.includes(player.id)}
                        onChange={() => togglePlayerSelection(player.id)}
                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                      />
                      
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg bg-gradient-to-br ${
                        player.gender === 'H' ? 'from-blue-500 to-indigo-600' : 'from-pink-500 to-rose-600'
                      } group-hover:scale-110 transition-transform`}>
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg group-hover:text-green-600 transition-colors">
                          {player.name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            player.gender === 'H' 
                              ? 'bg-blue-100 text-blue-700' 
                              : 'bg-pink-100 text-pink-700'
                          }`}>
                            {player.gender === 'H' ? 'Homme' : 'Femme'}
                          </span>
                          {player.email && (
                            <span className="flex items-center">
                              {Icons.mail}
                              <span className="ml-1">{player.email}</span>
                            </span>
                          )}
                          {player.phone && (
                            <span className="flex items-center">
                              {Icons.phone}
                              <span className="ml-1">{player.phone}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Tournois actifs */}
                      {player.equipes_joueurs?.some((ej>: Record<string, unknown>) => ej.equipe?.tournoi?.status === 'en_cours') && (
                        <div className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          {Icons.trophy}
                          <span className="ml-1">Actif</span>
                        </div>
                      )}
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openModal(player)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
                        >
                          {Icons.edit}
                        </button>
                        <button
                          onClick={() => handleDeletePlayer(player.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                        >
                          {Icons.trash}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Équipes du joueur */}
                  {player.equipes_joueurs && player.equipes_joueurs.length > 0 && (
                    <div className="mt-3 ml-16 flex flex-wrap gap-2">
                      {player.equipes_joueurs.map((ej: any, i: number) => (
                        <span 
                          key={i}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs"
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