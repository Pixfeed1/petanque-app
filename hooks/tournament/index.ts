/**
 * Export centralisé des hooks de tournoi
 */

// Hooks - Page détail tournoi
export { useTournamentData } from './useTournamentData'
export { useTeamManagement } from './useTeamManagement'
export { useMatchActions } from './useMatchActions'
export { useRotation } from './useRotation'
export { useRankings } from './useRankings'

// Hooks - Création tournoi
export { useCreateTournament } from './useCreateTournament'
export { usePlayerSelection } from './usePlayerSelection'
export { useTournamentCreation } from './useTournamentCreation'

// Types - Détail tournoi
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

// Types - Création tournoi
export type {
  TournamentFormData,
  NewPlayer,
  StepConfig
} from './useCreateTournament'
