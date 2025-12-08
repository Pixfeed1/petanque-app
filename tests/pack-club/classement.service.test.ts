/**
 * Tests du service de classement Pack Club
 * Vérifie le calcul des classements selon différentes méthodes
 */

import { describe, it, expect } from 'vitest'
import { ClubClassementService } from '@/lib/club/classement.service'
import { ClubRules, ClubPartieScore, ClubClassementEntry, DEFAULT_CLUB_RULES } from '@/lib/club/types'

// ============================================================================
// Fixtures
// ============================================================================

function createRules(overrides: Partial<ClubRules> = {}): ClubRules {
  return {
    ...DEFAULT_CLUB_RULES,
    id: 'test_rules',
    userId: 'test_user',
    name: 'Test Rules',
    ...overrides
  }
}

// Exemple du cahier des charges d'Eric
function createEricExampleData(): {
  entries: Omit<ClubClassementEntry, 'position' | 'totalDifference' | 'victoires' | 'defaites'>[]
  parties: Map<string, ClubPartieScore[]>
} {
  const entries = [
    { joueurId: 'eric', nom: 'Eric', parties: [] },
    { joueurId: 'jeanmarc', nom: 'Jean Marc', parties: [] }
  ]

  const parties = new Map<string, ClubPartieScore[]>()

  // Eric: V 13-4 (+9), D 5-13 (-8), V 13-2 (+11) = 12 pts, 2 victoires
  parties.set('eric', [
    { partieNum: 1, scoreEquipe: 13, scoreAdversaire: 4, difference: 9, victoire: true },
    { partieNum: 2, scoreEquipe: 5, scoreAdversaire: 13, difference: -8, victoire: false },
    { partieNum: 3, scoreEquipe: 13, scoreAdversaire: 2, difference: 11, victoire: true }
  ])

  // Jean Marc: V 13-6 (+7), V 13-8 (+5), V 13-3 (+10) = 22 pts, 3 victoires
  parties.set('jeanmarc', [
    { partieNum: 1, scoreEquipe: 13, scoreAdversaire: 6, difference: 7, victoire: true },
    { partieNum: 2, scoreEquipe: 13, scoreAdversaire: 8, difference: 5, victoire: true },
    { partieNum: 3, scoreEquipe: 13, scoreAdversaire: 3, difference: 10, victoire: true }
  ])

  return { entries, parties }
}

// ============================================================================
// Tests
// ============================================================================

describe('ClubClassementService', () => {

  describe('creerPartieScore', () => {

    it('devrait créer un score de victoire correct', () => {
      const score = ClubClassementService.creerPartieScore(1, 13, 4, 13)

      expect(score.partieNum).toBe(1)
      expect(score.scoreEquipe).toBe(13)
      expect(score.scoreAdversaire).toBe(4)
      expect(score.difference).toBe(9)
      expect(score.victoire).toBe(true)
    })

    it('devrait créer un score de défaite correct', () => {
      const score = ClubClassementService.creerPartieScore(2, 5, 13, 13)

      expect(score.partieNum).toBe(2)
      expect(score.scoreEquipe).toBe(5)
      expect(score.scoreAdversaire).toBe(13)
      expect(score.difference).toBe(-8)
      expect(score.victoire).toBe(false)
    })

    it('devrait considérer comme défaite si score égal mais < pointsGagnants', () => {
      const score = ClubClassementService.creerPartieScore(1, 10, 10, 13)

      expect(score.victoire).toBe(false)
    })

    it('devrait gérer victoire serrée', () => {
      const score = ClubClassementService.creerPartieScore(1, 13, 12, 13)

      expect(score.difference).toBe(1)
      expect(score.victoire).toBe(true)
    })
  })

  describe('calculerClassement - Exemple Eric', () => {

    it('devrait classer Jean Marc 1er avec victoires_puis_points', () => {
      const { entries, parties } = createEricExampleData()
      const rules = createRules({
        classement: { methode: 'victoires_puis_points', calculDifference: true }
      })

      const classement = ClubClassementService.calculerClassement(entries, parties, rules)

      expect(classement.entries.length).toBe(2)
      expect(classement.entries[0].nom).toBe('Jean Marc')
      expect(classement.entries[0].position).toBe(1)
      expect(classement.entries[0].victoires).toBe(3)
      expect(classement.entries[0].totalDifference).toBe(22)

      expect(classement.entries[1].nom).toBe('Eric')
      expect(classement.entries[1].position).toBe(2)
      expect(classement.entries[1].victoires).toBe(2)
      expect(classement.entries[1].totalDifference).toBe(12)
    })

    it('devrait aussi classer Jean Marc 1er avec points_puis_victoires', () => {
      const { entries, parties } = createEricExampleData()
      const rules = createRules({
        classement: { methode: 'points_puis_victoires', calculDifference: true }
      })

      const classement = ClubClassementService.calculerClassement(entries, parties, rules)

      // Jean Marc a 22 pts > Eric 12 pts
      expect(classement.entries[0].nom).toBe('Jean Marc')
      expect(classement.entries[1].nom).toBe('Eric')
    })
  })

  describe('calculerClassement - Méthodes de tri', () => {

    it('devrait départager par points si victoires égales (victoires_puis_points)', () => {
      const entries = [
        { joueurId: 'a', nom: 'Joueur A', parties: [] },
        { joueurId: 'b', nom: 'Joueur B', parties: [] }
      ]

      const parties = new Map<string, ClubPartieScore[]>()
      // Tous deux ont 2 victoires, mais A a plus de différence
      parties.set('a', [
        { partieNum: 1, scoreEquipe: 13, scoreAdversaire: 2, difference: 11, victoire: true },
        { partieNum: 2, scoreEquipe: 13, scoreAdversaire: 5, difference: 8, victoire: true }
      ])
      parties.set('b', [
        { partieNum: 1, scoreEquipe: 13, scoreAdversaire: 10, difference: 3, victoire: true },
        { partieNum: 2, scoreEquipe: 13, scoreAdversaire: 11, difference: 2, victoire: true }
      ])

      const rules = createRules({
        classement: { methode: 'victoires_puis_points', calculDifference: true }
      })

      const classement = ClubClassementService.calculerClassement(entries, parties, rules)

      // A: 2 victoires, +19 / B: 2 victoires, +5
      expect(classement.entries[0].nom).toBe('Joueur A')
      expect(classement.entries[0].totalDifference).toBe(19)
    })

    it('devrait départager par victoires si points égaux (points_puis_victoires)', () => {
      const entries = [
        { joueurId: 'a', nom: 'Joueur A', parties: [] },
        { joueurId: 'b', nom: 'Joueur B', parties: [] }
      ]

      const parties = new Map<string, ClubPartieScore[]>()
      // Même différence de points, mais B a plus de victoires
      parties.set('a', [
        { partieNum: 1, scoreEquipe: 13, scoreAdversaire: 3, difference: 10, victoire: true }
      ])
      parties.set('b', [
        { partieNum: 1, scoreEquipe: 13, scoreAdversaire: 8, difference: 5, victoire: true },
        { partieNum: 2, scoreEquipe: 13, scoreAdversaire: 8, difference: 5, victoire: true }
      ])

      const rules = createRules({
        classement: { methode: 'points_puis_victoires', calculDifference: true }
      })

      const classement = ClubClassementService.calculerClassement(entries, parties, rules)

      // A: +10, 1V / B: +10, 2V
      expect(classement.entries[0].nom).toBe('Joueur B')
    })

    it('devrait classer uniquement par différence avec difference_points', () => {
      const entries = [
        { joueurId: 'a', nom: 'Joueur A', parties: [] },
        { joueurId: 'b', nom: 'Joueur B', parties: [] }
      ]

      const parties = new Map<string, ClubPartieScore[]>()
      // B a 0 victoire mais meilleure différence
      parties.set('a', [
        { partieNum: 1, scoreEquipe: 13, scoreAdversaire: 12, difference: 1, victoire: true },
        { partieNum: 2, scoreEquipe: 13, scoreAdversaire: 12, difference: 1, victoire: true }
      ])
      parties.set('b', [
        { partieNum: 1, scoreEquipe: 12, scoreAdversaire: 13, difference: -1, victoire: false },
        { partieNum: 2, scoreEquipe: 13, scoreAdversaire: 0, difference: 13, victoire: true }
      ])

      const rules = createRules({
        classement: { methode: 'difference_points', calculDifference: true }
      })

      const classement = ClubClassementService.calculerClassement(entries, parties, rules)

      // A: +2 / B: +12
      expect(classement.entries[0].nom).toBe('Joueur B')
      expect(classement.entries[0].totalDifference).toBe(12)
    })
  })

  describe('detecterEgalites', () => {

    it('devrait détecter une égalité parfaite', () => {
      const entries = [
        { joueurId: 'a', nom: 'Joueur A', parties: [] },
        { joueurId: 'b', nom: 'Joueur B', parties: [] }
      ]

      const parties = new Map<string, ClubPartieScore[]>()
      // Exactement mêmes stats
      parties.set('a', [
        { partieNum: 1, scoreEquipe: 13, scoreAdversaire: 5, difference: 8, victoire: true }
      ])
      parties.set('b', [
        { partieNum: 1, scoreEquipe: 13, scoreAdversaire: 5, difference: 8, victoire: true }
      ])

      const rules = createRules({
        classement: { methode: 'victoires_puis_points', calculDifference: true }
      })

      const classement = ClubClassementService.calculerClassement(entries, parties, rules)
      const egalites = ClubClassementService.detecterEgalites(classement)

      expect(egalites.length).toBe(1)
      expect(egalites[0].joueurs).toContain('Joueur A')
      expect(egalites[0].joueurs).toContain('Joueur B')
    })

    it('devrait ne pas détecter d\'égalité si stats différentes', () => {
      const entries = [
        { joueurId: 'a', nom: 'Joueur A', parties: [] },
        { joueurId: 'b', nom: 'Joueur B', parties: [] }
      ]

      const parties = new Map<string, ClubPartieScore[]>()
      parties.set('a', [
        { partieNum: 1, scoreEquipe: 13, scoreAdversaire: 5, difference: 8, victoire: true }
      ])
      parties.set('b', [
        { partieNum: 1, scoreEquipe: 13, scoreAdversaire: 6, difference: 7, victoire: true }
      ])

      const rules = createRules({
        classement: { methode: 'victoires_puis_points', calculDifference: true }
      })

      const classement = ClubClassementService.calculerClassement(entries, parties, rules)
      const egalites = ClubClassementService.detecterEgalites(classement)

      expect(egalites.length).toBe(0)
    })
  })

  describe('genererResumeClassement', () => {

    it('devrait générer un résumé lisible', () => {
      const { entries, parties } = createEricExampleData()
      const rules = createRules({
        classement: { methode: 'victoires_puis_points', calculDifference: true }
      })

      const classement = ClubClassementService.calculerClassement(entries, parties, rules)
      const resume = ClubClassementService.genererResumeClassement(classement)

      expect(resume).toContain('CLASSEMENT')
      expect(resume).toContain('Jean Marc')
      expect(resume).toContain('Eric')
      expect(resume).toContain('Victoires')
      expect(resume).toContain('Différence')
    })
  })

  describe('Calculs de différence', () => {

    it('devrait calculer correctement une différence positive', () => {
      // 13-4 = +9
      const score = ClubClassementService.creerPartieScore(1, 13, 4, 13)
      expect(score.difference).toBe(9)
    })

    it('devrait calculer correctement une différence négative', () => {
      // 5-13 = -8
      const score = ClubClassementService.creerPartieScore(1, 5, 13, 13)
      expect(score.difference).toBe(-8)
    })

    it('devrait calculer la somme des différences', () => {
      const entries = [
        { joueurId: 'test', nom: 'Test', parties: [] }
      ]

      const parties = new Map<string, ClubPartieScore[]>()
      // +9, -8, +11 = 12
      parties.set('test', [
        { partieNum: 1, scoreEquipe: 13, scoreAdversaire: 4, difference: 9, victoire: true },
        { partieNum: 2, scoreEquipe: 5, scoreAdversaire: 13, difference: -8, victoire: false },
        { partieNum: 3, scoreEquipe: 13, scoreAdversaire: 2, difference: 11, victoire: true }
      ])

      const rules = createRules({
        classement: { methode: 'victoires_puis_points', calculDifference: true }
      })

      const classement = ClubClassementService.calculerClassement(entries, parties, rules)

      expect(classement.entries[0].totalDifference).toBe(12)
    })
  })
})
