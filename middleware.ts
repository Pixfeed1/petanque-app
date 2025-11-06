// middleware.ts
// Middleware Next.js pour protéger les routes

import { NextRequest, NextResponse } from 'next/server'

// Routes publiques qui ne nécessitent pas d'authentification
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/features',
  '/modes',
  '/quizz',
  '/guide',
  '/faq',
  '/legal/terms',
  '/legal/privacy',
  '/legal/cookies',
  '/legal/rgpd',
  '/legal/mentions',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/oauth',
]

// Routes qui nécessitent une authentification
const PROTECTED_ROUTES = [
  '/dashboard',
  '/tournaments',
  '/tournoi',
  '/joueurs',
  '/players',
  '/teams',
  '/equipes',
  '/stats',
  '/settings',
  '/parametres',
  '/api/tournois',
  '/api/tournaments',
  '/api/joueurs',
  '/api/players',
  '/api/equipes',
  '/api/teams',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Vérifier si la route est une route OAuth (inclut toutes les sous-routes)
  if (pathname.startsWith('/api/auth/oauth')) {
    return NextResponse.next()
  }

  // Vérifier si la route est publique
  const isPublicRoute = PUBLIC_ROUTES.some(route =>
    pathname === route || pathname.startsWith(route + '/')
  )

  // Si c'est une route publique, laisser passer
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Vérifier si c'est une route protégée
  const isProtectedRoute = PROTECTED_ROUTES.some(route =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute) {
    // Vérifier la présence du cookie d'authentification
    const authToken = request.cookies.get('auth-token')

    if (!authToken) {
      // Rediriger vers la page de login
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

// Configuration du middleware
export const config = {
  // Matcher pour toutes les routes sauf les fichiers statiques
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
