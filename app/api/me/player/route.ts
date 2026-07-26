// Vue « joueur » de l'utilisateur connecté : ses fiches, tournois et prochains matchs.
import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { getPlayerView } from '@/lib/services/playerView'

export async function GET(request: NextRequest) {
  try {
    const limited = applyRateLimit(request, 'me-player', RATE_LIMITS.api)
    if (limited) return limited

    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const profiles = await getPlayerView(user.id)
    return apiSuccess({ profiles })
  } catch (error) {
    console.error('❌ me/player:', error)
    return apiError('Erreur lors de la récupération de l\'espace joueur', 500)
  }
}
