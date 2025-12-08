// components/club/RulesConfig.tsx
// Interface de configuration des règles personnalisées Pack Club
// Respecte la charte graphique Pétanque Pro

'use client'

import { useState, useCallback } from 'react'
import {
  ClubRules,
  ClubMode,
  ClubFormat,
  ClubClassementMethode,
  DEFAULT_CLUB_RULES
} from '@/lib/club/types'
import {
  Settings,
  Users,
  User,
  Shuffle,
  Lightning,
  Check,
  X,
  Plus,
  Trash,
  Save,
  Edit,
  Male,
  Female,
  Grid,
  Podium,
  Info
} from '@/components/Icons'

interface RulesConfigProps {
  rules: ClubRules
  onSave: (rules: ClubRules) => void
  onCancel?: () => void
  readOnly?: boolean
}

/**
 * Composant de configuration des règles Pack Club
 */
export default function RulesConfig({
  rules,
  onSave,
  onCancel,
  readOnly = false
}: RulesConfigProps) {
  const [formData, setFormData] = useState<ClubRules>(rules)
  const [activeSection, setActiveSection] = useState<string>('general')
  const [newTerrain, setNewTerrain] = useState('')

  /**
   * Met à jour un champ du formulaire
   */
  const updateField = useCallback(<K extends keyof ClubRules>(
    field: K,
    value: ClubRules[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  /**
   * Met à jour un champ imbriqué (mixite, terrains, classement)
   */
  const updateNestedField = useCallback(<
    K extends 'mixite' | 'terrains' | 'classement',
    F extends keyof ClubRules[K]
  >(
    parent: K,
    field: F,
    value: ClubRules[K][F]
  ) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }))
  }, [])

  /**
   * Ajoute un terrain
   */
  const addTerrain = useCallback(() => {
    if (!newTerrain.trim()) return
    if (formData.terrains.noms.includes(newTerrain.trim())) return

    setFormData(prev => ({
      ...prev,
      terrains: {
        ...prev.terrains,
        noms: [...prev.terrains.noms, newTerrain.trim()]
      }
    }))
    setNewTerrain('')
  }, [newTerrain, formData.terrains.noms])

  /**
   * Supprime un terrain
   */
  const removeTerrain = useCallback((terrain: string) => {
    setFormData(prev => ({
      ...prev,
      terrains: {
        ...prev.terrains,
        noms: prev.terrains.noms.filter(t => t !== terrain)
      }
    }))
  }, [])

  /**
   * Sauvegarde les règles
   */
  const handleSave = useCallback(() => {
    onSave(formData)
  }, [formData, onSave])

  // Configuration des modes
  const modes: { value: ClubMode; label: string; description: string; icon: React.ReactNode }[] = [
    {
      value: 'choisi',
      label: 'Choisi',
      description: 'Equipes composées manuellement',
      icon: <Users className="w-5 h-5" />
    },
    {
      value: 'melee',
      label: 'Mêlées',
      description: 'Equipes tirées au sort, fixes',
      icon: <Lightning className="w-5 h-5" />
    },
    {
      value: 'melee_tournante',
      label: 'Mêlées Tournantes',
      description: 'Equipes changent chaque partie',
      icon: <Shuffle className="w-5 h-5" />
    }
  ]

  // Configuration des formats
  const formats: { value: ClubFormat; label: string; players: number }[] = [
    { value: 'doublette', label: 'Doublette', players: 2 },
    { value: 'triplette', label: 'Triplette', players: 3 }
  ]

  // Méthodes de classement
  const classementMethodes: { value: ClubClassementMethode; label: string; description: string }[] = [
    {
      value: 'victoires_puis_points',
      label: 'Victoires puis points',
      description: '1. Nombre de victoires, 2. Différence de points'
    },
    {
      value: 'points_puis_victoires',
      label: 'Points puis victoires',
      description: '1. Différence de points, 2. Nombre de victoires'
    },
    {
      value: 'difference_points',
      label: 'Différence de points',
      description: 'Uniquement la différence de points'
    }
  ]

  // Sections du formulaire
  const sections = [
    { id: 'general', label: 'Général', icon: <Settings className="w-4 h-4" /> },
    { id: 'format', label: 'Format', icon: <Users className="w-4 h-4" /> },
    { id: 'mixite', label: 'Mixité H/F', icon: <Male className="w-4 h-4" /> },
    { id: 'terrains', label: 'Terrains', icon: <Grid className="w-4 h-4" /> },
    { id: 'classement', label: 'Classement', icon: <Podium className="w-4 h-4" /> }
  ]

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">Configuration des règles</h2>
              <p className="text-white/80 text-sm">{formData.name}</p>
            </div>
          </div>
          {!readOnly && (
            <div className="flex gap-2">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Enregistrer
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex">
        {/* Sidebar navigation */}
        <div className="w-48 border-r border-gray-100 p-4">
          <nav className="space-y-1">
            {sections.map(section => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                  activeSection === section.id
                    ? 'bg-blue-100 text-blue-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Contenu */}
        <div className="flex-1 p-6">
          {/* Section Général */}
          {activeSection === 'general' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom des règles
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => updateField('name', e.target.value)}
                  disabled={readOnly}
                  className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 disabled:bg-gray-50"
                  placeholder="Ex: Règlement Club Pétanque Lyon"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optionnel)
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={e => updateField('description', e.target.value)}
                  disabled={readOnly}
                  className="w-full h-24 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 disabled:bg-gray-50 resize-none"
                  placeholder="Description des règles..."
                  maxLength={500}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de parties
                </label>
                <div className="flex gap-3">
                  {[2, 3, 4].map(n => (
                    <button
                      key={n}
                      onClick={() => updateField('nombreParties', n as 2 | 3 | 4)}
                      disabled={readOnly}
                      className={`w-16 h-12 rounded-xl border-2 font-bold transition-all ${
                        formData.nombreParties === n
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      } disabled:opacity-50`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points pour gagner
                </label>
                <div className="flex gap-3">
                  {[11, 13, 15, 21].map(pts => (
                    <button
                      key={pts}
                      onClick={() => updateField('pointsGagnants', pts as 11 | 13 | 15 | 21)}
                      disabled={readOnly}
                      className={`px-4 h-12 rounded-xl border-2 font-bold transition-all ${
                        formData.pointsGagnants === pts
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      } disabled:opacity-50`}
                    >
                      {pts}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Section Format */}
          {activeSection === 'format' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Mode de jeu
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {modes.map(mode => (
                    <button
                      key={mode.value}
                      onClick={() => updateField('mode', mode.value)}
                      disabled={readOnly}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        formData.mode === mode.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } disabled:opacity-50`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        formData.mode === mode.value ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {mode.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{mode.label}</p>
                        <p className="text-sm text-gray-500">{mode.description}</p>
                      </div>
                      {formData.mode === mode.value && (
                        <Check className="w-5 h-5 text-blue-500 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Format d equipe
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {formats.map(format => (
                    <button
                      key={format.value}
                      onClick={() => updateField('format', format.value)}
                      disabled={readOnly}
                      className={`p-4 rounded-xl border-2 transition-all text-center ${
                        formData.format === format.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } disabled:opacity-50`}
                    >
                      <p className="font-semibold text-gray-900">{format.label}</p>
                      <p className="text-sm text-gray-500">{format.players} joueurs</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.autoriserMelangeFormats}
                    onChange={e => updateField('autoriserMelangeFormats', e.target.checked)}
                    disabled={readOnly}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">
                    Autoriser le mélange doublette/triplette (si nombre impair)
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.privilegierFormatPrincipal}
                    onChange={e => updateField('privilegierFormatPrincipal', e.target.checked)}
                    disabled={readOnly}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-gray-700">
                    Privilégier le format principal (ex: triplettes avant doublettes)
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Section Mixité */}
          {activeSection === 'mixite' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-1">
                    <Male className="w-5 h-5 text-blue-500" />
                    <Female className="w-5 h-5 text-pink-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Gestion Hommes/Femmes</p>
                    <p className="text-sm text-gray-500">Activer les règles de mixité</p>
                  </div>
                </div>
                <button
                  onClick={() => updateNestedField('mixite', 'enabled', !formData.mixite.enabled)}
                  disabled={readOnly}
                  className={`w-12 h-7 rounded-full flex items-center px-1 transition-all ${
                    formData.mixite.enabled ? 'bg-blue-500 justify-end' : 'bg-gray-300 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow" />
                </button>
              </div>

              {formData.mixite.enabled && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-200">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.mixite.jamaisTroisMemeGenre}
                      onChange={e => updateNestedField('mixite', 'jamaisTroisMemeGenre', e.target.checked)}
                      disabled={readOnly}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-gray-700 font-medium">
                        Jamais 3 personnes du même genre
                      </span>
                      <p className="text-sm text-gray-500">
                        En triplette, évite les équipes 3H ou 3F
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.mixite.equilibreMatchsHF}
                      onChange={e => updateNestedField('mixite', 'equilibreMatchsHF', e.target.checked)}
                      disabled={readOnly}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-gray-700 font-medium">
                        Equilibre H/F dans les matchs
                      </span>
                      <p className="text-sm text-gray-500">
                        2F1H ne joue pas contre 2H1F
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.mixite.prioriteMixite}
                      onChange={e => updateNestedField('mixite', 'prioriteMixite', e.target.checked)}
                      disabled={readOnly}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <span className="text-gray-700 font-medium">
                        Priorité à la mixité
                      </span>
                      <p className="text-sm text-gray-500">
                        Former en priorité des équipes mixtes (1H1F, 2H1F, 1H2F)
                      </p>
                    </div>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Section Terrains */}
          {activeSection === 'terrains' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Liste des terrains
                </label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {formData.terrains.noms.map(terrain => (
                    <div
                      key={terrain}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg"
                    >
                      <span className="font-medium text-gray-700">{terrain}</span>
                      {!readOnly && (
                        <button
                          onClick={() => removeTerrain(terrain)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {!readOnly && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTerrain}
                      onChange={e => setNewTerrain(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && addTerrain()}
                      className="flex-1 h-10 px-4 border-2 border-gray-200 rounded-lg focus:border-blue-500"
                      placeholder="Nom du terrain (ex: A, B, 1, 2...)"
                      maxLength={10}
                    />
                    <button
                      onClick={addTerrain}
                      className="px-4 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter
                    </button>
                  </div>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.terrains.attributionAuto}
                  onChange={e => updateNestedField('terrains', 'attributionAuto', e.target.checked)}
                  disabled={readOnly}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-gray-700 font-medium">
                    Attribution automatique
                  </span>
                  <p className="text-sm text-gray-500">
                    Les terrains sont attribués automatiquement aux matchs
                  </p>
                </div>
              </label>
            </div>
          )}

          {/* Section Classement */}
          {activeSection === 'classement' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Méthode de classement
                </label>
                <div className="space-y-3">
                  {classementMethodes.map(methode => (
                    <button
                      key={methode.value}
                      onClick={() => updateNestedField('classement', 'methode', methode.value)}
                      disabled={readOnly}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        formData.classement.methode === methode.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      } disabled:opacity-50`}
                    >
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        formData.classement.methode === methode.value
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {formData.classement.methode === methode.value && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{methode.label}</p>
                        <p className="text-sm text-gray-500">{methode.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-xl">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Exemple de calcul :</p>
                    <p>Eric : V 13-4 (+9), D 5-13 (-8), V 13-2 (+11) = 12 pts, 2 victoires</p>
                    <p>Jean : V 13-6 (+7), V 13-8 (+5), V 13-3 (+10) = 22 pts, 3 victoires</p>
                    <p className="mt-2">
                      Avec <strong>Victoires puis points</strong> : 1. Jean (3V), 2. Eric (2V)
                    </p>
                  </div>
                </div>
              </div>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.classement.calculDifference}
                  onChange={e => updateNestedField('classement', 'calculDifference', e.target.checked)}
                  disabled={readOnly}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-gray-700 font-medium">
                    Calcul par différence
                  </span>
                  <p className="text-sm text-gray-500">
                    Calculer la différence de points (gagné 13-4 = +9)
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
