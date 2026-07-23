/**
 * Moteur libre — EXÉCUTION INCRÉMENTALE.
 *
 * En production le tournoi n'est pas déroulé d'un coup : l'organisateur saisit les
 * scores d'une manche, puis le moteur génère la suivante. Ce module reconstruit
 * l'état depuis ce qui est DÉJÀ stocké (config + équipes + matchs saisis) et produit
 * le prochain lot de matchs — sans jamais rejouer le passé, et de façon déterministe
 * (RNG re-dérivé par (phase, manche), donc reproductible même après un rechargement).
 *
 * Le module ne connaît pas la base : il renvoie des lots de matchs (indices d'équipe)
 * et d'éventuelles nouvelles équipes ; l'appelant persiste et rappelle `advance`.
 */

import { Rng } from './rng'
import { formTeams } from './formation'
import { computeStandings, rankStandings } from './ranking'
import { bergerRoundRobin } from '@/lib/services/tirage.service'
import { profilesCompatible, teamGenderProfile, type GenderProfile } from '@/lib/services/mixiteAdversaire'
import type { EngineMatch, EnginePlayer, EngineTeam, RuleConfig } from './types'

export interface AdvanceResult {
  /** Nouvelles équipes créées pour cette étape (mêlée recomposée / rien sinon). */
  newTeams: EngineTeam[]
  /** Matchs à créer (sans score). Vide si l'étape courante n'est pas terminée. */
  newMatches: EngineMatch[]
  /** true quand le tournoi est terminé. */
  done: boolean
  /** true quand on attend encore des scores de l'étape courante. */
  waiting: boolean
  phaseIndex: number
}

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)

/** RNG reproductible pour une (phase, manche) donnée — indépendant de l'ordre d'exécution. */
function stepRng(seed: number, phase: number, round: number): Rng {
  const s = (Math.imul(seed || 1, 2654435761) ^ Math.imul(phase + 1, 40503) ^ Math.imul(round + 1, 2246822519)) >>> 0
  return new Rng(s)
}

function genderProfiles(teams: EngineTeam[], players: EnginePlayer[]): GenderProfile[] {
  const g = new Map(players.map(p => [p.id, (p.gender === 'F' ? 'F' : 'H') as 'H' | 'F']))
  return teams.map(t => teamGenderProfile(t.joueur_ids, g))
}

/** Appariement d'une manche (glouton, mixité + anti-rematch), ordre à graine. */
function pairTeams(
  teams: EngineTeam[], rng: Rng, profiles: GenderProfile[] | null,
  played: Set<string>, useMixite: boolean,
): Array<[number, number | null]> {
  const remaining = rng.shuffle(teams.map((_, i) => i))
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

function mkMatches(
  pairs: Array<[number, number | null]>, teams: EngineTeam[],
  phase: number, round: number, poule: string | null,
): EngineMatch[] {
  return pairs.map(([a, b]) => b === null
    ? { a, b: null, phase, round, poule, aIds: teams[a].joueur_ids }
    : { a, b, phase, round, poule, aIds: teams[a].joueur_ids, bIds: teams[b].joueur_ids })
}

const scored = (m: EngineMatch) => m.b === null || (m.scoreA !== undefined && m.scoreB !== undefined)
const winnerIndex = (m: EngineMatch): number => (m.scoreA! >= m.scoreB! ? m.a : (m.b as number))

/** Génère toutes les rencontres de poules (round-robin) pour la phase donnée. */
function poulesMatches(
  teams: EngineTeam[], rng: Rng, phaseIdx: number, pouleSize: number,
): EngineMatch[] {
  const size = Math.max(2, pouleSize)
  const nbPoules = Math.max(1, Math.ceil(teams.length / size))
  const order = rng.shuffle(teams.map((_, i) => i))
  const poules: number[][] = Array.from({ length: nbPoules }, () => [])
  for (let i = 0; i < order.length; i++) {
    const row = Math.floor(i / nbPoules), col = i % nbPoules
    poules[row % 2 === 0 ? col : nbPoules - 1 - col].push(order[i])
  }
  const out: EngineMatch[] = []
  poules.forEach((idxs, pi) => {
    const name = String.fromCharCode(65 + pi)
    for (const rnd of bergerRoundRobin(idxs.length)) {
      for (const [i, j] of rnd.pairs) {
        out.push(...mkMatches([[idxs[i], idxs[j]]], teams, phaseIdx, rnd.tour, name))
      }
    }
  })
  return out
}

/** Démarre le tournoi : équipes de la phase 0 + premier lot de matchs (sans score). */
export function startTournament(config: RuleConfig, players: EnginePlayer[]): { teams: EngineTeam[]; matches: EngineMatch[] } {
  const rng0 = new Rng(config.seed ?? 1)
  const { teams } = formTeams(config.formation, players, rng0)
  const phase = config.phases[0]
  const useMixite = !!config.formation.mixiteAdversaire && config.formation.teamSize > 1

  if (phase.type === 'poules') {
    return { teams, matches: poulesMatches(teams, stepRng(config.seed ?? 1, 0, 0), 0, phase.pouleSize ?? 4) }
  }
  if (phase.type === 'elimination') {
    return { teams, matches: bracketRound(teams, teams.map((_, i) => i), 0, 1) }
  }
  // rounds
  const rng = stepRng(config.seed ?? 1, 0, 1)
  const profiles = useMixite ? genderProfiles(teams, players) : null
  const pairs = pairTeams(teams, rng, profiles, new Set(), useMixite)
  return { teams, matches: mkMatches(pairs, teams, 0, 1, null) }
}

/** Un tour de bracket sur les équipes `alive` (indices), byes pour compléter. */
function bracketRound(teams: EngineTeam[], alive: number[], phaseIdx: number, round: number): EngineMatch[] {
  const n = alive.length
  const out: EngineMatch[] = []
  for (let i = 0; i < Math.floor(n / 2); i++) {
    out.push(...mkMatches([[alive[i], alive[n - 1 - i]]], teams, phaseIdx, round, null))
  }
  if (n % 2 === 1) out.push(...mkMatches([[alive[Math.floor(n / 2)], null]], teams, phaseIdx, round, null))
  return out
}

/**
 * Avance le tournoi à partir de l'état stocké. Renvoie le prochain lot de matchs,
 * `waiting` si l'étape courante n'est pas finie, `done` si le tournoi est terminé.
 */
export function advance(
  config: RuleConfig, players: EnginePlayer[], teams: EngineTeam[], matches: EngineMatch[],
): AdvanceResult {
  const none = (over: Partial<AdvanceResult> = {}): AdvanceResult =>
    ({ newTeams: [], newMatches: [], done: false, waiting: false, phaseIndex: 0, ...over })
  if (matches.length === 0) return none({ waiting: true })

  const phaseIndex = matches.reduce((mx, m) => Math.max(mx, m.phase), 0)
  const phase = config.phases[phaseIndex]
  const phaseMatches = matches.filter(m => m.phase === phaseIndex)
  if (phaseMatches.some(m => !scored(m))) return none({ phaseIndex, waiting: true })

  const seed = config.seed ?? 1
  const useMixite = !!config.formation.mixiteAdversaire && config.formation.teamSize > 1

  if (phase.type === 'rounds') {
    const maxRound = phaseMatches.reduce((mx, m) => Math.max(mx, m.round), 0)
    const target = Math.max(1, phase.rounds ?? 1)
    if (maxRound >= target) return none({ phaseIndex, done: !config.phases[phaseIndex + 1] })
    const nextRound = maxRound + 1
    const rng = stepRng(seed, phaseIndex, nextRound)
    if (config.formation.method === 'remixed') {
      // Recomposer les équipes ; anti-rematch sur toutes les équipes vues.
      const prev = reconstructRoundTeams(matches, phaseIndex)
      const formed = formTeams(config.formation, players, rng, prev)
      const nt = formed.teams.map((t, i) => ({ id: `p${phaseIndex}r${nextRound}-${i}`, joueur_ids: t.joueur_ids }))
      const profiles = useMixite ? genderProfiles(nt, players) : null
      const pairs = pairTeams(nt, rng, profiles, new Set(), useMixite)
      return none({ phaseIndex, newTeams: nt, newMatches: mkMatches(pairs, nt, phaseIndex, nextRound, null) })
    }
    // Équipes stables : anti-rematch d'adversaires sur les rencontres déjà jouées.
    const played = new Set<string>()
    for (const m of phaseMatches) if (m.b !== null) played.add(pairKey(teams[m.a].id, teams[m.b as number].id))
    const profiles = useMixite ? genderProfiles(teams, players) : null
    const pairs = pairTeams(teams, rng, profiles, played, useMixite)
    return none({ phaseIndex, newMatches: mkMatches(pairs, teams, phaseIndex, nextRound, null) })
  }

  if (phase.type === 'poules') {
    // Poules terminées → phase suivante (élimination) sur les qualifiés, ou fin.
    const next = config.phases[phaseIndex + 1]
    if (!next || next.type !== 'elimination') return none({ phaseIndex, done: true })
    const qualified = qualifiersFromPoules(config, teams, phaseMatches)
    return none({ phaseIndex: phaseIndex + 1, newMatches: bracketRound(teams, qualified, phaseIndex + 1, 1) })
  }

  if (phase.type === 'elimination') {
    const maxRound = phaseMatches.reduce((mx, m) => Math.max(mx, m.round), 0)
    const lastRound = phaseMatches.filter(m => m.round === maxRound && m.poule !== 'petite')
    const winners = lastRound.map(winnerIndex)
    if (winners.length <= 1) {
      // Éventuelle petite finale (si demandée et pas encore jouée).
      if (phase.petiteFinale && maxRound >= 2 && !phaseMatches.some(m => m.poule === 'petite')) {
        const semiLosers = phaseMatches
          .filter(m => m.round === maxRound - 1 && m.b !== null)
          .map(m => (winnerIndex(m) === m.a ? (m.b as number) : m.a))
        if (semiLosers.length === 2) {
          return none({ phaseIndex, newMatches: mkMatches([[semiLosers[0], semiLosers[1]]], teams, phaseIndex, maxRound, 'petite') })
        }
      }
      return none({ phaseIndex, done: true })
    }
    return none({ phaseIndex, newMatches: bracketRound(teams, winners, phaseIndex, maxRound + 1) })
  }

  return none({ phaseIndex, done: true })
}

/** Reconstruit les équipes vues dans une phase (mêlée recomposée), pour l'anti-rematch. */
function reconstructRoundTeams(matches: EngineMatch[], phaseIdx: number): EngineTeam[] {
  const seen: EngineTeam[] = []
  const keys = new Set<string>()
  for (const m of matches) {
    if (m.phase !== phaseIdx) continue
    for (const ids of [m.aIds, m.bIds]) {
      if (!ids || !ids.length) continue
      const k = [...ids].sort().join(',')
      if (!keys.has(k)) { keys.add(k); seen.push({ id: k, joueur_ids: ids }) }
    }
  }
  return seen
}

/** Qualifiés (topN par poule) selon le départage composable. */
function qualifiersFromPoules(config: RuleConfig, teams: EngineTeam[], phaseMatches: EngineMatch[]): number[] {
  const byPoule = new Map<string, number[]>()
  for (const m of phaseMatches) {
    const p = m.poule ?? 'A'
    if (!byPoule.has(p)) byPoule.set(p, [])
    const set = byPoule.get(p)!
    if (!set.includes(m.a)) set.push(m.a)
    if (m.b !== null && !set.includes(m.b)) set.push(m.b)
  }
  const qN = Math.max(1, config.phases.find(p => p.type === 'poules')?.qualifiedPerPoule ?? 2)
  const qualified: number[] = []
  for (const [, idxs] of byPoule) {
    const map = new Map(idxs.map((v, i) => [v, i]))
    const sub = idxs.map(i => teams[i])
    const local = phaseMatches
      .filter(m => idxs.includes(m.a) && (m.b === null || idxs.includes(m.b)))
      .map(m => ({ ...m, a: map.get(m.a)!, b: m.b === null ? null : map.get(m.b)! }))
    const st = rankStandings(computeStandings(sub, local, config.scoring), config.tiebreakers, local)
    for (let k = 0; k < Math.min(qN, st.length); k++) qualified.push(idxs[st[k].teamIndex])
  }
  return qualified
}
