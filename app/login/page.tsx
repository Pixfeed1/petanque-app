'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Boule, Email, Lock, User, Building, Eye, EyeOff, Loader, Check, Google, Facebook, ArrowLeft } from '@/components/Icons'

// Icônes simples en SVG
const Icons = {
  boule: <Boule className="w-8 h-8" />,
  email: <Email />,
  lock: <Lock />,
  user: <User />,
  building: <Building />,
  eye: <Eye />,
  eyeOff: <EyeOff />,
  loader: <Loader />,
  check: <Check />,
  google: <Google />,
  facebook: <Facebook />,
  arrowLeft: <ArrowLeft />
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
  const getErrorMessage = (error: unknown) => {
    const message = error instanceof Error ? error.message : ''
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
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
      setError(errorMessage)
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
          <div
            onClick={() => router.push('/')}
            className="inline-block cursor-pointer group mb-4"
          >
            <div className="flex items-center justify-center mb-4">
              <div className="group-hover:scale-110 transition-transform duration-200">
                {Icons.boule}
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">Pétanque Pro</h1>
          </div>
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