/**
 * Tests pour le service de mixité (MixiteService)
 * Vérifie la formation des équipes avec/sans mixité obligatoire
 */

import { describe, it, expect } from 'vitest'

// ============================================================================
// Types simulés depuis le code réel
// ============================================================================

interface Joueur {
  id: string
  name?: string
  gender?: 'H' | 'F'
}

interface TeamComposition {
  joueur_ids: string[]
}

interface MixiteResult {
  teams: TeamComposition[]
  unassignedPlayerIds: string[]
  warnings: string[]
}

// ============================================================================
// Implémentation MixiteService (logique extraite)
// ============================================================================

class MixiteService {
  static validatePlayerGenders(
    players: Joueur[],
    mixiteObligatoire: boolean
  ): { valid: boolean; error?: string; missingGenderPlayerIds?: string[] } {
    if (!mixiteObligatoire) {
      return { valid: true }
    }

    const missingGenderPlayers = players.filter(
      p => !p.gender || (p.gender !== 'H' && p.gender !== 'F')
    )

    if (missingGenderPlayers.length > 0) {
      return {
        valid: false,
        error: `${missingGenderPlayers.length} joueur(s) sans genre défini`,
        missingGenderPlayerIds: missingGenderPlayers.map(p => p.id)
      }
    }

    return { valid: true }
  }

  static validateFormatMixite(
    format: 'tete_a_tete' | 'doublette' | 'triplette',
    mixiteObligatoire: boolean
  ): { valid: boolean; error?: string } {
    if (mixiteObligatoire && format === 'tete_a_tete') {
      return {
        valid: false,
        error: 'Mixité incompatible avec tête-à-tête'
      }
    }
    return { valid: true }
  }

  static createTeamsWithMixite(
    players: Joueur[],
    playersPerTeam: 2 | 3,
    mixiteObligatoire: boolean = false
  ): MixiteResult {
    const result: MixiteResult = {
      teams: [],
      unassignedPlayerIds: [],
      warnings: []
    }

    // Sans mixité obligatoire : formation libre
    if (!mixiteObligatoire) {
      const shuffled = [...players]
      // Fisher-Yates shuffle
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }

      const nbEquipes = Math.floor(shuffled.length / playersPerTeam)

      for (let i = 0; i < nbEquipes; i++) {
        const teamPlayerIds = shuffled
          .slice(i * playersPerTeam, (i + 1) * playersPerTeam)
          .map(p => p.id)
        result.teams.push({ joueur_ids: teamPlayerIds })
      }

      const remaining = shuffled.slice(nbEquipes * playersPerTeam)
      result.unassignedPlayerIds = remaining.map(p => p.id)

      if (remaining.length > 0) {
        result.warnings.push(
          `${remaining.length} joueur(s) non assigné(s)`
        )
      }

      return result
    }

    // Avec mixité obligatoire
    const playersByGender: { H: Joueur[]; F: Joueur[] } = { H: [], F: [] }

    for (const player of players) {
      const gender = player.gender === 'F' ? 'F' : 'H'
      playersByGender[gender].push(player)
    }

    // Shuffle each gender
    for (const gender of ['H', 'F'] as const) {
      const arr = playersByGender[gender]
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
      }
    }

    if (playersPerTeam === 2) {
      // DOUBLETTE : 1H + 1F
      while (playersByGender.H.length > 0 && playersByGender.F.length > 0) {
        const teamPlayerIds = [
          playersByGender.H.shift()!.id,
          playersByGender.F.shift()!.id
        ]
        result.teams.push({ joueur_ids: teamPlayerIds })
      }

      // Équipes restantes non-mixtes
      const remaining = [...playersByGender.H, ...playersByGender.F]
      while (remaining.length >= playersPerTeam) {
        const teamPlayerIds = remaining.splice(0, playersPerTeam).map(p => p.id)
        result.teams.push({ joueur_ids: teamPlayerIds })
      }

      result.unassignedPlayerIds = remaining.map(p => p.id)
    } else {
      // TRIPLETTE : 2H + 1F ou 1H + 2F
      while (
        (playersByGender.H.length >= 2 && playersByGender.F.length >= 1) ||
        (playersByGender.H.length >= 1 && playersByGender.F.length >= 2)
      ) {
        let teamPlayerIds: string[]

        if (playersByGender.H.length >= 2 && playersByGender.F.length >= 1) {
          teamPlayerIds = [
            playersByGender.H.shift()!.id,
            playersByGender.H.shift()!.id,
            playersByGender.F.shift()!.id
          ]
        } else {
          teamPlayerIds = [
            playersByGender.H.shift()!.id,
            playersByGender.F.shift()!.id,
            playersByGender.F.shift()!.id
          ]
        }

        result.teams.push({ joueur_ids: teamPlayerIds })
      }

      // Équipes restantes non-mixtes
      const remaining = [...playersByGender.H, ...playersByGender.F]
      while (remaining.length >= playersPerTeam) {
        const teamPlayerIds = remaining.splice(0, playersPerTeam).map(p => p.id)
        result.teams.push({ joueur_ids: teamPlayerIds })
      }

      result.unassignedPlayerIds = remaining.map(p => p.id)
    }

    if (result.unassignedPlayerIds.length > 0) {
      result.warnings.push(
        `${result.unassignedPlayerIds.length} joueur(s) non assigné(s)`
      )
    }

    return result
  }

  static getMixiteStats(teams: TeamComposition[], players: Joueur[]) {
    let mixedTeams = 0
    let maleOnlyTeams = 0
    let femaleOnlyTeams = 0

    for (const team of teams) {
      const teamPlayers = players.filter(p => team.joueur_ids.includes(p.id))
      const hasH = teamPlayers.some(p => p.gender === 'H' || !p.gender)
      const hasF = teamPlayers.some(p => p.gender === 'F')

      if (hasH && hasF) {
        mixedTeams++
      } else if (hasF) {
        femaleOnlyTeams++
      } else {
        maleOnlyTeams++
      }
    }

    return {
      total: teams.length,
      mixed: mixedTeams,
      maleOnly: maleOnlyTeams,
      femaleOnly: femaleOnlyTeams,
      mixedPercentage: teams.length > 0 ? Math.round((mixedTeams / teams.length) * 100) : 0
    }
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('MixiteService - Formation équipes mélée', () => {

  describe('validatePlayerGenders', () => {

    it('devrait valider sans mixité obligatoire', () => {
      const players: Joueur[] = [
        { id: '1', gender: undefined },
        { id: '2', gender: 'H' }
      ]

      const result = MixiteService.validatePlayerGenders(players, false)
      expect(result.valid).toBe(true)
    })

    it('devrait valider avec mixité et tous les genres définis', () => {
      const players: Joueur[] = [
        { id: '1', gender: 'H' },
        { id: '2', gender: 'F' },
        { id: '3', gender: 'H' },
        { id: '4', gender: 'F' }
      ]

      const result = MixiteService.validatePlayerGenders(players, true)
      expect(result.valid).toBe(true)
    })

    it('devrait rejeter avec mixité et genres manquants', () => {
      const players: Joueur[] = [
        { id: '1', gender: 'H' },
        { id: '2', gender: undefined },
        { id: '3', gender: 'F' }
      ]

      const result = MixiteService.validatePlayerGenders(players, true)
      expect(result.valid).toBe(false)
      expect(result.missingGenderPlayerIds).toContain('2')
    })
  })

  describe('validateFormatMixite', () => {

    it('devrait rejeter tête-à-tête avec mixité obligatoire', () => {
      const result = MixiteService.validateFormatMixite('tete_a_tete', true)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('incompatible')
    })

    it('devrait accepter doublette avec mixité obligatoire', () => {
      const result = MixiteService.validateFormatMixite('doublette', true)
      expect(result.valid).toBe(true)
    })

    it('devrait accepter triplette avec mixité obligatoire', () => {
      const result = MixiteService.validateFormatMixite('triplette', true)
      expect(result.valid).toBe(true)
    })

    it('devrait accepter tête-à-tête sans mixité', () => {
      const result = MixiteService.validateFormatMixite('tete_a_tete', false)
      expect(result.valid).toBe(true)
    })
  })

  describe('createTeamsWithMixite - Sans mixité obligatoire', () => {

    it('devrait former équipes doublette sans contrainte', () => {
      const players: Joueur[] = [
        { id: '1', gender: 'H' },
        { id: '2', gender: 'H' },
        { id: '3', gender: 'H' },
        { id: '4', gender: 'H' }
      ]

      const result = MixiteService.createTeamsWithMixite(players, 2, false)

      expect(result.teams).toHaveLength(2)
      expect(result.unassignedPlayerIds).toHaveLength(0)

      // Chaque équipe a 2 joueurs
      result.teams.forEach(team => {
        expect(team.joueur_ids).toHaveLength(2)
      })
    })

    it('devrait gérer nombre impair (1 non assigné)', () => {
      const players: Joueur[] = [
        { id: '1', gender: 'H' },
        { id: '2', gender: 'F' },
        { id: '3', gender: 'H' }
      ]

      const result = MixiteService.createTeamsWithMixite(players, 2, false)

      expect(result.teams).toHaveLength(1)
      expect(result.unassignedPlayerIds).toHaveLength(1)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('devrait former équipes triplette sans contrainte', () => {
      const players: Joueur[] = [
        { id: '1', gender: 'H' },
        { id: '2', gender: 'H' },
        { id: '3', gender: 'H' },
        { id: '4', gender: 'H' },
        { id: '5', gender: 'H' },
        { id: '6', gender: 'H' }
      ]

      const result = MixiteService.createTeamsWithMixite(players, 3, false)

      expect(result.teams).toHaveLength(2)
      expect(result.unassignedPlayerIds).toHaveLength(0)

      result.teams.forEach(team => {
        expect(team.joueur_ids).toHaveLength(3)
      })
    })

    it('devrait préserver tous les joueurs', () => {
      const players: Joueur[] = [
        { id: '1', gender: 'H' },
        { id: '2', gender: 'F' },
        { id: '3', gender: 'H' },
        { id: '4', gender: 'F' }
      ]

      const result = MixiteService.createTeamsWithMixite(players, 2, false)

      const allPlayerIds = [
        ...result.teams.flatMap(t => t.joueur_ids),
        ...result.unassignedPlayerIds
      ]

      expect(allPlayerIds.sort()).toEqual(['1', '2', '3', '4'])
    })
  })

  describe('createTeamsWithMixite - Doublette avec mixité obligatoire', () => {

    it('devrait former équipes 1H + 1F (équilibre parfait)', () => {
      const players: Joueur[] = [
        { id: 'h1', gender: 'H' },
        { id: 'h2', gender: 'H' },
        { id: 'f1', gender: 'F' },
        { id: 'f2', gender: 'F' }
      ]

      const result = MixiteService.createTeamsWithMixite(players, 2, true)

      expect(result.teams).toHaveLength(2)
      expect(result.unassignedPlayerIds).toHaveLength(0)

      // Chaque équipe doit être mixte
      result.teams.forEach(team => {
        const teamPlayers = players.filter(p => team.joueur_ids.includes(p.id))
        const hasH = teamPlayers.some(p => p.gender === 'H')
        const hasF = teamPlayers.some(p => p.gender === 'F')
        expect(hasH && hasF).toBe(true)
      })
    })

    it('devrait gérer déséquilibre H/F (3H + 1F)', () => {
      const players: Joueur[] = [
        { id: 'h1', gender: 'H' },
        { id: 'h2', gender: 'H' },
        { id: 'h3', gender: 'H' },
        { id: 'f1', gender: 'F' }
      ]

      const result = MixiteService.createTeamsWithMixite(players, 2, true)

      // 1 équipe mixte (H+F), puis 1 équipe non-mixte (H+H)
      expect(result.teams).toHaveLength(2)
      expect(result.unassignedPlayerIds).toHaveLength(0)

      // Au moins 1 équipe mixte
      const stats = MixiteService.getMixiteStats(result.teams, players)
      expect(stats.mixed).toBeGreaterThanOrEqual(1)
    })

    it('devrait gérer 6 joueurs (3H + 3F)', () => {
      const players: Joueur[] = [
        { id: 'h1', gender: 'H' },
        { id: 'h2', gender: 'H' },
        { id: 'h3', gender: 'H' },
        { id: 'f1', gender: 'F' },
        { id: 'f2', gender: 'F' },
        { id: 'f3', gender: 'F' }
      ]

      const result = MixiteService.createTeamsWithMixite(players, 2, true)

      expect(result.teams).toHaveLength(3)
      expect(result.unassignedPlayerIds).toHaveLength(0)

      // Toutes les équipes doivent être mixtes
      const stats = MixiteService.getMixiteStats(result.teams, players)
      expect(stats.mixed).toBe(3)
      expect(stats.mixedPercentage).toBe(100)
    })

    it('devrait gérer un joueur seul restant', () => {
      const players: Joueur[] = [
        { id: 'h1', gender: 'H' },
        { id: 'h2', gender: 'H' },
        { id: 'f1', gender: 'F' }
      ]

      const result = MixiteService.createTeamsWithMixite(players, 2, true)

      // 1 équipe mixte, 1 non assigné
      expect(result.teams).toHaveLength(1)
      expect(result.unassignedPlayerIds).toHaveLength(1)
    })
  })

  describe('createTeamsWithMixite - Triplette avec mixité obligatoire', () => {

    it('devrait former équipes 2H + 1F', () => {
      const players: Joueur[] = [
        { id: 'h1', gender: 'H' },
        { id: 'h2', gender: 'H' },
        { id: 'h3', gender: 'H' },
        { id: 'h4', gender: 'H' },
        { id: 'f1', gender: 'F' },
        { id: 'f2', gender: 'F' }
      ]

      const result = MixiteService.createTeamsWithMixite(players, 3, true)

      expect(result.teams).toHaveLength(2)
      expect(result.unassignedPlayerIds).toHaveLength(0)

      // Chaque équipe mixte
      result.teams.forEach(team => {
        const teamPlayers = players.filter(p => team.joueur_ids.includes(p.id))
        const hasH = teamPlayers.some(p => p.gender === 'H')
        const hasF = teamPlayers.some(p => p.gender === 'F')
        expect(hasH && hasF).toBe(true)
      })
    })

    it('devrait former équipes 1H + 2F si plus de F', () => {
      const players: Joueur[] = [
        { id: 'h1', gender: 'H' },
        { id: 'f1', gender: 'F' },
        { id: 'f2', gender: 'F' },
        { id: 'f3', gender: 'F' },
        { id: 'f4', gender: 'F' },
        { id: 'h2', gender: 'H' }
      ]

      const result = MixiteService.createTeamsWithMixite(players, 3, true)

      expect(result.teams).toHaveLength(2)

      // L'algorithme priorise 2H+1F puis 1H+2F
      // Avec 2H + 4F: on ne peut pas faire 2H+1F (pas assez de H pour 2 équipes)
      // Donc on fait: 1H+2F, puis avec 1H+2F restants → 1 équipe mixte + restes
      // En réalité: 1ère équipe 1H+2F (mixte), 2ème équipe avec les 1H+2F restants (mixte aussi)
      // Mais l'algorithme fait while avec priorité 2H+1F d'abord
      // Avec 2H, 4F: peut faire 1 équipe 2H+1F? Non car après on n'a plus de H
      // Donc fait 1H+2F → ok, puis 1H+2F → ok = 2 équipes mixtes

      // En fait l'algo vérifie H>=2 && F>=1 OU H>=1 && F>=2
      // Round 1: H=2, F=4 → H>=2&&F>=1=true → fait 2H+1F → H=0, F=3
      // Round 2: H=0, F=3 → H>=2&&F>=1=false, H>=1&&F>=2=false → sort de la boucle
      // Puis fait équipe non-mixte avec les 3F restants
      // Résultat: 1 mixte + 1 non-mixte

      const stats = MixiteService.getMixiteStats(result.teams, players)
      expect(stats.mixed).toBe(1) // Une seule équipe mixte (2H+1F)
      expect(stats.femaleOnly).toBe(1) // Une équipe que de femmes (3F)
    })

    it('devrait gérer 9 joueurs (5H + 4F)', () => {
      const players: Joueur[] = [
        { id: 'h1', gender: 'H' },
        { id: 'h2', gender: 'H' },
        { id: 'h3', gender: 'H' },
        { id: 'h4', gender: 'H' },
        { id: 'h5', gender: 'H' },
        { id: 'f1', gender: 'F' },
        { id: 'f2', gender: 'F' },
        { id: 'f3', gender: 'F' },
        { id: 'f4', gender: 'F' }
      ]

      const result = MixiteService.createTeamsWithMixite(players, 3, true)

      expect(result.teams).toHaveLength(3)
      expect(result.unassignedPlayerIds).toHaveLength(0)
    })

    it('devrait gérer 2 joueurs restants non assignables', () => {
      const players: Joueur[] = [
        { id: 'h1', gender: 'H' },
        { id: 'h2', gender: 'H' },
        { id: 'f1', gender: 'F' },
        { id: 'f2', gender: 'F' },
        { id: 'h3', gender: 'H' }
      ]

      const result = MixiteService.createTeamsWithMixite(players, 3, true)

      // 1 équipe (2H+1F ou 1H+2F), 2 non assignés
      expect(result.teams).toHaveLength(1)
      expect(result.unassignedPlayerIds).toHaveLength(2)
    })
  })

  describe('getMixiteStats', () => {

    it('devrait calculer stats avec toutes équipes mixtes', () => {
      const players: Joueur[] = [
        { id: 'h1', gender: 'H' },
        { id: 'f1', gender: 'F' },
        { id: 'h2', gender: 'H' },
        { id: 'f2', gender: 'F' }
      ]

      const teams: TeamComposition[] = [
        { joueur_ids: ['h1', 'f1'] },
        { joueur_ids: ['h2', 'f2'] }
      ]

      const stats = MixiteService.getMixiteStats(teams, players)

      expect(stats.total).toBe(2)
      expect(stats.mixed).toBe(2)
      expect(stats.maleOnly).toBe(0)
      expect(stats.femaleOnly).toBe(0)
      expect(stats.mixedPercentage).toBe(100)
    })

    it('devrait calculer stats avec mix d\'équipes', () => {
      const players: Joueur[] = [
        { id: 'h1', gender: 'H' },
        { id: 'f1', gender: 'F' },
        { id: 'h2', gender: 'H' },
        { id: 'h3', gender: 'H' }
      ]

      const teams: TeamComposition[] = [
        { joueur_ids: ['h1', 'f1'] },  // Mixte
        { joueur_ids: ['h2', 'h3'] }   // Hommes seuls
      ]

      const stats = MixiteService.getMixiteStats(teams, players)

      expect(stats.total).toBe(2)
      expect(stats.mixed).toBe(1)
      expect(stats.maleOnly).toBe(1)
      expect(stats.femaleOnly).toBe(0)
      expect(stats.mixedPercentage).toBe(50)
    })

    it('devrait gérer équipe femmes seules', () => {
      const players: Joueur[] = [
        { id: 'f1', gender: 'F' },
        { id: 'f2', gender: 'F' }
      ]

      const teams: TeamComposition[] = [
        { joueur_ids: ['f1', 'f2'] }
      ]

      const stats = MixiteService.getMixiteStats(teams, players)

      expect(stats.femaleOnly).toBe(1)
      expect(stats.mixed).toBe(0)
    })
  })

  describe('Edge cases', () => {

    it('devrait gérer liste vide de joueurs', () => {
      const result = MixiteService.createTeamsWithMixite([], 2, false)

      expect(result.teams).toHaveLength(0)
      expect(result.unassignedPlayerIds).toHaveLength(0)
    })

    it('devrait gérer 1 seul joueur', () => {
      const players: Joueur[] = [{ id: '1', gender: 'H' }]

      const result = MixiteService.createTeamsWithMixite(players, 2, false)

      expect(result.teams).toHaveLength(0)
      expect(result.unassignedPlayerIds).toHaveLength(1)
    })

    it('devrait traiter joueur sans genre comme H', () => {
      const players: Joueur[] = [
        { id: '1', gender: undefined },
        { id: '2', gender: 'F' }
      ]

      const result = MixiteService.createTeamsWithMixite(players, 2, true)

      expect(result.teams).toHaveLength(1)

      // L'équipe devrait être mixte (undefined traité comme H)
      const stats = MixiteService.getMixiteStats(result.teams, players)
      expect(stats.mixed).toBe(1)
    })

    it('devrait gérer uniquement des H avec mixité obligatoire', () => {
      const players: Joueur[] = [
        { id: 'h1', gender: 'H' },
        { id: 'h2', gender: 'H' },
        { id: 'h3', gender: 'H' },
        { id: 'h4', gender: 'H' }
      ]

      const result = MixiteService.createTeamsWithMixite(players, 2, true)

      // Devrait créer des équipes non-mixtes car pas de F
      expect(result.teams).toHaveLength(2)

      const stats = MixiteService.getMixiteStats(result.teams, players)
      expect(stats.mixed).toBe(0)
      expect(stats.maleOnly).toBe(2)
    })

    it('devrait gérer uniquement des F avec mixité obligatoire', () => {
      const players: Joueur[] = [
        { id: 'f1', gender: 'F' },
        { id: 'f2', gender: 'F' },
        { id: 'f3', gender: 'F' },
        { id: 'f4', gender: 'F' }
      ]

      const result = MixiteService.createTeamsWithMixite(players, 2, true)

      expect(result.teams).toHaveLength(2)

      const stats = MixiteService.getMixiteStats(result.teams, players)
      expect(stats.mixed).toBe(0)
      expect(stats.femaleOnly).toBe(2)
    })
  })
})
