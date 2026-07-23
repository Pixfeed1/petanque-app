import { describe, it, expect } from 'vitest'
import { AVAILABLE_TERRAINS, sanitizeTerrainNames, terrainLabel } from '../terrains'

describe('terrains nommés', () => {
  it('la liste fixe contient bien A/B/C/3-9', () => {
    expect([...AVAILABLE_TERRAINS]).toEqual(['A', 'B', 'C', '3', '4', '5', '6', '7', '8', '9'])
  })

  describe('sanitizeTerrainNames', () => {
    it('garde uniquement les noms autorisés', () => {
      expect(sanitizeTerrainNames(['A', 'B', '7', 'Z', '99'])).toEqual(['A', 'B', '7'])
    })
    it('normalise la casse et supprime les doublons', () => {
      expect(sanitizeTerrainNames(['a', 'A', 'b'])).toEqual(['A', 'B'])
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
