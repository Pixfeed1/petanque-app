'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState('Connexion en cours...')

  useEffect(() => {
    handleOAuthCallback()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleOAuthCallback = async () => {
    try {
      // Récupérer la session depuis l'URL
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        console.error('Erreur callback:', error)
        router.push('/login?error=auth_failed')
        return
      }

      if (!session) {
        router.push('/login')
        return
      }

      setStatus('Vérification du profil...')

      // Vérifier si l'utilisateur a déjà une organisation
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('*, organisations(*)')
        .eq('user_id', session.user.id)
        .single()

      if (userRoles?.org_id) {
        // Utilisateur existant avec org
        console.log('✅ Utilisateur existant, redirection...')
        router.push('/dashboard')
      } else {
        // Nouvel utilisateur - créer une organisation
        setStatus('Création de votre espace...')
        
        const userName = session.user.user_metadata?.full_name || 
                        session.user.user_metadata?.name || 
                        session.user.email?.split('@')[0] || 
                        'Utilisateur'

        const orgName = `Club de ${userName}`

        // Créer l'organisation
        const { data: org, error: orgError } = await supabase
          .from('organisations')
          .insert({
            name: orgName,
            settings: { 
              created_via: 'oauth',
              provider: session.user.app_metadata?.provider || 'unknown',
              db_version: '1.0'
            },
            created_by: session.user.id
          })
          .select()
          .single()

        if (orgError) {
          console.error('Erreur création org:', orgError)
          // Essayer de récupérer si elle existe déjà
          const { data: existingOrg } = await supabase
            .from('organisations')
            .select()
            .eq('created_by', session.user.id)
            .single()
          
          if (existingOrg) {
            await createUserRole(session.user.id, existingOrg.id)
            router.push('/dashboard')
            return
          }
          
          router.push('/login?error=org_creation_failed')
          return
        }

        if (org) {
          await createUserRole(session.user.id, org.id)
          
          // Mettre à jour les metadata
          await supabase.auth.updateUser({
            data: {
              current_org_id: org.id,
              full_name: userName
            }
          })

          console.log('✅ Organisation créée:', org.id)
          router.push('/dashboard?welcome=true')
        }
      }
    } catch (error) {
      console.error('Erreur globale:', error)
      router.push('/login?error=unexpected')
    }
  }

  const createUserRole = async (userId: string, orgId: string) => {
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        org_id: orgId,
        role: 'owner',
        granted_by: userId
      })
    
    if (error) {
      console.error('Erreur création rôle:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-amber-50">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="text-gray-700 font-medium">{status}</p>
        </div>
      </div>
    </div>
  )
}