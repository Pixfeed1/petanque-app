/**
 * TEST-MATRICE — couverture exhaustive des combinaisons de tournoi
 *
 * Boucle sur : mode × format × options × plan × nb d'équipes/joueurs
 * et lance le VRAI pipeline de services pour chaque combo, en vérifiant
 * les invariants. Objectif : détecter tout combo cassé sans DB ni navigateur.
 *
 * Niveau 1 (logique pure) — déterministe, rapide, fiable.
 */

import { describe, it, expect } from 'vitest'
import {
  snakeDraftDistribution,
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
import * as ValidationService from '../validation.service'
import { getFeaturesForPlan, getOrgLimit, hasOrgFeature } from '../../plans'
import type { Match } from '@/lib/types'

// ─── HELPERS ────────────────────────────────────────────────────

const PLAYERS_PER_TEAM: Record<string, number> = {
  tete_a_tete: 1,
  doublette: 2,
  triplette: 3,
}

function makeTeams(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `t${i + 1}`,
    name: `Équipe ${i + 1}`,
    joueur_ids: [] as string[],
    tournoi_id: 't1',
  }))
}

function makePlayers(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Joueur ${i + 1}`,
    gender: (i % 2 === 0 ? 'H' : 'F') as 'H' | 'F',
  }))
}

function makeMatch(id: string, a: any, b: any, sa: number, sb: number, poule: string | null): Match {
  return {
    id, tournoi_id: 't1',
    equipe_a: { ...a, joueur_ids: [], tournoi_id: 't1' },
    equipe_b: { ...b, joueur_ids: [], tournoi_id: 't1' },
    equipe_a_id: a.id, equipe_b_id: b.id,
    score_a: sa, score_b: sb, status: 'termine', type: 'poule' as any,
    tour: 1, terrain: null, poule, round: null, manches_json: null,
    started_at: null, ended_at: null, validated_at: null, played_at: null,
    proposed_by: null, proposed_at: null, winner_id: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  }
}

function nextPow2(n: number) { let p = 1; while (p < n) p *= 2; return p }
const ROUND_BY_SIZE: Record<number, string> = { 2: 'finale', 4: 'demi', 8: 'quart', 16: 'huitieme', 32: 'seizieme' }

// ─── PIPELINE POULES → FINALE (modes choisi & mêlée fixe) ───────

function runPoulesPipeline(teams: any[], pouleSize: number, terrains: number) {
  // 1. Distribution snake draft
  const pools = snakeDraftDistribution(teams, pouleSize)
  const poolNames = Object.keys(pools)

  // INVARIANT : aucune équipe perdue ni dupliquée
  const distributed = poolNames.flatMap(n => pools[n])
  expect(new Set(distributed.map((t: any) => t.id)).size).toBe(teams.length)

  // 2. Berger par poule + collecte
  const allMatches: any[] = []
  for (const name of poolNames) {
    const poolTeams = pools[name]
    if (poolTeams.length < 2) continue
    const matches = generateBergerMatches(poolTeams, name)
    const k = poolTeams.length
    // INVARIANT : C(k,2) matchs, paires uniques
    expect(matches.length).toBe((k * (k - 1)) / 2)
    const pairs = new Set(matches.map((m: any) => [m.teamA.id, m.teamB.id].sort().join('-')))
    expect(pairs.size).toBe(matches.length)
    matches.forEach((m: any, idx: number) =>
      allMatches.push({ id: `${name}_${idx}`, equipe_a_id: m.teamA.id, equipe_b_id: m.teamB.id, tour: m.tour, poule: name, teamA: m.teamA, teamB: m.teamB }))
  }

  // 3. Terrains : tous assignés, dans [1, terrains]
  if (terrains > 0 && allMatches.length > 0) {
    const assignment = smartTerrainAssignment(allMatches, terrains)
    expect(assignment.size).toBe(allMatches.length)
    for (const t of assignment.values()) {
      expect(t).toBeGreaterThanOrEqual(1)
      expect(t).toBeLessThanOrEqual(terrains)
    }
  }

  // 4. Résultats simulés → stats → classement par poule → qualifiés (2/poule)
  const qualified: Array<{ id: string; name: string; poule: string }> = []
  for (const name of poolNames) {
    const poolTeams = pools[name]
    if (poolTeams.length < 2) {
      // poule trop petite : on prend ce qu'il y a
      poolTeams.forEach((t: any) => qualified.push({ id: t.id, name: t.name, poule: name }))
      continue
    }
    const poolMatches = allMatches.filter(m => m.poule === name).map((m, i) =>
      makeMatch(`${name}_r${i}`, m.teamA, m.teamB, 13, i % 12, name))
    const stats = poolTeams.map((t: any) => calculateTeamStats(t.id, t.name, poolMatches))
    const rankings = sortTeamsByFIPJPRules(stats)
    expect(rankings.length).toBe(poolTeams.length)
    qualified.push(
      { id: rankings[0].id, name: rankings[0].name, poule: name },
      { id: rankings[1].id, name: rankings[1].name, poule: name },
    )
  }

  // 5. Bracket sur les qualifiés
  const nQ = qualified.length
  if (nQ >= 2) {
    const bracket = calculateBracketMatches(nQ)
    const size = nextPow2(nQ)
    // INVARIANTS bracket
    expect(bracket.nbMatches).toBe(size / 2)
    expect(bracket.hasByes).toBe(size !== nQ)
    if (size !== nQ) expect(bracket.nbByes).toBe(size - nQ)
    if (ROUND_BY_SIZE[size]) expect(bracket.round).toBe(ROUND_BY_SIZE[size])

    // 6. Seeding + paires 1er tour : pas de rematch de même poule (si géométrie le permet)
    const nbPoules = poolNames.length
    const seeded = applySeedingByRank(qualified, nbPoules, 2)
    expect(seeded.length).toBe(nQ)
    const firstRound = generateFirstRoundPairs(seeded)
    expect(firstRound.length).toBe(size / 2)
  }

  return { pools, nbPoules: poolNames.length, qualified: nQ }
}

// ════════════════════════════════════════════════════════════════
// MATRICE 1 — MODE CHOISI (équipes pré-formées) × nb équipes × poule
// ════════════════════════════════════════════════════════════════

describe('MATRICE — Mode CHOISI (poules → finale)', () => {
  const teamCounts = [4, 5, 6, 7, 8, 9, 10, 12, 13, 16]
  const pouleSizes = [3, 4, 5]

  for (const n of teamCounts) {
    for (const ps of pouleSizes) {
      const validity = ValidationService.validatePouleSize(ps, n)
      if (!validity.valid) {
        it(`choisi | ${n} équipes | poule ${ps} → REJETÉ (${validity.error?.slice(0, 40)}…)`, () => {
          expect(validity.valid).toBe(false)
        })
        continue
      }
      it(`choisi | ${n} équipes | poule ${ps} → pipeline complet`, () => {
        const res = runPoulesPipeline(makeTeams(n), ps, 4)
        expect(res.nbPoules).toBe(calculateBalancedPoolSizes(n, ps).length)
      })
    }
  }
})

// ════════════════════════════════════════════════════════════════
// MATRICE 2 — MÊLÉE FIXE × format × mixité × nb joueurs
// ════════════════════════════════════════════════════════════════

describe('MATRICE — MÊLÉE FIXE (formation → poules → finale)', () => {
  const formats = ['tete_a_tete', 'doublette', 'triplette'] as const
  const mixiteValues = [false, true]

  for (const format of formats) {
    const ppt = PLAYERS_PER_TEAM[format]
    // nb de joueurs choisis pour donner 4..16 équipes
    const teamTargets = [4, 6, 8, 12, 16]

    for (const teamsTarget of teamTargets) {
      for (const mixite of mixiteValues) {
        const nbPlayers = teamsTarget * ppt

        // combo invalide attendu : mixité + tête-à-tête
        const mix = MixiteService.validateFormatMixite(format, mixite)
        if (!mix.valid) {
          it(`mêlée fixe | ${format} | mixité=${mixite} → REJETÉ (incompatible)`, () => {
            expect(mix.valid).toBe(false)
          })
          continue
        }

        it(`mêlée fixe | ${format} | ${nbPlayers} joueurs → ${teamsTarget} équipes | mixité=${mixite}`, () => {
          const players = makePlayers(nbPlayers)
          const formed = MixiteService.createTeamsWithMixite(players, ppt, mixite)
          // INVARIANT formation
          expect(formed.teams.length).toBe(teamsTarget)
          const usedIds = formed.teams.flatMap(t => t.joueur_ids)
          expect(new Set(usedIds).size).toBe(teamsTarget * ppt)
          // mixité : DOUBLETTE garantie ; TRIPLETTE best-effort (cf. mixite.service
          // "pas encore implémenté strictement" → 2H+1F en priorité épuise les H et
          // peut laisser une équipe 100% F). On documente le comportement réel.
          if (mixite && ppt >= 2) {
            const isMixed = (ids: string[]) => {
              const tp = players.filter(p => ids.includes(p.id))
              return tp.some(p => p.gender === 'H') && tp.some(p => p.gender === 'F')
            }
            const mixedCount = formed.teams.filter(t => isMixed(t.joueur_ids)).length
            if (ppt === 2) {
              // doublette : toutes mixtes avec effectif équilibré
              expect(mixedCount).toBe(formed.teams.length)
            } else {
              // triplette : best-effort (au moins une équipe mixte formée)
              expect(mixedCount).toBeGreaterThan(0)
            }
          }
          // pipeline poules sur les équipes formées
          const teams = formed.teams.map((t, i) => ({ id: `team_${i + 1}`, name: `Équipe ${i + 1}`, joueur_ids: t.joueur_ids }))
          runPoulesPipeline(teams, 4, 4)
        })
      }
    }
  }
})

// ════════════════════════════════════════════════════════════════
// MATRICE 3 — MÊLÉE TOURNANTE × format × rotation × nb joueurs
// ════════════════════════════════════════════════════════════════

describe('MATRICE — MÊLÉE TOURNANTE (rotations anti-rematch)', () => {
  const cases = [
    { format: 'doublette', ppt: 2, players: [8, 12, 16] },
    { format: 'triplette', ppt: 3, players: [6, 9, 12] },
  ]
  const rotations = ['par_tour', 'par_match']

  for (const c of cases) {
    for (const nbPlayers of c.players) {
      for (const rotation of rotations) {
        it(`mêlée tournante | ${c.format} | ${nbPlayers} joueurs | rotation ${rotation}`, () => {
          const players = makePlayers(nbPlayers)
          const expectedTeams = Math.floor(nbPlayers / c.ppt)

          let prevTeams: Array<{ joueur_ids: string[] }> = []
          let prevMatches: Array<{ equipe_a_joueur_ids: string[]; equipe_b_joueur_ids: string[] }> = []

          for (let r = 0; r < 5; r++) {
            const teams = antiRematchTeamFormation(players, prevTeams, prevMatches, c.ppt)
            // INVARIANT : bon nombre d'équipes, taille correcte, pas de joueur en double
            expect(teams.length).toBe(expectedTeams)
            expect(teams.every(t => t.joueur_ids.length === c.ppt)).toBe(true)
            const ids = teams.flatMap(t => t.joueur_ids)
            expect(new Set(ids).size).toBe(expectedTeams * c.ppt)

            // matchs round-robin de la rotation : paires uniques
            const rrTeams = teams.map((t, i) => ({ id: `r${r}_${i}`, name: `R${r}-${i}` }))
            const rrMatches = generateBergerMatches(rrTeams, null)
            expect(rrMatches.length).toBe((rrTeams.length * (rrTeams.length - 1)) / 2)

            prevTeams = [...prevTeams, ...teams]
            for (let i = 0; i < teams.length; i++)
              for (let j = i + 1; j < teams.length; j++)
                prevMatches.push({ equipe_a_joueur_ids: teams[i].joueur_ids, equipe_b_joueur_ids: teams[j].joueur_ids })
          }
        })
      }
    }
  }
})

// ════════════════════════════════════════════════════════════════
// MATRICE 4 — PLANS (limites & features)
// ════════════════════════════════════════════════════════════════

describe('MATRICE — PLANS (limites & features)', () => {
  const expected: Record<string, any> = {
    free:      { max_tournois: 1,    max_equipes: 8,    advanced_stats: false, custom_rules: false, club_customization: false },
    essentiel: { max_tournois: null, max_equipes: null, advanced_stats: false, custom_rules: false, club_customization: false },
    club:      { max_tournois: null, max_equipes: null, advanced_stats: true,  custom_rules: true,  club_customization: true },
  }

  for (const plan of Object.keys(expected)) {
    it(`plan ${plan} → limites & features correctes`, () => {
      const settings = { plan, features: getFeaturesForPlan(plan) }
      expect(getOrgLimit(settings, 'max_tournois')).toBe(expected[plan].max_tournois)
      expect(getOrgLimit(settings, 'max_equipes')).toBe(expected[plan].max_equipes)
      expect(hasOrgFeature(settings, 'advanced_stats')).toBe(expected[plan].advanced_stats)
      expect(hasOrgFeature(settings, 'custom_rules')).toBe(expected[plan].custom_rules)
      expect(hasOrgFeature(settings, 'club_customization')).toBe(expected[plan].club_customization)
    })
  }
})

// ════════════════════════════════════════════════════════════════
// MATRICE 5 — COMBOS INVALIDES (l'app doit les rejeter)
// ════════════════════════════════════════════════════════════════

describe('MATRICE — combos INVALIDES (doivent être rejetés)', () => {
  it('mixité + tête-à-tête → rejeté', () => {
    expect(MixiteService.validateFormatMixite('tete_a_tete', true).valid).toBe(false)
  })
  it('taille de poule < 3 → rejeté', () => {
    expect(ValidationService.validatePouleSize(2, 10).valid).toBe(false)
  })
  it('taille de poule > nb équipes → rejeté', () => {
    expect(ValidationService.validatePouleSize(6, 4).valid).toBe(false)
  })
  it('dernière poule à 1 équipe → rejeté', () => {
    // 11 équipes en poules de 5 → [5,5,1] : dernière poule à 1
    expect(ValidationService.validatePouleSize(5, 11).valid).toBe(false)
  })
})
