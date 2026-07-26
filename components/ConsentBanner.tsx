'use client'

import { useEffect, useState } from 'react'
import { getConsent, setConsent, CONSENT_REOPEN_EVENT } from '@/lib/consent'

// Bandeau de consentement RGPD. S'affiche tant que l'utilisateur n'a pas répondu.
// Choix : tout accepter / tout refuser / personnaliser (analytics, publicité).
export function ConsentBanner() {
  const [visible, setVisible] = useState(false)
  const [custom, setCustom] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [ads, setAds] = useState(false)

  useEffect(() => {
    // Ne rien afficher tant que le choix n'est pas connu (évite un flash au SSR).
    if (getConsent() === null) setVisible(true)
    // Rouvre le bandeau sur demande (bouton « gérer mes cookies »), en pré-remplissant.
    const reopen = () => {
      const c = getConsent()
      setAnalytics(!!c?.analytics); setAds(!!c?.ads); setCustom(true); setVisible(true)
    }
    window.addEventListener(CONSENT_REOPEN_EVENT, reopen)
    return () => window.removeEventListener(CONSENT_REOPEN_EVENT, reopen)
  }, [])

  if (!visible) return null

  const decide = (a: boolean, b: boolean) => { setConsent({ analytics: a, ads: b }); setVisible(false) }

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Gestion du consentement aux cookies"
      className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4"
    >
      <div className="mx-auto max-w-3xl bg-white border border-petanque-sable-bord rounded-2xl shadow-lg p-5">
        <p className="text-sm text-petanque-vert-fonce font-medium mb-1">On respecte ta vie privée 🍪</p>
        <p className="text-sm text-petanque-bois leading-relaxed mb-4">
          On utilise des cookies essentiels au fonctionnement du site. Avec ton accord, on peut aussi
          mesurer l&apos;audience et afficher de la publicité. Tu peux changer d&apos;avis à tout moment.
          {' '}<a href="/legal/privacy" className="text-petanque-vert underline underline-offset-2">En savoir plus</a>.
        </p>

        {custom && (
          <div className="mb-4 space-y-2">
            <label className="flex items-center gap-3 text-sm text-petanque-vert-fonce">
              <input type="checkbox" checked disabled className="w-4 h-4 accent-petanque-vert" />
              Essentiels <span className="text-petanque-bois">(toujours actifs)</span>
            </label>
            <label className="flex items-center gap-3 text-sm text-petanque-vert-fonce cursor-pointer">
              <input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)} className="w-4 h-4 accent-petanque-vert" />
              Mesure d&apos;audience
            </label>
            <label className="flex items-center gap-3 text-sm text-petanque-vert-fonce cursor-pointer">
              <input type="checkbox" checked={ads} onChange={e => setAds(e.target.checked)} className="w-4 h-4 accent-petanque-vert" />
              Publicité
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {!custom ? (
            <>
              <button onClick={() => decide(true, true)}
                className="px-4 py-2.5 rounded-lg bg-petanque-vert text-petanque-sable text-sm font-medium hover:bg-petanque-vert-fonce transition-colors">
                Tout accepter
              </button>
              <button onClick={() => decide(false, false)}
                className="px-4 py-2.5 rounded-lg border border-petanque-sable-bord text-petanque-vert-fonce text-sm font-medium hover:bg-petanque-sable-pale transition-colors">
                Tout refuser
              </button>
              <button onClick={() => setCustom(true)}
                className="px-4 py-2.5 text-sm text-petanque-bois hover:text-petanque-vert-fonce underline underline-offset-2">
                Personnaliser
              </button>
            </>
          ) : (
            <>
              <button onClick={() => decide(analytics, ads)}
                className="px-4 py-2.5 rounded-lg bg-petanque-vert text-petanque-sable text-sm font-medium hover:bg-petanque-vert-fonce transition-colors">
                Enregistrer mes choix
              </button>
              <button onClick={() => decide(false, false)}
                className="px-4 py-2.5 rounded-lg border border-petanque-sable-bord text-petanque-vert-fonce text-sm font-medium hover:bg-petanque-sable-pale transition-colors">
                Tout refuser
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
