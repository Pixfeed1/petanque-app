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
