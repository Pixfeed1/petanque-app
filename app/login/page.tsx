'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Icônes simples en SVG
const Icons = {
  boule: (
    <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  email: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  lock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  building: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
  eye: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  eyeOff: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  ),
  loader: (
    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  ),
  check: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  google: (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  ),
  facebook: (
    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
    </svg>
  ),
  arrowLeft: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('login') // 'login', 'signup', 'forgot'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isEmailValid, setIsEmailValid] = useState(false)
  const [successAnimation, setSuccessAnimation] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Vérifier si déjà connecté
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' })
      if (response.ok) {
        router.push('/dashboard')
      }
    } catch (error) {
      // Pas connecté, c'est normal
    }
  }

  // Validation email en temps réel
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    setIsEmailValid(emailRegex.test(email))
    if (error && email) setError('')
  }, [email])

  useEffect(() => {
    if (error && password) setError('')
  }, [password])

  // Reset des champs lors du changement d'onglet
  useEffect(() => {
    setError('')
    setSuccess('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setName('')
    setOrganizationName('')
    setAcceptTerms(false)
  }, [activeTab])

  // Traduction des erreurs Supabase
  const getErrorMessage = (error: any) => {
    const message = error?.message || ''
    if (message.includes('Invalid login')) return 'Email ou mot de passe incorrect'
    if (message.includes('User already registered')) return 'Cet email est déjà utilisé'
    if (message.includes('Password should be at least')) return 'Le mot de passe doit contenir au moins 6 caractères'
    if (message.includes('Unable to validate')) return 'Email invalide'
    if (message.includes('Email not confirmed')) return 'Veuillez confirmer votre email'
    return 'Une erreur est survenue. Veuillez réessayer.'
  }

  const handleLogin = async () => {
    if (!email || !password) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Email ou mot de passe incorrect')
      } else {
        setSuccessAnimation(true)
        await new Promise(resolve => setTimeout(resolve, 800))
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
      setSuccessAnimation(false)
    }
  }

  const handleSignup = async () => {
    setError('')

    if (!name || !email || !password || !confirmPassword || !organizationName) {
      setError('Veuillez remplir tous les champs')
      return
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }

    if (!acceptTerms) {
      setError('Veuillez accepter les conditions d\'utilisation')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email,
          password,
          fullName: name,
          organizationName
        })
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Une erreur est survenue lors de l\'inscription')
        setLoading(false)
        return
      }

      console.log('✅ Compte créé avec succès')
      setSuccess('Compte créé avec succès !')

      // Rediriger vers le dashboard après une courte pause
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/dashboard')

    } catch (err) {
      console.error('Erreur globale:', err)
      setError('Une erreur est survenue lors de l\'inscription')
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Veuillez entrer votre adresse email')
      return
    }

    if (!isEmailValid) {
      setError('Veuillez entrer une adresse email valide')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi')
      }

      // Afficher le message de succès
      alert(
        '✅ Email envoyé !\n\n' +
        data.message +
        '\n\n' +
        (data.resetUrl ? `En développement, utilisez ce lien :\n${data.resetUrl}` : '')
      )

      setActiveTab('login')
      setEmail('')
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    // Rediriger vers l'endpoint OAuth
    const authUrl = `/api/auth/oauth/${provider}/login`
    window.location.href = authUrl
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      if (activeTab === 'login' && email && password) {
        handleLogin()
      } else if (activeTab === 'signup' && name && email && password && confirmPassword && organizationName) {
        handleSignup()
      } else if (activeTab === 'forgot' && email) {
        handleForgotPassword()
      }
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-green-50 via-white to-amber-50">
      {/* Motif d'arrière-plan animé */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-green-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-4000"></div>
      </div>

      {/* Contenu principal */}
      <div className="relative z-10 min-h-screen flex flex-col justify-center items-center px-4 py-12">
        {/* Logo et titre */}
        <div className={`text-center mb-8 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <button
            onClick={() => router.push('/')}
            className="flex flex-col items-center justify-center mb-4 group cursor-pointer"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="relative group-hover:scale-110 transition-transform duration-200">
                {Icons.boule}
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Pétanque Pro</h1>
          </button>
          <p className="text-gray-600">
            {activeTab === 'login' && 'Gérez vos tournois comme un champion'}
            {activeTab === 'signup' && 'Créez votre compte gratuitement'}
            {activeTab === 'forgot' && 'Réinitialisez votre mot de passe'}
          </p>
        </div>

        {/* Carte de connexion */}
        <div className={`w-full max-w-md transition-all duration-700 delay-100 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'} ${successAnimation ? 'scale-105' : ''}`}>
          <div className={`bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border ${successAnimation ? 'border-green-400 shadow-green-200' : 'border-gray-100'} transition-all duration-300`}>
            
            {/* Bouton retour pour forgot password */}
            {activeTab === 'forgot' && (
              <button
                onClick={() => setActiveTab('login')}
                className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
              >
                {Icons.arrowLeft}
                <span className="ml-2">Retour à la connexion</span>
              </button>
            )}

            {/* Onglets (seulement pour login/signup) */}
            {activeTab !== 'forgot' && (
              <div className="flex space-x-1 mb-8 bg-gray-100 rounded-lg p-1">
                <button 
                  onClick={() => setActiveTab('login')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                    activeTab === 'login' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Connexion
                </button>
                <button 
                  onClick={() => setActiveTab('signup')}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                    activeTab === 'signup' 
                      ? 'bg-white text-gray-900 shadow-sm' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Inscription
                </button>
              </div>
            )}

            {/* Message d'erreur */}
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700 text-sm animate-shake">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {/* Message de succès */}
            {success && (
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2 text-green-700 text-sm">
                {Icons.check}
                <span>{success}</span>
              </div>
            )}

            {/* Formulaire de connexion */}
            {activeTab === 'login' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      {Icons.email}
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        email && !isEmailValid ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="vous@exemple.fr"
                      autoFocus
                    />
                    {email && isEmailValid && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-500 animate-fadeIn">
                        {Icons.check}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      {Icons.lock}
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? Icons.eyeOff : Icons.eye}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                    />
                    <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-800 transition-colors">
                      Se souvenir de moi
                    </span>
                  </label>
                  <button 
                    onClick={() => setActiveTab('forgot')}
                    className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>

                <button
                  onClick={handleLogin}
                  disabled={loading || !email || !password}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all transform ${
                    loading || !email || !password
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : successAnimation 
                        ? 'bg-green-600 text-white scale-105 shadow-lg'
                        : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    {loading ? (
                      <>
                        {Icons.loader}
                        <span>Connexion en cours...</span>
                      </>
                    ) : successAnimation ? (
                      <>
                        {Icons.check}
                        <span>Connexion réussie !</span>
                      </>
                    ) : (
                      <span>Se connecter</span>
                    )}
                  </span>
                </button>
              </div>
            )}

            {/* Formulaire d'inscription */}
            {activeTab === 'signup' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      {Icons.user}
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Jean Dupont"
                      autoFocus
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du club / Organisation
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      {Icons.building}
                    </div>
                    <input
                      type="text"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Club de Pétanque de Marseille"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      {Icons.email}
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        email && !isEmailValid ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="vous@exemple.fr"
                    />
                    {email && isEmailValid && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-500 animate-fadeIn">
                        {Icons.check}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      {Icons.lock}
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Minimum 6 caractères"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? Icons.eyeOff : Icons.eye}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      {Icons.lock}
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        confirmPassword && password !== confirmPassword ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Confirmez votre mot de passe"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showConfirmPassword ? Icons.eyeOff : Icons.eye}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">Les mots de passe ne correspondent pas</p>
                  )}
                </div>

                <div>
                  <label className="flex items-start cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer mt-1"
                    />
                    <span className="ml-2 text-sm text-gray-600">
                      J'accepte les <a href="#" className="text-green-600 hover:text-green-700">conditions d'utilisation</a> et la <a href="#" className="text-green-600 hover:text-green-700">politique de confidentialité</a>
                    </span>
                  </label>
                </div>

                <button
                  onClick={handleSignup}
                  disabled={loading || !name || !email || !password || !confirmPassword || !organizationName || !acceptTerms}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all transform ${
                    loading || !name || !email || !password || !confirmPassword || !organizationName || !acceptTerms
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    {loading ? (
                      <>
                        {Icons.loader}
                        <span>Création du compte...</span>
                      </>
                    ) : (
                      <span>Créer mon compte</span>
                    )}
                  </span>
                </button>
              </div>
            )}

            {/* Formulaire mot de passe oublié */}
            {activeTab === 'forgot' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Mot de passe oublié ?</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      {Icons.email}
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className={`w-full pl-10 pr-10 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all ${
                        email && !isEmailValid ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="vous@exemple.fr"
                      autoFocus
                    />
                    {email && isEmailValid && (
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-green-500 animate-fadeIn">
                        {Icons.check}
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleForgotPassword}
                  disabled={loading || !email}
                  className={`w-full py-3 px-4 rounded-lg font-medium transition-all transform ${
                    loading || !email
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                  }`}
                >
                  <span className="flex items-center justify-center space-x-2">
                    {loading ? (
                      <>
                        {Icons.loader}
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <span>Envoyer le lien de réinitialisation</span>
                    )}
                  </span>
                </button>
              </div>
            )}

            {/* Séparateur et connexion sociale (sauf pour forgot) */}
            {activeTab !== 'forgot' && (
              <>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">ou continuer avec</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => handleSocialLogin('google')}
                    className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md"
                  >
                    {Icons.google}
                    <span className="ml-2 text-sm font-medium text-gray-700">Google</span>
                  </button>
                  <button 
                    onClick={() => handleSocialLogin('facebook')}
                    className="flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all hover:shadow-md"
                  >
                    {Icons.facebook}
                    <span className="ml-2 text-sm font-medium text-gray-700">Facebook</span>
                  </button>
                </div>
              </>
            )}

            {/* Lien vers inscription/connexion (seulement pour login) */}
            {activeTab === 'login' && (
              <p className="mt-8 text-center text-sm text-gray-600">
                Pas encore de compte ?{' '}
                <button
                  onClick={() => setActiveTab('signup')}
                  className="font-medium text-green-600 hover:text-green-700 transition-colors underline-offset-2 hover:underline"
                >
                  Créer un compte gratuitement
                </button>
              </p>
            )}

            {/* Lien vers connexion (seulement pour signup) */}
            {activeTab === 'signup' && (
              <p className="mt-8 text-center text-sm text-gray-600">
                Déjà un compte ?{' '}
                <button
                  onClick={() => setActiveTab('login')}
                  className="font-medium text-green-600 hover:text-green-700 transition-colors underline-offset-2 hover:underline"
                >
                  Se connecter
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer minimaliste */}
        <div className={`mt-12 text-center text-sm text-gray-500 transition-all duration-700 delay-200 ${mounted ? 'opacity-100' : 'opacity-0'}`}>
          <p>© 2025 Pétanque Pro • Fait avec ❤️ par <a href="https://pixfeed.net" rel="follow" className="text-green-600 hover:text-green-700 transition-colors">Pixfeed</a> pour les passionnés</p>
        </div>
      </div>

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
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-2px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(2px);
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
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-out;
        }
      `}</style>
    </div>
  )
}