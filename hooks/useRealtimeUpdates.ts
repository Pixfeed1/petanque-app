// hooks/useRealtimeUpdates.ts
// Hook SSE pour recevoir les mises à jour en temps réel d'un tournoi

import { useEffect, useRef, useCallback, useState } from 'react'

export type RealtimeEventType =
  | 'connected'
  | 'match:updated'
  | 'match:created'
  | 'match:deleted'
  | 'team:updated'
  | 'team:created'
  | 'tournament:updated'

interface RealtimeEvent {
  type: RealtimeEventType
  tournoi_id: string
  data?: unknown
  timestamp: string
}

interface UseRealtimeUpdatesOptions {
  tournoiId: string | undefined
  enabled: boolean
  onEvent: (event: RealtimeEvent) => void
}

export function useRealtimeUpdates({ tournoiId, enabled, onEvent }: UseRealtimeUpdatesOptions) {
  const eventSourceRef = useRef<EventSource | null>(null)
  const onEventRef = useRef(onEvent)
  const [connected, setConnected] = useState(false)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const reconnectAttemptRef = useRef(0)

  // Garder la callback à jour sans recréer la connexion
  onEventRef.current = onEvent

  const connect = useCallback(() => {
    if (!tournoiId || !enabled) return

    // Fermer la connexion existante
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const es = new EventSource(`/api/tournois/${tournoiId}/events`)
    eventSourceRef.current = es

    es.onopen = () => {
      setConnected(true)
      reconnectAttemptRef.current = 0
    }

    es.onmessage = (event) => {
      try {
        const data: RealtimeEvent = JSON.parse(event.data)
        onEventRef.current(data)
      } catch {
        // Ignorer les messages invalides (heartbeats, etc.)
      }
    }

    es.onerror = () => {
      setConnected(false)
      es.close()
      eventSourceRef.current = null

      // Reconnexion avec backoff exponentiel (max 30s)
      const attempt = reconnectAttemptRef.current++
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000)

      reconnectTimeoutRef.current = setTimeout(() => {
        connect()
      }, delay)
    }
  }, [tournoiId, enabled])

  useEffect(() => {
    connect()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
        eventSourceRef.current = null
      }
      setConnected(false)
    }
  }, [connect])

  return { connected }
}
