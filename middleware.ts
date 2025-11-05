// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_ROUTES = [
  '/', '/login', '/features', '/modes', '/quizz', '/guide', '/faq',
  '/legal/terms', '/legal/privacy', '/legal/cookies', '/legal/rgpd', '/legal/mentions',
  '/api/auth/login', '/api/auth/signup', '/api/auth/oauth',
]

const PROTECTED_ROUTES = [
  '/dashboard', '/tournaments', '/tournoi', '/joueurs', '/players', '/teams',
  '/equipes', '/stats', '/settings', '/parametres',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/api/auth/oauth')) return NextResponse.next()
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))
  if (isPublicRoute) return NextResponse.next()
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  if (isProtectedRoute && !request.cookies.get('auth-token')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
