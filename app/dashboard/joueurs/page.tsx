'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { usePlayersManagement } from '@/hooks/players'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import type { Joueur } from '@/lib/types'
import {
  Users, Plus, Search, Edit, Trash, Email, Trophy,
  Download, Star, Loader, Phone
} from '@/components/Icons'

/**
 * Page de gestion des joueurs
 * - Liste avec recherche et filtres
 * - CRUD joueurs
 * - Export CSV
 * - Actions groupées
 */
export default function PlayersManagementPage() {
  const router = useRouter()
  const { user, organization } = useAuth()
  const [mounted, setMounted] = useState(false)
  const { showSuccess, showError } = useToast()
  const { confirm, ConfirmModal } = useConfirm()

  const {
    players,
    loading,
    stats,
    searchTerm,
    selectedGender,
    selectedPlayers,
    filteredPlayers,
    showModal,
    editingPlayer,
    formData,
    setSearchTerm,
    setSelectedGender,
    togglePlayerSelection,
    selectAll,
    openModal,
    closeModal,
    updateFormData,
    savePlayer,
    deletePlayer,
    bulkDelete,
    exportPlayers
  } = usePlayersManagement({
    onSuccess: showSuccess,
    onError: showError,
    // 🔧 FIX: Wrapper pour adapter le type de confirm (UseConfirmOptions → string)
    onConfirm: (message: string) => confirm({ title: 'Confirmation', message })
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
            <div className="relative bg-white rounded-3xl p-12 shadow-2xl">
              <Loader className="animate-spin h-5 w-5" />
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
      <AnimatedBackground />

      {/* Header */}
      <PageHeader
        onBack={() => router.push('/dashboard')}
        onExport={exportPlayers}
        onAddPlayer={() => openModal()}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats cards */}
        <StatsCards stats={stats} mounted={mounted} />

        {/* Barre de recherche et filtres */}
        <FiltersBar
          searchTerm={searchTerm}
          selectedGender={selectedGender}
          selectedCount={selectedPlayers.length}
          onSearchChange={setSearchTerm}
          onGenderChange={setSelectedGender}
          onBulkDelete={bulkDelete}
          onExport={exportPlayers}
        />

        {/* Liste des joueurs */}
        <PlayersList
          players={filteredPlayers}
          selectedPlayers={selectedPlayers}
          onToggleSelection={togglePlayerSelection}
          onSelectAll={selectAll}
          onEdit={openModal}
          onDelete={deletePlayer}
        />
      </div>

      {/* Modal ajout/modification */}
      {showModal && (
        <PlayerModal
          editingPlayer={editingPlayer}
          formData={formData}
          onUpdateForm={updateFormData}
          onSave={savePlayer}
          onClose={closeModal}
        />
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
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-slideUp { animation: slideUp 0.6s ease-out both; }
        .animate-slideIn { animation: slideIn 0.4s ease-out both; }
      `}</style>

      <ConfirmModal />
    </div>
  )
}

// ============================================================================
// Composants internes
// ============================================================================

function AnimatedBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-green-300 to-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-300 to-indigo-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-40 right-40 w-96 h-96 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
    </div>
  )
}

interface PageHeaderProps {
  onBack: () => void
  onExport: () => void
  onAddPlayer: () => void
}

function PageHeader({ onBack, onExport, onAddPlayer }: PageHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-gray-200/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
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
                  Gestion des Joueurs
                </h1>
                <p className="text-sm text-gray-500">Gerez vos participants</p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onExport}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all flex items-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Exporter</span>
            </button>

            <button
              onClick={onAddPlayer}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all transform hover:scale-105 flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Nouveau joueur</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

interface StatsCardsProps {
  stats: { total: number; hommes: number; femmes: number; actifs: number }
  mounted: boolean
}

function StatsCards({ stats, mounted }: StatsCardsProps) {
  const cards = [
    { label: 'Total joueurs', value: stats.total, gradient: 'from-blue-500 to-indigo-600', delay: '0ms' },
    { label: 'Hommes', value: stats.hommes, gradient: 'from-blue-400 to-cyan-600', delay: '100ms' },
    { label: 'Femmes', value: stats.femmes, gradient: 'from-pink-500 to-rose-600', delay: '200ms' },
    { label: 'Actifs', value: stats.actifs, gradient: 'from-green-500 to-emerald-600', delay: '300ms' }
  ]

  return (
    <div className={`grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
      {cards.map((stat, index) => (
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
                {index === 3 ? <Star className="w-6 h-6" /> : <Users className="w-6 h-6" />}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

interface FiltersBarProps {
  searchTerm: string
  selectedGender: 'all' | 'H' | 'F'
  selectedCount: number
  onSearchChange: (term: string) => void
  onGenderChange: (gender: 'all' | 'H' | 'F') => void
  onBulkDelete: () => void
  onExport: () => void
}

function FiltersBar({
  searchTerm, selectedGender, selectedCount,
  onSearchChange, onGenderChange, onBulkDelete, onExport
}: FiltersBarProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Recherche */}
        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
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
              onClick={() => onGenderChange(option.value as 'all' | 'H' | 'F')}
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
        {selectedCount > 0 && (
          <div className="flex items-center space-x-2 animate-slideIn">
            <span className="text-sm text-gray-600">
              {selectedCount} selectionne(s)
            </span>
            <button
              onClick={onBulkDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
            >
              Supprimer
            </button>
            <button
              onClick={onExport}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all"
            >
              Exporter
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface PlayersListProps {
  players: Joueur[]
  selectedPlayers: string[]
  onToggleSelection: (id: string) => void
  onSelectAll: () => void
  onEdit: (player: Joueur) => void
  onDelete: (id: string) => void
}

function PlayersList({
  players, selectedPlayers, onToggleSelection, onSelectAll, onEdit, onDelete
}: PlayersListProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Header du tableau */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="checkbox"
              checked={selectedPlayers.length === players.length && players.length > 0}
              onChange={onSelectAll}
              className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
            />
            <span className="text-sm text-gray-600">
              {players.length} joueur(s) trouve(s)
            </span>
          </div>
        </div>
      </div>

      {/* Liste */}
      <div className="divide-y divide-gray-100">
        {players.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl mb-4">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-gray-500 text-lg mb-4">Aucun joueur trouve</p>
          </div>
        ) : (
          players.map((player, index) => (
            <PlayerRow
              key={player.id}
              player={player}
              index={index}
              isSelected={selectedPlayers.includes(player.id)}
              onToggle={() => onToggleSelection(player.id)}
              onEdit={() => onEdit(player)}
              onDelete={() => onDelete(player.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

interface PlayerRowProps {
  player: Joueur
  index: number
  isSelected: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

function PlayerRow({ player, index, isSelected, onToggle, onEdit, onDelete }: PlayerRowProps) {
  const isActive = (player as any).equipes_joueurs?.some(
    (ej: any) => ej.equipe?.tournoi?.status === 'en_cours'
  )

  return (
    <div
      className="group px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all animate-slideIn"
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
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
                  <Email className="w-5 h-5" />
                  <span className="ml-1">{player.email}</span>
                </span>
              )}
              {player.phone && (
                <span className="flex items-center">
                  <Phone className="w-5 h-5" />
                  <span className="ml-1">{player.phone}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {isActive && (
            <div className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              <Trophy className="w-5 h-5" />
              <span className="ml-1">Actif</span>
            </div>
          )}

          <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all hover:scale-110"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
            >
              <Trash className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Équipes du joueur */}
      {(player as any).equipes_joueurs && (player as any).equipes_joueurs.length > 0 && (
        <div className="mt-3 ml-16 flex flex-wrap gap-2">
          {(player as any).equipes_joueurs.map((ej: any, i: number) => (
            <span
              key={i}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs"
            >
              {ej.equipe?.name} - {ej.equipe?.tournoi?.name}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

type PlayerFormData = { name: string; gender: 'H' | 'F'; email: string; phone: string }

interface PlayerModalProps {
  editingPlayer: Joueur | null
  formData: PlayerFormData
  onUpdateForm: (data: Partial<PlayerFormData>) => void
  onSave: () => void
  onClose: () => void
}

function PlayerModal({ editingPlayer, formData, onUpdateForm, onSave, onClose }: PlayerModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Users className="w-6 h-6" />
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
              onChange={(e) => onUpdateForm({ name: e.target.value })}
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
                  onClick={() => onUpdateForm({ gender: option.value as 'H' | 'F' })}
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
                <Email className="w-5 h-5" />
              </div>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => onUpdateForm({ email: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                placeholder="jean@exemple.fr"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telephone (optionnel)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Phone className="w-5 h-5" />
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => onUpdateForm({ phone: e.target.value })}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all"
                placeholder="06 12 34 56 78"
              />
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-3 text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-xl transition-all"
          >
            Annuler
          </button>
          <button
            onClick={onSave}
            disabled={!formData.name}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-2xl transition-all disabled:opacity-50"
          >
            {editingPlayer ? 'Modifier' : 'Ajouter'}
          </button>
        </div>
      </div>
    </div>
  )
}
