/**
 * Export centralisé des hooks de tournoi
 */

// Hooks
export { useTournamentData } from './useTournamentData'
export { useTeamManagement } from './useTeamManagement'
export { useMatchActions } from './useMatchActions'
export { useRotation } from './useRotation'
export { useRankings } from './useRankings'

// Types
export type {
  Tournament,
  TournamentSettings,
  Team,
  Match,
  Manche,
  EquipeJoueur
} from './useTournamentData'

export type {
  PlayerWithStats,
  TeamWithStats
} from './useRankings'
