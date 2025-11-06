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
  book: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  trophy: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v6m0 0H8m4 0h4m-4-6V9m0 6h4.5M12 9h-4.5m0 0H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 01-2 2h-2.5M12 9V3" />
    </svg>
  ),
  clock: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  lightning: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  target: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  star: (
    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  play: (
    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  ),
  badge: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  question: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  lock: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  )
}

export default function QuizPage() {
  const [selectedMode, setSelectedMode] = useState('libre')
  const [selectedDifficulty, setSelectedDifficulty] = useState('debutant')
  const [selectedQuestions, setSelectedQuestions] = useState('20')
  const [scrolled, setScrolled] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [playerStats, setPlayerStats] = useState({
    totalGames: 42,
    bestScore: 95,
    averageScore: 78,
    badges: 5
  })

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const categories = [
    { name: 'Règles officielles', percentage: 30, color: 'from-blue-500 to-indigo-600', icon: Icons.book },
    { name: 'Histoire & traditions', percentage: 25, color: 'from-purple-500 to-pink-600', icon: Icons.trophy },
    { name: 'Technique & tactique', percentage: 20, color: 'from-green-500 to-emerald-600', icon: Icons.target },
    { name: 'Matériel & équipement', percentage: 15, color: 'from-orange-500 to-amber-600', icon: Icons.badge },
    { name: 'Compétitions & champions', percentage: 10, color: 'from-red-500 to-pink-600', icon: Icons.star }
  ]

  const modes = [
    {
      id: 'libre',
      name: 'Quiz Libre',
      icon: Icons.book,
      description: 'Apprenez à votre rythme',
      details: 'Pas de limite de temps, idéal pour apprendre',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'chrono',
      name: 'Mode Chronométré',
      icon: Icons.clock,
      description: 'Testez vos réflexes',
      details: 'Temps limité par question selon le niveau',
      color: 'from-orange-500 to-red-600'
    },
    {
      id: 'defi',
      name: 'Défi Progression',
      icon: Icons.trophy,
      description: 'Débloquez les niveaux',
      details: '80% de réussite pour passer au niveau suivant',
      color: 'from-purple-500 to-pink-600'
    }
  ]

  const difficulties = [
    { 
      id: 'debutant', 
      name: 'Débutant', 
      description: 'Règles de base',
      time: '20 sec/question',
      color: 'from-green-400 to-green-600'
    },
    { 
      id: 'intermediaire', 
      name: 'Intermédiaire', 
      description: 'Connaissances approfondies',
      time: '15 sec/question',
      color: 'from-yellow-400 to-orange-600'
    },
    { 
      id: 'expert', 
      name: 'Expert', 
      description: 'Questions pointues',
      time: '10 sec/question',
      color: 'from-red-500 to-red-700'
    }
  ]

  const badges = [
    { name: 'Première partie', icon: '🎯', unlocked: true },
    { name: '10 parties jouées', icon: '🏆', unlocked: true },
    { name: 'Sans faute', icon: '⭐', unlocked: true },
    { name: 'Série de 20', icon: '🔥', unlocked: true },
    { name: 'Expert confirmé', icon: '💎', unlocked: true },
    { name: 'Maître du quiz', icon: '👑', unlocked: false },
    { name: 'Légende', icon: '🌟', unlocked: false },
    { name: 'Champion', icon: '🥇', unlocked: false }
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
              <button className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-full hover:shadow-lg transition-all hover:scale-105">
                Retour au jeu
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-12 px-4 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full text-sm font-medium mb-6">
            <span className="mr-2">📚</span>
            250 questions pour devenir incollable
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Quiz Pétanque
            <span className="block bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-2">
              Testez vos connaissances
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Règles, histoire, technique, matériel... Devenez un expert de la pétanque 
            en jouant à notre quiz interactif et progressif.
          </p>
        </div>
      </section>

      {/* Stats du joueur */}
      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{playerStats.totalGames}</div>
                <div className="text-sm text-gray-600">Parties jouées</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{playerStats.bestScore}%</div>
                <div className="text-sm text-gray-600">Meilleur score</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{playerStats.averageScore}%</div>
                <div className="text-sm text-gray-600">Score moyen</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{playerStats.badges}</div>
                <div className="text-sm text-gray-600">Badges débloqués</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catégories de questions */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Les 5 catégories du quiz
          </h2>
          
          <div className="grid md:grid-cols-5 gap-4">
            {categories.map((category, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all group hover:scale-105">
                <div className={`w-12 h-12 bg-gradient-to-br ${category.color} rounded-lg flex items-center justify-center text-white mb-4 group-hover:rotate-3 transition-transform`}>
                  {category.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{category.name}</h3>
                <div className="flex items-center">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                    <div 
                      className={`bg-gradient-to-r ${category.color} h-2 rounded-full`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">{category.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Configuration du quiz */}
      <section className="py-12 px-4 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
              Configurez votre partie
            </h2>

            {/* Sélection du mode */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Choisissez votre mode</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {modes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`p-6 rounded-xl border-2 transition-all ${
                      selectedMode === mode.id 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${mode.color} rounded-lg flex items-center justify-center text-white mb-3 mx-auto`}>
                      {mode.icon}
                    </div>
                    <h4 className="font-bold text-gray-900 mb-1">{mode.name}</h4>
                    <p className="text-sm text-gray-600 mb-2">{mode.description}</p>
                    <p className="text-xs text-gray-500">{mode.details}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Sélection de la difficulté */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Niveau de difficulté</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {difficulties.map((difficulty) => (
                  <button
                    key={difficulty.id}
                    onClick={() => setSelectedDifficulty(difficulty.id)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedDifficulty === difficulty.id 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-gray-900">{difficulty.name}</h4>
                      {selectedMode === 'chrono' && (
                        <span className="text-xs text-gray-500">{difficulty.time}</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{difficulty.description}</p>
                    <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${difficulty.color}`}></div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre de questions */}
            <div className="mb-10">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Nombre de questions</h3>
              <div className="flex flex-wrap gap-3 justify-center">
                {['10', '20', '50', '100'].map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedQuestions(num)}
                    className={`px-8 py-3 rounded-lg font-medium transition-all ${
                      selectedQuestions === num
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {num} questions
                  </button>
                ))}
              </div>
            </div>

            {/* Bouton de lancement */}
            <div className="text-center">
              <button className="px-12 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-lg rounded-full hover:shadow-2xl transition-all transform hover:scale-105 font-bold">
                <span className="flex items-center space-x-3">
                  {Icons.play}
                  <span>Commencer le quiz</span>
                </span>
              </button>
              <p className="mt-4 text-sm text-gray-600">
                Mode {modes.find(m => m.id === selectedMode)?.name} • 
                Niveau {difficulties.find(d => d.id === selectedDifficulty)?.name} • 
                {selectedQuestions} questions
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Système de progression */}
      <section className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            Votre progression
          </h2>

          {/* Badges */}
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6">Badges débloqués</h3>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {badges.map((badge, index) => (
                <div 
                  key={index} 
                  className={`text-center ${badge.unlocked ? '' : 'opacity-30 grayscale'}`}
                  title={badge.name}
                >
                  <div className={`text-4xl mb-2 ${badge.unlocked ? 'animate-bounce' : ''}`}>
                    {badge.unlocked ? badge.icon : Icons.lock}
                  </div>
                  <p className="text-xs text-gray-600">{badge.name}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Statistiques par catégorie */}
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Performance par catégorie</h3>
              <div className="space-y-4">
                {categories.map((category, index) => (
                  <div key={index}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700">{category.name}</span>
                      <span className="text-sm font-medium text-gray-900">
                        {Math.floor(Math.random() * 30 + 70)}%
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className={`bg-gradient-to-r ${category.color} h-2 rounded-full transition-all`}
                        style={{ width: `${Math.floor(Math.random() * 30 + 70)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Historique récent</h3>
              <div className="space-y-3">
                {[
                  { date: 'Aujourd\'hui', score: 85, questions: 20, mode: 'Libre' },
                  { date: 'Hier', score: 92, questions: 50, mode: 'Chronométré' },
                  { date: 'Lundi', score: 78, questions: 20, mode: 'Défi' },
                  { date: 'Dimanche', score: 88, questions: 100, mode: 'Libre' },
                  { date: 'Samedi', score: 95, questions: 10, mode: 'Chronométré' }
                ].map((game, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{game.date}</p>
                      <p className="text-xs text-gray-500">{game.mode} • {game.questions} questions</p>
                    </div>
                    <div className={`font-bold ${game.score >= 90 ? 'text-green-600' : game.score >= 80 ? 'text-blue-600' : 'text-orange-600'}`}>
                      {game.score}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Points de règles */}
      <section className="py-12 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Système de points et récompenses
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                  +1
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Points de base</h3>
                <p className="text-sm text-gray-600">
                  Débutant : 1 pt<br/>
                  Intermédiaire : 2 pts<br/>
                  Expert : 3 pts
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                  ⚡
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Bonus rapidité</h3>
                <p className="text-sm text-gray-600">
                  +1 point si réponse<br/>
                  dans les 5 premières<br/>
                  secondes
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                  🔥
                </div>
                <h3 className="font-bold text-gray-900 mb-2">Bonus série</h3>
                <p className="text-sm text-gray-600">
                  +1 point pour 5 bonnes<br/>
                  réponses d&apos;affilée<br/>
                  +5 si 100% sur 10 questions
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -translate-y-32 translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full translate-y-24 -translate-x-24"></div>
            
            <div className="relative">
              <h2 className="text-4xl font-bold mb-6">
                Prêt à devenir incollable ?
              </h2>
              <p className="text-xl mb-8 text-purple-100">
                Testez vos connaissances et apprenez en vous amusant
              </p>
              <button className="px-10 py-4 bg-white text-purple-600 text-lg rounded-full hover:shadow-2xl transition-all transform hover:scale-105 font-bold">
                Lancer ma première partie
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
                L&apos;application de référence pour organiser vos tournois de pétanque.
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
                <li><a href="#" className="hover:text-white transition">Guide d&apos;utilisation</a></li>
                <li><a href="#" className="hover:text-white transition">FAQ</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Communauté</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Conditions d&apos;utilisation</a></li>
                <li><a href="#" className="hover:text-white transition">Confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition">Cookies</a></li>
                <li><a href="#" className="hover:text-white transition">RGPD</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>© 2025 Pétanque Pro - Fait avec ❤️ par <a href="https://pixfeed.net" rel="follow" className="text-green-400 hover:text-green-300 transition-colors">Pixfeed</a> pour les passionnés de pétanque</p>
          </div>
        </div>
      </footer>

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
      `}</style>
    </div>
  )
}