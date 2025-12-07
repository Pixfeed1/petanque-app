// components/AdBanner.tsx
// Composant publicitaire - En attente de validation The Moneytizer
// N'affiche les pubs QUE pour les utilisateurs gratuits ET avec consentement

'use client'

import { useEffect, useState } from 'react'
import { useCookieConsent } from './CookieConsent'

interface AdBannerProps {
  /**
   * Afficher uniquement pour les utilisateurs gratuits
   */
  showOnlyForFree?: boolean

  /**
   * Plan de l'utilisateur
   */
  userPlan?: string

  /**
   * Classe CSS personnalisée
   */
  className?: string
}

/**
 * Composant AdBanner - En attente The Moneytizer
 *
 * TODO: Ajouter le code The Moneytizer une fois validé
 *
 * Fonctionnalités:
 * - N'affiche RIEN si l'utilisateur est Premium
 * - N'affiche RIEN si l'utilisateur n'a pas consenti aux cookies publicitaires
 * - Prêt pour intégration The Moneytizer
 */
export default function AdBanner({
  showOnlyForFree = true,
  userPlan = 'free',
  className = ''
}: AdBannerProps) {
  const [mounted, setMounted] = useState(false)
  const { canShowAds, isLoaded } = useCookieConsent()

  // Ne pas afficher pour les utilisateurs Premium
  const isPremium = userPlan === 'premium' || userPlan === 'pro'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Ne pas afficher pour les utilisateurs Premium
  if (showOnlyForFree && isPremium) {
    return null
  }

  // SSR: ne rien rendre côté serveur
  if (!mounted || !isLoaded) {
    return null
  }

  // Ne pas afficher si l'utilisateur n'a pas consenti aux cookies publicitaires
  if (!canShowAds) {
    return null
  }

  // TODO: Remplacer par le code The Moneytizer une fois validé
  // Pour l'instant, ne rien afficher
  return null
}

// Export du composant par défaut avec alias pour compatibilité
export { AdBanner as AdBannerResponsive }
export { AdBanner as AdBannerHorizontal }
export { AdBanner as AdBannerSquare }
