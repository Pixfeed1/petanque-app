/**
 * Tests de départage de poule — règle « confrontation directe avant la différence ».
 *
 * Complète stats.service.test.ts (qui couvre les cas hors poule / sans matchs).
 * Ici on fournit les matchs réels d'une poule, donc la confrontation directe s'applique.
 *
 * Convention de vérif : la meilleure tête de série n'a pas de sens ici — on construit
 * des résultats précis et on vérifie l'ordre du classement.
 */

import { describe, it, expect } from 'vitest'
import { calculateTeamStats, sortTeamsByFIPJPRules } from '../stats.service'
import type { Match } from '@/lib/types'

type Team = { id: string; name: string }
let MID = 0

function mkMatch(poule: string, a: Team, b: Team, sa: number, sb: number): Match {
  return {
    id: `m${MID++}`, tournoi_id: 't', poule, type: 'poule', status: 'termine',
    equipe_a_id: a.id, equipe_b_id: b.id, equipe_a: a, equipe_b: b,
    score_a: sa, score_b: sb, tour: 1,
  } as unknown as Match
}

function rank(poule: string, teams: Team[], matches: Match[]): string[] {
  const stats = teams.map(t => calculateTeamStats(t.id, t.name, matches))
  return sortTeamsByFIPJPRules(stats, matches, poule).map(s => s.name)
}

describe('Départage poule — confrontation directe avant la différence', () => {
  it('le vainqueur du match direct passe devant, même avec une moins bonne différence générale', () => {
    MID = 0
    const A = { id: 'A', name: 'A' }, B = { id: 'B', name: 'B' }, C = { id: 'C', name: 'C' }, D = { id: 'D', name: 'D' }, E = { id: 'E', name: 'E' }
    const P = 'A'
    const m = [
      mkMatch(P, A, B, 13, 3), mkMatch(P, A, C, 13, 3), mkMatch(P, A, D, 13, 1), mkMatch(P, A, E, 13, 1),
      mkMatch(P, C, B, 13, 12),                          // C bat B en direct
      mkMatch(P, B, D, 13, 0), mkMatch(P, B, E, 13, 0),  // B écrase D/E -> meilleure diff générale
      mkMatch(P, C, D, 13, 11), mkMatch(P, E, C, 13, 11), mkMatch(P, D, E, 13, 11),
    ]
    const r = rank(P, [A, B, C, D, E], m)

    // B et C sont à 2 victoires. C a battu B en direct -> C devant B,
    // bien que B ait une bien meilleure différence générale (+15 vs -9).
    expect(r.indexOf('C')).toBeLessThan(r.indexOf('B'))
    expect(r.slice(0, 2)).toEqual(['A', 'C']) // 2 qualifiés : A puis C (avant le fix : A puis B)
  })

  it('égalité à 3 (cycle) départagée au goal-average particulier', () => {
    MID = 0
    const A = { id: 'A', name: 'A' }, B = { id: 'B', name: 'B' }, C = { id: 'C', name: 'C' }, D = { id: 'D', name: 'D' }
    const P = 'B'
    const m = [
      mkMatch(P, A, B, 13, 8), // A bat B (+5)
      mkMatch(P, B, C, 13, 6), // B bat C (+7)
      mkMatch(P, C, A, 13, 9), // C bat A (+4)
      mkMatch(P, A, D, 13, 0), mkMatch(P, B, D, 13, 3), mkMatch(P, C, D, 13, 5),
    ]
    const r = rank(P, [A, B, C, D], m)

    // Cycle A>B>C>A : mini-points égaux (3 chacun) -> goal-average particulier.
    // Particulier : B = +2, A = +1, C = -3  ->  ordre B, A, C.
    expect(r).toEqual(['B', 'A', 'C', 'D'])
  })

  it('nul en match direct : on retombe sur les critères généraux, sans inversion arbitraire', () => {
    MID = 0
    const Zoe = { id: 'Zoe', name: 'Zoe' }, Ana = { id: 'Ana', name: 'Ana' }, Cyril = { id: 'Cyril', name: 'Cyril' }
    const P = 'C'
    const m = [
      mkMatch(P, Zoe, Ana, 11, 11),                      // nul direct
      mkMatch(P, Zoe, Cyril, 13, 5), mkMatch(P, Ana, Cyril, 13, 5),
    ]
    const r = rank(P, [Zoe, Ana, Cyril], m)

    // Zoe et Ana ex æquo parfait (1 nul + 1 large victoire) ; diff et points marqués égaux.
    // Le nul ne tranche pas -> critères généraux -> alphabétique : Ana avant Zoe (pas d'inversion).
    expect(r).toEqual(['Ana', 'Zoe', 'Cyril'])
  })
})
