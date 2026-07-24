/**
 * Tests unitaires pour le service de statistiques
 * Vérifie que les calculs suivent bien les règles FIPJP
 */

import {
  calculateTeamStats,
  calculatePlayerStats,
  sortTeamsByFIPJPRules,
  sortTeamsByCriteria,
  sortPlayersByFIPJPRules,
  groupTeamsByPoule,
  type TeamStats,
} from '../stats.service'
import type { Match, Joueur } from '@/lib/types'

describe('StatsService', () => {
  describe('calculateTeamStats', () => {
    it('devrait calculer correctement les stats pour une équipe avec 3 victoires', () => {
      const matches: Match[] = [
        {
          id: '1',
          tournoi_id: 't1',
          equipe_a: { id: 'team1', name: 'Team 1', joueur_ids: [], tournoi_id: 't1' },
          equipe_b: { id: 'team2', name: 'Team 2', joueur_ids: [], tournoi_id: 't1' },
          equipe_a_id: 'team1',
          equipe_b_id: 'team2',
          score_a: 13,
          score_b: 5,
          status: 'termine',
          type: 'poule',
          tour: 1,
          terrain: 1,
          poule: 'A',
          round: null,
          manches_json: null,
          started_at: null,
          ended_at: null,
          validated_at: null,
          played_at: null,
          proposed_by: null,
          proposed_at: null,
          winner_id: 'team1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
        {
          id: '2',
          tournoi_id: 't1',
          equipe_a: { id: 'team1', name: 'Team 1', joueur_ids: [], tournoi_id: 't1' },
          equipe_b: { id: 'team3', name: 'Team 3', joueur_ids: [], tournoi_id: 't1' },
          equipe_a_id: 'team1',
          equipe_b_id: 'team3',
          score_a: 13,
          score_b: 8,
          status: 'termine',
          type: 'poule',
          tour: 1,
          terrain: 1,
          poule: 'A',
          round: null,
          manches_json: null,
          started_at: null,
          ended_at: null,
          validated_at: null,
          played_at: null,
          proposed_by: null,
          proposed_at: null,
          winner_id: 'team1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ]

      const stats = calculateTeamStats('team1', 'Team 1', matches)

      expect(stats.victories).toBe(2)
      expect(stats.defeats).toBe(0)
      expect(stats.draws).toBe(0)
      expect(stats.pointsFor).toBe(26) // 13 + 13
      expect(stats.pointsAgainst).toBe(13) // 5 + 8
      expect(stats.difference).toBe(13) // 26 - 13
      expect(stats.points).toBe(6) // 2 victoires × 3
    })

    it('devrait gérer correctement les égalités', () => {
      const matches: Match[] = [
        {
          id: '1',
          tournoi_id: 't1',
          equipe_a: { id: 'team1', name: 'Team 1', joueur_ids: [], tournoi_id: 't1' },
          equipe_b: { id: 'team2', name: 'Team 2', joueur_ids: [], tournoi_id: 't1' },
          equipe_a_id: 'team1',
          equipe_b_id: 'team2',
          score_a: 10,
          score_b: 10,
          status: 'termine',
          type: 'poule',
          tour: 1,
          terrain: 1,
          poule: 'A',
          round: null,
          manches_json: null,
          started_at: null,
          ended_at: null,
          validated_at: null,
          played_at: null,
          proposed_by: null,
          proposed_at: null,
          winner_id: null,
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ]

      const stats = calculateTeamStats('team1', 'Team 1', matches)

      expect(stats.victories).toBe(0)
      expect(stats.defeats).toBe(0)
      expect(stats.draws).toBe(1)
      expect(stats.points).toBe(1) // 1 nul × 1
    })

    it('ne devrait pas compter les matchs BYE', () => {
      const matches: Match[] = [
        {
          id: '1',
          tournoi_id: 't1',
          equipe_a: { id: 'team1', name: 'Team 1', joueur_ids: [], tournoi_id: 't1' },
          equipe_b: null,
          equipe_a_id: 'team1',
          equipe_b_id: null,
          score_a: 0,
          score_b: 0,
          status: 'termine',
          type: 'bye',
          tour: 1,
          terrain: null,
          poule: null,
          round: null,
          manches_json: null,
          started_at: null,
          ended_at: null,
          validated_at: null,
          played_at: null,
          proposed_by: null,
          proposed_at: null,
          winner_id: 'team1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ]

      const stats = calculateTeamStats('team1', 'Team 1', matches)

      expect(stats.played).toBe(0) // BYE ne compte pas comme match joué
      expect(stats.victories).toBe(0)
      expect(stats.points).toBe(0)
    })

    it('devrait gérer une équipe qui joue en tant que team_b', () => {
      const matches: Match[] = [
        {
          id: '1',
          tournoi_id: 't1',
          equipe_a: { id: 'team2', name: 'Team 2', joueur_ids: [], tournoi_id: 't1' },
          equipe_b: { id: 'team1', name: 'Team 1', joueur_ids: [], tournoi_id: 't1' },
          equipe_a_id: 'team2',
          equipe_b_id: 'team1',
          score_a: 8,
          score_b: 13,
          status: 'termine',
          type: 'poule',
          tour: 1,
          terrain: 1,
          poule: 'A',
          round: null,
          manches_json: null,
          started_at: null,
          ended_at: null,
          validated_at: null,
          played_at: null,
          proposed_by: null,
          proposed_at: null,
          winner_id: 'team1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ]

      const stats = calculateTeamStats('team1', 'Team 1', matches)

      expect(stats.victories).toBe(1)
      expect(stats.pointsFor).toBe(13)
      expect(stats.pointsAgainst).toBe(8)
    })
  })

  describe('sortTeamsByFIPJPRules', () => {
    it('devrait trier par nombre de points d\'abord', () => {
      const teams = [
        {
          id: '1',
          name: 'Team 1',
          played: 2,
          victories: 1,
          defeats: 1,
          draws: 0,
          pointsFor: 20,
          pointsAgainst: 20,
          difference: 0,
          points: 3
        },
        {
          id: '2',
          name: 'Team 2',
          played: 2,
          victories: 2,
          defeats: 0,
          draws: 0,
          pointsFor: 26,
          pointsAgainst: 10,
          difference: 16,
          points: 6
        }
      ]

      const sorted = sortTeamsByFIPJPRules(teams)

      expect(sorted[0].id).toBe('2') // Team 2 a plus de points
      expect(sorted[1].id).toBe('1')
    })

    it('en cas d\'égalité de points, devrait trier par différence', () => {
      const teams = [
        {
          id: '1',
          name: 'Team 1',
          played: 3,
          victories: 2,
          defeats: 1,
          draws: 0,
          pointsFor: 28,
          pointsAgainst: 25,
          difference: 3,
          points: 6
        },
        {
          id: '2',
          name: 'Team 2',
          played: 3,
          victories: 2,
          defeats: 1,
          draws: 0,
          pointsFor: 30,
          pointsAgainst: 20,
          difference: 10,
          points: 6
        }
      ]

      const sorted = sortTeamsByFIPJPRules(teams)

      expect(sorted[0].id).toBe('2') // Team 2 a meilleure différence
    })

    it('en cas d\'égalité parfaite, devrait trier alphabétiquement', () => {
      const teams = [
        {
          id: '1',
          name: 'Zèbres',
          played: 2,
          victories: 1,
          defeats: 1,
          draws: 0,
          pointsFor: 20,
          pointsAgainst: 20,
          difference: 0,
          points: 3
        },
        {
          id: '2',
          name: 'Aigles',
          played: 2,
          victories: 1,
          defeats: 1,
          draws: 0,
          pointsFor: 20,
          pointsAgainst: 20,
          difference: 0,
          points: 3
        }
      ]

      const sorted = sortTeamsByFIPJPRules(teams)

      expect(sorted[0].name).toBe('Aigles') // Ordre alphabétique
      expect(sorted[1].name).toBe('Zèbres')
    })
  })

  describe('sortTeamsByCriteria (départage composable — mode Personnalisé)', () => {
    // A et B à égalité de points : A a battu B en direct, mais B a une meilleure
    // différence générale → l'ORDRE des critères choisi doit inverser le classement.
    const mk = (id: string, name: string, difference: number): TeamStats => ({
      id, name, played: 2, victories: 1, defeats: 1, draws: 0,
      pointsFor: 0, pointsAgainst: 0, difference, points: 3,
    })
    const teams = [mk('A', 'Alpha', 3), mk('B', 'Bravo', 5)]
    const matches = [
      { id: 'm1', equipe_a_id: 'A', equipe_b_id: 'B', score_a: 13, score_b: 7, status: 'termine', poule: 'A' },
    ] as unknown as Match[]

    it('confrontation directe prioritaire → A devant B (A a gagné le face-à-face)', () => {
      const sorted = sortTeamsByCriteria(teams, matches, ['points', 'headToHead', 'goalDiff'])
      expect(sorted.map(t => t.id)).toEqual(['A', 'B'])
    })

    it('différence prioritaire → B devant A (meilleure différence générale)', () => {
      const sorted = sortTeamsByCriteria(teams, matches, ['points', 'goalDiff', 'headToHead'])
      expect(sorted.map(t => t.id)).toEqual(['B', 'A'])
    })

    it('l’ordre des critères change réellement le classement', () => {
      const h2h = sortTeamsByCriteria(teams, matches, ['points', 'headToHead', 'goalDiff']).map(t => t.id)
      const diff = sortTeamsByCriteria(teams, matches, ['points', 'goalDiff', 'headToHead']).map(t => t.id)
      expect(h2h).not.toEqual(diff)
    })
  })

  describe('groupTeamsByPoule', () => {
    it('devrait grouper les équipes par poule avec stats triées', () => {
      const teams = [
        { id: 'team1', name: 'Team 1', poule: 'A', joueur_ids: [] },
        { id: 'team2', name: 'Team 2', poule: 'A', joueur_ids: [] },
        { id: 'team3', name: 'Team 3', poule: 'B', joueur_ids: [] }
      ]

      const matches: Match[] = [
        {
          id: '1',
          tournoi_id: 't1',
          equipe_a: { id: 'team1', name: 'Team 1', joueur_ids: [], tournoi_id: 't1' },
          equipe_b: { id: 'team2', name: 'Team 2', joueur_ids: [], tournoi_id: 't1' },
          equipe_a_id: 'team1',
          equipe_b_id: 'team2',
          score_a: 13,
          score_b: 5,
          status: 'termine',
          type: 'poule',
          tour: 1,
          terrain: 1,
          poule: 'A',
          round: null,
          manches_json: null,
          started_at: null,
          ended_at: null,
          validated_at: null,
          played_at: null,
          proposed_by: null,
          proposed_at: null,
          winner_id: 'team1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        }
      ]

      const grouped = groupTeamsByPoule(teams, matches)

      expect(grouped['A']).toHaveLength(2)
      expect(grouped['B']).toHaveLength(1)
      expect(grouped['A'][0].id).toBe('team1') // Vainqueur en tête
      expect(grouped['A'][1].id).toBe('team2')
    })
  })

  describe('mode fair-play (plafond de différence)', () => {
    // Fabrique compacte : team1 (score a) vs team2 (score b)
    const mk = (id: string, a: number, b: number): Match => ({
      id, tournoi_id: 't1',
      equipe_a: { id: 'team1', name: 'Team 1', joueur_ids: [], tournoi_id: 't1' },
      equipe_b: { id: 'team2', name: 'Team 2', joueur_ids: [], tournoi_id: 't1' },
      equipe_a_id: 'team1', equipe_b_id: 'team2',
      score_a: a, score_b: b, status: 'termine', type: 'poule', tour: 1, terrain: 1,
      poule: 'A', round: null, manches_json: null, started_at: null, ended_at: null,
      validated_at: null, played_at: null, proposed_by: null, proposed_at: null,
      winner_id: a > b ? 'team1' : 'team2', created_at: '2024-01-01', updated_at: '2024-01-01'
    } as Match)

    it('sans fair-play : la différence est le total brut (13-0 + 13-11 = +15)', () => {
      const matches = [mk('1', 13, 0), mk('2', 13, 11)]
      const stats = calculateTeamStats('team1', 'Team 1', matches)
      expect(stats.difference).toBe(15)
      expect(stats.pointsFor).toBe(26)
      expect(stats.pointsAgainst).toBe(11)
    })

    it('fair-play : chaque écart est plafonné à ±5 (13-0 → +5, 13-11 → +2 = +7)', () => {
      const matches = [mk('1', 13, 0), mk('2', 13, 11)]
      const stats = calculateTeamStats('team1', 'Team 1', matches, true)
      expect(stats.difference).toBe(7) // min(13,5) + min(2,5)
      // Les points marqués/encaissés restent les vrais scores
      expect(stats.pointsFor).toBe(26)
      expect(stats.pointsAgainst).toBe(11)
    })

    it('fair-play : une lourde défaite est aussi adoucie (0-13 → -5)', () => {
      const stats = calculateTeamStats('team1', 'Team 1', [mk('1', 0, 13)], true)
      expect(stats.difference).toBe(-5)
    })

    it('fair-play : une victoire serrée n\'est pas affectée (13-11 → +2)', () => {
      const stats = calculateTeamStats('team1', 'Team 1', [mk('1', 13, 11)], true)
      expect(stats.difference).toBe(2)
    })

    it('fair-play change le classement : écraser un adversaire ne fait pas monter', () => {
      // team1 gagne large (13-0) ; team2 gagne serré 2× (13-11)
      const matches = [
        mk('1', 13, 0),                          // team1 vs team2 : team1 +13 / team2 -13
      ]
      const t1 = calculateTeamStats('team1', 'Team 1', matches, true)
      const t2 = calculateTeamStats('team2', 'Team 2', matches, true)
      // Sans plafond team1 aurait +13 ; avec fair-play, +5 seulement
      expect(t1.difference).toBe(5)
      expect(t2.difference).toBe(-5)
    })
  })
})
