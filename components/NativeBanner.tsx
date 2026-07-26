'use client'

import { useEffect } from 'react'
import { showBanner, hideBanner } from '@/lib/native/ads'

// Affiche une bannière AdMob en bas de l'écran tant que la page qui monte ce
// composant est active. Inerte sur le web (isNative() garde tout). À placer sur
// des pages « de consultation » (pas pendant la saisie d'un score).
export function NativeBanner() {
  useEffect(() => {
    showBanner()
    return () => { hideBanner() }
  }, [])
  return null
}
