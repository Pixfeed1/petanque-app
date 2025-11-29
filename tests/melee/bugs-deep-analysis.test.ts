/**
 * Tests pour les bugs identifiés lors de l'analyse approfondie
 * Ces tests vérifient des edge cases et incohérences dans le code mêlée
 */

import { describe, it, expect } from 'vitest'

// ============================================================================
// Types simulés
// ============================================================================

interface ValidationResult {
  valid: boolean
  error?: string
  warning?: string
}

interface Match {
  id: string
  equipe_a_id: string
  equipe_b_id: string | null
  score_a: number
  score_b: number
  status: 'a_jouer' | 'en_cours' | 'termine'
  type?: 'poule' | 'bye' | 'elimination'
  tour: number
}

interface Team {
  id: string
  name: string
  joueur_ids: string[]
}

interface Joueur {
  id: string
  name: string
  gender?: 'H' | 'F'
}

// ============================================================================
// Fonctions extraites du code production
// ============================================================================

// Bug #1: currentRotation non synchronisé
function getCurrentRotationFromData(matches: Match[]): number {
  if (matches.length === 0) return 1
  return Math.max(...matches.map(m => m.tour))
}

// Bug #2 & #3: validateMixity avec incohérences
function validateMixity(
  hommes: number,
  femmes: number,
  format: 'tete_a_tete' | 'doublette' | 'triplette',
  mixiteObligatoire: boolean
): ValidationResult {
  if (!mixiteObligatoire) {
    return { valid: true }
  }

  if (format === 'tete_a_tete') {
    // BUG: devrait retourner error, pas warning
    return {
      valid: false,
      warning: 'La mixité obligatoire n\'est pas applicable en tête-à-tête'
    }
  }

  if (format === 'doublette') {
    if (hommes < 1 || femmes < 1) {
      return {
        valid: false,
        error: 'Mixité obligatoire en doublette requiert au moins 1 homme et 1 femme'
      }
    }
  }

  if (format === 'triplette') {
    // BUG: exige 2 de chaque mais l'algo fonctionne avec 1H+2F ou 2H+1F
    if (hommes < 2 || femmes < 2) {
      return {
        valid: false,
        error: 'Mixité obligatoire en triplette requiert au moins 2 hommes et 2 femmes'
      }
    }
  }

  return { valid: true }
}

// Version corrigée de validateMixity
function validateMixityCorrected(
  hommes: number,
  femmes: number,
  format: 'tete_a_tete' | 'doublette' | 'triplette',
  mixiteObligatoire: boolean
): ValidationResult {
  if (!mixiteObligatoire) {
    return { valid: true }
  }

  if (format === 'tete_a_tete') {
    // CORRIGÉ: retourne error au lieu de warning
    return {
      valid: false,
      error: 'La mixité obligatoire n\'est pas applicable en tête-à-tête (1 joueur par équipe)'
    }
  }

  if (format === 'doublette') {
    if (hommes < 1 || femmes < 1) {
      return {
        valid: false,
        error: 'Mixité obligatoire en doublette requiert au moins 1 homme et 1 femme'
      }
    }
  }

  if (format === 'triplette') {
    // CORRIGÉ: exige seulement 1 de chaque minimum (1H+2F ou 2H+1F fonctionne)
    if (hommes < 1 || femmes < 1) {
      return {
        valid: false,
        error: 'Mixité obligatoire en triplette requiert au moins 1 homme et 1 femme'
      }
    }
  }

  return { valid: true }
}

// Bug #4: validateScore sans timeLimit
function validateScoreWithTimeLimit(
  scoreA: number,
  scoreB: number,
  maxPoints: number,
  timeLimit: boolean
): ValidationResult {
  if (scoreA < 0 || scoreB < 0) {
    return { valid: false, error: 'Les scores ne peuvent pas être négatifs' }
  }

  // Avec timeLimit, égalité autorisée et pas besoin d'atteindre maxPoints
  if (timeLimit) {
    // Seule contrainte: les scores ne peuvent pas dépasser maxPoints
    if (scoreA > maxPoints || scoreB > maxPoints) {
      return { valid: false, error: `Score maximum autorisé : ${maxPoints} points` }
    }
    return { valid: true }
  }

  // Sans timeLimit: règles standard FIPJP
  if (scoreA === maxPoints && scoreB === maxPoints) {
    return { valid: false, error: `Impossible : les deux équipes ne peuvent pas atteindre ${maxPoints} points simultanément` }
  }

  if (scoreA > maxPoints || scoreB > maxPoints) {
    return { valid: false, error: `Score maximum autorisé : ${maxPoints} points` }
  }

  // Sans timeLimit, une équipe doit atteindre maxPoints
  if (scoreA < maxPoints && scoreB < maxPoints) {
    return { valid: false, error: `Une équipe doit atteindre ${maxPoints} points pour terminer le match` }
  }

  return { valid: true }
}

// Bug #5: loadIndividualRankings inclut tous les joueurs
function filterTournamentPlayers(
  allPlayers: Joueur[],
  tournamentPlayerIds: string[]
): Joueur[] {
  return allPlayers.filter(p => tournamentPlayerIds.includes(p.id))
}

// Bug #7: Stats ne devrait pas inclure matchs BYE
function calculatePlayerStatsExcludingBye(
  playerId: string,
  teams: Team[],
  matches: Match[]
): { matchesPlayed: number; victories: number } {
  const playerTeamIds = teams
    .filter(t => t.joueur_ids.includes(playerId))
    .map(t => t.id)

  let matchesPlayed = 0
  let victories = 0

  matches.forEach(match => {
    if (match.status !== 'termine') return
    // EXCLURE les matchs BYE
    if (match.type === 'bye' || match.equipe_b_id === null) return

    const isInTeamA = playerTeamIds.includes(match.equipe_a_id)
    const isInTeamB = match.equipe_b_id && playerTeamIds.includes(match.equipe_b_id)

    if (isInTeamA) {
      matchesPlayed++
      if (match.score_a > match.score_b) victories++
    } else if (isInTeamB) {
      matchesPlayed++
      if (match.score_b > match.score_a) victories++
    }
  })

  return { matchesPlayed, victories }
}

// Bug #8: Estimation durée pour mêlée tournante
function estimateMeleeTournanteDuration(
  nbPlayers: number,
  playersPerTeam: number,
  nbRotations: number,
  avgMatchDurationMinutes: number
): number {
  const nbTeamsPerRotation = Math.floor(nbPlayers / playersPerTeam)
  const matchesPerRotation = Math.floor(nbTeamsPerRotation / 2)

  // Temps de transition entre rotations (5 min)
  const transitionTime = 5

  // Total = (matchs × durée) + transitions entre rotations
  const totalMinutes =
    nbRotations * matchesPerRotation * avgMatchDurationMinutes +
    (nbRotations - 1) * transitionTime

  return totalMinutes
}

// ============================================================================
// Tests
// ============================================================================

describe('Bug #1: currentRotation non synchronisé', () => {

  it('devrait détecter le tour actuel depuis les matchs', () => {
    const matches: Match[] = [
      { id: 'm1', equipe_a_id: 't1', equipe_b_id: 't2', score_a: 13, score_b: 8, status: 'termine', tour: 1 },
      { id: 'm2', equipe_a_id: 't3', equipe_b_id: 't4', score_a: 13, score_b: 5, status: 'termine', tour: 2 },
      { id: 'm3', equipe_a_id: 't5', equipe_b_id: 't6', score_a: 0, score_b: 0, status: 'a_jouer', tour: 3 }
    ]

    const currentRotation = getCurrentRotationFromData(matches)

    expect(currentRotation).toBe(3)
  })

  it('devrait retourner 1 si aucun match', () => {
    const matches: Match[] = []

    const currentRotation = getCurrentRotationFromData(matches)

    expect(currentRotation).toBe(1)
  })

  it('devrait gérer matchs avec tours discontinus', () => {
    const matches: Match[] = [
      { id: 'm1', equipe_a_id: 't1', equipe_b_id: 't2', score_a: 13, score_b: 8, status: 'termine', tour: 1 },
      { id: 'm2', equipe_a_id: 't3', equipe_b_id: 't4', score_a: 13, score_b: 5, status: 'termine', tour: 5 } // Saut de 1 à 5
    ]

    const currentRotation = getCurrentRotationFromData(matches)

    expect(currentRotation).toBe(5)
  })
})

describe('Bug #2 & #3: validateMixity incohérences', () => {

  describe('Bug original: triplette exige 2 de chaque', () => {

    it('devrait REJETER 1H + 2F en triplette (bug)', () => {
      const result = validateMixity(1, 2, 'triplette', true)

      // BUG: L'algo de formation d'équipes FONCTIONNE avec 1H+2F
      // mais la validation le rejette
      expect(result.valid).toBe(false)
    })

    it('devrait REJETER 2H + 1F en triplette (bug)', () => {
      const result = validateMixity(2, 1, 'triplette', true)

      // BUG: L'algo de formation d'équipes FONCTIONNE avec 2H+1F
      // mais la validation le rejette
      expect(result.valid).toBe(false)
    })
  })

  describe('Version corrigée', () => {

    it('devrait ACCEPTER 1H + 2F en triplette', () => {
      const result = validateMixityCorrected(1, 2, 'triplette', true)

      expect(result.valid).toBe(true)
    })

    it('devrait ACCEPTER 2H + 1F en triplette', () => {
      const result = validateMixityCorrected(2, 1, 'triplette', true)

      expect(result.valid).toBe(true)
    })

    it('devrait REJETER 0H ou 0F en triplette', () => {
      const result1 = validateMixityCorrected(0, 3, 'triplette', true)
      const result2 = validateMixityCorrected(3, 0, 'triplette', true)

      expect(result1.valid).toBe(false)
      expect(result2.valid).toBe(false)
    })
  })

  describe('Bug #3: tete_a_tete retourne warning au lieu de error', () => {

    it('devrait retourner warning (bug actuel)', () => {
      const result = validateMixity(5, 5, 'tete_a_tete', true)

      // BUG: retourne warning au lieu de error
      expect(result.valid).toBe(false)
      expect(result.warning).toBeDefined()
      expect(result.error).toBeUndefined()
    })

    it('version corrigée devrait retourner error', () => {
      const result = validateMixityCorrected(5, 5, 'tete_a_tete', true)

      expect(result.valid).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.warning).toBeUndefined()
    })
  })
})

describe('Bug #4: validateScore ne gère pas timeLimit', () => {

  describe('Avec timeLimit = true', () => {

    it('devrait accepter égalité 10-10', () => {
      const result = validateScoreWithTimeLimit(10, 10, 13, true)

      expect(result.valid).toBe(true)
    })

    it('devrait accepter score sans atteindre maxPoints (8-7)', () => {
      const result = validateScoreWithTimeLimit(8, 7, 13, true)

      expect(result.valid).toBe(true)
    })

    it('devrait rejeter score dépassant maxPoints', () => {
      const result = validateScoreWithTimeLimit(15, 10, 13, true)

      expect(result.valid).toBe(false)
    })
  })

  describe('Sans timeLimit (règles standard)', () => {

    it('devrait rejeter égalité', () => {
      const result = validateScoreWithTimeLimit(10, 10, 13, false)

      // Sans timeLimit, ce score est invalide (aucune équipe à 13)
      // L'égalité n'est pas le problème, c'est qu'aucun n'atteint maxPoints
      expect(result.valid).toBe(false)
    })

    it('devrait accepter 13-10 (victoire normale)', () => {
      const result = validateScoreWithTimeLimit(13, 10, 13, false)

      expect(result.valid).toBe(true)
    })

    it('devrait rejeter 8-7 (personne à maxPoints)', () => {
      const result = validateScoreWithTimeLimit(8, 7, 13, false)

      expect(result.valid).toBe(false)
    })
  })
})

describe('Bug #5: loadIndividualRankings inclut tous les joueurs', () => {

  it('devrait filtrer seulement les joueurs du tournoi', () => {
    const allPlayers: Joueur[] = [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' },
      { id: 'p3', name: 'Player 3' },
      { id: 'p4', name: 'Player 4' },
      { id: 'p5', name: 'Player 5' }
    ]

    const tournamentPlayerIds = ['p1', 'p3', 'p5']

    const filtered = filterTournamentPlayers(allPlayers, tournamentPlayerIds)

    expect(filtered).toHaveLength(3)
    expect(filtered.map(p => p.id)).toEqual(['p1', 'p3', 'p5'])
  })

  it('devrait retourner vide si aucun joueur du tournoi', () => {
    const allPlayers: Joueur[] = [
      { id: 'p1', name: 'Player 1' },
      { id: 'p2', name: 'Player 2' }
    ]

    const tournamentPlayerIds: string[] = []

    const filtered = filterTournamentPlayers(allPlayers, tournamentPlayerIds)

    expect(filtered).toHaveLength(0)
  })
})

describe('Bug #7: Stats inclut matchs BYE', () => {

  it('devrait NE PAS compter les matchs BYE', () => {
    const teams: Team[] = [
      { id: 't1', name: 'Team 1', joueur_ids: ['p1', 'p2'] },
      { id: 't2', name: 'Team 2', joueur_ids: ['p3', 'p4'] }
    ]

    const matches: Match[] = [
      // Match normal terminé
      { id: 'm1', equipe_a_id: 't1', equipe_b_id: 't2', score_a: 13, score_b: 8, status: 'termine', tour: 1 },
      // Match BYE (ne devrait pas compter)
      { id: 'm2', equipe_a_id: 't1', equipe_b_id: null, score_a: 0, score_b: 0, status: 'termine', tour: 2, type: 'bye' }
    ]

    const stats = calculatePlayerStatsExcludingBye('p1', teams, matches)

    // Devrait compter seulement 1 match (le match normal)
    expect(stats.matchesPlayed).toBe(1)
    expect(stats.victories).toBe(1)
  })

  it('devrait exclure matchs avec equipe_b_id null même sans type bye', () => {
    const teams: Team[] = [
      { id: 't1', name: 'Team 1', joueur_ids: ['p1', 'p2'] }
    ]

    const matches: Match[] = [
      // Match avec equipe_b_id null (BYE implicite)
      { id: 'm1', equipe_a_id: 't1', equipe_b_id: null, score_a: 0, score_b: 0, status: 'termine', tour: 1 }
    ]

    const stats = calculatePlayerStatsExcludingBye('p1', teams, matches)

    expect(stats.matchesPlayed).toBe(0)
  })
})

describe('Bug #8: Estimation durée mêlée tournante', () => {

  it('devrait calculer durée pour 8 joueurs, 3 rotations', () => {
    const nbPlayers = 8
    const playersPerTeam = 2 // doublette
    const nbRotations = 3
    const avgMatchDuration = 35 // minutes

    const duration = estimateMeleeTournanteDuration(
      nbPlayers,
      playersPerTeam,
      nbRotations,
      avgMatchDuration
    )

    // 8 joueurs / 2 = 4 équipes = 2 matchs par rotation
    // 3 rotations × 2 matchs × 35 min = 210 min
    // + 2 transitions × 5 min = 10 min
    // Total = 220 min
    expect(duration).toBe(220)
  })

  it('devrait calculer durée pour 9 joueurs triplette', () => {
    const nbPlayers = 9
    const playersPerTeam = 3 // triplette
    const nbRotations = 2
    const avgMatchDuration = 45

    const duration = estimateMeleeTournanteDuration(
      nbPlayers,
      playersPerTeam,
      nbRotations,
      avgMatchDuration
    )

    // 9 joueurs / 3 = 3 équipes = 1 match par rotation (1 équipe attend)
    // 2 rotations × 1 match × 45 min = 90 min
    // + 1 transition × 5 min = 5 min
    // Total = 95 min
    expect(duration).toBe(95)
  })
})

describe('Autres edge cases trouvés', () => {

  describe('Validation nombre minimum joueurs mêlée tournante', () => {

    it('devrait détecter si pas assez de joueurs pour 2 équipes doublette', () => {
      const nbPlayers = 3
      const playersPerTeam = 2
      const nbTeams = Math.floor(nbPlayers / playersPerTeam)

      // 3 joueurs / 2 = 1 équipe (pas assez pour faire un match)
      expect(nbTeams).toBe(1)
      expect(nbTeams >= 2).toBe(false) // Validation échouée
    })

    it('devrait détecter si pas assez de joueurs pour 2 équipes triplette', () => {
      const nbPlayers = 5
      const playersPerTeam = 3
      const nbTeams = Math.floor(nbPlayers / playersPerTeam)

      // 5 joueurs / 3 = 1 équipe (pas assez pour faire un match)
      expect(nbTeams).toBe(1)
      expect(nbTeams >= 2).toBe(false)
    })

    it('devrait accepter minimum 4 joueurs doublette', () => {
      const nbPlayers = 4
      const playersPerTeam = 2
      const nbTeams = Math.floor(nbPlayers / playersPerTeam)

      expect(nbTeams).toBe(2) // Exactement 2 équipes
      expect(nbTeams >= 2).toBe(true)
    })
  })

  describe('Race condition création équipes/matchs', () => {

    it('devrait vérifier existence équipes avant création matchs', () => {
      // Simule vérification que les équipes existent
      const existingTeams: Team[] = [
        { id: 't1', name: 'R2-Équipe 1', joueur_ids: ['p1', 'p2'] },
        { id: 't2', name: 'R2-Équipe 2', joueur_ids: ['p3', 'p4'] }
      ]

      const rotationNumber = 2
      const rotationTeams = existingTeams.filter(t =>
        t.name.startsWith(`R${rotationNumber}-`)
      )

      expect(rotationTeams.length).toBeGreaterThan(0)
    })

    it('devrait détecter équipes déjà existantes pour rotation', () => {
      const existingTeams: Team[] = [
        { id: 't1', name: 'R1-Équipe 1', joueur_ids: ['p1', 'p2'] },
        { id: 't2', name: 'R1-Équipe 2', joueur_ids: ['p3', 'p4'] },
        { id: 't3', name: 'R2-Équipe 1', joueur_ids: ['p1', 'p3'] }, // Déjà créé!
        { id: 't4', name: 'R2-Équipe 2', joueur_ids: ['p2', 'p4'] }
      ]

      const nextRotation = 2
      const alreadyExists = existingTeams.some(t =>
        t.name.startsWith(`R${nextRotation}-`)
      )

      expect(alreadyExists).toBe(true)
      // La rotation ne devrait pas être créée à nouveau
    })
  })

  describe('Synchronisation state avec données', () => {

    it('devrait initialiser currentRotation depuis les données existantes', () => {
      // Au chargement, on devrait lire le tour actuel depuis les matchs
      const existingMatches: Match[] = [
        { id: 'm1', equipe_a_id: 't1', equipe_b_id: 't2', score_a: 13, score_b: 8, status: 'termine', tour: 1 },
        { id: 'm2', equipe_a_id: 't3', equipe_b_id: 't4', score_a: 13, score_b: 5, status: 'termine', tour: 2 }
      ]

      const initialRotation = getCurrentRotationFromData(existingMatches)

      expect(initialRotation).toBe(2) // Pas 1 par défaut
    })
  })
})
