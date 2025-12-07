// components/AdBanner.tsx
// Composant publicitaire Adsterra - Native Banner
// N'affiche les pubs QUE pour les utilisateurs gratuits

'use client'

import { useEffect, useState, useRef } from 'react'

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

// Configuration Adsterra
const ADSTERRA_SCRIPT_URL = '//pl28208620.effectivegatecpm.com/50de7e48c0a024e33b9bd646300fe77e/invoke.js'
const ADSTERRA_CONTAINER_ID = 'container-50de7e48c0a024e33b9bd646300fe77e'

/**
 * Composant AdBanner pour Adsterra - Native Banner
 *
 * Fonctionnalités:
 * - N'affiche RIEN si l'utilisateur est Premium
 * - Charge le script Adsterra dynamiquement
 * - Gère les erreurs de chargement silencieusement
 *
 * Usage:
 * ```tsx
 * <AdBanner userPlan={userPlan} />
 * ```
 */
export default function AdBanner({
  showOnlyForFree = true,
  userPlan = 'free',
  className = ''
}: AdBannerProps) {
  const [mounted, setMounted] = useState(false)
  const [adLoaded, setAdLoaded] = useState(false)
  const [adError, setAdError] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const scriptLoadedRef = useRef(false)

  // Ne pas afficher pour les utilisateurs Premium
  const isPremium = userPlan === 'premium' || userPlan === 'pro'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    // Ne pas charger si premium ou déjà chargé
    if (!mounted || (showOnlyForFree && isPremium) || scriptLoadedRef.current) {
      return
    }

    const loadAdsterraScript = () => {
      try {
        // Vérifier si le script est déjà chargé
        const existingScript = document.querySelector(`script[src*="effectivegatecpm.com"]`)
        if (existingScript) {
          scriptLoadedRef.current = true
          setAdLoaded(true)
          return
        }

        // Créer et charger le script
        const script = document.createElement('script')
        script.src = ADSTERRA_SCRIPT_URL
        script.async = true
        script.setAttribute('data-cfasync', 'false')

        script.onload = () => {
          scriptLoadedRef.current = true
          setAdLoaded(true)
        }

        script.onerror = () => {
          console.warn('Adsterra script failed to load')
          setAdError(true)
        }

        // Ajouter le script au container
        if (containerRef.current) {
          containerRef.current.appendChild(script)
        }
      } catch (error) {
        console.warn('Adsterra loading error:', error)
        setAdError(true)
      }
    }

    // Petit délai pour s'assurer que le DOM est prêt
    const timer = setTimeout(loadAdsterraScript, 100)

    return () => {
      clearTimeout(timer)
    }
  }, [mounted, isPremium, showOnlyForFree])

  // Ne pas afficher pour les utilisateurs Premium
  if (showOnlyForFree && isPremium) {
    return null
  }

  // Ne pas afficher en cas d'erreur
  if (adError) {
    return null
  }

  // SSR: ne rien rendre côté serveur
  if (!mounted) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={`adsterra-container ${className}`}
    >
      {/* Container Adsterra */}
      <div id={ADSTERRA_CONTAINER_ID}></div>
    </div>
  )
}

// Export du composant par défaut avec alias pour compatibilité
export { AdBanner as AdBannerResponsive }
export { AdBanner as AdBannerHorizontal }
export { AdBanner as AdBannerSquare }
