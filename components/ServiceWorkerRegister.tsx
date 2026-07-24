'use client'

import { useEffect } from 'react'

// Enregistre le service worker (PWA) côté client, uniquement en production
// et si le navigateur le supporte. Silencieux : aucune UI, aucun blocage.
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* échec silencieux : l'app reste utilisable sans SW */
      })
    }
    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])
  return null
}
