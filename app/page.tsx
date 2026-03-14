'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Footer from './components/footer'
import { Petanque, Menu, Close, Arrow, Check, Star, PlayLarge, Users, Chart, Sparkles, Shield, Clock, Mobile, Dice, Refresh, Logout, Dashboard } from '@/components/Icons'

// Icônes personnalisées professionnelles
const Icons = {
  logo: <Petanque className="w-10 h-10" />,
  menu: <Menu className="w-6 h-6" />,
  close: <Close className="w-6 h-6" />,
  arrow: <Arrow className="w-5 h-5" />,
  check: <Check className="w-5 h-5" />,
  star: <Star className="w-5 h-5" />,
  play: <PlayLarge className="w-20 h-20" />,
  gamepad: <Users className="w-8 h-8" />,
  chart: <Chart className="w-8 h-8" />,
  sparkles: <Sparkles className="w-8 h-8" />,
  shield: <Shield className="w-8 h-8" />,
  clock: <Clock className="w-8 h-8" />,
  mobile: <Mobile className="w-8 h-8" />,
  users: <Users className="w-8 h-8" />,
  dice: <Dice className="w-8 h-8" />,
  refresh: <Refresh className="w-8 h-8" />,
  logout: <Logout className="w-5 h-5" />,
  dashboard: <Dashboard className="w-5 h-5" />
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

  // Charger les avis dynamiques
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/reviews?approved=true&limit=3&order_by=rating')
        if (!response.ok) throw new Error('Erreur chargement avis')

        const data = await response.json()

        // Si au moins 3 avis, utiliser les vrais, sinon garder les hardcodés
        if (data.reviews && data.reviews.length >= 3) {
          setTestimonials(data.reviews)
        }

        // Mettre à jour les stats
        if (data.stats) {
          setReviewsStats({
            average: data.stats.average || 0,
            total: data.stats.total_approved || 0
          })
        }
      } catch (error) {
        console.error('Erreur chargement avis:', error)
        // En cas d'erreur, garder les avis hardcodés
      }
    }

    fetchReviews()
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

  const features = [
    {
      icon: Icons.gamepad,
      title: 'Modes flexibles',
      description: 'Choisi, Mêlée fixe ou tournante avec gestion H/F automatique',
      color: 'from-green-400 to-emerald-600'
    },
    {
      icon: Icons.clock,
      title: 'Temps réel',
      description: 'Classements et stats mis à jour instantanément',
      color: 'from-blue-400 to-cyan-600'
    },
    {
      icon: Icons.sparkles,
      title: 'Tirage intelligent',
      description: 'Poules avec gestion optimale des terrains',
      color: 'from-orange-400 to-amber-600'
    },
    {
      icon: Icons.shield,
      title: 'Règles FIPJP',
      description: 'Validation stricte des scores selon les règles officielles',
      color: 'from-purple-400 to-indigo-600'
    },
    {
      icon: Icons.mobile,
      title: 'Mobile first',
      description: 'Parfait sur smartphone, tablette et ordi',
      color: 'from-teal-400 to-cyan-600'
    }
  ]

  // Témoignages hardcodés (fallback si moins de 3 vrais avis)
  const testimonials_hardcoded = [
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

  // Avis dynamiques (chargés depuis l'API)
  const [testimonials, setTestimonials] = useState(testimonials_hardcoded)
  const [reviewsStats, setReviewsStats] = useState({ average: 0, total: 0 })

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 overflow-x-hidden">
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
              {Icons.logo}
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
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center">
                {Icons.check}
                <span className="ml-2">Version gratuite disponible</span>
              </div>
              <div className="flex items-center">
                {Icons.check}
                <span className="ml-2">Plans à partir de 9,99€/an</span>
              </div>
              <div className="flex items-center">
                {Icons.check}
                <span className="ml-2">Données sécurisées</span>
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
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
            {reviewsStats.total > 0 && (
              <div className="flex items-center justify-center mt-4 space-x-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < Math.round(reviewsStats.average) ? 'text-yellow-400' : 'text-gray-300'}>
                      {Icons.star}
                    </span>
                  ))}
                </div>
                <span className="text-lg font-semibold text-gray-700">
                  {reviewsStats.average.toFixed(1)}/5
                </span>
                <span className="text-gray-500">•</span>
                <span className="text-gray-600">
                  {reviewsStats.total} avis
                </span>
              </div>
            )}
          </div>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8">
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

          {/* Lien vers tous les avis */}
          {reviewsStats.total > 3 && (
            <div className="text-center mt-12">
              <button
                onClick={() => router.push('/avis')}
                className="inline-flex items-center px-6 py-3 bg-white text-green-600 border-2 border-green-600 rounded-full hover:bg-green-600 hover:text-white transition-all font-medium"
              >
                Voir tous les {reviewsStats.total} avis
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Choisissez votre formule
          </h2>
          <p className="text-xl text-gray-600 mb-12">
            Testez gratuitement, puis choisissez le plan adapté à vos besoins
          </p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan Gratuit */}
            <div className="bg-white rounded-3xl shadow-xl p-8 relative">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Gratuit</h3>
                <div className="text-5xl font-bold text-gray-900 mb-2">0€</div>
                <p className="text-gray-600">Pour découvrir</p>
              </div>
              <ul className="space-y-3 text-left mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">1 tournoi</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">8 équipes max par tournoi</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">Tous les modes de jeu</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">Export PDF et Excel</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700">Historique des tournois</span>
                </li>
              </ul>
              <button
                onClick={() => router.push('/login')}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-all font-medium"
              >
                Essayer gratuitement
              </button>
            </div>

            {/* Plan Essentiel */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl shadow-xl p-8 relative border-2 border-green-400">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                RECOMMANDÉ
              </div>

              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Essentiel</h3>
                <div className="text-5xl font-bold text-green-600 mb-2">9,99€</div>
                <p className="text-gray-600">Par an</p>
              </div>
              <ul className="space-y-3 text-left mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700 font-medium">Tout le plan Gratuit</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700 font-medium">Tournois illimités</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700 font-medium">Équipes illimitées</span>
                </li>
              </ul>
              <button
                onClick={() => router.push('/login')}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full hover:shadow-lg transition-all transform hover:scale-105 font-bold"
              >
                Choisir Essentiel
              </button>
            </div>

            {/* Plan Club */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl shadow-xl p-8 relative border-2 border-amber-400">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Club</h3>
                <div className="text-5xl font-bold text-amber-600 mb-2">19,99€</div>
                <p className="text-gray-600">Par an</p>
              </div>
              <ul className="space-y-3 text-left mb-8">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                  <span className="text-gray-700 font-medium">Tout le plan Essentiel</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.star}</span>
                  <span className="text-gray-700 font-bold">Statistiques avancées</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.star}</span>
                  <span className="text-gray-700 font-bold">Personnalisation club</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2 mt-1">{Icons.star}</span>
                  <span className="text-gray-700 font-bold">Règles de tournoi personnalisées</span>
                </li>
              </ul>
              <button
                onClick={() => router.push('/login')}
                className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full hover:shadow-lg transition-all transform hover:scale-105 font-bold"
              >
                Choisir Club
              </button>
            </div>
          </div>
          <p className="mt-8 text-sm text-gray-500">
            Paiement sécurisé par Stripe • Satisfait ou remboursé 30 jours
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
                  Voir les plans
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