import { describe, it, expect } from 'vitest'
import { buildTeamsAndMatches, type PlayerRef, type CreationComposition } from '../creationPayload'

function players(n: number, gender?: 'H' | 'F'): PlayerRef[] {
  return Array.from({ length: n }, (_, i) => ({ id: `p${i}`, name: `J${i}`, gender }))
}

/** Invariants communs : indices valides, pas d'auto-match, jetons de joueurs cohérents. */
function assertValid(teams: { joueur_ids: string[] }[], matches: { team_a_index: number; team_b_index: number | null }[]) {
  for (const m of matches) {
    expect(m.team_a_index).toBeGreaterThanOrEqual(0)
    expect(m.team_a_index).toBeLessThan(teams.length)
    if (m.team_b_index !== null) {
      expect(m.team_b_index).toBeLessThan(teams.length)
      expect(m.team_a_index).not.toBe(m.team_b_index)
    }
  }
}

describe('buildTeamsAndMatches', () => {
  it('mode choisi : aucune équipe ni match', () => {
    const cfg: CreationComposition = { format: 'doublette', mode: 'choisi', mixiteObligatoire: false, pouleSize: 4, terrains: 4 }
    const r = buildTeamsAndMatches(cfg, players(8))
    expect(r.teams).toHaveLength(0)
    expect(r.matches).toHaveLength(0)
  })

  it('doublette mêlée fixe, 8 joueurs → 4 équipes, matchs de poule valides', () => {
    const cfg: CreationComposition = { format: 'doublette', mode: 'melee_fixe', mixiteObligatoire: false, pouleSize: 4, terrains: 4 }
    const r = buildTeamsAndMatches(cfg, players(8))
    expect(r.teams).toHaveLength(4)
    expect(r.matches.length).toBeGreaterThan(0)
    assertValid(r.teams, r.matches)
    // chaque joueur assigné exactement une fois
    const assigned = r.teams.flatMap(t => t.joueur_ids)
    expect(new Set(assigned).size).toBe(8)
  })

  it('triplette, 9 joueurs → 3 équipes de 3', () => {
    const cfg: CreationComposition = { format: 'triplette', mode: 'melee_fixe', mixiteObligatoire: false, pouleSize: 3, terrains: 2 }
    const r = buildTeamsAndMatches(cfg, players(9))
    expect(r.teams).toHaveLength(3)
    for (const t of r.teams) expect(t.joueur_ids).toHaveLength(3)
    assertValid(r.teams, r.matches)
  })

  it('tête-à-tête mêlée tournante, 6 joueurs → 6 équipes préfixées R1-, une ronde Berger (3 matchs)', () => {
    const cfg: CreationComposition = { format: 'tete_a_tete', mode: 'melee_tournante', mixiteObligatoire: false, pouleSize: 4, terrains: 3 }
    const r = buildTeamsAndMatches(cfg, players(6))
    expect(r.teams).toHaveLength(6)
    expect(r.teams.every(t => t.name.startsWith('R1-'))).toBe(true)
    // Une ronde de Berger pour 6 joueurs = 3 matchs, chacun 1 seule fois
    expect(r.matches).toHaveLength(3)
    assertValid(r.teams, r.matches)
    const used = r.matches.flatMap(m => [m.team_a_index, m.team_b_index])
    expect(new Set(used).size).toBe(6) // 6 équipes distinctes sur la ronde
  })

  it('propage les jetons new: dans les équipes', () => {
    const cfg: CreationComposition = { format: 'doublette', mode: 'melee_fixe', mixiteObligatoire: false, pouleSize: 4, terrains: 0 }
    const refs: PlayerRef[] = [
      { id: 'p0', name: 'A' }, { id: 'new:0', name: 'B' },
      { id: 'p1', name: 'C' }, { id: 'new:1', name: 'D' },
    ]
    const r = buildTeamsAndMatches(cfg, refs)
    const assigned = r.teams.flatMap(t => t.joueur_ids).sort()
    expect(assigned).toEqual(['new:0', 'new:1', 'p0', 'p1'])
    // terrains=0 → pas d'assignation de terrain
    expect(r.matches.every(m => m.terrain === null)).toBe(true)
  })

  it('mixité obligatoire doublette : 3H+3F → 3 équipes mixtes', () => {
    const cfg: CreationComposition = { format: 'doublette', mode: 'melee_fixe', mixiteObligatoire: true, pouleSize: 3, terrains: 2 }
    const refs = [...players(3, 'H'), ...players(3, 'F').map((p, i) => ({ ...p, id: `f${i}` }))]
    const r = buildTeamsAndMatches(cfg, refs)
    expect(r.teams).toHaveLength(3)
    assertValid(r.teams, r.matches)
  })
})
