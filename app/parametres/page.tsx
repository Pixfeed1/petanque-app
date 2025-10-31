'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../providers/AuthProvider'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Icônes SVG élégantes
const Icons = {
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  organization: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  crown: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M10 2l2.5 5 5.5 1-4 4 1 5.5L10 14l-5 3.5 1-5.5-4-4 5.5-1L10 2z" />
    </svg>
  ),
  infinity: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4c1.1 0 2.08-.45 2.8-1.17l.89-.89a4 4 0 105.66-5.66l-.89.89A3.99 3.99 0 0016 8c-2.21 0-4 1.79-4 4zm0 0h.01" />
    </svg>
  ),
  download: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  archive: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  sparkles: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
    </svg>
  ),
  loader: (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  back: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

export default function Parametres() {
  const router = useRouter()
  const { user, organization, isPremium } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [exportingData, setExportingData] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleExportTournois = async () => {
    setExportingData(true)
    try {
      // Récupérer tous les tournois
      const { data: tournois } = await supabase
        .from('tournois')
        .select('*, equipes(*, equipes_joueurs(*, joueur:joueurs(*))), matches(*)')
        .eq('org_id', organization?.id)

      // Créer un blob JSON
      const dataStr = JSON.stringify(tournois, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      // Télécharger
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tournois-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erreur export:', error)
      alert('Erreur lors de l\'export')
    } finally {
      setExportingData(false)
    }
  }

  const handleExportRGPD = async () => {
    setExportingData(true)
    try {
      // Récupérer toutes les données de l'utilisateur
      const allData = {
        user: {
          email: user?.email,
          id: user?.id,
          created_at: user?.created_at
        },
        organization: organization,
        tournois: await supabase.from('tournois').select('*').eq('org_id', organization?.id),
        joueurs: await supabase.from('joueurs').select('*').eq('org_id', organization?.id)
      }

      // Créer un blob JSON
      const dataStr = JSON.stringify(allData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      // Télécharger
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `mes-donnees-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erreur export RGPD:', error)
      alert('Erreur lors de l\'export')
    } finally {
      setExportingData(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'SUPPRIMER') return

    setLoading(true)
    try {
      // Si Premium, sauvegarder l'achat
      if (isPremium) {
        await supabase
          .from('premium_purchases')
          .upsert({
            email: user?.email,
            purchased_at: new Date().toISOString()
          })
      }

      // Supprimer l'utilisateur
      const { error } = await supabase.auth.admin.deleteUser(user?.id)
      if (error) throw error

      // Déconnexion et redirection
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression du compte')
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
                            <span className="text-2xl font-bold text-gray-900">Premium</span>
                            <span className="px-2 py-1 bg-gradient-to-r from-yellow-400 to-orange-400 text-white text-xs font-bold rounded-full">
                              À VIE
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
                          <span className="text-gray-700">Sans publicité</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-green-500">{Icons.check}</span>
                          <span className="text-gray-700">Support prioritaire</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="text-green-500">{Icons.check}</span>
                          <span className="text-gray-700">Mises à jour gratuites</span>
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
                    <p className="text-gray-600 mb-6">Passez à Premium pour supprimer les publicités</p>
                    <button
                      onClick={() => router.push('/dashboard?upgrade=true')}
                      className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:shadow-lg transition-all transform hover:scale-105"
                    >
                      Passer à Premium - 4,99€
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

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
                      ✓ Votre statut Premium sera conservé avec votre email
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
                      <strong>Note Premium :</strong> Votre achat sera conservé. Si vous vous réinscrivez avec {user?.email}, votre statut Premium sera restauré automatiquement.
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