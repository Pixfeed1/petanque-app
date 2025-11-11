// lib/rate-limit.ts
// Rate limiting pour protéger contre les attaques par force brute

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Store en mémoire pour le rate limiting
// En production, utilisez Redis pour un rate limiting distribué
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup automatique toutes les 10 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key)
    }
  }
}, 10 * 60 * 1000) // 10 minutes

export interface RateLimitConfig {
  /**
   * Nombre maximum de requêtes autorisées
   */
  maxRequests: number

  /**
   * Fenêtre de temps en millisecondes
   */
  windowMs: number

  /**
   * Message d'erreur personnalisé
   */
  message?: string
}

/**
 * Extrait l'adresse IP du client depuis la requête
 */
export function getClientIP(request: NextRequest): string {
  // Vérifier les headers de proxy (Vercel, Cloudflare, etc.)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }

  // Fallback: utiliser une IP fictive pour le développement local
  return request.ip || '127.0.0.1'
}

/**
 * Middleware de rate limiting
 *
 * @param request - Requête Next.js
 * @param identifier - Identifiant unique (ex: 'login', 'signup')
 * @param config - Configuration du rate limiting
 * @returns null si autorisé, NextResponse avec erreur 429 si limite dépassée
 */
export function rateLimit(
  request: NextRequest,
  identifier: string,
  config: RateLimitConfig
): NextResponse | null {
  const ip = getClientIP(request)
  const key = `${identifier}:${ip}`
  const now = Date.now()

  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    // Nouvelle fenêtre de temps
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs
    })
    return null // Autorisé
  }

  if (entry.count >= config.maxRequests) {
    // Limite dépassée
    const resetInSeconds = Math.ceil((entry.resetAt - now) / 1000)

    return NextResponse.json(
      {
        success: false,
        error: config.message || 'Trop de tentatives. Veuillez réessayer plus tard.',
        retryAfter: resetInSeconds
      },
      {
        status: 429,
        headers: {
          'Retry-After': resetInSeconds.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(entry.resetAt / 1000).toString()
        }
      }
    )
  }

  // Incrémenter le compteur
  entry.count++
  rateLimitStore.set(key, entry)

  return null // Autorisé
}

/**
 * Configurations prédéfinies pour différents endpoints
 */
export const RATE_LIMITS = {
  /**
   * Login: 5 tentatives par IP toutes les 15 minutes
   * Protection contre les attaques par force brute
   */
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
  } as RateLimitConfig,

  /**
   * Signup: 3 créations de compte par IP toutes les 60 minutes
   * Protection contre le spam de création de comptes
   */
  signup: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 60 minutes
    message: 'Trop de créations de compte. Veuillez réessayer dans 1 heure.'
  } as RateLimitConfig,

  /**
   * Reset password: 3 demandes par IP toutes les 60 minutes
   * Protection contre le spam de reset
   */
  resetPassword: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 60 minutes
    message: 'Trop de demandes de réinitialisation. Veuillez réessayer dans 1 heure.'
  } as RateLimitConfig,

  /**
   * API générale: 100 requêtes par IP toutes les 15 minutes
   * Protection générale contre les abus
   */
  api: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: 'Trop de requêtes. Veuillez réessayer plus tard.'
  } as RateLimitConfig
}

/**
 * Helper pour appliquer le rate limiting dans une route API
 *
 * @example
 * export async function POST(request: NextRequest) {
 *   const rateLimitResponse = applyRateLimit(request, 'login', RATE_LIMITS.login)
 *   if (rateLimitResponse) return rateLimitResponse
 *
 *   // ... reste du code
 * }
 */
export function applyRateLimit(
  request: NextRequest,
  identifier: string,
  config: RateLimitConfig
): NextResponse | null {
  return rateLimit(request, identifier, config)
}

/**
 * Réinitialise le rate limit pour un identifiant + IP
 * Utile pour les tests ou après une connexion réussie
 */
export function resetRateLimit(request: NextRequest, identifier: string): void {
  const ip = getClientIP(request)
  const key = `${identifier}:${ip}`
  rateLimitStore.delete(key)
}

/**
 * Obtient les informations de rate limit pour une requête
 */
export function getRateLimitInfo(
  request: NextRequest,
  identifier: string,
  config: RateLimitConfig
): {
  remaining: number
  resetAt: number
  limit: number
} {
  const ip = getClientIP(request)
  const key = `${identifier}:${ip}`
  const now = Date.now()

  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    return {
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
      limit: config.maxRequests
    }
  }

  return {
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
    limit: config.maxRequests
  }
}
