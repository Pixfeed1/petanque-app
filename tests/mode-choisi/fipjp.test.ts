/**
 * Tests pour le calcul des points FIPJP et classements
 * Mode Choisi - Pétanque App
 *
 * Règles FIPJP:
 * - Victoire = 3 points
 * - Nul = 1 point (uniquement avec timeLimit)
 * - Défaite = 0 points
 *
 * Départage:
 * 1. Points FIPJP (victoires × 3 + nuls × 1)
 * 2. Différence de points (pointsFor - pointsAgainst)
 * 3. Confrontation directe
 * 4. Points marqués (pointsFor)
 */

import { describe, it, expect } from 'vitest'

// ============================================================================
// Fonctions utilitaires de calcul FIPJP (simulées depuis le code)
// ============================================================================

interface TeamResult {
  team: { id: string; name: string }
  victories: number
  draws: number
  points: number // victoires × 3 + nuls × 1
  difference: number
  pointsFor: number
  pointsAgainst: number
}

interface Match {
  equipe_a_id: string
  equipe_b_id: string
  score_a: number
  score_b: number
  status: string
}

function calculateTeamResults(teamId: string, matches: Match[]): TeamResult {
  let victories = 0, draws = 0, pointsFor = 0, pointsAgainst = 0

  matches.forEach(m => {
    if (m.status !== 'termine') return

    if (m.equipe_a_id === teamId) {
      if (m.score_a > m.score_b) victories++
      else if (m.score_a === m.score_b) draws++
      pointsFor += m.score_a
      pointsAgainst += m.score_b
    } else if (m.equipe_b_id === teamId) {
      if (m.score_b > m.score_a) victories++
      else if (m.score_b === m.score_a) draws++
      pointsFor += m.score_b
      pointsAgainst += m.score_a
    }
  })

  return {
    team: { id: teamId, name: `Team ${teamId}` },
    victories,
    draws,
    points: victories * 3 + draws,
    difference: pointsFor - pointsAgainst,
    pointsFor,
    pointsAgainst
  }
}

function sortByFIPJP(results: TeamResult[], matches: Match[]): TeamResult[] {
  return [...results].sort((a, b) => {
    // 1. Points FIPJP
    if (b.points !== a.points) return b.points - a.points

    // 2. Différence de points
    if (b.difference !== a.difference) return b.difference - a.difference

    // 3. Confrontation directe
    const directMatch = matches.find(m =>
      m.status === 'termine' &&
      ((m.equipe_a_id === a.team.id && m.equipe_b_id === b.team.id) ||
       (m.equipe_a_id === b.team.id && m.equipe_b_id === a.team.id))
    )
    if (directMatch) {
      const aWon = (directMatch.equipe_a_id === a.team.id && directMatch.score_a > directMatch.score_b) ||
                   (directMatch.equipe_b_id === a.team.id && directMatch.score_b > directMatch.score_a)
      if (aWon) return -1
      return 1
    }

    // 4. Points marqués
    return b.pointsFor - a.pointsFor
  })
}

// ============================================================================
// Tests
// ============================================================================

describe('Calcul Points FIPJP - Mode Choisi', () => {

  describe('calculateTeamResults', () => {

    it('devrait calculer correctement 2 victoires', () => {
      const matches: Match[] = [
        { equipe_a_id: '1', equipe_b_id: '2', score_a: 13, score_b: 8, status: 'termine' },
        { equipe_a_id: '1', equipe_b_id: '3', score_a: 13, score_b: 5, status: 'termine' }
      ]

      const result = calculateTeamResults('1', matches)

      expect(result.victories).toBe(2)
      expect(result.draws).toBe(0)
      expect(result.points).toBe(6) // 2 × 3 = 6
      expect(result.pointsFor).toBe(26) // 13 + 13
      expect(result.pointsAgainst).toBe(13) // 8 + 5
      expect(result.difference).toBe(13) // 26 - 13
    })

    it('devrait calculer correctement victoires + nuls + défaites', () => {
      const matches: Match[] = [
        { equipe_a_id: '1', equipe_b_id: '2', score_a: 13, score_b: 8, status: 'termine' },  // Victoire
        { equipe_a_id: '3', equipe_b_id: '1', score_a: 10, score_b: 10, status: 'termine' }, // Nul
        { equipe_a_id: '1', equipe_b_id: '4', score_a: 5, score_b: 13, status: 'termine' }   // Défaite
      ]

      const result = calculateTeamResults('1', matches)

      expect(result.victories).toBe(1)
      expect(result.draws).toBe(1)
      expect(result.points).toBe(4) // 1 × 3 + 1 × 1 = 4
    })

    it('devrait ignorer les matchs non terminés', () => {
      const matches: Match[] = [
        { equipe_a_id: '1', equipe_b_id: '2', score_a: 13, score_b: 8, status: 'termine' },
        { equipe_a_id: '1', equipe_b_id: '3', score_a: 0, score_b: 0, status: 'a_jouer' }
      ]

      const result = calculateTeamResults('1', matches)

      expect(result.victories).toBe(1)
      expect(result.points).toBe(3)
    })

    it('devrait calculer équipe B (position inversée)', () => {
      const matches: Match[] = [
        { equipe_a_id: '2', equipe_b_id: '1', score_a: 5, score_b: 13, status: 'termine' } // Team 1 gagne en position B
      ]

      const result = calculateTeamResults('1', matches)

      expect(result.victories).toBe(1)
      expect(result.pointsFor).toBe(13)
      expect(result.pointsAgainst).toBe(5)
    })
  })

  describe('sortByFIPJP', () => {

    it('devrait trier par points FIPJP (décroissant)', () => {
      const results: TeamResult[] = [
        { team: { id: '1', name: 'A' }, victories: 1, draws: 0, points: 3, difference: 5, pointsFor: 13, pointsAgainst: 8 },
        { team: { id: '2', name: 'B' }, victories: 2, draws: 0, points: 6, difference: 10, pointsFor: 26, pointsAgainst: 16 },
        { team: { id: '3', name: 'C' }, victories: 0, draws: 0, points: 0, difference: -15, pointsFor: 11, pointsAgainst: 26 }
      ]

      const sorted = sortByFIPJP(results, [])

      expect(sorted[0].team.name).toBe('B') // 6 points
      expect(sorted[1].team.name).toBe('A') // 3 points
      expect(sorted[2].team.name).toBe('C') // 0 points
    })

    it('devrait départager par différence si points égaux', () => {
      const results: TeamResult[] = [
        { team: { id: '1', name: 'A' }, victories: 1, draws: 0, points: 3, difference: 2, pointsFor: 15, pointsAgainst: 13 },
        { team: { id: '2', name: 'B' }, victories: 1, draws: 0, points: 3, difference: 8, pointsFor: 21, pointsAgainst: 13 }
      ]

      const sorted = sortByFIPJP(results, [])

      expect(sorted[0].team.name).toBe('B') // Même points, mais diff +8 > +2
      expect(sorted[1].team.name).toBe('A')
    })

    it('devrait départager par confrontation directe si points et diff égaux', () => {
      const matches: Match[] = [
        { equipe_a_id: '1', equipe_b_id: '2', score_a: 13, score_b: 10, status: 'termine' }
      ]

      const results: TeamResult[] = [
        { team: { id: '1', name: 'A' }, victories: 1, draws: 0, points: 3, difference: 5, pointsFor: 13, pointsAgainst: 8 },
        { team: { id: '2', name: 'B' }, victories: 1, draws: 0, points: 3, difference: 5, pointsFor: 13, pointsAgainst: 8 }
      ]

      const sorted = sortByFIPJP(results, matches)

      expect(sorted[0].team.name).toBe('A') // A a battu B en confrontation directe
      expect(sorted[1].team.name).toBe('B')
    })

    it('devrait départager par points marqués en dernier recours', () => {
      const results: TeamResult[] = [
        { team: { id: '1', name: 'A' }, victories: 1, draws: 0, points: 3, difference: 5, pointsFor: 13, pointsAgainst: 8 },
        { team: { id: '2', name: 'B' }, victories: 1, draws: 0, points: 3, difference: 5, pointsFor: 18, pointsAgainst: 13 }
      ]

      const sorted = sortByFIPJP(results, [])

      expect(sorted[0].team.name).toBe('B') // 18 points marqués > 13
      expect(sorted[1].team.name).toBe('A')
    })
  })

  describe('Scénarios de poule complets', () => {

    it('devrait classer correctement une poule de 4 équipes', () => {
      // Poule A: 4 équipes, round-robin (6 matchs)
      const matches: Match[] = [
        // Tour 1
        { equipe_a_id: '1', equipe_b_id: '2', score_a: 13, score_b: 8, status: 'termine' },  // 1 bat 2
        { equipe_a_id: '3', equipe_b_id: '4', score_a: 13, score_b: 11, status: 'termine' }, // 3 bat 4

        // Tour 2
        { equipe_a_id: '1', equipe_b_id: '3', score_a: 10, score_b: 13, status: 'termine' }, // 3 bat 1
        { equipe_a_id: '2', equipe_b_id: '4', score_a: 13, score_b: 6, status: 'termine' },  // 2 bat 4

        // Tour 3
        { equipe_a_id: '1', equipe_b_id: '4', score_a: 13, score_b: 5, status: 'termine' },  // 1 bat 4
        { equipe_a_id: '2', equipe_b_id: '3', score_a: 8, score_b: 13, status: 'termine' }   // 3 bat 2
      ]

      // Calcul des résultats
      const results = ['1', '2', '3', '4'].map(id => calculateTeamResults(id, matches))
      const sorted = sortByFIPJP(results, matches)

      // Team 3: 3 victoires = 9 points (1er)
      // Team 1: 2 victoires = 6 points (2ème)
      // Team 2: 1 victoire = 3 points (3ème)
      // Team 4: 0 victoires = 0 points (4ème)

      expect(sorted[0].team.id).toBe('3')
      expect(sorted[0].points).toBe(9)

      expect(sorted[1].team.id).toBe('1')
      expect(sorted[1].points).toBe(6)

      expect(sorted[2].team.id).toBe('2')
      expect(sorted[2].points).toBe(3)

      expect(sorted[3].team.id).toBe('4')
      expect(sorted[3].points).toBe(0)
    })

    it('devrait gérer les nuls en mode timeLimit', () => {
      const matches: Match[] = [
        { equipe_a_id: '1', equipe_b_id: '2', score_a: 10, score_b: 10, status: 'termine' }, // Nul
        { equipe_a_id: '1', equipe_b_id: '3', score_a: 13, score_b: 8, status: 'termine' },  // 1 gagne
        { equipe_a_id: '2', equipe_b_id: '3', score_a: 13, score_b: 5, status: 'termine' }   // 2 gagne
      ]

      const results = ['1', '2', '3'].map(id => calculateTeamResults(id, matches))
      const sorted = sortByFIPJP(results, matches)

      // Team 1: 1V + 1N = 3 + 1 = 4 points
      // Team 2: 1V + 1N = 3 + 1 = 4 points
      // Team 3: 0V + 0N = 0 points

      expect(sorted[0].points).toBe(4)
      expect(sorted[1].points).toBe(4)
      expect(sorted[2].points).toBe(0)

      // Départage par confrontation directe (1 vs 2 = nul)
      // Puis par différence ou points marqués
    })
  })
})
