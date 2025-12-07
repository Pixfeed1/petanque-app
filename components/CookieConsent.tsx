// components/CookieConsent.tsx
// Bandeau de consentement cookies RGPD - Style Pétanque Pro
// Conforme RGPD + TCF 2.2

'use client'

import { useState, useEffect, useCallback } from 'react'

interface CookiePreferences {
  essential: boolean      // Toujours true, requis pour le fonctionnement
  analytics: boolean      // Google Analytics, etc.
  advertising: boolean    // Pubs (The Moneytizer, etc.)
  timestamp: number       // Date du consentement
}

const CONSENT_KEY = 'petanque-pro-cookie-consent'
const CONSENT_VERSION = '1.0'

// Récupérer les préférences stockées
function getStoredConsent(): CookiePreferences | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore errors
  }
  return null
}

// Sauvegarder les préférences
function saveConsent(preferences: CookiePreferences) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(preferences))
  } catch {
    // Ignore errors
  }
}

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = getStoredConsent()
    setPreferences(stored)
    setIsLoaded(true)
  }, [])

  const updateConsent = useCallback((newPreferences: Partial<CookiePreferences>) => {
    const updated: CookiePreferences = {
      essential: true,
      analytics: newPreferences.analytics ?? false,
      advertising: newPreferences.advertising ?? false,
      timestamp: Date.now()
    }
    saveConsent(updated)
    setPreferences(updated)
  }, [])

  return {
    preferences,
    isLoaded,
    hasConsented: preferences !== null,
    updateConsent,
    canShowAds: preferences?.advertising ?? false,
    canTrackAnalytics: preferences?.analytics ?? false
  }
}

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [tempPrefs, setTempPrefs] = useState({
    analytics: true,
    advertising: true
  })

  useEffect(() => {
    setMounted(true)
    const stored = getStoredConsent()
    if (!stored) {
      // Petit délai pour que la page soit chargée
      setTimeout(() => setShowBanner(true), 500)
    }
  }, [])

  const handleAcceptAll = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: true,
      advertising: true,
      timestamp: Date.now()
    })
    setShowBanner(false)
  }, [])

  const handleRejectAll = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: false,
      advertising: false,
      timestamp: Date.now()
    })
    setShowBanner(false)
  }, [])

  const handleSavePreferences = useCallback(() => {
    saveConsent({
      essential: true,
      analytics: tempPrefs.analytics,
      advertising: tempPrefs.advertising,
      timestamp: Date.now()
    })
    setShowBanner(false)
    setShowDetails(false)
  }, [tempPrefs])

  if (!mounted || !showBanner) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9998] animate-[fadeIn_0.3s_ease-out]" />

      {/* Bandeau */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 animate-[slideUp_0.4s_ease-out]">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Header avec icône */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🍪</span>
                </div>
                <div>
                  <h2 className="text-white font-bold text-lg">Vos préférences de cookies</h2>
                  <p className="text-white/80 text-sm">Pétanque Pro respecte votre vie privée</p>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-6">
              {!showDetails ? (
                // Vue simplifiée
                <>
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et afficher des publicités personnalisées.
                    Vous pouvez accepter tous les cookies ou personnaliser vos préférences.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleAcceptAll}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      ✓ Tout accepter
                    </button>
                    <button
                      onClick={handleRejectAll}
                      className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-all"
                    >
                      Refuser
                    </button>
                    <button
                      onClick={() => setShowDetails(true)}
                      className="flex-1 px-6 py-3 border-2 border-gray-200 text-gray-600 font-semibold rounded-xl hover:border-green-500 hover:text-green-600 transition-all"
                    >
                      Personnaliser
                    </button>
                  </div>
                </>
              ) : (
                // Vue détaillée
                <>
                  <div className="space-y-4 mb-6">
                    {/* Cookies essentiels */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🔒</span>
                          <h3 className="font-semibold text-gray-900">Cookies essentiels</h3>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Requis</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Nécessaires au fonctionnement du site (authentification, sécurité)
                        </p>
                      </div>
                      <div className="w-12 h-7 bg-green-500 rounded-full flex items-center justify-end px-1 cursor-not-allowed opacity-80">
                        <div className="w-5 h-5 bg-white rounded-full shadow" />
                      </div>
                    </div>

                    {/* Cookies analytiques */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📊</span>
                          <h3 className="font-semibold text-gray-900">Cookies analytiques</h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Nous aident à comprendre comment vous utilisez l'application
                        </p>
                      </div>
                      <button
                        onClick={() => setTempPrefs(p => ({ ...p, analytics: !p.analytics }))}
                        className={`w-12 h-7 rounded-full flex items-center px-1 transition-all ${
                          tempPrefs.analytics ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <div className="w-5 h-5 bg-white rounded-full shadow" />
                      </button>
                    </div>

                    {/* Cookies publicitaires */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">📢</span>
                          <h3 className="font-semibold text-gray-900">Cookies publicitaires</h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Permettent d'afficher des publicités pertinentes (finance l'app)
                        </p>
                      </div>
                      <button
                        onClick={() => setTempPrefs(p => ({ ...p, advertising: !p.advertising }))}
                        className={`w-12 h-7 rounded-full flex items-center px-1 transition-all ${
                          tempPrefs.advertising ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'
                        }`}
                      >
                        <div className="w-5 h-5 bg-white rounded-full shadow" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleSavePreferences}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Enregistrer mes choix
                    </button>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="px-6 py-3 text-gray-500 hover:text-gray-700 transition-all"
                    >
                      ← Retour
                    </button>
                  </div>
                </>
              )}

              {/* Lien politique */}
              <p className="text-center text-xs text-gray-400 mt-4">
                En savoir plus dans notre{' '}
                <a href="/confidentialite" className="text-green-600 hover:underline">
                  politique de confidentialité
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  )
}

// Bouton pour rouvrir les préférences (à mettre dans le footer par exemple)
export function CookieSettingsButton({ className = '' }: { className?: string }) {
  const reopenBanner = () => {
    localStorage.removeItem(CONSENT_KEY)
    window.location.reload()
  }

  return (
    <button
      onClick={reopenBanner}
      className={`text-sm text-gray-500 hover:text-green-600 transition-colors ${className}`}
    >
      🍪 Gérer les cookies
    </button>
  )
}
