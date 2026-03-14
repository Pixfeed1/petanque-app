// lib/tournament-events.ts
// Event emitter pour le temps réel des tournois via SSE

import { EventEmitter } from 'events'

export type TournamentEventType =
  | 'match:updated'
  | 'match:created'
  | 'match:deleted'
  | 'team:updated'
  | 'team:created'
  | 'tournament:updated'

export interface TournamentEvent {
  type: TournamentEventType
  tournoi_id: string
  data?: unknown
  timestamp: string
}

// Singleton global pour persister entre les requêtes API (Next.js hot reload safe)
const globalForEvents = globalThis as unknown as {
  tournamentEmitter: EventEmitter | undefined
}

export const tournamentEmitter = globalForEvents.tournamentEmitter ?? new EventEmitter()
tournamentEmitter.setMaxListeners(200)

if (process.env.NODE_ENV !== 'production') {
  globalForEvents.tournamentEmitter = tournamentEmitter
}

/**
 * Émet un événement pour un tournoi spécifique
 * Les clients SSE connectés à ce tournoi recevront la notification
 */
export function emitTournamentEvent(
  type: TournamentEventType,
  tournoiId: string,
  data?: unknown
) {
  const event: TournamentEvent = {
    type,
    tournoi_id: tournoiId,
    data,
    timestamp: new Date().toISOString()
  }
  tournamentEmitter.emit(`tournament:${tournoiId}`, event)
}
