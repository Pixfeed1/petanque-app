/**
 * Moteur de règles LIBRE — modèle de données.
 *
 * Un tournoi n'est plus un « mode » figé (choisi / mêlée / poules) mais une CONFIG
 * composable que le moteur interprète. La liberté vient de la composition : chaque
 * brique (formation, comptage, départage, progression, phases) se choisit et se combine.
 * Les modes historiques deviennent de simples PRESETS de cette config (voir presets.ts).
 *
 * Tout est DÉCLARATIF et SÉRIALISABLE (JSON) → stockable en base, rejouable, testable.
 */

// ── Joueurs ────────────────────────────────────────────────────────────
export interface EnginePlayer {
  id: string
  gender?: 'H' | 'F'
  /** Niveau cumulé (historique inter-concours) ; défaut neutre côté moteur. */
  niveau?: number
}

// ── Formation des équipes ──────────────────────────────────────────────
export type FormationMethod =
  | 'manual'    // équipes composées à la main (choisi)
  | 'random'    // tirage au sort (mêlée fixe)
  | 'balanced'  // équilibré par niveau cumulé
  | 'remixed'   // recomposé à chaque manche (mêlée tournante)

export interface FormationRule {
  method: FormationMethod
  /** Joueurs par équipe (1 = tête-à-tête, 2 = doublette, 3 = triplette). */
  teamSize: 1 | 2 | 3
  /** Mixité dans l'équipe : au moins 1 H et 1 F si possible. */
  mixiteEquipe?: boolean
  /** Mixité des adversaires : éviter F-majoritaire vs H-majoritaire. */
  mixiteAdversaire?: boolean
  /** Éviter de rejouer avec / contre les mêmes (mêlée). */
  antiRematch?: boolean
}

// ── Comptage des points d'un match ─────────────────────────────────────
export interface ScoringRule {
  /** Points à atteindre pour gagner une partie (défaut 13). */
  pointsToWin: number
  /** Points de classement : victoire / nul / défaite (FIPJP = 3 / 1 / 0). */
  win: number
  draw: number
  loss: number
  /** Écart de points par match plafonné (mode « fair-play »), 0 = pas de plafond. */
  capDiff?: number
}

// ── Départage (classement) — LISTE ORDONNÉE de critères composables ─────
export type TiebreakCriterion =
  | 'points'       // points de classement (V×win + N×draw)
  | 'victories'    // nombre de victoires
  | 'goalDiff'     // différence de points (bornée par capDiff éventuel)
  | 'goalsFor'     // points marqués
  | 'headToHead'   // confrontation directe
  | 'niveau'       // niveau cumulé (rare, mais composable)

// ── Phases ─────────────────────────────────────────────────────────────
export type PhaseType =
  | 'rounds'       // N manches libres (mêlée) — un match par équipe par manche
  | 'poules'       // round-robin en groupes
  | 'elimination'  // bracket à élimination

export interface PhaseRule {
  type: PhaseType
  /** rounds : nombre de manches. */
  rounds?: number
  /** poules : taille visée d'une poule. */
  pouleSize?: number
  /** poules → phase suivante : nombre de qualifiés par poule. */
  qualifiedPerPoule?: number
  /** elimination : petite finale (3e place). */
  petiteFinale?: boolean
}

// ── Config complète d'un tournoi ───────────────────────────────────────
export interface RuleConfig {
  formation: FormationRule
  scoring: ScoringRule
  /** Ordre des critères de départage (le 1er prime). */
  tiebreakers: TiebreakCriterion[]
  phases: PhaseRule[]
  /** Graine du RNG — rend le tournoi reproductible. */
  seed?: number
}

// ── État & sorties du moteur ───────────────────────────────────────────
export interface EngineTeam {
  id: string
  joueur_ids: string[]
}

export interface EngineMatch {
  /** Index d'équipe (dans la liste des équipes de la phase). null = bye. */
  a: number
  b: number | null
  scoreA?: number
  scoreB?: number
  phase: number
  round: number
  poule?: string | null
  /** Effectifs au moment du match — nécessaires au classement individuel (mêlée
   * recomposée, où les indices d'équipe ne sont plus stables d'une manche à l'autre). */
  aIds?: string[]
  bIds?: string[]
}

export interface StandingRow {
  teamId: string
  teamIndex: number
  played: number
  victories: number
  draws: number
  defeats: number
  goalsFor: number
  goalsAgainst: number
  goalDiff: number
  points: number
}
