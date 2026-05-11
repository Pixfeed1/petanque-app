'use client'

import { useRouter } from 'next/navigation'
import { usePlayersManagement } from '@/hooks/players'
import { useToast } from '@/components/ui/Toast'
import { useConfirm } from '@/components/ui/ConfirmModal'
import {
  Button, FadeIn,
  PageHeader, SearchInput, PillToggle, EmptyState, PlayerAvatar
} from '@/components/ui'
import { Plus, Edit, Trash, Loader, X, Users } from '@/components/Icons'
import type { Joueur } from '@/lib/types'

export default function PlayersManagementPage() {
  const { showSuccess, showError } = useToast()
  const { confirm, ConfirmModal } = useConfirm()

  const {
    loading, stats,
    searchTerm, selectedGender, selectedPlayers, filteredPlayers,
    showModal, editingPlayer, formData,
    setSearchTerm, setSelectedGender, togglePlayerSelection, selectAll,
    openModal, closeModal, updateFormData, savePlayer, deletePlayer, bulkDelete, exportPlayers
  } = usePlayersManagement({
    onSuccess: showSuccess,
    onError: showError,
    onConfirm: confirm
  })

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
          <Button variant="primary" size="sm" onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-1.5" />
            Nouveau joueur
          </Button>
        }
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <FadeIn>
          <p className="text-[11px] font-medium text-petanque-bois uppercase tracking-[0.18em] mb-3 flex flex-wrap gap-x-3 gap-y-1">
            <span>Roster</span>
            <span className="text-petanque-sable-bord">·</span>
            <span>{stats.total} {stats.total > 1 ? 'joueurs' : 'joueur'}</span>
            {stats.actifs > 0 && (
              <>
                <span className="text-petanque-sable-bord">·</span>
                <span>{stats.actifs} {stats.actifs > 1 ? 'actifs' : 'actif'}</span>
              </>
            )}
          </p>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-medium text-petanque-vert-fonce tracking-tight leading-[1.05] mb-12">
            Ton roster <span className="accent-italic text-petanque-vert">club.</span>
          </h1>
        </FadeIn>

        {/* Stats inline */}
        <FadeIn delay={80}>
          <div className="flex flex-wrap gap-x-10 gap-y-4 pb-8 mb-8 border-b border-petanque-sable-bord/50">
            <Stat label="Total" value={stats.total} />
            <Stat label="Hommes" value={stats.hommes} />
            <Stat label="Femmes" value={stats.femmes} />
            <Stat label="Actifs" value={stats.actifs} highlight={stats.actifs > 0} />
          </div>
        </FadeIn>

        {/* Filtres */}
        <FadeIn delay={140}>
          <div className="flex items-center gap-3 flex-wrap mb-5">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Rechercher un joueur…"
            />
            <PillToggle<'all' | 'H' | 'F'>
              options={[
                { value: 'all', label: 'Tous' },
                { value: 'H', label: 'Hommes' },
                { value: 'F', label: 'Femmes' }
              ]}
              value={selectedGender}
              onChange={setSelectedGender}
            />
          </div>
        </FadeIn>

        {/* Bandeau sélection multiple */}
        {selectedPlayers.length > 0 && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 bg-petanque-vert-pale/20 border border-petanque-vert/30 rounded-xl mb-5">
            <span className="text-sm text-petanque-vert-fonce font-medium">
              {selectedPlayers.length} sélectionné{selectedPlayers.length > 1 ? 's' : ''}
            </span>
            <div className="flex gap-2">
              <button
                onClick={exportPlayers}
                className="text-xs font-medium text-petanque-vert hover:text-petanque-vert-fonce border border-petanque-sable-bord px-3 py-1.5 rounded-lg bg-white"
              >
                Exporter
              </button>
              <button
                onClick={bulkDelete}
                className="text-xs font-medium text-petanque-cochonnet-fonce hover:bg-petanque-cochonnet-pale/40 border border-petanque-cochonnet/40 px-3 py-1.5 rounded-lg"
              >
                Supprimer
              </button>
            </div>
          </div>
        )}

        {/* Liste */}
        <FadeIn delay={200}>
          {filteredPlayers.length === 0 ? (
            stats.total === 0 ? (
              <EmptyState
                icon={<Users className="w-6 h-6" />}
                title="Aucun joueur dans ton roster"
                description="Ajoute des joueurs pour les retrouver facilement lors de tes prochains tournois."
                cta={{ label: '+ Ajouter le premier joueur', onClick: () => openModal() }}
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
                <input
                  type="checkbox"
                  checked={selectedPlayers.length === filteredPlayers.length && filteredPlayers.length > 0}
                  onChange={selectAll}
                  className="w-4 h-4 rounded border-petanque-sable-bord text-petanque-vert focus:ring-petanque-vert/30"
                />
                <span>{filteredPlayers.length} {filteredPlayers.length > 1 ? 'joueurs' : 'joueur'}</span>
              </div>
              {filteredPlayers.map((player) => (
                <PlayerRow
                  key={player.id}
                  player={player}
                  isSelected={selectedPlayers.includes(player.id)}
                  onToggle={() => togglePlayerSelection(player.id)}
                  onEdit={() => openModal(player)}
                  onDelete={() => deletePlayer(player.id)}
                />
              ))}
            </div>
          )}
        </FadeIn>
      </main>

      {showModal && (
        <PlayerModal
          editingPlayer={editingPlayer}
          formData={formData}
          onUpdateForm={updateFormData}
          onSave={savePlayer}
          onClose={closeModal}
        />
      )}

      {ConfirmModal}
    </div>
  )
}

// =============================================================
// Stat inline
// =============================================================
function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-1.5">{label}</p>
      <p className={`font-mono text-2xl md:text-3xl font-medium leading-none ${highlight ? 'text-petanque-vert' : 'text-petanque-vert-fonce'}`}>
        {value}
      </p>
    </div>
  )
}

// =============================================================
// Player Row
// =============================================================
function PlayerRow({ player, isSelected, onToggle, onEdit, onDelete }: {
  player: Joueur
  isSelected: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const equipesJoueurs = (player as any).equipes_joueurs || []
  const isActive = equipesJoueurs.some((ej: any) => ej.equipe?.tournoi?.status === 'en_cours')
  const teams = equipesJoueurs.filter((ej: any) => ej.equipe?.name && ej.equipe?.tournoi?.name)

  return (
    <div className="group flex items-start gap-3 py-4 hover:bg-petanque-sable/40 transition-colors px-1">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggle}
        className="w-4 h-4 mt-2 rounded border-petanque-sable-bord text-petanque-vert focus:ring-petanque-vert/30 flex-shrink-0"
      />
      <PlayerAvatar name={player.name} size={40} className="mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-base font-medium text-petanque-vert-fonce">{player.name}</p>
        <div className="mt-1 text-xs text-petanque-bois flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-mono uppercase tracking-[0.14em]">{player.gender === 'H' ? 'Homme' : 'Femme'}</span>
          {player.email && (<><span className="text-petanque-sable-bord">·</span><span>{player.email}</span></>)}
          {player.phone && (<><span className="text-petanque-sable-bord">·</span><span>{player.phone}</span></>)}
        </div>
        {teams.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {teams.slice(0, 3).map((ej: any, i: number) => (
              <span key={i} className="font-mono text-[10px] text-petanque-bois bg-white border border-petanque-sable-bord/60 px-2 py-0.5 rounded-md">
                {ej.equipe.name} · {ej.equipe.tournoi.name}
              </span>
            ))}
            {teams.length > 3 && (
              <span className="text-[10px] text-petanque-bois italic px-1">+ {teams.length - 3}</span>
            )}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {isActive && (
          <span className="font-mono text-[10px] text-petanque-vert border border-petanque-vert/30 px-2 py-0.5 rounded-full uppercase tracking-[0.14em] font-medium">
            Actif
          </span>
        )}
        <div className="flex gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onEdit}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-petanque-bois hover:text-petanque-vert-fonce hover:bg-petanque-sable-bord/30 transition-colors"
            aria-label="Modifier"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-petanque-bois hover:text-petanque-cochonnet hover:bg-petanque-cochonnet-pale/40 transition-colors"
            aria-label="Supprimer"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================================
// Player Modal
// =============================================================
type PlayerFormData = { name: string; gender: 'H' | 'F'; email: string; phone: string }

function PlayerModal({ editingPlayer, formData, onUpdateForm, onSave, onClose }: {
  editingPlayer: Joueur | null
  formData: PlayerFormData
  onUpdateForm: (data: Partial<PlayerFormData>) => void
  onSave: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-petanque-vert-fonce/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        <div className="p-7">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="font-mono text-[10px] text-petanque-bois uppercase tracking-[0.18em] font-medium mb-2">
                {editingPlayer ? 'Modification' : 'Ajout'}
              </p>
              <h2 className="text-xl font-medium text-petanque-vert-fonce">
                {editingPlayer ? 'Modifier le joueur' : 'Nouveau joueur'}
              </h2>
            </div>
            <button onClick={onClose} className="text-petanque-bois hover:text-petanque-vert-fonce p-1" aria-label="Fermer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">Nom complet *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => onUpdateForm({ name: e.target.value })}
                placeholder="Marc Gueffie"
                autoFocus
                className="w-full h-11 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:ring-2 focus:ring-petanque-vert/20 focus:outline-none text-sm text-petanque-vert-fonce"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">Genre *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'H' as const, label: 'Homme' },
                  { value: 'F' as const, label: 'Femme' }
                ].map((opt) => {
                  const sel = formData.gender === opt.value
                  return (
                    <button
                      key={opt.value}
                      onClick={() => onUpdateForm({ gender: opt.value })}
                      className={`py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        sel
                          ? 'bg-petanque-vert text-petanque-sable border border-petanque-vert'
                          : 'bg-white border border-petanque-sable-bord text-petanque-vert-fonce hover:border-petanque-bois/50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">Email (optionnel)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => onUpdateForm({ email: e.target.value })}
                placeholder="marc@exemple.fr"
                className="w-full h-11 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:ring-2 focus:ring-petanque-vert/20 focus:outline-none text-sm text-petanque-vert-fonce"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-petanque-bois uppercase tracking-[0.16em] mb-2">Téléphone (optionnel)</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => onUpdateForm({ phone: e.target.value })}
                placeholder="06 12 34 56 78"
                className="w-full h-11 px-4 bg-white border border-petanque-sable-bord rounded-xl focus:border-petanque-vert focus:ring-2 focus:ring-petanque-vert/20 focus:outline-none text-sm text-petanque-vert-fonce"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-7">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-petanque-bois border border-petanque-sable-bord rounded-lg hover:bg-petanque-sable-pale/60 transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onSave}
              disabled={!formData.name}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-petanque-sable bg-petanque-vert rounded-lg hover:bg-petanque-vert-fonce disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              {editingPlayer ? 'Modifier' : 'Ajouter'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
