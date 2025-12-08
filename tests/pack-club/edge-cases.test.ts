/**
 * Tests robustes - Edge cases Pack Club
 * Tests des cas limites et situations extrêmes
 */

import { describe, it, expect } from 'vitest'
import { ClubTirageService } from '@/lib/club/tirage.service'
import { ClubClassementService } from '@/lib/club/classement.service'
import { ClubRulesService } from '@/lib/club/rules.service'
import { ClubJoueur, ClubRules, ClubPartieScore, DEFAULT_CLUB_RULES } from '@/lib/club/types'

// ============================================================================
// Helpers
// ============================================================================

function createJoueur(id: string, name: string, gender: 'H' | 'F' = 'H'): ClubJoueur {
  return { id, name, gender }
}

function createRules(overrides: Partial<ClubRules> = {}): ClubRules {
  return {
    ...DEFAULT_CLUB_RULES,
    id: 'test',
    userId: 'user',
    name: 'Test',
    ...overrides
  }
}

// ============================================================================
// Tests Edge Cases - Tirage
// ============================================================================

describe('Edge Cases - Tirage', () => {

  describe('Nombre de joueurs limites', () => {

    it('devrait gérer 0 joueurs sans crash', () => {
      const joueurs: ClubJoueur[] = []
      const rules = createRules({ format: 'doublette', mode: 'melee' })

      const result = ClubTirageService.tirage(joueurs, rules)

      expect(result.equipes).toHaveLength(0)
      expect(result.matchs).toHaveLength(0)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('devrait gérer 1 joueur sans crash', () => {
      const joueurs = [createJoueur('1', 'Solo')]
      const rules = createRules({ format: 'doublette', mode: 'melee' })

      const result = ClubTirageService.tirage(joueurs, rules)

      expect(result.equipes).toHaveLength(0)
      expect(result.joueursNonAssignes).toContain('1')
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('devrait gérer 100 joueurs en doublette', () => {
      const joueurs: ClubJoueur[] = Array.from({ length: 100 }, (_, i) =>
        createJoueur(`j${i}`, `Joueur ${i}`, i % 2 === 0 ? 'H' : 'F')
      )
      const rules = createRules({ format: 'doublette', mode: 'melee' })

      const result = ClubTirageService.tirage(joueurs, rules)

      // 100 joueurs = 50 équipes de 2
      expect(result.equipes).toHaveLength(50)
      expect(result.joueursNonAssignes).toHaveLength(0)
      // 50 équipes = 25 matchs
      expect(result.matchs).toHaveLength(25)
    })

    it('devrait gérer 99 joueurs en triplette (33 équipes)', () => {
      const joueurs: ClubJoueur[] = Array.from({ length: 99 }, (_, i) =>
        createJoueur(`j${i}`, `Joueur ${i}`)
      )
      const rules = createRules({ format: 'triplette', mode: 'melee' })

      const result = ClubTirageService.tirage(joueurs, rules)

      // 99 joueurs = 33 équipes de 3
      expect(result.equipes).toHaveLength(33)
      expect(result.joueursNonAssignes).toHaveLength(0)
    })

    it('devrait gérer 101 joueurs en triplette avec 2 restants', () => {
      const joueurs: ClubJoueur[] = Array.from({ length: 101 }, (_, i) =>
        createJoueur(`j${i}`, `Joueur ${i}`)
      )
      const rules = createRules({
        format: 'triplette',
        mode: 'melee',
        autoriserMelangeFormats: false
      })

      const result = ClubTirageService.tirage(joueurs, rules)

      // 101 joueurs = 33 triplettes (99) + 2 non assignés
      expect(result.equipes).toHaveLength(33)
      expect(result.joueursNonAssignes).toHaveLength(2)
    })
  })

  describe('Genres extrêmes', () => {

    it('devrait gérer 100% hommes avec mixité obligatoire', () => {
      const joueurs = Array.from({ length: 9 }, (_, i) =>
        createJoueur(`h${i}`, `Homme ${i}`, 'H')
      )
      const rules = createRules({
        format: 'triplette',
        mode: 'melee',
        mixite: {
          enabled: true,
          jamaisTroisMemeGenre: true,
          equilibreMatchsHF: true,
          prioriteMixite: true
        }
      })

      const result = ClubTirageService.tirage(joueurs, rules)

      // Devrait former des équipes mais avec warnings
      expect(result.equipes.length).toBeGreaterThan(0)
      // Chaque équipe sera 3H (impossible d'éviter)
      result.equipes.forEach(eq => {
        expect(eq.compositionGenre).toBe('3H')
      })
    })

    it('devrait gérer 100% femmes avec mixité obligatoire', () => {
      const joueurs = Array.from({ length: 6 }, (_, i) =>
        createJoueur(`f${i}`, `Femme ${i}`, 'F')
      )
      const rules = createRules({
        format: 'doublette',
        mode: 'melee',
        mixite: {
          enabled: true,
          jamaisTroisMemeGenre: true,
          equilibreMatchsHF: true,
          prioriteMixite: true
        }
      })

      const result = ClubTirageService.tirage(joueurs, rules)

      // 6 femmes = 3 doublettes 2F
      expect(result.equipes).toHaveLength(3)
      result.equipes.forEach(eq => {
        expect(eq.compositionGenre).toBe('2F')
      })
    })

    it('devrait gérer 1H et 99F', () => {
      const joueurs: ClubJoueur[] = [
        createJoueur('h1', 'Seul Homme', 'H'),
        ...Array.from({ length: 99 }, (_, i) =>
          createJoueur(`f${i}`, `Femme ${i}`, 'F')
        )
      ]
      const rules = createRules({
        format: 'doublette',
        mode: 'melee',
        mixite: { enabled: true, prioriteMixite: true, jamaisTroisMemeGenre: false, equilibreMatchsHF: false }
      })

      const result = ClubTirageService.tirage(joueurs, rules)

      // Avec priorité mixité, l'homme sera en équipe mixte (1H1F)
      // 1 équipe mixte + 49 équipes 2F = 50 équipes
      const equipeMixte = result.equipes.find(eq => eq.compositionGenre === '1H1F')
      expect(equipeMixte).toBeDefined()
    })
  })

  describe('Noms spéciaux', () => {

    it('devrait gérer des noms très longs', () => {
      const longName = 'A'.repeat(500)
      const joueurs = [
        createJoueur('1', longName, 'H'),
        createJoueur('2', 'Normal', 'F')
      ]
      const rules = createRules({ format: 'doublette', mode: 'melee' })

      const result = ClubTirageService.tirage(joueurs, rules)

      expect(result.equipes).toHaveLength(1)
    })

    it('devrait gérer des noms avec caractères spéciaux', () => {
      const joueurs = [
        createJoueur('1', 'José García', 'H'),
        createJoueur('2', "O'Brien", 'H'),
        createJoueur('3', 'Müller-Schmidt', 'F'),
        createJoueur('4', '日本語', 'F'),
        createJoueur('5', '  Espaces  ', 'H'),
        createJoueur('6', 'Normal', 'F')
      ]
      const rules = createRules({ format: 'doublette', mode: 'melee' })

      const result = ClubTirageService.tirage(joueurs, rules)

      expect(result.equipes).toHaveLength(3)
    })

    it('devrait gérer des noms vides', () => {
      const joueurs = [
        createJoueur('1', '', 'H'),
        createJoueur('2', '   ', 'F')
      ]
      const rules = createRules({ format: 'doublette', mode: 'melee' })

      // Ne devrait pas crash
      const result = ClubTirageService.tirage(joueurs, rules)
      expect(result).toBeDefined()
    })
  })
})

// ============================================================================
// Tests Edge Cases - Classement
// ============================================================================

describe('Edge Cases - Classement', () => {

  describe('Scores extrêmes', () => {

    it('devrait gérer un score 0-0', () => {
      const score = ClubClassementService.creerPartieScore(1, 0, 0, 13)

      expect(score.difference).toBe(0)
      expect(score.victoire).toBe(false)
    })

    it('devrait gérer un score 13-0 (victoire parfaite)', () => {
      const score = ClubClassementService.creerPartieScore(1, 13, 0, 13)

      expect(score.difference).toBe(13)
      expect(score.victoire).toBe(true)
    })

    it('devrait gérer un score 0-13 (défaite parfaite)', () => {
      const score = ClubClassementService.creerPartieScore(1, 0, 13, 13)

      expect(score.difference).toBe(-13)
      expect(score.victoire).toBe(false)
    })

    it('devrait gérer des scores négatifs (cas invalide)', () => {
      // Le service devrait calculer sans crash même avec des valeurs invalides
      const score = ClubClassementService.creerPartieScore(1, -5, 10, 13)

      expect(score.difference).toBe(-15)
      expect(score.victoire).toBe(false)
    })

    it('devrait gérer des scores très élevés', () => {
      const score = ClubClassementService.creerPartieScore(1, 1000, 500, 13)

      expect(score.difference).toBe(500)
      expect(score.victoire).toBe(true)
    })
  })

  describe('Classement avec 0 ou 1 entrée', () => {

    it('devrait gérer 0 entrées', () => {
      const rules = createRules()
      const classement = ClubClassementService.calculerClassement(
        [],
        new Map(),
        rules
      )

      expect(classement.entries).toHaveLength(0)
    })

    it('devrait gérer 1 seule entrée', () => {
      const entries = [{ joueurId: 'solo', nom: 'Solo', parties: [] }]
      const parties = new Map<string, ClubPartieScore[]>()
      parties.set('solo', [
        { partieNum: 1, scoreEquipe: 13, scoreAdversaire: 5, difference: 8, victoire: true }
      ])

      const rules = createRules()
      const classement = ClubClassementService.calculerClassement(entries, parties, rules)

      expect(classement.entries).toHaveLength(1)
      expect(classement.entries[0].position).toBe(1)
    })
  })

  describe('Égalités multiples', () => {

    it('devrait gérer 10 joueurs avec exactement les mêmes stats', () => {
      const entries = Array.from({ length: 10 }, (_, i) => ({
        joueurId: `j${i}`,
        nom: `Joueur ${i}`,
        parties: []
      }))

      const parties = new Map<string, ClubPartieScore[]>()
      entries.forEach((e) => {
        parties.set(e.joueurId, [
          { partieNum: 1, scoreEquipe: 13, scoreAdversaire: 5, difference: 8, victoire: true }
        ])
      })

      const rules = createRules()
      const classement = ClubClassementService.calculerClassement(entries, parties, rules)
      const egalites = ClubClassementService.detecterEgalites(classement)

      expect(classement.entries).toHaveLength(10)
      // Tous sont égaux, donc 1 groupe d'égalité avec 10 joueurs
      expect(egalites.length).toBeGreaterThan(0)
    })
  })

  describe('Différences extrêmes', () => {

    it('devrait calculer correctement avec beaucoup de parties', () => {
      const entries = [{ joueurId: 'grinder', nom: 'Grinder', parties: [] }]
      const parties = new Map<string, ClubPartieScore[]>()

      // 100 parties
      const manyParties: ClubPartieScore[] = Array.from({ length: 100 }, (_, i) => ({
        partieNum: i + 1,
        scoreEquipe: i % 2 === 0 ? 13 : 5,
        scoreAdversaire: i % 2 === 0 ? 5 : 13,
        difference: i % 2 === 0 ? 8 : -8,
        victoire: i % 2 === 0
      }))
      parties.set('grinder', manyParties)

      const rules = createRules()
      const classement = ClubClassementService.calculerClassement(entries, parties, rules)

      // 50 victoires, 50 défaites, différence = 0
      expect(classement.entries[0].victoires).toBe(50)
      expect(classement.entries[0].defaites).toBe(50)
      expect(classement.entries[0].totalDifference).toBe(0)
    })
  })
})

// ============================================================================
// Tests Edge Cases - Validation règles
// ============================================================================

describe('Edge Cases - Validation règles', () => {

  describe('Noms de règles', () => {

    it('devrait rejeter un nom avec seulement des espaces', () => {
      const result = ClubRulesService.validateRules({ name: '     ' })
      expect(result.valid).toBe(false)
    })

    it('devrait rejeter un nom de exactement 101 caractères', () => {
      const result = ClubRulesService.validateRules({ name: 'A'.repeat(101) })
      expect(result.valid).toBe(false)
    })

    it('devrait accepter un nom de exactement 100 caractères', () => {
      const result = ClubRulesService.validateRules({ name: 'A'.repeat(100) })
      expect(result.errors.some(e => e.includes('100'))).toBe(false)
    })

    it('devrait gérer un nom avec caractères spéciaux', () => {
      const result = ClubRulesService.validateRules({
        name: 'Club Pétanque "Les Boules d\'Or" - Règlement 2024 <test>'
      })
      // Les caractères spéciaux sont OK pour le nom
      expect(result.errors.some(e => e.includes('nom'))).toBe(false)
    })
  })

  describe('Terrains', () => {

    it('devrait rejeter exactement 21 terrains', () => {
      const result = ClubRulesService.validateRules({
        name: 'Test',
        terrains: {
          noms: Array.from({ length: 21 }, (_, i) => `T${i + 1}`),
          attributionAuto: true
        }
      })
      expect(result.valid).toBe(false)
    })

    it('devrait accepter exactement 20 terrains', () => {
      const result = ClubRulesService.validateRules({
        name: 'Test',
        terrains: {
          noms: Array.from({ length: 20 }, (_, i) => `T${i + 1}`),
          attributionAuto: true
        }
      })
      expect(result.errors.some(e => e.includes('20'))).toBe(false)
    })

    it('devrait gérer des noms de terrains avec espaces', () => {
      const result = ClubRulesService.validateRules({
        name: 'Test',
        terrains: {
          noms: ['Terrain A', '  Terrain B  ', 'Terrain C'],
          attributionAuto: true
        }
      })
      // Les espaces dans les noms de terrains sont OK
      expect(result.errors.some(e => e.includes('terrain'))).toBe(false)
    })
  })

  describe('Export/Import JSON', () => {

    it('devrait exporter et importer correctement', () => {
      const original = ClubRulesService.createDefaultRules('user1', 'Test Export')
      const json = ClubRulesService.exportRulesToJSON(original)

      // Le JSON exporté ne devrait pas contenir les infos sensibles
      const parsed = JSON.parse(json)
      expect(parsed.userId).toBeUndefined()
      expect(parsed.id).toBeUndefined()

      // On ne peut pas vraiment tester importRulesFromJSON sans localStorage
      // mais on vérifie que l'export est valide
      expect(parsed.name).toBe('Test Export')
      expect(parsed.mode).toBeDefined()
      expect(parsed.format).toBeDefined()
    })

    it('devrait gérer un JSON malformé pour import', () => {
      const result = ClubRulesService.importRulesFromJSON('user1', 'not valid json {{{')
      expect(result).toBeNull()
    })

    it('devrait gérer un JSON valide mais incomplet', () => {
      const incompleteJson = JSON.stringify({ randomField: 'test' })
      const result = ClubRulesService.importRulesFromJSON('user1', incompleteJson)
      expect(result).toBeNull()
    })
  })
})

// ============================================================================
// Tests de performance
// ============================================================================

describe('Performance', () => {

  it('devrait tirer 1000 joueurs en moins de 1 seconde', () => {
    const joueurs: ClubJoueur[] = Array.from({ length: 1000 }, (_, i) =>
      createJoueur(`j${i}`, `Joueur ${i}`, i % 2 === 0 ? 'H' : 'F')
    )
    const rules = createRules({ format: 'doublette', mode: 'melee' })

    const start = performance.now()
    const result = ClubTirageService.tirage(joueurs, rules)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(1000)
    expect(result.equipes).toHaveLength(500)
  })

  it('devrait calculer le classement de 100 joueurs en moins de 100ms', () => {
    const entries = Array.from({ length: 100 }, (_, i) => ({
      joueurId: `j${i}`,
      nom: `Joueur ${i}`,
      parties: []
    }))

    const parties = new Map<string, ClubPartieScore[]>()
    entries.forEach((e, i) => {
      parties.set(e.joueurId, Array.from({ length: 10 }, (_, j) => ({
        partieNum: j + 1,
        scoreEquipe: 13,
        scoreAdversaire: i % 13, // Variance dans les scores
        difference: 13 - (i % 13),
        victoire: true
      })))
    })

    const rules = createRules()

    const start = performance.now()
    const classement = ClubClassementService.calculerClassement(entries, parties, rules)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(100)
    expect(classement.entries).toHaveLength(100)
  })
})
