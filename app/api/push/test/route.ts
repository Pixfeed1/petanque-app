// Envoie une notification de test à l'utilisateur connecté (vérifie l'installation).
import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { sendPushToUser, isWebPushConfigured } from '@/lib/push/server'

export async function POST(request: NextRequest) {
  try {
    const limited = applyRateLimit(request, 'push-test', RATE_LIMITS.batch)
    if (limited) return limited

    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    if (!isWebPushConfigured()) {
      return apiError('Notifications non configurées sur le serveur (clés VAPID manquantes)', 503)
    }
    const sent = await sendPushToUser(user.id, {
      title: 'Pétanque Pro',
      body: 'Les notifications sont bien activées 🎉',
      url: '/dashboard',
      tag: 'test',
    })
    return apiSuccess({ sent })
  } catch (error) {
    console.error('❌ push/test:', error)
    return apiError('Erreur lors de l\'envoi du test', 500)
  }
}
