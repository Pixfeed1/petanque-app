import { describe, it, expect } from 'vitest'
import { SUGGESTED_TERRAINS, sanitizeTerrainNames, terrainLabel } from '../terrains'

describe('terrains nommés (saisie libre)', () => {
  it('des suggestions rapides existent', () => {
    expect(SUGGESTED_TERRAINS.length).toBeGreaterThan(0)
  })

  describe('sanitizeTerrainNames', () => {
    it('accepte des noms LIBRES (plus de liste fermée)', () => {
      expect(sanitizeTerrainNames(['A', 'Platane', '12', 'Boulodrome'])).toEqual(['A', 'Platane', '12', 'Boulodrome'])
    })
    it('supprime les doublons (insensible à la casse) en gardant la casse d\'origine', () => {
      expect(sanitizeTerrainNames(['Platane', 'PLATANE', 'a', 'A'])).toEqual(['Platane', 'a'])
    })
    it('trim, ignore les vides, borne la longueur', () => {
      expect(sanitizeTerrainNames(['  B  ', '', '   '])).toEqual(['B'])
      expect(sanitizeTerrainNames(['x'.repeat(40)])[0].length).toBe(24)
    })
    it('non-tableau → vide', () => {
      expect(sanitizeTerrainNames('A')).toEqual([])
      expect(sanitizeTerrainNames(null)).toEqual([])
    })
  })

  describe('terrainLabel', () => {
    const names = ['A', 'B', '7']
    it('mappe l\'index 1-based vers le nom', () => {
      expect(terrainLabel(1, names)).toBe('A')
      expect(terrainLabel(2, names)).toBe('B')
      expect(terrainLabel(3, names)).toBe('7')
    })
    it('repli numérique si pas de noms', () => {
      expect(terrainLabel(2, undefined)).toBe('2')
      expect(terrainLabel(5, [])).toBe('5')
    })
    it('index hors liste → repli numérique', () => {
      expect(terrainLabel(4, names)).toBe('4')
    })
    it('index null → tiret', () => {
      expect(terrainLabel(null, names)).toBe('—')
      expect(terrainLabel(undefined, names)).toBe('—')
    })
  })
})

// --- Non-régression : pas de double-booking d'un terrain dans un même tour ---
import { TirageService } from '@/lib/services/tirage.service'

describe('smartTerrainAssignment — pas de double-booking par tour', () => {
  it("n'assigne jamais deux matchs du même tour au même terrain quand il y a assez de terrains", () => {
    // 3 tours de 4 matchs (2 poules de 4 équipes), 5 terrains — cas réel constaté bugué.
    const matches: Array<{ id: string; equipe_a_id: string; equipe_b_id: string | null; tour: number }> = []
    let i = 0
    for (const poule of ['A', 'B']) {
      const t = poule === 'A' ? ['1', '2', '3', '4'] : ['5', '6', '7', '8']
      const rounds = [ [[0,1],[2,3]], [[0,2],[1,3]], [[0,3],[1,2]] ]
      rounds.forEach((round, tour) => {
        for (const [a, b] of round) {
          matches.push({ id: `m${i++}`, equipe_a_id: t[a], equipe_b_id: t[b], tour: tour + 1 })
        }
      })
    }
    const assignment = TirageService.smartTerrainAssignment(matches, 5)
    for (const tour of [1, 2, 3]) {
      const terrains = matches.filter(m => m.tour === tour).map(m => assignment.get(m.id))
      expect(new Set(terrains).size).toBe(terrains.length) // tous distincts dans le tour
    }
  })

  it('réutilise un terrain seulement en pénurie (plus de matchs que de terrains)', () => {
    const matches = [0, 1, 2, 3].map(i => ({ id: `m${i}`, equipe_a_id: String(i * 2), equipe_b_id: String(i * 2 + 1), tour: 1 }))
    const assignment = TirageService.smartTerrainAssignment(matches, 2)
    const used = matches.map(m => assignment.get(m.id))
    expect(used.every(t => t === 1 || t === 2)).toBe(true) // reste dans les terrains existants
  })
})
