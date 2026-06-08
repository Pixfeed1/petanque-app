/**
 * Bug — classement final / podium d'un tournoi à phase finale.
 *
 * Avant : le classement final était trié par points cumulés (poule + bracket), si bien qu'un
 * demi-finaliste avec beaucoup de points pouvait passer DEVANT le finaliste (ex. « Équipe 5 »
 * éliminée en demie classée 2e). computeFinalRanking doit classer par PLACE dans le bracket :
 *   1er = vainqueur finale, 2e = perdant finale, 3e/4e = petite finale (ou perdants de demie),
 *   puis quarts/huitièmes, puis équipes sorties en poule.
 */

import { describe, it, expect } from 'vitest'
import { computeFinalRanking } from '../stats.service'
import type { Match } from '@/lib/types'

let mid = 0
function match(
  type: Match['type'],
  aId: string,
  bId: string | null,
  scoreA: number | null,
  scoreB: number | null,
  poule: string | null = null
): Match {
  mid++
  return {
    id: `m${mid}`,
    tournoi_id: 't1',
    equipe_a_id: aId,
    equipe_b_id: bId,
    equipe_a: { id: aId, name: aId, joueur_ids: [], tournoi_id: 't1' } as any,
    equipe_b: bId ? ({ id: bId, name: bId, joueur_ids: [], tournoi_id: 't1' } as any) : null,
    score_a: scoreA,
    score_b: scoreB,
    status: scoreA !== null && scoreB !== null ? 'termine' : 'a_jouer',
    tour: 1,
    terrain: null,
    type,
    poule,
    round: null,
    manches_json: null,
    started_at: null,
    ended_at: null,
    validated_at: null,
    played_at: null,
    proposed_by: null,
    proposed_at: null,
    winner_id: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }
}

const teams = ['A', 'B', 'C', 'D', 'E'].map(id => ({ id, name: id }))

describe('computeFinalRanking — tournoi à phase finale', () => {
  it('classe par place dans le bracket : le perdant de demie ne passe PAS devant le finaliste', () => {
    const matches: Match[] = [
      // Poules — E gagne tout en poule (gros total de points), mais ne se qualifie pas loin
      match('poule', 'E', 'A', 13, 0, 'A'),
      match('poule', 'E', 'B', 13, 0, 'A'),
      match('poule', 'E', 'C', 13, 0, 'A'),
      match('poule', 'A', 'B', 13, 11, 'A'),
      // Bracket : A et B en finale, C éliminé en demie
      match('demi', 'A', 'C', 13, 12),     // C perd la demie (mais beaucoup de points)
      match('demi', 'B', 'D', 13, 2),      // D perd la demie
      match('petite_finale', 'C', 'D', 13, 7), // C gagne la petite finale -> 3e
      match('finale', 'A', 'B', 13, 10)    // A champion, B finaliste
    ]

    const ranking = computeFinalRanking(teams, matches)
    expect(ranking.map(r => r.id)).toEqual(['A', 'B', 'C', 'D', 'E'])
    expect(ranking[0].position).toBe(1)
    // B (finaliste) est 2e, surtout PAS C ni E malgré leurs points
    expect(ranking[1].id).toBe('B')
    expect(ranking[1].eliminatedIn).toBe('finale')
    expect(ranking[0].eliminatedIn).toBeNull()
  })

  it('sans petite finale, le 3e/4e = perdants de demie départagés par leurs stats de poule', () => {
    const matches: Match[] = [
      // Poules : C a un meilleur bilan de poule que D
      match('poule', 'C', 'E', 13, 4, 'A'),
      match('poule', 'D', 'E', 13, 11, 'A'),
      // Bracket sans petite finale
      match('demi', 'A', 'C', 13, 9),
      match('demi', 'B', 'D', 13, 6),
      match('finale', 'A', 'B', 13, 8)
    ]

    const ranking = computeFinalRanking(teams, matches)
    // A, B par la finale ; puis C avant D (meilleure différence de poule) ; E dernier
    expect(ranking.map(r => r.id)).toEqual(['A', 'B', 'C', 'D', 'E'])
    expect(ranking[2].eliminatedIn).toBe('demi')
    expect(ranking[3].eliminatedIn).toBe('demi')
  })

  it('place les perdants de quart après les perdants de demie', () => {
    const matches: Match[] = [
      // 8 équipes, quarts -> demies -> finale
      match('quart', 'A', 'W', 13, 5),
      match('quart', 'B', 'X', 13, 5),
      match('quart', 'C', 'Y', 13, 5),
      match('quart', 'D', 'Z', 13, 5),
      match('demi', 'A', 'C', 13, 7),
      match('demi', 'B', 'D', 13, 7),
      match('finale', 'A', 'B', 13, 9)
    ]
    const teams8 = ['A', 'B', 'C', 'D', 'W', 'X', 'Y', 'Z'].map(id => ({ id, name: id }))
    const ranking = computeFinalRanking(teams8, matches)

    expect(ranking[0].id).toBe('A') // champion
    expect(ranking[1].id).toBe('B') // finaliste
    // 3e et 4e = perdants de demie (C, D)
    expect(new Set([ranking[2].id, ranking[3].id])).toEqual(new Set(['C', 'D']))
    expect(ranking[2].eliminatedIn).toBe('demi')
    // perdants de quart (W,X,Y,Z) ensuite
    expect(ranking.slice(4).map(r => r.eliminatedIn)).toEqual(['quart', 'quart', 'quart', 'quart'])
  })

  it('sans phase finale (que des poules), classement de poule pur (FIPJP)', () => {
    const matches: Match[] = [
      match('poule', 'A', 'B', 13, 2, 'A'),
      match('poule', 'A', 'C', 13, 5, 'A'),
      match('poule', 'B', 'C', 13, 7, 'A')
    ]
    const teams3 = ['A', 'B', 'C'].map(id => ({ id, name: id }))
    const ranking = computeFinalRanking(teams3, matches)
    expect(ranking.map(r => r.id)).toEqual(['A', 'B', 'C'])
    expect(ranking.every(r => r.eliminatedIn === 'poule')).toBe(true)
  })

  it('les stats du bracket ne polluent pas le bilan de poule (poule = type poule seulement)', () => {
    const matches: Match[] = [
      match('poule', 'A', 'B', 13, 10, 'A'),
      match('finale', 'A', 'B', 13, 0)
    ]
    const teams2 = ['A', 'B'].map(id => ({ id, name: id }))
    const ranking = computeFinalRanking(teams2, matches)
    // A champion par la finale
    expect(ranking[0].id).toBe('A')
    // Le bilan affiché est complet (poule + finale) : A a 2 victoires
    expect(ranking[0].victories).toBe(2)
  })
})
