/**
 * Bug #4 — Mêlée tournante en TÊTE-À-TÊTE.
 *
 * Bug d'origine : teamSize valait 3 (triplette) → les joueurs individuels étaient fusionnés
 * en triplettes et certains étaient largués à chaque rotation.
 *
 * Modèle correct (vérifié ici) : chaque joueur est une équipe de 1 STABLE. Une rotation =
 * UNE ronde de Berger (nouveaux adversaires). Avec un nombre impair de joueurs, un joueur est
 * exempt (bye) à chaque ronde, jamais largué. Sur un cycle complet, chaque joueur affronte
 * tous les autres exactement une fois.
 *
 * `bergerRoundForRotation` centralise cette logique, utilisée à l'identique par :
 *   - useTournamentCreation.createMeleeTeteATeteFirstRound (ronde 1)
 *   - useRotation.buildMatchesForRotation (rotations >= 2)
 */

import { describe, it, expect } from 'vitest'
import { bergerRoundForRotation } from '../tirage.service'

// Reproduit la construction côté hook : joueurs individuels, ordre STABLE, id = index.
function individualTeams(n: number) {
  return Array.from({ length: n }, (_, i) => ({ id: String(i), name: `Joueur ${i + 1}` }))
}

function pairsOf(matches: Array<{ teamA: { id: string }; teamB: { id: string } }>) {
  return matches.map(m => {
    const a = parseInt(m.teamA.id, 10)
    const b = parseInt(m.teamB.id, 10)
    return a < b ? `${a}-${b}` : `${b}-${a}`
  })
}

describe('Mêlée tournante tête-à-tête — 9 joueurs (scénario de validation)', () => {
  const N = 9
  const teams = individualTeams(N)
  const numRounds = N // impair → Berger avec fantôme = N rondes

  it('ronde 1 : pas de triplette, aucun joueur largué, exactement un exempt', () => {
    const r1 = bergerRoundForRotation(teams, 1)

    // 4 matchs (8 joueurs), 1 joueur exempt — jamais de fusion en triplette
    expect(r1).toHaveLength(Math.floor(N / 2))

    const playing = new Set<number>()
    for (const m of r1) {
      // chaque "équipe" reste un individu (un seul id par côté)
      playing.add(parseInt(m.teamA.id, 10))
      playing.add(parseInt(m.teamB.id, 10))
    }
    expect(playing.size).toBe(N - 1) // 8 jouent, 1 exempt, 0 largué
  })

  it('chaque rotation donne de NOUVEAUX adversaires (aucune répétition sur un cycle)', () => {
    const seen = new Set<string>()
    for (let r = 1; r <= numRounds; r++) {
      for (const key of pairsOf(bergerRoundForRotation(teams, r))) {
        expect(seen.has(key)).toBe(false)
        seen.add(key)
      }
    }
    // round-robin complet : chaque paire exactement une fois
    expect(seen.size).toBe((N * (N - 1)) / 2)
  })

  it('sur un cycle complet, chaque joueur joue N-1 matchs (un seul exempt, jamais largué)', () => {
    const count = new Array(N).fill(0)
    for (let r = 1; r <= numRounds; r++) {
      for (const m of bergerRoundForRotation(teams, r)) {
        count[parseInt(m.teamA.id, 10)]++
        count[parseInt(m.teamB.id, 10)]++
      }
    }
    count.forEach(c => expect(c).toBe(N - 1))
  })

  it('le cycle se répète proprement après numRounds (rotation r ≡ r + numRounds)', () => {
    expect(pairsOf(bergerRoundForRotation(teams, 1)).sort())
      .toEqual(pairsOf(bergerRoundForRotation(teams, 1 + numRounds)).sort())
  })
})

describe('Mêlée tournante tête-à-tête — nombre PAIR de joueurs (8)', () => {
  const N = 8
  const teams = individualTeams(N)
  const numRounds = N - 1 // pair → N-1 rondes, aucun exempt

  it('chaque ronde fait jouer tout le monde (aucun exempt), pas de triplette', () => {
    for (let r = 1; r <= numRounds; r++) {
      const round = bergerRoundForRotation(teams, r)
      expect(round).toHaveLength(N / 2)
      const playing = new Set<number>()
      round.forEach(m => {
        playing.add(parseInt(m.teamA.id, 10))
        playing.add(parseInt(m.teamB.id, 10))
      })
      expect(playing.size).toBe(N) // tout le monde joue
    }
  })

  it('round-robin complet sans répétition sur un cycle', () => {
    const seen = new Set<string>()
    for (let r = 1; r <= numRounds; r++) {
      for (const key of pairsOf(bergerRoundForRotation(teams, r))) {
        expect(seen.has(key)).toBe(false)
        seen.add(key)
      }
    }
    expect(seen.size).toBe((N * (N - 1)) / 2)
  })
})
