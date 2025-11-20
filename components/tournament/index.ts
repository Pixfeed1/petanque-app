/**
 * Point d'entrée pour tous les composants du tournoi
 * Permet d'importer facilement :
 * import { TournamentHeader, MatchCard, StandingsTable } from '@/components/tournament'
 */

export { default as TournamentHeader } from './TournamentHeader'
export { default as TournamentInfoCards } from './TournamentInfoCards'
export { default as MatchCard } from './MatchCard'
export { default as StandingsTable } from './StandingsTable'
export { default as PlayerRankingsTable } from './PlayerRankingsTable'

// Re-export des types
export type { TeamStanding } from './StandingsTable'
export type { PlayerRanking } from './PlayerRankingsTable'
