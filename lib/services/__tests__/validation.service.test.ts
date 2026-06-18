/**
 * Tests unitaires pour le service de validation
 */

import {
  validatePlayerCount,
  validateTerrainNumber,
  validatePouleSize,
  validateQualifiedPerPoule,
  validateMatchStart,
  validateScore,
  validatePouleNames,
  validateMixity
} from '../validation.service'

describe('ValidationService', () => {
  describe('validatePlayerCount', () => {
    it('devrait accepter 0 joueurs en mode choisi', () => {
      const result = validatePlayerCount(0, 'doublette', 'choisi')
      expect(result.valid).toBe(true)
    })

    it('devrait refuser 0 joueurs en mêlée', () => {
      const result = validatePlayerCount(0, 'doublette', 'melee_fixe')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Minimum')
    })

    it('devrait détecter les joueurs exclus en mêlée fixe', () => {
      const result = validatePlayerCount(11, 'triplette', 'melee_fixe')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('2 joueur(s) seraient exclus')
    })

    it('devrait accepter un nombre exact de joueurs', () => {
      const result = validatePlayerCount(12, 'triplette', 'melee_fixe')
      expect(result.valid).toBe(true)
    })

    it('devrait refuser un nombre insuffisant de joueurs', () => {
      const result = validatePlayerCount(1, 'doublette', 'melee_fixe')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Minimum 2 joueur')
    })
  })

  describe('validateTerrainNumber', () => {
    it('devrait accepter un terrain valide', () => {
      const result = validateTerrainNumber(3, 5)
      expect(result.valid).toBe(true)
    })

    it('devrait refuser un terrain 0', () => {
      const result = validateTerrainNumber(0, 5)
      expect(result.valid).toBe(false)
    })

    it('devrait refuser un terrain au-delà de la limite', () => {
      const result = validateTerrainNumber(99, 3)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Le terrain 99 n\'existe pas')
    })
  })

  describe('validatePouleSize', () => {
    it('devrait accepter une taille de poule valide', () => {
      const result = validatePouleSize(4, 12)
      expect(result.valid).toBe(true)
    })

    it('devrait refuser une poule de moins de 3 équipes', () => {
      const result = validatePouleSize(2, 10)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Minimum 3 équipes')
    })

    it('devrait refuser une poule plus grande que le total d\'équipes', () => {
      const result = validatePouleSize(10, 8)
      expect(result.valid).toBe(false)
    })

    it('devrait détecter les poules déséquilibrées', () => {
      const result = validatePouleSize(5, 11)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('La dernière poule')
    })
  })

  describe('validateQualifiedPerPoule', () => {
    it('devrait accepter un nombre valide de qualifiés', () => {
      const result = validateQualifiedPerPoule(2, 4)
      expect(result.valid).toBe(true)
    })

    it('devrait refuser 0 qualifiés', () => {
      const result = validateQualifiedPerPoule(0, 4)
      expect(result.valid).toBe(false)
    })

    it('devrait refuser plus de qualifiés que d\'équipes', () => {
      const result = validateQualifiedPerPoule(4, 4)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('inférieur')
    })
  })

  describe('validateMatchStart', () => {
    it('devrait accepter un match valide', () => {
      const match = {
        terrain: 1,
        equipe_a_id: 'team1',
        equipe_b_id: 'team2',
        status: 'a_jouer'
      }
      const result = validateMatchStart(match)
      expect(result.valid).toBe(true)
    })

    it('devrait refuser un match sans terrain', () => {
      const match = {
        terrain: null,
        equipe_a_id: 'team1',
        equipe_b_id: 'team2',
        status: 'a_jouer'
      }
      const result = validateMatchStart(match)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('terrain')
    })

    it('devrait refuser un match déjà terminé', () => {
      const match = {
        terrain: 1,
        equipe_a_id: 'team1',
        equipe_b_id: 'team2',
        status: 'termine'
      }
      const result = validateMatchStart(match)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('déjà terminé')
    })

    it('devrait refuser un match sans équipe B', () => {
      const match = {
        terrain: 1,
        equipe_a_id: 'team1',
        equipe_b_id: null,
        status: 'a_jouer'
      }
      const result = validateMatchStart(match)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('manquante')
    })
  })

  describe('validateScore', () => {
    it('devrait accepter un score valide', () => {
      const result = validateScore(10, 8, 13)
      expect(result.valid).toBe(true)
    })

    it('devrait refuser un score négatif', () => {
      const result = validateScore(-1, 5, 13)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('négatifs')
    })

    it('devrait refuser deux équipes à maxPoints', () => {
      const result = validateScore(13, 13, 13)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('simultanément')
    })

    it('devrait refuser un score au-dessus de maxPoints', () => {
      const result = validateScore(15, 10, 13)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Score maximum')
    })
  })

  describe('validatePouleNames', () => {
    it('devrait accepter des poules avec noms valides', () => {
      const result = validatePouleNames(['Poule A', 'Poule B', 'Poule C'])
      expect(result.valid).toBe(true)
    })

    it('devrait refuser des poules avec noms null', () => {
      const result = validatePouleNames(['Poule A', null, 'Poule C'])
      expect(result.valid).toBe(false)
      expect(result.error).toContain('1 poule(s) sans nom')
    })

    it('devrait refuser des poules avec noms undefined', () => {
      const result = validatePouleNames(['Poule A', undefined])
      expect(result.valid).toBe(false)
      expect(result.error).toContain('sans nom')
    })
  })

  describe('validateMixity', () => {
    it('devrait accepter la mixité désactivée', () => {
      const result = validateMixity(10, 0, 'triplette', false)
      expect(result.valid).toBe(true)
    })

    it('devrait refuser la mixité obligatoire en tête-à-tête', () => {
      const result = validateMixity(5, 5, 'tete_a_tete', true)
      expect(result.valid).toBe(false)
      expect(result.warning).toContain('tête-à-tête')
    })

    it('devrait accepter la mixité valide en doublette', () => {
      const result = validateMixity(4, 4, 'doublette', true)
      expect(result.valid).toBe(true)
    })

    it('devrait refuser la mixité en doublette sans femmes', () => {
      const result = validateMixity(10, 0, 'doublette', true)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('au moins 1 homme et 1 femme')
    })

    it('devrait accepter la mixité valide en triplette', () => {
      const result = validateMixity(6, 6, 'triplette', true)
      expect(result.valid).toBe(true)
    })

    it('devrait refuser la mixité en triplette sans aucun homme', () => {
      const result = validateMixity(0, 10, 'triplette', true)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('au moins 1 homme et 1 femme')
    })

    it('devrait avertir si ratio H/F très déséquilibré en triplette', () => {
      const result = validateMixity(1, 10, 'triplette', true)
      expect(result.valid).toBe(true)
      expect(result.warning).toContain('déséquilibré')
    })
  })
})
