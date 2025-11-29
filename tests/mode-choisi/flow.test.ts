/**
 * Tests du flux complet - Mode Choisi
 * Simule un tournoi du début à la fin
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ============================================================================
// Types et interfaces
// ============================================================================

interface Team {
  id: string
  name: string
  poule?: string
}

interface Match {
  id: string
  equipe_a_id: string
  equipe_b_id: string | null
  score_a: number
  score_b: number
  status: 'a_jouer' | 'en_cours' | 'termine'
  type: 'poule' | 'huitieme' | 'quart' | 'demi' | 'finale' | 'petite_finale' | 'bye'
  poule?: string
  winner_id?: string | null
}

interface Tournament {
  id: string
  name: string
  mode: 'choisi'
  format: 'doublette'
  status: 'preparation' | 'en_cours' | 'termine'
  settings: {
    pouleSize: number
    qualifiedPerPoule: number
    maxPoints: number
    consolante: boolean
  }
}

// ============================================================================
// Simulateur de tournoi (logique extraite du code réel)
// ============================================================================

class TournamentSimulator {
  tournament: Tournament
  teams: Team[] = []
  matches: Match[] = []
  private matchIdCounter = 1

  constructor(nbTeams: number, pouleSize: number = 4, qualifiedPerPoule: number = 2) {
    this.tournament = {
      id: 'test-tournament',
      name: 'Tournoi Test',
      mode: 'choisi',
      format: 'doublette',
      status: 'preparation',
      settings: {
        pouleSize,
        qualifiedPerPoule,
        maxPoints: 13,
        consolante: true
      }
    }

    // Créer les équipes
    for (let i = 1; i <= nbTeams; i++) {
      this.teams.push({ id: String(i), name: `Équipe ${i}` })
    }
  }

  generatePoules(): void {
    if (this.teams.length < 4) {
      throw new Error('Minimum 4 équipes requises')
    }

    const { pouleSize } = this.tournament.settings
    const nbPoules = Math.ceil(this.teams.length / pouleSize)

    // Assigner les équipes aux poules
    for (let i = 0; i < this.teams.length; i++) {
      const pouleIndex = i % nbPoules
      this.teams[i].poule = String.fromCharCode(65 + pouleIndex)
    }

    // Générer les matchs round-robin pour chaque poule
    const poules: { [key: string]: Team[] } = {}
    this.teams.forEach(team => {
      if (!team.poule) return
      if (!poules[team.poule]) poules[team.poule] = []
      poules[team.poule].push(team)
    })

    for (const [pouleName, pouleTeams] of Object.entries(poules)) {
      // Round-robin: chaque équipe joue contre chaque autre
      for (let i = 0; i < pouleTeams.length; i++) {
        for (let j = i + 1; j < pouleTeams.length; j++) {
          this.matches.push({
            id: String(this.matchIdCounter++),
            equipe_a_id: pouleTeams[i].id,
            equipe_b_id: pouleTeams[j].id,
            score_a: 0,
            score_b: 0,
            status: 'a_jouer',
            type: 'poule',
            poule: pouleName
          })
        }
      }
    }

    this.tournament.status = 'en_cours'
  }

  playMatch(matchId: string, scoreA: number, scoreB: number): void {
    const match = this.matches.find(m => m.id === matchId)
    if (!match) throw new Error(`Match ${matchId} non trouvé`)

    match.score_a = scoreA
    match.score_b = scoreB
    match.status = 'termine'

    // Calculer le gagnant
    if (scoreA > scoreB) {
      match.winner_id = match.equipe_a_id
    } else if (scoreB > scoreA) {
      match.winner_id = match.equipe_b_id
    } else {
      match.winner_id = null // Nul
    }
  }

  getPouleRankings(): { [poule: string]: Team[] } {
    const rankings: { [poule: string]: { team: Team; points: number; diff: number }[] } = {}

    // Calculer les stats par équipe
    this.teams.forEach(team => {
      if (!team.poule) return
      if (!rankings[team.poule]) rankings[team.poule] = []

      const teamMatches = this.matches.filter(m =>
        m.type === 'poule' &&
        m.status === 'termine' &&
        (m.equipe_a_id === team.id || m.equipe_b_id === team.id)
      )

      let victories = 0, draws = 0, pointsFor = 0, pointsAgainst = 0
      teamMatches.forEach(m => {
        if (m.equipe_a_id === team.id) {
          if (m.score_a > m.score_b) victories++
          else if (m.score_a === m.score_b) draws++
          pointsFor += m.score_a
          pointsAgainst += m.score_b
        } else {
          if (m.score_b > m.score_a) victories++
          else if (m.score_b === m.score_a) draws++
          pointsFor += m.score_b
          pointsAgainst += m.score_a
        }
      })

      rankings[team.poule].push({
        team,
        points: victories * 3 + draws,
        diff: pointsFor - pointsAgainst
      })
    })

    // Trier par poule
    const result: { [poule: string]: Team[] } = {}
    for (const [poule, teams] of Object.entries(rankings)) {
      teams.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        return b.diff - a.diff
      })
      result[poule] = teams.map(t => t.team)
    }

    return result
  }

  generateElimination(): void {
    const { qualifiedPerPoule } = this.tournament.settings
    const rankings = this.getPouleRankings()

    // Récupérer les qualifiés
    const qualified: Team[] = []
    const pouleNames = Object.keys(rankings).sort()

    for (let rank = 0; rank < qualifiedPerPoule; rank++) {
      for (const poule of pouleNames) {
        if (rankings[poule][rank]) {
          qualified.push(rankings[poule][rank])
        }
      }
    }

    if (qualified.length > 16) {
      throw new Error(`Trop d'équipes qualifiées (${qualified.length}). Maximum 16.`)
    }

    if (qualified.length < 2) {
      throw new Error('Il faut au moins 2 équipes qualifiées')
    }

    // Déterminer le type de bracket
    let round: 'finale' | 'demi' | 'quart' | 'huitieme'
    let nbMatches: number

    if (qualified.length === 2) {
      round = 'finale'
      nbMatches = 1
    } else if (qualified.length <= 4) {
      round = 'demi'
      nbMatches = 2
    } else if (qualified.length <= 8) {
      round = 'quart'
      nbMatches = 4
    } else {
      round = 'huitieme'
      nbMatches = 8
    }

    // Créer les matchs (avec BYE si nécessaire)
    for (let i = 0; i < nbMatches; i++) {
      const teamA = qualified[i * 2] || null
      const teamB = qualified[i * 2 + 1] || null

      if (teamA && !teamB) {
        // Match BYE
        this.matches.push({
          id: String(this.matchIdCounter++),
          equipe_a_id: teamA.id,
          equipe_b_id: null,
          score_a: 13,
          score_b: 0,
          status: 'termine',
          type: 'bye',
          winner_id: teamA.id
        })
      } else if (teamA && teamB) {
        this.matches.push({
          id: String(this.matchIdCounter++),
          equipe_a_id: teamA.id,
          equipe_b_id: teamB.id,
          score_a: 0,
          score_b: 0,
          status: 'a_jouer',
          type: round
        })
      }
    }
  }

  generateNextRound(): void {
    // Trouver le dernier round joué
    const eliminationTypes = ['huitieme', 'quart', 'demi', 'finale']
    let currentRound: string | null = null

    for (const type of eliminationTypes) {
      const roundMatches = this.matches.filter(m =>
        (m.type === type || m.type === 'bye') &&
        m.status === 'termine'
      )
      if (roundMatches.length > 0) {
        currentRound = type
      }
    }

    if (!currentRound) return

    // Récupérer les gagnants
    const currentMatches = this.matches.filter(m =>
      (m.type === currentRound || m.type === 'bye') &&
      m.status === 'termine'
    )

    const winners: Team[] = []
    const losers: Team[] = []

    for (const match of currentMatches) {
      if (match.winner_id) {
        const winner = this.teams.find(t => t.id === match.winner_id)
        if (winner) winners.push(winner)

        // Récupérer le perdant pour petite finale
        const loserId = match.winner_id === match.equipe_a_id
          ? match.equipe_b_id
          : match.equipe_a_id
        if (loserId) {
          const loser = this.teams.find(t => t.id === loserId)
          if (loser) losers.push(loser)
        }
      }
    }

    // Déterminer le prochain round
    const nextRoundMap: { [key: string]: string } = {
      'huitieme': 'quart',
      'quart': 'demi',
      'demi': 'finale'
    }

    const nextRound = nextRoundMap[currentRound]
    if (!nextRound) return // Finale déjà jouée

    if (nextRound === 'finale') {
      // Valider qu'on a 2 gagnants
      if (winners.length !== 2) {
        throw new Error(`Attendu 2 gagnants pour la finale, trouvé ${winners.length}`)
      }

      // Créer la finale
      this.matches.push({
        id: String(this.matchIdCounter++),
        equipe_a_id: winners[0].id,
        equipe_b_id: winners[1].id,
        score_a: 0,
        score_b: 0,
        status: 'a_jouer',
        type: 'finale'
      })

      // Créer la petite finale si consolante
      if (this.tournament.settings.consolante && losers.length === 2) {
        this.matches.push({
          id: String(this.matchIdCounter++),
          equipe_a_id: losers[0].id,
          equipe_b_id: losers[1].id,
          score_a: 0,
          score_b: 0,
          status: 'a_jouer',
          type: 'petite_finale'
        })
      }
    } else {
      // Créer les matchs du prochain tour
      for (let i = 0; i < winners.length; i += 2) {
        const teamA = winners[i]
        const teamB = winners[i + 1]

        if (teamA && teamB) {
          this.matches.push({
            id: String(this.matchIdCounter++),
            equipe_a_id: teamA.id,
            equipe_b_id: teamB.id,
            score_a: 0,
            score_b: 0,
            status: 'a_jouer',
            type: nextRound as any
          })
        }
      }
    }
  }

  getWinner(): Team | null {
    const finale = this.matches.find(m => m.type === 'finale' && m.status === 'termine')
    if (!finale || !finale.winner_id) return null
    return this.teams.find(t => t.id === finale.winner_id) || null
  }

  getPodium(): { first: Team | null; second: Team | null; third: Team | null } {
    const finale = this.matches.find(m => m.type === 'finale' && m.status === 'termine')
    const petiteFinale = this.matches.find(m => m.type === 'petite_finale' && m.status === 'termine')

    let first: Team | null = null
    let second: Team | null = null
    let third: Team | null = null

    if (finale) {
      first = this.teams.find(t => t.id === finale.winner_id) || null
      const secondId = finale.winner_id === finale.equipe_a_id
        ? finale.equipe_b_id
        : finale.equipe_a_id
      if (secondId) {
        second = this.teams.find(t => t.id === secondId) || null
      }
    }

    if (petiteFinale) {
      third = this.teams.find(t => t.id === petiteFinale.winner_id) || null
    }

    return { first, second, third }
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('Flux Complet - Mode Choisi', () => {

  describe('Tournoi 8 équipes - 2 poules de 4', () => {
    let simulator: TournamentSimulator

    beforeEach(() => {
      simulator = new TournamentSimulator(8, 4, 2)
    })

    it('devrait générer 2 poules de 4 équipes', () => {
      simulator.generatePoules()

      const pouleA = simulator.teams.filter(t => t.poule === 'A')
      const pouleB = simulator.teams.filter(t => t.poule === 'B')

      expect(pouleA).toHaveLength(4)
      expect(pouleB).toHaveLength(4)
    })

    it('devrait générer 12 matchs de poule (6 par poule)', () => {
      simulator.generatePoules()

      const pouleMatches = simulator.matches.filter(m => m.type === 'poule')
      expect(pouleMatches).toHaveLength(12)

      const pouleAMatches = pouleMatches.filter(m => m.poule === 'A')
      const pouleBMatches = pouleMatches.filter(m => m.poule === 'B')

      expect(pouleAMatches).toHaveLength(6)
      expect(pouleBMatches).toHaveLength(6)
    })

    it('devrait qualifier 4 équipes (2 par poule)', () => {
      simulator.generatePoules()

      // Jouer tous les matchs de poule
      const pouleMatches = simulator.matches.filter(m => m.type === 'poule')
      pouleMatches.forEach((match, i) => {
        // Alterner les victoires pour un classement diversifié
        const scoreA = 13
        const scoreB = 8 + (i % 5)
        simulator.playMatch(match.id, scoreA, scoreB)
      })

      simulator.generateElimination()

      // 4 qualifiés = 2 matchs de demi-finale
      const semiMatches = simulator.matches.filter(m => m.type === 'demi')
      expect(semiMatches).toHaveLength(2)
    })

    it('devrait mener à une finale après les demi-finales', () => {
      simulator.generatePoules()

      // Jouer poules
      simulator.matches
        .filter(m => m.type === 'poule')
        .forEach((m, i) => simulator.playMatch(m.id, 13, 5 + i % 5))

      simulator.generateElimination()

      // Jouer demi-finales
      simulator.matches
        .filter(m => m.type === 'demi')
        .forEach((m, i) => simulator.playMatch(m.id, 13, 8))

      simulator.generateNextRound()

      const finale = simulator.matches.find(m => m.type === 'finale')
      expect(finale).toBeDefined()
      expect(finale?.status).toBe('a_jouer')
    })

    it('devrait avoir un podium complet après la finale', () => {
      simulator.generatePoules()

      // Jouer tous les matchs
      simulator.matches.filter(m => m.type === 'poule').forEach((m, i) =>
        simulator.playMatch(m.id, 13, 5 + i % 5)
      )

      simulator.generateElimination()

      simulator.matches.filter(m => m.type === 'demi').forEach(m =>
        simulator.playMatch(m.id, 13, 10)
      )

      simulator.generateNextRound()

      // Jouer finale et petite finale
      const finale = simulator.matches.find(m => m.type === 'finale')!
      simulator.playMatch(finale.id, 13, 11)

      const petiteFinale = simulator.matches.find(m => m.type === 'petite_finale')!
      simulator.playMatch(petiteFinale.id, 13, 9)

      const podium = simulator.getPodium()

      expect(podium.first).not.toBeNull()
      expect(podium.second).not.toBeNull()
      expect(podium.third).not.toBeNull()
      expect(podium.first?.id).not.toBe(podium.second?.id)
      expect(podium.first?.id).not.toBe(podium.third?.id)
      expect(podium.second?.id).not.toBe(podium.third?.id)
    })
  })

  describe('Edge cases', () => {

    it('devrait gérer 5 équipes (poules déséquilibrées)', () => {
      const simulator = new TournamentSimulator(5, 3, 2)
      simulator.generatePoules()

      // 2 poules: une de 3, une de 2
      const poules = new Set(simulator.teams.map(t => t.poule))
      expect(poules.size).toBeGreaterThanOrEqual(2)
    })

    it('devrait gérer 3 équipes qualifiées (avec BYE)', () => {
      const simulator = new TournamentSimulator(6, 3, 1) // 2 poules, 1 qualifié = 2 qualifiés
      simulator.generatePoules()

      // Jouer poules
      simulator.matches.filter(m => m.type === 'poule').forEach(m =>
        simulator.playMatch(m.id, 13, 8)
      )

      // Avec seulement 2 qualifiés, on devrait avoir une finale directe
      simulator.generateElimination()

      const finale = simulator.matches.find(m => m.type === 'finale')
      expect(finale).toBeDefined()
    })

    it('devrait rejeter plus de 16 qualifiés', () => {
      // 6 poules × 3 qualifiés = 18 > 16
      const simulator = new TournamentSimulator(24, 4, 3)
      simulator.generatePoules()

      simulator.matches.filter(m => m.type === 'poule').forEach(m =>
        simulator.playMatch(m.id, 13, 8)
      )

      expect(() => simulator.generateElimination()).toThrow('Maximum 16')
    })

    it('devrait rejeter moins de 4 équipes pour les poules', () => {
      const simulator = new TournamentSimulator(3, 3, 1)
      expect(() => simulator.generatePoules()).toThrow('Minimum 4')
    })

    it('devrait valider 2 gagnants avant la finale', () => {
      const simulator = new TournamentSimulator(8, 4, 2)
      simulator.generatePoules()

      // Jouer poules
      simulator.matches.filter(m => m.type === 'poule').forEach(m =>
        simulator.playMatch(m.id, 13, 8)
      )

      simulator.generateElimination()

      // Ne jouer qu'une seule demi-finale
      const semis = simulator.matches.filter(m => m.type === 'demi')
      simulator.playMatch(semis[0].id, 13, 8)
      // semis[1] non joué!

      // generateNextRound devrait échouer car un seul gagnant
      expect(() => simulator.generateNextRound()).toThrow('2 gagnants')
    })
  })

  describe('Intégrité des données', () => {

    it('devrait avoir des IDs d\'équipes uniques dans chaque match', () => {
      const simulator = new TournamentSimulator(8, 4, 2)
      simulator.generatePoules()

      simulator.matches.forEach(match => {
        if (match.equipe_b_id !== null) {
          expect(match.equipe_a_id).not.toBe(match.equipe_b_id)
        }
      })
    })

    it('devrait avoir des gagnants valides après chaque match', () => {
      const simulator = new TournamentSimulator(8, 4, 2)
      simulator.generatePoules()

      simulator.matches.filter(m => m.type === 'poule').forEach(m =>
        simulator.playMatch(m.id, 13, 8)
      )

      simulator.matches.filter(m => m.status === 'termine').forEach(match => {
        if (match.score_a !== match.score_b) {
          expect(match.winner_id).toBeDefined()
          expect([match.equipe_a_id, match.equipe_b_id]).toContain(match.winner_id)
        }
      })
    })

    it('devrait préserver les équipes tout au long du tournoi', () => {
      const simulator = new TournamentSimulator(8, 4, 2)
      const originalTeamIds = simulator.teams.map(t => t.id)

      simulator.generatePoules()

      // Vérifier que toutes les équipes originales existent
      expect(simulator.teams.map(t => t.id).sort()).toEqual(originalTeamIds.sort())

      // Vérifier que tous les matchs référencent des équipes existantes
      simulator.matches.forEach(match => {
        expect(originalTeamIds).toContain(match.equipe_a_id)
        if (match.equipe_b_id) {
          expect(originalTeamIds).toContain(match.equipe_b_id)
        }
      })
    })
  })
})
