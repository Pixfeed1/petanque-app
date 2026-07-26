'use client'

import { useEffect } from 'react'
import { initNative } from '@/lib/native'

// Monte l'intégration native (barre de statut, splash, bouton retour Android) au
// démarrage. Inerte dans un navigateur : initNative() ne fait rien hors app native.
export function NativeBridge() {
  useEffect(() => {
    initNative()
  }, [])
  return null
}
