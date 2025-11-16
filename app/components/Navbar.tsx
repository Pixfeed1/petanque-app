// app/components/Navbar.tsx
// Navbar réutilisable pour toute l'application

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface NavbarProps {
  scrollToSection?: (sectionId: string) => void
  transparent?: boolean
}

// Icônes
const Icons = {
  logo: (
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
  ),
  menu: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  close: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  logout: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  ),
  dashboard: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

export default function Navbar({ scrollToSection, transparent = false }: NavbarProps) {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Erreur vérification utilisateur:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  // Gestion du scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Fonction de déconnexion
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })
      setUser(null)
      router.push('/')
    } catch (error) {
      console.error('Erreur déconnexion:', error)
    }
  }

  // Fonction de navigation vers sections
  const handleSectionClick = (sectionId: string) => {
    if (scrollToSection) {
      scrollToSection(sectionId)
    } else {
      // Si pas sur la homepage, rediriger vers homepage avec hash
      router.push(`/#${sectionId}`)
    }
    setMobileMenuOpen(false)
  }

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      transparent && !scrolled ? 'bg-transparent' : 'bg-white/95 backdrop-blur-md shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div
            onClick={() => router.push('/')}
            className="flex items-center space-x-3 cursor-pointer group"
          >
            {Icons.logo}
            <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Pétanque Pro
            </span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <button
              onClick={() => handleSectionClick('features')}
              className="text-gray-700 hover:text-green-600 transition-colors font-medium"
            >
              Fonctionnalités
            </button>
            <button
              onClick={() => handleSectionClick('modes')}
              className="text-gray-700 hover:text-green-600 transition-colors font-medium"
            >
              Modes de jeu
            </button>
            <button
              onClick={() => handleSectionClick('testimonials')}
              className="text-gray-700 hover:text-green-600 transition-colors font-medium"
            >
              Témoignages
            </button>
            <button
              onClick={() => handleSectionClick('pricing')}
              className="text-gray-700 hover:text-green-600 transition-colors font-medium"
            >
              Tarifs
            </button>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="w-32 h-10 bg-gray-200 animate-pulse rounded-full"></div>
            ) : user ? (
              <>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="flex items-center px-6 py-2.5 text-gray-700 hover:text-white hover:bg-gradient-to-r hover:from-green-600 hover:to-emerald-600 rounded-full transition-all font-medium hover:shadow-lg hover:scale-105"
                >
                  {Icons.dashboard}
                  <span className="ml-2">Dashboard</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full hover:shadow-lg transition-all hover:scale-105"
                >
                  {Icons.logout}
                  <span className="ml-2">Déconnexion</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 transition font-medium"
                >
                  Connexion
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full hover:shadow-lg transition-all hover:scale-105 font-medium"
                >
                  Commencer
                </button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          >
            {mobileMenuOpen ? Icons.close : Icons.menu}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t shadow-xl">
          <div className="px-4 py-6 space-y-4">
            <button
              onClick={() => handleSectionClick('features')}
              className="block w-full text-left py-2 text-gray-700 hover:text-green-600 transition"
            >
              Fonctionnalités
            </button>
            <button
              onClick={() => handleSectionClick('modes')}
              className="block w-full text-left py-2 text-gray-700 hover:text-green-600 transition"
            >
              Modes de jeu
            </button>
            <button
              onClick={() => handleSectionClick('testimonials')}
              className="block w-full text-left py-2 text-gray-700 hover:text-green-600 transition"
            >
              Témoignages
            </button>
            <button
              onClick={() => handleSectionClick('pricing')}
              className="block w-full text-left py-2 text-gray-700 hover:text-green-600 transition"
            >
              Tarifs
            </button>
            <div className="pt-4 space-y-3">
              {user ? (
                <>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="w-full px-6 py-2 bg-green-600 text-white rounded-full"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full px-6 py-2 border border-gray-300 rounded-full hover:bg-gray-50 transition"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full"
                  >
                    Commencer gratuitement
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
