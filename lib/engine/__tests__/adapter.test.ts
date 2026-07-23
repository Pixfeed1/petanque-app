import { describe, it, expect } from 'vitest'
import { engineTeamsToPayload, engineMatchesToPayload, dbMatchesToEngine, type DbMatch } from '../adapter'
import { configFromForm } from '../configFromForm'
import { startTournament, advance } from '../incremental'
import { makePlayers } from '../simulate'
import type { RuleConfig } from '../types'

describe('adapter moteur ↔ payload', () => {
  const cfg: RuleConfig = {
    formation: { method: 'random', teamSize: 2 }, scoring: { pointsToWin: 13, win: 3, draw: 1, loss: 0 },
    tiebreakers: ['points', 'goalDiff'], phases: [{ type: 'rounds', rounds: 3 }], seed: 5,
  }

  it('équipes → payload : noms + joueur_ids conservés', () => {
    const p = engineTeamsToPayload([{ id: '0', joueur_ids: ['a', 'b'] }, { id: '1', joueur_ids: ['c', 'd'] }])
    expect(p).toEqual([
      { name: 'Équipe 1', joueur_ids: ['a', 'b'] },
      { name: 'Équipe 2', joueur_ids: ['c', 'd'] },
    ])
  })

  it('matchs → payload : indices, terrains cyclés, type poule, bye typé', () => {
    const pm = engineMatchesToPayload(
      [
        { a: 0, b: 1, phase: 0, round: 1, aIds: ['a'], bIds: ['b'] },
        { a: 2, b: null, phase: 0, round: 1, aIds: ['c'] },
      ], cfg, 2,
    )
    expect(pm[0]).toMatchObject({ team_a_index: 0, team_b_index: 1, tour: 1, type: 'poule', terrain: 1, status: 'a_jouer' })
    expect(pm[1]).toMatchObject({ team_a_index: 2, team_b_index: null, type: 'bye', terrain: null })
  })

  it('élimination + petite finale : types corrects', () => {
    const elimCfg: RuleConfig = { ...cfg, phases: [{ type: 'poules', pouleSize: 4, qualifiedPerPoule: 2 }, { type: 'elimination', petiteFinale: true }] }
    const pm = engineMatchesToPayload([
      { a: 0, b: 1, phase: 1, round: 1 },
      { a: 2, b: 3, phase: 1, round: 2, poule: 'petite' },
    ], elimCfg, 0)
    expect(pm[0].type).toBe('elimination')
    expect(pm[1].type).toBe('petite_finale')
  })

  it('DB → moteur → avance : round-trip cohérent (équipes stables)', () => {
    // Démarre un tournoi, simule la persistance DB, relit, avance.
    const config = configFromForm({ format: 'doublette', engineStructure: 'rounds', rounds: 3, seed: 9 })
    const players = makePlayers(8, 9)
    const start = startTournament(config, players)
    const teamIds = start.teams.map((_, i) => `T${i}`)
    const joueursByTeamId = new Map(start.teams.map((t, i) => [`T${i}`, t.joueur_ids]))

    // Persistance simulée : matchs terminés avec scores.
    const dbRows: DbMatch[] = start.matches.map(m => ({
      equipe_a_id: `T${m.a}`,
      equipe_b_id: m.b === null ? null : `T${m.b}`,
      score_a: m.b === null ? null : 13,
      score_b: m.b === null ? null : 7,
      status: m.b === null ? 'a_jouer' : 'termine',
      tour: m.round,
      type: m.b === null ? 'bye' : 'poule',
      poule: null,
    }))

    const engineMatches = dbMatchesToEngine(dbRows, config, teamIds, joueursByTeamId)
    const engineTeams = start.teams.map((t, i) => ({ id: teamIds[i], joueur_ids: t.joueur_ids }))
    const res = advance(config, players, engineTeams, engineMatches)
    expect(res.done).toBe(false)
    expect(res.waiting).toBe(false)
    expect(res.newMatches.length).toBeGreaterThan(0)
    // La manche suivante est bien la 2.
    expect(res.newMatches.every(m => m.round === 2)).toBe(true)
  })
})

describe('configFromForm', () => {
  it('doublette + poules → phases poules puis élimination', () => {
    const c = configFromForm({ format: 'doublette', engineStructure: 'poules', consolante: true })
    expect(c.formation.teamSize).toBe(2)
    expect(c.phases.map(p => p.type)).toEqual(['poules', 'elimination'])
    expect(c.phases[1].petiteFinale).toBe(true)
  })

  it('fair-play → capDiff 5 ; headToHeadFirst réordonne le départage', () => {
    const c = configFromForm({ format: 'triplette', fairPlay: true, headToHeadFirst: true })
    expect(c.scoring.capDiff).toBe(5)
    expect(c.tiebreakers.slice(0, 2)).toEqual(['points', 'headToHead'])
  })

  it('recomposé → antiRematch activé', () => {
    const c = configFromForm({ format: 'doublette', engineFormation: 'remixed' })
    expect(c.formation.antiRematch).toBe(true)
  })
})
