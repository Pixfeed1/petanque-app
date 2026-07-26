// Vue « joueur » de l'utilisateur connecté : ses fiches, tournois et prochains matchs.
import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { getPlayerView } from '@/lib/services/playerView'

export async function GET(request: NextRequest) {
  try {
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
