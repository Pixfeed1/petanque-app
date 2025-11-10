import React from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// Logo Icon
const LogoIcon = (
  <svg className="w-10 h-10" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="30" fill="url(#metalGradient)" stroke="#5a6978" strokeWidth="2"/>
    <circle cx="26" cy="26" r="3" fill="#ffffff" opacity="0.8"/>
    <circle cx="38" cy="38" r="2" fill="#2d3748" opacity="0.3"/>
    <circle cx="40" cy="28" r="2" fill="#2d3748" opacity="0.3"/>
    <defs>
      <radialGradient id="metalGradient">
        <stop offset="0%" stopColor="#a8b2c3"/>
        <stop offset="100%" stopColor="#8e9aaf"/>
      </radialGradient>
    </defs>
  </svg>
)

interface FooterProps {
  scrollToSection?: (sectionId: string) => void
}

export default function Footer({ scrollToSection }: FooterProps) {
  const router = useRouter()

  const handleNavigation = (sectionId: string) => {
    if (scrollToSection) {
      scrollToSection(sectionId)
    } else {
      router.push(`/#${sectionId}`)
    }
  }

  return (
    <footer className="bg-gray-900 text-gray-400 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <Link href="/" className="flex items-center space-x-3 mb-4 group">
              {LogoIcon}
              <span className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">
                Pétanque Pro
              </span>
            </Link>
            <p className="text-sm">
              L'application de référence pour organiser vos tournois de pétanque.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Produit</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/features" className="hover:text-white transition">
                  Fonctionnalités
                </Link>
              </li>
              <li>
                <Link href="/modes" className="hover:text-white transition">
                  Modes de jeu
                </Link>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('pricing')}
                  className="hover:text-white transition text-left"
                >
                  Tarifs
                </button>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/guide" className="hover:text-white transition">
                  Guide d'utilisation
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="mailto:support@petanquepro.fr" className="hover:text-white transition">
                  Contact
                </a>
              </li>
              <li>
                <button 
                  onClick={() => handleNavigation('testimonials')} 
                  className="hover:text-white transition text-left"
                >
                  Témoignages
                </button>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/legal/terms" className="hover:text-white transition">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-white transition">
                  Politique de confidentialité
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="hover:text-white transition">
                  Politique des cookies
                </Link>
              </li>
              <li>
                <Link href="/legal/rgpd" className="hover:text-white transition">
                  RGPD
                </Link>
              </li>
              <li>
                <Link href="/legal/mentions" className="hover:text-white transition">
                  Mentions légales
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 pt-8 text-center text-sm">
          <p>
            © 2025 Pétanque Pro - Fait avec ❤️ par{' '}
            <a 
              href="https://pixfeed.net" 
              target="_blank"
              rel="noopener noreferrer follow" 
              className="text-green-400 hover:text-green-300 transition-colors font-medium"
            >
              Pixfeed
            </a>
            {' '}pour les passionnés de pétanque
          </p>
        </div>
      </div>
    </footer>
  )
}