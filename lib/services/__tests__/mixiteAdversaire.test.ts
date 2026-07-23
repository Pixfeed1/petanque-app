import { describe, it, expect } from 'vitest'
import {
  teamGenderProfile,
  profilesCompatible,
  pairRoundByMixite,
  type GenderProfile,
} from '../mixiteAdversaire'

const G = (spec: Record<string, 'H' | 'F'>) => new Map(Object.entries(spec))

describe('mixiteAdversaire', () => {
  describe('teamGenderProfile', () => {
    const g = G({ h1: 'H', h2: 'H', h3: 'H', f1: 'F', f2: 'F', f3: 'F' })
    it('3 hommes → M', () => expect(teamGenderProfile(['h1', 'h2', 'h3'], g)).toBe('M'))
    it('3 femmes → F', () => expect(teamGenderProfile(['f1', 'f2', 'f3'], g)).toBe('F'))
    it('2F+1H → F (majorité femmes)', () => expect(teamGenderProfile(['f1', 'f2', 'h1'], g)).toBe('F'))
    it('2H+1F → M (majorité hommes)', () => expect(teamGenderProfile(['h1', 'h2', 'f1'], g)).toBe('M'))
    it('doublette 1H+1F → N (équilibré)', () => expect(teamGenderProfile(['h1', 'f1'], g)).toBe('N'))
    it('doublette 2H → M', () => expect(teamGenderProfile(['h1', 'h2'], g)).toBe('M'))
    it('doublette 2F → F', () => expect(teamGenderProfile(['f1', 'f2'], g)).toBe('F'))
    it('genre inconnu compté comme H', () => expect(teamGenderProfile(['x1', 'x2'], g)).toBe('M'))
  })

  describe('profilesCompatible', () => {
    it('F vs F → oui', () => expect(profilesCompatible('F', 'F')).toBe(true))
    it('M vs M → oui', () => expect(profilesCompatible('M', 'M')).toBe(true))
    it('F vs M → NON (le cœur de la règle)', () => expect(profilesCompatible('F', 'M')).toBe(false))
    it('M vs F → NON', () => expect(profilesCompatible('M', 'F')).toBe(false))
    it('N vs F → oui (équilibré compatible avec tout)', () => expect(profilesCompatible('N', 'F')).toBe(true))
    it('N vs M → oui', () => expect(profilesCompatible('N', 'M')).toBe(true))
    it('N vs N → oui', () => expect(profilesCompatible('N', 'N')).toBe(true))
  })

  describe('pairRoundByMixite', () => {
    // Vérifie qu'AUCUNE paire ne viole la règle (sauf dérogations comptées).
    const noIllegalPairs = (profiles: GenderProfile[], pairs: Array<[number, number]>, forced: number) => {
      const illegal = pairs.filter(([a, b]) => !profilesCompatible(profiles[a], profiles[b]))
      expect(illegal.length).toBe(forced)
    }

    it('2F + 2M → chaque profil affronte son semblable, 0 dérogation', () => {
      const profiles: GenderProfile[] = ['F', 'F', 'M', 'M']
      const { pairs, bye, forced } = pairRoundByMixite(profiles)
      expect(forced).toBe(0)
      expect(bye).toBeNull()
      expect(pairs.length).toBe(2)
      noIllegalPairs(profiles, pairs, forced)
    })

    it('F majoritaire tombe contre F ou N, jamais M', () => {
      const profiles: GenderProfile[] = ['F', 'N', 'M', 'N']
      const { pairs, forced } = pairRoundByMixite(profiles)
      expect(forced).toBe(0)
      // La F (index 0) ne doit pas être appariée à la M (index 2)
      const fPair = pairs.find(([a, b]) => a === 0 || b === 0)!
      const partner = fPair[0] === 0 ? fPair[1] : fPair[0]
      expect(profiles[partner]).not.toBe('M')
    })

    it('N s\'apparie avec n\'importe qui', () => {
      const profiles: GenderProfile[] = ['N', 'N', 'N', 'N']
      const { forced } = pairRoundByMixite(profiles)
      expect(forced).toBe(0)
    })

    it('nombre impair → une équipe exempte (bye)', () => {
      const profiles: GenderProfile[] = ['F', 'F', 'M']
      const { pairs, bye } = pairRoundByMixite(profiles)
      expect(pairs.length).toBe(1)
      expect(bye).not.toBeNull()
    })

    it('EXCEPTION : 3F + 1M → impossible d\'éviter une dérogation, elle est comptée', () => {
      // 3 équipes F, 1 équipe M : la M devra forcément tomber contre une F.
      const profiles: GenderProfile[] = ['F', 'F', 'F', 'M']
      const { pairs, forced } = pairRoundByMixite(profiles)
      expect(pairs.length).toBe(2)
      expect(forced).toBe(1) // une seule dérogation, le minimum imposé
      noIllegalPairs(profiles, pairs, forced)
    })

    it('toutes les équipes sont appariées (aucune perdue)', () => {
      const profiles: GenderProfile[] = ['F', 'M', 'N', 'F', 'M', 'N']
      const { pairs, bye } = pairRoundByMixite(profiles)
      const used = new Set<number>()
      pairs.forEach(([a, b]) => { used.add(a); used.add(b) })
      if (bye !== null) used.add(bye)
      expect(used.size).toBe(6)
    })

    it('cas vide / une seule équipe', () => {
      expect(pairRoundByMixite([]).pairs).toEqual([])
      const solo = pairRoundByMixite(['F'])
      expect(solo.pairs).toEqual([])
      expect(solo.bye).toBe(0)
    })
  })
})
