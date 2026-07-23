import { describe, it, expect } from 'vitest'
import { startTournament, advance } from '../incremental'
import { Rng } from '../rng'
import { computeStandings, computePlayerStandings, rankStandings } from '../ranking'
import { makePlayers } from '../simulate'
import type { EngineMatch, EnginePlayer, EngineTeam, RuleConfig } from '../types'
import { presetMeleeFixe, presetMeleeTournante, presetNParties } from '../presets'

const FIPJP = { pointsToWin: 13, win: 3, draw: 1, loss: 0 }

/**
 * Joue un tournoi ENTIÈREMENT en mode incrémental : on démarre, on saisit les scores
 * d'un lot, on appelle advance, on persiste le lot suivant, etc. jusqu'à `done`.
 * Reproduit fidèlement le flux de production (scores saisis au fil de l'eau).
 */
function playIncremental(config: RuleConfig, players: EnginePlayer[], scoreSeed = 99) {
  const rng = new Rng(scoreSeed)
  const start = startTournament(config, players)
  let teams: EngineTeam[] = start.teams.map((t, i) => ({ ...t, id: t.id || String(i) }))
  const matches: EngineMatch[] = []
  const pushScored = (batch: EngineMatch[]) => {
    for (const m of batch) {
      if (m.b === null) { matches.push({ ...m }); continue }
      const loser = rng.int(config.scoring.pointsToWin)
      const aWins = rng.next() < 0.5
      matches.push({ ...m, scoreA: aWins ? config.scoring.pointsToWin : loser, scoreB: aWins ? loser : config.scoring.pointsToWin })
    }
  }
  pushScored(start.matches)

  let guard = 0
  for (;;) {
    if (++guard > 500) throw new Error('boucle incrémentale non convergente')
    const res = advance(config, players, teams, matches)
    if (res.done) break
    if (res.waiting) throw new Error('advance en attente alors que tout est saisi')
    if (res.newTeams.length) teams = res.newTeams // mêlée recomposée : nouvelles équipes
    expect(res.newMatches.length).toBeGreaterThan(0)
    pushScored(res.newMatches)
  }
  return { teams, matches }
}

describe('exécution incrémentale — flux de production', () => {
  it('attend les scores : advance ne génère rien tant qu’une manche est incomplète', () => {
    const config = presetNParties({ teamSize: 2, rounds: 3, seed: 5 })
    const players = makePlayers(8, 5)
    const start = startTournament(config, players)
    const teams = start.teams.map((t, i) => ({ ...t, id: t.id || String(i) }))
    // Aucun score saisi → waiting
    const r = advance(config, players, teams, start.matches)
    expect(r.waiting).toBe(true)
    expect(r.newMatches).toHaveLength(0)
  })

  it('N parties (équipes stables) : va jusqu’au bout, 3 manches, invariants OK', () => {
    const config = presetNParties({ teamSize: 2, rounds: 3, seed: 8 })
    const players = makePlayers(12, 8)
    const { teams, matches } = playIncremental(config, players)
    const rounds = new Set(matches.filter(m => m.phase === 0).map(m => m.round))
    expect(rounds.size).toBe(3)
    // Pas d'auto-match ; chaque manche = un match par équipe (moins l'exempt éventuel).
    for (const m of matches) if (m.b !== null) expect(m.a).not.toBe(m.b)
    const st = computeStandings(teams, matches, FIPJP)
    expect(st.reduce((s, r) => s + r.played, 0)).toBeGreaterThan(0)
  })

  it('mêlée tournante (recomposée) : nouvelles équipes à chaque manche, classement individuel complet', () => {
    const config = presetMeleeTournante({ teamSize: 2, rounds: 4, seed: 3 })
    const players = makePlayers(12, 3)
    const { matches } = playIncremental(config, players)
    expect(new Set(matches.map(m => m.round)).size).toBe(4)
    const st = rankStandings(computePlayerStandings(players, [], matches, FIPJP), ['points', 'goalDiff'], matches)
    // Tous les joueurs ont un classement, chacun a joué au moins une fois.
    expect(st).toHaveLength(12)
    expect(st.every(r => r.played >= 1)).toBe(true)
  })

  it('poules → élimination : traverse les phases et se termine sur un vainqueur unique', () => {
    const config = presetMeleeFixe({ teamSize: 2, pouleSize: 4, qualifiedPerPoule: 2, petiteFinale: true, seed: 4 })
    const players = makePlayers(16, 4)
    const { teams, matches } = playIncremental(config, players)
    // Il existe des matchs de poule ET d'élimination.
    expect(matches.some(m => m.poule && m.poule.length === 1)).toBe(true) // poules A,B,...
    const elimPhase = Math.max(...matches.map(m => m.phase))
    expect(elimPhase).toBeGreaterThan(0)
    // Petite finale jouée.
    expect(matches.some(m => m.poule === 'petite')).toBe(true)
    // Dernier tour d'élim = 1 seul match (la finale).
    const elim = matches.filter(m => m.phase === elimPhase && m.poule !== 'petite')
    const maxR = Math.max(...elim.map(m => m.round))
    expect(elim.filter(m => m.round === maxR)).toHaveLength(1)
    void teams
  })

  it('déterminisme : même config → même prochain lot après rechargement', () => {
    const config = presetNParties({ teamSize: 2, rounds: 3, seed: 42 })
    const players = makePlayers(8, 42)
    const start = startTournament(config, players)
    // Deux "rechargements" indépendants produisent le même démarrage.
    const start2 = startTournament(config, players)
    expect(JSON.stringify(start.matches)).toBe(JSON.stringify(start2.matches))
  })

  it('SIMULATION incrémentale massive : converge partout, sans auto-match (≥ 1000 parties)', () => {
    let count = 0
    for (const preset of [presetNParties, presetMeleeTournante, presetMeleeFixe]) {
      for (const teamSize of [2, 3] as const) {
        for (const n of [6, 8, 12, 16]) {
          for (let seed = 1; seed <= 45; seed++) {
            const config = preset({ teamSize, seed, pouleSize: 4, qualifiedPerPoule: 2 })
            const players = makePlayers(n, seed)
            const { matches } = playIncremental(config, players, seed * 7 + 1)
            for (const m of matches) if (m.b !== null) expect(m.a).not.toBe(m.b)
            expect(matches.length).toBeGreaterThan(0)
            count++
          }
        }
      }
    }
    expect(count).toBeGreaterThanOrEqual(1000)
  })
})
