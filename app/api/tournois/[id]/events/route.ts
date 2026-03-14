// app/api/tournois/[id]/events/route.ts
// SSE endpoint pour le temps réel d'un tournoi

import { NextRequest } from 'next/server'
import { requireAuth, checkOrgAccess } from '@/lib/middleware'
import { queryOne } from '@/lib/db'
import { tournamentEmitter, TournamentEvent } from '@/lib/tournament-events'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Authentifier l'utilisateur
  const authResult = await requireAuth(request)
  if (authResult instanceof Response) return authResult

  const { user } = authResult
  const { id: tournoiId } = await params

  // Vérifier que le tournoi existe et que l'utilisateur y a accès
  const tournoi = await queryOne(
    'SELECT org_id FROM tournois WHERE id = $1',
    [tournoiId]
  )

  if (!tournoi) {
    return new Response('Tournoi introuvable', { status: 404 })
  }

  const hasAccess = await checkOrgAccess(user.id, tournoi.org_id)
  if (!hasAccess) {
    return new Response('Accès refusé', { status: 403 })
  }

  // Créer le stream SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      // Envoyer un heartbeat initial
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected', tournoi_id: tournoiId })}\n\n`))

      // Écouter les événements du tournoi
      const onEvent = (event: TournamentEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
        } catch {
          // Le client s'est déconnecté
          cleanup()
        }
      }

      // Heartbeat toutes les 30s pour maintenir la connexion
      const heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: heartbeat\n\n`))
        } catch {
          cleanup()
        }
      }, 30000)

      const eventName = `tournament:${tournoiId}`
      tournamentEmitter.on(eventName, onEvent)

      function cleanup() {
        tournamentEmitter.off(eventName, onEvent)
        clearInterval(heartbeatInterval)
        try {
          controller.close()
        } catch {
          // Déjà fermé
        }
      }

      // Nettoyage si le client se déconnecte
      request.signal.addEventListener('abort', cleanup)
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
