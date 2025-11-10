'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Footer from './components/footer'

// Icônes personnalisées professionnelles
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
  arrow: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  star: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  play: (
    <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  ),
  trophy: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0h-2m5-7V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1H9a1 1 0 00-1 1v1.5a.5.5 0 01-.5.5H5a2 2 0 00-2 2v3c0 3.5 2.5 6 5.5 6.5m9 0c3-0.5 5.5-3 5.5-6.5V7a2 2 0 00-2-2h-2.5a.5.5 0 01-.5-.5V3a1 1 0 00-1-1h-2" />
    </svg>
  ),
  chart: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  target: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  shield: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  book: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  mobile: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  ),
  users: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  dice: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zM7 7h.01M7 12h.01M7 17h.01M12 7h.01M12 12h.01M12 17h.01M17 7h.01M17 12h.01M17 17h.01" />
    </svg>
  ),
  refresh: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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

export default function HomePage() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)
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

  // Gestion du scroll pour la navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Animation auto des features
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 6)
    }, 3000)
    return () => clearInterval(interval)
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

  // Fonction de scroll smooth
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setMobileMenuOpen(false)
    }
  }

  // Fonction pour ouvrir la démo (vidéo YouTube ou autre)
  const openDemo = () => {
    // Pour l'instant, on redirige vers la page de login en mode démo
    router.push('/login')
  }

  const features = [
    {
      icon: Icons.trophy,
      title: 'Modes flexibles',
      description: 'Choisi, Mêlée fixe ou tournante avec gestion H/F automatique',
      color: 'from-green-400 to-emerald-600'
    },
    {
      icon: Icons.chart,
      title: 'Temps réel',
      description: 'Classements et stats mis à jour instantanément',
      color: 'from-blue-400 to-cyan-600'
    },
    {
      icon: Icons.target,
      title: 'Tirage intelligent',
      description: 'Poules avec gestion optimale des terrains',
      color: 'from-orange-400 to-amber-600'
    },
    {
      icon: Icons.shield,
      title: 'Double validation',
      description: 'Confirmation des scores par les deux équipes',
      color: 'from-purple-400 to-indigo-600'
    },
    {
      icon: Icons.mobile,
      title: 'Mobile first',
      description: 'Parfait sur smartphone, tablette et ordi',
      color: 'from-teal-400 to-cyan-600'
    }
  ]

  const testimonials = [
    {
      name: 'Jean-Pierre M.',
      role: 'Président club de Marseille',
      content: 'Fini les tableaux Excel ! Cette app a révolutionné nos tournois.',
      rating: 5
    },
    {
      name: 'Marie L.',
      role: 'Organisatrice à Lyon',
      content: 'Simple, efficace, les joueurs adorent suivre leur classement en direct.',
      rating: 5
    },
    {
      name: 'Patrick D.',
      role: 'Arbitre fédéral',
      content: 'Enfin une solution qui respecte vraiment les règles officielles !',
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div 
              onClick={() => router.push('/')}
              className="flex items-center space-x-3 cursor-pointer group"
            >
              <div className="relative">
                {Icons.logo}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Pétanque Pro
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <button 
                onClick={() => scrollToSection('features')}
                className="text-gray-700 hover:text-green-600 transition-colors font-medium"
              >
                Fonctionnalités
              </button>
              <button 
                onClick={() => scrollToSection('modes')}
                className="text-gray-700 hover:text-green-600 transition-colors font-medium"
              >
                Modes de jeu
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="text-gray-700 hover:text-green-600 transition-colors font-medium"
              >
                Témoignages
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
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
                onClick={() => scrollToSection('features')}
                className="block w-full text-left py-2 text-gray-700 hover:text-green-600 transition"
              >
                Fonctionnalités
              </button>
              <button 
                onClick={() => scrollToSection('modes')}
                className="block w-full text-left py-2 text-gray-700 hover:text-green-600 transition"
              >
                Modes de jeu
              </button>
              <button 
                onClick={() => scrollToSection('testimonials')}
                className="block w-full text-left py-2 text-gray-700 hover:text-green-600 transition"
              >
                Témoignages
              </button>
              <button 
                onClick={() => scrollToSection('pricing')}
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

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-green-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-20 left-1/2 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            {/* Title */}
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6">
              Gérez vos tournois de
              <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-2">
                pétanque comme un pro
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10">
              L'application tout-en-un pour organiser, gérer et suivre vos tournois. 
              Simple, puissante et accessible.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button 
                onClick={() => user ? router.push('/dashboard') : router.push('/login')}
                className="group px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-lg rounded-full hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <span className="flex items-center justify-center">
                  {user ? 'Accéder au Dashboard' : 'Commencer gratuitement'}
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
              <button 
                onClick={openDemo}
                className="group px-8 py-4 bg-white text-gray-700 text-lg rounded-full border-2 border-gray-200 hover:border-green-600 hover:text-green-600 transition-all"
              >
                <span className="flex items-center justify-center">
                  {Icons.play}
                  <span className="ml-3">Voir la démo</span>
                </span>
              </button>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center">
                {Icons.check}
                <span className="ml-2">Version gratuite disponible</span>
              </div>
              <div className="flex items-center">
                {Icons.check}
                <span className="ml-2">Sans pub à 4,99€</span>
              </div>
              <div className="flex items-center">
                {Icons.check}
                <span className="ml-2">Données sécurisées</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Mockup */}
          <div className="mt-16 relative">
            <div className="relative mx-auto max-w-5xl">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-1">
                <div className="bg-white rounded-xl p-8">
                  {/* Mockup content avec boule de pétanque */}
                  <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-24 h-24 mx-auto mb-4" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="32" cy="32" r="30" fill="url(#metalGradientLarge)" stroke="#5a6978" strokeWidth="2"/>
                        <circle cx="26" cy="26" r="4" fill="#ffffff" opacity="0.8"/>
                        <circle cx="38" cy="38" r="3" fill="#2d3748" opacity="0.3"/>
                        <circle cx="40" cy="28" r="3" fill="#2d3748" opacity="0.3"/>
                        <defs>
                          <radialGradient id="metalGradientLarge">
                            <stop offset="0%" stopColor="#a8b2c3"/>
                            <stop offset="100%" stopColor="#8e9aaf"/>
                          </radialGradient>
                        </defs>
                      </svg>
                      <p className="text-gray-600 font-medium">Interface de gestion des tournois</p>
                      <div className="mt-6 flex justify-center space-x-2">
                        <div className="w-32 h-2 bg-green-500 rounded-full"></div>
                        <div className="w-20 h-2 bg-gray-300 rounded-full"></div>
                        <div className="w-24 h-2 bg-gray-300 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Tout ce qu'il vous faut
            </h2>
            <p className="text-xl text-gray-600">
              Des fonctionnalités pensées par et pour les organisateurs
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative bg-white rounded-2xl p-6 hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-transparent cursor-pointer"
                onMouseEnter={() => setActiveFeature(index)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity`}></div>
                <div className="relative">
                  <div className="text-green-600 mb-4">{feature.icon}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Game Modes Section */}
      <section id="modes" className="py-20 px-4 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              3 modes de jeu adaptés
            </h2>
            <p className="text-xl text-gray-600">
              Choisissez le format qui convient à votre tournoi
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Mode Choisi */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6">
                {Icons.users}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Mode Choisi</h3>
              <p className="text-gray-600 mb-6">
                Les joueurs forment leurs propres équipes. Idéal pour les tournois entre amis ou clubs.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">Équipes fixes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">Classement par équipe</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">Stratégie d'équipe</span>
                </li>
              </ul>
            </div>

            {/* Mode Mêlée Fixe */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all relative">
              <div className="absolute -top-3 -right-3 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                Populaire
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center text-white mb-6">
                {Icons.dice}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Mêlée Fixe</h3>
              <p className="text-gray-600 mb-6">
                Tirage aléatoire des équipes au début. Les mêmes équipes pour tout le tournoi.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">Équipes aléatoires</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">Mixité H/F équilibrée</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">Esprit de cohésion</span>
                </li>
              </ul>
            </div>

            {/* Mode Mêlée Tournante */}
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white mb-6">
                {Icons.refresh}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Mêlée Tournante</h3>
              <p className="text-gray-600 mb-6">
                Nouvelles équipes à chaque partie. Maximum de rencontres et de fun !
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">Équipes changeantes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">Classement individuel</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">Maximum de variété</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Ils nous font confiance
            </h2>
            <p className="text-xl text-gray-600">
              Découvrez ce que disent les organisateurs
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <span key={i} className="text-yellow-400">{Icons.star}</span>
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                    {testimonial.name[0]}
                  </div>
                  <div className="ml-4">
                    <p className="font-bold text-gray-900">{testimonial.name}</p>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choisissez votre formule
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Gratuit avec publicités ou premium sans pub
          </p>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Version Gratuite */}
            <div className="bg-white rounded-3xl shadow-xl p-8 relative">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Version Gratuite</h3>
                <div className="text-5xl font-bold text-gray-900 mb-2">0€</div>
                <p className="text-gray-600">Avec publicités</p>
              </div>
              <ul className="space-y-3 text-left mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">Toutes les fonctionnalités</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">Tournois illimités</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">Tous les modes de jeu</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">Export PDF et partage</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </span>
                  <span className="text-gray-700">Publicités non intrusives</span>
                </li>
              </ul>
              <button 
                onClick={() => router.push('/login')}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-all font-medium"
              >
                Utiliser gratuitement
              </button>
            </div>

            {/* Version Premium */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-xl p-8 relative border-2 border-green-400">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                RECOMMANDÉ
              </div>
              
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Version Premium</h3>
                <div className="text-5xl font-bold text-green-600 mb-2">4,99€</div>
                <p className="text-gray-600">Paiement unique, à vie</p>
              </div>
              <ul className="space-y-3 text-left mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700 font-medium">Toutes les fonctionnalités</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700 font-medium">Tournois illimités</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700 font-medium">Tous les modes de jeu</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700 font-medium">Export PDF et partage</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.star}</span>
                  <span className="text-gray-700 font-bold">Sans publicité</span>
                </li>
              </ul>
              <button 
                onClick={() => router.push('/login')}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full hover:shadow-lg transition-all transform hover:scale-105 font-bold"
              >
                Acheter la version premium
              </button>
            </div>
          </div>
          <p className="mt-8 text-sm text-gray-500">
            Paiement sécurisé • Satisfaction garantie
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Prêt à révolutionner vos tournois ?
              </h2>
              <p className="text-xl mb-8 text-green-100">
                Rejoignez des milliers d'organisateurs qui ont déjà adopté Pétanque Pro
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                  onClick={() => router.push('/login')}
                  className="px-8 py-4 bg-white text-green-600 text-lg rounded-full hover:shadow-2xl transition-all transform hover:scale-105 font-bold"
                >
                  Essayer gratuitement
                </button>
                <button 
                  onClick={() => router.push('/login')}
                  className="px-8 py-4 bg-transparent text-white text-lg rounded-full border-2 border-white hover:bg-white hover:text-green-600 transition-all"
                >
                  Version premium (4,99€)
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Appel du composant Footer avec la fonction scrollToSection */}
      <Footer scrollToSection={scrollToSection} />

      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  )
}