/**
 * Point d'entrée centralisé pour tous les services
 * Permet d'importer facilement les services dans les composants
 *
 * Usage:
 * import { StatsService, BracketService, ValidationService, TournamentService } from '@/lib/services'
 */

export * as StatsService from './stats.service'
export * as BracketService from './bracket.service'
export * as ValidationService from './validation.service'
export { TournamentService } from './tournament.service'

// Re-export des types pour faciliter l'usage
export type { TeamStats, PlayerStats } from './stats.service'
export type { BracketMatch } from './bracket.service'
export type { ValidationResult } from './validation.service'
export type { TournamentDurationParams, DurationEstimation } from './tournament.service'
