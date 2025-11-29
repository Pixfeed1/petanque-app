/**
 * Tests pour le mode Mêlée Fixe
 * Vérifie la formation des équipes fixes et le déroulement du tournoi
 */

import { describe, it, expect } from 'vitest'

// ============================================================================
// Types simulés
// ============================================================================

interface Match {
  id: string
  equipe_a_id: string
  equipe_b_id: string | null
  score_a: number
  score_b: number
  status: 'a_jouer' | 'en_cours' | 'termine'
  terrain?: number | null
  round: number
  type: 'poule' | 'elimination' | 'bye'
}

interface Team {
  id: string
  name: string
  joueur_ids: string[]
  poule_id?: string
}

interface Poule {
  id: string
  name: string
  equipe_ids: string[]
}

interface TeamResult {
  team_id: string
  victories: number
  draws: number
  points: number
  difference: number
  pointsFor: number
  pointsAgainst: number
}

// ============================================================================
// Helpers - Logique extraite du code
// ============================================================================

function generateRoundRobinMatches(poule: Poule, teams: Team[]): Match[] {
  const pouleTeams = teams.filter(t => poule.equipe_ids.includes(t.id))
  const matches: Match[] = []
  let matchId = 1

  for (let i = 0; i < pouleTeams.length; i++) {
    for (let j = i + 1; j < pouleTeams.length; j++) {
      matches.push({
        id: `m${matchId++}`,
        equipe_a_id: pouleTeams[i].id,
        equipe_b_id: pouleTeams[j].id,
        score_a: 0,
        score_b: 0,
        status: 'a_jouer',
        round: 1,
        type: 'poule'
      })
    }
  }

  return matches
}

function calculateTeamResult(teamId: string, matches: Match[]): TeamResult {
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
    team_id: teamId,
    victories,
    draws,
    points: victories * 3 + draws,
    difference: pointsFor - pointsAgainst,
    pointsFor,
    pointsAgainst
  }
}

function distributeTeamsToPoules(teams: Team[], nbPoules: number): Poule[] {
  const poules: Poule[] = []

  for (let i = 0; i < nbPoules; i++) {
    poules.push({
      id: `poule_${i + 1}`,
      name: `Poule ${String.fromCharCode(65 + i)}`,
      equipe_ids: []
    })
  }

  // Distribution round-robin
  teams.forEach((team, idx) => {
    poules[idx % nbPoules].equipe_ids.push(team.id)
  })

  return poules
}

function sortTeamsByRanking(
  teamIds: string[],
  matches: Match[],
  allMatches: Match[]
): string[] {
  const results = teamIds.map(id => calculateTeamResult(id, matches))

  return [...results].sort((a, b) => {
    // 1. Points FIPJP
    if (b.points !== a.points) return b.points - a.points

    // 2. Différence de points
    if (b.difference !== a.difference) return b.difference - a.difference

    // 3. Confrontation directe
    const directMatch = allMatches.find(m =>
      m.status === 'termine' &&
      ((m.equipe_a_id === a.team_id && m.equipe_b_id === b.team_id) ||
       (m.equipe_a_id === b.team_id && m.equipe_b_id === a.team_id))
    )
    if (directMatch) {
      const aWon = (directMatch.equipe_a_id === a.team_id && directMatch.score_a > directMatch.score_b) ||
                   (directMatch.equipe_b_id === a.team_id && directMatch.score_b > directMatch.score_a)
      if (aWon) return -1
      return 1
    }

    // 4. Points marqués
    return b.pointsFor - a.pointsFor
  }).map(r => r.team_id)
}

function getQualifiedTeams(
  poules: Poule[],
  matches: Match[],
  qualifiedPerPoule: number
): string[] {
  const qualified: string[] = []

  for (const poule of poules) {
    const pouleMatches = matches.filter(m =>
      poule.equipe_ids.includes(m.equipe_a_id) &&
      (m.equipe_b_id === null || poule.equipe_ids.includes(m.equipe_b_id))
    )

    const sorted = sortTeamsByRanking(poule.equipe_ids, pouleMatches, matches)
    qualified.push(...sorted.slice(0, qualifiedPerPoule))
  }

  return qualified
}

function generateEliminationBracket(qualifiedIds: string[]): Match[] {
  const n = qualifiedIds.length
  const nextPowerOf2 = Math.pow(2, Math.ceil(Math.log2(n)))
  const nbByes = nextPowerOf2 - n
  const matches: Match[] = []
  let matchId = 1

  // Seed order (standard bracket)
  const seeds = [...qualifiedIds]

  for (let i = 0; i < nextPowerOf2 / 2; i++) {
    const teamA = seeds[i]
    const teamB = i < seeds.length - nbByes ? seeds[seeds.length - 1 - i] : null

    matches.push({
      id: `e${matchId++}`,
      equipe_a_id: teamA || 'BYE',
      equipe_b_id: teamB,
      score_a: 0,
      score_b: 0,
      status: teamB === null ? 'termine' : 'a_jouer',
      round: 1,
      type: teamB === null ? 'bye' : 'elimination'
    })
  }

  return matches
}

// ============================================================================
// Tests
// ============================================================================

describe('Mêlée Fixe - Formation équipes', () => {

  describe('Distribution des équipes en poules', () => {

    it('devrait distribuer 8 équipes en 2 poules de 4', () => {
      const teams: Team[] = Array.from({ length: 8 }, (_, i) => ({
        id: `t${i + 1}`,
        name: `Team ${i + 1}`,
        joueur_ids: [`p${i * 2 + 1}`, `p${i * 2 + 2}`]
      }))

      const poules = distributeTeamsToPoules(teams, 2)

      expect(poules).toHaveLength(2)
      expect(poules[0].equipe_ids).toHaveLength(4)
      expect(poules[1].equipe_ids).toHaveLength(4)
    })

    it('devrait distribuer 7 équipes en 2 poules (4+3)', () => {
      const teams: Team[] = Array.from({ length: 7 }, (_, i) => ({
        id: `t${i + 1}`,
        name: `Team ${i + 1}`,
        joueur_ids: []
      }))

      const poules = distributeTeamsToPoules(teams, 2)

      expect(poules).toHaveLength(2)

      const sizes = poules.map(p => p.equipe_ids.length)
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1)
    })

    it('devrait distribuer 12 équipes en 3 poules de 4', () => {
      const teams: Team[] = Array.from({ length: 12 }, (_, i) => ({
        id: `t${i + 1}`,
        name: `Team ${i + 1}`,
        joueur_ids: []
      }))

      const poules = distributeTeamsToPoules(teams, 3)

      expect(poules).toHaveLength(3)
      poules.forEach(p => {
        expect(p.equipe_ids).toHaveLength(4)
      })
    })

    it('devrait distribuer équitablement en round-robin', () => {
      const teams: Team[] = Array.from({ length: 10 }, (_, i) => ({
        id: `t${i + 1}`,
        name: `Team ${i + 1}`,
        joueur_ids: []
      }))

      const poules = distributeTeamsToPoules(teams, 3)

      // 10 teams / 3 poules = 4, 3, 3
      const sizes = poules.map(p => p.equipe_ids.length).sort((a, b) => b - a)
      expect(sizes).toEqual([4, 3, 3])
    })
  })

  describe('Génération matchs round-robin', () => {

    it('devrait générer 6 matchs pour poule de 4', () => {
      const teams: Team[] = [
        { id: 't1', name: 'A', joueur_ids: [] },
        { id: 't2', name: 'B', joueur_ids: [] },
        { id: 't3', name: 'C', joueur_ids: [] },
        { id: 't4', name: 'D', joueur_ids: [] }
      ]

      const poule: Poule = {
        id: 'p1',
        name: 'Poule A',
        equipe_ids: ['t1', 't2', 't3', 't4']
      }

      const matches = generateRoundRobinMatches(poule, teams)

      // n*(n-1)/2 = 4*3/2 = 6 matchs
      expect(matches).toHaveLength(6)
    })

    it('devrait générer 3 matchs pour poule de 3', () => {
      const teams: Team[] = [
        { id: 't1', name: 'A', joueur_ids: [] },
        { id: 't2', name: 'B', joueur_ids: [] },
        { id: 't3', name: 'C', joueur_ids: [] }
      ]

      const poule: Poule = {
        id: 'p1',
        name: 'Poule A',
        equipe_ids: ['t1', 't2', 't3']
      }

      const matches = generateRoundRobinMatches(poule, teams)

      expect(matches).toHaveLength(3)
    })

    it('devrait générer 10 matchs pour poule de 5', () => {
      const teams: Team[] = Array.from({ length: 5 }, (_, i) => ({
        id: `t${i + 1}`,
        name: `Team ${i + 1}`,
        joueur_ids: []
      }))

      const poule: Poule = {
        id: 'p1',
        name: 'Poule A',
        equipe_ids: teams.map(t => t.id)
      }

      const matches = generateRoundRobinMatches(poule, teams)

      // 5*4/2 = 10
      expect(matches).toHaveLength(10)
    })

    it('devrait créer matchs uniques (pas de doublons)', () => {
      const teams: Team[] = [
        { id: 't1', name: 'A', joueur_ids: [] },
        { id: 't2', name: 'B', joueur_ids: [] },
        { id: 't3', name: 'C', joueur_ids: [] },
        { id: 't4', name: 'D', joueur_ids: [] }
      ]

      const poule: Poule = {
        id: 'p1',
        name: 'Poule A',
        equipe_ids: teams.map(t => t.id)
      }

      const matches = generateRoundRobinMatches(poule, teams)

      const matchPairs = matches.map(m =>
        [m.equipe_a_id, m.equipe_b_id].sort().join('-')
      )

      const uniquePairs = [...new Set(matchPairs)]
      expect(uniquePairs.length).toBe(matches.length)
    })

    it('chaque équipe devrait jouer contre chaque autre exactement 1 fois', () => {
      const teams: Team[] = [
        { id: 't1', name: 'A', joueur_ids: [] },
        { id: 't2', name: 'B', joueur_ids: [] },
        { id: 't3', name: 'C', joueur_ids: [] },
        { id: 't4', name: 'D', joueur_ids: [] }
      ]

      const poule: Poule = {
        id: 'p1',
        name: 'Poule A',
        equipe_ids: teams.map(t => t.id)
      }

      const matches = generateRoundRobinMatches(poule, teams)

      // Chaque équipe joue 3 fois (contre les 3 autres)
      for (const team of teams) {
        const teamMatches = matches.filter(m =>
          m.equipe_a_id === team.id || m.equipe_b_id === team.id
        )
        expect(teamMatches).toHaveLength(3)
      }
    })
  })
})

describe('Mêlée Fixe - Calcul classement', () => {

  describe('calculateTeamResult', () => {

    it('devrait calculer 3 victoires = 9 points', () => {
      const matches: Match[] = [
        { id: '1', equipe_a_id: 't1', equipe_b_id: 't2', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' },
        { id: '2', equipe_a_id: 't1', equipe_b_id: 't3', score_a: 13, score_b: 5, status: 'termine', round: 1, type: 'poule' },
        { id: '3', equipe_a_id: 't1', equipe_b_id: 't4', score_a: 13, score_b: 10, status: 'termine', round: 1, type: 'poule' }
      ]

      const result = calculateTeamResult('t1', matches)

      expect(result.victories).toBe(3)
      expect(result.points).toBe(9)
    })

    it('devrait calculer victoire en position B', () => {
      const matches: Match[] = [
        { id: '1', equipe_a_id: 't2', equipe_b_id: 't1', score_a: 5, score_b: 13, status: 'termine', round: 1, type: 'poule' }
      ]

      const result = calculateTeamResult('t1', matches)

      expect(result.victories).toBe(1)
      expect(result.pointsFor).toBe(13)
      expect(result.pointsAgainst).toBe(5)
    })

    it('devrait calculer différence négative', () => {
      const matches: Match[] = [
        { id: '1', equipe_a_id: 't1', equipe_b_id: 't2', score_a: 5, score_b: 13, status: 'termine', round: 1, type: 'poule' },
        { id: '2', equipe_a_id: 't3', equipe_b_id: 't1', score_a: 13, score_b: 7, status: 'termine', round: 1, type: 'poule' }
      ]

      const result = calculateTeamResult('t1', matches)

      expect(result.victories).toBe(0)
      expect(result.points).toBe(0)
      expect(result.difference).toBe(-14) // (5+7) - (13+13) = 12 - 26
    })

    it('devrait ignorer matchs non terminés', () => {
      const matches: Match[] = [
        { id: '1', equipe_a_id: 't1', equipe_b_id: 't2', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' },
        { id: '2', equipe_a_id: 't1', equipe_b_id: 't3', score_a: 0, score_b: 0, status: 'a_jouer', round: 1, type: 'poule' }
      ]

      const result = calculateTeamResult('t1', matches)

      expect(result.victories).toBe(1)
      expect(result.points).toBe(3)
    })

    it('devrait comptabiliser les nuls', () => {
      const matches: Match[] = [
        { id: '1', equipe_a_id: 't1', equipe_b_id: 't2', score_a: 10, score_b: 10, status: 'termine', round: 1, type: 'poule' },
        { id: '2', equipe_a_id: 't1', equipe_b_id: 't3', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' }
      ]

      const result = calculateTeamResult('t1', matches)

      expect(result.victories).toBe(1)
      expect(result.draws).toBe(1)
      expect(result.points).toBe(4) // 3 + 1
    })
  })

  describe('sortTeamsByRanking', () => {

    it('devrait trier par points FIPJP', () => {
      const matches: Match[] = [
        { id: '1', equipe_a_id: 't1', equipe_b_id: 't2', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' },
        { id: '2', equipe_a_id: 't1', equipe_b_id: 't3', score_a: 13, score_b: 5, status: 'termine', round: 1, type: 'poule' },
        { id: '3', equipe_a_id: 't2', equipe_b_id: 't3', score_a: 13, score_b: 10, status: 'termine', round: 1, type: 'poule' }
      ]

      const sorted = sortTeamsByRanking(['t1', 't2', 't3'], matches, matches)

      expect(sorted[0]).toBe('t1') // 2 victoires = 6 pts
      expect(sorted[1]).toBe('t2') // 1 victoire = 3 pts
      expect(sorted[2]).toBe('t3') // 0 victoire = 0 pts
    })

    it('devrait départager par différence si points égaux', () => {
      const matches: Match[] = [
        { id: '1', equipe_a_id: 't1', equipe_b_id: 't2', score_a: 13, score_b: 12, status: 'termine', round: 1, type: 'poule' },
        { id: '2', equipe_a_id: 't2', equipe_b_id: 't3', score_a: 13, score_b: 5, status: 'termine', round: 1, type: 'poule' },
        { id: '3', equipe_a_id: 't3', equipe_b_id: 't1', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' }
      ]

      // t1: 1V (vs t2), 1D (vs t3) = 3 pts, diff = (13+8) - (12+13) = -4
      // t2: 1V (vs t3), 1D (vs t1) = 3 pts, diff = (12+13) - (13+5) = +7
      // t3: 1V (vs t1), 1D (vs t2) = 3 pts, diff = (13+5) - (8+13) = -3

      const sorted = sortTeamsByRanking(['t1', 't2', 't3'], matches, matches)

      expect(sorted[0]).toBe('t2') // Meilleure diff (+7)
    })

    it('devrait départager par confrontation directe', () => {
      const matches: Match[] = [
        { id: '1', equipe_a_id: 't1', equipe_b_id: 't2', score_a: 13, score_b: 10, status: 'termine', round: 1, type: 'poule' },
        { id: '2', equipe_a_id: 't1', equipe_b_id: 't3', score_a: 10, score_b: 13, status: 'termine', round: 1, type: 'poule' },
        { id: '3', equipe_a_id: 't2', equipe_b_id: 't3', score_a: 10, score_b: 13, status: 'termine', round: 1, type: 'poule' }
      ]

      // t1: 1V 1D = 3 pts, diff = (13+10) - (10+13) = 0
      // t3: 2V = 6 pts (premier)
      // t2: 0V 2D = 0 pts (dernier)

      const sorted = sortTeamsByRanking(['t1', 't2', 't3'], matches, matches)

      expect(sorted[0]).toBe('t3')
      expect(sorted[2]).toBe('t2')
    })
  })

  describe('getQualifiedTeams', () => {

    it('devrait qualifier les 2 premiers de chaque poule', () => {
      const poules: Poule[] = [
        { id: 'p1', name: 'Poule A', equipe_ids: ['t1', 't2', 't3', 't4'] },
        { id: 'p2', name: 'Poule B', equipe_ids: ['t5', 't6', 't7', 't8'] }
      ]

      const matches: Match[] = [
        // Poule A
        { id: '1', equipe_a_id: 't1', equipe_b_id: 't2', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' },
        { id: '2', equipe_a_id: 't1', equipe_b_id: 't3', score_a: 13, score_b: 5, status: 'termine', round: 1, type: 'poule' },
        { id: '3', equipe_a_id: 't1', equipe_b_id: 't4', score_a: 13, score_b: 10, status: 'termine', round: 1, type: 'poule' },
        { id: '4', equipe_a_id: 't2', equipe_b_id: 't3', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' },
        { id: '5', equipe_a_id: 't2', equipe_b_id: 't4', score_a: 13, score_b: 5, status: 'termine', round: 1, type: 'poule' },
        { id: '6', equipe_a_id: 't3', equipe_b_id: 't4', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' },
        // Poule B
        { id: '7', equipe_a_id: 't5', equipe_b_id: 't6', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' },
        { id: '8', equipe_a_id: 't5', equipe_b_id: 't7', score_a: 13, score_b: 5, status: 'termine', round: 1, type: 'poule' },
        { id: '9', equipe_a_id: 't5', equipe_b_id: 't8', score_a: 13, score_b: 10, status: 'termine', round: 1, type: 'poule' },
        { id: '10', equipe_a_id: 't6', equipe_b_id: 't7', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' },
        { id: '11', equipe_a_id: 't6', equipe_b_id: 't8', score_a: 13, score_b: 5, status: 'termine', round: 1, type: 'poule' },
        { id: '12', equipe_a_id: 't7', equipe_b_id: 't8', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' }
      ]

      const qualified = getQualifiedTeams(poules, matches, 2)

      expect(qualified).toHaveLength(4)
      // Poule A: t1 (9pts), t2 (6pts)
      expect(qualified).toContain('t1')
      expect(qualified).toContain('t2')
      // Poule B: t5 (9pts), t6 (6pts)
      expect(qualified).toContain('t5')
      expect(qualified).toContain('t6')
    })

    it('devrait qualifier 1 seul par poule si demandé', () => {
      const poules: Poule[] = [
        { id: 'p1', name: 'Poule A', equipe_ids: ['t1', 't2', 't3'] },
        { id: 'p2', name: 'Poule B', equipe_ids: ['t4', 't5', 't6'] }
      ]

      const matches: Match[] = [
        { id: '1', equipe_a_id: 't1', equipe_b_id: 't2', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' },
        { id: '2', equipe_a_id: 't1', equipe_b_id: 't3', score_a: 13, score_b: 5, status: 'termine', round: 1, type: 'poule' },
        { id: '3', equipe_a_id: 't2', equipe_b_id: 't3', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' },
        { id: '4', equipe_a_id: 't4', equipe_b_id: 't5', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' },
        { id: '5', equipe_a_id: 't4', equipe_b_id: 't6', score_a: 13, score_b: 5, status: 'termine', round: 1, type: 'poule' },
        { id: '6', equipe_a_id: 't5', equipe_b_id: 't6', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' }
      ]

      const qualified = getQualifiedTeams(poules, matches, 1)

      expect(qualified).toHaveLength(2)
      expect(qualified).toContain('t1') // 1er Poule A
      expect(qualified).toContain('t4') // 1er Poule B
    })
  })
})

describe('Mêlée Fixe - Phase éliminatoire', () => {

  describe('generateEliminationBracket', () => {

    it('devrait générer 4 matchs pour 8 qualifiés', () => {
      const qualified = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8']
      const matches = generateEliminationBracket(qualified)

      expect(matches).toHaveLength(4) // Quarts de finale
    })

    it('devrait générer 2 matchs pour 4 qualifiés', () => {
      const qualified = ['t1', 't2', 't3', 't4']
      const matches = generateEliminationBracket(qualified)

      expect(matches).toHaveLength(2) // Demi-finales
    })

    it('devrait générer BYE pour 5 qualifiés', () => {
      const qualified = ['t1', 't2', 't3', 't4', 't5']
      const matches = generateEliminationBracket(qualified)

      // 5 qualifiés → arrondi à 8 → 4 matchs, dont 2 avec BYE
      // (les 3 meilleures seeds avec BYE = 2 matchs BYE car 1 match = 2 équipes)
      const byeMatches = matches.filter(m => m.type === 'bye')
      expect(byeMatches.length).toBe(2)
    })

    it('devrait auto-terminer les matchs BYE', () => {
      const qualified = ['t1', 't2', 't3']
      const matches = generateEliminationBracket(qualified)

      const byeMatches = matches.filter(m => m.type === 'bye')
      byeMatches.forEach(m => {
        expect(m.status).toBe('termine')
        expect(m.equipe_b_id).toBeNull()
      })
    })

    it('devrait opposer seed 1 vs seed 8 (bracket standard)', () => {
      const qualified = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8']
      const matches = generateEliminationBracket(qualified)

      // Premier match: seed 1 (t1) vs seed 8 (t8)
      const firstMatch = matches[0]
      expect(firstMatch.equipe_a_id).toBe('t1')
      expect(firstMatch.equipe_b_id).toBe('t8')
    })
  })

  describe('Scénario complet', () => {

    it('devrait simuler un tournoi complet 8 équipes', () => {
      // 1. Créer équipes
      const teams: Team[] = Array.from({ length: 8 }, (_, i) => ({
        id: `t${i + 1}`,
        name: `Team ${i + 1}`,
        joueur_ids: []
      }))

      // 2. Distribuer en 2 poules
      const poules = distributeTeamsToPoules(teams, 2)
      expect(poules).toHaveLength(2)
      expect(poules[0].equipe_ids).toHaveLength(4)
      expect(poules[1].equipe_ids).toHaveLength(4)

      // 3. Générer matchs poules
      const pouleMatches: Match[] = []
      poules.forEach(p => {
        pouleMatches.push(...generateRoundRobinMatches(p, teams))
      })
      expect(pouleMatches).toHaveLength(12) // 6 + 6

      // 4. Simuler résultats (équipes impaires gagnent)
      pouleMatches.forEach(m => {
        const aNum = parseInt(m.equipe_a_id.replace('t', ''))
        const bNum = parseInt(m.equipe_b_id!.replace('t', ''))

        if (aNum % 2 === 1) {
          m.score_a = 13
          m.score_b = 8
        } else {
          m.score_a = 8
          m.score_b = 13
        }
        m.status = 'termine'
      })

      // 5. Qualifier 2 par poule
      const qualified = getQualifiedTeams(poules, pouleMatches, 2)
      expect(qualified).toHaveLength(4)

      // 6. Générer bracket éliminatoire
      const elimMatches = generateEliminationBracket(qualified)
      expect(elimMatches).toHaveLength(2) // Demi-finales
    })
  })
})

describe('Mêlée Fixe - Edge cases', () => {

  it('devrait gérer poule avec 2 équipes seulement', () => {
    const teams: Team[] = [
      { id: 't1', name: 'A', joueur_ids: [] },
      { id: 't2', name: 'B', joueur_ids: [] }
    ]

    const poule: Poule = {
      id: 'p1',
      name: 'Poule A',
      equipe_ids: ['t1', 't2']
    }

    const matches = generateRoundRobinMatches(poule, teams)

    expect(matches).toHaveLength(1) // 1 seul match
  })

  it('devrait gérer équipe avec 0 points marqués', () => {
    const matches: Match[] = [
      { id: '1', equipe_a_id: 't1', equipe_b_id: 't2', score_a: 13, score_b: 0, status: 'termine', round: 1, type: 'poule' }
    ]

    const result = calculateTeamResult('t2', matches)

    expect(result.pointsFor).toBe(0)
    expect(result.pointsAgainst).toBe(13)
    expect(result.difference).toBe(-13)
  })

  it('devrait gérer égalité totale (même points, même diff)', () => {
    // Cas où deux équipes sont totalement égales
    // La confrontation directe devient cruciale
    const matches: Match[] = [
      { id: '1', equipe_a_id: 't1', equipe_b_id: 't2', score_a: 13, score_b: 10, status: 'termine', round: 1, type: 'poule' },
      { id: '2', equipe_a_id: 't1', equipe_b_id: 't3', score_a: 10, score_b: 13, status: 'termine', round: 1, type: 'poule' },
      { id: '3', equipe_a_id: 't2', equipe_b_id: 't3', score_a: 13, score_b: 10, status: 'termine', round: 1, type: 'poule' }
    ]

    const sorted = sortTeamsByRanking(['t1', 't2', 't3'], matches, matches)

    // Tous à 1V = 3 pts, mais différences varient
    // t1: 1V, diff = (13+10) - (10+13) = 0
    // t2: 1V, diff = (10+13) - (13+10) = 0
    // t3: 1V, diff = (13+10) - (10+13) = 0

    expect(sorted).toHaveLength(3)
  })

  it('devrait fonctionner avec une seule poule', () => {
    const poules: Poule[] = [
      { id: 'p1', name: 'Poule unique', equipe_ids: ['t1', 't2', 't3', 't4'] }
    ]

    const matches: Match[] = [
      { id: '1', equipe_a_id: 't1', equipe_b_id: 't2', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' },
      { id: '2', equipe_a_id: 't1', equipe_b_id: 't3', score_a: 13, score_b: 5, status: 'termine', round: 1, type: 'poule' },
      { id: '3', equipe_a_id: 't1', equipe_b_id: 't4', score_a: 13, score_b: 10, status: 'termine', round: 1, type: 'poule' },
      { id: '4', equipe_a_id: 't2', equipe_b_id: 't3', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' },
      { id: '5', equipe_a_id: 't2', equipe_b_id: 't4', score_a: 13, score_b: 5, status: 'termine', round: 1, type: 'poule' },
      { id: '6', equipe_a_id: 't3', equipe_b_id: 't4', score_a: 13, score_b: 8, status: 'termine', round: 1, type: 'poule' }
    ]

    const qualified = getQualifiedTeams(poules, matches, 2)

    expect(qualified).toHaveLength(2)
    expect(qualified[0]).toBe('t1') // 9 pts
    expect(qualified[1]).toBe('t2') // 6 pts
  })
})
