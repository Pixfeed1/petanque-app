'use client'

import { useState, useEffect } from 'react'

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
  shield: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  lock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  database: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
    </svg>
  ),
  user: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  mail: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  clock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  globe: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  trash: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  ),
  download: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  )
}

export default function RGPDPage() {
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState('responsable')

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const sections = [
    { id: 'responsable', name: 'Responsable', icon: Icons.user },
    { id: 'donnees', name: 'Données collectées', icon: Icons.database },
    { id: 'finalites', name: 'Finalités', icon: Icons.shield },
    { id: 'duree', name: 'Conservation', icon: Icons.clock },
    { id: 'destinataires', name: 'Destinataires', icon: Icons.globe },
    { id: 'droits', name: 'Vos droits', icon: Icons.lock },
    { id: 'cookies', name: 'Cookies', icon: Icons.database },
    { id: 'securite', name: 'Sécurité', icon: Icons.shield }
  ]

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId)
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
  }

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
              <button className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full hover:shadow-lg transition-all hover:scale-105">
                Retour
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Protection de vos données personnelles
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Conformément au Règlement Général sur la Protection des Données (RGPD), 
            nous nous engageons à protéger vos données personnelles et à respecter votre vie privée.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </section>

      {/* Navigation rapide */}
      <section className="sticky top-16 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto space-x-1 py-4 scrollbar-hide">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-all ${
                  activeSection === section.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {section.icon}
                <span className="font-medium text-sm">{section.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Contenu principal */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto space-y-12">
          
          {/* Responsable du traitement */}
          <div id="responsable" className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              {Icons.user}
              <span className="ml-3">Responsable du traitement</span>
            </h2>
            <div className="space-y-4 text-gray-700">
              <div>
                <p className="font-semibold">Pixfeed</p>
                <p>1 rue des Morillons</p>
                <p>95130 Franconville</p>
                <p>France</p>
              </div>
              <div>
                <p className="font-semibold">SIRET :</p>
                <p>852 393 735 00018</p>
              </div>
              <div>
                <p className="font-semibold">Contact RGPD :</p>
                <p className="text-blue-600 hover:text-blue-700">
                  <a href="mailto:support@petanquepro.fr">support@petanquepro.fr</a>
                </p>
              </div>
            </div>
          </div>

          {/* Données collectées */}
          <div id="donnees" className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              {Icons.database}
              <span className="ml-3">Données collectées</span>
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Données d'identification</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <span>Nom et prénom</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <span>Adresse email</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <span>Genre (H/F) pour la gestion de la mixité dans les tournois</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <span>Numéro de téléphone (optionnel)</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Données de jeu</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <span>Scores et statistiques de jeu</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <span>Historique des tournois</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <span>Classements et performances</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <span>Résultats du quiz</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Contenu multimédia</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <span>Photos de tournois (avec consentement)</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-900 mb-3">Données techniques</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <span>Adresse IP</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <span>Type d'appareil et navigateur</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <span>Données de navigation (Google Analytics)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <span>Préférences d'utilisation</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Finalités */}
          <div id="finalites" className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              {Icons.shield}
              <span className="ml-3">Finalités du traitement</span>
            </h2>
            
            <div className="space-y-4">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">Gestion du service</h3>
                <p className="text-gray-700">Création et gestion de votre compte, organisation des tournois, calcul des classements, gestion de la mixité H/F.</p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">Amélioration du service</h3>
                <p className="text-gray-700">Analyse statistique de l'utilisation, amélioration des fonctionnalités, correction des bugs.</p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">Communication</h3>
                <p className="text-gray-700">Envoi d'emails transactionnels (confirmation d'achat, récupération de mot de passe).</p>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">Publicité (version gratuite)</h3>
                <p className="text-gray-700">Affichage de publicités personnalisées via Google AdMob pour financer la version gratuite.</p>
              </div>
              
              <div className="border-l-4 border-red-500 pl-4">
                <h3 className="font-bold text-gray-900 mb-2">Obligations légales</h3>
                <p className="text-gray-700">Respect de nos obligations légales et réglementaires.</p>
              </div>
            </div>
          </div>

          {/* Durée de conservation */}
          <div id="duree" className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              {Icons.clock}
              <span className="ml-3">Durée de conservation</span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-24 font-semibold text-gray-900">Compte actif</div>
                <div className="ml-4 text-gray-700">
                  Vos données sont conservées pendant toute la durée d'utilisation de votre compte.
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-24 font-semibold text-gray-900">Compte inactif</div>
                <div className="ml-4 text-gray-700">
                  Les comptes inactifs depuis plus de 3 ans sont automatiquement supprimés après notification.
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-24 font-semibold text-gray-900">Suppression</div>
                <div className="ml-4 text-gray-700">
                  En cas de suppression de compte, vos données sont effacées dans un délai de 30 jours, sauf obligation légale.
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 w-24 font-semibold text-gray-900">Photos</div>
                <div className="ml-4 text-gray-700">
                  Les photos de tournois sont conservées 2 ans maximum, sauf accord spécifique.
                </div>
              </div>
            </div>
          </div>

          {/* Destinataires */}
          <div id="destinataires" className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              {Icons.globe}
              <span className="ml-3">Destinataires des données</span>
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Sous-traitants techniques</h3>
                <div className="space-y-3">
                  <div className="border rounded-lg p-4">
                    <p className="font-semibold">Supabase (Base de données)</p>
                    <p className="text-sm text-gray-600">Stockage sécurisé des données - Serveurs aux États-Unis</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="font-semibold">Vercel (Hébergement application)</p>
                    <p className="text-sm text-gray-600">Hébergement de l'application - CDN mondial</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="font-semibold">Stripe (Paiements)</p>
                    <p className="text-sm text-gray-600">Traitement sécurisé des paiements - Certifié PCI DSS</p>
                  </div>
                  <div className="border rounded-lg p-4">
                    <p className="font-semibold">Google (Analytics & AdMob)</p>
                    <p className="text-sm text-gray-600">Analyse d'utilisation et publicités - Transfert hors UE</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Transferts hors UE :</strong> Certaines données peuvent être transférées vers les États-Unis 
                  par nos sous-traitants (Google, Supabase, Stripe). Ces transferts sont encadrés par les clauses 
                  contractuelles types de la Commission européenne.
                </p>
              </div>
            </div>
          </div>

          {/* Vos droits */}
          <div id="droits" className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              {Icons.lock}
              <span className="ml-3">Vos droits</span>
            </h2>
            
            <p className="text-gray-700 mb-6">
              Conformément au RGPD, vous disposez des droits suivants sur vos données personnelles :
            </p>
            
            <div className="grid md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-2">
                  {Icons.user}
                  <h3 className="ml-2 font-bold text-gray-900">Droit d'accès</h3>
                </div>
                <p className="text-sm text-gray-600">Obtenir une copie de vos données personnelles</p>
              </div>
              
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-2">
                  {Icons.shield}
                  <h3 className="ml-2 font-bold text-gray-900">Droit de rectification</h3>
                </div>
                <p className="text-sm text-gray-600">Corriger vos données si elles sont inexactes</p>
              </div>
              
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-2">
                  {Icons.trash}
                  <h3 className="ml-2 font-bold text-gray-900">Droit à l'effacement</h3>
                </div>
                <p className="text-sm text-gray-600">Supprimer vos données ("droit à l'oubli")</p>
              </div>
              
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-2">
                  {Icons.clock}
                  <h3 className="ml-2 font-bold text-gray-900">Droit à la limitation</h3>
                </div>
                <p className="text-sm text-gray-600">Limiter le traitement de vos données</p>
              </div>
              
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-2">
                  {Icons.download}
                  <h3 className="ml-2 font-bold text-gray-900">Droit à la portabilité</h3>
                </div>
                <p className="text-sm text-gray-600">Récupérer vos données dans un format structuré</p>
              </div>
              
              <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-2">
                  {Icons.shield}
                  <h3 className="ml-2 font-bold text-gray-900">Droit d'opposition</h3>
                </div>
                <p className="text-sm text-gray-600">Vous opposer au traitement de vos données</p>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                Pour exercer vos droits, contactez-nous à : <a href="mailto:support@petanquepro.fr" className="font-semibold underline">support@petanquepro.fr</a>
              </p>
              <p className="text-sm text-blue-800 mt-2">
                Vous pouvez également déposer une réclamation auprès de la CNIL : <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="font-semibold underline">www.cnil.fr</a>
              </p>
            </div>
          </div>

          {/* Cookies */}
          <div id="cookies" className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              {Icons.database}
              <span className="ml-3">Cookies et traceurs</span>
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Cookies essentiels</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <div>
                      <p className="font-medium">Cookies de session</p>
                      <p className="text-sm text-gray-600">Maintien de votre connexion - Durée : session</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2 mt-1">{Icons.check}</span>
                    <div>
                      <p className="font-medium">Préférences utilisateur</p>
                      <p className="text-sm text-gray-600">Mémorisation de vos choix - Durée : 1 an</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Cookies analytiques</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-1">{Icons.check}</span>
                    <div>
                      <p className="font-medium">Google Analytics</p>
                      <p className="text-sm text-gray-600">Analyse de l'utilisation du service - Durée : 2 ans</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Cookies publicitaires (version gratuite)</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2 mt-1">{Icons.check}</span>
                    <div>
                      <p className="font-medium">Google AdMob</p>
                      <p className="text-sm text-gray-600">Personnalisation des publicités - Durée : variable</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Gestion des cookies :</strong> Vous pouvez gérer vos préférences cookies à tout moment 
                  dans les paramètres de l'application ou via les paramètres de votre navigateur.
                </p>
              </div>
            </div>
          </div>

          {/* Sécurité */}
          <div id="securite" className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              {Icons.shield}
              <span className="ml-3">Sécurité des données</span>
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-start">
                <span className="text-green-500 mr-3 mt-1">{Icons.check}</span>
                <div>
                  <p className="font-medium text-gray-900">Chiffrement des données</p>
                  <p className="text-sm text-gray-600">Toutes les données sont chiffrées en transit (HTTPS) et au repos</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-green-500 mr-3 mt-1">{Icons.check}</span>
                <div>
                  <p className="font-medium text-gray-900">Authentification sécurisée</p>
                  <p className="text-sm text-gray-600">Mots de passe hashés avec bcrypt, authentification à deux facteurs disponible</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-green-500 mr-3 mt-1">{Icons.check}</span>
                <div>
                  <p className="font-medium text-gray-900">Sauvegardes régulières</p>
                  <p className="text-sm text-gray-600">Sauvegardes automatiques quotidiennes avec rétention de 30 jours</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-green-500 mr-3 mt-1">{Icons.check}</span>
                <div>
                  <p className="font-medium text-gray-900">Accès restreint</p>
                  <p className="text-sm text-gray-600">Accès aux données limité au personnel autorisé uniquement</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <span className="text-green-500 mr-3 mt-1">{Icons.check}</span>
                <div>
                  <p className="font-medium text-gray-900">Conformité PCI DSS</p>
                  <p className="text-sm text-gray-600">Paiements traités via Stripe, certifié PCI DSS niveau 1</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                En cas de violation de données, nous nous engageons à vous notifier dans les 72 heures 
                conformément au RGPD.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
            <h2 className="text-2xl font-bold mb-4">
              Des questions sur vos données ?
            </h2>
            <p className="mb-6">
              Notre équipe est à votre disposition pour répondre à toutes vos questions 
              concernant la protection de vos données personnelles.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="mailto:support@petanquepro.fr" 
                className="inline-flex items-center justify-center px-6 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition font-medium"
              >
                {Icons.mail}
                <span className="ml-2">support@petanquepro.fr</span>
              </a>
              <button className="inline-flex items-center justify-center px-6 py-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition font-medium">
                {Icons.download}
                <span className="ml-2">Télécharger mes données</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                {Icons.logo}
                <span className="text-xl font-bold text-white">Pétanque Pro</span>
              </div>
              <p className="text-sm">
                L'application de référence pour organiser vos tournois de pétanque.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Fonctionnalités</a></li>
                <li><a href="#" className="hover:text-white transition">Modes de jeu</a></li>
                <li><a href="#" className="hover:text-white transition">Quiz</a></li>
                <li><a href="#" className="hover:text-white transition">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Guide d'utilisation</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Communauté</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Conditions d'utilisation</a></li>
                <li><a href="#" className="hover:text-white transition">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
                <li><a href="#" className="hover:text-white transition font-bold">RGPD</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2025 Pétanque Pro - Fait avec ❤️ par <a href="https://pixfeed.net" rel="follow" className="text-green-400 hover:text-green-300 transition-colors">Pixfeed</a> pour les passionnés de pétanque</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}