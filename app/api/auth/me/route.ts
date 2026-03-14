// app/api/auth/me/route.ts
// API pour récupérer l'utilisateur connecté

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { queryOne } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authResult = await requireAuth(request)

    if (authResult instanceof Response) {
      return authResult
    }

    const { user } = authResult

    // Récupérer l'organisation de l'utilisateur
    const organisation = await queryOne(
      `SELECT o.*
       FROM organisations o
       JOIN user_roles ur ON ur.org_id = o.id
       WHERE ur.user_id = $1
       LIMIT 1`,
      [user.id]
    )

    // Récupérer le rôle
    const role = await queryOne<{ role: string }>(
      `SELECT role FROM user_roles WHERE user_id = $1 AND org_id = $2`,
      [user.id, organisation?.id]
    )

    return apiSuccess({
      user,
      organization: organisation,
      role: role?.role || 'member',
      isPremium: ['essentiel', 'club', 'premium'].includes(organisation?.settings?.plan || '')
    })
  } catch (error) {
    console.error('❌ Erreur /api/auth/me:', error)
    return apiError('Erreur lors de la récupération du profil', 500)
  }
}
