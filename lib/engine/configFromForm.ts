/**
 * Moteur libre — construit une RuleConfig à partir des réglages du mode « Personnalisé ».
 * Réutilise les mêmes champs que le formulaire de création (format, points, fair-play…)
 * plus les choix propres au moteur (méthode de formation, structure, ordre de départage).
 */

import type { RuleConfig, FormationMethod, TiebreakCriterion, PhaseRule } from './types'

export interface EngineFormValues {
  format: 'tete_a_tete' | 'doublette' | 'triplette'
  maxPoints?: number
  fairPlay?: boolean
  mixiteObligatoire?: boolean
  mixiteAdversaire?: boolean
  consolante?: boolean
  // Réglages moteur
  engineFormation?: FormationMethod   // random | balanced | remixed | manual
  engineStructure?: 'rounds' | 'poules' // manches libres OU poules → élimination
  rounds?: number
  pouleSize?: number
  qualifiedPerPoule?: number
  /** Ordre de départage ; défaut FIPJP. Si headToHeadFirst, la confrontation directe passe avant la différence. */
  headToHeadFirst?: boolean
  seed?: number
}

const teamSizeOf = (f: EngineFormValues['format']): 1 | 2 | 3 =>
  f === 'tete_a_tete' ? 1 : f === 'doublette' ? 2 : 3

export function configFromForm(v: EngineFormValues): RuleConfig {
  const teamSize = teamSizeOf(v.format)
  const method: FormationMethod = v.engineFormation ?? 'random'

  const tiebreakers: TiebreakCriterion[] = v.headToHeadFirst
    ? ['points', 'headToHead', 'goalDiff', 'goalsFor']
    : ['points', 'goalDiff', 'headToHead', 'goalsFor']

  const structure = v.engineStructure ?? 'rounds'
  const phases: PhaseRule[] = structure === 'poules'
    ? [
        { type: 'poules', pouleSize: v.pouleSize ?? 4, qualifiedPerPoule: v.qualifiedPerPoule ?? 2 },
        { type: 'elimination', petiteFinale: !!v.consolante },
      ]
    : [{ type: 'rounds', rounds: Math.max(1, v.rounds ?? 3) }]

  return {
    formation: {
      method,
      teamSize,
      mixiteEquipe: !!v.mixiteObligatoire && teamSize > 1,
      mixiteAdversaire: !!v.mixiteAdversaire && teamSize > 1,
      antiRematch: method === 'remixed',
    },
    scoring: {
      pointsToWin: v.maxPoints ?? 13,
      win: 3, draw: 1, loss: 0,
      capDiff: v.fairPlay ? 5 : 0,
    },
    tiebreakers,
    phases,
    seed: v.seed,
  }
}
