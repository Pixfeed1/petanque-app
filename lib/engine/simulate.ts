/**
 * Moteur libre — harnais de SIMULATION.
 *
 * Joue des tournois entiers avec des scores pseudo-aléatoires À GRAINE, ce qui permet
 * de lancer des milliers de parties reproductibles et de vérifier des invariants
 * (aucun auto-match, tous les matchs joués, classement cohérent, déroulé identique à
 * graine égale). C'est la preuve « une multitude de parties » du moteur.
 */

import { Rng } from './rng'
import { runTournament, type PlayMatch, type EngineResult } from './engine'
import type { EnginePlayer, RuleConfig } from './types'

/** Score d'un match jusqu'à `pointsToWin` : le perdant marque 0..(pts-1), à graine. */
export function randomPlayMatch(pointsToWin: number): PlayMatch {
  return (_a, _b, rng) => {
    const loser = rng.int(pointsToWin) // 0..pts-1
    return rng.next() < 0.5 ? [pointsToWin, loser] : [loser, pointsToWin]
  }
}

/** Génère un vivier de joueurs déterministe (genre + niveau variés). */
export function makePlayers(n: number, seed = 1): EnginePlayer[] {
  const rng = new Rng(seed)
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    gender: rng.next() < 0.5 ? 'F' : 'H',
    niveau: 700 + rng.int(700), // 700..1399
  }))
}

export function simulate(config: RuleConfig, players: EnginePlayer[]): EngineResult {
  return runTournament(config, players, randomPlayMatch(config.scoring.pointsToWin))
}

export interface InvariantReport {
  ok: boolean
  errors: string[]
  matchCount: number
  teamCount: number
}

/** Vérifie les invariants structurels d'un résultat de tournoi. */
export function checkInvariants(res: EngineResult, players: EnginePlayer[]): InvariantReport {
  const errors: string[] = []
  // 1. Aucun auto-match.
  for (const m of res.matches) {
    if (m.b !== null && m.a === m.b) errors.push(`auto-match: ${m.a}`)
  }
  // 2. Scores valides sur les matchs joués (une équipe atteint le score cible).
  for (const m of res.matches) {
    if (m.b === null) continue
    if (m.scoreA === undefined || m.scoreB === undefined) errors.push('match sans score')
    else if (m.scoreA < 0 || m.scoreB < 0) errors.push('score négatif')
  }
  // 3. Classement : tout le monde présent, une seule fois.
  const ids = new Set(res.ranking)
  if (ids.size !== res.ranking.length) errors.push('doublon dans le classement')
  // 4. En classement par équipe, chaque joueur est dans exactement une équipe.
  if (!res.individual) {
    const assigned = res.teams.flatMap(t => t.joueur_ids)
    const dup = assigned.length !== new Set(assigned).size
    if (dup) errors.push('joueur dans plusieurs équipes')
  } else {
    // Classement individuel : tous les joueurs classés.
    if (res.ranking.length !== players.length) errors.push(`classement individuel incomplet (${res.ranking.length}/${players.length})`)
  }
  return { ok: errors.length === 0, errors, matchCount: res.matches.length, teamCount: res.teams.length }
}
