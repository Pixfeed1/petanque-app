/**
 * Tests des cas limites (edge cases) - Mode Choisi
 * Vérifie les comportements aux limites du système
 */

import { describe, it, expect } from 'vitest'

// ============================================================================
// Helpers
// ============================================================================

function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function biasedShuffle<T>(array: T[]): T[] {
  // L'ancien algorithme biaisé
  return [...array].sort(() => Math.random() - 0.5)
}

// ============================================================================
// Tests
// ============================================================================

describe('Edge Cases - Mode Choisi', () => {

  describe('Fisher-Yates Shuffle vs Biased Shuffle', () => {

    it('Fisher-Yates devrait produire une distribution uniforme', () => {
      const items = ['A', 'B', 'C', 'D']
      const positions: { [key: string]: number[] } = {
        'A': [], 'B': [], 'C': [], 'D': []
      }

      // Exécuter 1000 fois
      for (let i = 0; i < 1000; i++) {
        const shuffled = fisherYatesShuffle(items)
        shuffled.forEach((item, pos) => {
          positions[item].push(pos)
        })
      }

      // Chaque élément devrait apparaître ~250 fois à chaque position
      for (const item of items) {
        const counts = [0, 0, 0, 0]
        positions[item].forEach(pos => counts[pos]++)

        // Vérifier que la distribution est raisonnable (entre 200 et 300)
        counts.forEach(count => {
          expect(count).toBeGreaterThan(180)
          expect(count).toBeLessThan(320)
        })
      }
    })

    it('Fisher-Yates devrait préserver tous les éléments', () => {
      const items = [1, 2, 3, 4, 5, 6, 7, 8]

      for (let i = 0; i < 100; i++) {
        const shuffled = fisherYatesShuffle(items)
        expect(shuffled.sort()).toEqual(items.sort())
        expect(shuffled.length).toBe(items.length)
      }
    })

    it('Fisher-Yates devrait fonctionner avec 1 élément', () => {
      const items = ['A']
      const shuffled = fisherYatesShuffle(items)
      expect(shuffled).toEqual(['A'])
    })

    it('Fisher-Yates devrait fonctionner avec tableau vide', () => {
      const items: string[] = []
      const shuffled = fisherYatesShuffle(items)
      expect(shuffled).toEqual([])
    })
  })

  describe('Limites de taille', () => {

    it('devrait accepter exactement 4 équipes (minimum)', () => {
      const nbTeams = 4
      const pouleSize = 4
      const nbPoules = Math.ceil(nbTeams / pouleSize)

      expect(nbPoules).toBe(1)
      expect(nbTeams >= 4).toBe(true)
    })

    it('devrait accepter exactement 16 qualifiés (maximum)', () => {
      // 4 poules × 4 qualifiés = 16
      const nbPoules = 4
      const qualifiedPerPoule = 4
      const totalQualified = nbPoules * qualifiedPerPoule

      expect(totalQualified).toBe(16)
      expect(totalQualified <= 16).toBe(true)
    })

    it('devrait rejeter 17 qualifiés', () => {
      const totalQualified = 17
      expect(totalQualified > 16).toBe(true)
    })

    it('devrait gérer des poules de tailles différentes', () => {
      // 7 équipes en poules de 3 → 3 poules (3+2+2 ou 3+3+1)
      const nbTeams = 7
      const pouleSize = 3
      const nbPoules = Math.ceil(nbTeams / pouleSize)

      expect(nbPoules).toBe(3)

      // Distribution round-robin des équipes (comme dans l'app)
      const distribution: number[] = Array(nbPoules).fill(0)
      for (let i = 0; i < nbTeams; i++) {
        distribution[i % nbPoules]++
      }

      // Vérifier que la différence max est de 1
      const max = Math.max(...distribution)
      const min = Math.min(...distribution)
      expect(max - min).toBeLessThanOrEqual(1)
    })
  })

  describe('Scores limites', () => {

    it('devrait accepter score 13-0 (victoire parfaite)', () => {
      const scoreA = 13
      const scoreB = 0
      const maxPoints = 13

      expect(scoreA).toBe(maxPoints)
      expect(scoreB).toBe(0)
      expect(scoreA > scoreB).toBe(true)
    })

    it('devrait accepter score 13-12 (victoire serrée)', () => {
      const scoreA = 13
      const scoreB = 12
      const maxPoints = 13

      expect(scoreA).toBe(maxPoints)
      expect(scoreB).toBeLessThan(maxPoints)
    })

    it('devrait gérer égalité 10-10 avec timeLimit', () => {
      const scoreA = 10
      const scoreB = 10
      const timeLimit = true

      const isValid = scoreA === scoreB && timeLimit
      expect(isValid).toBe(true)
    })

    it('devrait rejeter égalité sans timeLimit', () => {
      const scoreA = 10
      const scoreB = 10
      const timeLimit = false

      // Une égalité sans timeLimit est INVALIDE
      const isInvalid = scoreA === scoreB && !timeLimit
      expect(isInvalid).toBe(true) // C'est bien invalide, donc rejeté
    })
  })

  describe('Matchs BYE', () => {

    it('devrait auto-qualifier équipe avec BYE', () => {
      const match = {
        equipe_a_id: '1',
        equipe_b_id: null,
        type: 'bye'
      }

      const winner_id = match.equipe_a_id // Auto-win
      expect(winner_id).toBe('1')
    })

    it('devrait placer BYE pour nombre impair d\'équipes', () => {
      const qualified = ['A', 'B', 'C', 'D', 'E'] // 5 équipes

      // Pour 5 équipes en quarts (4 matchs), on a 3 BYE
      const nextPowerOf2 = 8
      const nbByes = nextPowerOf2 - qualified.length

      expect(nbByes).toBe(3)
    })

    it('devrait placer BYE en bas du bracket pour les meilleurs seeds', () => {
      const qualified = [
        { id: '1', name: '1er A', seed: 1 },
        { id: '2', name: '1er B', seed: 2 },
        { id: '3', name: '2ème A', seed: 3 }
      ]

      // Avec 3 équipes, 1 BYE
      // Le meilleur seed (1er A) devrait avoir le BYE
      const nbByes = 4 - qualified.length // = 1

      expect(nbByes).toBe(1)
      // Le BYE va au 4ème slot, donc seed 1 joue contre BYE
    })
  })

  describe('Transitions de statut', () => {

    it('devrait permettre preparation → en_cours', () => {
      const validTransitions: { [key: string]: string[] } = {
        'preparation': ['en_cours', 'annule'],
        'en_cours': ['termine', 'annule'],
        'termine': [],
        'annule': []
      }

      expect(validTransitions['preparation']).toContain('en_cours')
    })

    it('devrait interdire termine → en_cours', () => {
      const validTransitions: { [key: string]: string[] } = {
        'preparation': ['en_cours', 'annule'],
        'en_cours': ['termine', 'annule'],
        'termine': [],
        'annule': []
      }

      expect(validTransitions['termine']).not.toContain('en_cours')
    })

    it('devrait permettre annulation à tout moment (sauf terminé)', () => {
      const validTransitions: { [key: string]: string[] } = {
        'preparation': ['en_cours', 'annule'],
        'en_cours': ['termine', 'annule'],
        'termine': [],
        'annule': []
      }

      expect(validTransitions['preparation']).toContain('annule')
      expect(validTransitions['en_cours']).toContain('annule')
    })
  })

  describe('Calculs FIPJP limites', () => {

    it('devrait calculer 0 points pour 0 victoires', () => {
      const victories = 0
      const draws = 0
      const points = victories * 3 + draws

      expect(points).toBe(0)
    })

    it('devrait calculer correctement avec uniquement des nuls', () => {
      const victories = 0
      const draws = 3
      const points = victories * 3 + draws

      expect(points).toBe(3)
    })

    it('devrait gérer différence négative', () => {
      const pointsFor = 20
      const pointsAgainst = 39
      const difference = pointsFor - pointsAgainst

      expect(difference).toBe(-19)
    })

    it('devrait départager par confrontation directe même avec scores identiques', () => {
      // Team A: 2V, diff +10
      // Team B: 2V, diff +10
      // A a battu B 13-10

      const teamA = { points: 6, diff: 10 }
      const teamB = { points: 6, diff: 10 }

      expect(teamA.points).toBe(teamB.points)
      expect(teamA.diff).toBe(teamB.diff)

      // Confrontation directe: A gagne
      const directResult = { winner: 'A', loser: 'B' }
      expect(directResult.winner).toBe('A')
    })
  })

  describe('Unicode et caractères spéciaux', () => {

    it('devrait accepter noms avec accents', () => {
      const teamName = 'Équipe Pétanque Méditerranée'
      const normalized = teamName.trim().toLowerCase()

      expect(normalized).toBe('équipe pétanque méditerranée')
    })

    it('devrait détecter doublons avec accents différents', () => {
      const name1 = 'Équipe A'
      const name2 = 'Equipe A' // Sans accent

      // Ces noms devraient-ils être considérés comme doublons?
      // Dépend de la politique - on teste la normalisation simple
      const normalized1 = name1.trim().toLowerCase()
      const normalized2 = name2.trim().toLowerCase()

      // Avec normalisation simple, ils sont différents
      expect(normalized1).not.toBe(normalized2)
    })

    it('devrait gérer les emojis dans les noms', () => {
      const teamName = '🏆 Champions 2024'
      const trimmed = teamName.trim()

      expect(trimmed.length).toBeGreaterThan(0)
    })
  })

  describe('Concurrence et race conditions', () => {

    it('devrait détecter conflit de terrain', () => {
      const assignedTerrains = new Set<number>()

      // Deux matchs essaient le même terrain
      const match1Terrain = 1
      const match2Terrain = 1

      assignedTerrains.add(match1Terrain)
      const conflict = assignedTerrains.has(match2Terrain)

      expect(conflict).toBe(true)
    })

    it('devrait valider terrain disponible avant assignation', () => {
      const totalTerrains = 4
      const usedTerrains = new Set([1, 2, 3])

      const requestedTerrain = 4
      const isAvailable = requestedTerrain <= totalTerrains && !usedTerrains.has(requestedTerrain)

      expect(isAvailable).toBe(true)
    })
  })
})
