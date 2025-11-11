'use client'

import { useEffect } from 'react'

interface AdBannerProps {
  /**
   * Type d'annonce (horizontal, vertical, square, responsive)
   */
  variant?: 'horizontal' | 'vertical' | 'square' | 'responsive'

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

  /**
   * Slot AdSense (à configurer dans Google AdSense Dashboard)
   */
  adSlot?: string
}

/**
 * Composant AdBanner pour Google AdSense
 *
 * Ce composant affiche des publicités Google AdSense uniquement pour les utilisateurs gratuits.
 * Les utilisateurs Premium ne voient jamais de publicité.
 *
 * Usage:
 * ```tsx
 * <AdBanner
 *   variant="horizontal"
 *   userPlan={userPlan}
 *   showOnlyForFree={true}
 * />
 * ```
 */
export default function AdBanner({
  variant = 'responsive',
  showOnlyForFree = true,
  userPlan = 'free',
  className = '',
  adSlot
}: AdBannerProps) {

  // Ne pas afficher pour les utilisateurs Premium
  if (showOnlyForFree && userPlan === 'premium') {
    return null
  }

  // Dimensions selon le variant
  const dimensions = {
    horizontal: { width: 728, height: 90 }, // Leaderboard
    vertical: { width: 160, height: 600 }, // Wide Skyscraper
    square: { width: 300, height: 250 }, // Medium Rectangle
    responsive: { width: '100%', height: 'auto' }
  }

  const { width, height } = dimensions[variant]

  useEffect(() => {
    // Charger le script AdSense si pas déjà chargé
    if (typeof window !== 'undefined' && !document.querySelector('script[src*="adsbygoogle"]')) {
      const script = document.createElement('script')
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
      script.async = true
      script.crossOrigin = 'anonymous'

      // Client AdSense ID (à configurer via variable d'environnement)
      const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID
      if (clientId) {
        script.setAttribute('data-ad-client', clientId)
      }

      document.head.appendChild(script)
    }

    // Initialiser l'annonce
    try {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'annonce:', error)
    }
  }, [])

  // Styles de base
  const baseStyles = 'overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50'

  return (
    <div
      className={`${baseStyles} ${className}`}
      style={{
        minWidth: typeof width === 'number' ? width : 300,
        minHeight: typeof height === 'number' ? height : 250
      }}
    >
      {/* Placeholder si AdSense n'est pas configuré */}
      {!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID ? (
        <div className="flex items-center justify-center h-full p-4 text-center">
          <div className="space-y-2">
            <div className="text-gray-400 dark:text-gray-500 text-sm font-medium">
              Publicité
            </div>
            <div className="text-xs text-gray-300 dark:text-gray-600">
              Passez à Premium pour supprimer les publicités
            </div>
          </div>
        </div>
      ) : (
        // Google AdSense
        <ins
          className="adsbygoogle"
          style={{
            display: 'block',
            width: typeof width === 'string' ? width : `${width}px`,
            height: typeof height === 'string' ? height : `${height}px`
          }}
          data-ad-client={process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}
          data-ad-slot={adSlot || ''}
          data-ad-format={variant === 'responsive' ? 'auto' : undefined}
          data-full-width-responsive={variant === 'responsive' ? 'true' : undefined}
        />
      )}
    </div>
  )
}
