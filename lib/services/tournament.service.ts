/**
 * Service pour les calculs liés aux tournois de pétanque
 */

export interface TournamentDurationParams {
  nbTeams: number
  nbTerrains: number
  format: 'tete_a_tete' | 'doublette' | 'triplette'
  mode: 'choisi' | 'melee_fixe' | 'melee_tournante'
  pouleSize?: number
  qualifiedPerPoule?: number
  hasElimination?: boolean
  timeLimit?: boolean
  timeLimitMinutes?: number
}

export interface DurationEstimation {
  minMinutes: number
  maxMinutes: number
  nbPouleMatches: number
  nbEliminationMatches: number
  nbTotalMatches: number
  matchesPerRound: number
  nbRounds: number
  avgMatchDuration: number
}

export class TournamentService {
  /**
   * Durée moyenne d'un match de pétanque en minutes selon le format
   * - Tête-à-tête: plus court (généralement 25-35 min)
   * - Doublette/Triplette: plus long (30-50 min)
   */
  static getAverageMatchDuration(format: string, timeLimit?: boolean, timeLimitMinutes?: number): { min: number; max: number } {
    // Si un time limit est défini, l'utiliser comme max
    if (timeLimit && timeLimitMinutes) {
      const minTime = Math.min(timeLimitMinutes * 0.6, 30) // Au moins 60% du temps ou 30 min
      return { min: minTime, max: timeLimitMinutes }
    }

    // Durées moyennes observées en pétanque
    switch (format) {
      case 'tete_a_tete':
        return { min: 25, max: 40 }
      case 'doublette':
        return { min: 35, max: 50 }
      case 'triplette':
        return { min: 40, max: 55 }
      default:
        return { min: 30, max: 45 }
    }
  }

  /**
   * Calcule le nombre de matchs dans une phase de poules
   * Formule: n * (n-1) / 2 pour chaque poule (round robin)
   */
  static calculatePouleMatches(nbTeams: number, pouleSize: number): number {
    if (pouleSize < 2) return 0

    const nbPoules = Math.ceil(nbTeams / pouleSize)
    // Matchs dans chaque poule (round robin)
    const matchesPerPoule = (pouleSize * (pouleSize - 1)) / 2

    return Math.floor(nbPoules * matchesPerPoule)
  }

  /**
   * Calcule le nombre de matchs en phase éliminatoire
   * n-1 matchs pour un bracket simple
   */
  static calculateEliminationMatches(nbQualified: number, includeConsolante = false): number {
    if (nbQualified < 2) return 0

    // Simple élimination: n-1 matchs
    let matches = nbQualified - 1

    // Petite finale (3e place)
    if (nbQualified >= 4) {
      matches += 1
    }

    // Consolante (pour les éliminés des poules)
    if (includeConsolante) {
      // Approximation: autant de matchs que l'élimination principale / 2
      matches += Math.ceil(matches / 2)
    }

    return matches
  }

  /**
   * Estime la durée totale d'un tournoi
   */
  static estimateTournamentDuration(params: TournamentDurationParams): DurationEstimation {
    const {
      nbTeams,
      nbTerrains,
      format,
      pouleSize = 4,
      qualifiedPerPoule = 2,
      hasElimination = true,
      timeLimit,
      timeLimitMinutes
    } = params

    // Durée moyenne d'un match
    const avgDuration = this.getAverageMatchDuration(format, timeLimit, timeLimitMinutes)
    const avgMatchDuration = (avgDuration.min + avgDuration.max) / 2

    // Calcul du nombre de matchs
    const nbPouleMatches = this.calculatePouleMatches(nbTeams, pouleSize)

    // Nombre d'équipes qualifiées pour les éliminatoires
    const nbPoules = Math.ceil(nbTeams / pouleSize)
    const nbQualified = hasElimination ? Math.min(nbPoules * qualifiedPerPoule, nbTeams) : 0

    const nbEliminationMatches = hasElimination ? this.calculateEliminationMatches(nbQualified) : 0
    const nbTotalMatches = nbPouleMatches + nbEliminationMatches

    // Nombre de matchs par "tour" (simultanément sur les terrains)
    const effectiveTerrains = Math.max(1, nbTerrains)
    const matchesPerRound = effectiveTerrains

    // Nombre de "tours" nécessaires
    const nbRounds = Math.ceil(nbTotalMatches / matchesPerRound)

    // Durée totale
    // On ajoute 5-10 minutes entre chaque tour pour les transitions
    const transitionTime = 5 // minutes

    const minMinutes = Math.round(nbRounds * avgDuration.min + (nbRounds - 1) * transitionTime)
    const maxMinutes = Math.round(nbRounds * avgDuration.max + (nbRounds - 1) * (transitionTime + 5))

    return {
      minMinutes,
      maxMinutes,
      nbPouleMatches,
      nbEliminationMatches,
      nbTotalMatches,
      matchesPerRound,
      nbRounds,
      avgMatchDuration
    }
  }

  /**
   * Formate la durée en texte lisible
   */
  static formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`
    }

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (mins === 0) {
      return `${hours}h`
    }

    return `${hours}h${mins.toString().padStart(2, '0')}`
  }

  /**
   * Retourne une estimation textuelle de la durée
   */
  static formatDurationRange(estimation: DurationEstimation): string {
    const minFormatted = this.formatDuration(estimation.minMinutes)
    const maxFormatted = this.formatDuration(estimation.maxMinutes)

    if (minFormatted === maxFormatted) {
      return `~${minFormatted}`
    }

    return `${minFormatted} - ${maxFormatted}`
  }
}

export default TournamentService
