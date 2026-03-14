'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'

// Types TypeScript
interface Organization {
  id: string
  name: string
  settings: Record<string, unknown> | null
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

interface User {
  id: string
  email: string
  full_name: string | null
  email_verified: boolean
  created_at: string
  last_login_at: string | null
  metadata: Record<string, unknown> | null
}

interface AuthContextType {
  user: User | null
  organization: Organization | null
  loading: boolean
  signOut: () => Promise<void>
  updateUserPlan: (plan: 'free' | 'essentiel' | 'club') => Promise<boolean>
  refreshOrganization: () => Promise<void>
  isAuthenticated: boolean
  isPremium: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  organization: null,
  loading: true,
  signOut: async () => {},
  updateUserPlan: async () => false,
  refreshOrganization: async () => {},
  isAuthenticated: false,
  isPremium: false
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)

  useEffect(() => {
    checkUser()
  }, [])

  useEffect(() => {
    if (!loading) {
      // Liste des routes publiques (accessibles sans authentification)
      const publicRoutes = [
        '/',
        '/login',
        '/signup',
        '/modes',
        '/features',
        '/guide',
        '/faq',
        '/contact',
      ]

      // Vérifier si la route est publique (exact match ou wildcard pour /legal/*)
      const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/legal/')

      if (user) {
        // Si l'utilisateur est connecté et tente d'accéder à login/signup, rediriger vers dashboard
        if (pathname === '/login' || pathname === '/signup') {
          router.push('/dashboard')
        }
      } else {
        // Si l'utilisateur n'est pas connecté et tente d'accéder à une route protégée
        if (!isPublicRoute) {
          router.push('/login')
        }
      }
    }
  }, [user, loading, pathname, router])

  const checkUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Session récupérée:', data.user.email)
        setUser(data.user)
        setOrganization(data.organization)
      } else {
        console.log('ℹ️ Aucune session active')
        setUser(null)
        setOrganization(null)
      }
    } catch (error) {
      console.error('❌ Erreur vérification session:', error)
      setUser(null)
      setOrganization(null)
    } finally {
      setLoading(false)
    }
  }

  const refreshOrganization = async () => {
    if (!user) return

    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setOrganization(data.organization)
        console.log('🔄 Organisation rafraîchie')
      }
    } catch (error) {
      console.error('❌ Erreur refresh organisation:', error)
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      })

      setUser(null)
      setOrganization(null)
      router.push('/login')
      console.log('👋 Déconnexion réussie')
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error)
    }
  }

  const updateUserPlan = async (plan: 'free' | 'essentiel' | 'club'): Promise<boolean> => {
    if (!organization || organization.id.startsWith('temp-')) {
      console.error('❌ Impossible de mettre à jour une organisation temporaire')
      return false
    }

    try {
      const response = await fetch(`/api/organisations/${organization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          settings: {
            ...organization.settings,
            plan: plan
          }
        })
      })

      if (response.ok) {
        const data = await response.json()
        setOrganization(data)
        console.log('✅ Plan mis à jour:', plan)
        return true
      }

      console.error('❌ Erreur mise à jour plan')
      return false
    } catch (error) {
      console.error('❌ Erreur mise à jour plan:', error)
      return false
    }
  }

  const value: AuthContextType = {
    user,
    organization,
    loading,
    signOut,
    updateUserPlan,
    refreshOrganization,
    isAuthenticated: !!user,
    isPremium: ['essentiel', 'club', 'premium'].includes(String(organization?.settings?.plan || ''))
  }

  // Logs de debug en développement
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 AUTH STATE:', {
        user: user?.id,
        organization: organization?.id,
        organizationName: organization?.name,
        loading,
        isAuthenticated: !!user,
        plan: organization?.settings?.plan || 'free'
      })
    }
  }, [user, organization, loading])

  return (
    <AuthContext.Provider value={value}>
      {!loading ? children : (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-green-50/30 flex items-center justify-center">
          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full blur-2xl opacity-20 animate-pulse"></div>
              <div className="relative bg-white rounded-3xl p-12 shadow-2xl">
                <svg className="animate-spin h-12 w-12 mx-auto text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="mt-4 text-lg font-medium text-gray-600">Chargement...</p>
                <p className="mt-2 text-sm text-gray-400">Initialisation de votre espace...</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  )
}
