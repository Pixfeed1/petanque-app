/**
 * Moteur libre — interpréteur déterministe d'une config de tournoi.
 *
 * `runTournament` déroule TOUT le tournoi à partir d'une config composable et d'une
 * fonction `playMatch` qui fournit le score d'un match (scores réels en prod, scores
 * pseudo-aléatoires à graine en simulation). Aucune dépendance au hasard non maîtrisé :
 * même config + même graine ⇒ même déroulé, à 100 %. C'est ce qui rend le moteur
 * testable par des milliers de parties (voir simulate.ts).
 *
 * Phases supportées : rounds (manches libres, équipes stables ou recomposées),
 * poules (round-robin + qualifiés), elimination (bracket simple + petite finale).
 */

import { Rng } from './rng'
import { formTeams } from './formation'
import { computeStandings, computePlayerStandings, rankStandings } from './ranking'
import { bergerRoundRobin } from '@/lib/services/tirage.service'
import { profilesCompatible, teamGenderProfile, type GenderProfile } from '@/lib/services/mixiteAdversaire'
import type {
  EngineMatch, EnginePlayer, EngineTeam, PhaseRule, RuleConfig, StandingRow,
} from './types'

export type PlayMatch = (a: EngineTeam, b: EngineTeam, rng: Rng) => [number, number]

export interface EngineResult {
  teams: EngineTeam[]
  matches: EngineMatch[]
  /** Classement final (équipes, ou joueurs si mêlée recomposée). */
  standings: StandingRow[]
  /** Ordre final des identifiants (équipe ou joueur). */
  ranking: string[]
  /** true si le classement porte sur les joueurs (mêlée recomposée). */
  individual: boolean
}

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

/** Appariement d'une manche : glouton, compatible mixité + anti-rematch, ordre à graine. */
function pairTeams(
  teams: EngineTeam[],
  rng: Rng,
  profiles: GenderProfile[] | null,
  played: Set<string>,
  useMixite: boolean
): Array<[number, number | null]> {
  const order = rng.shuffle(teams.map((_, i) => i))
  const remaining = [...order]
  const pairs: Array<[number, number | null]> = []
  while (remaining.length > 1) {
    const a = remaining.shift() as number
    let best = 0, bestScore = -1
    for (let k = 0; k < remaining.length; k++) {
      const b = remaining[k]
      const comp = useMixite && profiles ? (profilesCompatible(profiles[a], profiles[b]) ? 2 : 0) : 2
      const fresh = played.has(pairKey(teams[a].id, teams[b].id)) ? 0 : 1
      const score = comp + fresh
      if (score > bestScore) { bestScore = score; best = k }
    }
    const b = remaining.splice(best, 1)[0]
    pairs.push([a, b])
  }
  if (remaining.length === 1) pairs.push([remaining[0], null])
  return pairs
}

function genderProfiles(teams: EngineTeam[], players: EnginePlayer[]): GenderProfile[] {
  const g = new Map(players.map(p => [p.id, (p.gender === 'F' ? 'F' : 'H') as 'H' | 'F']))
  return teams.map(t => teamGenderProfile(t.joueur_ids, g))
}

/** Joue une liste d'appariements et pousse les matchs terminés. */
function playPairs(
  pairs: Array<[number, number | null]>,
  teams: EngineTeam[],
  phase: number, round: number, poule: string | null,
  play: PlayMatch, rng: Rng, out: EngineMatch[]
): void {
  for (const [a, b] of pairs) {
    if (b === null) { out.push({ a, b: null, phase, round, poule, aIds: teams[a].joueur_ids }); continue }
    const [sa, sb] = play(teams[a], teams[b], rng)
    out.push({ a, b, scoreA: sa, scoreB: sb, phase, round, poule, aIds: teams[a].joueur_ids, bIds: teams[b].joueur_ids })
  }
}

// ── Phase : manches libres (mêlée) ─────────────────────────────────────
function runRounds(
  cfg: RuleConfig, phaseIdx: number, phase: PhaseRule,
  players: EnginePlayer[], baseTeams: EngineTeam[], rng: Rng, play: PlayMatch,
): { matches: EngineMatch[]; teams: EngineTeam[]; individual: boolean } {
  const nb = Math.max(1, phase.rounds ?? 1)
  const remixed = cfg.formation.method === 'remixed'
  const useMixite = !!cfg.formation.mixiteAdversaire && cfg.formation.teamSize > 1
  const played = new Set<string>()
  const matches: EngineMatch[] = []
  let teams = baseTeams
  let prevTeams: EngineTeam[] = []

  for (let r = 1; r <= nb; r++) {
    if (remixed && r > 1) {
      const formed = formTeams(cfg.formation, players, rng, prevTeams)
      teams = formed.teams
    }
    const profiles = useMixite ? genderProfiles(teams, players) : null
    // En équipes recomposées, l'anti-rematch d'adversaires ne peut pas s'appuyer sur des
    // identités stables → on n'évite que dans le cas équipes stables.
    const pairs = pairTeams(teams, rng, profiles, remixed ? new Set() : played, useMixite)
    if (!remixed) for (const [a, b] of pairs) if (b !== null) played.add(pairKey(teams[a].id, teams[b].id))
    playPairs(pairs, teams, phaseIdx, r, null, play, rng, matches)
    prevTeams = teams
  }
  return { matches, teams, individual: remixed }
}

// ── Phase : poules (round-robin) ───────────────────────────────────────
function runPoules(
  phaseIdx: number, phase: PhaseRule, teams: EngineTeam[], rng: Rng, play: PlayMatch,
): { matches: EngineMatch[]; poules: Map<string, number[]> } {
  const size = Math.max(2, phase.pouleSize ?? 4)
  const nbPoules = Math.max(1, Math.ceil(teams.length / size))
  const order = rng.shuffle(teams.map((_, i) => i))
  const poules = new Map<string, number[]>()
  for (let i = 0; i < nbPoules; i++) poules.set(String.fromCharCode(65 + i), [])
  const names = [...poules.keys()]
  // Serpentin pour équilibrer les tailles.
  for (let i = 0; i < order.length; i++) {
    const row = Math.floor(i / nbPoules), col = i % nbPoules
    const p = row % 2 === 0 ? col : nbPoules - 1 - col
    poules.get(names[p])!.push(order[i])
  }
  const matches: EngineMatch[] = []
  for (const [name, idxs] of poules) {
    const berger = bergerRoundRobin(idxs.length)
    for (const rnd of berger) {
      for (const [i, j] of rnd.pairs) {
        const [sa, sb] = play(teams[idxs[i]], teams[idxs[j]], rng)
        matches.push({ a: idxs[i], b: idxs[j], scoreA: sa, scoreB: sb, phase: phaseIdx, round: rnd.tour, poule: name, aIds: teams[idxs[i]].joueur_ids, bIds: teams[idxs[j]].joueur_ids })
      }
    }
  }
  return { matches, poules }
}

// ── Phase : élimination directe ────────────────────────────────────────
function runElimination(
  phaseIdx: number, phase: PhaseRule, teams: EngineTeam[], seedOrder: number[],
  rng: Rng, play: PlayMatch, out: EngineMatch[],
): number[] {
  // Bracket sur les équipes `seedOrder` (déjà classées). Byes pour compléter à 2^k.
  let alive = [...seedOrder]
  let round = 1
  const losersSemi: number[] = []
  while (alive.length > 1) {
    const next: number[] = []
    const n = alive.length
    for (let i = 0; i < Math.floor(n / 2); i++) {
      const a = alive[i], b = alive[n - 1 - i]
      const [sa, sb] = play(teams[a], teams[b], rng)
      out.push({ a, b, scoreA: sa, scoreB: sb, phase: phaseIdx, round, poule: null })
      const winner = sa >= sb ? a : b
      const loser = sa >= sb ? b : a
      if (alive.length === 4) losersSemi.push(loser) // demi-finalistes battus → petite finale
      next.push(winner)
    }
    if (n % 2 === 1) next.push(alive[Math.floor(n / 2)]) // bye pour l'équipe médiane
    alive = next
    round++
  }
  if (phase.petiteFinale && losersSemi.length === 2) {
    const [sa, sb] = play(teams[losersSemi[0]], teams[losersSemi[1]], rng)
    out.push({ a: losersSemi[0], b: losersSemi[1], scoreA: sa, scoreB: sb, phase: phaseIdx, round, poule: 'petite' })
  }
  return alive // vainqueur
}

/** Déroule le tournoi complet et renvoie l'historique + le classement final. */
export function runTournament(
  config: RuleConfig,
  players: EnginePlayer[],
  play: PlayMatch,
): EngineResult {
  const rng = new Rng(config.seed ?? 1)
  const allMatches: EngineMatch[] = []

  // Phase 0 : formation initiale des équipes.
  const formed = formTeams(config.formation, players, rng)
  let teams = formed.teams
  let individual = false
  let carried: number[] | null = null // indices d'équipes qualifiées pour la phase suivante

  for (let pi = 0; pi < config.phases.length; pi++) {
    const phase = config.phases[pi]

    if (phase.type === 'rounds') {
      const r = runRounds(config, pi, phase, players, teams, rng, play)
      allMatches.push(...r.matches)
      teams = r.teams
      individual = r.individual
      carried = null
    } else if (phase.type === 'poules') {
      const r = runPoules(pi, phase, teams, rng, play)
      allMatches.push(...r.matches)
      // Qualifiés : topN de chaque poule selon le départage.
      const qN = Math.max(1, phase.qualifiedPerPoule ?? 2)
      const qualified: number[] = []
      for (const [, idxs] of r.poules) {
        const sub = teams.filter((_, i) => idxs.includes(i))
        const st = computeStandings(sub, r.matches.filter(m => idxs.includes(m.a) && (m.b === null || idxs.includes(m.b))).map(m => remapMatch(m, idxs)), config.scoring)
        const ranked = rankStandings(st, config.tiebreakers, r.matches.map(m => remapMatch(m, idxs)))
        for (let k = 0; k < Math.min(qN, ranked.length); k++) qualified.push(idxs[ranked[k].teamIndex])
      }
      carried = qualified
    } else if (phase.type === 'elimination') {
      const seed = carried ?? teams.map((_, i) => i)
      runElimination(pi, phase, teams, seed, rng, play, allMatches)
      carried = null
    }
  }

  // Classement final.
  if (individual) {
    const st = computePlayerStandings(players, teams, allMatches, config.scoring)
    const ranked = rankStandings(st, config.tiebreakers, allMatches)
    return { teams, matches: allMatches, standings: ranked, ranking: ranked.map(r => r.teamId), individual: true }
  }
  const st = computeStandings(teams, allMatches, config.scoring)
  const ranked = rankStandings(st, config.tiebreakers, allMatches)
  return { teams, matches: allMatches, standings: ranked, ranking: ranked.map(r => r.teamId), individual: false }
}

/** Réindexe un match sur le sous-ensemble d'une poule (pour computeStandings local). */
function remapMatch(m: EngineMatch, idxs: number[]): EngineMatch {
  const map = new Map(idxs.map((v, i) => [v, i]))
  return { ...m, a: map.get(m.a) ?? m.a, b: m.b === null ? null : (map.get(m.b) ?? m.b) }
}
