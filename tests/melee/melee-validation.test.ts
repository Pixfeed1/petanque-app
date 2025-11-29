/**
 * Tests de validation pour les modes Mêlée
 * Vérifie toutes les règles de validation spécifiques à la mêlée
 */

import { describe, it, expect } from 'vitest'

// ============================================================================
// Types simulés
// ============================================================================

interface Joueur {
  id: string
  name: string
  gender?: 'H' | 'F'
  license?: string
}

interface MeleeSettings {
  mode: 'melee_fixe' | 'melee_tournante'
  format: 'tete_a_tete' | 'doublette' | 'triplette'
  nbRounds: number
  maxPoints: number
  timeLimit: boolean
  mixiteObligatoire: boolean
  nbTerrains: number
}

interface Match {
  equipe_a_id: string
  equipe_b_id: string | null
  score_a: number
  score_b: number
  terrain?: number | null
}

// ============================================================================
// Fonctions de validation
// ============================================================================

function validateMeleeSettings(settings: MeleeSettings): { valid: boolean; error?: string } {
  // Mode valide
  if (!['melee_fixe', 'melee_tournante'].includes(settings.mode)) {
    return { valid: false, error: 'Mode invalide' }
  }

  // Format valide
  if (!['tete_a_tete', 'doublette', 'triplette'].includes(settings.format)) {
    return { valid: false, error: 'Format invalide' }
  }

  // Mixité incompatible avec tête-à-tête
  if (settings.mixiteObligatoire && settings.format === 'tete_a_tete') {
    return { valid: false, error: 'Mixité obligatoire incompatible avec tête-à-tête' }
  }

  // Nombre de rounds valide
  if (settings.nbRounds < 1 || settings.nbRounds > 10) {
    return { valid: false, error: 'Nombre de rounds doit être entre 1 et 10' }
  }

  // maxPoints valide (11, 13 ou 15 standard)
  if (settings.maxPoints < 11 || settings.maxPoints > 21) {
    return { valid: false, error: 'Points max doit être entre 11 et 21' }
  }

  // Terrains
  if (settings.nbTerrains < 1) {
    return { valid: false, error: 'Au moins 1 terrain requis' }
  }

  return { valid: true }
}

function validatePlayerCount(
  nbPlayers: number,
  format: 'tete_a_tete' | 'doublette' | 'triplette'
): { valid: boolean; error?: string; warnings?: string[] } {
  const playersPerTeam = format === 'tete_a_tete' ? 1 : format === 'doublette' ? 2 : 3
  const warnings: string[] = []

  // Minimum pour former au moins 2 équipes
  const minPlayers = playersPerTeam * 2
  if (nbPlayers < minPlayers) {
    return {
      valid: false,
      error: `Minimum ${minPlayers} joueurs requis pour le format ${format}`
    }
  }

  // Maximum raisonnable
  if (nbPlayers > 100) {
    return {
      valid: false,
      error: 'Maximum 100 joueurs supporté'
    }
  }

  // Warning si joueurs non assignables
  const remainder = nbPlayers % playersPerTeam
  if (remainder > 0) {
    warnings.push(`${remainder} joueur(s) ne pourront pas jouer (nombre impair)`)
  }

  return { valid: true, warnings }
}

function validateMixite(
  players: Joueur[],
  format: 'doublette' | 'triplette',
  mixiteObligatoire: boolean
): { valid: boolean; error?: string; warnings?: string[] } {
  if (!mixiteObligatoire) {
    return { valid: true }
  }

  const warnings: string[] = []

  // Vérifier que tous les joueurs ont un genre défini
  const missingGender = players.filter(p => !p.gender || (p.gender !== 'H' && p.gender !== 'F'))
  if (missingGender.length > 0) {
    return {
      valid: false,
      error: `${missingGender.length} joueur(s) n'ont pas de genre défini (requis pour mixité obligatoire)`
    }
  }

  // Compter H et F
  const nbH = players.filter(p => p.gender === 'H').length
  const nbF = players.filter(p => p.gender === 'F').length

  if (format === 'doublette') {
    // Pour doublettes mixtes: 1H + 1F
    const nbMixedTeams = Math.min(nbH, nbF)
    const nbNonMixedTeams = Math.floor((nbH - nbMixedTeams + nbF - nbMixedTeams) / 2)
    const totalTeams = nbMixedTeams + nbNonMixedTeams

    if (nbMixedTeams === 0) {
      return {
        valid: false,
        error: 'Impossible de former équipes mixtes: aucun(e) homme ou aucune femme'
      }
    }

    if (nbMixedTeams < totalTeams) {
      const mixedPercentage = Math.round((nbMixedTeams / totalTeams) * 100)
      warnings.push(`Seulement ${mixedPercentage}% des équipes seront mixtes (${nbMixedTeams}/${totalTeams})`)
    }
  } else {
    // Triplette: 2H+1F ou 1H+2F
    // Vérifier qu'on peut former au moins une équipe mixte
    const can2H1F = nbH >= 2 && nbF >= 1
    const can1H2F = nbH >= 1 && nbF >= 2

    if (!can2H1F && !can1H2F) {
      return {
        valid: false,
        error: 'Impossible de former équipes mixtes en triplette'
      }
    }
  }

  return { valid: true, warnings }
}

function validateMatchScore(
  match: Match,
  maxPoints: number,
  timeLimit: boolean
): { valid: boolean; error?: string } {
  const { score_a, score_b, equipe_b_id } = match

  // Match BYE - pas de validation de score
  if (equipe_b_id === null) {
    return { valid: true }
  }

  // Scores négatifs
  if (score_a < 0 || score_b < 0) {
    return { valid: false, error: 'Les scores ne peuvent pas être négatifs' }
  }

  // Égalité
  if (score_a === score_b) {
    if (!timeLimit) {
      return { valid: false, error: 'Égalité interdite sans limite de temps' }
    }
    // Égalité OK avec timeLimit
    return { valid: true }
  }

  // Sans timeLimit, un score doit atteindre maxPoints
  if (!timeLimit) {
    const maxScore = Math.max(score_a, score_b)
    if (maxScore !== maxPoints) {
      return {
        valid: false,
        error: `Sans limite de temps, le gagnant doit avoir exactement ${maxPoints} points`
      }
    }
  }

  // Score trop élevé
  if (!timeLimit && (score_a > maxPoints || score_b > maxPoints)) {
    return { valid: false, error: `Score ne peut pas dépasser ${maxPoints}` }
  }

  return { valid: true }
}

function validateTerrainAssignment(
  matches: Match[],
  nbTerrains: number
): { valid: boolean; error?: string } {
  const usedTerrains = new Set<number>()

  for (const match of matches) {
    // Match BYE - pas de terrain
    if (match.equipe_b_id === null) {
      continue
    }

    if (!match.terrain) {
      return { valid: false, error: 'Match sans terrain assigné' }
    }

    if (match.terrain < 1 || match.terrain > nbTerrains) {
      return {
        valid: false,
        error: `Terrain ${match.terrain} invalide (1-${nbTerrains})`
      }
    }

    if (usedTerrains.has(match.terrain)) {
      return {
        valid: false,
        error: `Terrain ${match.terrain} assigné à plusieurs matchs`
      }
    }

    usedTerrains.add(match.terrain)
  }

  return { valid: true }
}

function validateRoundProgression(
  currentRound: number,
  matchesStatus: ('a_jouer' | 'en_cours' | 'termine')[],
  totalRounds: number
): { canProgress: boolean; error?: string } {
  // Vérifier round valide
  if (currentRound < 1 || currentRound > totalRounds) {
    return { canProgress: false, error: 'Round invalide' }
  }

  // Tous les matchs doivent être terminés
  const allComplete = matchesStatus.every(s => s === 'termine')

  if (!allComplete) {
    const remaining = matchesStatus.filter(s => s !== 'termine').length
    return {
      canProgress: false,
      error: `${remaining} match(s) non terminé(s) dans le round actuel`
    }
  }

  // Dernier round?
  if (currentRound >= totalRounds) {
    return {
      canProgress: false,
      error: 'Dernier round atteint'
    }
  }

  return { canProgress: true }
}

function validatePlayerUniqueness(players: Joueur[]): { valid: boolean; error?: string } {
  // Vérifier IDs uniques
  const ids = players.map(p => p.id)
  const uniqueIds = new Set(ids)

  if (uniqueIds.size !== ids.length) {
    return { valid: false, error: 'Plusieurs joueurs avec le même ID' }
  }

  // Vérifier noms uniques (case insensitive, trimmed)
  const normalizedNames = new Map<string, string>()

  for (const player of players) {
    const normalized = player.name.trim().toLowerCase()

    if (normalizedNames.has(normalized)) {
      return {
        valid: false,
        error: `Nom en doublon: "${player.name}" (déjà "${normalizedNames.get(normalized)}")`
      }
    }

    normalizedNames.set(normalized, player.name)
  }

  return { valid: true }
}

// ============================================================================
// Tests
// ============================================================================

describe('Validation Mélée - Settings', () => {

  describe('validateMeleeSettings', () => {

    it('devrait accepter settings valides mélée fixe', () => {
      const settings: MeleeSettings = {
        mode: 'melee_fixe',
        format: 'doublette',
        nbRounds: 3,
        maxPoints: 13,
        timeLimit: false,
        mixiteObligatoire: false,
        nbTerrains: 4
      }

      expect(validateMeleeSettings(settings).valid).toBe(true)
    })

    it('devrait accepter settings valides mélée tournante', () => {
      const settings: MeleeSettings = {
        mode: 'melee_tournante',
        format: 'triplette',
        nbRounds: 5,
        maxPoints: 11,
        timeLimit: true,
        mixiteObligatoire: true,
        nbTerrains: 6
      }

      expect(validateMeleeSettings(settings).valid).toBe(true)
    })

    it('devrait rejeter mode invalide', () => {
      const settings = {
        mode: 'choisi' as any,
        format: 'doublette',
        nbRounds: 3,
        maxPoints: 13,
        timeLimit: false,
        mixiteObligatoire: false,
        nbTerrains: 4
      }

      const result = validateMeleeSettings(settings)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Mode')
    })

    it('devrait rejeter mixité avec tête-à-tête', () => {
      const settings: MeleeSettings = {
        mode: 'melee_fixe',
        format: 'tete_a_tete',
        nbRounds: 3,
        maxPoints: 13,
        timeLimit: false,
        mixiteObligatoire: true, // Incompatible!
        nbTerrains: 4
      }

      const result = validateMeleeSettings(settings)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('incompatible')
    })

    it('devrait rejeter nbRounds = 0', () => {
      const settings: MeleeSettings = {
        mode: 'melee_fixe',
        format: 'doublette',
        nbRounds: 0,
        maxPoints: 13,
        timeLimit: false,
        mixiteObligatoire: false,
        nbTerrains: 4
      }

      const result = validateMeleeSettings(settings)
      expect(result.valid).toBe(false)
    })

    it('devrait rejeter nbRounds > 10', () => {
      const settings: MeleeSettings = {
        mode: 'melee_tournante',
        format: 'doublette',
        nbRounds: 15,
        maxPoints: 13,
        timeLimit: false,
        mixiteObligatoire: false,
        nbTerrains: 4
      }

      const result = validateMeleeSettings(settings)
      expect(result.valid).toBe(false)
    })

    it('devrait rejeter maxPoints < 11', () => {
      const settings: MeleeSettings = {
        mode: 'melee_fixe',
        format: 'doublette',
        nbRounds: 3,
        maxPoints: 9,
        timeLimit: false,
        mixiteObligatoire: false,
        nbTerrains: 4
      }

      const result = validateMeleeSettings(settings)
      expect(result.valid).toBe(false)
    })

    it('devrait rejeter nbTerrains = 0', () => {
      const settings: MeleeSettings = {
        mode: 'melee_fixe',
        format: 'doublette',
        nbRounds: 3,
        maxPoints: 13,
        timeLimit: false,
        mixiteObligatoire: false,
        nbTerrains: 0
      }

      const result = validateMeleeSettings(settings)
      expect(result.valid).toBe(false)
    })
  })
})

describe('Validation Mélée - Joueurs', () => {

  describe('validatePlayerCount', () => {

    it('devrait accepter 8 joueurs en doublette', () => {
      const result = validatePlayerCount(8, 'doublette')
      expect(result.valid).toBe(true)
      expect(result.warnings).toHaveLength(0)
    })

    it('devrait accepter 9 joueurs en triplette', () => {
      const result = validatePlayerCount(9, 'triplette')
      expect(result.valid).toBe(true)
    })

    it('devrait rejeter 3 joueurs en doublette', () => {
      const result = validatePlayerCount(3, 'doublette')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Minimum 4')
    })

    it('devrait rejeter 5 joueurs en triplette', () => {
      const result = validatePlayerCount(5, 'triplette')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Minimum 6')
    })

    it('devrait avertir pour nombre impair en doublette', () => {
      const result = validatePlayerCount(7, 'doublette')
      expect(result.valid).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings!.length).toBeGreaterThan(0)
    })

    it('devrait rejeter plus de 100 joueurs', () => {
      const result = validatePlayerCount(150, 'doublette')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('Maximum 100')
    })

    it('devrait accepter tête-à-tête avec 4 joueurs', () => {
      const result = validatePlayerCount(4, 'tete_a_tete')
      expect(result.valid).toBe(true)
    })

    it('devrait rejeter tête-à-tête avec 1 joueur', () => {
      const result = validatePlayerCount(1, 'tete_a_tete')
      expect(result.valid).toBe(false)
    })
  })

  describe('validatePlayerUniqueness', () => {

    it('devrait accepter joueurs uniques', () => {
      const players: Joueur[] = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Charlie' }
      ]

      expect(validatePlayerUniqueness(players).valid).toBe(true)
    })

    it('devrait rejeter IDs en doublon', () => {
      const players: Joueur[] = [
        { id: '1', name: 'Alice' },
        { id: '1', name: 'Bob' } // Même ID!
      ]

      const result = validatePlayerUniqueness(players)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('même ID')
    })

    it('devrait rejeter noms en doublon (case insensitive)', () => {
      const players: Joueur[] = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'ALICE' } // Même nom!
      ]

      const result = validatePlayerUniqueness(players)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('doublon')
    })

    it('devrait rejeter noms en doublon (avec espaces)', () => {
      const players: Joueur[] = [
        { id: '1', name: 'Alice' },
        { id: '2', name: '  Alice  ' } // Même nom avec espaces!
      ]

      const result = validatePlayerUniqueness(players)
      expect(result.valid).toBe(false)
    })
  })
})

describe('Validation Mélée - Mixité', () => {

  describe('validateMixite', () => {

    it('devrait valider sans mixité obligatoire', () => {
      const players: Joueur[] = [
        { id: '1', name: 'A', gender: 'H' },
        { id: '2', name: 'B', gender: 'H' }
      ]

      const result = validateMixite(players, 'doublette', false)
      expect(result.valid).toBe(true)
    })

    it('devrait rejeter sans genre défini si mixité obligatoire', () => {
      const players: Joueur[] = [
        { id: '1', name: 'A', gender: 'H' },
        { id: '2', name: 'B' } // Pas de genre!
      ]

      const result = validateMixite(players, 'doublette', true)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('genre défini')
    })

    it('devrait rejeter que des hommes avec mixité obligatoire', () => {
      const players: Joueur[] = [
        { id: '1', name: 'A', gender: 'H' },
        { id: '2', name: 'B', gender: 'H' },
        { id: '3', name: 'C', gender: 'H' },
        { id: '4', name: 'D', gender: 'H' }
      ]

      const result = validateMixite(players, 'doublette', true)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('aucun')
    })

    it('devrait rejeter que des femmes avec mixité obligatoire', () => {
      const players: Joueur[] = [
        { id: '1', name: 'A', gender: 'F' },
        { id: '2', name: 'B', gender: 'F' },
        { id: '3', name: 'C', gender: 'F' },
        { id: '4', name: 'D', gender: 'F' }
      ]

      const result = validateMixite(players, 'doublette', true)
      expect(result.valid).toBe(false)
    })

    it('devrait accepter mix H/F en doublette', () => {
      const players: Joueur[] = [
        { id: '1', name: 'A', gender: 'H' },
        { id: '2', name: 'B', gender: 'F' },
        { id: '3', name: 'C', gender: 'H' },
        { id: '4', name: 'D', gender: 'F' }
      ]

      const result = validateMixite(players, 'doublette', true)
      expect(result.valid).toBe(true)
    })

    it('devrait avertir si peu d\'équipes mixtes', () => {
      const players: Joueur[] = [
        { id: '1', name: 'A', gender: 'H' },
        { id: '2', name: 'B', gender: 'H' },
        { id: '3', name: 'C', gender: 'H' },
        { id: '4', name: 'D', gender: 'F' } // 1 seule F pour 3 H
      ]

      const result = validateMixite(players, 'doublette', true)
      expect(result.valid).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings!.length).toBeGreaterThan(0)
    })

    it('devrait valider triplette mixte possible', () => {
      const players: Joueur[] = [
        { id: '1', name: 'A', gender: 'H' },
        { id: '2', name: 'B', gender: 'H' },
        { id: '3', name: 'C', gender: 'F' },
        { id: '4', name: 'D', gender: 'H' },
        { id: '5', name: 'E', gender: 'H' },
        { id: '6', name: 'F', gender: 'F' }
      ]

      const result = validateMixite(players, 'triplette', true)
      expect(result.valid).toBe(true)
    })

    it('devrait rejeter triplette mixte impossible', () => {
      const players: Joueur[] = [
        { id: '1', name: 'A', gender: 'H' },
        { id: '2', name: 'B', gender: 'H' },
        { id: '3', name: 'C', gender: 'H' },
        { id: '4', name: 'D', gender: 'H' },
        { id: '5', name: 'E', gender: 'H' },
        { id: '6', name: 'F', gender: 'H' }
      ]

      const result = validateMixite(players, 'triplette', true)
      expect(result.valid).toBe(false)
    })
  })
})

describe('Validation Mélée - Scores', () => {

  describe('validateMatchScore', () => {

    it('devrait accepter 13-8 sans timeLimit', () => {
      const match: Match = {
        equipe_a_id: 't1',
        equipe_b_id: 't2',
        score_a: 13,
        score_b: 8
      }

      expect(validateMatchScore(match, 13, false).valid).toBe(true)
    })

    it('devrait accepter 11-5 avec maxPoints=11', () => {
      const match: Match = {
        equipe_a_id: 't1',
        equipe_b_id: 't2',
        score_a: 11,
        score_b: 5
      }

      expect(validateMatchScore(match, 11, false).valid).toBe(true)
    })

    it('devrait rejeter score négatif', () => {
      const match: Match = {
        equipe_a_id: 't1',
        equipe_b_id: 't2',
        score_a: 13,
        score_b: -1
      }

      const result = validateMatchScore(match, 13, false)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('négatif')
    })

    it('devrait rejeter égalité sans timeLimit', () => {
      const match: Match = {
        equipe_a_id: 't1',
        equipe_b_id: 't2',
        score_a: 10,
        score_b: 10
      }

      const result = validateMatchScore(match, 13, false)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('galité')
    })

    it('devrait accepter égalité avec timeLimit', () => {
      const match: Match = {
        equipe_a_id: 't1',
        equipe_b_id: 't2',
        score_a: 10,
        score_b: 10
      }

      expect(validateMatchScore(match, 13, true).valid).toBe(true)
    })

    it('devrait rejeter si aucun n\'atteint maxPoints sans timeLimit', () => {
      const match: Match = {
        equipe_a_id: 't1',
        equipe_b_id: 't2',
        score_a: 8,
        score_b: 5
      }

      const result = validateMatchScore(match, 13, false)
      expect(result.valid).toBe(false)
    })

    it('devrait accepter score partiel avec timeLimit', () => {
      const match: Match = {
        equipe_a_id: 't1',
        equipe_b_id: 't2',
        score_a: 8,
        score_b: 5
      }

      expect(validateMatchScore(match, 13, true).valid).toBe(true)
    })

    it('devrait rejeter score > maxPoints sans timeLimit', () => {
      const match: Match = {
        equipe_a_id: 't1',
        equipe_b_id: 't2',
        score_a: 15,
        score_b: 8
      }

      const result = validateMatchScore(match, 13, false)
      expect(result.valid).toBe(false)
    })

    it('devrait accepter match BYE sans validation', () => {
      const match: Match = {
        equipe_a_id: 't1',
        equipe_b_id: null, // BYE
        score_a: 0,
        score_b: 0
      }

      expect(validateMatchScore(match, 13, false).valid).toBe(true)
    })

    it('devrait accepter 13-0 (victoire parfaite)', () => {
      const match: Match = {
        equipe_a_id: 't1',
        equipe_b_id: 't2',
        score_a: 13,
        score_b: 0
      }

      expect(validateMatchScore(match, 13, false).valid).toBe(true)
    })

    it('devrait accepter 13-12 (victoire serrée)', () => {
      const match: Match = {
        equipe_a_id: 't1',
        equipe_b_id: 't2',
        score_a: 13,
        score_b: 12
      }

      expect(validateMatchScore(match, 13, false).valid).toBe(true)
    })
  })
})

describe('Validation Mélée - Terrains', () => {

  describe('validateTerrainAssignment', () => {

    it('devrait accepter assignation valide', () => {
      const matches: Match[] = [
        { equipe_a_id: 't1', equipe_b_id: 't2', score_a: 0, score_b: 0, terrain: 1 },
        { equipe_a_id: 't3', equipe_b_id: 't4', score_a: 0, score_b: 0, terrain: 2 }
      ]

      expect(validateTerrainAssignment(matches, 4).valid).toBe(true)
    })

    it('devrait rejeter match sans terrain', () => {
      const matches: Match[] = [
        { equipe_a_id: 't1', equipe_b_id: 't2', score_a: 0, score_b: 0 } // Pas de terrain
      ]

      const result = validateTerrainAssignment(matches, 4)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('sans terrain')
    })

    it('devrait rejeter terrain invalide', () => {
      const matches: Match[] = [
        { equipe_a_id: 't1', equipe_b_id: 't2', score_a: 0, score_b: 0, terrain: 5 }
      ]

      const result = validateTerrainAssignment(matches, 4)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('invalide')
    })

    it('devrait rejeter terrain en doublon', () => {
      const matches: Match[] = [
        { equipe_a_id: 't1', equipe_b_id: 't2', score_a: 0, score_b: 0, terrain: 1 },
        { equipe_a_id: 't3', equipe_b_id: 't4', score_a: 0, score_b: 0, terrain: 1 } // Même terrain!
      ]

      const result = validateTerrainAssignment(matches, 4)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('plusieurs matchs')
    })

    it('devrait ignorer BYE pour terrain', () => {
      const matches: Match[] = [
        { equipe_a_id: 't1', equipe_b_id: 't2', score_a: 0, score_b: 0, terrain: 1 },
        { equipe_a_id: 't3', equipe_b_id: null, score_a: 0, score_b: 0 } // BYE, pas de terrain
      ]

      expect(validateTerrainAssignment(matches, 4).valid).toBe(true)
    })

    it('devrait rejeter terrain 0', () => {
      const matches: Match[] = [
        { equipe_a_id: 't1', equipe_b_id: 't2', score_a: 0, score_b: 0, terrain: 0 }
      ]

      const result = validateTerrainAssignment(matches, 4)
      expect(result.valid).toBe(false)
    })
  })
})

describe('Validation Mélée - Progression', () => {

  describe('validateRoundProgression', () => {

    it('devrait permettre progression si tous terminés', () => {
      const result = validateRoundProgression(1, ['termine', 'termine', 'termine'], 5)
      expect(result.canProgress).toBe(true)
    })

    it('devrait bloquer si matchs non terminés', () => {
      const result = validateRoundProgression(1, ['termine', 'a_jouer', 'en_cours'], 5)
      expect(result.canProgress).toBe(false)
      expect(result.error).toContain('non terminé')
    })

    it('devrait bloquer au dernier round', () => {
      const result = validateRoundProgression(5, ['termine', 'termine'], 5)
      expect(result.canProgress).toBe(false)
      expect(result.error).toContain('Dernier round')
    })

    it('devrait rejeter round invalide', () => {
      const result = validateRoundProgression(0, ['termine'], 5)
      expect(result.canProgress).toBe(false)
      expect(result.error).toContain('invalide')
    })

    it('devrait rejeter round > total', () => {
      const result = validateRoundProgression(6, ['termine'], 5)
      expect(result.canProgress).toBe(false)
    })
  })
})

describe('Validation Mélée - Edge cases', () => {

  it('devrait gérer liste vide de joueurs', () => {
    const result = validatePlayerCount(0, 'doublette')
    expect(result.valid).toBe(false)
  })

  it('devrait gérer liste vide de matchs pour terrain', () => {
    const result = validateTerrainAssignment([], 4)
    expect(result.valid).toBe(true)
  })

  it('devrait gérer progression avec 0 matchs', () => {
    const result = validateRoundProgression(1, [], 5)
    expect(result.canProgress).toBe(true) // Tous terminés (vide)
  })

  it('devrait accepter maxPoints = 21', () => {
    const settings: MeleeSettings = {
      mode: 'melee_fixe',
      format: 'doublette',
      nbRounds: 3,
      maxPoints: 21,
      timeLimit: false,
      mixiteObligatoire: false,
      nbTerrains: 4
    }

    expect(validateMeleeSettings(settings).valid).toBe(true)
  })

  it('devrait gérer joueur avec genre invalide', () => {
    const players = [
      { id: '1', name: 'A', gender: 'X' as any }
    ]

    const result = validateMixite(players, 'doublette', true)
    expect(result.valid).toBe(false)
  })
})
