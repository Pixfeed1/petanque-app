'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Footer from './components/footer'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { TrustStrip } from '@/components/landing/TrustStrip'
import { HowItWorks } from '@/components/landing/HowItWorks'
import { ModesPreview } from '@/components/landing/ModesPreview'
import { Testimonials } from '@/components/landing/Testimonials'
import { Pricing } from '@/components/landing/Pricing'
import { FinalCTA } from '@/components/landing/FinalCTA'
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
      description: 'Scores et classements mis à jour en direct via connexion live',
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
      <Navbar />

      <Hero />
      <TrustStrip />

      <HowItWorks />

      <ModesPreview />

      <Testimonials />

      <Pricing />

      <FinalCTA />

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