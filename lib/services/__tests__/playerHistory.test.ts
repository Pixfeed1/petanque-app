import { describe, it, expect } from 'vitest'
import {
  EMPTY_HISTORY,
  NIVEAU_BASE,
  readHistory,
  computeNiveau,
  accumulate,
  contributionsFromTournament,
  type PlayerDelta,
  type MatchResult,
} from '../playerHistory'

const delta = (p: Partial<PlayerDelta>): PlayerDelta => ({
  parties: 0, victoires: 0, defaites: 0, nuls: 0, pointsPour: 0, pointsContre: 0, ...p,
})

describe('computeNiveau', () => {
  it('sans partie → niveau neutre 1000', () => {
    expect(computeNiveau({ parties: 0, victoires: 0, pointsPour: 0, pointsContre: 0 })).toBe(NIVEAU_BASE)
  })

  it('50% de victoires et diff nulle → 1000', () => {
    expect(computeNiveau({ parties: 10, victoires: 5, pointsPour: 100, pointsContre: 100 })).toBe(1000)
  })

  it('domination (100% victoires, gros écart) → au-dessus de 1000, borné', () => {
    const n = computeNiveau({ parties: 10, victoires: 10, pointsPour: 130, pointsContre: 0 })
    expect(n).toBeGreaterThan(1000)
    expect(n).toBeLessThanOrEqual(1600)
  })

  it('joueur faible (0 victoire, gros déficit) → sous 1000, borné', () => {
    const n = computeNiveau({ parties: 10, victoires: 0, pointsPour: 0, pointsContre: 130 })
    expect(n).toBeLessThan(1000)
    expect(n).toBeGreaterThanOrEqual(400)
  })

  it('l’écart moyen par partie est borné (anti-outlier)', () => {
    // Un écart de +100/partie ne doit pas exploser le niveau au-delà du plafond du terme d'écart.
    const capped = computeNiveau({ parties: 1, victoires: 1, pointsPour: 100, pointsContre: 0 })
    const atClamp = computeNiveau({ parties: 1, victoires: 1, pointsPour: 13, pointsContre: 0 })
    expect(capped).toBe(atClamp)
  })
})

describe('readHistory', () => {
  it('objet vide → agrégat vide, niveau 1000', () => {
    expect(readHistory({})).toEqual(EMPTY_HISTORY)
  })

  it('null / undefined → agrégat vide', () => {
    expect(readHistory(null)).toEqual(EMPTY_HISTORY)
    expect(readHistory(undefined)).toEqual(EMPTY_HISTORY)
  })

  it('chaîne JSON tolérée', () => {
    const h = readHistory(JSON.stringify({ parties: 4, victoires: 2, pointsPour: 40, pointsContre: 40 }))
    expect(h.parties).toBe(4)
    expect(h.niveau).toBe(1000)
  })

  it('valeurs invalides coercées à 0, niveau recalculé (jamais lu tel quel)', () => {
    const h = readHistory({ parties: 'x', victoires: -3, niveau: 99999 })
    expect(h.parties).toBe(0)
    expect(h.victoires).toBe(0)
    expect(h.niveau).toBe(NIVEAU_BASE) // recalculé, pas 99999
  })
})

describe('accumulate', () => {
  it('cumule un concours et incrémente le compteur de concours', () => {
    const after = accumulate(EMPTY_HISTORY, delta({ parties: 3, victoires: 2, defaites: 1, pointsPour: 35, pointsContre: 20 }))
    expect(after.concours).toBe(1)
    expect(after.parties).toBe(3)
    expect(after.victoires).toBe(2)
    expect(after.defaites).toBe(1)
    expect(after.niveau).toBeGreaterThan(1000)
  })

  it('deux concours s’additionnent', () => {
    let h = accumulate(EMPTY_HISTORY, delta({ parties: 2, victoires: 1, defaites: 1, pointsPour: 20, pointsContre: 20 }))
    h = accumulate(h, delta({ parties: 2, victoires: 2, pointsPour: 26, pointsContre: 10 }))
    expect(h.concours).toBe(2)
    expect(h.parties).toBe(4)
    expect(h.victoires).toBe(3)
  })

  it('une participation sans partie jouée n’augmente pas le compteur de concours', () => {
    const after = accumulate(EMPTY_HISTORY, delta({ parties: 0 }))
    expect(after.concours).toBe(0)
    expect(after.parties).toBe(0)
  })
})

describe('contributionsFromTournament', () => {
  it('attribue victoire/défaite et points aux bons joueurs', () => {
    const matches: MatchResult[] = [
      { teamAIds: ['a1', 'a2'], teamBIds: ['b1', 'b2'], scoreA: 13, scoreB: 7 },
    ]
    const c = contributionsFromTournament(matches)
    expect(c.get('a1')).toEqual({ parties: 1, victoires: 1, defaites: 0, nuls: 0, pointsPour: 13, pointsContre: 7 })
    expect(c.get('b1')).toEqual({ parties: 1, victoires: 0, defaites: 1, nuls: 0, pointsPour: 7, pointsContre: 13 })
  })

  it('égalité → nul des deux côtés', () => {
    const c = contributionsFromTournament([{ teamAIds: ['a'], teamBIds: ['b'], scoreA: 11, scoreB: 11 }])
    expect(c.get('a')!.nuls).toBe(1)
    expect(c.get('b')!.nuls).toBe(1)
    expect(c.get('a')!.victoires).toBe(0)
  })

  it('un joueur présent sur plusieurs matchs cumule ses parties', () => {
    const c = contributionsFromTournament([
      { teamAIds: ['a'], teamBIds: ['b'], scoreA: 13, scoreB: 5 },
      { teamAIds: ['a'], teamBIds: ['c'], scoreA: 9, scoreB: 13 },
    ])
    expect(c.get('a')).toEqual({ parties: 2, victoires: 1, defaites: 1, nuls: 0, pointsPour: 22, pointsContre: 18 })
  })

  it('bye (une seule équipe) ignoré — pas de points pour l’exempt', () => {
    const c = contributionsFromTournament([
      { teamAIds: ['a'], teamBIds: [], scoreA: 13, scoreB: 0 },
    ])
    expect(c.size).toBe(0)
  })
})
