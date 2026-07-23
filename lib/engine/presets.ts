/**
 * Moteur libre — PRESETS.
 *
 * Preuve que le moteur généralise l'existant : les modes historiques (choisi, mêlée
 * fixe, mêlée tournante, poules → élimination) ne sont que des configs particulières
 * du moteur. On peut donc migrer sans rien perdre, et l'utilisateur reste libre de
 * partir d'un preset puis de recomposer les briques.
 */

import type { RuleConfig, FormationRule, PhaseRule } from './types'

const FIPJP = { pointsToWin: 13, win: 3, draw: 1, loss: 0 as number }
const FIPJP_TIEBREAKERS = ['points', 'goalDiff', 'headToHead'] as const

interface PresetOptions {
  teamSize?: 1 | 2 | 3
  pointsToWin?: number
  rounds?: number
  pouleSize?: number
  qualifiedPerPoule?: number
  petiteFinale?: boolean
  mixiteEquipe?: boolean
  mixiteAdversaire?: boolean
  fairPlay?: boolean
  equilibrageNiveau?: boolean
  seed?: number
}

function baseScoring(o: PresetOptions) {
  return { ...FIPJP, pointsToWin: o.pointsToWin ?? 13, capDiff: o.fairPlay ? 5 : 0 }
}

function baseFormation(o: PresetOptions, method: FormationRule['method']): FormationRule {
  return {
    method: o.equilibrageNiveau && method !== 'remixed' ? 'balanced' : method,
    teamSize: o.teamSize ?? 2,
    mixiteEquipe: o.mixiteEquipe,
    mixiteAdversaire: o.mixiteAdversaire,
    antiRematch: method === 'remixed',
  }
}

/** Mêlée fixe : équipes tirées au sort une fois, poules → élimination. */
export function presetMeleeFixe(o: PresetOptions = {}): RuleConfig {
  const phases: PhaseRule[] = [
    { type: 'poules', pouleSize: o.pouleSize ?? 4, qualifiedPerPoule: o.qualifiedPerPoule ?? 2 },
    { type: 'elimination', petiteFinale: o.petiteFinale },
  ]
  return { formation: baseFormation(o, 'random'), scoring: baseScoring(o), tiebreakers: [...FIPJP_TIEBREAKERS], phases, seed: o.seed }
}

/** Mêlée tournante : équipes recomposées à chaque manche, classement individuel. */
export function presetMeleeTournante(o: PresetOptions = {}): RuleConfig {
  return {
    formation: baseFormation(o, 'remixed'),
    scoring: baseScoring(o),
    tiebreakers: [...FIPJP_TIEBREAKERS],
    phases: [{ type: 'rounds', rounds: o.rounds ?? 4 }],
    seed: o.seed,
  }
}

/** Poules → élimination (équipes tirées au sort ou équilibrées). */
export function presetPoulesElimination(o: PresetOptions = {}): RuleConfig {
  return presetMeleeFixe(o)
}

/** N parties : même équipes, adversaires re-tirés à chaque partie, classement par équipe. */
export function presetNParties(o: PresetOptions = {}): RuleConfig {
  return {
    formation: baseFormation(o, 'random'),
    scoring: baseScoring(o),
    tiebreakers: [...FIPJP_TIEBREAKERS],
    phases: [{ type: 'rounds', rounds: o.rounds ?? 3 }],
    seed: o.seed,
  }
}
