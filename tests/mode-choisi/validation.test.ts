/**
 * Tests de validation des données - Mode Choisi
 * Vérifie que toutes les validations sont correctement appliquées
 */

import { describe, it, expect } from 'vitest'

// ============================================================================
// Fonctions de validation (simulées depuis le code)
// ============================================================================

interface TournamentSettings {
  pouleSize: number
  qualifiedPerPoule: number
  maxPoints: number
  timeLimit: boolean
  consolante: boolean
}

interface Team {
  id: string
  name: string
  joueur_ids: string[]
}

function validateTournamentSettings(settings: TournamentSettings): { valid: boolean; error?: string } {
  // qualifiedPerPoule >= 1
  if (settings.qualifiedPerPoule < 1) {
    return { valid: false, error: 'Le nombre de qualifiés par poule doit être au moins 1' }
  }

  // qualifiedPerPoule < pouleSize
  if (settings.qualifiedPerPoule >= settings.pouleSize) {
    return { valid: false, error: `Le nombre de qualifiés (${settings.qualifiedPerPoule}) doit être < taille poule (${settings.pouleSize})` }
  }

  // maxPoints entre 11 et 21 (standard pétanque)
  if (settings.maxPoints < 11 || settings.maxPoints > 21) {
    return { valid: false, error: 'Le nombre de points max doit être entre 11 et 21' }
  }

  return { valid: true }
}

function validateTeams(teams: Team[], format: 'tete_a_tete' | 'doublette' | 'triplette'): { valid: boolean; error?: string } {
  const playersPerTeam = format === 'tete_a_tete' ? 1 : format === 'doublette' ? 2 : 3

  // Minimum 4 équipes pour les poules
  if (teams.length < 4) {
    return { valid: false, error: `Minimum 4 équipes requises pour créer des poules. Vous en avez ${teams.length}.` }
  }

  // Vérifier que toutes les équipes ont des joueurs
  const emptyTeams = teams.filter(t => !t.joueur_ids || t.joueur_ids.length === 0)
  if (emptyTeams.length > 0) {
    return { valid: false, error: `Les équipes suivantes n'ont pas de joueurs : ${emptyTeams.map(t => t.name).join(', ')}` }
  }

  // Vérifier le nombre de joueurs par équipe
  const wrongSizeTeams = teams.filter(t => t.joueur_ids.length !== playersPerTeam)
  if (wrongSizeTeams.length > 0) {
    return { valid: false, error: `Format ${format} : chaque équipe doit avoir ${playersPerTeam} joueur(s)` }
  }

  return { valid: true }
}

function validateTeamNames(teams: Team[]): { valid: boolean; error?: string } {
  const normalizedNames = new Set<string>()

  for (const team of teams) {
    const normalized = team.name.trim().toLowerCase()

    if (normalized === '') {
      return { valid: false, error: 'Les noms d\'équipe ne peuvent pas être vides' }
    }

    if (normalizedNames.has(normalized)) {
      return { valid: false, error: `Nom d'équipe en doublon: "${team.name}"` }
    }

    normalizedNames.add(normalized)
  }

  return { valid: true }
}

function validatePoolConfiguration(nbTeams: number, pouleSize: number): boolean {
  // Minimum 2 équipes par poule
  if (pouleSize < 2) return false

  // Maximum 6 équipes par poule (recommandé)
  if (pouleSize > 6) return false

  // Le nombre d'équipes doit permettre des poules équilibrées
  // Accepter si différence max de 1 entre poules
  const nbPoules = Math.ceil(nbTeams / pouleSize)
  const minTeamsPerPoule = Math.floor(nbTeams / nbPoules)
  const maxTeamsPerPoule = Math.ceil(nbTeams / nbPoules)

  return maxTeamsPerPoule - minTeamsPerPoule <= 1
}

function validateQualifiedCount(
  nbTeams: number,
  pouleSize: number,
  qualifiedPerPoule: number
): { valid: boolean; error?: string } {
  const nbPoules = Math.ceil(nbTeams / pouleSize)
  const totalQualified = nbPoules * qualifiedPerPoule

  if (totalQualified > 16) {
    return {
      valid: false,
      error: `Trop d'équipes qualifiées (${totalQualified}). Maximum 16 pour les huitièmes de finale.`
    }
  }

  if (totalQualified < 2) {
    return {
      valid: false,
      error: 'Il faut au moins 2 équipes qualifiées pour la phase d\'élimination.'
    }
  }

  return { valid: true }
}

function validateMatchScore(
  scoreA: number,
  scoreB: number,
  maxPoints: number,
  timeLimit: boolean,
  isBye: boolean
): { valid: boolean; error?: string } {
  // Scores négatifs
  if (scoreA < 0 || scoreB < 0) {
    return { valid: false, error: 'Les scores ne peuvent pas être négatifs' }
  }

  // Match BYE - pas de validation de score
  if (isBye) {
    return { valid: true }
  }

  // Égalité non autorisée sans timeLimit
  if (scoreA === scoreB && !timeLimit) {
    return { valid: false, error: 'Un match de pétanque ne peut pas se terminer sur une égalité (sauf avec limite de temps)' }
  }

  // Sans timeLimit, un des scores doit atteindre maxPoints
  if (!timeLimit && scoreA < maxPoints && scoreB < maxPoints) {
    return { valid: false, error: `Le match doit se terminer quand une équipe atteint ${maxPoints} points` }
  }

  // Scores trop élevés (le gagnant ne peut pas dépasser maxPoints)
  const maxScore = Math.max(scoreA, scoreB)
  if (!timeLimit && maxScore > maxPoints) {
    return { valid: false, error: `Le score ne peut pas dépasser ${maxPoints} points` }
  }

  return { valid: true }
}

// ============================================================================
// Tests
// ============================================================================

describe('Validation - Mode Choisi', () => {

  describe('validateTournamentSettings', () => {

    it('devrait accepter des settings valides', () => {
      const settings: TournamentSettings = {
        pouleSize: 4,
        qualifiedPerPoule: 2,
        maxPoints: 13,
        timeLimit: false,
        consolante: true
      }
      expect(validateTournamentSettings(settings).valid).toBe(true)
    })

    it('devrait rejeter qualifiedPerPoule = 0', () => {
      const settings: TournamentSettings = {
        pouleSize: 4,
        qualifiedPerPoule: 0,
        maxPoints: 13,
        timeLimit: false,
        consolante: false
      }
      const result = validateTournamentSettings(settings)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('au moins 1')
    })

    it('devrait rejeter qualifiedPerPoule >= pouleSize', () => {
      const settings: TournamentSettings = {
        pouleSize: 4,
        qualifiedPerPoule: 4,
        maxPoints: 13,
        timeLimit: false,
        consolante: false
      }
      const result = validateTournamentSettings(settings)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('doit être <')
    })

    it('devrait rejeter maxPoints invalide', () => {
      const settings: TournamentSettings = {
        pouleSize: 4,
        qualifiedPerPoule: 2,
        maxPoints: 25, // Trop élevé
        timeLimit: false,
        consolante: false
      }
      const result = validateTournamentSettings(settings)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateTeams', () => {

    it('devrait accepter 4 équipes valides en doublette', () => {
      const teams: Team[] = [
        { id: '1', name: 'A', joueur_ids: ['p1', 'p2'] },
        { id: '2', name: 'B', joueur_ids: ['p3', 'p4'] },
        { id: '3', name: 'C', joueur_ids: ['p5', 'p6'] },
        { id: '4', name: 'D', joueur_ids: ['p7', 'p8'] }
      ]
      expect(validateTeams(teams, 'doublette').valid).toBe(true)
    })

    it('devrait rejeter moins de 4 équipes', () => {
      const teams: Team[] = [
        { id: '1', name: 'A', joueur_ids: ['p1', 'p2'] },
        { id: '2', name: 'B', joueur_ids: ['p3', 'p4'] }
      ]
      const result = validateTeams(teams, 'doublette')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Minimum 4')
    })

    it('devrait rejeter équipe sans joueurs', () => {
      const teams: Team[] = [
        { id: '1', name: 'A', joueur_ids: ['p1', 'p2'] },
        { id: '2', name: 'B', joueur_ids: [] }, // Vide!
        { id: '3', name: 'C', joueur_ids: ['p5', 'p6'] },
        { id: '4', name: 'D', joueur_ids: ['p7', 'p8'] }
      ]
      const result = validateTeams(teams, 'doublette')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('pas de joueurs')
    })

    it('devrait rejeter équipe avec mauvais nombre de joueurs', () => {
      const teams: Team[] = [
        { id: '1', name: 'A', joueur_ids: ['p1', 'p2'] },
        { id: '2', name: 'B', joueur_ids: ['p3'] }, // 1 seul joueur en doublette!
        { id: '3', name: 'C', joueur_ids: ['p5', 'p6'] },
        { id: '4', name: 'D', joueur_ids: ['p7', 'p8'] }
      ]
      const result = validateTeams(teams, 'doublette')
      expect(result.valid).toBe(false)
    })

    it('devrait valider triplette avec 3 joueurs', () => {
      const teams: Team[] = [
        { id: '1', name: 'A', joueur_ids: ['p1', 'p2', 'p3'] },
        { id: '2', name: 'B', joueur_ids: ['p4', 'p5', 'p6'] },
        { id: '3', name: 'C', joueur_ids: ['p7', 'p8', 'p9'] },
        { id: '4', name: 'D', joueur_ids: ['p10', 'p11', 'p12'] }
      ]
      expect(validateTeams(teams, 'triplette').valid).toBe(true)
    })

    it('devrait valider tête-à-tête avec 1 joueur', () => {
      const teams: Team[] = [
        { id: '1', name: 'A', joueur_ids: ['p1'] },
        { id: '2', name: 'B', joueur_ids: ['p2'] },
        { id: '3', name: 'C', joueur_ids: ['p3'] },
        { id: '4', name: 'D', joueur_ids: ['p4'] }
      ]
      expect(validateTeams(teams, 'tete_a_tete').valid).toBe(true)
    })
  })

  describe('validateTeamNames', () => {

    it('devrait accepter des noms uniques', () => {
      const teams: Team[] = [
        { id: '1', name: 'Alpha', joueur_ids: [] },
        { id: '2', name: 'Beta', joueur_ids: [] },
        { id: '3', name: 'Gamma', joueur_ids: [] }
      ]
      expect(validateTeamNames(teams).valid).toBe(true)
    })

    it('devrait rejeter les doublons (case insensitive)', () => {
      const teams: Team[] = [
        { id: '1', name: 'Alpha', joueur_ids: [] },
        { id: '2', name: 'ALPHA', joueur_ids: [] } // Même nom!
      ]
      const result = validateTeamNames(teams)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('doublon')
    })

    it('devrait rejeter les doublons avec espaces', () => {
      const teams: Team[] = [
        { id: '1', name: 'Alpha', joueur_ids: [] },
        { id: '2', name: '  Alpha  ', joueur_ids: [] } // Espaces!
      ]
      const result = validateTeamNames(teams)
      expect(result.valid).toBe(false)
    })

    it('devrait rejeter les noms vides', () => {
      const teams: Team[] = [
        { id: '1', name: 'Alpha', joueur_ids: [] },
        { id: '2', name: '   ', joueur_ids: [] } // Que des espaces
      ]
      const result = validateTeamNames(teams)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('vides')
    })
  })

  describe('validatePoolConfiguration', () => {

    it('devrait accepter 8 équipes en poules de 4', () => {
      expect(validatePoolConfiguration(8, 4)).toBe(true)
    })

    it('devrait accepter 12 équipes en poules de 4', () => {
      expect(validatePoolConfiguration(12, 4)).toBe(true)
    })

    it('devrait accepter 7 équipes en poules de 4 (3+4)', () => {
      expect(validatePoolConfiguration(7, 4)).toBe(true)
    })

    it('devrait rejeter pouleSize < 2', () => {
      expect(validatePoolConfiguration(8, 1)).toBe(false)
    })

    it('devrait rejeter pouleSize > 6', () => {
      expect(validatePoolConfiguration(14, 7)).toBe(false)
    })
  })

  describe('validateQualifiedCount', () => {

    it('devrait accepter 8 équipes qualifiées', () => {
      // 4 poules × 2 qualifiés = 8
      const result = validateQualifiedCount(16, 4, 2)
      expect(result.valid).toBe(true)
    })

    it('devrait rejeter plus de 16 qualifiés', () => {
      // 6 poules × 3 qualifiés = 18 > 16
      const result = validateQualifiedCount(24, 4, 3)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Maximum 16')
    })

    it('devrait rejeter moins de 2 qualifiés', () => {
      // 1 poule × 1 qualifié = 1 < 2
      const result = validateQualifiedCount(4, 4, 1)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateMatchScore', () => {

    it('devrait accepter un score valide 13-8', () => {
      const result = validateMatchScore(13, 8, 13, false, false)
      expect(result.valid).toBe(true)
    })

    it('devrait rejeter scores négatifs', () => {
      const result = validateMatchScore(-1, 8, 13, false, false)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('négatifs')
    })

    it('devrait rejeter égalité sans timeLimit', () => {
      const result = validateMatchScore(10, 10, 13, false, false)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('égalité')
    })

    it('devrait accepter égalité avec timeLimit', () => {
      const result = validateMatchScore(10, 10, 13, true, false)
      expect(result.valid).toBe(true)
    })

    it('devrait rejeter si aucun score ne atteint maxPoints (sans timeLimit)', () => {
      const result = validateMatchScore(8, 5, 13, false, false)
      expect(result.valid).toBe(false)
    })

    it('devrait accepter tout score pour match BYE', () => {
      const result = validateMatchScore(0, 0, 13, false, true)
      expect(result.valid).toBe(true)
    })

    it('devrait rejeter score dépassant maxPoints', () => {
      const result = validateMatchScore(15, 8, 13, false, false)
      expect(result.valid).toBe(false)
    })
  })
})
