import { describe, it, expect } from 'vitest'
import {
  buildInitialRows,
  deriveSeeding,
  computeTargetState,
  thirdPlaceTeamId,
  type DEStoredRow,
} from '../doubleEliminationIntegration'

const seedNum = (id: string) => parseInt(id.slice(1), 10) // "T3" -> 3

/** Reproduit la boucle de persistance serveur : on joue un match "a_jouer"
 *  (le meilleur seed gagne), on recalcule l'état cible et on le réapplique. */
function driveViaIntegration(teamIds: string[]): DEStoredRow[] {
  let rows: DEStoredRow[] = buildInitialRows(teamIds).map((r) => ({
    type: r.type,
    equipe_a_id: r.equipe_a_id,
    equipe_b_id: r.equipe_b_id,
    status: r.status,
    winner_id: r.winner_id,
  }))

  let guard = 0
  while (rows.some((r) => r.status === 'a_jouer') && guard++ < 1000) {
    const next = rows.find((r) => r.status === 'a_jouer')!
    const w = seedNum(next.equipe_a_id!) < seedNum(next.equipe_b_id!) ? next.equipe_a_id! : next.equipe_b_id!
    next.status = 'termine'
    next.winner_id = w

    // recalcul + réapplication du différentiel (comme advanceDoubleElimination)
    const target = computeTargetState(rows)
    const byType = new Map(rows.map((r) => [r.type, r]))
    for (const m of target) {
      const cur = byType.get(m.type)!
      cur.equipe_a_id = m.equipeAId
      cur.equipe_b_id = m.equipeBId
      cur.status = m.status
      cur.winner_id = m.winnerId
    }
  }
  return rows
}

describe('Intégration double élim — reconstruction du seeding (W1)', () => {
  for (const n of [4, 8, 16, 5, 6, 7, 11]) {
    it(`${n} équipes : deriveSeeding récupère teamIdsBySeed à l'identique`, () => {
      const teamIds = Array.from({ length: n }, (_, i) => `T${i + 1}`)
      const rows = buildInitialRows(teamIds)
      const { nbTeams, teamIdsBySeed } = deriveSeeding(rows)
      expect(nbTeams).toBe(n)
      expect(teamIdsBySeed).toEqual(teamIds)
    })
  }
})

describe('Intégration double élim — avancement via le réducteur (flux serveur)', () => {
  for (const n of [4, 8, 16, 5, 6, 7, 11, 3]) {
    it(`${n} équipes : se joue jusqu'au bout, champion = T1, tout terminé`, () => {
      const teamIds = Array.from({ length: n }, (_, i) => `T${i + 1}`)
      const rows = driveViaIntegration(teamIds)

      expect(rows.every((r) => r.status === 'termine')).toBe(true)
      const gf = rows.find((r) => r.type === 'de:GF')!
      expect(gf.winner_id).toBe('T1') // le meilleur seed gagne tout
    })
  }

  it('état initial (results vide) : W1 jouable, GF en attente, byes pré-résolus', () => {
    const teamIds = Array.from({ length: 6 }, (_, i) => `T${i + 1}`) // 6 → 2 byes
    const rows = buildInitialRows(teamIds)
    const w1 = rows.filter((r) => /^de:W1-\d+$/.test(r.type))
    // les W1 non-bye sont a_jouer, les byes sont termine avec un vainqueur
    expect(w1.some((r) => r.status === 'a_jouer')).toBe(true)
    expect(w1.some((r) => r.status === 'termine' && r.winner_id !== null)).toBe(true)
    expect(rows.find((r) => r.type === 'de:GF')!.status).toBe('en_attente')
  })
})

describe('Intégration double élim — 3e place (perdant finale LB)', () => {
  for (const n of [4, 8, 16]) {
    it(`${n} équipes : 3e = perdant de la finale LB, non-null et != champion`, () => {
      const teamIds = Array.from({ length: n }, (_, i) => `T${i + 1}`)
      const rows = driveViaIntegration(teamIds)
      const third = thirdPlaceTeamId(rows)
      const champion = rows.find((r) => r.type === 'de:GF')!.winner_id
      expect(third).not.toBeNull()
      expect(third).not.toBe(champion)
    })
  }

  it('renvoie null tant que la finale LB n\'est pas jouée', () => {
    const teamIds = Array.from({ length: 8 }, (_, i) => `T${i + 1}`)
    const rows = buildInitialRows(teamIds).map((r) => ({ ...r })) as DEStoredRow[]
    expect(thirdPlaceTeamId(rows)).toBeNull()
  })
})
