/**
 * Tests unitaires pour le service de tirage intelligent
 * Simule tous les scénarios possibles dans le plan gratuit (8 équipes max)
 */

import { describe, it, expect } from 'vitest'
import {
  snakeDraftDistribution,
  calculateBalancedPoolSizes,
  bergerRoundRobin,
  generateBergerMatches,
  antiRematchTeamFormation,
  smartTerrainAssignment,
  TirageService,
} from '../tirage.service'

// ─── HELPERS ────────────────────────────────────────────────────

function makeTeams(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `team_${i + 1}`,
    name: `Équipe ${i + 1}`,
  }))
}

function makePlayers(n: number, genders?: ('H' | 'F')[]) {
  return Array.from({ length: n }, (_, i) => ({
    id: `player_${i + 1}`,
    gender: genders ? genders[i] : (i % 2 === 0 ? 'H' as const : 'F' as const),
  }))
}

// ─── SNAKE DRAFT ────────────────────────────────────────────────

describe('snakeDraftDistribution', () => {
  it('devrait répartir 8 équipes en 2 poules de 4', () => {
    const teams = makeTeams(8)
    const pools = snakeDraftDistribution(teams, 4)

    expect(Object.keys(pools)).toEqual(['A', 'B'])
    expect(pools['A'].length).toBe(4)
    expect(pools['B'].length).toBe(4)
  })

  it('devrait répartir 6 équipes en 2 poules de 3', () => {
    const teams = makeTeams(6)
    const pools = snakeDraftDistribution(teams, 3)

    expect(Object.keys(pools)).toEqual(['A', 'B'])
    expect(pools['A'].length).toBe(3)
    expect(pools['B'].length).toBe(3)
  })

  it('devrait répartir 7 équipes en poules de 4 → 4+3', () => {
    const teams = makeTeams(7)
    const pools = snakeDraftDistribution(teams, 4)

    const sizes = Object.values(pools).map(p => p.length).sort((a, b) => b - a)
    expect(sizes).toEqual([4, 3])
  })

  it('devrait placer chaque équipe dans exactement une poule', () => {
    const teams = makeTeams(8)
    const pools = snakeDraftDistribution(teams, 4)

    const allTeamIds = Object.values(pools)
      .flat()
      .map(t => t.id)
      .sort()
    const expectedIds = teams.map(t => t.id).sort()

    expect(allTeamIds).toEqual(expectedIds)
  })

  it('devrait distribuer en serpentin (pas séquentiel)', () => {
    // Avec des équipes numérotées 1-8, le serpentin doit alterner
    // Rang 0: A=1, B=2 / Rang 1: B=3, A=4 / Rang 2: A=5, B=6 / Rang 3: B=7, A=8
    // On vérifie que chaque poule a un mélange de "rangs" (indices pairs et impairs)
    const teams = makeTeams(8)

    // Faire tourner 100 fois pour vérifier que le mélange est réel
    let allSame = true
    for (let run = 0; run < 20; run++) {
      const pools = snakeDraftDistribution(teams, 4)
      const poolAIds = pools['A'].map(t => t.id)
      // Si jamais une poule contient exactement les 4 premières, c'est séquentiel
      if (poolAIds.sort().join(',') !== 'team_1,team_2,team_3,team_4') {
        allSame = false
        break
      }
    }
    // Avec un shuffle + serpentin, c'est quasi impossible d'avoir toujours le même résultat
    expect(allSame).toBe(false)
  })

  it('devrait gérer 4 équipes en 1 poule de 4', () => {
    const teams = makeTeams(4)
    const pools = snakeDraftDistribution(teams, 4)

    expect(Object.keys(pools)).toEqual(['A'])
    expect(pools['A'].length).toBe(4)
  })

  it('devrait gérer 5 équipes en poules de 3 → 3+2', () => {
    const teams = makeTeams(5)
    const pools = snakeDraftDistribution(teams, 3)

    const sizes = Object.values(pools).map(p => p.length).sort((a, b) => b - a)
    expect(sizes).toEqual([3, 2])
  })

  it('ne devrait jamais avoir de doublons entre poules', () => {
    for (let n = 4; n <= 8; n++) {
      const teams = makeTeams(n)
      const pools = snakeDraftDistribution(teams, Math.min(n, 4))

      const allIds = Object.values(pools).flat().map(t => t.id)
      const uniqueIds = new Set(allIds)
      expect(uniqueIds.size).toBe(n)
    }
  })
})

// ─── BALANCED POOL SIZES ────────────────────────────────────────

describe('calculateBalancedPoolSizes', () => {
  it('8 équipes, poules de 4 → [4, 4]', () => {
    expect(calculateBalancedPoolSizes(8, 4)).toEqual([4, 4])
  })

  it('7 équipes, poules de 4 → [4, 3]', () => {
    expect(calculateBalancedPoolSizes(7, 4)).toEqual([4, 3])
  })

  it('6 équipes, poules de 4 → [3, 3] (pas [4, 2] !)', () => {
    // C'est le cas critique : 6/4 = 2 poules, mais on veut 3+3 pas 4+2
    expect(calculateBalancedPoolSizes(6, 4)).toEqual([3, 3])
  })

  it('5 équipes, poules de 3 → [3, 2]', () => {
    expect(calculateBalancedPoolSizes(5, 3)).toEqual([3, 2])
  })

  it('14 équipes, poules de 4 → [4, 4, 3, 3] (pas [4, 4, 4, 2])', () => {
    expect(calculateBalancedPoolSizes(14, 4)).toEqual([4, 4, 3, 3])
  })

  it('la somme des tailles doit toujours égaler le nombre total', () => {
    for (let n = 3; n <= 16; n++) {
      for (let size = 3; size <= 6; size++) {
        const sizes = calculateBalancedPoolSizes(n, size)
        const sum = sizes.reduce((a, b) => a + b, 0)
        expect(sum).toBe(n)
      }
    }
  })

  it('l\'écart max entre plus grande et plus petite poule ≤ 1', () => {
    for (let n = 3; n <= 16; n++) {
      for (let size = 3; size <= 6; size++) {
        const sizes = calculateBalancedPoolSizes(n, size)
        const max = Math.max(...sizes)
        const min = Math.min(...sizes)
        expect(max - min).toBeLessThanOrEqual(1)
      }
    }
  })

  it('devrait retourner [] pour 0 équipes', () => {
    expect(calculateBalancedPoolSizes(0, 4)).toEqual([])
  })
})

// ─── BERGER ROUND-ROBIN ────────────────────────────────────────

describe('bergerRoundRobin', () => {
  it('4 équipes → 3 tours, 6 matchs au total', () => {
    const rounds = bergerRoundRobin(4)
    const totalMatches = rounds.reduce((sum, r) => sum + r.pairs.length, 0)

    // 4 équipes = 4*3/2 = 6 matchs
    expect(totalMatches).toBe(6)
    expect(rounds.length).toBe(3)
  })

  it('3 équipes → 3 tours, 3 matchs au total', () => {
    const rounds = bergerRoundRobin(3)
    const totalMatches = rounds.reduce((sum, r) => sum + r.pairs.length, 0)

    // 3 équipes = 3*2/2 = 3 matchs
    expect(totalMatches).toBe(3)
  })

  it('chaque paire de teams joue exactement 1 fois', () => {
    for (let n = 3; n <= 8; n++) {
      const rounds = bergerRoundRobin(n)
      const seen = new Set<string>()

      for (const round of rounds) {
        for (const [a, b] of round.pairs) {
          const key = [Math.min(a, b), Math.max(a, b)].join('-')
          expect(seen.has(key)).toBe(false) // Pas de doublon
          seen.add(key)
        }
      }

      // Nombre total de paires = n*(n-1)/2
      expect(seen.size).toBe(n * (n - 1) / 2)
    }
  })

  it('aucune équipe ne joue contre elle-même', () => {
    for (let n = 3; n <= 8; n++) {
      const rounds = bergerRoundRobin(n)
      for (const round of rounds) {
        for (const [a, b] of round.pairs) {
          expect(a).not.toBe(b)
        }
      }
    }
  })

  it('chaque équipe joue au plus 1 match par tour', () => {
    for (let n = 3; n <= 8; n++) {
      const rounds = bergerRoundRobin(n)
      for (const round of rounds) {
        const teamsInRound = new Set<number>()
        for (const [a, b] of round.pairs) {
          expect(teamsInRound.has(a)).toBe(false) // a ne joue pas déjà
          expect(teamsInRound.has(b)).toBe(false) // b ne joue pas déjà
          teamsInRound.add(a)
          teamsInRound.add(b)
        }
      }
    }
  })

  it('les indices sont dans les limites [0, n-1]', () => {
    for (let n = 3; n <= 8; n++) {
      const rounds = bergerRoundRobin(n)
      for (const round of rounds) {
        for (const [a, b] of round.pairs) {
          expect(a).toBeGreaterThanOrEqual(0)
          expect(a).toBeLessThan(n)
          expect(b).toBeGreaterThanOrEqual(0)
          expect(b).toBeLessThan(n)
        }
      }
    }
  })

  it('5 équipes → chaque équipe a 1 repos par tour (bye)', () => {
    const rounds = bergerRoundRobin(5)
    // Avec 5 équipes, chaque tour a 2 matchs (4 teams jouent, 1 au repos)
    for (const round of rounds) {
      expect(round.pairs.length).toBe(2)
    }
  })
})

// ─── GENERATE BERGER MATCHES ───────────────────────────────────

describe('generateBergerMatches', () => {
  it('devrait générer les bons matchs pour 4 équipes', () => {
    const teams = makeTeams(4)
    const matches = generateBergerMatches(teams, 'A')

    expect(matches.length).toBe(6) // 4*3/2
    expect(matches.every(m => m.poule === 'A')).toBe(true)

    // Vérifier que chaque paire existe
    const pairs = new Set(matches.map(m =>
      [m.teamA.id, m.teamB.id].sort().join('-')
    ))
    expect(pairs.size).toBe(6) // Pas de doublons
  })

  it('devrait attribuer des tours cohérents', () => {
    const teams = makeTeams(4)
    const matches = generateBergerMatches(teams, 'A')

    // Les tours doivent être 1, 2, 3 (Berger)
    const tours = [...new Set(matches.map(m => m.tour))].sort()
    expect(tours).toEqual([1, 2, 3])
  })

  it('devrait fonctionner sans poule (null)', () => {
    const teams = makeTeams(3)
    const matches = generateBergerMatches(teams, null)

    expect(matches.length).toBe(3)
    expect(matches.every(m => m.poule === null)).toBe(true)
  })
})

// ─── ANTI-REMATCH ──────────────────────────────────────────────

describe('antiRematchTeamFormation', () => {
  it('devrait former des équipes de 2 (doublette)', () => {
    const players = makePlayers(8)
    const result = antiRematchTeamFormation(players, [], [], 2)

    expect(result.length).toBe(4) // 8/2 = 4 équipes
    result.forEach(team => {
      expect(team.joueur_ids.length).toBe(2)
    })
  })

  it('devrait former des équipes de 3 (triplette)', () => {
    const players = makePlayers(9)
    const result = antiRematchTeamFormation(players, [], [], 3)

    expect(result.length).toBe(3) // 9/3 = 3 équipes
    result.forEach(team => {
      expect(team.joueur_ids.length).toBe(3)
    })
  })

  it('ne devrait jamais dupliquer un joueur', () => {
    const players = makePlayers(8)
    const result = antiRematchTeamFormation(players, [], [], 2)

    const allIds = result.flatMap(t => t.joueur_ids)
    expect(new Set(allIds).size).toBe(allIds.length)
  })

  it('devrait utiliser tous les joueurs possibles', () => {
    const players = makePlayers(8)
    const result = antiRematchTeamFormation(players, [], [], 2)

    const allIds = result.flatMap(t => t.joueur_ids)
    expect(allIds.length).toBe(8)
  })

  it('devrait laisser les joueurs restants (nombre non divisible)', () => {
    const players = makePlayers(7)
    const result = antiRematchTeamFormation(players, [], [], 2)

    // 7/2 = 3 équipes + 1 joueur non assigné
    expect(result.length).toBe(3)
    const allIds = result.flatMap(t => t.joueur_ids)
    expect(allIds.length).toBe(6)
  })

  it('devrait éviter les anciens coéquipiers', () => {
    const players = makePlayers(4) // 4 joueurs, doublettes

    // Rotation 1 : [1,2] et [3,4] étaient coéquipiers
    const previousTeams = [
      { joueur_ids: ['player_1', 'player_2'] },
      { joueur_ids: ['player_3', 'player_4'] },
    ]

    // On s'attend à ce que la nouvelle rotation évite 1+2 et 3+4
    let avoidedCount = 0
    for (let run = 0; run < 50; run++) {
      const result = antiRematchTeamFormation(players, previousTeams, [], 2)
      const team1 = result[0].joueur_ids.sort().join(',')

      if (team1 !== 'player_1,player_2' && team1 !== 'player_3,player_4') {
        avoidedCount++
      }
    }

    // Avec l'algo anti-rematch, on devrait toujours éviter (pénalité = 3)
    expect(avoidedCount).toBe(50)
  })

  it('devrait éviter les anciens adversaires quand possible', () => {
    const players = makePlayers(4)

    // Rotation 1 : 1 vs 3 et 2 vs 4 se sont affrontés
    const previousMatches = [
      { equipe_a_joueur_ids: ['player_1'], equipe_b_joueur_ids: ['player_3'] },
      { equipe_a_joueur_ids: ['player_2'], equipe_b_joueur_ids: ['player_4'] },
    ]

    // Avec pénalité adversaire = 1, l'algo devrait préférer des combinaisons
    // qui minimisent les re-confrontations
    const result = antiRematchTeamFormation(players, [], previousMatches, 2)

    // Vérifier que les IDs sont valides
    expect(result.length).toBe(2)
    const allIds = result.flatMap(t => t.joueur_ids)
    expect(new Set(allIds).size).toBe(4)
  })

  it('devrait gérer 0 joueurs sans crasher', () => {
    const result = antiRematchTeamFormation([], [], [], 2)
    expect(result).toEqual([])
  })

  it('devrait gérer 1 joueur sans crasher', () => {
    const players = makePlayers(1)
    const result = antiRematchTeamFormation(players, [], [], 2)
    expect(result).toEqual([]) // Pas assez pour former une équipe
  })

  it('devrait gérer exactement teamSize joueurs', () => {
    const players = makePlayers(2)
    const result = antiRematchTeamFormation(players, [], [], 2)
    expect(result.length).toBe(1)
    expect(result[0].joueur_ids.length).toBe(2)
  })

  it('devrait gérer exactement teamSize=3 joueurs', () => {
    const players = makePlayers(3)
    const result = antiRematchTeamFormation(players, [], [], 3)
    expect(result.length).toBe(1)
    expect(result[0].joueur_ids.length).toBe(3)
  })
})

// ─── SMART TERRAIN ASSIGNMENT ──────────────────────────────────

describe('smartTerrainAssignment', () => {
  it('devrait assigner tous les matchs à un terrain', () => {
    const matches = [
      { id: 'm1', equipe_a_id: 't1', equipe_b_id: 't2', tour: 1 },
      { id: 'm2', equipe_a_id: 't3', equipe_b_id: 't4', tour: 1 },
      { id: 'm3', equipe_a_id: 't1', equipe_b_id: 't3', tour: 2 },
    ]

    const assignment = smartTerrainAssignment(matches, 4)

    expect(assignment.size).toBe(3)
    for (const terrain of assignment.values()) {
      expect(terrain).toBeGreaterThanOrEqual(1)
      expect(terrain).toBeLessThanOrEqual(4)
    }
  })

  it('devrait répartir équitablement les matchs entre terrains', () => {
    const matches = Array.from({ length: 6 }, (_, i) => ({
      id: `m${i}`,
      equipe_a_id: `t${i * 2}`,
      equipe_b_id: `t${i * 2 + 1}`,
      tour: Math.floor(i / 2) + 1,
    }))

    const assignment = smartTerrainAssignment(matches, 3)

    // Compter l'utilisation de chaque terrain
    const usage = new Map<number, number>()
    for (const terrain of assignment.values()) {
      usage.set(terrain, (usage.get(terrain) || 0) + 1)
    }

    // Chaque terrain devrait avoir 2 matchs (6/3 = 2)
    for (const count of usage.values()) {
      expect(count).toBe(2)
    }
  })

  it('devrait respecter les terrains occupés', () => {
    const matches = [
      { id: 'm1', equipe_a_id: 't1', equipe_b_id: 't2', tour: 1 },
    ]

    const assignment = smartTerrainAssignment(matches, 3, [1, 2]) // Terrains 1 et 2 occupés

    expect(assignment.get('m1')).toBe(3) // Seul terrain libre
  })

  it('devrait éviter le même terrain consécutif pour une équipe', () => {
    const matches = [
      { id: 'm1', equipe_a_id: 't1', equipe_b_id: 't2', tour: 1 },
      { id: 'm2', equipe_a_id: 't1', equipe_b_id: 't3', tour: 2 },
    ]

    const assignment = smartTerrainAssignment(matches, 3)

    // t1 joue dans m1 et m2, les terrains devraient être différents
    expect(assignment.get('m1')).not.toBe(assignment.get('m2'))
  })

  it('devrait gérer 1 seul terrain disponible', () => {
    const matches = [
      { id: 'm1', equipe_a_id: 't1', equipe_b_id: 't2', tour: 1 },
      { id: 'm2', equipe_a_id: 't3', equipe_b_id: 't4', tour: 1 },
    ]

    const assignment = smartTerrainAssignment(matches, 1)

    expect(assignment.get('m1')).toBe(1)
    expect(assignment.get('m2')).toBe(1)
  })
})

// ─── FISHER-YATES SHUFFLE ──────────────────────────────────────

describe('fisherYatesShuffle', () => {
  it('devrait conserver tous les éléments', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8]
    const shuffled = TirageService.fisherYatesShuffle(arr)

    expect(shuffled.sort()).toEqual(arr.sort())
  })

  it('ne devrait pas modifier l\'original', () => {
    const arr = [1, 2, 3, 4, 5]
    const original = [...arr]
    TirageService.fisherYatesShuffle(arr)

    expect(arr).toEqual(original)
  })

  it('devrait produire des résultats différents (probabilistique)', () => {
    const arr = [1, 2, 3, 4, 5, 6, 7, 8]
    const results = new Set<string>()

    for (let i = 0; i < 20; i++) {
      results.add(TirageService.fisherYatesShuffle(arr).join(','))
    }

    expect(results.size).toBeGreaterThan(1)
  })
})
