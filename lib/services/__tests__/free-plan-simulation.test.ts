/**
 * Tests de simulation complète du plan gratuit
 *
 * Simule le cycle de vie complet d'un tournoi dans les limites
 * du plan gratuit (1 tournoi, 8 équipes max) pour détecter
 * toute incohérence ou bug dans la chaîne d'algorithmes.
 */

import { describe, it, expect } from 'vitest'
import {
  snakeDraftDistribution,
  bergerRoundRobin,
  generateBergerMatches,
  antiRematchTeamFormation,
  smartTerrainAssignment,
  calculateBalancedPoolSizes,
} from '../tirage.service'
import {
  applySeedingByRank,
  calculateBracketMatches,
  generateFirstRoundPairs,
} from '../bracket.service'
import {
  calculateTeamStats,
  sortTeamsByFIPJPRules,
} from '../stats.service'
import { MixiteService } from '../mixite.service'
import { getFeaturesForPlan, getOrgLimit, hasOrgFeature } from '../../plans'
import type { Match } from '@/lib/types'

// ─── HELPERS ────────────────────────────────────────────────────

function makeTeam(id: string, name: string) {
  return { id, name, joueur_ids: [] as string[], tournoi_id: 't1' }
}

function makeMatch(
  id: string,
  teamA: { id: string; name: string },
  teamB: { id: string; name: string },
  scoreA: number,
  scoreB: number,
  poule: string | null = null,
  type: string = 'poule'
): Match {
  return {
    id,
    tournoi_id: 't1',
    equipe_a: { ...teamA, joueur_ids: [], tournoi_id: 't1' },
    equipe_b: { ...teamB, joueur_ids: [], tournoi_id: 't1' },
    equipe_a_id: teamA.id,
    equipe_b_id: teamB.id,
    score_a: scoreA,
    score_b: scoreB,
    status: 'termine',
    type: type as any,
    tour: 1,
    terrain: null,
    poule,
    round: null,
    manches_json: null,
    started_at: null,
    ended_at: null,
    validated_at: null,
    played_at: null,
    proposed_by: null,
    proposed_at: null,
    winner_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

// ─── PLAN GRATUIT : LIMITES ────────────────────────────────────

describe('Plan Gratuit - Limites', () => {
  const orgSettings = { plan: 'free', features: getFeaturesForPlan('free') }

  it('devrait limiter à 1 tournoi', () => {
    expect(getOrgLimit(orgSettings, 'max_tournois')).toBe(1)
  })

  it('devrait limiter à 8 équipes', () => {
    expect(getOrgLimit(orgSettings, 'max_equipes')).toBe(8)
  })

  it('ne devrait pas avoir les stats avancées', () => {
    expect(hasOrgFeature(orgSettings, 'advanced_stats')).toBe(false)
  })

  it('ne devrait pas avoir les règles custom', () => {
    expect(hasOrgFeature(orgSettings, 'custom_rules')).toBe(false)
  })

  it('ne devrait pas avoir la personnalisation club', () => {
    expect(hasOrgFeature(orgSettings, 'club_customization')).toBe(false)
  })

  it('plan essentiel devrait avoir des limites null (illimité)', () => {
    const essentiel = { plan: 'essentiel', features: getFeaturesForPlan('essentiel') }
    expect(getOrgLimit(essentiel, 'max_tournois')).toBeNull()
    expect(getOrgLimit(essentiel, 'max_equipes')).toBeNull()
  })
})

// ─── SIMULATION : TOURNOI CHOISI 8 ÉQUIPES ─────────────────────

describe('Simulation Plan Gratuit - Mode Choisi, 8 équipes, 2 poules de 4', () => {
  const teams = Array.from({ length: 8 }, (_, i) => makeTeam(`t${i + 1}`, `Équipe ${i + 1}`))

  it('Étape 1: Distribution en poules (snake draft)', () => {
    const pools = snakeDraftDistribution(teams, 4)

    expect(Object.keys(pools).length).toBe(2)
    expect(pools['A'].length).toBe(4)
    expect(pools['B'].length).toBe(4)

    // Vérifier que toutes les équipes sont réparties
    const allTeams = [...pools['A'], ...pools['B']]
    expect(new Set(allTeams.map(t => t.id)).size).toBe(8)
  })

  it('Étape 2: Génération matchs round-robin (Berger)', () => {
    const pools = snakeDraftDistribution(teams, 4)

    for (const [poolName, poolTeams] of Object.entries(pools)) {
      const matches = generateBergerMatches(poolTeams, poolName)

      // 4 équipes = 6 matchs
      expect(matches.length).toBe(6)

      // Vérifier l'unicité des paires
      const pairs = new Set(matches.map(m =>
        [m.teamA.id, m.teamB.id].sort().join('-')
      ))
      expect(pairs.size).toBe(6)

      // Vérifier que chaque match a la bonne poule
      expect(matches.every(m => m.poule === poolName)).toBe(true)
    }
  })

  it('Étape 3: Assignation des terrains (4 terrains)', () => {
    const pools = snakeDraftDistribution(teams, 4)
    const allMatches = Object.entries(pools).flatMap(([poolName, poolTeams]) =>
      generateBergerMatches(poolTeams, poolName).map((m, idx) => ({
        id: `${poolName}_${idx}`,
        equipe_a_id: m.teamA.id,
        equipe_b_id: m.teamB.id,
        tour: m.tour,
      }))
    )

    const assignment = smartTerrainAssignment(allMatches, 4)

    // Tous les matchs ont un terrain
    expect(assignment.size).toBe(12) // 6 matchs × 2 poules

    // Terrains entre 1 et 4
    for (const terrain of assignment.values()) {
      expect(terrain).toBeGreaterThanOrEqual(1)
      expect(terrain).toBeLessThanOrEqual(4)
    }
  })

  it('Étape 4: Calcul classement FIPJP et qualification', () => {
    // Simuler les résultats de la poule A
    const pouleA = teams.slice(0, 4)
    const matchResults: Match[] = [
      makeMatch('m1', pouleA[0], pouleA[1], 13, 5, 'A'),   // T1 bat T2
      makeMatch('m2', pouleA[0], pouleA[2], 13, 8, 'A'),   // T1 bat T3
      makeMatch('m3', pouleA[0], pouleA[3], 13, 10, 'A'),  // T1 bat T4
      makeMatch('m4', pouleA[1], pouleA[2], 13, 7, 'A'),   // T2 bat T3
      makeMatch('m5', pouleA[1], pouleA[3], 11, 13, 'A'),  // T4 bat T2
      makeMatch('m6', pouleA[2], pouleA[3], 13, 9, 'A'),   // T3 bat T4
    ]

    // Calculer les stats pour chaque équipe
    const stats = pouleA.map(team =>
      calculateTeamStats(team.id, team.name, matchResults)
    )

    // Trier par règles FIPJP
    const rankings = sortTeamsByFIPJPRules(stats)

    // T1 devrait être premier (3 victoires)
    expect(rankings[0].id).toBe('t1')
    expect(rankings[0].victories).toBe(3)
    expect(rankings[0].points).toBe(9) // 3 × 3

    // 2 qualifiés par poule → les 2 premiers
    const qualified = rankings.slice(0, 2)
    expect(qualified.length).toBe(2)
  })

  it('Étape 5: Seeding pour les demi-finales', () => {
    // 2 poules, 2 qualifiés par poule = 4 équipes pour les demis
    const qualifiedTeams = [
      { id: 't1', name: '1er A', poule: 'A' },
      { id: 't2', name: '2ème A', poule: 'A' },
      { id: 't5', name: '1er B', poule: 'B' },
      { id: 't6', name: '2ème B', poule: 'B' },
    ]

    const seeded = applySeedingByRank(qualifiedTeams, 2, 2)

    // Seeding correct : 1er A vs 2ème B, 1er B vs 2ème A
    // Réorganisé par rang: [1er A, 1er B, 2ème A, 2ème B]
    expect(seeded[0].id).toBe('t1')  // 1er A
    expect(seeded[1].id).toBe('t5')  // 1er B
    expect(seeded[2].id).toBe('t2')  // 2ème A
    expect(seeded[3].id).toBe('t6')  // 2ème B

    // Vérifier qu'on n'a pas 1er A vs 2ème A (même poule)
    // Paires: [0,1] = 1er A vs 1er B ✓ (poules différentes)
    // Paires: [2,3] = 2ème A vs 2ème B ✓ (poules différentes)
  })

  it('Étape 6: Bracket demi-finales', () => {
    const bracket = calculateBracketMatches(4)

    expect(bracket.nbMatches).toBe(2)
    expect(bracket.round).toBe('demi')
    expect(bracket.hasByes).toBe(false)
  })

  it('Étape 7: Bracket avec 3 qualifiés (BYE)', () => {
    const bracket = calculateBracketMatches(3)

    expect(bracket.nbMatches).toBe(2)
    expect(bracket.round).toBe('demi')
    expect(bracket.hasByes).toBe(true)
    expect(bracket.nbByes).toBe(1)
  })
})

// ─── SIMULATION : MÊLÉE FIXE 8 JOUEURS DOUBLETTE ──────────────

describe('Simulation Plan Gratuit - Mêlée Fixe, 8 joueurs, Doublette', () => {
  const players = Array.from({ length: 8 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Joueur ${i + 1}`,
    gender: (i % 2 === 0 ? 'H' : 'F') as 'H' | 'F',
  }))

  it('devrait former 4 équipes de 2 avec mixité', () => {
    const result = MixiteService.createTeamsWithMixite(players, 2, true)

    expect(result.teams.length).toBe(4)
    expect(result.unassignedPlayerIds.length).toBe(0)

    // Chaque équipe a 2 joueurs
    result.teams.forEach(team => {
      expect(team.joueur_ids.length).toBe(2)
    })

    // Pas de doublons
    const allIds = result.teams.flatMap(t => t.joueur_ids)
    expect(new Set(allIds).size).toBe(8)
  })

  it('devrait former des équipes mixtes (1H + 1F)', () => {
    const result = MixiteService.createTeamsWithMixite(players, 2, true)
    const stats = MixiteService.getMixiteStats(result.teams, players)

    // Avec 4H et 4F, toutes les équipes devraient être mixtes
    expect(stats.mixed).toBe(4)
    expect(stats.mixedPercentage).toBe(100)
  })

  it('devrait former 4 équipes sans mixité obligatoire', () => {
    const result = MixiteService.createTeamsWithMixite(players, 2, false)

    expect(result.teams.length).toBe(4)
    expect(result.unassignedPlayerIds.length).toBe(0)
  })

  it('les équipes formées devraient être compatibles avec le snake draft', () => {
    const result = MixiteService.createTeamsWithMixite(players, 2, false)
    const teams = result.teams.map((t, i) => ({
      id: `team_${i + 1}`,
      name: `Équipe ${i + 1}`,
      joueur_ids: t.joueur_ids,
    }))

    // 4 équipes en 1 poule de 4 (plan gratuit)
    const pools = snakeDraftDistribution(teams, 4)
    expect(Object.keys(pools).length).toBe(1) // 1 seule poule
    expect(pools['A'].length).toBe(4)
  })
})

// ─── SIMULATION : MÊLÉE FIXE 6 JOUEURS TRIPLETTE ──────────────

describe('Simulation Plan Gratuit - Mêlée Fixe, 6 joueurs, Triplette', () => {
  const players = Array.from({ length: 6 }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Joueur ${i + 1}`,
    gender: (i < 3 ? 'H' : 'F') as 'H' | 'F',
  }))

  it('devrait former 2 équipes de 3', () => {
    const result = MixiteService.createTeamsWithMixite(players, 3, false)

    expect(result.teams.length).toBe(2)
    expect(result.unassignedPlayerIds.length).toBe(0)
  })

  it('devrait former des triplettes mixtes (2H+1F ou 1H+2F)', () => {
    const result = MixiteService.createTeamsWithMixite(players, 3, true)

    expect(result.teams.length).toBe(2)

    // Vérifier la mixité de chaque équipe
    for (const team of result.teams) {
      const teamPlayers = players.filter(p => team.joueur_ids.includes(p.id))
      const hasH = teamPlayers.some(p => p.gender === 'H')
      const hasF = teamPlayers.some(p => p.gender === 'F')
      expect(hasH && hasF).toBe(true) // Chaque équipe est mixte
    }
  })

  it('2 équipes → round-robin = 1 seul match', () => {
    const teams = [
      { id: 'team_1', name: 'Équipe 1' },
      { id: 'team_2', name: 'Équipe 2' },
    ]

    const matches = generateBergerMatches(teams, null)
    expect(matches.length).toBe(1)
    expect(matches[0].teamA.id).toBe('team_1')
    expect(matches[0].teamB.id).toBe('team_2')
  })
})

// ─── SIMULATION : MÊLÉE TOURNANTE ─────────────────────────────

describe('Simulation Plan Gratuit - Mêlée Tournante, 8 joueurs, Doublette', () => {
  const players = Array.from({ length: 8 }, (_, i) => ({
    id: `p${i + 1}`,
    gender: (i % 2 === 0 ? 'H' : 'F') as 'H' | 'F',
  }))

  it('Rotation 1: formation + round-robin', () => {
    const result = antiRematchTeamFormation(players, [], [], 2)

    expect(result.length).toBe(4)
    const allIds = result.flatMap(t => t.joueur_ids)
    expect(new Set(allIds).size).toBe(8) // Tous les joueurs utilisés
  })

  it('Rotation 2: anti-rematch évite les doublons', () => {
    // Simuler rotation 1
    const r1Teams = [
      { joueur_ids: ['p1', 'p2'] },
      { joueur_ids: ['p3', 'p4'] },
      { joueur_ids: ['p5', 'p6'] },
      { joueur_ids: ['p7', 'p8'] },
    ]
    const r1Matches = [
      { equipe_a_joueur_ids: ['p1', 'p2'], equipe_b_joueur_ids: ['p3', 'p4'] },
      { equipe_a_joueur_ids: ['p5', 'p6'], equipe_b_joueur_ids: ['p7', 'p8'] },
    ]

    const r2Teams = antiRematchTeamFormation(players, r1Teams, r1Matches, 2)

    expect(r2Teams.length).toBe(4)

    // Vérifier que aucun duo de R1 ne se retrouve dans R2
    const r1Duos = r1Teams.map(t => t.joueur_ids.sort().join(','))
    const r2Duos = r2Teams.map(t => t.joueur_ids.sort().join(','))

    const duplicates = r2Duos.filter(d => r1Duos.includes(d))
    expect(duplicates.length).toBe(0)
  })

  it('Rotation 3: anti-rematch avec historique cumulé', () => {
    const r1Teams = [
      { joueur_ids: ['p1', 'p2'] },
      { joueur_ids: ['p3', 'p4'] },
      { joueur_ids: ['p5', 'p6'] },
      { joueur_ids: ['p7', 'p8'] },
    ]
    const r2Teams = [
      { joueur_ids: ['p1', 'p3'] },
      { joueur_ids: ['p2', 'p4'] },
      { joueur_ids: ['p5', 'p7'] },
      { joueur_ids: ['p6', 'p8'] },
    ]

    const allPreviousTeams = [...r1Teams, ...r2Teams]
    const r3Teams = antiRematchTeamFormation(players, allPreviousTeams, [], 2)

    expect(r3Teams.length).toBe(4)

    // Vérifier unicité des joueurs
    const allIds = r3Teams.flatMap(t => t.joueur_ids)
    expect(new Set(allIds).size).toBe(8)

    // Vérifier que les duos sont nouveaux autant que possible
    const previousDuos = allPreviousTeams.map(t => t.joueur_ids.sort().join(','))
    const r3Duos = r3Teams.map(t => t.joueur_ids.sort().join(','))

    // Avec 8 joueurs en doublettes, il y a C(8,2) = 28 duos possibles
    // Après 2 rotations = 8 duos utilisés, il reste 20 options
    // L'algo devrait trouver 4 duos totalement neufs
    const repeats = r3Duos.filter(d => previousDuos.includes(d))
    expect(repeats.length).toBe(0)
  })

  it('devrait résister à l\'épuisement des combinaisons (rotation 8+)', () => {
    // Avec 8 joueurs en doublettes: C(8,2) = 28 duos possibles
    // 4 équipes par rotation = 4 duos par rotation
    // 28/4 = 7 rotations max sans aucune répétition théorique
    // À la rotation 8, des répétitions sont inévitables

    let allPreviousTeams: Array<{ joueur_ids: string[] }> = []
    let allPreviousMatches: Array<{ equipe_a_joueur_ids: string[]; equipe_b_joueur_ids: string[] }> = []

    for (let rotation = 0; rotation < 10; rotation++) {
      const result = antiRematchTeamFormation(players, allPreviousTeams, allPreviousMatches, 2)

      // L'algo ne doit JAMAIS crasher, même après épuisement
      expect(result.length).toBe(4)
      expect(result.every(t => t.joueur_ids.length === 2)).toBe(true)

      // Ajouter à l'historique
      allPreviousTeams = [...allPreviousTeams, ...result]

      // Simuler des matchs round-robin entre les équipes
      for (let i = 0; i < result.length; i++) {
        for (let j = i + 1; j < result.length; j++) {
          allPreviousMatches.push({
            equipe_a_joueur_ids: result[i].joueur_ids,
            equipe_b_joueur_ids: result[j].joueur_ids,
          })
        }
      }
    }
  })
})

// ─── EDGE CASES PLAN GRATUIT ───────────────────────────────────

describe('Edge Cases Plan Gratuit', () => {
  it('4 équipes (minimum) → 1 poule de 4, pas de demi', () => {
    const teams = Array.from({ length: 4 }, (_, i) =>
      makeTeam(`t${i + 1}`, `Équipe ${i + 1}`)
    )

    const pools = snakeDraftDistribution(teams, 4)
    expect(Object.keys(pools).length).toBe(1)
    expect(pools['A'].length).toBe(4)

    const matches = generateBergerMatches(pools['A'], 'A')
    expect(matches.length).toBe(6)

    // Avec 1 poule, 2 qualifiés → finale directe
    const bracket = calculateBracketMatches(2)
    expect(bracket.round).toBe('finale')
    expect(bracket.nbMatches).toBe(1)
  })

  it('5 équipes → poules de 3: [3, 2]... mais 2 est invalide !', () => {
    // calculateBalancedPoolSizes donne [3, 2]
    // Mais une poule de 2 = 1 seul match, pas un vrai round-robin
    const sizes = calculateBalancedPoolSizes(5, 3)
    expect(sizes).toEqual([3, 2])

    // On vérifie que le round-robin fonctionne quand même avec 2 équipes
    const teams2 = [
      { id: 't1', name: 'Équipe 1' },
      { id: 't2', name: 'Équipe 2' },
    ]
    const matches = generateBergerMatches(teams2, 'B')
    expect(matches.length).toBe(1) // Juste 1 match, mais ça marche
  })

  it('6 équipes → 2 poules de 3', () => {
    const sizes = calculateBalancedPoolSizes(6, 3)
    expect(sizes).toEqual([3, 3])

    const teams = Array.from({ length: 6 }, (_, i) =>
      ({ id: `t${i + 1}`, name: `Équipe ${i + 1}` })
    )
    const pools = snakeDraftDistribution(teams, 3)

    expect(pools['A'].length).toBe(3)
    expect(pools['B'].length).toBe(3)
  })

  it('7 équipes → poules de 4: [4, 3]', () => {
    const sizes = calculateBalancedPoolSizes(7, 4)
    expect(sizes).toEqual([4, 3])
  })

  it('8 équipes en poules de 3 → [3, 3, 2]', () => {
    const sizes = calculateBalancedPoolSizes(8, 3)
    expect(sizes).toEqual([3, 3, 2])

    // 3 poules, 2 qualifiés par poule = 6 qualifiés
    // 6 qualifiés → quarts de finale
    const bracket = calculateBracketMatches(6)
    expect(bracket.round).toBe('quart')
    expect(bracket.nbMatches).toBe(4)
    expect(bracket.hasByes).toBe(true)
    expect(bracket.nbByes).toBe(2) // 8 - 6 = 2 BYE
  })

  it('8 équipes en poules de 4 → 2 poules, 2 qualifiés = 4 → demi', () => {
    const bracket = calculateBracketMatches(4)
    expect(bracket.round).toBe('demi')
    expect(bracket.nbMatches).toBe(2)
  })

  it('le seeding devrait empêcher les rematches de même poule', () => {
    // 2 poules de 4, 2 qualifiés chacune
    const qualified = [
      { id: 't1', name: '1er A', poule: 'A' },
      { id: 't2', name: '2ème A', poule: 'A' },
      { id: 't5', name: '1er B', poule: 'B' },
      { id: 't6', name: '2ème B', poule: 'B' },
    ]

    const seeded = applySeedingByRank(qualified, 2, 2)

    // Paires de demi: [0,1] et [2,3]
    // seeded[0] et seeded[1] ne doivent PAS être de la même poule
    const match1Poules = [
      qualified.find(q => q.id === seeded[0].id)!.poule,
      qualified.find(q => q.id === seeded[1].id)!.poule,
    ]
    expect(match1Poules[0]).not.toBe(match1Poules[1])

    const match2Poules = [
      qualified.find(q => q.id === seeded[2].id)!.poule,
      qualified.find(q => q.id === seeded[3].id)!.poule,
    ]
    expect(match2Poules[0]).not.toBe(match2Poules[1])
  })

  it('nombre impair de joueurs en mêlée fixe: 7 joueurs doublette', () => {
    const players = Array.from({ length: 7 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Joueur ${i + 1}`,
      gender: (i % 2 === 0 ? 'H' : 'F') as 'H' | 'F',
    }))

    const result = MixiteService.createTeamsWithMixite(players, 2, false)

    expect(result.teams.length).toBe(3) // 7/2 = 3 équipes
    expect(result.unassignedPlayerIds.length).toBe(1) // 1 joueur exclu
    expect(result.warnings.length).toBeGreaterThan(0) // Warning émis
  })

  it('nombre impair de joueurs en mêlée fixe: 5 joueurs triplette', () => {
    const players = Array.from({ length: 5 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Joueur ${i + 1}`,
      gender: (i % 2 === 0 ? 'H' : 'F') as 'H' | 'F',
    }))

    const result = MixiteService.createTeamsWithMixite(players, 3, false)

    expect(result.teams.length).toBe(1) // 5/3 = 1 équipe
    expect(result.unassignedPlayerIds.length).toBe(2) // 2 joueurs exclus
  })

  it('aucune équipe de genre uniquement masculin quand mixité obligatoire et ratio équilibré', () => {
    const players = Array.from({ length: 8 }, (_, i) => ({
      id: `p${i + 1}`,
      name: `Joueur ${i + 1}`,
      gender: (i < 4 ? 'H' : 'F') as 'H' | 'F', // 4H + 4F
    }))

    const result = MixiteService.createTeamsWithMixite(players, 2, true)
    const stats = MixiteService.getMixiteStats(result.teams, players)

    expect(stats.mixed).toBe(4)
    expect(stats.maleOnly).toBe(0)
    expect(stats.femaleOnly).toBe(0)
  })
})

// ─── SIMULATION COMPLÈTE BOUT EN BOUT ──────────────────────────

describe('Simulation bout en bout : tournoi complet plan gratuit', () => {
  it('devrait simuler un tournoi de 8 équipes de bout en bout sans erreur', () => {
    // 1. Créer 8 équipes
    const teams = Array.from({ length: 8 }, (_, i) =>
      ({ id: `t${i + 1}`, name: `Équipe ${i + 1}` })
    )

    // 2. Distribuer en poules (snake draft)
    const pools = snakeDraftDistribution(teams, 4)
    expect(Object.keys(pools).length).toBe(2)

    // 3. Générer les matchs (Berger) + terrains
    const allMatchData: Array<{ id: string; teamA: any; teamB: any; tour: number; poule: string }> = []
    let matchIdx = 0

    for (const [poolName, poolTeams] of Object.entries(pools)) {
      const matches = generateBergerMatches(poolTeams, poolName)
      for (const m of matches) {
        allMatchData.push({
          id: `m${matchIdx++}`,
          teamA: m.teamA,
          teamB: m.teamB,
          tour: m.tour,
          poule: poolName,
        })
      }
    }

    expect(allMatchData.length).toBe(12) // 6 × 2 poules

    // 4. Assigner terrains
    const terrainInput = allMatchData.map(m => ({
      id: m.id,
      equipe_a_id: m.teamA.id,
      equipe_b_id: m.teamB.id,
      tour: m.tour,
    }))
    const terrainAssignment = smartTerrainAssignment(terrainInput, 4)
    expect(terrainAssignment.size).toBe(12)

    // 5. Simuler les résultats (score aléatoire mais cohérent)
    const matchResults: Match[] = allMatchData.map(m =>
      makeMatch(m.id, m.teamA, m.teamB,
        13, Math.floor(Math.random() * 12), // Gagnant toujours teamA pour simplifier
        m.poule
      )
    )

    // 6. Calculer le classement de chaque poule
    const qualifiedAll: Array<{ id: string; name: string; poule: string }> = []

    for (const poolName of Object.keys(pools)) {
      const poolTeamsList = pools[poolName]
      const poolMatches = matchResults.filter(m => m.poule === poolName)

      const stats = poolTeamsList.map(team =>
        calculateTeamStats(team.id, team.name, poolMatches)
      )
      const rankings = sortTeamsByFIPJPRules(stats)

      // Prendre les 2 premiers
      qualifiedAll.push(
        { id: rankings[0].id, name: rankings[0].name, poule: poolName },
        { id: rankings[1].id, name: rankings[1].name, poule: poolName },
      )
    }

    expect(qualifiedAll.length).toBe(4)

    // 7. Seeding
    const seeded = applySeedingByRank(qualifiedAll, 2, 2)
    expect(seeded.length).toBe(4)

    // 8. Bracket
    const bracket = calculateBracketMatches(4)
    expect(bracket.round).toBe('demi')
    expect(bracket.nbMatches).toBe(2)

    // 9. Paires de demi-finale
    const firstRound = generateFirstRoundPairs(seeded)
    expect(firstRound.length).toBe(2)
    expect(firstRound.every(m => m.teamA !== null && m.teamB !== null)).toBe(true)
    expect(firstRound.every(m => !m.isBye)).toBe(true)

    // Le tournoi complet fonctionne sans erreur !
  })
})
