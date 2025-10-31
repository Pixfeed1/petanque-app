'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { useRouter, usePathname } from 'next/navigation'

// Initialisation Supabase directement ici
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types pour TypeScript
interface Organization {
  id: string
  name: string
  settings: any
  created_at: string
  updated_at: string
  created_by?: string
  updated_by?: string
}

interface AuthContextType {
  user: any
  organization: Organization | null
  loading: boolean
  signOut: () => Promise<void>
  updateUserPlan: (plan: 'free' | 'premium') => Promise<boolean>
  refreshOrganization: () => Promise<void>
  supabase: typeof supabase
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
  supabase,
  isAuthenticated: false,
  isPremium: false
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [organization, setOrganization] = useState<Organization | null>(null)

  useEffect(() => {
    // Vérifier la session au montage
    checkUser()

    // Écouter les changements d'auth
    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log('🔄 Auth state changed:', _event, session?.user?.id)
      setUser(session?.user ?? null)
      
      // Si connecté, charger l'organisation
      if (session?.user) {
        await loadUserOrganization(session.user)
      } else {
        setOrganization(null)
      }
      
      setLoading(false)
    })

    return () => {
      listener?.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    // Gestion des redirections APRÈS le chargement
    if (!loading) {
      // Routes publiques accessibles sans auth
      const publicRoutes = ['/login', '/signup', '/quiz', '/']
      const isPublicRoute = publicRoutes.includes(pathname)
      
      if (user) {
        // Utilisateur connecté
        // Rediriger SEULEMENT depuis login/signup vers dashboard
        if (pathname === '/login' || pathname === '/signup') {
          router.push('/dashboard')
        }
      } else {
        // Utilisateur non connecté
        if (!isPublicRoute) {
          // Rediriger vers login si route protégée
          router.push('/login')
        }
      }
    }
  }, [user, loading, pathname, router])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 Session check:', session?.user?.id)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await loadUserOrganization(session.user)
      }
    } catch (error) {
      console.error('❌ Auth error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserOrganization = async (user: any) => {
    try {
      console.log('🏢 Chargement organisation pour user:', user.id)
      
      // 1. D'abord vérifier si l'utilisateur a un rôle dans une organisation
      const { data: userRole, error: roleError } = await supabase
        .from('user_roles')
        .select(`
          *,
          organisations (*)
        `)
        .eq('user_id', user.id)
        .single()

      if (userRole?.organisations) {
        console.log('✅ Organisation trouvée via user_roles:', userRole.organisations)
        setOrganization(userRole.organisations)
        return userRole.organisations
      }

      // 2. Si pas de rôle, chercher une organisation créée par l'utilisateur
      const { data: orgData, error: orgError } = await supabase
        .from('organisations')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (orgData) {
        console.log('✅ Organisation trouvée (created_by):', orgData)
        setOrganization(orgData)
        
        // Créer le rôle owner manquant
        await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            org_id: orgData.id,
            role: 'owner',
            granted_at: new Date().toISOString()
          })
        
        return orgData
      }

      // 3. Si aucune organisation, en créer une automatiquement
      console.log('⚠️ Aucune organisation trouvée, création automatique...')
      
      // Créer l'organisation
      const { data: newOrg, error: createOrgError } = await supabase
        .from('organisations')
        .insert({
          name: `Club de ${user.email?.split('@')[0] || 'Pétanque'}`,
          settings: { 
            plan: 'free',
            db_version: '1.0',
            created_from: 'auto_provision'
          },
          created_by: user.id,
          updated_by: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createOrgError) {
        console.error('❌ Erreur création organisation:', createOrgError)
        
        // En dernier recours, essayer de récupérer n'importe quelle organisation
        const { data: anyOrg } = await supabase
          .from('organisations')
          .select('*')
          .limit(1)
          .single()
        
        if (anyOrg) {
          console.log('⚠️ Organisation de secours trouvée:', anyOrg)
          setOrganization(anyOrg)
        }
        return
      }

      if (newOrg) {
        console.log('✅ Nouvelle organisation créée:', newOrg)
        
        // Assigner l'utilisateur comme owner
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: user.id,
            org_id: newOrg.id,
            role: 'owner',
            granted_at: new Date().toISOString(),
            granted_by: user.id
          })

        if (roleError) {
          console.error('⚠️ Erreur création rôle (non bloquant):', roleError)
        }

        setOrganization(newOrg)
        console.log('🎉 Organisation configurée avec succès:', newOrg.name)
        return newOrg
      }
    } catch (error) {
      console.error('❌ Erreur dans loadUserOrganization:', error)
      
      // En cas d'erreur critique, créer une organisation temporaire en mémoire
      const tempOrg: Organization = {
        id: 'temp-' + Date.now(),
        name: 'Organisation Temporaire',
        settings: { plan: 'free', temporary: true },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('🔧 Organisation temporaire créée:', tempOrg)
      setOrganization(tempOrg)
    }
  }

  const refreshOrganization = async () => {
    if (user) {
      console.log('🔄 Rafraîchissement de l\'organisation...')
      await loadUserOrganization(user)
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setOrganization(null)
    router.push('/login')
  }

  const updateUserPlan = async (plan: 'free' | 'premium'): Promise<boolean> => {
    if (!organization || organization.id.startsWith('temp-')) {
      console.error('❌ Impossible de mettre à jour une organisation temporaire')
      return false
    }

    try {
      // Mettre à jour le plan dans l'organisation
      const { data, error } = await supabase
        .from('organisations')
        .update({
          settings: {
            ...organization.settings,
            plan: plan
          },
          updated_at: new Date().toISOString(),
          updated_by: user?.id
        })
        .eq('id', organization.id)
        .select()
        .single()

      if (!error && data) {
        setOrganization(data)
        console.log('✅ Plan mis à jour:', plan)
        return true
      }
      
      if (error) {
        console.error('❌ Erreur mise à jour plan:', error)
      }
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
    supabase, // Exposer supabase pour éviter les imports multiples
    isAuthenticated: !!user,
    isPremium: organization?.settings?.plan === 'premium'
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
        isPremium: organization?.settings?.plan === 'premium'
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