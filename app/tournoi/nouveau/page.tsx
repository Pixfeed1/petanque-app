/**
 * Page de création d'un nouveau tournoi - Version refactorisée
 * Utilise les hooks extraits pour une meilleure maintenabilité
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/AuthProvider'
import { useToast } from '@/components/ui/Toast'

// Hooks
import {
  useCreateTournament,
  usePlayerSelection,
  useTournamentCreation
} from '@/hooks/tournament'

// Composants
import WizardSteps from '@/components/tournament/wizard/WizardSteps'

// Icons
import {
  Petanque, X, Sparkles, Lightning, Users, User, Shuffle,
  Plus, Check, ArrowRight, Loader, Clock, Grid, Info, Warning, Flag
} from '@/components/Icons'

export default function CreateTournamentPage() {
  const router = useRouter()
  const { user, organization, loading: authLoading } = useAuth()
  const { showError, showWarning } = useToast()
  const [mounted, setMounted] = useState(false)

  // Hook formulaire
  const {
    formData,
    currentStep,
    validationError,
    hasDraft,  // A8 FIX
    setFormData,
    setCurrentStep,
    setValidationError,
    updateFormField,
    canProceed,
    handleContinue,
    handleBack,
    getTotalPlayers,
    getMinPlayers,
    getEstimatedTeams,
    getEstimatedPools,
    getPlayersPerTeam,
    clearDraft,  // A8 FIX
    steps
  } = useCreateTournament()

  // Hook sélection joueurs
  const {
    availablePlayers,
    loadingPlayers,
    loadPlayers,
    togglePlayer,
    addNewPlayer,
    updateNewPlayer,
    removeNewPlayer,
    selectAllPlayers,
    deselectAllPlayers,
    newPlayersRef
  } = usePlayerSelection({
    selectedPlayers: formData.selectedPlayers,
    newPlayers: formData.newPlayers,
    onUpdateSelectedPlayers: (players) => updateFormField('selectedPlayers', players),
    onUpdateNewPlayers: (players) => updateFormField('newPlayers', players)
  })

  // Hook création tournoi
  const {
    savingTournament,
    successAnimation,
    handleSubmit
  } = useTournamentCreation({
    formData,
    availablePlayers,
    getEstimatedTeams,
    onError: showError,
    onWarning: showWarning,
    onSuccess: clearDraft  // A8 FIX: Effacer brouillon après création
  })

  // Effets
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!authLoading && !organization && user) {
      showError('Erreur: Aucune organisation trouvée')
      router.push('/dashboard')
    }
  }, [organization, user, authLoading, router, showError])

  useEffect(() => {
    if (authLoading) return
    if (user && organization?.id && !organization.id.startsWith('temp-')) {
      loadPlayers()
    } else if (!user) {
      router.push('/login')
    }
  }, [user, organization, authLoading, loadPlayers, router])

  // Configs modes et formats
  const modes = [
    { value: 'choisi', title: 'Mode Choisi', description: 'Équipes choisies par les joueurs', icon: <Users className="w-6 h-6" />, gradient: 'from-blue-400 to-blue-600' },
    { value: 'melee_fixe', title: 'Mêlée Fixe', description: 'Équipes tirées au sort', icon: <Lightning className="w-6 h-6" />, gradient: 'from-green-400 to-green-600', recommended: true },
    { value: 'melee_tournante', title: 'Mêlée Tournante', description: 'Équipes changent à chaque tour', icon: <Shuffle className="w-6 h-6" />, gradient: 'from-purple-400 to-purple-600' }
  ]

  const formats = [
    { value: 'tete_a_tete', title: 'Tête à tête', description: '1 joueur', icon: <User className="w-8 h-8" /> },
    { value: 'doublette', title: 'Doublette', description: '2 joueurs', icon: <Users className="w-8 h-8" /> },
    { value: 'triplette', title: 'Triplette', description: '3 joueurs', icon: <Users className="w-8 h-8" /> }
  ]

  // Loading auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
        <div className="bg-white rounded-3xl p-12 shadow-2xl text-center">
          <Loader className="w-12 h-12 animate-spin mx-auto text-green-600" />
          <p className="mt-4 text-lg font-medium text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 overflow-x-hidden">
      {/* Particules animées */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
        <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
                <Petanque className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-sm sm:text-xl font-bold text-gray-900">Nouveau Tournoi</h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {hasDraft ? 'Brouillon restauré' : 'Créez votre compétition'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* A8 FIX: Bouton pour effacer le brouillon */}
              {hasDraft && (
                <button
                  onClick={clearDraft}
                  className="hidden sm:flex items-center space-x-1 px-3 py-2 text-xs text-amber-600 hover:bg-amber-50 rounded-xl"
                  title="Recommencer de zéro"
                >
                  <span>Effacer brouillon</span>
                </button>
              )}
              <button
                onClick={() => router.push('/dashboard')}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                <X className="w-5 h-5" />
                <span className="hidden sm:inline">Annuler</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Progress Steps */}
        <div className={`transition-all duration-1000 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <WizardSteps steps={steps} currentStep={currentStep} />
        </div>

        {/* Contenu des étapes */}
        <div className="mt-16">
          {/* Étape 1: Informations */}
          {currentStep === 1 && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-fadeIn">
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                  <Sparkles className="w-6 h-6 mr-2" />
                  Informations générales
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nom du tournoi *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateFormField('name', e.target.value.slice(0, 100))}
                    className="w-full h-14 px-5 border-2 border-gray-200 rounded-2xl focus:border-green-500 text-lg"
                    placeholder="Ex: Tournoi de Printemps 2025"
                    maxLength={100}
                  />
                  <p className="text-xs text-gray-400 mt-1">{formData.name.length}/100</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => updateFormField('date', e.target.value)}
                      className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-green-500"
                      aria-label="Date du tournoi"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Heure</label>
                    <input
                      type="time"
                      value={formData.time}
                      onChange={(e) => updateFormField('time', e.target.value)}
                      className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-green-500"
                      aria-label="Heure du tournoi"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lieu</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateFormField('location', e.target.value.slice(0, 100))}
                    className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-green-500"
                    placeholder="Ex: Boulodrome municipal"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Grid className="w-4 h-4 inline mr-1" />
                    Nombre de terrains
                  </label>
                  <input
                    type="number"
                    value={formData.terrains}
                    onChange={(e) => updateFormField('terrains', Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    max={20}
                    className="w-32 h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-green-500 text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Format */}
          {currentStep === 2 && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-fadeIn">
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                <h2 className="text-2xl font-bold text-gray-900">Configuration du tournoi</h2>
              </div>
              <div className="p-6 space-y-8">
                {/* Mode */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Mode de jeu</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {modes.map((mode) => (
                      <button
                        key={mode.value}
                        onClick={() => updateFormField('mode', mode.value as any)}
                        className={`p-6 rounded-2xl border-2 transition-all ${
                          formData.mode === mode.value
                            ? 'border-green-500 bg-green-50 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mode.gradient} text-white flex items-center justify-center mb-3`}>
                          {mode.icon}
                        </div>
                        <h4 className="font-bold text-gray-900">{mode.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{mode.description}</p>
                        {mode.recommended && (
                          <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Recommandé</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Format d&apos;équipe</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {formats.map((format) => (
                      <button
                        key={format.value}
                        onClick={() => updateFormField('format', format.value as any)}
                        className={`p-6 rounded-2xl border-2 transition-all text-center ${
                          formData.format === format.value
                            ? 'border-green-500 bg-green-50 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="text-green-600 mb-2 flex justify-center">{format.icon}</div>
                        <h4 className="font-bold text-gray-900">{format.title}</h4>
                        <p className="text-sm text-gray-500">{format.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Points max */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Points pour gagner</label>
                  <select
                    value={formData.maxPoints}
                    onChange={(e) => updateFormField('maxPoints', parseInt(e.target.value))}
                    className="w-40 h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-green-500"
                  >
                    {[11, 13, 15, 21].map(pts => (
                      <option key={pts} value={pts}>{pts} points</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Joueurs */}
          {currentStep === 3 && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-fadeIn">
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                <h2 className="text-2xl font-bold text-gray-900">Sélection des joueurs</h2>
                <p className="text-gray-600 mt-1">
                  {formData.mode === 'choisi' ? 'Optionnel - composez les équipes après' : `Minimum ${getMinPlayers()} joueurs requis`}
                </p>
              </div>
              <div className="p-6">
                {/* Résumé */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{getTotalPlayers()} joueur(s) sélectionné(s)</span>
                    <span className="text-sm text-gray-500">
                      ≈ {getEstimatedTeams()} équipe(s) • {getEstimatedPools()} poule(s)
                    </span>
                  </div>
                </div>

                {/* Joueurs existants */}
                {loadingPlayers ? (
                  <div className="text-center py-8">
                    <Loader className="w-8 h-8 animate-spin mx-auto text-green-600" />
                  </div>
                ) : availablePlayers.length > 0 ? (
                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-gray-900">Joueurs de l&apos;organisation</h3>
                      <div className="space-x-2">
                        <button onClick={selectAllPlayers} className="text-sm text-green-600 hover:underline">Tout sélectionner</button>
                        <button onClick={deselectAllPlayers} className="text-sm text-gray-500 hover:underline">Tout désélectionner</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                      {availablePlayers.map((player) => (
                        <button
                          key={player.id}
                          onClick={() => togglePlayer(player.id)}
                          className={`p-3 rounded-xl border-2 transition-all flex items-center ${
                            formData.selectedPlayers.includes(player.id)
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-2 ${
                            player.gender === 'F' ? 'bg-pink-500' : 'bg-blue-500'
                          }`}>
                            {player.name?.charAt(0)}
                          </div>
                          <span className="text-sm truncate">{player.name}</span>
                          {formData.selectedPlayers.includes(player.id) && (
                            <Check className="w-4 h-4 text-green-500 ml-auto" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Aucun joueur dans l&apos;organisation
                  </div>
                )}

                {/* Nouveaux joueurs */}
                <div ref={newPlayersRef}>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-900">Ajouter des joueurs</h3>
                    <button
                      onClick={addNewPlayer}
                      className="flex items-center space-x-1 text-green-600 hover:text-green-700"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Ajouter</span>
                    </button>
                  </div>
                  {formData.newPlayers.map((player, index) => (
                    <div key={index} className="flex items-center space-x-3 mb-3 p-3 bg-gray-50 rounded-xl">
                      <input
                        type="text"
                        value={player.name}
                        onChange={(e) => updateNewPlayer(index, 'name', e.target.value)}
                        placeholder="Nom"
                        className="flex-1 h-10 px-3 border border-gray-200 rounded-lg"
                      />
                      <select
                        value={player.gender}
                        onChange={(e) => updateNewPlayer(index, 'gender', e.target.value)}
                        className="h-10 px-3 border border-gray-200 rounded-lg"
                      >
                        <option value="H">Homme</option>
                        <option value="F">Femme</option>
                      </select>
                      <button
                        onClick={() => removeNewPlayer(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                {validationError && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start">
                    <Warning className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{validationError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Étape 4: Options */}
          {currentStep === 4 && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-fadeIn">
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                <h2 className="text-2xl font-bold text-gray-900">Options avancées</h2>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Taille des poules</label>
                    <select
                      value={formData.pouleSize}
                      onChange={(e) => updateFormField('pouleSize', parseInt(e.target.value))}
                      className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl"
                    >
                      {[3, 4, 5, 6].map(size => (
                        <option key={size} value={size}>{size} équipes par poule</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Qualifiés par poule</label>
                    <select
                      value={formData.qualifiedPerPoule}
                      onChange={(e) => updateFormField('qualifiedPerPoule', parseInt(e.target.value))}
                      className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl"
                    >
                      {[1, 2, 3].map(n => (
                        <option key={n} value={n}>{n} qualifié(s)</option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.mode === 'melee_tournante' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Rotation des équipes</label>
                    <select
                      value={formData.meleeRotation}
                      onChange={(e) => updateFormField('meleeRotation', e.target.value as any)}
                      className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl"
                    >
                      <option value="par_tour">Par tour (recommandé)</option>
                      <option value="par_match">Par match</option>
                    </select>
                  </div>
                )}

                <div className="space-y-4">
                  {[
                    { key: 'mixiteObligatoire', label: 'Mixité obligatoire (H/F dans chaque équipe)' },
                    { key: 'consolante', label: 'Petite finale (3ème place)' },
                    { key: 'fairPlay', label: 'Mode Fair-Play' }
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData[key as keyof typeof formData] as boolean}
                        onChange={(e) => updateFormField(key as any, e.target.checked)}
                        className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500"
                      />
                      <span className="text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Étape 5: Validation */}
          {currentStep === 5 && (
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden animate-fadeIn">
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
                <h2 className="text-2xl font-bold text-gray-900">Récapitulatif</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {[
                    { label: 'Nom', value: formData.name },
                    { label: 'Date', value: formData.date },
                    { label: 'Mode', value: formData.mode === 'choisi' ? 'Choisi' : formData.mode === 'melee_fixe' ? 'Mêlée fixe' : 'Mêlée tournante' },
                    { label: 'Format', value: formData.format === 'tete_a_tete' ? 'Tête à tête' : formData.format === 'doublette' ? 'Doublette' : 'Triplette' },
                    { label: 'Joueurs', value: `${getTotalPlayers()} joueur(s)` },
                    { label: 'Équipes estimées', value: `${getEstimatedTeams()} équipe(s)` },
                    { label: 'Terrains', value: `${formData.terrains}` },
                    { label: 'Points max', value: `${formData.maxPoints}` }
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-4">
                      <p className="text-sm text-gray-500">{label}</p>
                      <p className="font-bold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>

                {successAnimation && (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <p className="text-xl font-bold text-green-600">Tournoi créé avec succès !</p>
                    <p className="text-gray-500 mt-2">Redirection en cours...</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 ? (
              <button
                onClick={handleBack}
                className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
              >
                ← Retour
              </button>
            ) : (
              <div />
            )}

            {currentStep < 5 ? (
              <button
                onClick={handleContinue}
                disabled={!canProceed()}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <span>Continuer</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={savingTournament || successAnimation}
                className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center space-x-2"
              >
                {savingTournament ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Création...</span>
                  </>
                ) : (
                  <>
                    <Flag className="w-5 h-5" />
                    <span>Créer le tournoi</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 7s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
      `}</style>
    </div>
  )
}
