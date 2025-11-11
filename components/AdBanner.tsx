// components/AdBanner.tsx
// Composant publicitaire conditionnel moderne (2025)
// N'occupe de l'espace QUE si la pub se charge réellement

'use client'

import { useEffect, useState, useRef } from 'react'

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
 * Composant AdBanner pour Google AdSense - Version 2025
 *
 * Fonctionnalités:
 * - N'affiche RIEN si l'utilisateur est Premium
 * - N'affiche RIEN si AdBlock est détecté
 * - N'affiche RIEN si la pub ne se charge pas
 * - N'occupe de l'espace QUE si la pub se charge réellement
 *
 * Usage:
 * ```tsx
 * <AdBanner
 *   variant="horizontal"
 *   userPlan={userPlan}
 *   adSlot="1234567890"
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
  const [adLoaded, setAdLoaded] = useState(false)
  const [adBlocked, setAdBlocked] = useState(false)
  const adContainerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  // Ne pas afficher pour les utilisateurs Premium
  if (showOnlyForFree && userPlan === 'premium') {
    return null
  }

  // Si pas de client ID configuré, ne rien afficher (pas de placeholder)
  if (!process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID) {
    return null
  }

  useEffect(() => {
    let isMounted = true

    const loadAd = async () => {
      try {
        // Charger le script AdSense si pas déjà chargé
        if (!document.querySelector('script[src*="adsbygoogle.js"]')) {
          const script = document.createElement('script')
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID}`
          script.async = true
          script.crossOrigin = 'anonymous'

          script.onerror = () => {
            if (isMounted) {
              setAdBlocked(true)
            }
          }

          document.head.appendChild(script)

          // Attendre que le script se charge
          await new Promise((resolve, reject) => {
            script.onload = resolve
            script.onerror = reject
          })
        }

        // Vérifier si adsbygoogle est disponible (détection AdBlock)
        if (!(window as any).adsbygoogle) {
          if (isMounted) {
            setAdBlocked(true)
          }
          return
        }

        // Initialiser l'annonce
        try {
          ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
        } catch (error) {
          console.warn('AdSense push failed:', error)
          if (isMounted) {
            setAdBlocked(true)
          }
          return
        }

        // Vérifier après un délai si la pub s'est chargée
        timeoutRef.current = setTimeout(() => {
          if (!isMounted) return

          const insElement = adContainerRef.current?.querySelector('ins')

          // Vérifier plusieurs indicateurs de chargement
          const isLoaded =
            insElement?.getAttribute('data-ad-status') === 'filled' ||
            insElement?.getAttribute('data-adsbygoogle-status') === 'done' ||
            (insElement?.innerHTML && insElement.innerHTML.trim().length > 0)

          if (isLoaded) {
            setAdLoaded(true)
          } else {
            // Pub bloquée ou non disponible
            setAdBlocked(true)
          }
        }, 1500) // Délai pour laisser la pub se charger

      } catch (error) {
        console.warn('AdSense loading error:', error)
        if (isMounted) {
          setAdBlocked(true)
        }
      }
    }

    loadAd()

    return () => {
      isMounted = false
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [adSlot])

  // Si AdBlock détecté OU pub non chargée → ne rien afficher (pas d'espace réservé)
  if (adBlocked || !adLoaded) {
    return null
  }

  // Dimensions selon le variant (seulement utilisées pour la pub elle-même)
  const dimensions = {
    horizontal: { width: 728, height: 90 }, // Leaderboard
    vertical: { width: 160, height: 600 }, // Wide Skyscraper
    square: { width: 300, height: 250 }, // Medium Rectangle
    responsive: { width: '100%', height: 'auto' }
  }

  const { width, height } = dimensions[variant]

  // Styles de base - pas de minWidth/minHeight car on ne veut pas réserver d'espace
  const baseStyles = 'overflow-hidden'

  return (
    <div
      ref={adContainerRef}
      className={`${baseStyles} ${className}`}
    >
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
    </div>
  )
}

// Exports de composants pré-configurés pour faciliter l'utilisation

export function AdBannerHorizontal({
  userPlan,
  adSlot,
  className
}: {
  userPlan?: string
  adSlot?: string
  className?: string
}) {
  return (
    <AdBanner
      variant="horizontal"
      userPlan={userPlan}
      adSlot={adSlot}
      className={className}
    />
  )
}

export function AdBannerSquare({
  userPlan,
  adSlot,
  className
}: {
  userPlan?: string
  adSlot?: string
  className?: string
}) {
  return (
    <AdBanner
      variant="square"
      userPlan={userPlan}
      adSlot={adSlot}
      className={className}
    />
  )
}

export function AdBannerResponsive({
  userPlan,
  adSlot,
  className
}: {
  userPlan?: string
  adSlot?: string
  className?: string
}) {
  return (
    <AdBanner
      variant="responsive"
      userPlan={userPlan}
      adSlot={adSlot}
      className={className}
    />
  )
}
