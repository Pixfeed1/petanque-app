'use client'

import { useState, useEffect } from 'react'
import Footer from '../../components/footer'

// Icônes professionnelles
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
  cookie: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2a10 10 0 0110 10c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2zm0 0v10m0 0l7.071-7.071M12 12l-7.071 7.071M12 12l7.071 7.071M12 12L4.929 4.929" />
      <circle cx="8" cy="8" r="1" fill="currentColor"/>
      <circle cx="16" cy="10" r="1" fill="currentColor"/>
      <circle cx="10" cy="14" r="1" fill="currentColor"/>
      <circle cx="14" cy="16" r="1" fill="currentColor"/>
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  shield: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  ad: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
  ),
  settings: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  toggle: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  clock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  x: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function CookiesPage() {
  const [scrolled, setScrolled] = useState(false)
  const [showPreferences, setShowPreferences] = useState(false)
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Toujours activé
    analytics: false,
    advertising: false
  })

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSavePreferences = () => {
    // Sauvegarder les préférences dans localStorage ou cookies
    localStorage.setItem('cookiePreferences', JSON.stringify(cookiePreferences))
    setShowPreferences(false)
    // Afficher notification de confirmation
    alert('Vos préférences ont été enregistrées')
  }

  const acceptAll = () => {
    setCookiePreferences({
      essential: true,
      analytics: true,
      advertising: true
    })
    handleSavePreferences()
  }

  const rejectNonEssential = () => {
    setCookiePreferences({
      essential: true,
      analytics: false,
      advertising: false
    })
    handleSavePreferences()
  }

  const cookieCategories = [
    {
      id: 'essential',
      name: 'Cookies essentiels',
      icon: Icons.shield,
      description: 'Nécessaires au fonctionnement de l\'application',
      required: true,
      cookies: [
        {
          name: 'session_id',
          provider: 'Pétanque Pro',
          purpose: 'Maintien de votre session de connexion',
          duration: 'Session',
          type: 'HTTP'
        },
        {
          name: 'auth_token',
          provider: 'Supabase',
          purpose: 'Authentification sécurisée',
          duration: '7 jours',
          type: 'HTTP Secure'
        },
        {
          name: 'user_preferences',
          provider: 'Pétanque Pro',
          purpose: 'Mémorisation de vos préférences d\'affichage',
          duration: '1 an',
          type: 'Local Storage'
        },
        {
          name: 'cookie_consent',
          provider: 'Pétanque Pro',
          purpose: 'Enregistrement de votre consentement cookies',
          duration: '1 an',
          type: 'HTTP'
        }
      ]
    },
    {
      id: 'analytics',
      name: 'Cookies analytiques',
      icon: Icons.chart,
      description: 'Nous aident à améliorer l\'application',
      required: false,
      cookies: [
        {
          name: '_ga',
          provider: 'Google Analytics',
          purpose: 'Distinction des utilisateurs uniques',
          duration: '2 ans',
          type: 'HTTP'
        },
        {
          name: '_gid',
          provider: 'Google Analytics',
          purpose: 'Distinction des utilisateurs',
          duration: '24 heures',
          type: 'HTTP'
        },
        {
          name: '_gat',
          provider: 'Google Analytics',
          purpose: 'Limitation du taux de requêtes',
          duration: '1 minute',
          type: 'HTTP'
        },
        {
          name: '_ga_*',
          provider: 'Google Analytics 4',
          purpose: 'Persistance de l\'état de session',
          duration: '2 ans',
          type: 'HTTP'
        }
      ]
    },
    {
      id: 'advertising',
      name: 'Cookies publicitaires',
      icon: Icons.ad,
      description: 'Publicités personnalisées (version gratuite)',
      required: false,
      cookies: [
        {
          name: 'IDE',
          provider: 'Google AdMob',
          purpose: 'Diffusion de publicités ciblées',
          duration: '13 mois',
          type: 'HTTP'
        },
        {
          name: 'DSID',
          provider: 'Google AdMob',
          purpose: 'Identification utilisateur pour publicités',
          duration: '2 semaines',
          type: 'HTTP'
        },
        {
          name: 'test_cookie',
          provider: 'Google AdMob',
          purpose: 'Vérification de support des cookies',
          duration: '15 minutes',
          type: 'HTTP'
        },
        {
          name: '__gads',
          provider: 'Google AdSense',
          purpose: 'Mesure des interactions publicitaires',
          duration: '13 mois',
          type: 'HTTP'
        },
        {
          name: 'FCNEC',
          provider: 'Google',
          purpose: 'Consentement publicitaire',
          duration: '1 an',
          type: 'HTTP'
        }
      ]
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
            <div className="flex items-center space-x-3">
              {Icons.logo}
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Pétanque Pro
              </span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <button className="px-4 py-2 text-gray-700 hover:text-gray-900 transition">
                Accueil
              </button>
              <button 
                onClick={() => setShowPreferences(true)}
                className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full hover:shadow-lg transition-all hover:scale-105"
              >
                Gérer mes cookies
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-amber-50 to-orange-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-6">
            {Icons.cookie}
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Politique de Cookies
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Nous utilisons des cookies pour améliorer votre expérience et vous proposer 
            un service personnalisé. Découvrez comment nous les utilisons et gérez vos préférences.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Qu'est-ce qu'un cookie */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              {Icons.info}
              <span className="ml-3">Qu'est-ce qu'un cookie ?</span>
            </h2>
            <div className="prose prose-gray max-w-none">
              <p className="text-gray-700 mb-4">
                Un cookie est un petit fichier texte déposé sur votre appareil (ordinateur, smartphone, tablette) 
                lors de votre visite sur notre application. Il permet de mémoriser des informations relatives 
                à votre navigation et de vous offrir une expérience personnalisée.
              </p>
              <p className="text-gray-700">
                Les cookies ne contiennent pas d'informations personnelles directement identifiantes 
                mais peuvent être associés à des données stockées sur nos serveurs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Catégories de cookies */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Types de cookies utilisés
          </h2>

          <div className="space-y-8">
            {cookieCategories.map((category) => (
              <div key={category.id} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className={`p-6 ${
                  category.required 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50' 
                    : 'bg-gradient-to-r from-gray-50 to-gray-100'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        category.required 
                          ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' 
                          : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white'
                      }`}>
                        {category.icon}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {category.name}
                        </h3>
                        <p className="text-gray-600">
                          {category.description}
                        </p>
                        {category.required && (
                          <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-sm rounded-full">
                            Toujours actifs
                          </span>
                        )}
                      </div>
                    </div>
                    {!category.required && (
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={cookiePreferences[category.id as keyof typeof cookiePreferences]}
                          onChange={(e) => setCookiePreferences({
                            ...cookiePreferences,
                            [category.id]: e.target.checked
                          })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                      </label>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-4">Cookies de cette catégorie :</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium text-gray-700">Nom</th>
                          <th className="text-left py-2 font-medium text-gray-700">Fournisseur</th>
                          <th className="text-left py-2 font-medium text-gray-700">Finalité</th>
                          <th className="text-left py-2 font-medium text-gray-700">Durée</th>
                          <th className="text-left py-2 font-medium text-gray-700">Type</th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.cookies.map((cookie, index) => (
                          <tr key={index} className="border-b last:border-0">
                            <td className="py-2 font-mono text-xs">{cookie.name}</td>
                            <td className="py-2">{cookie.provider}</td>
                            <td className="py-2 text-gray-600">{cookie.purpose}</td>
                            <td className="py-2">{cookie.duration}</td>
                            <td className="py-2 text-xs text-gray-500">{cookie.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment gérer les cookies */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              {Icons.settings}
              <span className="ml-3">Comment gérer vos cookies ?</span>
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Via notre centre de préférences</h3>
                <p className="text-gray-700 mb-4">
                  Vous pouvez à tout moment modifier vos préférences en cliquant sur le bouton 
                  "Gérer mes cookies" disponible sur toutes les pages de l'application.
                </p>
                <button 
                  onClick={() => setShowPreferences(true)}
                  className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition"
                >
                  Ouvrir le centre de préférences
                </button>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Via votre navigateur</h3>
                <p className="text-gray-700 mb-4">
                  Vous pouvez également configurer votre navigateur pour bloquer ou supprimer les cookies :
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <div>
                      <strong>Chrome :</strong> Paramètres → Confidentialité et sécurité → Cookies
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <div>
                      <strong>Firefox :</strong> Paramètres → Vie privée et sécurité → Cookies
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <div>
                      <strong>Safari :</strong> Préférences → Confidentialité → Cookies
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <div>
                      <strong>Edge :</strong> Paramètres → Confidentialité → Cookies
                    </div>
                  </li>
                </ul>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Attention :</strong> Le blocage de certains cookies peut affecter votre expérience 
                  sur l'application. Les cookies essentiels sont nécessaires au bon fonctionnement du service.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Impact sur la version gratuite */}
      <section className="py-12 px-4 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-orange-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              {Icons.ad}
              <span className="ml-3">Cookies et version gratuite</span>
            </h2>
            
            <div className="space-y-4">
              <p className="text-gray-700">
                La version gratuite de Pétanque Pro est financée par la publicité. 
                Les cookies publicitaires nous permettent de :
              </p>
              
              <ul className="space-y-2">
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">{Icons.check}</span>
                  <span>Afficher des publicités pertinentes pour vous</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">{Icons.check}</span>
                  <span>Limiter le nombre de fois où vous voyez la même publicité</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">{Icons.check}</span>
                  <span>Mesurer l'efficacité des campagnes publicitaires</span>
                </li>
                <li className="flex items-start">
                  <span className="text-orange-500 mr-2 mt-1">{Icons.check}</span>
                  <span>Maintenir l'application gratuite pour tous</span>
                </li>
              </ul>
              
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-4 text-white">
                <p className="font-semibold mb-2">Envie de vous débarrasser des publicités ?</p>
                <p className="text-sm mb-3">
                  Passez à la version Premium pour seulement 4,99€ (paiement unique) 
                  et profitez de l'application sans publicité ni cookies publicitaires.
                </p>
                <button className="px-6 py-2 bg-white text-green-600 rounded-lg hover:bg-gray-100 transition font-medium">
                  Passer au Premium
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Des questions sur les cookies ?
            </h2>
            <p className="mb-6">
              Si vous avez des questions concernant notre utilisation des cookies ou 
              si vous souhaitez exercer vos droits, n'hésitez pas à nous contacter.
            </p>
            <a 
              href="mailto:support@petanquepro.fr" 
              className="inline-flex items-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-medium"
            >
              support@petanquepro.fr
            </a>
          </div>
        </div>
      </section>

      {/* Modal Préférences */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black opacity-50" onClick={() => setShowPreferences(false)}></div>
            
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
              <button 
                onClick={() => setShowPreferences(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              >
                {Icons.x}
              </button>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Centre de gestion des cookies
              </h2>
              
              <div className="space-y-6">
                {cookieCategories.map((category) => (
                  <div key={category.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900 mb-1">{category.name}</h3>
                        <p className="text-sm text-gray-600">{category.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {category.cookies.length} cookies dans cette catégorie
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={category.required || cookiePreferences[category.id as keyof typeof cookiePreferences]}
                          onChange={(e) => !category.required && setCookiePreferences({
                            ...cookiePreferences,
                            [category.id]: e.target.checked
                          })}
                          disabled={category.required}
                          className="sr-only peer"
                        />
                        <div className={`w-11 h-6 ${category.required ? 'bg-green-600' : 'bg-gray-200'} peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600`}></div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={rejectNonEssential}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Refuser les cookies non essentiels
                </button>
                <button 
                  onClick={handleSavePreferences}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Enregistrer mes préférences
                </button>
                <button 
                  onClick={acceptAll}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:shadow-lg transition"
                >
                  Tout accepter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

{/* Footer */}
<Footer />
    </div>
  )
}