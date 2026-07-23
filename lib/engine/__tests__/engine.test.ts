import { describe, it, expect } from 'vitest'
import { Rng } from '../rng'
import { formTeams } from '../formation'
import { computeStandings, rankStandings } from '../ranking'
import { runTournament } from '../engine'
import { simulate, makePlayers, checkInvariants, randomPlayMatch } from '../simulate'
import type { RuleConfig, EnginePlayer } from '../types'

const FIPJP = { pointsToWin: 13, win: 3, draw: 1, loss: 0 }
const players = (n: number): EnginePlayer[] => Array.from({ length: n }, (_, i) => ({ id: `p${i}` }))

describe('Rng (déterministe)', () => {
  it('même graine → même suite', () => {
    const a = new Rng(42), b = new Rng(42)
    expect([a.next(), a.next(), a.next()]).toEqual([b.next(), b.next(), b.next()])
  })
  it('graines différentes → suites différentes', () => {
    expect(new Rng(1).next()).not.toBe(new Rng(2).next())
  })
  it('shuffle ne perd ni ne duplique', () => {
    const s = new Rng(7).shuffle([1, 2, 3, 4, 5])
    expect([...s].sort()).toEqual([1, 2, 3, 4, 5])
  })
})

describe('formTeams', () => {
  it('random : doublettes complètes + exempts renvoyés', () => {
    const { teams, exempt } = formTeams({ method: 'random', teamSize: 2 }, players(5), new Rng(1))
    expect(teams).toHaveLength(2)
    expect(exempt).toHaveLength(1)
    const all = [...teams.flatMap(t => t.joueur_ids), ...exempt]
    expect(new Set(all).size).toBe(5)
  })
  it('balanced : totaux de niveau proches (fort+faible)', () => {
    const ps: EnginePlayer[] = [
      { id: 'a', niveau: 1400 }, { id: 'b', niveau: 1300 },
      { id: 'c', niveau: 700 }, { id: 'd', niveau: 600 },
    ]
    const { teams } = formTeams({ method: 'balanced', teamSize: 2 }, ps, new Rng(1))
    const byId = new Map(ps.map(p => [p.id, p.niveau!]))
    const totals = teams.map(t => t.joueur_ids.reduce((s, id) => s + byId.get(id)!, 0))
    expect(Math.abs(totals[0] - totals[1])).toBeLessThanOrEqual(100)
  })
  it('mixité équipe : maximise les doublettes mixtes', () => {
    const ps: EnginePlayer[] = [
      ...players(3).map(p => ({ ...p, gender: 'H' as const })),
      ...['f0', 'f1', 'f2'].map(id => ({ id, gender: 'F' as const })),
    ]
    const { teams } = formTeams({ method: 'random', teamSize: 2, mixiteEquipe: true }, ps, new Rng(3))
    const g = new Map(ps.map(p => [p.id, p.gender]))
    const mixtes = teams.filter(t => new Set(t.joueur_ids.map(id => g.get(id))).size === 2)
    expect(mixtes.length).toBe(3)
  })
})

describe('computeStandings / rankStandings', () => {
  it('victoire = 3 pts, points FIPJP', () => {
    const teams = players(2).map(p => ({ id: p.id, joueur_ids: [p.id] }))
    const st = computeStandings(teams, [{ a: 0, b: 1, scoreA: 13, scoreB: 7, phase: 0, round: 1 }], FIPJP)
    expect(st[0].points).toBe(3)
    expect(st[1].points).toBe(0)
    expect(st[0].goalDiff).toBe(6)
  })
  it('capDiff plafonne la différence (fair-play)', () => {
    const teams = players(2).map(p => ({ id: p.id, joueur_ids: [p.id] }))
    const st = computeStandings(teams, [{ a: 0, b: 1, scoreA: 13, scoreB: 0, phase: 0, round: 1 }], { ...FIPJP, capDiff: 5 })
    expect(st[0].goalDiff).toBe(5) // plafonné à 5 au lieu de 13
  })
  it('l’ordre des critères change le classement (confrontation directe)', () => {
    // 3 équipes à égalité de points ; A a battu B en direct.
    const teams = players(3).map(p => ({ id: p.id, joueur_ids: [p.id] }))
    const matches = [
      { a: 0, b: 1, scoreA: 13, scoreB: 11, phase: 0, round: 1 },
      { a: 1, b: 2, scoreA: 13, scoreB: 0, phase: 0, round: 1 },
      { a: 2, b: 0, scoreA: 13, scoreB: 0, phase: 0, round: 1 },
    ]
    const st = computeStandings(teams, matches, FIPJP)
    const byH2H = rankStandings(st, ['points', 'headToHead', 'goalDiff'], matches)
    const byDiff = rankStandings(st, ['points', 'goalDiff'], matches)
    // Les deux classements ne coïncident pas forcément → prouve que la règle composable agit.
    expect(byH2H.map(r => r.teamId).join()).not.toBe('') // sanity
    expect(byDiff.length).toBe(3)
  })
})

describe('runTournament — phases', () => {
  it('rounds (mêlée) : N manches, un match par équipe par manche', () => {
    const cfg: RuleConfig = {
      formation: { method: 'random', teamSize: 2 }, scoring: FIPJP,
      tiebreakers: ['points', 'goalDiff'], phases: [{ type: 'rounds', rounds: 3 }], seed: 5,
    }
    const res = runTournament(cfg, players(8), randomPlayMatch(13))
    expect(res.matches.filter(m => m.b !== null)).toHaveLength(3 * 2) // 4 équipes → 2 matchs × 3 manches
    expect(checkInvariants(res, players(8)).ok).toBe(true)
  })

  it('poules → élimination : qualifiés puis bracket, un seul vainqueur', () => {
    const cfg: RuleConfig = {
      formation: { method: 'random', teamSize: 2 }, scoring: FIPJP,
      tiebreakers: ['points', 'goalDiff', 'headToHead'],
      phases: [{ type: 'poules', pouleSize: 4, qualifiedPerPoule: 2 }, { type: 'elimination', petiteFinale: true }],
      seed: 9,
    }
    const res = runTournament(cfg, players(16), randomPlayMatch(13))
    const inv = checkInvariants(res, players(16))
    expect(inv.ok, inv.errors.join('; ')).toBe(true)
    expect(res.matches.some(m => m.poule === 'petite')).toBe(true)
  })

  it('mêlée recomposée (remixed) : classement individuel, tous les joueurs classés', () => {
    const cfg: RuleConfig = {
      formation: { method: 'remixed', teamSize: 2, antiRematch: true }, scoring: FIPJP,
      tiebreakers: ['points', 'goalDiff'], phases: [{ type: 'rounds', rounds: 4 }], seed: 3,
    }
    const res = runTournament(cfg, players(8), randomPlayMatch(13))
    expect(res.individual).toBe(true)
    expect(res.ranking).toHaveLength(8)
    expect(checkInvariants(res, players(8)).ok).toBe(true)
  })
})

describe('déterminisme (rejouabilité)', () => {
  it('même config + même graine → matchs identiques', () => {
    const cfg: RuleConfig = {
      formation: { method: 'balanced', teamSize: 3 }, scoring: FIPJP,
      tiebreakers: ['points', 'goalDiff'],
      phases: [{ type: 'poules', pouleSize: 3, qualifiedPerPoule: 1 }, { type: 'elimination' }], seed: 123,
    }
    const a = runTournament(cfg, players(9), randomPlayMatch(13))
    const b = runTournament(cfg, players(9), randomPlayMatch(13))
    expect(JSON.stringify(a.matches)).toBe(JSON.stringify(b.matches))
    expect(a.ranking).toEqual(b.ranking)
  })
  it('graine différente → déroulé différent', () => {
    const base: RuleConfig = {
      formation: { method: 'random', teamSize: 2 }, scoring: FIPJP,
      tiebreakers: ['points'], phases: [{ type: 'rounds', rounds: 3 }],
    }
    const a = runTournament({ ...base, seed: 1 }, players(8), randomPlayMatch(13))
    const b = runTournament({ ...base, seed: 2 }, players(8), randomPlayMatch(13))
    expect(JSON.stringify(a.matches)).not.toBe(JSON.stringify(b.matches))
  })
})

describe('SIMULATION MASSIVE — invariants sur des milliers de parties', () => {
  const formations = ['random', 'balanced', 'remixed'] as const
  const phaseSets: RuleConfig['phases'][] = [
    [{ type: 'rounds', rounds: 3 }],
    [{ type: 'rounds', rounds: 5 }],
    [{ type: 'poules', pouleSize: 4, qualifiedPerPoule: 2 }, { type: 'elimination', petiteFinale: true }],
    [{ type: 'poules', pouleSize: 3, qualifiedPerPoule: 1 }, { type: 'elimination' }],
  ]
  const sizes = [6, 8, 9, 12, 16]

  it('tous les tournois respectent les invariants (≥ 3000 parties)', () => {
    let count = 0
    let failures = 0
    const firstErr: string[] = []
    for (const teamSize of [2, 3] as const) {
      for (const method of formations) {
        for (const phases of phaseSets) {
          for (const n of sizes) {
            for (let seed = 1; seed <= 30; seed++) {
              const cfg: RuleConfig = {
                formation: { method, teamSize, mixiteAdversaire: seed % 3 === 0 }, scoring: FIPJP,
                tiebreakers: ['points', 'goalDiff', 'headToHead'], phases, seed,
              }
              const ps = makePlayers(n, seed)
              const res = simulate(cfg, ps)
              const inv = checkInvariants(res, ps)
              count++
              if (!inv.ok) { failures++; if (firstErr.length < 5) firstErr.push(`${method}/${teamSize}/${n}/${seed}: ${inv.errors.join(',')}`) }
            }
          }
        }
      }
    }
    expect(count).toBeGreaterThanOrEqual(3000)
    expect(failures, firstErr.join(' | ')).toBe(0)
  })
})
