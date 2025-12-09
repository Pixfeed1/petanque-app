// components/CookieConsent.tsx
// Bandeau de consentement cookies RGPD - CMP TCF 2.2 fonctionnelle
// Compatible avec The Moneytizer et autres vendors IAB

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Settings, Lock, Chart, Bell, Check } from './Icons'
import { TCModel, TCString } from '@iabtcf/core'

// ============================================
// CONFIGURATION TCF 2.2
// ============================================

// Vendor IDs requis par The Moneytizer
const MONEYTIZER_VENDOR_IDS = [
  2, 11, 12, 16, 21, 25, 39, 40, 50, 68, 71, 73, 76, 87, 91, 128, 129, 142,
  156, 161, 238, 253, 254, 264, 284, 316, 382, 423, 469, 565, 655, 755, 776,
  793, 990, 32, 45, 52, 81, 10, 114, 164, 42, 13, 259, 132, 72, 724, 62, 69,
  639, 241, 108, 28, 617, 511, 816, 138, 606, 436, 80, 799, 90, 410, 780, 666,
  24, 781, 737, 210, 610, 31, 157, 61, 301, 380, 244, 687, 95, 1028, 1135, 231,
  1132, 358, 1134, 36, 111, 276, 1111, 58, 131, 97, 148, 779, 1148, 918, 561,
  1165, 285, 1043, 1083, 1288, 937, 602, 1408
]

// CMP Info (ID 0 = non-enregistré, mais fonctionnel)
const CMP_ID = 0
const CMP_VERSION = 1

const CONSENT_KEY = 'petanque-pro-cookie-consent'
const TC_STRING_KEY = 'petanque-pro-tc-string'

// ============================================
// TYPES
// ============================================

interface CookiePreferences {
  essential: boolean
  analytics: boolean
  advertising: boolean
  timestamp: number
}

interface TCFApiCallback {
  (tcData: TCData | null, success: boolean): void
}

interface TCData {
  tcString: string
  tcfPolicyVersion: number
  cmpId: number
  cmpVersion: number
  gdprApplies: boolean
  eventStatus: string
  cmpStatus: string
  listenerId?: number
  isServiceSpecific: boolean
  useNonStandardStacks: boolean
  purposeOneTreatment: boolean
  publisherCC: string
  purpose: {
    consents: Record<number, boolean>
    legitimateInterests: Record<number, boolean>
  }
  vendor: {
    consents: Record<number, boolean>
    legitimateInterests: Record<number, boolean>
  }
}

// ============================================
// TCF API IMPLEMENTATION
// ============================================

let tcModel: TCModel | null = null
let tcString: string = ''
const eventListeners: Map<number, TCFApiCallback> = new Map()
let listenerIdCounter = 0

function createTCModel(acceptAll: boolean): TCModel {
  const model = new TCModel()

  model.cmpId = CMP_ID
  model.cmpVersion = CMP_VERSION
  model.isServiceSpecific = true
  model.publisherCountryCode = 'FR'

  if (acceptAll) {
    // Accepter tous les purposes
    for (let i = 1; i <= 10; i++) {
      model.purposeConsents.set(i)
      model.purposeLegitimateInterests.set(i)
    }

    // Accepter tous les vendors The Moneytizer
    MONEYTIZER_VENDOR_IDS.forEach(id => {
      model.vendorConsents.set(id)
      model.vendorLegitimateInterests.set(id)
    })
  }

  return model
}

function generateTCString(model: TCModel): string {
  try {
    return TCString.encode(model)
  } catch {
    console.warn('Erreur génération TC String')
    return ''
  }
}

function getTCData(tcStr: string, listenerId?: number): TCData {
  const purposeConsents: Record<number, boolean> = {}
  const purposeLI: Record<number, boolean> = {}
  const vendorConsents: Record<number, boolean> = {}
  const vendorLI: Record<number, boolean> = {}

  if (tcModel) {
    for (let i = 1; i <= 10; i++) {
      purposeConsents[i] = tcModel.purposeConsents.has(i)
      purposeLI[i] = tcModel.purposeLegitimateInterests.has(i)
    }

    MONEYTIZER_VENDOR_IDS.forEach(id => {
      vendorConsents[id] = tcModel?.vendorConsents.has(id) ?? false
      vendorLI[id] = tcModel?.vendorLegitimateInterests.has(id) ?? false
    })
  }

  return {
    tcString: tcStr,
    tcfPolicyVersion: 4,
    cmpId: CMP_ID,
    cmpVersion: CMP_VERSION,
    gdprApplies: true,
    eventStatus: tcStr ? 'tcloaded' : 'cmpuishown',
    cmpStatus: 'loaded',
    listenerId,
    isServiceSpecific: true,
    useNonStandardStacks: false,
    purposeOneTreatment: false,
    publisherCC: 'FR',
    purpose: {
      consents: purposeConsents,
      legitimateInterests: purposeLI
    },
    vendor: {
      consents: vendorConsents,
      legitimateInterests: vendorLI
    }
  }
}

function notifyListeners(tcStr: string) {
  eventListeners.forEach((callback, listenerId) => {
    try {
      callback(getTCData(tcStr, listenerId), true)
    } catch (e) {
      console.warn('TCF listener error:', e)
    }
  })
}

// API __tcfapi globale
function initTCFAPI() {
  if (typeof window === 'undefined') return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const win = window as any

  // Créer la queue si elle n'existe pas
  const queue = win.__tcfapi?.q || []

  win.__tcfapi = function(
    command: string,
    version: number,
    callback: TCFApiCallback,
    parameter?: number | number[]
  ) {
    switch (command) {
      case 'getTCData':
        callback(getTCData(tcString), true)
        break

      case 'ping':
        callback({
          gdprApplies: true,
          cmpLoaded: true,
          cmpStatus: 'loaded',
          displayStatus: tcString ? 'hidden' : 'visible',
          apiVersion: '2.2',
          cmpVersion: CMP_VERSION,
          cmpId: CMP_ID,
          gvlVersion: 0,
          tcfPolicyVersion: 4
        } as unknown as TCData, true)
        break

      case 'addEventListener':
        const listenerId = ++listenerIdCounter
        eventListeners.set(listenerId, callback)
        callback(getTCData(tcString, listenerId), true)
        break

      case 'removeEventListener':
        if (typeof parameter === 'number') {
          eventListeners.delete(parameter)
          callback(null, true)
        }
        break

      default:
        callback(null, false)
    }
  }

  // Traiter la queue
  queue.forEach((args: unknown[]) => {
    win.__tcfapi(...args)
  })
}

// ============================================
// STORAGE
// ============================================

function getStoredConsent(): CookiePreferences | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch {
    // Ignore
  }
  return null
}

function getStoredTCString(): string {
  if (typeof window === 'undefined') return ''
  try {
    return localStorage.getItem(TC_STRING_KEY) || ''
  } catch {
    return ''
  }
}

function saveConsent(preferences: CookiePreferences, tcStr: string) {
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(preferences))
    localStorage.setItem(TC_STRING_KEY, tcStr)

    // Mettre à jour les variables globales
    tcString = tcStr

    // Notifier les listeners
    notifyListeners(tcStr)
  } catch {
    // Ignore
  }
}

// ============================================
// HOOK PUBLIC
// ============================================

export function useCookieConsent() {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const stored = getStoredConsent()
    setPreferences(stored)
    setIsLoaded(true)
  }, [])

  const updateConsent = useCallback((newPreferences: Partial<CookiePreferences>) => {
    const acceptAds = newPreferences.advertising ?? false
    const model = createTCModel(acceptAds)
    tcModel = model
    const tcStr = generateTCString(model)

    const updated: CookiePreferences = {
      essential: true,
      analytics: newPreferences.analytics ?? false,
      advertising: acceptAds,
      timestamp: Date.now()
    }

    saveConsent(updated, tcStr)
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

// ============================================
// COMPOSANT PRINCIPAL
// ============================================

export default function CookieConsent() {
  const [mounted, setMounted] = useState(false)
  const [showBanner, setShowBanner] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [tempPrefs, setTempPrefs] = useState({
    analytics: true,
    advertising: true
  })

  // Initialiser l'API TCF et vérifier le consentement
  useEffect(() => {
    setMounted(true)

    // Initialiser l'API TCF
    initTCFAPI()

    // Restaurer le TC String existant
    const storedTCString = getStoredTCString()
    if (storedTCString) {
      tcString = storedTCString
      try {
        tcModel = TCString.decode(storedTCString)
      } catch {
        tcModel = null
      }
    }

    // Vérifier si on doit afficher le bandeau
    const stored = getStoredConsent()
    if (!stored) {
      setTimeout(() => setShowBanner(true), 500)
    } else {
      // Notifier que le consentement est déjà chargé
      notifyListeners(storedTCString)
    }
  }, [])

  const handleAcceptAll = useCallback(() => {
    try {
      const model = createTCModel(true)
      tcModel = model
      const tcStr = generateTCString(model)

      saveConsent({
        essential: true,
        analytics: true,
        advertising: true,
        timestamp: Date.now()
      }, tcStr)
    } catch (e) {
      console.warn('Erreur TCF acceptAll:', e)
    }
    // Toujours fermer le bandeau, même en cas d'erreur
    setShowBanner(false)
  }, [])

  const handleRejectAll = useCallback(() => {
    try {
      const model = createTCModel(false)
      tcModel = model
      const tcStr = generateTCString(model)

      saveConsent({
        essential: true,
        analytics: false,
        advertising: false,
        timestamp: Date.now()
      }, tcStr)
    } catch (e) {
      console.warn('Erreur TCF rejectAll:', e)
    }
    // Toujours fermer le bandeau, même en cas d'erreur
    setShowBanner(false)
  }, [])

  const handleSavePreferences = useCallback(() => {
    try {
      const model = createTCModel(tempPrefs.advertising)

      // Si analytics mais pas advertising, on active quand même certains purposes
      if (tempPrefs.analytics && !tempPrefs.advertising) {
        model.purposeConsents.set(1) // Storage
        model.purposeConsents.set(7) // Measure ad performance
        model.purposeConsents.set(8) // Measure content performance
        model.purposeConsents.set(9) // Market research
      }

      tcModel = model
      const tcStr = generateTCString(model)

      saveConsent({
        essential: true,
        analytics: tempPrefs.analytics,
        advertising: tempPrefs.advertising,
        timestamp: Date.now()
      }, tcStr)
    } catch (e) {
      console.warn('Erreur TCF savePreferences:', e)
    }
    // Toujours fermer le bandeau, même en cas d'erreur
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
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <Settings className="w-6 h-6 text-white" />
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
                <>
                  <p className="text-gray-600 mb-6 text-sm leading-relaxed">
                    Nous utilisons des cookies pour améliorer votre expérience, analyser le trafic et afficher des publicités personnalisées.
                    Vous pouvez accepter tous les cookies ou personnaliser vos préférences.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleAcceptAll}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Tout accepter
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
                <>
                  <div className="space-y-4 mb-6">
                    {/* Cookies essentiels */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Lock className="w-5 h-5 text-green-600" />
                          <h3 className="font-semibold text-gray-900">Cookies essentiels</h3>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Requis</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 ml-7">
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
                          <Chart className="w-5 h-5 text-gray-600" />
                          <h3 className="font-semibold text-gray-900">Cookies analytiques</h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 ml-7">
                          Nous aident à comprendre comment vous utilisez l&apos;application
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
                          <Bell className="w-5 h-5 text-gray-600" />
                          <h3 className="font-semibold text-gray-900">Cookies publicitaires</h3>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">{MONEYTIZER_VENDOR_IDS.length} partenaires</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1 ml-7">
                          Permettent d&apos;afficher des publicités pertinentes (finance l&apos;app)
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
                      Retour
                    </button>
                  </div>
                </>
              )}

              {/* Lien politique */}
              <p className="text-center text-xs text-gray-400 mt-4">
                En savoir plus dans notre{' '}
                <a href="/legal/privacy" className="text-green-600 hover:underline">
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

// ============================================
// BOUTON POUR ROUVRIR LES PRÉFÉRENCES
// ============================================

export function CookieSettingsButton({ className = '' }: { className?: string }) {
  const reopenBanner = () => {
    localStorage.removeItem(CONSENT_KEY)
    localStorage.removeItem(TC_STRING_KEY)
    window.location.reload()
  }

  return (
    <button
      onClick={reopenBanner}
      className={`text-sm text-gray-500 hover:text-green-600 transition-colors flex items-center gap-1 ${className}`}
    >
      <Settings className="w-4 h-4" />
      Gérer les cookies
    </button>
  )
}
