/**
 * Tests du service de règles Pack Club
 * Vérifie la validation et la gestion des règles personnalisées
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ClubRulesService } from '@/lib/club/rules.service'
import { ClubRules, DEFAULT_CLUB_RULES } from '@/lib/club/types'

// ============================================================================
// Tests
// ============================================================================

describe('ClubRulesService', () => {

  describe('createDefaultRules', () => {

    it('devrait créer des règles avec les valeurs par défaut', () => {
      const rules = ClubRulesService.createDefaultRules('user123', 'Mes règles')

      expect(rules.userId).toBe('user123')
      expect(rules.name).toBe('Mes règles')
      expect(rules.id).toBeTruthy()
      expect(rules.createdAt).toBeTruthy()
      expect(rules.updatedAt).toBeTruthy()

      // Valeurs par défaut
      expect(rules.mode).toBe(DEFAULT_CLUB_RULES.mode)
      expect(rules.format).toBe(DEFAULT_CLUB_RULES.format)
      expect(rules.nombreParties).toBe(DEFAULT_CLUB_RULES.nombreParties)
      expect(rules.pointsGagnants).toBe(DEFAULT_CLUB_RULES.pointsGagnants)
    })

    it('devrait générer un ID unique pour chaque création', () => {
      const rules1 = ClubRulesService.createDefaultRules('user1', 'Rules 1')
      const rules2 = ClubRulesService.createDefaultRules('user1', 'Rules 2')

      expect(rules1.id).not.toBe(rules2.id)
    })
  })

  describe('validateRules', () => {

    it('devrait accepter des règles valides', () => {
      const rules: Partial<ClubRules> = {
        name: 'Club Pétanque Lyon',
        nombreParties: 3,
        pointsGagnants: 13,
        terrains: { noms: ['A', 'B', 'C'], attributionAuto: true }
      }

      const result = ClubRulesService.validateRules(rules)

      expect(result.valid).toBe(true)
      expect(result.errors.length).toBe(0)
    })

    it('devrait rejeter un nom vide', () => {
      const rules: Partial<ClubRules> = {
        name: '',
        nombreParties: 3
      }

      const result = ClubRulesService.validateRules(rules)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('nom'))).toBe(true)
    })

    it('devrait rejeter un nom trop long', () => {
      const rules: Partial<ClubRules> = {
        name: 'A'.repeat(101),
        nombreParties: 3
      }

      const result = ClubRulesService.validateRules(rules)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('100'))).toBe(true)
    })

    it('devrait rejeter un nombre de parties invalide', () => {
      const rules: Partial<ClubRules> = {
        name: 'Test',
        nombreParties: 5 as any
      }

      const result = ClubRulesService.validateRules(rules)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('parties'))).toBe(true)
    })

    it('devrait rejeter des points gagnants invalides', () => {
      const rules: Partial<ClubRules> = {
        name: 'Test',
        pointsGagnants: 17 as any
      }

      const result = ClubRulesService.validateRules(rules)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('points'))).toBe(true)
    })

    it('devrait rejeter 0 terrains', () => {
      const rules: Partial<ClubRules> = {
        name: 'Test',
        terrains: { noms: [], attributionAuto: false }
      }

      const result = ClubRulesService.validateRules(rules)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('terrain'))).toBe(true)
    })

    it('devrait rejeter plus de 20 terrains', () => {
      const rules: Partial<ClubRules> = {
        name: 'Test',
        terrains: {
          noms: Array.from({ length: 21 }, (_, i) => `T${i + 1}`),
          attributionAuto: false
        }
      }

      const result = ClubRulesService.validateRules(rules)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('20'))).toBe(true)
    })

    it('devrait accepter 2, 3, ou 4 parties', () => {
      [2, 3, 4].forEach(n => {
        const rules: Partial<ClubRules> = {
          name: 'Test',
          nombreParties: n as 2 | 3 | 4
        }
        const result = ClubRulesService.validateRules(rules)
        expect(result.errors.some(e => e.includes('parties'))).toBe(false)
      })
    })

    it('devrait accepter 11, 13, 15, ou 21 points', () => {
      [11, 13, 15, 21].forEach(pts => {
        const rules: Partial<ClubRules> = {
          name: 'Test',
          pointsGagnants: pts as 11 | 13 | 15 | 21
        }
        const result = ClubRulesService.validateRules(rules)
        expect(result.errors.some(e => e.includes('points'))).toBe(false)
      })
    })
  })

  describe('exportRulesToJSON', () => {

    it('devrait exporter les règles sans infos sensibles', () => {
      const rules = ClubRulesService.createDefaultRules('user123', 'Export Test')
      const json = ClubRulesService.exportRulesToJSON(rules)
      const parsed = JSON.parse(json)

      expect(parsed.userId).toBeUndefined()
      expect(parsed.id).toBeUndefined()
      expect(parsed.createdAt).toBeUndefined()
      expect(parsed.updatedAt).toBeUndefined()

      expect(parsed.name).toBe('Export Test')
      expect(parsed.mode).toBeDefined()
      expect(parsed.format).toBeDefined()
    })
  })

  describe('Types et valeurs par défaut', () => {

    it('DEFAULT_CLUB_RULES devrait avoir toutes les propriétés requises', () => {
      expect(DEFAULT_CLUB_RULES.mode).toBeDefined()
      expect(DEFAULT_CLUB_RULES.format).toBeDefined()
      expect(DEFAULT_CLUB_RULES.nombreParties).toBeDefined()
      expect(DEFAULT_CLUB_RULES.pointsGagnants).toBeDefined()
      expect(DEFAULT_CLUB_RULES.mixite).toBeDefined()
      expect(DEFAULT_CLUB_RULES.terrains).toBeDefined()
      expect(DEFAULT_CLUB_RULES.classement).toBeDefined()
    })

    it('DEFAULT_CLUB_RULES.mixite devrait être désactivée par défaut', () => {
      expect(DEFAULT_CLUB_RULES.mixite.enabled).toBe(false)
    })

    it('DEFAULT_CLUB_RULES devrait avoir des terrains par défaut', () => {
      expect(DEFAULT_CLUB_RULES.terrains.noms.length).toBeGreaterThan(0)
    })

    it('DEFAULT_CLUB_RULES.classement devrait utiliser victoires_puis_points', () => {
      expect(DEFAULT_CLUB_RULES.classement.methode).toBe('victoires_puis_points')
    })
  })
})
