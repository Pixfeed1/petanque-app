/**
 * Moteur libre — comptage et classement (départage composable).
 *
 * Le classement se règle par une LISTE ORDONNÉE de critères (`tiebreakers`) : c'est
 * là qu'est la « règle perso ». On calcule les stats brutes depuis les matchs, puis
 * on trie en appliquant les critères dans l'ordre, la confrontation directe étant
 * évaluée à la volée sur les seuls ex æquo (comme le règlement FIPJP).
 */

import type { EngineMatch, EngineTeam, ScoringRule, StandingRow, TiebreakCriterion } from './types'

const clampDiff = (diff: number, cap?: number): number => {
  if (!cap || cap <= 0) return diff
  return Math.max(-cap, Math.min(cap, diff))
}

/** Calcule les lignes de classement à partir des matchs terminés d'une phase. */
export function computeStandings(
  teams: EngineTeam[],
  matches: EngineMatch[],
  scoring: ScoringRule
): StandingRow[] {
  const rows: StandingRow[] = teams.map((t, i) => ({
    teamId: t.id, teamIndex: i, played: 0, victories: 0, draws: 0, defeats: 0,
    goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
  }))

  for (const m of matches) {
    if (m.b === null || m.scoreA === undefined || m.scoreB === undefined) continue
    const A = rows[m.a], B = rows[m.b]
    if (!A || !B) continue
    const sa = m.scoreA, sb = m.scoreB
    A.played++; B.played++
    A.goalsFor += sa; A.goalsAgainst += sb
    B.goalsFor += sb; B.goalsAgainst += sa
    const cd = clampDiff(sa - sb, scoring.capDiff)
    A.goalDiff += cd; B.goalDiff += -cd
    if (sa > sb) { A.victories++; B.defeats++; A.points += scoring.win; B.points += scoring.loss }
    else if (sb > sa) { B.victories++; A.defeats++; B.points += scoring.win; A.points += scoring.loss }
    else { A.draws++; B.draws++; A.points += scoring.draw; B.points += scoring.draw }
  }
  return rows
}

/**
 * Classement INDIVIDUEL (mêlée recomposée) : chaque joueur cumule les résultats de
 * tous les matchs où il a joué, à partir des effectifs `aIds`/`bIds` enregistrés sur
 * chaque match (les indices d'équipe n'étant pas stables entre manches recomposées).
 */
export function computePlayerStandings(
  players: { id: string }[],
  _teams: EngineTeam[],
  matches: EngineMatch[],
  scoring: ScoringRule,
): StandingRow[] {
  const rows = new Map<string, StandingRow>()
  players.forEach((p, i) => rows.set(p.id, {
    teamId: p.id, teamIndex: i, played: 0, victories: 0, draws: 0, defeats: 0,
    goalsFor: 0, goalsAgainst: 0, goalDiff: 0, points: 0,
  }))
  const bump = (ids: string[] | undefined, gf: number, ga: number, res: 'W' | 'D' | 'L') => {
    for (const id of ids ?? []) {
      const r = rows.get(id)
      if (!r) continue
      r.played++; r.goalsFor += gf; r.goalsAgainst += ga
      r.goalDiff += clampDiff(gf - ga, scoring.capDiff)
      if (res === 'W') { r.victories++; r.points += scoring.win }
      else if (res === 'D') { r.draws++; r.points += scoring.draw }
      else { r.defeats++; r.points += scoring.loss }
    }
  }
  for (const m of matches) {
    if (m.b === null || m.scoreA === undefined || m.scoreB === undefined) continue
    const sa = m.scoreA, sb = m.scoreB
    bump(m.aIds, sa, sb, sa > sb ? 'W' : sa < sb ? 'L' : 'D')
    bump(m.bIds, sb, sa, sb > sa ? 'W' : sb < sa ? 'L' : 'D')
  }
  return [...rows.values()]
}

/** Confrontation directe entre deux équipes (différence de points sur leurs face-à-face). */
function headToHead(aIndex: number, bIndex: number, matches: EngineMatch[]): number {
  let diff = 0
  for (const m of matches) {
    if (m.scoreA === undefined || m.scoreB === undefined || m.b === null) continue
    if (m.a === aIndex && m.b === bIndex) diff += m.scoreA - m.scoreB
    else if (m.a === bIndex && m.b === aIndex) diff += m.scoreB - m.scoreA
  }
  return diff
}

/**
 * Trie les lignes selon les critères, dans l'ordre. Renvoie une nouvelle liste.
 * `niveauByTeam` optionnel pour le critère 'niveau'.
 */
export function rankStandings(
  rows: StandingRow[],
  tiebreakers: TiebreakCriterion[],
  matches: EngineMatch[],
  niveauByTeam?: Map<string, number>
): StandingRow[] {
  const value = (r: StandingRow, c: TiebreakCriterion): number => {
    switch (c) {
      case 'points': return r.points
      case 'victories': return r.victories
      case 'goalDiff': return r.goalDiff
      case 'goalsFor': return r.goalsFor
      case 'niveau': return niveauByTeam?.get(r.teamId) ?? 0
      case 'headToHead': return 0 // traité spécialement ci-dessous
      default: return 0
    }
  }
  return [...rows].sort((x, y) => {
    for (const c of tiebreakers) {
      if (c === 'headToHead') {
        const h = headToHead(x.teamIndex, y.teamIndex, matches)
        if (h !== 0) return -h // celui qui a la meilleure confrontation passe devant
        continue
      }
      const d = value(y, c) - value(x, c)
      if (d !== 0) return d
    }
    // Départage final stable : index d'équipe (déterministe).
    return x.teamIndex - y.teamIndex
  })
}
