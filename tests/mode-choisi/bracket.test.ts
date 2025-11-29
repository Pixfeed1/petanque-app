/**
 * Tests pour la génération des brackets d'élimination
 * Mode Choisi - Pétanque App
 */

import { describe, it, expect } from 'vitest'
import {
  calculateBracketMatches,
  applySeedingByRank,
  generateFirstRoundPairs,
  validateBracketGeneration
} from '@/lib/services/bracket.service'

describe('Bracket Service - Mode Choisi', () => {

  // ============================================================================
  // calculateBracketMatches - Calcul du nombre de matchs
  // ============================================================================
  describe('calculateBracketMatches', () => {

    it('devrait rejeter moins de 2 équipes', () => {
      expect(() => calculateBracketMatches(0)).toThrow('moins de 2 équipes')
      expect(() => calculateBracketMatches(1)).toThrow('moins de 2 équipes')
    })

    it('devrait rejeter plus de 16 équipes', () => {
      expect(() => calculateBracketMatches(17)).toThrow('Maximum 16 équipes')
      expect(() => calculateBracketMatches(20)).toThrow('Maximum 16 équipes')
      expect(() => calculateBracketMatches(32)).toThrow('Maximum 16 équipes')
    })

    it('2 équipes → finale directe', () => {
      const result = calculateBracketMatches(2)
      expect(result.nbMatches).toBe(1)
      expect(result.round).toBe('finale')
      expect(result.hasByes).toBe(false)
      expect(result.nbByes).toBe(0)
    })

    it('3 équipes → demi-finales avec 1 BYE', () => {
      const result = calculateBracketMatches(3)
      expect(result.nbMatches).toBe(2)
      expect(result.round).toBe('demi')
      expect(result.hasByes).toBe(true)
      expect(result.nbByes).toBe(1)
    })

    it('4 équipes → demi-finales sans BYE', () => {
      const result = calculateBracketMatches(4)
      expect(result.nbMatches).toBe(2)
      expect(result.round).toBe('demi')
      expect(result.hasByes).toBe(false)
      expect(result.nbByes).toBe(0)
    })

    it('5 équipes → quarts avec 3 BYE', () => {
      const result = calculateBracketMatches(5)
      expect(result.nbMatches).toBe(4)
      expect(result.round).toBe('quart')
      expect(result.hasByes).toBe(true)
      expect(result.nbByes).toBe(3)
    })

    it('8 équipes → quarts sans BYE', () => {
      const result = calculateBracketMatches(8)
      expect(result.nbMatches).toBe(4)
      expect(result.round).toBe('quart')
      expect(result.hasByes).toBe(false)
      expect(result.nbByes).toBe(0)
    })

    it('9 équipes → huitièmes avec 7 BYE', () => {
      const result = calculateBracketMatches(9)
      expect(result.nbMatches).toBe(8)
      expect(result.round).toBe('huitieme')
      expect(result.hasByes).toBe(true)
      expect(result.nbByes).toBe(7)
    })

    it('16 équipes → huitièmes sans BYE', () => {
      const result = calculateBracketMatches(16)
      expect(result.nbMatches).toBe(8)
      expect(result.round).toBe('huitieme')
      expect(result.hasByes).toBe(false)
      expect(result.nbByes).toBe(0)
    })
  })

  // ============================================================================
  // applySeedingByRank - Réorganisation pour éviter rencontres même poule
  // ============================================================================
  describe('applySeedingByRank', () => {

    it('devrait réorganiser 4 équipes de 2 poules (2 qualifiés/poule)', () => {
      const teams = [
        { id: '1', name: '1er Poule A', poule: 'A' },
        { id: '2', name: '2ème Poule A', poule: 'A' },
        { id: '3', name: '1er Poule B', poule: 'B' },
        { id: '4', name: '2ème Poule B', poule: 'B' }
      ]

      const result = applySeedingByRank(teams, 2, 2)

      // Attendu: [1er A, 1er B, 2ème A, 2ème B]
      // Pour que 1er A vs 1er B (pas même poule) et 2ème A vs 2ème B
      expect(result[0].name).toBe('1er Poule A')
      expect(result[1].name).toBe('1er Poule B')
      expect(result[2].name).toBe('2ème Poule A')
      expect(result[3].name).toBe('2ème Poule B')
    })

    it('devrait réorganiser 6 équipes de 3 poules (2 qualifiés/poule)', () => {
      const teams = [
        { id: '1', name: '1er A', poule: 'A' },
        { id: '2', name: '2ème A', poule: 'A' },
        { id: '3', name: '1er B', poule: 'B' },
        { id: '4', name: '2ème B', poule: 'B' },
        { id: '5', name: '1er C', poule: 'C' },
        { id: '6', name: '2ème C', poule: 'C' }
      ]

      const result = applySeedingByRank(teams, 2, 3)

      // Attendu: [1er A, 1er B, 1er C, 2ème A, 2ème B, 2ème C]
      expect(result[0].name).toBe('1er A')
      expect(result[1].name).toBe('1er B')
      expect(result[2].name).toBe('1er C')
      expect(result[3].name).toBe('2ème A')
      expect(result[4].name).toBe('2ème B')
      expect(result[5].name).toBe('2ème C')
    })

    it('devrait gérer une seule poule', () => {
      const teams = [
        { id: '1', name: '1er', poule: 'A' },
        { id: '2', name: '2ème', poule: 'A' }
      ]

      const result = applySeedingByRank(teams, 2, 1)

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('1er')
      expect(result[1].name).toBe('2ème')
    })
  })

  // ============================================================================
  // generateFirstRoundPairs - Génération des paires de matchs
  // ============================================================================
  describe('generateFirstRoundPairs', () => {

    it('devrait générer 1 match pour 2 équipes', () => {
      const teams = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' }
      ]

      const matches = generateFirstRoundPairs(teams)

      expect(matches).toHaveLength(1)
      expect(matches[0].teamA?.name).toBe('A')
      expect(matches[0].teamB?.name).toBe('B')
      expect(matches[0].isBye).toBe(false)
    })

    it('devrait générer 2 matchs avec BYE pour 3 équipes', () => {
      const teams = [
        { id: '1', name: 'A' },
        { id: '2', name: 'B' },
        { id: '3', name: 'C' }
      ]

      const matches = generateFirstRoundPairs(teams)

      expect(matches).toHaveLength(2)

      // Un des matchs devrait être un BYE
      const byeMatches = matches.filter(m => m.isBye)
      expect(byeMatches).toHaveLength(1)
    })

    it('devrait générer 4 matchs sans BYE pour 8 équipes', () => {
      const teams = Array.from({ length: 8 }, (_, i) => ({
        id: String(i + 1),
        name: `Team ${i + 1}`
      }))

      const matches = generateFirstRoundPairs(teams)

      expect(matches).toHaveLength(4)
      expect(matches.every(m => !m.isBye)).toBe(true)
      expect(matches.every(m => m.teamA !== null && m.teamB !== null)).toBe(true)
    })
  })

  // ============================================================================
  // validateBracketGeneration - Validation avant génération
  // ============================================================================
  describe('validateBracketGeneration', () => {

    it('devrait valider des matchs terminés sans égalité', () => {
      const matches = [
        { score_a: 13, score_b: 8, status: 'termine', equipe_a: { name: 'A' }, equipe_b: { name: 'B' } },
        { score_a: 11, score_b: 13, status: 'termine', equipe_a: { name: 'C' }, equipe_b: { name: 'D' } }
      ]

      const result = validateBracketGeneration(matches)

      expect(result.valid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('devrait rejeter si matchs non terminés', () => {
      const matches = [
        { score_a: 13, score_b: 8, status: 'termine', equipe_a: { name: 'A' }, equipe_b: { name: 'B' } },
        { score_a: 0, score_b: 0, status: 'a_jouer', equipe_a: { name: 'C' }, equipe_b: { name: 'D' } }
      ]

      const result = validateBracketGeneration(matches)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('non terminé')
    })

    it('devrait rejeter si égalité détectée', () => {
      const matches = [
        { score_a: 10, score_b: 10, status: 'termine', equipe_a: { name: 'A' }, equipe_b: { name: 'B' } },
        { score_a: 13, score_b: 8, status: 'termine', equipe_a: { name: 'C' }, equipe_b: { name: 'D' } }
      ]

      const result = validateBracketGeneration(matches)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('galité')
      expect(result.error).toContain('A vs B')
    })

    it('devrait valider une liste vide', () => {
      const result = validateBracketGeneration([])
      expect(result.valid).toBe(true)
    })
  })
})
