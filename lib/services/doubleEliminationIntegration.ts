/**
 * Pont d'intégration entre l'algo de double élimination (pur) et la persistance.
 *
 * Le routage du bracket n'est jamais stocké : il se re-dérive depuis
 * `generateDoubleElimination(nbTeams)` via `computeBracketState`. Ici on
 * encapsule les deux opérations DB-agnostiques :
 *   - reconstruire l'ordre de seeding à partir des matchs W1 déjà stockés ;
 *   - recalculer l'état cible complet du bracket (équipes + statuts + byes).
 *
 * Aucune dépendance DB/réseau : 100% testable.
 */

import {
  computeBracketState,
  parseDeType,
  seedOrder,
  type DEMatchState,
} from './doubleElimination.service'

/** Vue minimale d'une ligne `matches` double élim (type "de:*"). */
export interface DEStoredRow {
  type: string | null
  equipe_a_id: string | null
  equipe_b_id: string | null
  status: string
  winner_id: string | null
}

/**
 * Reconstruit `nbTeams` et `teamIdsBySeed` depuis les matchs du 1er tour WB.
 * Les matchs W1 encodent le seeding : la place 2i / 2i+1 correspond aux seeds
 * `seedOrder(B)[2i]` / `[2i+1]`. Les seeds réels valent 1..nbTeams (les byes
 * occupent les seeds > nbTeams). Déterministe et sans état stocké.
 */
export function deriveSeeding(rows: DEStoredRow[]): { nbTeams: number; teamIdsBySeed: string[] } {
  const w1: Array<{ index: number; a: string | null; b: string | null }> = []
  for (const r of rows) {
    const slot = parseDeType(r.type) // "W1-0" | "GF" | ... | null
    if (!slot) continue
    const mm = /^W1-(\d+)$/.exec(slot)
    if (!mm) continue
    w1.push({ index: parseInt(mm[1], 10), a: r.equipe_a_id, b: r.equipe_b_id })
  }
  if (w1.length === 0) return { nbTeams: 0, teamIdsBySeed: [] }

  const B = w1.length * 2 // bracketSize : chaque match W1 couvre 2 places
  const order = seedOrder(B)
  const seedToTeam = new Map<number, string>()
  for (const m of w1) {
    const seedA = order[2 * m.index]
    const seedB = order[2 * m.index + 1]
    if (m.a) seedToTeam.set(seedA, m.a)
    if (m.b) seedToTeam.set(seedB, m.b)
  }

  const nbTeams = seedToTeam.size
  const teamIdsBySeed: string[] = []
  for (let s = 1; s <= nbTeams; s++) {
    const id = seedToTeam.get(s)
    if (id === undefined) {
      throw new Error(`Double élim : reconstruction du seeding incomplète (seed ${s} manquant)`)
    }
    teamIdsBySeed.push(id)
  }
  return { nbTeams, teamIdsBySeed }
}

/**
 * État cible complet du bracket à partir des lignes stockées :
 * - reconstruit le seeding depuis les matchs W1 ;
 * - rejoue les résultats des matchs `de:*` terminés ;
 * - renvoie l'état recalculé (équipes placées, byes propagés, statuts).
 */
export function computeTargetState(rows: DEStoredRow[]): DEMatchState<string>[] {
  const { nbTeams, teamIdsBySeed } = deriveSeeding(rows)
  if (nbTeams < 3) return []

  const results = new Map<string, string>()
  for (const r of rows) {
    const slot = parseDeType(r.type)
    if (!slot) continue
    if (r.status === 'termine' && r.winner_id) results.set(slot, r.winner_id)
  }

  return computeBracketState(nbTeams, teamIdsBySeed, results)
}

/** Lignes initiales à insérer pour une nouvelle phase double élim (results vide). */
export interface DEInsertRow {
  type: string
  tour: number
  equipe_a_id: string | null
  equipe_b_id: string | null
  status: DEMatchState<string>['status']
  winner_id: string | null
}

export function buildInitialRows(teamIdsBySeed: string[]): DEInsertRow[] {
  const state = computeBracketState(teamIdsBySeed.length, teamIdsBySeed)
  return state.map((m) => ({
    type: m.type,
    tour: m.tour,
    equipe_a_id: m.equipeAId,
    equipe_b_id: m.equipeBId,
    status: m.status,
    winner_id: m.winnerId, // non-null uniquement pour les byes pré-résolus
  }))
}

/**
 * Détermine l'équipe 3e (perdant de la finale du losers bracket).
 * = le perdant du match `L*` de plus grand `round`, une fois ce match terminé.
 * Renvoie null tant que la finale LB n'est pas jouée.
 */
export function thirdPlaceTeamId(rows: DEStoredRow[]): string | null {
  const state = computeTargetState(rows)
  const lbMatches = state.filter((m) => m.bracket === 'L')
  if (lbMatches.length === 0) return null
  const lbFinal = lbMatches.reduce((best, m) => (m.round > best.round ? m : best), lbMatches[0])
  if (lbFinal.status !== 'termine' || lbFinal.isBye || !lbFinal.winnerId) return null
  // le perdant = l'équipe du match qui n'est pas le gagnant
  if (lbFinal.equipeAId && lbFinal.equipeAId !== lbFinal.winnerId) return lbFinal.equipeAId
  if (lbFinal.equipeBId && lbFinal.equipeBId !== lbFinal.winnerId) return lbFinal.equipeBId
  return null
}
