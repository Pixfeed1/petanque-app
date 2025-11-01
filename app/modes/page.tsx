'use client'

import { useState, useEffect } from 'react'
import Footer from '../components/footer'

// Types
type ModeType = 'choisi' | 'melee-fixe' | 'melee-tournante'

interface ModeDetail {
  title: string
  subtitle: string
  advantages: string[]
  howItWorks: string[]
  idealFor: string
  teamFormation: {
    title: string
    rules: string[]
  }
  ranking: {
    title: string
    type: string
    criteria: string[]
  }
}

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
  check: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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
  trophy: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v6m0 0H8m4 0h4m-4-6V9m0 6h4.5M12 9h-4.5m0 0H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2h-2.5M12 9V3" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  clock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  sparkles: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  gender: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  )
}

export default function GameModesPage() {
  const [activeMode, setActiveMode] = useState<ModeType>('choisi')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const modes = [
    {
      id: 'choisi' as ModeType,
      name: 'Mode Choisi',
      icon: Icons.users,
      color: 'from-blue-500 to-indigo-600',
      description: 'Les joueurs forment leurs propres équipes',
      tagline: 'Gardez vos partenaires préférés'
    },
    {
      id: 'melee-fixe' as ModeType,
      name: 'Mêlée Fixe',
      icon: Icons.dice,
      color: 'from-orange-500 to-amber-600',
      description: 'Tirage aléatoire au début du tournoi',
      tagline: 'Découvrez de nouveaux partenaires'
    },
    {
      id: 'melee-tournante' as ModeType,
      name: 'Mêlée Tournante',
      icon: Icons.refresh,
      color: 'from-purple-500 to-indigo-600',
      description: 'Nouvelles équipes à chaque partie',
      tagline: 'Maximum de rencontres et de fun'
    }
  ]

  const modeDetails: Record<ModeType, ModeDetail> = {
    'choisi': {
      title: 'Mode Choisi - Équipes Fixes',
      subtitle: 'Les joueurs composent leurs équipes comme ils le souhaitent',
      advantages: [
        'Stratégie d\'équipe développée',
        'Complicité entre partenaires',
        'Idéal pour les clubs et amis',
        'Tactiques élaborées possibles'
      ],
      howItWorks: [
        'Les joueurs s\'inscrivent en équipes déjà formées',
        'L\'organisateur valide les compositions',
        'Les équipes restent identiques tout le tournoi',
        'Classement final par équipe'
      ],
      idealFor: 'Clubs, tournois entre amis, compétitions officielles',
      teamFormation: {
        title: 'Formation des équipes',
        rules: [
          'Doublette : 2 joueurs par équipe',
          'Triplette : 3 joueurs par équipe',
          'Possibilité d\'avoir un remplaçant',
          'Respect des catégories si nécessaire'
        ]
      },
      ranking: {
        title: 'Système de classement',
        type: 'Par équipe',
        criteria: [
          'Nombre de victoires',
          'Différence de points (goal average)',
          'Points marqués au total',
          'Confrontation directe si égalité'
        ]
      }
    },
    'melee-fixe': {
      title: 'Mêlée Fixe - Tirage Initial',
      subtitle: 'Les équipes sont tirées au sort au début et restent fixes',
      advantages: [
        'Équité parfaite du tirage',
        'Création de nouvelles amitiés',
        'Mixité H/F garantie',
        'Esprit de cohésion à développer'
      ],
      howItWorks: [
        'Inscription individuelle des joueurs',
        'Tirage au sort respectant la mixité H/F',
        'Les équipes formées jouent ensemble tout le tournoi',
        'Classement final par équipe'
      ],
      idealFor: 'Tournois conviviaux, événements d\'entreprise, découverte',
      teamFormation: {
        title: 'Tirage automatique',
        rules: [
          'Respect de la mixité H/F obligatoire',
          'Maximum 2 personnes du même genre en triplette',
          'Priorité aux doublettes mixtes (1H+1F)',
          'Équilibrage des niveaux si connus'
        ]
      },
      ranking: {
        title: 'Système de classement',
        type: 'Par équipe',
        criteria: [
          'Nombre de victoires',
          'Différence de points',
          'Points marqués',
          'Fair-play et esprit d\'équipe'
        ]
      }
    },
    'melee-tournante': {
      title: 'Mêlée Tournante - Maximum de Variété',
      subtitle: 'Changement de partenaires et d\'adversaires à chaque tour',
      advantages: [
        'Jouer avec tout le monde',
        'Pas de routine ni de lassitude',
        'Classement individuel équitable',
        'Ambiance festive garantie'
      ],
      howItWorks: [
        'Inscription individuelle des joueurs',
        'Nouveau tirage à chaque partie',
        'Éviter de rejouer avec les mêmes',
        'Classement individuel final'
      ],
      idealFor: 'Animations, tournois découverte, événements festifs',
      teamFormation: {
        title: 'Rotation des équipes',
        rules: [
          'Nouveau tirage à chaque tour',
          'Algorithme évite les répétitions',
          'Mixité H/F respectée à chaque fois',
          'Tous jouent contre tous idéalement'
        ]
      },
      ranking: {
        title: 'Système de classement',
        type: 'Individuel',
        criteria: [
          'Nombre de victoires personnelles',
          'Moyenne des différences de points',
          'Points moyens par partie',
          'Régularité des performances'
        ]
      }
    }
  }

  const currentModeDetails = modeDetails[activeMode]

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="/" className="flex items-center space-x-3">
              {Icons.logo}
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Pétanque Pro
              </span>
            </a>
            <div className="hidden md:flex items-center space-x-4">
              <a href="/" className="px-4 py-2 text-gray-700 hover:text-gray-900 transition">
                Accueil
              </a>
              <a href="/login" className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full hover:shadow-lg transition-all hover:scale-105">
                Commencer
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Trois modes de jeu pour
            <span className="block bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mt-2">
              tous les types de tournois
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choisissez le format qui correspond le mieux à votre événement. 
            Chaque mode a ses avantages et crée une expérience unique.
          </p>
        </div>
      </section>

      {/* Sélecteur de modes */}
      <section className="pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={`relative group p-6 rounded-2xl transition-all transform hover:scale-105 ${
                  activeMode === mode.id 
                    ? 'bg-white shadow-2xl ring-2 ring-green-500' 
                    : 'bg-white shadow-lg hover:shadow-xl'
                }`}
              >
                {activeMode === mode.id && (
                  <div className="absolute -top-3 right-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    Sélectionné
                  </div>
                )}
                
                <div className={`w-16 h-16 bg-gradient-to-br ${mode.color} rounded-xl flex items-center justify-center text-white mb-4 mx-auto group-hover:rotate-3 transition-transform`}>
                  {mode.icon}
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {mode.name}
                </h3>
                
                <p className="text-gray-600 text-sm mb-3">
                  {mode.description}
                </p>
                
                <p className="text-green-600 text-sm font-medium">
                  {mode.tagline}
                </p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Détails du mode sélectionné */}
      <section className="py-12 px-4 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
            {/* Titre et sous-titre */}
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {currentModeDetails.title}
              </h2>
              <p className="text-xl text-gray-600">
                {currentModeDetails.subtitle}
              </p>
            </div>

            {/* Grille principale */}
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              {/* Avantages */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  {Icons.sparkles}
                  <span className="ml-3">Avantages</span>
                </h3>
                <ul className="space-y-3">
                  {currentModeDetails.advantages.map((advantage, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-500 mr-3 mt-1">{Icons.check}</span>
                      <span className="text-gray-700">{advantage}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Comment ça marche */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  {Icons.clock}
                  <span className="ml-3">Comment ça marche</span>
                </h3>
                <ol className="space-y-3">
                  {currentModeDetails.howItWorks.map((step, index) => (
                    <li key={index} className="flex items-start">
                      <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Formation des équipes et Classement */}
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              {/* Formation des équipes */}
              <div className="border-2 border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  {Icons.users}
                  <span className="ml-2">{currentModeDetails.teamFormation.title}</span>
                </h3>
                <ul className="space-y-2">
                  {currentModeDetails.teamFormation.rules.map((rule, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-gray-400 mr-2 mt-1">{Icons.arrow}</span>
                      <span className="text-gray-700 text-sm">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Système de classement */}
              <div className="border-2 border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  {Icons.trophy}
                  <span className="ml-2">{currentModeDetails.ranking.title}</span>
                </h3>
                <div className="mb-3">
                  <span className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    {currentModeDetails.ranking.type}
                  </span>
                </div>
                <ul className="space-y-2">
                  {currentModeDetails.ranking.criteria.map((criterion, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-gray-400 mr-2 mt-1">{Icons.arrow}</span>
                      <span className="text-gray-700 text-sm">{criterion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Idéal pour */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl p-6 text-white text-center">
              <p className="text-sm font-medium mb-2">Idéal pour</p>
              <p className="text-xl font-bold">{currentModeDetails.idealFor}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Mixité H/F */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Gestion Intelligente de la Mixité H/F
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  {Icons.gender}
                  <span className="ml-2">Règles Appliquées</span>
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2 mt-1">{Icons.check}</span>
                    <div>
                      <p className="font-medium text-gray-900">Triplettes</p>
                      <p className="text-sm text-gray-600">Maximum 2 personnes du même genre (2H+1F ou 2F+1H)</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2 mt-1">{Icons.check}</span>
                    <div>
                      <p className="font-medium text-gray-900">Doublettes</p>
                      <p className="text-sm text-gray-600">Priorité aux équipes mixtes (1H+1F)</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2 mt-1">{Icons.check}</span>
                    <div>
                      <p className="font-medium text-gray-900">Affrontements</p>
                      <p className="text-sm text-gray-600">Évite les confrontations déséquilibrées</p>
                    </div>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  {Icons.chart}
                  <span className="ml-2">Gestion Automatique</span>
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2 mt-1">{Icons.check}</span>
                    <div>
                      <p className="font-medium text-gray-900">Algorithme intelligent</p>
                      <p className="text-sm text-gray-600">Optimise automatiquement la répartition</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2 mt-1">{Icons.check}</span>
                    <div>
                      <p className="font-medium text-gray-900">Alertes préventives</p>
                      <p className="text-sm text-gray-600">Signale les déséquilibres impossibles à résoudre</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2 mt-1">{Icons.check}</span>
                    <div>
                      <p className="font-medium text-gray-900">Tolérance flexible</p>
                      <p className="text-sm text-gray-600">S'adapte si la répartition parfaite est impossible</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tableau comparatif */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            Comparaison des Modes
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full bg-white rounded-2xl shadow-xl overflow-hidden">
              <thead className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                <tr>
                  <th className="px-6 py-4 text-left">Critère</th>
                  <th className="px-6 py-4 text-center">Mode Choisi</th>
                  <th className="px-6 py-4 text-center">Mêlée Fixe</th>
                  <th className="px-6 py-4 text-center">Mêlée Tournante</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">Formation équipes</td>
                  <td className="px-6 py-4 text-center">Par les joueurs</td>
                  <td className="px-6 py-4 text-center">Tirage au sort</td>
                  <td className="px-6 py-4 text-center">Nouveau tirage/tour</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">Classement</td>
                  <td className="px-6 py-4 text-center">Par équipe</td>
                  <td className="px-6 py-4 text-center">Par équipe</td>
                  <td className="px-6 py-4 text-center">Individuel</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">Mixité H/F</td>
                  <td className="px-6 py-4 text-center">Libre</td>
                  <td className="px-6 py-4 text-center">Automatique</td>
                  <td className="px-6 py-4 text-center">Automatique</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">Stratégie</td>
                  <td className="px-6 py-4 text-center">Maximale</td>
                  <td className="px-6 py-4 text-center">Moyenne</td>
                  <td className="px-6 py-4 text-center">Adaptation</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">Convivialité</td>
                  <td className="px-6 py-4 text-center">Bonne</td>
                  <td className="px-6 py-4 text-center">Très bonne</td>
                  <td className="px-6 py-4 text-center">Excellente</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">Durée conseillée</td>
                  <td className="px-6 py-4 text-center">3-5 parties</td>
                  <td className="px-6 py-4 text-center">3-5 parties</td>
                  <td className="px-6 py-4 text-center">4-8 parties</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative">
              <h2 className="text-4xl font-bold mb-6">
                Quel mode choisirez-vous ?
              </h2>
              <p className="text-xl mb-8 text-green-100">
                Tous les modes sont disponibles dans l'application
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/login" className="px-8 py-4 bg-white text-green-600 text-lg rounded-full hover:shadow-2xl transition-all transform hover:scale-105 font-bold">
                  Créer mon tournoi
                </a>
                <a href="/" className="px-8 py-4 bg-transparent text-white text-lg rounded-full border-2 border-white hover:bg-white hover:text-green-600 transition-all">
                  En savoir plus
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}