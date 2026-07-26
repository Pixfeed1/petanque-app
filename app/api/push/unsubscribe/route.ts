// Désinscription : supprime un abonnement push (Web Push ou FCM).
import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, parseJsonBody } from '@/lib/middleware'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { deleteSubscription } from '@/lib/push/server'

interface Body { endpoint?: string; fcmToken?: string }

export async function POST(request: NextRequest) {
  try {
    const limited = applyRateLimit(request, 'push-unsubscribe', RATE_LIMITS.write)
    if (limited) return limited

    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const parsed = await parseJsonBody<Body>(request)
    if ('error' in parsed) return parsed.error
    const body = parsed.data
    if (!body.endpoint && !body.fcmToken) {
      return apiError('endpoint ou fcmToken requis', 400)
    }
    await deleteSubscription({ endpoint: body.endpoint, fcmToken: body.fcmToken })
    return apiSuccess({ unsubscribed: true })
  } catch (error) {
    console.error('❌ push/unsubscribe:', error)
    return apiError('Erreur lors de la désinscription', 500)
  }
}
