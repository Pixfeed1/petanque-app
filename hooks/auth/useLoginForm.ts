'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

// ============================================================================
// Types
// ============================================================================

export type AuthTab = 'login' | 'signup' | 'forgot'

export interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

export interface SignupFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  organizationName: string
  acceptTerms: boolean
}

export interface UseLoginFormReturn {
  // Tab state
  activeTab: AuthTab
  setActiveTab: (tab: AuthTab) => void

  // Form fields
  email: string
  setEmail: (value: string) => void
  password: string
  setPassword: (value: string) => void
  confirmPassword: string
  setConfirmPassword: (value: string) => void
  name: string
  setName: (value: string) => void
  organizationName: string
  setOrganizationName: (value: string) => void

  // UI state
  showPassword: boolean
  setShowPassword: (value: boolean) => void
  showConfirmPassword: boolean
  setShowConfirmPassword: (value: boolean) => void
  rememberMe: boolean
  setRememberMe: (value: boolean) => void
  acceptTerms: boolean
  setAcceptTerms: (value: boolean) => void

  // Validation
  isEmailValid: boolean

  // Status
  loading: boolean
  error: string
  success: string
  successAnimation: boolean
  mounted: boolean

  // Actions
  handleLogin: () => Promise<void>
  handleSignup: () => Promise<void>
  handleForgotPassword: () => Promise<void>
  handleSocialLogin: (provider: 'google' | 'facebook') => void
  handleKeyPress: (e: React.KeyboardEvent) => void
}

// ============================================================================
// Hook principal
// ============================================================================

export function useLoginForm(): UseLoginFormReturn {
  const router = useRouter()

  // Tab state
  const [activeTab, setActiveTab] = useState<AuthTab>('login')

  // Form fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')

  // UI state
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)

  // Validation
  const [isEmailValid, setIsEmailValid] = useState(false)

  // Status
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [successAnimation, setSuccessAnimation] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Check if already logged in
  useEffect(() => {
    setMounted(true)
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const response = await fetch('/api/auth/me', { credentials: 'include' })
      if (response.ok) {
        router.push('/dashboard')
      }
    } catch {
      // Not logged in, that's normal
    }
  }

  // Email validation
  useEffect(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    setIsEmailValid(emailRegex.test(email))
    if (error && email) setError('')
  }, [email, error])

  // Clear error on password change
  useEffect(() => {
    if (error && password) setError('')
  }, [password, error])

  // Reset fields on tab change
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

  // Login handler
  const handleLogin = useCallback(async () => {
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
    } catch {
      setError('Une erreur est survenue. Veuillez reessayer.')
    } finally {
      setLoading(false)
      setSuccessAnimation(false)
    }
  }, [email, password, rememberMe, router])

  // Signup handler
  const handleSignup = useCallback(async () => {
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
      setError('Le mot de passe doit contenir au moins 6 caracteres')
      return
    }

    if (!acceptTerms) {
      setError("Veuillez accepter les conditions d'utilisation")
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
        setError(data.error || "Une erreur est survenue lors de l'inscription")
        setLoading(false)
        return
      }

      setSuccess('Compte cree avec succes !')
      await new Promise(resolve => setTimeout(resolve, 1000))
      router.push('/dashboard')
    } catch {
      setError("Une erreur est survenue lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }, [name, email, password, confirmPassword, organizationName, acceptTerms, router])

  // Forgot password handler
  const handleForgotPassword = useCallback(async () => {
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
        throw new Error(data.error || "Erreur lors de l'envoi")
      }

      setSuccess(data.message || 'Email envoyé ! Vérifiez votre boîte de réception.')

      setActiveTab('login')
      setEmail('')
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [email, isEmailValid])

  // Social login handler
  const handleSocialLogin = useCallback((provider: 'google' | 'facebook') => {
    const authUrl = `/api/auth/oauth/${provider}/login`
    window.location.href = authUrl
  }, [])

  // Key press handler
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      if (activeTab === 'login' && email && password) {
        handleLogin()
      } else if (activeTab === 'signup' && name && email && password && confirmPassword && organizationName) {
        handleSignup()
      } else if (activeTab === 'forgot' && email) {
        handleForgotPassword()
      }
    }
  }, [loading, activeTab, email, password, name, confirmPassword, organizationName, handleLogin, handleSignup, handleForgotPassword])

  return {
    // Tab state
    activeTab,
    setActiveTab,

    // Form fields
    email,
    setEmail,
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    name,
    setName,
    organizationName,
    setOrganizationName,

    // UI state
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    rememberMe,
    setRememberMe,
    acceptTerms,
    setAcceptTerms,

    // Validation
    isEmailValid,

    // Status
    loading,
    error,
    success,
    successAnimation,
    mounted,

    // Actions
    handleLogin,
    handleSignup,
    handleForgotPassword,
    handleSocialLogin,
    handleKeyPress
  }
}
