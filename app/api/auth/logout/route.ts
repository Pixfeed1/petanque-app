// app/api/auth/logout/route.ts
// API de déconnexion

import { NextRequest } from 'next/server'
import { apiSuccess } from '@/lib/middleware'

export async function POST(request: NextRequest) {
  // Créer la réponse
  const response = apiSuccess({
    message: 'Déconnexion réussie'
  })

  // Supprimer le cookie
  // sameSite: 'strict' pour protection CSRF maximale
  response.cookies.set({
    name: 'auth-token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // Protection CSRF renforcée
    maxAge: 0,
    path: '/'
  })

  return response
}
