/**
 * Tests d'intégration API pour la mêlée tournante
 * Simule les appels API sans base de données réelle
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

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
    players: string[]
    meleeRotation: 'par_tour' | 'par_match'
    mixiteObligatoire: boolean
    terrains: number
    maxPoints: number
  }
}

interface Team {
  id: string
  name: string
  joueur_ids: string[]
  tournoi_id: string
}

interface Match {
  id: string
  equipe_a_id: string
  equipe_b_id: string | null
  score_a: number | null
  score_b: number | null
  status: 'a_jouer' | 'en_cours' | 'termine'
  tour: number
  type: string
}

interface Joueur {
  id: string
  name: string
  gender?: 'H' | 'F'
}

// ============================================================================
// Mock API Client
// ============================================================================

class MockApiClient {
  private tournaments: Map<string, Tournament> = new Map()
  private teams: Map<string, Team> = new Map()
  private matches: Map<string, Match> = new Map()
  private joueurs: Map<string, Joueur> = new Map()

  // Simuler latence réseau
  private async delay(ms: number = 10): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // TOURNOIS API
  async createTournament(data: Partial<Tournament>): Promise<ApiResponse<Tournament>> {
    await this.delay()

    if (!data.name || data.name.trim().length < 3) {
      return { success: false, error: 'Le nom doit contenir au moins 3 caractères' }
    }

    if (!data.mode || !['choisi', 'melee_fixe', 'melee_tournante'].includes(data.mode)) {
      return { success: false, error: 'Mode invalide' }
    }

    if (!data.format || !['tete_a_tete', 'doublette', 'triplette'].includes(data.format)) {
      return { success: false, error: 'Format invalide' }
    }

    const tournament: Tournament = {
      id: `t_${Date.now()}`,
      name: data.name,
      mode: data.mode,
      format: data.format,
      status: 'preparation',
      settings: {
        players: data.settings?.players || [],
        meleeRotation: data.settings?.meleeRotation || 'par_tour',
        mixiteObligatoire: data.settings?.mixiteObligatoire || false,
        terrains: data.settings?.terrains || 4,
        maxPoints: data.settings?.maxPoints || 13
      }
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

  async updateTournament(id: string, updates: Partial<Tournament>): Promise<ApiResponse<Tournament>> {
    await this.delay()
    const tournament = this.tournaments.get(id)
    if (!tournament) {
      return { success: false, error: 'Tournoi non trouvé' }
    }

    const updated = { ...tournament, ...updates }
    this.tournaments.set(id, updated)
    return { success: true, data: updated }
  }

  // EQUIPES API
  async createTeamsBatch(teams: Partial<Team>[]): Promise<ApiResponse<{ created: number }>> {
    await this.delay()

    if (!teams || teams.length === 0) {
      return { success: false, error: 'Aucune équipe fournie' }
    }

    let created = 0
    for (const teamData of teams) {
      if (!teamData.name || !teamData.tournoi_id) {
        continue
      }

      const team: Team = {
        id: `eq_${Date.now()}_${created}`,
        name: teamData.name,
        joueur_ids: teamData.joueur_ids || [],
        tournoi_id: teamData.tournoi_id
      }

      this.teams.set(team.id, team)
      created++
    }

    return { success: true, data: { created } }
  }

  async getTeamsByTournament(tournoiId: string): Promise<ApiResponse<Team[]>> {
    await this.delay()
    const teams = Array.from(this.teams.values()).filter(t => t.tournoi_id === tournoiId)
    return { success: true, data: teams }
  }

  // MATCHES API
  async createMatchesBatch(matches: Partial<Match>[]): Promise<ApiResponse<{ created: number }>> {
    await this.delay()

    if (!matches || matches.length === 0) {
      return { success: false, error: 'Aucun match fourni' }
    }

    let created = 0
    for (const matchData of matches) {
      if (!matchData.equipe_a_id) {
        continue
      }

      const match: Match = {
        id: `m_${Date.now()}_${created}`,
        equipe_a_id: matchData.equipe_a_id,
        equipe_b_id: matchData.equipe_b_id || null,
        score_a: matchData.score_a ?? null,
        score_b: matchData.score_b ?? null,
        status: matchData.status || 'a_jouer',
        tour: matchData.tour || 1,
        type: matchData.type || 'poule'
      }

      this.matches.set(match.id, match)
      created++
    }

    return { success: true, data: { created } }
  }

  async updateMatch(id: string, updates: Partial<Match>): Promise<ApiResponse<Match>> {
    await this.delay()
    const match = this.matches.get(id)
    if (!match) {
      return { success: false, error: 'Match non trouvé' }
    }

    // Validation scores
    if (updates.score_a !== undefined && updates.score_b !== undefined) {
      if (updates.score_a < 0 || updates.score_b < 0) {
        return { success: false, error: 'Score négatif non autorisé' }
      }
    }

    const updated = { ...match, ...updates }
    this.matches.set(id, updated)
    return { success: true, data: updated }
  }

  async getMatchesByTournament(tournoiId: string): Promise<ApiResponse<Match[]>> {
    await this.delay()
    // Simuler jointure: filtrer par équipes du tournoi
    const tournamentTeams = Array.from(this.teams.values())
      .filter(t => t.tournoi_id === tournoiId)
      .map(t => t.id)

    const matches = Array.from(this.matches.values()).filter(m =>
      tournamentTeams.includes(m.equipe_a_id) ||
      (m.equipe_b_id && tournamentTeams.includes(m.equipe_b_id))
    )

    return { success: true, data: matches }
  }

  // JOUEURS API
  async getJoueursByOrg(orgId: string): Promise<ApiResponse<Joueur[]>> {
    await this.delay()
    return { success: true, data: Array.from(this.joueurs.values()) }
  }

  addJoueur(joueur: Joueur): void {
    this.joueurs.set(joueur.id, joueur)
  }

  // Reset pour tests
  reset(): void {
    this.tournaments.clear()
    this.teams.clear()
    this.matches.clear()
    this.joueurs.clear()
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('API Integration - Mêlée Tournante', () => {
  let api: MockApiClient

  beforeEach(() => {
    api = new MockApiClient()
  })

  describe('Création tournoi mêlée tournante', () => {

    it('devrait créer un tournoi mêlée tournante valide', async () => {
      const result = await api.createTournament({
        name: 'Tournoi Test Mêlée',
        mode: 'melee_tournante',
        format: 'doublette',
        settings: {
          players: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'],
          meleeRotation: 'par_tour',
          mixiteObligatoire: false,
          terrains: 4,
          maxPoints: 13
        }
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data!.mode).toBe('melee_tournante')
      expect(result.data!.status).toBe('preparation')
    })

    it('devrait rejeter nom trop court', async () => {
      const result = await api.createTournament({
        name: 'AB',
        mode: 'melee_tournante',
        format: 'doublette'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('3 caractères')
    })

    it('devrait rejeter mode invalide', async () => {
      const result = await api.createTournament({
        name: 'Tournoi Test',
        mode: 'invalid_mode' as any,
        format: 'doublette'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Mode invalide')
    })

    it('devrait stocker les settings de rotation', async () => {
      const result = await api.createTournament({
        name: 'Tournoi Rotation Par Match',
        mode: 'melee_tournante',
        format: 'triplette',
        settings: {
          players: [],
          meleeRotation: 'par_match',
          mixiteObligatoire: true,
          terrains: 2,
          maxPoints: 11
        }
      })

      expect(result.success).toBe(true)
      expect(result.data!.settings.meleeRotation).toBe('par_match')
      expect(result.data!.settings.mixiteObligatoire).toBe(true)
    })
  })

  describe('Création équipes en batch', () => {

    it('devrait créer plusieurs équipes en une requête', async () => {
      const tournoi = await api.createTournament({
        name: 'Tournoi Batch Test',
        mode: 'melee_tournante',
        format: 'doublette'
      })

      const teams = [
        { name: 'R1-Équipe 1', joueur_ids: ['p1', 'p2'], tournoi_id: tournoi.data!.id },
        { name: 'R1-Équipe 2', joueur_ids: ['p3', 'p4'], tournoi_id: tournoi.data!.id },
        { name: 'R1-Équipe 3', joueur_ids: ['p5', 'p6'], tournoi_id: tournoi.data!.id },
        { name: 'R1-Équipe 4', joueur_ids: ['p7', 'p8'], tournoi_id: tournoi.data!.id }
      ]

      const result = await api.createTeamsBatch(teams)

      expect(result.success).toBe(true)
      expect(result.data!.created).toBe(4)
    })

    it('devrait rejeter batch vide', async () => {
      const result = await api.createTeamsBatch([])

      expect(result.success).toBe(false)
      expect(result.error).toContain('Aucune équipe')
    })

    it('devrait filtrer équipes invalides', async () => {
      const tournoi = await api.createTournament({
        name: 'Test',
        mode: 'melee_tournante',
        format: 'doublette'
      })

      const teams = [
        { name: 'Équipe Valide', joueur_ids: ['p1', 'p2'], tournoi_id: tournoi.data!.id },
        { name: '', joueur_ids: ['p3', 'p4'], tournoi_id: tournoi.data!.id }, // Nom vide
        { name: 'Sans Tournoi', joueur_ids: ['p5', 'p6'] } // Pas de tournoi_id
      ]

      const result = await api.createTeamsBatch(teams as any)

      expect(result.success).toBe(true)
      expect(result.data!.created).toBe(1) // Seule l'équipe valide
    })
  })

  describe('Création matchs round-robin', () => {

    it('devrait créer matchs pour rotation', async () => {
      const tournoi = await api.createTournament({
        name: 'Tournoi Matchs',
        mode: 'melee_tournante',
        format: 'doublette'
      })

      await api.createTeamsBatch([
        { name: 'R1-Eq1', joueur_ids: ['p1', 'p2'], tournoi_id: tournoi.data!.id },
        { name: 'R1-Eq2', joueur_ids: ['p3', 'p4'], tournoi_id: tournoi.data!.id }
      ])

      const teams = (await api.getTeamsByTournament(tournoi.data!.id)).data!

      // Générer matchs round-robin
      const matchesToCreate: Partial<Match>[] = []
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          matchesToCreate.push({
            equipe_a_id: teams[i].id,
            equipe_b_id: teams[j].id,
            tour: 1,
            type: 'poule'
          })
        }
      }

      const result = await api.createMatchesBatch(matchesToCreate)

      expect(result.success).toBe(true)
      expect(result.data!.created).toBe(1) // 2 équipes = 1 match
    })

    it('devrait créer 6 matchs pour 4 équipes (round-robin)', async () => {
      const tournoi = await api.createTournament({
        name: 'Tournoi 4 Équipes',
        mode: 'melee_tournante',
        format: 'doublette'
      })

      await api.createTeamsBatch([
        { name: 'Eq1', joueur_ids: ['p1', 'p2'], tournoi_id: tournoi.data!.id },
        { name: 'Eq2', joueur_ids: ['p3', 'p4'], tournoi_id: tournoi.data!.id },
        { name: 'Eq3', joueur_ids: ['p5', 'p6'], tournoi_id: tournoi.data!.id },
        { name: 'Eq4', joueur_ids: ['p7', 'p8'], tournoi_id: tournoi.data!.id }
      ])

      const teams = (await api.getTeamsByTournament(tournoi.data!.id)).data!

      const matchesToCreate: Partial<Match>[] = []
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          matchesToCreate.push({
            equipe_a_id: teams[i].id,
            equipe_b_id: teams[j].id,
            tour: 1,
            type: 'poule'
          })
        }
      }

      const result = await api.createMatchesBatch(matchesToCreate)

      // n*(n-1)/2 = 4*3/2 = 6 matchs
      expect(result.data!.created).toBe(6)
    })
  })

  describe('Mise à jour scores et progression', () => {

    it('devrait mettre à jour score valide', async () => {
      const tournoi = await api.createTournament({
        name: 'Test Scores',
        mode: 'melee_tournante',
        format: 'doublette'
      })

      await api.createTeamsBatch([
        { name: 'Eq1', joueur_ids: ['p1', 'p2'], tournoi_id: tournoi.data!.id },
        { name: 'Eq2', joueur_ids: ['p3', 'p4'], tournoi_id: tournoi.data!.id }
      ])

      const teams = (await api.getTeamsByTournament(tournoi.data!.id)).data!

      await api.createMatchesBatch([{
        equipe_a_id: teams[0].id,
        equipe_b_id: teams[1].id,
        tour: 1
      }])

      const matches = (await api.getMatchesByTournament(tournoi.data!.id)).data!
      const match = matches[0]

      const result = await api.updateMatch(match.id, {
        score_a: 13,
        score_b: 8,
        status: 'termine'
      })

      expect(result.success).toBe(true)
      expect(result.data!.score_a).toBe(13)
      expect(result.data!.score_b).toBe(8)
      expect(result.data!.status).toBe('termine')
    })

    it('devrait rejeter score négatif', async () => {
      const tournoi = await api.createTournament({
        name: 'Test',
        mode: 'melee_tournante',
        format: 'doublette'
      })

      await api.createTeamsBatch([
        { name: 'Eq1', joueur_ids: ['p1', 'p2'], tournoi_id: tournoi.data!.id },
        { name: 'Eq2', joueur_ids: ['p3', 'p4'], tournoi_id: tournoi.data!.id }
      ])

      const teams = (await api.getTeamsByTournament(tournoi.data!.id)).data!

      await api.createMatchesBatch([{
        equipe_a_id: teams[0].id,
        equipe_b_id: teams[1].id
      }])

      const matches = (await api.getMatchesByTournament(tournoi.data!.id)).data!

      const result = await api.updateMatch(matches[0].id, {
        score_a: -5,
        score_b: 10
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('négatif')
    })

    it('devrait mettre à jour statut tournoi après matchs terminés', async () => {
      const tournoi = await api.createTournament({
        name: 'Test Statut',
        mode: 'melee_tournante',
        format: 'doublette'
      })

      // Simuler passage en_cours
      const updated = await api.updateTournament(tournoi.data!.id, {
        status: 'en_cours'
      })

      expect(updated.data!.status).toBe('en_cours')

      // Simuler fin
      const finished = await api.updateTournament(tournoi.data!.id, {
        status: 'termine'
      })

      expect(finished.data!.status).toBe('termine')
    })
  })

  describe('Scénario complet rotation', () => {

    it('devrait simuler 2 rotations complètes', async () => {
      // Setup joueurs
      for (let i = 1; i <= 8; i++) {
        api.addJoueur({
          id: `p${i}`,
          name: `Joueur ${i}`,
          gender: i <= 4 ? 'H' : 'F'
        })
      }

      // Créer tournoi
      const tournoi = await api.createTournament({
        name: 'Tournoi 2 Rotations',
        mode: 'melee_tournante',
        format: 'doublette',
        settings: {
          players: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'],
          meleeRotation: 'par_tour',
          mixiteObligatoire: false,
          terrains: 4,
          maxPoints: 13
        }
      })

      expect(tournoi.success).toBe(true)

      // ROTATION 1
      await api.createTeamsBatch([
        { name: 'R1-Eq1', joueur_ids: ['p1', 'p2'], tournoi_id: tournoi.data!.id },
        { name: 'R1-Eq2', joueur_ids: ['p3', 'p4'], tournoi_id: tournoi.data!.id },
        { name: 'R1-Eq3', joueur_ids: ['p5', 'p6'], tournoi_id: tournoi.data!.id },
        { name: 'R1-Eq4', joueur_ids: ['p7', 'p8'], tournoi_id: tournoi.data!.id }
      ])

      let teams = (await api.getTeamsByTournament(tournoi.data!.id)).data!
      expect(teams).toHaveLength(4)

      // Créer matchs R1
      const r1Matches: Partial<Match>[] = []
      for (let i = 0; i < teams.length; i++) {
        for (let j = i + 1; j < teams.length; j++) {
          r1Matches.push({
            equipe_a_id: teams[i].id,
            equipe_b_id: teams[j].id,
            tour: 1
          })
        }
      }

      await api.createMatchesBatch(r1Matches)

      let matches = (await api.getMatchesByTournament(tournoi.data!.id)).data!
      expect(matches).toHaveLength(6)

      // Terminer tous les matchs R1
      for (const match of matches) {
        await api.updateMatch(match.id, {
          score_a: 13,
          score_b: Math.floor(Math.random() * 13),
          status: 'termine'
        })
      }

      matches = (await api.getMatchesByTournament(tournoi.data!.id)).data!
      expect(matches.every(m => m.status === 'termine')).toBe(true)

      // ROTATION 2 - Nouvelles équipes
      await api.createTeamsBatch([
        { name: 'R2-Eq1', joueur_ids: ['p1', 'p3'], tournoi_id: tournoi.data!.id },
        { name: 'R2-Eq2', joueur_ids: ['p2', 'p4'], tournoi_id: tournoi.data!.id },
        { name: 'R2-Eq3', joueur_ids: ['p5', 'p7'], tournoi_id: tournoi.data!.id },
        { name: 'R2-Eq4', joueur_ids: ['p6', 'p8'], tournoi_id: tournoi.data!.id }
      ])

      teams = (await api.getTeamsByTournament(tournoi.data!.id)).data!
      expect(teams).toHaveLength(8) // 4 R1 + 4 R2

      const r2Teams = teams.filter(t => t.name.startsWith('R2-'))
      expect(r2Teams).toHaveLength(4)

      // Créer matchs R2
      const r2Matches: Partial<Match>[] = []
      for (let i = 0; i < r2Teams.length; i++) {
        for (let j = i + 1; j < r2Teams.length; j++) {
          r2Matches.push({
            equipe_a_id: r2Teams[i].id,
            equipe_b_id: r2Teams[j].id,
            tour: 2
          })
        }
      }

      await api.createMatchesBatch(r2Matches)

      matches = (await api.getMatchesByTournament(tournoi.data!.id)).data!
      expect(matches).toHaveLength(12) // 6 R1 + 6 R2
    })
  })

  describe('Gestion erreurs API', () => {

    it('devrait gérer tournoi non trouvé', async () => {
      const result = await api.getTournament('inexistant')

      expect(result.success).toBe(false)
      expect(result.error).toContain('non trouvé')
    })

    it('devrait gérer match non trouvé', async () => {
      const result = await api.updateMatch('inexistant', { score_a: 10 })

      expect(result.success).toBe(false)
      expect(result.error).toContain('non trouvé')
    })

    it('devrait retourner liste vide si aucune équipe', async () => {
      const tournoi = await api.createTournament({
        name: 'Tournoi Vide',
        mode: 'melee_tournante',
        format: 'doublette'
      })

      const result = await api.getTeamsByTournament(tournoi.data!.id)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })
  })
})
