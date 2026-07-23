import { describe, it, expect } from 'vitest'
import { balancedTeamsByLevel, teamLevel, seedTeamsByLevel, type RankedPlayer } from '../levelBalancing'

function ranked(spec: Array<[string, number]>): RankedPlayer[] {
  return spec.map(([id, niveau]) => ({ id, niveau }))
}

describe('balancedTeamsByLevel', () => {
  it('doublette : 4 joueurs → 2 équipes, fort+faible ensemble (totaux égalisés)', () => {
    // Niveaux 1300, 1200, 900, 800 → serpentin : [1300,800] et [1200,900] = 2100 chacun.
    const { teams, unassigned } = balancedTeamsByLevel(
      ranked([['a', 1300], ['b', 1200], ['c', 900], ['d', 800]]),
      2
    )
    expect(teams).toHaveLength(2)
    expect(unassigned).toHaveLength(0)
    const byId = new Map([['a', 1300], ['b', 1200], ['c', 900], ['d', 800]])
    const totals = teams.map(t => t.joueur_ids.reduce((s, id) => s + byId.get(id)!, 0))
    expect(Math.max(...totals) - Math.min(...totals)).toBeLessThanOrEqual(100)
  })

  it('surnuméraires renvoyés dans unassigned, jamais largués', () => {
    const { teams, unassigned } = balancedTeamsByLevel(
      ranked([['a', 1000], ['b', 1000], ['c', 1000], ['d', 1000], ['e', 1000]]),
      2
    )
    expect(teams).toHaveLength(2)
    expect(unassigned).toHaveLength(1)
    const assigned = teams.flatMap(t => t.joueur_ids)
    expect(new Set([...assigned, ...unassigned]).size).toBe(5) // tous présents une fois
  })

  it('triplette : 6 joueurs → 2 équipes équilibrées', () => {
    const { teams } = balancedTeamsByLevel(
      ranked([['a', 1500], ['b', 1400], ['c', 1000], ['d', 900], ['e', 600], ['f', 500]]),
      3
    )
    expect(teams).toHaveLength(2)
    for (const t of teams) expect(t.joueur_ids).toHaveLength(3)
    const byId = new Map([['a', 1500], ['b', 1400], ['c', 1000], ['d', 900], ['e', 600], ['f', 500]])
    const totals = teams.map(t => t.joueur_ids.reduce((s, id) => s + byId.get(id)!, 0))
    expect(Math.abs(totals[0] - totals[1])).toBeLessThanOrEqual(200)
  })

  it('joueur sans niveau traité comme neutre (1000)', () => {
    const { teams } = balancedTeamsByLevel([{ id: 'a' }, { id: 'b' }], 2)
    expect(teams).toHaveLength(1)
    expect(teams[0].joueur_ids.sort()).toEqual(['a', 'b'])
  })

  it('effectif insuffisant → aucune équipe, tous en unassigned', () => {
    const { teams, unassigned } = balancedTeamsByLevel(ranked([['a', 1000]]), 2)
    expect(teams).toHaveLength(0)
    expect(unassigned).toEqual(['a'])
  })

  it('tous les joueurs assignés apparaissent exactement une fois', () => {
    const players = ranked(Array.from({ length: 12 }, (_, i) => [`p${i}`, 800 + i * 50] as [string, number]))
    const { teams, unassigned } = balancedTeamsByLevel(players, 3)
    const all = [...teams.flatMap(t => t.joueur_ids), ...unassigned]
    expect(new Set(all).size).toBe(12)
    expect(all).toHaveLength(12)
  })
})

describe('teamLevel / seedTeamsByLevel', () => {
  it('teamLevel somme les niveaux, défaut 1000 si absent', () => {
    const m = new Map([['a', 1200]])
    expect(teamLevel(['a', 'b'], m)).toBe(2200) // 1200 + 1000 par défaut
  })

  it('seedTeamsByLevel ordonne par niveau total décroissant', () => {
    const m = new Map([['a', 1500], ['b', 1500], ['c', 700], ['d', 700]])
    const teams = [
      { id: 'faible', joueur_ids: ['c', 'd'] },
      { id: 'fort', joueur_ids: ['a', 'b'] },
    ]
    const seeded = seedTeamsByLevel(teams, m)
    expect(seeded[0].id).toBe('fort')
    expect(seeded[1].id).toBe('faible')
  })
})
