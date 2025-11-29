/**
 * Tests d'intégration API pour le mode Choisi
 * Simule les appels API sans base de données réelle
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ============================================================================
// Types simulés
// ============================================================================

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

interface Tournament {
  id: string
  name: string
  mode: 'choisi' | 'melee_fixe' | 'melee_tournante'
  format: 'tete_a_tete' | 'doublette' | 'triplette'
  status: 'preparation' | 'en_cours' | 'termine'
  settings: {
    pouleSize: number
    qualifiedPerPoule: number
    maxPoints: number
    timeLimit: boolean
    consolante: boolean
  }
}

interface Team {
  id: string
  name: string
  joueur_ids: string[]
  tournoi_id: string
  poule?: string
  stats?: {
    played: number
    victories: number
    defeats: number
    draws: number
    pointsFor: number
    pointsAgainst: number
  }
}

interface Match {
  id: string
  equipe_a_id: string
  equipe_b_id: string | null
  score_a: number | null
  score_b: number | null
  status: 'a_jouer' | 'en_cours' | 'termine'
  type: 'poule' | 'huitieme' | 'quart' | 'demi' | 'finale' | 'petite_finale' | 'bye'
  poule?: string
  terrain?: number
  winner_id?: string | null
}

// ============================================================================
// Mock API Client pour Mode Choisi
// ============================================================================

class MockChoisiApiClient {
  private tournaments: Map<string, Tournament> = new Map()
  private teams: Map<string, Team> = new Map()
  private matches: Map<string, Match> = new Map()

  private async delay(ms: number = 10): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // TOURNOIS API
  async createTournament(data: Partial<Tournament>): Promise<ApiResponse<Tournament>> {
    await this.delay()

    if (!data.name || data.name.trim().length < 3) {
      return { success: false, error: 'Le nom doit contenir au moins 3 caractères' }
    }

    if (data.mode !== 'choisi') {
      return { success: false, error: 'Ce client est pour le mode choisi uniquement' }
    }

    const settings = data.settings || {
      pouleSize: 4,
      qualifiedPerPoule: 2,
      maxPoints: 13,
      timeLimit: false,
      consolante: true
    }

    // Validation settings
    if (settings.qualifiedPerPoule >= settings.pouleSize) {
      return { success: false, error: `Qualifiés (${settings.qualifiedPerPoule}) doit être < taille poule (${settings.pouleSize})` }
    }

    if (settings.maxPoints < 11 || settings.maxPoints > 21) {
      return { success: false, error: 'maxPoints doit être entre 11 et 21' }
    }

    const tournament: Tournament = {
      id: `t_${Date.now()}`,
      name: data.name,
      mode: 'choisi',
      format: data.format || 'doublette',
      status: 'preparation',
      settings
    }

    this.tournaments.set(tournament.id, tournament)
    return { success: true, data: tournament }
  }

  async getTournament(id: string): Promise<ApiResponse<Tournament>> {
    await this.delay()
    const tournament = this.tournaments.get(id)
    if (!tournament) {
      return { success: false, error: 'Tournoi non trouvé' }
    }
    return { success: true, data: tournament }
  }

  // EQUIPES API
  async createTeam(data: Partial<Team>): Promise<ApiResponse<Team>> {
    await this.delay()

    if (!data.name || data.name.trim() === '') {
      return { success: false, error: 'Le nom de l\'équipe est requis' }
    }

    if (!data.tournoi_id) {
      return { success: false, error: 'tournoi_id est requis' }
    }

    if (!data.joueur_ids || data.joueur_ids.length === 0) {
      return { success: false, error: 'L\'équipe doit avoir au moins un joueur' }
    }

    const team: Team = {
      id: `eq_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      name: data.name,
      joueur_ids: data.joueur_ids,
      tournoi_id: data.tournoi_id,
      poule: data.poule,
      stats: {
        played: 0,
        victories: 0,
        defeats: 0,
        draws: 0,
        pointsFor: 0,
        pointsAgainst: 0
      }
    }

    this.teams.set(team.id, team)
    return { success: true, data: team }
  }

  async getTeamsByTournament(tournoiId: string): Promise<ApiResponse<Team[]>> {
    await this.delay()
    const teams = Array.from(this.teams.values()).filter(t => t.tournoi_id === tournoiId)
    return { success: true, data: teams }
  }

  async assignTeamsToPoules(tournoiId: string): Promise<ApiResponse<{ assigned: number }>> {
    await this.delay()

    const tournament = this.tournaments.get(tournoiId)
    if (!tournament) {
      return { success: false, error: 'Tournoi non trouvé' }
    }

    const teams = Array.from(this.teams.values()).filter(t => t.tournoi_id === tournoiId)

    if (teams.length < 4) {
      return { success: false, error: `Minimum 4 équipes requises. Vous en avez ${teams.length}.` }
    }

    const { pouleSize } = tournament.settings
    const nbPoules = Math.ceil(teams.length / pouleSize)

    // Assigner en round-robin
    teams.forEach((team, i) => {
      const pouleIndex = i % nbPoules
      team.poule = String.fromCharCode(65 + pouleIndex) // A, B, C...
      this.teams.set(team.id, team)
    })

    return { success: true, data: { assigned: teams.length } }
  }

  // MATCHS API
  async generatePouleMatches(tournoiId: string): Promise<ApiResponse<{ created: number }>> {
    await this.delay()

    const teams = Array.from(this.teams.values()).filter(t => t.tournoi_id === tournoiId)
    const poules: { [key: string]: Team[] } = {}

    teams.forEach(team => {
      if (!team.poule) return
      if (!poules[team.poule]) poules[team.poule] = []
      poules[team.poule].push(team)
    })

    let created = 0

    for (const [pouleName, pouleTeams] of Object.entries(poules)) {
      // Round-robin
      for (let i = 0; i < pouleTeams.length; i++) {
        for (let j = i + 1; j < pouleTeams.length; j++) {
          const match: Match = {
            id: `m_${Date.now()}_${created}`,
            equipe_a_id: pouleTeams[i].id,
            equipe_b_id: pouleTeams[j].id,
            score_a: null,
            score_b: null,
            status: 'a_jouer',
            type: 'poule',
            poule: pouleName
          }
          this.matches.set(match.id, match)
          created++
        }
      }
    }

    // Mettre le tournoi en cours
    const tournament = this.tournaments.get(tournoiId)
    if (tournament) {
      tournament.status = 'en_cours'
      this.tournaments.set(tournoiId, tournament)
    }

    return { success: true, data: { created } }
  }

  async updateMatchScore(
    matchId: string,
    scoreA: number,
    scoreB: number,
    maxPoints: number,
    timeLimit: boolean
  ): Promise<ApiResponse<Match>> {
    await this.delay()

    const match = this.matches.get(matchId)
    if (!match) {
      return { success: false, error: 'Match non trouvé' }
    }

    // Validations
    if (scoreA < 0 || scoreB < 0) {
      return { success: false, error: 'Score négatif non autorisé' }
    }

    if (scoreA === scoreB && !timeLimit) {
      return { success: false, error: 'Égalité non autorisée sans limite de temps' }
    }

    if (!timeLimit && scoreA < maxPoints && scoreB < maxPoints) {
      return { success: false, error: `Un score doit atteindre ${maxPoints} points` }
    }

    match.score_a = scoreA
    match.score_b = scoreB
    match.status = 'termine'

    // Déterminer gagnant
    if (scoreA > scoreB) {
      match.winner_id = match.equipe_a_id
    } else if (scoreB > scoreA) {
      match.winner_id = match.equipe_b_id
    } else {
      match.winner_id = null // Nul
    }

    // Mettre à jour stats équipes
    const teamA = this.teams.get(match.equipe_a_id)
    const teamB = match.equipe_b_id ? this.teams.get(match.equipe_b_id) : null

    if (teamA && teamA.stats) {
      teamA.stats.played++
      teamA.stats.pointsFor += scoreA
      teamA.stats.pointsAgainst += scoreB
      if (scoreA > scoreB) teamA.stats.victories++
      else if (scoreA < scoreB) teamA.stats.defeats++
      else teamA.stats.draws++
      this.teams.set(teamA.id, teamA)
    }

    if (teamB && teamB.stats) {
      teamB.stats.played++
      teamB.stats.pointsFor += scoreB
      teamB.stats.pointsAgainst += scoreA
      if (scoreB > scoreA) teamB.stats.victories++
      else if (scoreB < scoreA) teamB.stats.defeats++
      else teamB.stats.draws++
      this.teams.set(teamB.id, teamB)
    }

    this.matches.set(matchId, match)
    return { success: true, data: match }
  }

  async getMatchesByTournament(tournoiId: string): Promise<ApiResponse<Match[]>> {
    await this.delay()
    const tournamentTeams = Array.from(this.teams.values())
      .filter(t => t.tournoi_id === tournoiId)
      .map(t => t.id)

    const matches = Array.from(this.matches.values()).filter(m =>
      tournamentTeams.includes(m.equipe_a_id) ||
      (m.equipe_b_id && tournamentTeams.includes(m.equipe_b_id))
    )

    return { success: true, data: matches }
  }

  async generateEliminationBracket(tournoiId: string): Promise<ApiResponse<{ created: number; round: string }>> {
    await this.delay()

    const tournament = this.tournaments.get(tournoiId)
    if (!tournament) {
      return { success: false, error: 'Tournoi non trouvé' }
    }

    // Vérifier que tous les matchs de poule sont terminés
    const matches = Array.from(this.matches.values()).filter(m => m.type === 'poule')
    const unfinished = matches.filter(m => m.status !== 'termine')
    if (unfinished.length > 0) {
      return { success: false, error: `${unfinished.length} match(s) de poule non terminé(s)` }
    }

    // Vérifier pas d'égalités
    const draws = matches.filter(m => m.score_a === m.score_b)
    if (draws.length > 0) {
      return { success: false, error: 'Égalités détectées dans les poules' }
    }

    // Calculer classement par poule
    const teams = Array.from(this.teams.values()).filter(t => t.tournoi_id === tournoiId)
    const pouleRankings: { [poule: string]: Team[] } = {}

    teams.forEach(team => {
      if (!team.poule) return
      if (!pouleRankings[team.poule]) pouleRankings[team.poule] = []
      pouleRankings[team.poule].push(team)
    })

    // Trier par FIPJP
    for (const poule of Object.keys(pouleRankings)) {
      pouleRankings[poule].sort((a, b) => {
        const pointsA = (a.stats?.victories || 0) * 3 + (a.stats?.draws || 0)
        const pointsB = (b.stats?.victories || 0) * 3 + (b.stats?.draws || 0)
        if (pointsB !== pointsA) return pointsB - pointsA

        const diffA = (a.stats?.pointsFor || 0) - (a.stats?.pointsAgainst || 0)
        const diffB = (b.stats?.pointsFor || 0) - (b.stats?.pointsAgainst || 0)
        return diffB - diffA
      })
    }

    // Récupérer qualifiés
    const { qualifiedPerPoule } = tournament.settings
    const qualified: Team[] = []
    const pouleNames = Object.keys(pouleRankings).sort()

    for (let rank = 0; rank < qualifiedPerPoule; rank++) {
      for (const poule of pouleNames) {
        if (pouleRankings[poule][rank]) {
          qualified.push(pouleRankings[poule][rank])
        }
      }
    }

    if (qualified.length > 16) {
      return { success: false, error: `Trop de qualifiés (${qualified.length}). Maximum 16.` }
    }

    if (qualified.length < 2) {
      return { success: false, error: 'Il faut au moins 2 équipes qualifiées' }
    }

    // Déterminer round et nombre de matchs
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

    // Créer les matchs
    let created = 0
    for (let i = 0; i < nbMatches; i++) {
      const teamA = qualified[i * 2] || null
      const teamB = qualified[i * 2 + 1] || null

      if (teamA && !teamB) {
        // BYE
        const match: Match = {
          id: `m_elim_${Date.now()}_${created}`,
          equipe_a_id: teamA.id,
          equipe_b_id: null,
          score_a: 13,
          score_b: 0,
          status: 'termine',
          type: 'bye',
          winner_id: teamA.id
        }
        this.matches.set(match.id, match)
        created++
      } else if (teamA && teamB) {
        const match: Match = {
          id: `m_elim_${Date.now()}_${created}`,
          equipe_a_id: teamA.id,
          equipe_b_id: teamB.id,
          score_a: null,
          score_b: null,
          status: 'a_jouer',
          type: round
        }
        this.matches.set(match.id, match)
        created++
      }
    }

    return { success: true, data: { created, round } }
  }

  reset(): void {
    this.tournaments.clear()
    this.teams.clear()
    this.matches.clear()
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('API Integration - Mode Choisi', () => {
  let api: MockChoisiApiClient

  beforeEach(() => {
    api = new MockChoisiApiClient()
  })

  describe('Création tournoi mode choisi', () => {

    it('devrait créer un tournoi mode choisi valide', async () => {
      const result = await api.createTournament({
        name: 'Tournoi Printemps 2024',
        mode: 'choisi',
        format: 'doublette',
        settings: {
          pouleSize: 4,
          qualifiedPerPoule: 2,
          maxPoints: 13,
          timeLimit: false,
          consolante: true
        }
      })

      expect(result.success).toBe(true)
      expect(result.data?.mode).toBe('choisi')
      expect(result.data?.settings.pouleSize).toBe(4)
      expect(result.data?.settings.qualifiedPerPoule).toBe(2)
    })

    it('devrait rejeter qualifiedPerPoule >= pouleSize', async () => {
      const result = await api.createTournament({
        name: 'Tournoi Test',
        mode: 'choisi',
        format: 'doublette',
        settings: {
          pouleSize: 4,
          qualifiedPerPoule: 4, // Invalide!
          maxPoints: 13,
          timeLimit: false,
          consolante: false
        }
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('doit être <')
    })

    it('devrait rejeter maxPoints hors limites', async () => {
      const result = await api.createTournament({
        name: 'Tournoi Test',
        mode: 'choisi',
        format: 'doublette',
        settings: {
          pouleSize: 4,
          qualifiedPerPoule: 2,
          maxPoints: 25, // Invalide!
          timeLimit: false,
          consolante: false
        }
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('11 et 21')
    })
  })

  describe('Gestion des équipes', () => {

    it('devrait créer une équipe valide', async () => {
      const tournoi = await api.createTournament({
        name: 'Test',
        mode: 'choisi',
        format: 'doublette'
      })

      const result = await api.createTeam({
        name: 'Les Champions',
        joueur_ids: ['p1', 'p2'],
        tournoi_id: tournoi.data!.id
      })

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('Les Champions')
      expect(result.data?.stats?.played).toBe(0)
    })

    it('devrait rejeter équipe sans joueurs', async () => {
      const tournoi = await api.createTournament({
        name: 'Test',
        mode: 'choisi',
        format: 'doublette'
      })

      const result = await api.createTeam({
        name: 'Équipe Vide',
        joueur_ids: [],
        tournoi_id: tournoi.data!.id
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('au moins un joueur')
    })

    it('devrait assigner équipes aux poules en round-robin', async () => {
      const tournoi = await api.createTournament({
        name: 'Test',
        mode: 'choisi',
        format: 'doublette',
        settings: {
          pouleSize: 4,
          qualifiedPerPoule: 2,
          maxPoints: 13,
          timeLimit: false,
          consolante: false
        }
      })

      // Créer 8 équipes
      for (let i = 1; i <= 8; i++) {
        await api.createTeam({
          name: `Équipe ${i}`,
          joueur_ids: [`p${i*2-1}`, `p${i*2}`],
          tournoi_id: tournoi.data!.id
        })
      }

      const result = await api.assignTeamsToPoules(tournoi.data!.id)

      expect(result.success).toBe(true)
      expect(result.data?.assigned).toBe(8)

      const teams = (await api.getTeamsByTournament(tournoi.data!.id)).data!
      const pouleA = teams.filter(t => t.poule === 'A')
      const pouleB = teams.filter(t => t.poule === 'B')

      expect(pouleA.length).toBe(4)
      expect(pouleB.length).toBe(4)
    })

    it('devrait rejeter assignation avec moins de 4 équipes', async () => {
      const tournoi = await api.createTournament({
        name: 'Test',
        mode: 'choisi',
        format: 'doublette'
      })

      // Créer seulement 3 équipes
      for (let i = 1; i <= 3; i++) {
        await api.createTeam({
          name: `Équipe ${i}`,
          joueur_ids: [`p${i*2-1}`, `p${i*2}`],
          tournoi_id: tournoi.data!.id
        })
      }

      const result = await api.assignTeamsToPoules(tournoi.data!.id)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Minimum 4')
    })
  })

  describe('Matchs de poule', () => {

    it('devrait générer matchs round-robin pour chaque poule', async () => {
      const tournoi = await api.createTournament({
        name: 'Test',
        mode: 'choisi',
        format: 'doublette',
        settings: { pouleSize: 4, qualifiedPerPoule: 2, maxPoints: 13, timeLimit: false, consolante: false }
      })

      for (let i = 1; i <= 8; i++) {
        await api.createTeam({
          name: `Équipe ${i}`,
          joueur_ids: [`p${i*2-1}`, `p${i*2}`],
          tournoi_id: tournoi.data!.id
        })
      }

      await api.assignTeamsToPoules(tournoi.data!.id)
      const result = await api.generatePouleMatches(tournoi.data!.id)

      // 2 poules de 4 = 2 × 6 = 12 matchs
      expect(result.success).toBe(true)
      expect(result.data?.created).toBe(12)
    })

    it('devrait mettre à jour score et stats équipes', async () => {
      const tournoi = await api.createTournament({
        name: 'Test',
        mode: 'choisi',
        format: 'doublette',
        settings: { pouleSize: 4, qualifiedPerPoule: 2, maxPoints: 13, timeLimit: false, consolante: false }
      })

      for (let i = 1; i <= 4; i++) {
        await api.createTeam({
          name: `Équipe ${i}`,
          joueur_ids: [`p${i*2-1}`, `p${i*2}`],
          tournoi_id: tournoi.data!.id
        })
      }

      await api.assignTeamsToPoules(tournoi.data!.id)
      await api.generatePouleMatches(tournoi.data!.id)

      const matches = (await api.getMatchesByTournament(tournoi.data!.id)).data!
      const match = matches[0]

      const result = await api.updateMatchScore(match.id, 13, 8, 13, false)

      expect(result.success).toBe(true)
      expect(result.data?.score_a).toBe(13)
      expect(result.data?.score_b).toBe(8)
      expect(result.data?.winner_id).toBe(match.equipe_a_id)

      // Vérifier stats mises à jour
      const teams = (await api.getTeamsByTournament(tournoi.data!.id)).data!
      const teamA = teams.find(t => t.id === match.equipe_a_id)

      expect(teamA?.stats?.victories).toBe(1)
      expect(teamA?.stats?.pointsFor).toBe(13)
    })

    it('devrait rejeter égalité sans timeLimit', async () => {
      const tournoi = await api.createTournament({
        name: 'Test',
        mode: 'choisi',
        format: 'doublette',
        settings: { pouleSize: 4, qualifiedPerPoule: 2, maxPoints: 13, timeLimit: false, consolante: false }
      })

      for (let i = 1; i <= 4; i++) {
        await api.createTeam({
          name: `Équipe ${i}`,
          joueur_ids: [`p${i*2-1}`, `p${i*2}`],
          tournoi_id: tournoi.data!.id
        })
      }

      await api.assignTeamsToPoules(tournoi.data!.id)
      await api.generatePouleMatches(tournoi.data!.id)

      const matches = (await api.getMatchesByTournament(tournoi.data!.id)).data!

      const result = await api.updateMatchScore(matches[0].id, 10, 10, 13, false)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Égalité')
    })

    it('devrait accepter égalité avec timeLimit', async () => {
      const tournoi = await api.createTournament({
        name: 'Test',
        mode: 'choisi',
        format: 'doublette',
        settings: { pouleSize: 4, qualifiedPerPoule: 2, maxPoints: 13, timeLimit: true, consolante: false }
      })

      for (let i = 1; i <= 4; i++) {
        await api.createTeam({
          name: `Équipe ${i}`,
          joueur_ids: [`p${i*2-1}`, `p${i*2}`],
          tournoi_id: tournoi.data!.id
        })
      }

      await api.assignTeamsToPoules(tournoi.data!.id)
      await api.generatePouleMatches(tournoi.data!.id)

      const matches = (await api.getMatchesByTournament(tournoi.data!.id)).data!

      const result = await api.updateMatchScore(matches[0].id, 10, 10, 13, true)

      expect(result.success).toBe(true)
      expect(result.data?.winner_id).toBeNull() // Nul
    })
  })

  describe('Phase éliminatoire', () => {

    it('devrait générer bracket avec qualifiés', async () => {
      const tournoi = await api.createTournament({
        name: 'Test',
        mode: 'choisi',
        format: 'doublette',
        settings: { pouleSize: 4, qualifiedPerPoule: 2, maxPoints: 13, timeLimit: false, consolante: false }
      })

      // 8 équipes = 2 poules de 4 = 4 qualifiés = demi-finales
      for (let i = 1; i <= 8; i++) {
        await api.createTeam({
          name: `Équipe ${i}`,
          joueur_ids: [`p${i*2-1}`, `p${i*2}`],
          tournoi_id: tournoi.data!.id
        })
      }

      await api.assignTeamsToPoules(tournoi.data!.id)
      await api.generatePouleMatches(tournoi.data!.id)

      // Jouer tous les matchs de poule
      const matches = (await api.getMatchesByTournament(tournoi.data!.id)).data!
      for (const match of matches) {
        await api.updateMatchScore(match.id, 13, 8 + Math.floor(Math.random() * 5), 13, false)
      }

      const result = await api.generateEliminationBracket(tournoi.data!.id)

      expect(result.success).toBe(true)
      expect(result.data?.round).toBe('demi')
      expect(result.data?.created).toBe(2)
    })

    it('devrait rejeter si matchs de poule non terminés', async () => {
      const tournoi = await api.createTournament({
        name: 'Test',
        mode: 'choisi',
        format: 'doublette',
        settings: { pouleSize: 4, qualifiedPerPoule: 2, maxPoints: 13, timeLimit: false, consolante: false }
      })

      for (let i = 1; i <= 8; i++) {
        await api.createTeam({
          name: `Équipe ${i}`,
          joueur_ids: [`p${i*2-1}`, `p${i*2}`],
          tournoi_id: tournoi.data!.id
        })
      }

      await api.assignTeamsToPoules(tournoi.data!.id)
      await api.generatePouleMatches(tournoi.data!.id)

      // NE PAS jouer les matchs

      const result = await api.generateEliminationBracket(tournoi.data!.id)

      expect(result.success).toBe(false)
      expect(result.error).toContain('non terminé')
    })

    it('devrait générer BYE pour 3 qualifiés', async () => {
      const tournoi = await api.createTournament({
        name: 'Test',
        mode: 'choisi',
        format: 'doublette',
        settings: { pouleSize: 3, qualifiedPerPoule: 1, maxPoints: 13, timeLimit: false, consolante: false }
      })

      // 9 équipes = 3 poules de 3 = 3 qualifiés
      for (let i = 1; i <= 9; i++) {
        await api.createTeam({
          name: `Équipe ${i}`,
          joueur_ids: [`p${i*2-1}`, `p${i*2}`],
          tournoi_id: tournoi.data!.id
        })
      }

      await api.assignTeamsToPoules(tournoi.data!.id)
      await api.generatePouleMatches(tournoi.data!.id)

      const matches = (await api.getMatchesByTournament(tournoi.data!.id)).data!
      for (const match of matches) {
        await api.updateMatchScore(match.id, 13, 5, 13, false)
      }

      const result = await api.generateEliminationBracket(tournoi.data!.id)

      expect(result.success).toBe(true)
      expect(result.data?.round).toBe('demi')

      const allMatches = (await api.getMatchesByTournament(tournoi.data!.id)).data!
      const byeMatches = allMatches.filter(m => m.type === 'bye')

      expect(byeMatches.length).toBe(1)
    })
  })

  describe('Scénario complet tournoi', () => {

    it('devrait simuler un tournoi complet 8 équipes', async () => {
      // 1. Créer tournoi
      const tournoi = await api.createTournament({
        name: 'Tournoi Complet',
        mode: 'choisi',
        format: 'doublette',
        settings: { pouleSize: 4, qualifiedPerPoule: 2, maxPoints: 13, timeLimit: false, consolante: true }
      })

      expect(tournoi.success).toBe(true)

      // 2. Créer 8 équipes
      for (let i = 1; i <= 8; i++) {
        await api.createTeam({
          name: `Équipe ${i}`,
          joueur_ids: [`p${i*2-1}`, `p${i*2}`],
          tournoi_id: tournoi.data!.id
        })
      }

      // 3. Assigner poules
      const assigned = await api.assignTeamsToPoules(tournoi.data!.id)
      expect(assigned.data?.assigned).toBe(8)

      // 4. Générer matchs poule
      const pouleMatchesResult = await api.generatePouleMatches(tournoi.data!.id)
      expect(pouleMatchesResult.data?.created).toBe(12)

      // 5. Jouer tous les matchs de poule
      let matches = (await api.getMatchesByTournament(tournoi.data!.id)).data!
      for (const match of matches.filter(m => m.type === 'poule')) {
        await api.updateMatchScore(match.id, 13, Math.floor(Math.random() * 12), 13, false)
      }

      // 6. Générer élimination
      const elimResult = await api.generateEliminationBracket(tournoi.data!.id)
      expect(elimResult.data?.round).toBe('demi')

      // 7. Jouer demi-finales
      matches = (await api.getMatchesByTournament(tournoi.data!.id)).data!
      const semis = matches.filter(m => m.type === 'demi')
      expect(semis.length).toBe(2)

      for (const match of semis) {
        await api.updateMatchScore(match.id, 13, 10, 13, false)
      }

      // Vérifier intégrité
      const finalMatches = (await api.getMatchesByTournament(tournoi.data!.id)).data!
      const terminatedCount = finalMatches.filter(m => m.status === 'termine').length

      // 12 poule + 2 demi = 14 terminés
      expect(terminatedCount).toBe(14)
    })
  })
})
