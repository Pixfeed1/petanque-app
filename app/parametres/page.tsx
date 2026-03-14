'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { User, Organization, Calendar, Crown, Infinity, Download, Archive, Logout, Check, SparklesAlt, ArrowRight, Loader, X, Back } from '@/components/Icons'
import { useToast } from '@/components/ui/Toast'

// Icônes SVG élégantes
const Icons = {
  user: <User className="w-5 h-5" />,
  organization: <Organization className="w-5 h-5" />,
  calendar: <Calendar className="w-5 h-5" />,
  crown: <Crown className="w-6 h-6" />,
  infinity: <Infinity className="w-5 h-5" />,
  download: <Download className="w-5 h-5" />,
  archive: <Archive className="w-5 h-5" />,
  logout: <Logout className="w-5 h-5" />,
  check: <Check className="w-5 h-5" />,
  sparkles: <SparklesAlt className="w-5 h-5" />,
  arrow: <ArrowRight className="w-5 h-5" />,
  loader: <Loader className="animate-spin h-5 w-5" />,
  x: <X className="w-5 h-5" />,
  back: <Back className="w-5 h-5" />
}

export default function Parametres() {
  const router = useRouter()
  const { user, organization, isPremium } = useAuth()
  const { showError, showSuccess } = useToast()
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [exportingData, setExportingData] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Club customization state
  const [clubName, setClubName] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#16a34a')
  const [secondaryColor, setSecondaryColor] = useState('#059669')
  const [savingCustomization, setSavingCustomization] = useState(false)

  const userPlan = (organization?.settings as Record<string, any>)?.plan || 'free'
  const isClub = userPlan === 'club'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load existing customization
  useEffect(() => {
    if (organization?.settings) {
      const settings = organization.settings as Record<string, any>
      const cust = settings.customization
      if (cust) {
        setClubName(cust.club_name || '')
        setLogoUrl(cust.logo_url || '')
        setPrimaryColor(cust.primary_color || '#16a34a')
        setSecondaryColor(cust.secondary_color || '#059669')
      }
    }
  }, [organization])

  const handleSaveCustomization = async () => {
    if (!organization?.id) return
    setSavingCustomization(true)
    try {
      const response = await fetch('/api/organisations/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          org_id: organization.id,
          customization: {
            club_name: clubName.trim() || undefined,
            logo_url: logoUrl.trim() || undefined,
            primary_color: primaryColor,
            secondary_color: secondaryColor
          }
        })
      })

      if (response.ok) {
        showSuccess('Personnalisation sauvegardée')
      } else {
        const data = await response.json()
        showError(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch {
      showError('Erreur lors de la sauvegarde')
    } finally {
      setSavingCustomization(false)
    }
  }

  const handleExportTournois = async () => {
    setExportingData(true)
    try {
      // Récupérer tous les tournois via l'API
      const response = await fetch('/api/tournois', {
        credentials: 'include'
      })

      if (!response.ok) throw new Error('Erreur de récupération des tournois')

      const tournois = await response.json()

      // Créer un blob JSON
      const dataStr = JSON.stringify(tournois, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })

      // Télécharger avec cleanup garanti
      const url = URL.createObjectURL(dataBlob)
      try {
        const link = document.createElement('a')
        link.href = url
        link.download = `tournois-${new Date().toISOString().split('T')[0]}.json`
        link.click()
      } finally {
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Erreur export:', error)
      showError('Erreur lors de l\'export')
    } finally {
      setExportingData(false)
    }
  }

  const handleExportRGPD = async () => {
    setExportingData(true)
    try {
      // Récupérer toutes les données via les APIs
      const [tournoiResponse, joueurResponse] = await Promise.all([
        fetch('/api/tournois', { credentials: 'include' }),
        fetch('/api/joueurs', { credentials: 'include' })
      ])

      const tournois = tournoiResponse.ok ? await tournoiResponse.json() : []
      const joueurs = joueurResponse.ok ? await joueurResponse.json() : []

      // Récupérer toutes les données de l'utilisateur
      const allData = {
        user: {
          email: user?.email,
          id: user?.id,
          created_at: user?.created_at
        },
        organization: organization,
        tournois,
        joueurs
      }

      // Créer un blob JSON
      const dataStr = JSON.stringify(allData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })

      // Télécharger avec cleanup garanti
      const url = URL.createObjectURL(dataBlob)
      try {
        const link = document.createElement('a')
        link.href = url
        link.download = `mes-donnees-${new Date().toISOString().split('T')[0]}.json`
        link.click()
      } finally {
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Erreur export RGPD:', error)
      showError('Erreur lors de l\'export')
    } finally {
      setExportingData(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') return

    setLoading(true)
    try {
      // Note: La suppression de compte nécessite une API dédiée
      showSuccess('Pour supprimer votre compte, contactez support@petanquepro.fr')
      setShowDeleteModal(false)
      setDeleteConfirmation('')
    } catch (error) {
      console.error('Erreur suppression:', error)
      showError('Erreur lors de la suppression du compte')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30">
      {/* Particules animées en arrière-plan */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-green-200 to-emerald-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-40 right-40 w-80 h-80 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className={`mb-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <button
            onClick={() => router.push('/dashboard')}
            className="mb-6 inline-flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-white/50 rounded-xl transition-all"
          >
            {Icons.back}
            <span>Retour au dashboard</span>
          </button>

          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-2">
            Paramètres
          </h1>
          <p className="text-gray-600">Gérez votre compte et vos préférences</p>
        </div>

        {/* Section Mon Compte */}
        <div className={`mb-6 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '100ms' }}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl rounded-3xl"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 overflow-hidden">
              <div className="p-6 border-b border-gray-100/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  {Icons.user}
                  <span>Mon Compte</span>
                </h2>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-gray-50/50 to-white/50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg text-green-600">
                      {Icons.user}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium text-gray-900">{user?.email}</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-green-100 text-green-600 text-xs font-medium rounded-full flex items-center space-x-1">
                    {Icons.check}
                    <span>Vérifié</span>
                  </span>
                </div>

                <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-gray-50/50 to-white/50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg text-blue-600">
                      {Icons.organization}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Organisation</p>
                      <p className="font-medium text-gray-900">{organization?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-3 px-4 bg-gradient-to-r from-gray-50/50 to-white/50 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg text-purple-600">
                      {Icons.calendar}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Membre depuis</p>
                      <p className="font-medium text-gray-900">
                        {new Date(user?.created_at || '').toLocaleDateString('fr-FR', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section Mon Plan */}
        <div className={`mb-6 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '200ms' }}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl rounded-3xl"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 overflow-hidden">
              <div className="p-6 border-b border-gray-100/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  {Icons.crown}
                  <span>Mon Plan</span>
                </h2>
              </div>

              <div className="p-6">
                {isPremium ? (
                  <div className="relative overflow-hidden bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 rounded-2xl p-6">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-yellow-300/20 to-orange-300/20 rounded-full -translate-y-16 translate-x-16"></div>

                    <div className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-2xl font-bold text-gray-900">Essentiel</span>
                            <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold rounded-full">
                              ACTIF
                            </span>
                          </div>
                          <p className="text-gray-600">Toutes les fonctionnalités débloquées</p>
                        </div>
                        <div className="text-yellow-500">
                          {Icons.infinity}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-green-500">{Icons.check}</span>
                          <span className="text-gray-700">Tournois illimités</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-green-500">{Icons.check}</span>
                          <span className="text-gray-700">Export PDF et partage</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-green-500">{Icons.check}</span>
                          <span className="text-gray-700">Historique des tournois</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-4">
                      {Icons.sparkles}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Plan Gratuit</h3>
                    <p className="text-gray-600 mb-6">1 tournoi, 8 équipes max — Passez à Essentiel pour tout débloquer</p>
                    <button
                      onClick={() => router.push('/dashboard?upgrade=true')}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all transform hover:scale-105"
                    >
                      Voir les plans - à partir de 9,99€/an
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section Personnalisation Club (Club uniquement) */}
        {isClub && (
          <div className={`mb-6 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '250ms' }}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl rounded-3xl"></div>
              <div className="relative bg-white/60 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 overflow-hidden">
                <div className="p-6 border-b border-gray-100/50">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                    <svg className="w-5 h-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20"><path d="M4 2a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V4a2 2 0 00-2-2H4zm0 2h12v3H4V4zm0 5h5v7H4V9zm7 0h5v7h-5V9z"/></svg>
                    <span>Personnalisation Club</span>
                    <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">CLUB</span>
                  </h2>
                </div>

                <div className="p-6 space-y-5">
                  {/* Nom du club */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du club</label>
                    <input
                      type="text"
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      placeholder={organization?.name || 'Mon Club de Pétanque'}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white"
                    />
                  </div>

                  {/* Logo URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">URL du logo</label>
                    <input
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://exemple.com/logo.png"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all bg-white"
                    />
                    {logoUrl && (
                      <div className="mt-2 flex items-center gap-3">
                        <img
                          src={logoUrl}
                          alt="Logo preview"
                          className="w-12 h-12 rounded-lg object-contain border border-gray-200"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                        />
                        <span className="text-xs text-gray-500">Aperçu du logo</span>
                      </div>
                    )}
                  </div>

                  {/* Couleurs */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur principale</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={primaryColor}
                          onChange={(e) => setPrimaryColor(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur secondaire</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={secondaryColor}
                          onChange={(e) => setSecondaryColor(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="p-4 rounded-xl border border-gray-200" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)` }}>
                    <p className="text-sm text-gray-500 mb-2">Aperçu</p>
                    <div className="flex items-center gap-3">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Logo" className="w-10 h-10 rounded-lg object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
                          {(clubName || organization?.name || 'C').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-bold" style={{ color: primaryColor }}>{clubName || organization?.name || 'Mon Club'}</p>
                        <p className="text-xs text-gray-500">Pétanque Pro</p>
                      </div>
                    </div>
                  </div>

                  {/* Save button */}
                  <button
                    onClick={handleSaveCustomization}
                    disabled={savingCustomization}
                    className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium hover:shadow-lg transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {savingCustomization ? (
                      <>{Icons.loader} <span>Sauvegarde...</span></>
                    ) : (
                      <><span>{Icons.check}</span> <span>Sauvegarder la personnalisation</span></>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section Mes Données */}
        <div className={`mb-6 transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '300ms' }}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl rounded-3xl"></div>
            <div className="relative bg-white/60 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 overflow-hidden">
              <div className="p-6 border-b border-gray-100/50">
                <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                  {Icons.archive}
                  <span>Mes Données</span>
                </h2>
              </div>

              <div className="p-6 space-y-3">
                <button
                  onClick={handleExportTournois}
                  disabled={exportingData}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg text-blue-600 group-hover:scale-110 transition-transform">
                      {Icons.download}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Exporter mes tournois</p>
                      <p className="text-sm text-gray-600">Téléchargez tous vos tournois au format JSON</p>
                    </div>
                  </div>
                  {exportingData ? Icons.loader : Icons.arrow}
                </button>

                <button
                  onClick={handleExportRGPD}
                  disabled={exportingData}
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-xl transition-all group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-white rounded-lg text-purple-600 group-hover:scale-110 transition-transform">
                      {Icons.archive}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-gray-900">Télécharger toutes mes données</p>
                      <p className="text-sm text-gray-600">Conformité RGPD - Export complet</p>
                    </div>
                  </div>
                  {exportingData ? Icons.loader : Icons.arrow}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section Fermer mon compte */}
        <div className={`transition-all duration-1000 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '400ms' }}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100/80 to-gray-50/40 backdrop-blur-xl rounded-3xl"></div>
            <div className="relative bg-gray-50/60 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-700 mb-3">Fermer mon compte</h2>
                <p className="text-sm text-gray-600 mb-4">
                  Vous souhaitez nous quitter ? Vos données seront conservées 30 jours pour récupération.
                  {isPremium && (
                    <span className="block mt-2 text-green-600 font-medium">
                      ✓ Votre abonnement sera conservé avec votre email
                    </span>
                  )}
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                >
                  Fermer définitivement mon compte
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de suppression */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-100 to-orange-100 rounded-full mb-4">
                  {Icons.logout}
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Fermer votre compte ?
                </h2>
                <p className="text-gray-600">
                  Cette action est irréversible. Vos données seront supprimées après 30 jours.
                </p>
                {isPremium && (
                  <div className="mt-4 p-3 bg-green-50 rounded-xl">
                    <p className="text-sm text-green-800">
                      <strong>Note :</strong> Votre abonnement sera conservé. Si vous vous réinscrivez avec {user?.email}, votre plan sera restauré automatiquement.
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tapez <span className="font-bold">SUPPRIMER</span> pour confirmer
                  </label>
                  <input
                    type="text"
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder="SUPPRIMER"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowDeleteModal(false)
                      setDeleteConfirmation('')
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmation !== 'SUPPRIMER' || loading}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        {Icons.loader}
                        <span className="ml-2">Suppression...</span>
                      </span>
                    ) : (
                      'Supprimer définitivement'
                    )}
                  </button>
                </div>
              </div>
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
          animation: slideUp 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}