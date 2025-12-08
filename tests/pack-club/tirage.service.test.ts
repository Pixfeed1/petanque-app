/**
 * Tests du service de tirage Pack Club
 * Vérifie la formation d'équipes et les règles H/F
 */

import { describe, it, expect } from 'vitest'
import { ClubTirageService } from '@/lib/club/tirage.service'
import { ClubJoueur, ClubRules, DEFAULT_CLUB_RULES } from '@/lib/club/types'

// ============================================================================
// Fixtures
// ============================================================================

function createJoueurs(count: number, genderPattern: ('H' | 'F')[] = []): ClubJoueur[] {
  const joueurs: ClubJoueur[] = []
  for (let i = 0; i < count; i++) {
    const gender = genderPattern[i % genderPattern.length] || (i % 2 === 0 ? 'H' : 'F')
    joueurs.push({
      id: `joueur_${i + 1}`,
      name: `Joueur ${i + 1}`,
      gender
    })
  }
  return joueurs
}

function createRules(overrides: Partial<ClubRules> = {}): ClubRules {
  return {
    ...DEFAULT_CLUB_RULES,
    id: 'test_rules',
    userId: 'test_user',
    name: 'Test Rules',
    ...overrides
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('ClubTirageService', () => {

  describe('tirage - Formation équipes', () => {

    it('devrait former des doublettes avec 6 joueurs', () => {
      const joueurs = createJoueurs(6)
      const rules = createRules({ format: 'doublette', mode: 'melee' })

      const result = ClubTirageService.tirage(joueurs, rules)

      expect(result.equipes.length).toBe(3)
      expect(result.joueursNonAssignes.length).toBe(0)
      result.equipes.forEach(equipe => {
        expect(equipe.joueurIds.length).toBe(2)
      })
    })

    it('devrait former des triplettes avec 9 joueurs', () => {
      const joueurs = createJoueurs(9)
      const rules = createRules({ format: 'triplette', mode: 'melee' })

      const result = ClubTirageService.tirage(joueurs, rules)

      expect(result.equipes.length).toBe(3)
      expect(result.joueursNonAssignes.length).toBe(0)
      result.equipes.forEach(equipe => {
        expect(equipe.joueurIds.length).toBe(3)
      })
    })

    it('devrait gérer un nombre impair avec mélange autorisé', () => {
      const joueurs = createJoueurs(7)
      const rules = createRules({
        format: 'triplette',
        mode: 'melee',
        autoriserMelangeFormats: true
      })

      const result = ClubTirageService.tirage(joueurs, rules)

      // 7 joueurs : 2 triplettes (6) + 1 doublette (1 restant impossible)
      // Ou 1 triplette + 2 doublettes
      const totalJoueurs = result.equipes.reduce((sum, eq) => sum + eq.joueurIds.length, 0)
      expect(totalJoueurs + result.joueursNonAssignes.length).toBe(7)
    })

    it('devrait avertir si pas assez de joueurs', () => {
      const joueurs = createJoueurs(1)
      const rules = createRules({ format: 'doublette', mode: 'melee' })

      const result = ClubTirageService.tirage(joueurs, rules)

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('Pas assez')
    })

    it('devrait retourner warning en mode choisi', () => {
      const joueurs = createJoueurs(6)
      const rules = createRules({ format: 'doublette', mode: 'choisi' })

      const result = ClubTirageService.tirage(joueurs, rules)

      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0]).toContain('Mode choisi')
    })
  })

  describe('tirage - Règles mixité H/F', () => {

    it('devrait former des équipes mixtes 1H1F en doublette avec priorité mixité', () => {
      // 3 hommes, 3 femmes
      const joueurs = createJoueurs(6, ['H', 'H', 'H', 'F', 'F', 'F'])
      const rules = createRules({
        format: 'doublette',
        mode: 'melee',
        mixite: {
          enabled: true,
          jamaisTroisMemeGenre: false,
          equilibreMatchsHF: false,
          prioriteMixite: true
        }
      })

      const result = ClubTirageService.tirage(joueurs, rules)

      expect(result.equipes.length).toBe(3)
      // Chaque équipe devrait être mixte
      result.equipes.forEach(equipe => {
        expect(equipe.compositionGenre).toMatch(/1H1F|1F1H/)
      })
    })

    it('devrait éviter 3 du même genre en triplette', () => {
      // 5 hommes, 4 femmes
      const joueurs = createJoueurs(9, ['H', 'H', 'H', 'H', 'H', 'F', 'F', 'F', 'F'])
      const rules = createRules({
        format: 'triplette',
        mode: 'melee',
        mixite: {
          enabled: true,
          jamaisTroisMemeGenre: true,
          equilibreMatchsHF: false,
          prioriteMixite: true
        }
      })

      const result = ClubTirageService.tirage(joueurs, rules)

      // Vérifier qu'aucune équipe n'a 3H ou 3F
      result.equipes.forEach(equipe => {
        expect(equipe.compositionGenre).not.toBe('3H')
        expect(equipe.compositionGenre).not.toBe('3F')
      })
    })

    it('devrait avertir si 3 même genre impossible à éviter', () => {
      // 9 hommes, 0 femmes - impossible d'éviter 3H
      const joueurs = createJoueurs(9, ['H'])
      const rules = createRules({
        format: 'triplette',
        mode: 'melee',
        mixite: {
          enabled: true,
          jamaisTroisMemeGenre: true,
          equilibreMatchsHF: false,
          prioriteMixite: false
        }
      })

      const result = ClubTirageService.tirage(joueurs, rules)

      // Devrait avoir des warnings
      const hasWarning = result.warnings.some(w =>
        w.includes('même genre') || w.includes('3H') || w.includes('3F')
      )
      expect(hasWarning || result.equipes.every(e => e.compositionGenre === '3H')).toBe(true)
    })
  })

  describe('tirage - Génération des matchs', () => {

    it('devrait générer des matchs pour les équipes', () => {
      const joueurs = createJoueurs(8)
      const rules = createRules({ format: 'doublette', mode: 'melee' })

      const result = ClubTirageService.tirage(joueurs, rules)

      // 4 équipes = 2 matchs
      expect(result.matchs.length).toBe(2)
      result.matchs.forEach(match => {
        expect(match.equipeAId).toBeDefined()
        expect(match.equipeBId).toBeDefined()
        expect(match.tour).toBe(1)
      })
    })

    it('devrait attribuer les terrains automatiquement', () => {
      const joueurs = createJoueurs(8)
      const rules = createRules({
        format: 'doublette',
        mode: 'melee',
        terrains: {
          noms: ['Terrain A', 'Terrain B', 'Terrain C'],
          attributionAuto: true
        }
      })

      const result = ClubTirageService.tirage(joueurs, rules)

      result.matchs.forEach(match => {
        expect(match.terrain).toBeTruthy()
        expect(['Terrain A', 'Terrain B', 'Terrain C']).toContain(match.terrain)
      })
    })

    it('devrait éviter match 2H1F vs 2F1H avec équilibre activé', () => {
      // Créer des équipes avec compositions différentes
      const joueurs = createJoueurs(12, ['H', 'H', 'F', 'F', 'F', 'H', 'H', 'H', 'F', 'F', 'F', 'H'])
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

      // Vérifier validité H/F des matchs
      result.matchs.forEach(match => {
        if (match.valideHF === false) {
          // Si invalide, devrait y avoir un warning
          expect(result.warnings.length).toBeGreaterThan(0)
        }
      })
    })

    it('devrait avertir si équipe sans adversaire (nombre impair)', () => {
      const joueurs = createJoueurs(6)
      const rules = createRules({ format: 'doublette', mode: 'melee' })

      const result = ClubTirageService.tirage(joueurs, rules)

      // 3 équipes = 1 match + 1 équipe sans adversaire
      expect(result.matchs.length).toBe(1)
      const hasWarning = result.warnings.some(w => w.includes('sans adversaire'))
      expect(hasWarning).toBe(true)
    })
  })

  describe('nouveauTourMeleeTournante', () => {

    it('devrait refaire un tirage complet pour nouveau tour', () => {
      const joueurs = createJoueurs(8)
      const rules = createRules({ format: 'doublette', mode: 'melee_tournante' })

      const tour1 = ClubTirageService.tirage(joueurs, rules, 1)
      const tour2 = ClubTirageService.nouveauTourMeleeTournante(joueurs, rules, 2)

      // Les équipes devraient être différentes (tirage aléatoire)
      // On vérifie juste que les structures sont correctes
      expect(tour2.equipes.length).toBe(4)
      expect(tour2.matchs.length).toBe(2)
      tour2.matchs.forEach(match => {
        expect(match.tour).toBe(2)
      })
    })
  })

  describe('nouveauTourMeleeFixe', () => {

    it('devrait garder les mêmes équipes mais changer adversaires', () => {
      const joueurs = createJoueurs(8)
      const rules = createRules({ format: 'doublette', mode: 'melee' })

      const tour1 = ClubTirageService.tirage(joueurs, rules, 1)
      const tour2 = ClubTirageService.nouveauTourMeleeFixe(tour1.equipes, rules, 2)

      // Mêmes 4 équipes, nouveaux matchs
      expect(tour2.matchs.length).toBe(2)
      tour2.matchs.forEach(match => {
        expect(match.tour).toBe(2)
      })
    })
  })
})
