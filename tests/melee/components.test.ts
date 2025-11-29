/**
 * Tests des composants React pour la mêlée tournante
 * Tests de la logique de rendu sans DOM (tests unitaires)
 */

import { describe, it, expect } from 'vitest'

// ============================================================================
// Types simulés des composants
// ============================================================================

interface PlayerRanking {
  id: string
  name: string
  email?: string
  played: number
  victories: number
  defeats: number
  draws: number
  pointsFor: number
  pointsAgainst: number
  difference: number
  points: number
}

interface TeamWithStats {
  id: string
  name: string
  played: number
  victories: number
  defeats: number
  draws: number
  pointsFor: number
  pointsAgainst: number
  difference: number
}

interface TournamentHeaderProps {
  tournament: {
    id: string
    name: string
    status: 'preparation' | 'en_cours' | 'termine'
    mode: 'choisi' | 'melee_fixe' | 'melee_tournante'
  }
  isOrganizer: boolean
  canGenerateElimination: boolean
  canGenerateFinale: boolean
}

// ============================================================================
// Logique de rendu simulée (extraite des composants)
// ============================================================================

/**
 * Détermine la médaille à afficher selon le rang
 */
function getMedalEmoji(rank: number): string | null {
  switch (rank) {
    case 0: return '🥇'
    case 1: return '🥈'
    case 2: return '🥉'
    default: return null
  }
}

/**
 * Détermine la couleur du rang
 */
function getRankColor(rank: number): string {
  switch (rank) {
    case 0: return 'text-yellow-600'
    case 1: return 'text-gray-600'
    case 2: return 'text-orange-600'
    default: return 'text-gray-400'
  }
}

/**
 * Formate la différence de points avec signe
 */
function formatDifference(diff: number): string {
  return diff >= 0 ? `+${diff}` : `${diff}`
}

/**
 * Détermine la couleur de la différence
 */
function getDifferenceColor(diff: number): string {
  return diff >= 0 ? 'text-green-600' : 'text-red-600'
}

/**
 * Détermine le badge de statut du tournoi
 */
function getStatusBadge(status: string): { text: string; className: string } {
  switch (status) {
    case 'preparation':
      return { text: 'Prépa', className: 'bg-yellow-100 text-yellow-700' }
    case 'en_cours':
      return { text: 'En cours', className: 'bg-green-100 text-green-700' }
    case 'termine':
      return { text: 'Terminé', className: 'bg-gray-100 text-gray-700' }
    default:
      return { text: 'Inconnu', className: 'bg-gray-100 text-gray-500' }
  }
}

/**
 * Détermine quels boutons afficher dans le header
 */
function getHeaderButtons(props: TournamentHeaderProps): string[] {
  const buttons: string[] = []

  if (props.tournament.status === 'preparation' && props.isOrganizer) {
    buttons.push('start')
  }

  if (props.tournament.mode === 'melee_tournante' &&
      props.tournament.status === 'en_cours' &&
      props.isOrganizer) {
    buttons.push('rotation')
  }

  if (props.canGenerateElimination && props.isOrganizer) {
    buttons.push('elimination')
  }

  if (props.canGenerateFinale && props.isOrganizer) {
    buttons.push('finale')
  }

  return buttons
}

/**
 * Vérifie si le classement est complet (tous ont joué)
 */
function isRankingComplete(players: PlayerRanking[]): boolean {
  return players.length > 0 && players.every(p => p.played > 0)
}

/**
 * Calcule les statistiques globales du classement
 */
function calculateRankingStats(players: PlayerRanking[]): {
  totalMatches: number
  totalVictories: number
  avgPointsPerPlayer: number
} {
  const totalVictories = players.reduce((sum, p) => sum + p.victories, 0)
  const totalPoints = players.reduce((sum, p) => sum + p.points, 0)

  return {
    totalMatches: Math.floor(totalVictories), // Chaque match a 1 gagnant
    totalVictories,
    avgPointsPerPlayer: players.length > 0 ? totalPoints / players.length : 0
  }
}

/**
 * Tronque le nom du tournoi si trop long
 */
function truncateName(name: string, maxLength: number): string {
  return name.length > maxLength ? name.substring(0, maxLength) + '...' : name
}

/**
 * Vérifie si un joueur est dans le top 3
 */
function isTopThree(rank: number): boolean {
  return rank < 3
}

/**
 * Génère la classe CSS de la ligne selon le rang
 */
function getRowClassName(rank: number): string {
  const base = 'hover:bg-gray-50 transition-colors'
  return isTopThree(rank) ? `${base} bg-purple-50/30` : base
}

// ============================================================================
// Tests
// ============================================================================

describe('Composants Mêlée Tournante - PlayerRankingsTable', () => {

  describe('getMedalEmoji', () => {

    it('devrait retourner or pour rang 0', () => {
      expect(getMedalEmoji(0)).toBe('🥇')
    })

    it('devrait retourner argent pour rang 1', () => {
      expect(getMedalEmoji(1)).toBe('🥈')
    })

    it('devrait retourner bronze pour rang 2', () => {
      expect(getMedalEmoji(2)).toBe('🥉')
    })

    it('devrait retourner null pour rang > 2', () => {
      expect(getMedalEmoji(3)).toBeNull()
      expect(getMedalEmoji(10)).toBeNull()
    })
  })

  describe('getRankColor', () => {

    it('devrait retourner jaune pour 1er', () => {
      expect(getRankColor(0)).toContain('yellow')
    })

    it('devrait retourner gris pour 2ème', () => {
      expect(getRankColor(1)).toContain('gray-600')
    })

    it('devrait retourner orange pour 3ème', () => {
      expect(getRankColor(2)).toContain('orange')
    })

    it('devrait retourner gris clair pour autres', () => {
      expect(getRankColor(5)).toContain('gray-400')
    })
  })

  describe('formatDifference', () => {

    it('devrait ajouter + pour positif', () => {
      expect(formatDifference(5)).toBe('+5')
      expect(formatDifference(0)).toBe('+0')
    })

    it('devrait garder - pour négatif', () => {
      expect(formatDifference(-3)).toBe('-3')
    })
  })

  describe('getDifferenceColor', () => {

    it('devrait être vert pour positif ou zéro', () => {
      expect(getDifferenceColor(5)).toContain('green')
      expect(getDifferenceColor(0)).toContain('green')
    })

    it('devrait être rouge pour négatif', () => {
      expect(getDifferenceColor(-3)).toContain('red')
    })
  })

  describe('isRankingComplete', () => {

    it('devrait retourner true si tous ont joué', () => {
      const players: PlayerRanking[] = [
        { id: '1', name: 'A', played: 3, victories: 2, defeats: 1, draws: 0, pointsFor: 30, pointsAgainst: 20, difference: 10, points: 6 },
        { id: '2', name: 'B', played: 3, victories: 1, defeats: 2, draws: 0, pointsFor: 20, pointsAgainst: 30, difference: -10, points: 3 }
      ]

      expect(isRankingComplete(players)).toBe(true)
    })

    it('devrait retourner false si un n\'a pas joué', () => {
      const players: PlayerRanking[] = [
        { id: '1', name: 'A', played: 3, victories: 2, defeats: 1, draws: 0, pointsFor: 30, pointsAgainst: 20, difference: 10, points: 6 },
        { id: '2', name: 'B', played: 0, victories: 0, defeats: 0, draws: 0, pointsFor: 0, pointsAgainst: 0, difference: 0, points: 0 }
      ]

      expect(isRankingComplete(players)).toBe(false)
    })

    it('devrait retourner false pour liste vide', () => {
      expect(isRankingComplete([])).toBe(false)
    })
  })

  describe('calculateRankingStats', () => {

    it('devrait calculer totaux corrects', () => {
      const players: PlayerRanking[] = [
        { id: '1', name: 'A', played: 3, victories: 2, defeats: 1, draws: 0, pointsFor: 30, pointsAgainst: 20, difference: 10, points: 6 },
        { id: '2', name: 'B', played: 3, victories: 1, defeats: 2, draws: 0, pointsFor: 20, pointsAgainst: 30, difference: -10, points: 3 }
      ]

      const stats = calculateRankingStats(players)

      expect(stats.totalVictories).toBe(3)
      expect(stats.avgPointsPerPlayer).toBe(4.5)
    })

    it('devrait gérer liste vide', () => {
      const stats = calculateRankingStats([])

      expect(stats.totalVictories).toBe(0)
      expect(stats.avgPointsPerPlayer).toBe(0)
    })
  })

  describe('getRowClassName', () => {

    it('devrait inclure bg-purple pour top 3', () => {
      expect(getRowClassName(0)).toContain('bg-purple')
      expect(getRowClassName(1)).toContain('bg-purple')
      expect(getRowClassName(2)).toContain('bg-purple')
    })

    it('devrait ne pas inclure bg-purple pour autres', () => {
      expect(getRowClassName(3)).not.toContain('bg-purple')
      expect(getRowClassName(10)).not.toContain('bg-purple')
    })
  })
})

describe('Composants Mêlée Tournante - TournamentHeader', () => {

  describe('getStatusBadge', () => {

    it('devrait retourner jaune pour preparation', () => {
      const badge = getStatusBadge('preparation')
      expect(badge.text).toBe('Prépa')
      expect(badge.className).toContain('yellow')
    })

    it('devrait retourner vert pour en_cours', () => {
      const badge = getStatusBadge('en_cours')
      expect(badge.text).toBe('En cours')
      expect(badge.className).toContain('green')
    })

    it('devrait retourner gris pour termine', () => {
      const badge = getStatusBadge('termine')
      expect(badge.text).toBe('Terminé')
      expect(badge.className).toContain('gray')
    })
  })

  describe('getHeaderButtons', () => {

    it('devrait afficher bouton démarrer en preparation', () => {
      const buttons = getHeaderButtons({
        tournament: { id: '1', name: 'Test', status: 'preparation', mode: 'melee_tournante' },
        isOrganizer: true,
        canGenerateElimination: false,
        canGenerateFinale: false
      })

      expect(buttons).toContain('start')
      expect(buttons).not.toContain('rotation')
    })

    it('devrait afficher bouton rotation en cours pour mêlée tournante', () => {
      const buttons = getHeaderButtons({
        tournament: { id: '1', name: 'Test', status: 'en_cours', mode: 'melee_tournante' },
        isOrganizer: true,
        canGenerateElimination: false,
        canGenerateFinale: false
      })

      expect(buttons).toContain('rotation')
      expect(buttons).not.toContain('start')
    })

    it('ne devrait pas afficher rotation pour mêlée fixe', () => {
      const buttons = getHeaderButtons({
        tournament: { id: '1', name: 'Test', status: 'en_cours', mode: 'melee_fixe' },
        isOrganizer: true,
        canGenerateElimination: false,
        canGenerateFinale: false
      })

      expect(buttons).not.toContain('rotation')
    })

    it('ne devrait rien afficher si pas organisateur', () => {
      const buttons = getHeaderButtons({
        tournament: { id: '1', name: 'Test', status: 'preparation', mode: 'melee_tournante' },
        isOrganizer: false,
        canGenerateElimination: true,
        canGenerateFinale: true
      })

      expect(buttons).toHaveLength(0)
    })

    it('devrait afficher elimination et finale si conditions remplies', () => {
      const buttons = getHeaderButtons({
        tournament: { id: '1', name: 'Test', status: 'en_cours', mode: 'melee_fixe' },
        isOrganizer: true,
        canGenerateElimination: true,
        canGenerateFinale: true
      })

      expect(buttons).toContain('elimination')
      expect(buttons).toContain('finale')
    })
  })

  describe('truncateName', () => {

    it('devrait tronquer si trop long', () => {
      const longName = 'Un très très long nom de tournoi qui dépasse la limite'
      expect(truncateName(longName, 20)).toBe('Un très très long no...')
    })

    it('devrait garder intact si assez court', () => {
      const shortName = 'Tournoi Test'
      expect(truncateName(shortName, 20)).toBe('Tournoi Test')
    })

    it('devrait gérer exactement la limite', () => {
      const exactName = '12345678901234567890'
      expect(truncateName(exactName, 20)).toBe(exactName)
    })
  })
})

describe('Composants Mêlée Tournante - Affichage données', () => {

  describe('Rendu liste joueurs', () => {

    it('devrait trier par points décroissants', () => {
      const players: PlayerRanking[] = [
        { id: '1', name: 'C', played: 3, victories: 1, defeats: 2, draws: 0, pointsFor: 20, pointsAgainst: 30, difference: -10, points: 3 },
        { id: '2', name: 'A', played: 3, victories: 3, defeats: 0, draws: 0, pointsFor: 39, pointsAgainst: 15, difference: 24, points: 9 },
        { id: '3', name: 'B', played: 3, victories: 2, defeats: 1, draws: 0, pointsFor: 30, pointsAgainst: 20, difference: 10, points: 6 }
      ]

      const sorted = [...players].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.difference !== a.difference) return b.difference - a.difference
        return b.pointsFor - a.pointsFor
      })

      expect(sorted[0].name).toBe('A')
      expect(sorted[1].name).toBe('B')
      expect(sorted[2].name).toBe('C')
    })

    it('devrait départager par différence si points égaux', () => {
      const players: PlayerRanking[] = [
        { id: '1', name: 'X', played: 3, victories: 2, defeats: 1, draws: 0, pointsFor: 25, pointsAgainst: 20, difference: 5, points: 6 },
        { id: '2', name: 'Y', played: 3, victories: 2, defeats: 1, draws: 0, pointsFor: 30, pointsAgainst: 15, difference: 15, points: 6 }
      ]

      const sorted = [...players].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.difference !== a.difference) return b.difference - a.difference
        return b.pointsFor - a.pointsFor
      })

      expect(sorted[0].name).toBe('Y') // Meilleure différence
    })

    it('devrait départager par pointsFor si tout égal', () => {
      const players: PlayerRanking[] = [
        { id: '1', name: 'P', played: 3, victories: 2, defeats: 1, draws: 0, pointsFor: 30, pointsAgainst: 25, difference: 5, points: 6 },
        { id: '2', name: 'Q', played: 3, victories: 2, defeats: 1, draws: 0, pointsFor: 35, pointsAgainst: 30, difference: 5, points: 6 }
      ]

      const sorted = [...players].sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points
        if (b.difference !== a.difference) return b.difference - a.difference
        return b.pointsFor - a.pointsFor
      })

      expect(sorted[0].name).toBe('Q') // Plus de points marqués
    })
  })

  describe('Affichage conditionnel', () => {

    it('devrait afficher message si liste vide', () => {
      const players: PlayerRanking[] = []
      const showEmptyMessage = players.length === 0

      expect(showEmptyMessage).toBe(true)
    })

    it('devrait masquer email sur mobile (logique)', () => {
      // Simuler la logique de masquage responsive
      const isMobile = true
      const player: PlayerRanking = {
        id: '1',
        name: 'Test',
        email: 'test@example.com',
        played: 3, victories: 2, defeats: 1, draws: 0,
        pointsFor: 30, pointsAgainst: 20, difference: 10, points: 6
      }

      const shouldShowEmail = player.email && !isMobile
      expect(shouldShowEmail).toBe(false)

      const isDesktop = false
      const shouldShowEmailDesktop = player.email && isDesktop
      expect(shouldShowEmailDesktop).toBe(false)
    })
  })
})

describe('Composants Mêlée Tournante - Edge cases', () => {

  it('devrait gérer joueur avec stats à zéro', () => {
    const player: PlayerRanking = {
      id: '1',
      name: 'Nouveau',
      played: 0,
      victories: 0,
      defeats: 0,
      draws: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      difference: 0,
      points: 0
    }

    expect(formatDifference(player.difference)).toBe('+0')
    expect(getDifferenceColor(player.difference)).toContain('green')
    expect(getMedalEmoji(0)).toBe('🥇') // Même avec 0 matchs, si 1er
  })

  it('devrait gérer nom très long', () => {
    const longName = 'Jean-Pierre-Marie de la Fontaine du Lac Bleu'
    const truncated = truncateName(longName, 20)

    expect(truncated.length).toBeLessThanOrEqual(23) // 20 + '...'
    expect(truncated.endsWith('...')).toBe(true)
  })

  it('devrait gérer caractères spéciaux dans le nom', () => {
    const specialName = 'José Müller (Équipe A)'
    const truncated = truncateName(specialName, 50)

    expect(truncated).toBe(specialName) // Pas de troncature
  })

  it('devrait gérer score différence extrême', () => {
    const extremeDiff = 1000
    const formatted = formatDifference(extremeDiff)

    expect(formatted).toBe('+1000')
  })

  it('devrait gérer rang > 100', () => {
    const medal = getMedalEmoji(150)
    const color = getRankColor(150)

    expect(medal).toBeNull()
    expect(color).toContain('gray-400')
  })
})
