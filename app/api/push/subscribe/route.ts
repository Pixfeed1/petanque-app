// Enregistre un abonnement push (Web Push ou jeton FCM natif) pour l'utilisateur connecté.
import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, parseJsonBody } from '@/lib/middleware'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { saveWebSubscription, saveFcmToken } from '@/lib/push/server'

interface Body {
  subscription?: { endpoint: string; keys: { p256dh: string; auth: string } }
  fcmToken?: string
}

export async function POST(request: NextRequest) {
  try {
    const limited = applyRateLimit(request, 'push-subscribe', RATE_LIMITS.write)
    if (limited) return limited

    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const parsed = await parseJsonBody<Body>(request)
    if ('error' in parsed) return parsed.error
    const body = parsed.data

    const ua = request.headers.get('user-agent') || undefined

    if (body.subscription?.endpoint && body.subscription.keys?.p256dh && body.subscription.keys?.auth) {
      await saveWebSubscription(user.id, body.subscription, ua)
      return apiSuccess({ registered: 'web' })
    }
    if (body.fcmToken) {
      await saveFcmToken(user.id, body.fcmToken, ua)
      return apiSuccess({ registered: 'android' })
    }
    return apiError('Abonnement manquant (subscription ou fcmToken)', 400)
  } catch (error) {
    console.error('❌ push/subscribe:', error)
    return apiError('Erreur lors de l\'enregistrement de l\'abonnement', 500)
  }
}
