'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'
import { getConsent, hasConsent, CONSENT_EVENT } from '@/lib/consent'

// Charge les scripts tiers (mesure d'audience, publicité) UNIQUEMENT si :
//  1) l'identifiant correspondant est configuré en env, ET
//  2) l'utilisateur a consenti à la catégorie.
// Tant qu'aucun identifiant n'est défini, ce composant ne rend RIEN (inerte).
//
// ⚠️ Activer un script tiers nécessite aussi d'autoriser son domaine dans la CSP
// (next.config.ts) — voir docs. Par défaut la CSP reste stricte (script-src 'self').
export function ConsentedScripts() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID
  const adsenseId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
  const [, force] = useState(0)

  // Recharger la décision quand le consentement change (bandeau).
  useEffect(() => {
    const h = () => force(n => n + 1)
    window.addEventListener(CONSENT_EVENT, h)
    return () => window.removeEventListener(CONSENT_EVENT, h)
  }, [])

  // Rien tant que l'utilisateur n'a pas répondu.
  if (getConsent() === null) return null

  return (
    <>
      {gaId && hasConsent('analytics') && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
      {adsenseId && hasConsent('ads') && (
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseId}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
      )}
    </>
  )
}
