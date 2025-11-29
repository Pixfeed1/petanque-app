/**
 * Tests des composants React pour le mode Choisi
 * Tests de la logique de rendu sans DOM (tests unitaires)
 */

import { describe, it, expect } from 'vitest'

// ============================================================================
// Types simulés des composants
// ============================================================================

interface TeamRanking {
  id: string
  name: string
  poule: string
  played: number
  victories: number
  defeats: number
  draws: number
  pointsFor: number
  pointsAgainst: number
  difference: number
  points: number // FIPJP: victoires × 3 + nuls × 1
}

interface BracketMatch {
  id: string
  teamA: { id: string; name: string } | null
  teamB: { id: string; name: string } | null
  scoreA: number | null
  scoreB: number | null
  status: 'a_jouer' | 'en_cours' | 'termine'
  round: 'huitieme' | 'quart' | 'demi' | 'finale' | 'petite_finale'
  isBye: boolean
}

interface PouleTableProps {
  teams: TeamRanking[]
  qualifiedCount: number
}

// ============================================================================
// Logique de rendu simulée (extraite des composants)
// ============================================================================

/**
 * Détermine si une équipe est qualifiée
 */
function isQualified(rank: number, qualifiedCount: number): boolean {
  return rank < qualifiedCount
}

/**
 * Obtient la couleur de fond selon le rang
 */
function getRowBackgroundColor(rank: number, qualifiedCount: number): string {
  if (rank < qualifiedCount) {
    return 'bg-green-50' // Qualifié
  }
  return ''
}

/**
 * Formate le nom de la poule
 */
function formatPouleName(poule: string): string {
  return `Poule ${poule}`
}

/**
 * Calcule les points FIPJP
 */
function calculateFIPJPPoints(victories: number, draws: number): number {
  return victories * 3 + draws
}

/**
 * Trie les équipes selon les règles FIPJP
 */
function sortTeamsByFIPJP(teams: TeamRanking[]): TeamRanking[] {
  return [...teams].sort((a, b) => {
    // 1. Points FIPJP
    if (b.points !== a.points) return b.points - a.points
    // 2. Différence
    if (b.difference !== a.difference) return b.difference - a.difference
    // 3. Points marqués
    return b.pointsFor - a.pointsFor
  })
}

/**
 * Obtient le nom du round en français
 */
function getRoundDisplayName(round: string): string {
  const names: Record<string, string> = {
    huitieme: 'Huitièmes de finale',
    quart: 'Quarts de finale',
    demi: 'Demi-finales',
    finale: 'Finale',
    petite_finale: 'Petite finale'
  }
  return names[round] || round
}

/**
 * Obtient la couleur du statut de match
 */
function getMatchStatusColor(status: string): string {
  switch (status) {
    case 'a_jouer': return 'bg-gray-100 text-gray-600'
    case 'en_cours': return 'bg-yellow-100 text-yellow-700'
    case 'termine': return 'bg-green-100 text-green-700'
    default: return 'bg-gray-100 text-gray-500'
  }
}

/**
 * Obtient le texte du statut
 */
function getMatchStatusText(status: string): string {
  switch (status) {
    case 'a_jouer': return 'À jouer'
    case 'en_cours': return 'En cours'
    case 'termine': return 'Terminé'
    default: return 'Inconnu'
  }
}

/**
 * Détermine le gagnant d'un match
 */
function getMatchWinner(match: BracketMatch): { id: string; name: string } | null {
  if (match.isBye && match.teamA) {
    return match.teamA
  }

  if (match.status !== 'termine' || match.scoreA === null || match.scoreB === null) {
    return null
  }

  if (match.scoreA > match.scoreB && match.teamA) {
    return match.teamA
  } else if (match.scoreB > match.scoreA && match.teamB) {
    return match.teamB
  }

  return null // Égalité
}

/**
 * Formate le score pour affichage
 */
function formatScore(scoreA: number | null, scoreB: number | null): string {
  if (scoreA === null || scoreB === null) {
    return '- : -'
  }
  return `${scoreA} : ${scoreB}`
}

/**
 * Détermine la classe CSS pour une équipe selon victoire/défaite
 */
function getTeamResultClass(isWinner: boolean | null): string {
  if (isWinner === null) return ''
  return isWinner ? 'font-bold text-green-700' : 'text-gray-400'
}

/**
 * Calcule le nombre de BYE nécessaires
 */
function calculateByeCount(nbTeams: number): number {
  if (nbTeams <= 2) return 0
  if (nbTeams <= 4) return 4 - nbTeams
  if (nbTeams <= 8) return 8 - nbTeams
  if (nbTeams <= 16) return 16 - nbTeams
  return 0
}

/**
 * Détermine la largeur de colonne du bracket selon le round
 */
function getBracketColumnWidth(round: string): string {
  const widths: Record<string, string> = {
    huitieme: 'w-1/4',
    quart: 'w-1/3',
    demi: 'w-1/2',
    finale: 'w-full'
  }
  return widths[round] || 'w-full'
}

/**
 * Génère le texte de progression du tournoi
 */
function getTournamentProgressText(
  totalPouleMatches: number,
  completedPouleMatches: number,
  eliminationStarted: boolean
): string {
  if (!eliminationStarted) {
    const percent = totalPouleMatches > 0
      ? Math.round((completedPouleMatches / totalPouleMatches) * 100)
      : 0
    return `Phase de poules : ${completedPouleMatches}/${totalPouleMatches} matchs (${percent}%)`
  }
  return 'Phase éliminatoire en cours'
}

/**
 * Vérifie si on peut générer le bracket
 */
function canGenerateBracket(
  pouleMatchesCompleted: boolean,
  hasDraws: boolean,
  bracketAlreadyGenerated: boolean
): { canGenerate: boolean; reason?: string } {
  if (bracketAlreadyGenerated) {
    return { canGenerate: false, reason: 'Le bracket a déjà été généré' }
  }

  if (!pouleMatchesCompleted) {
    return { canGenerate: false, reason: 'Tous les matchs de poule doivent être terminés' }
  }

  if (hasDraws) {
    return { canGenerate: false, reason: 'Des égalités ont été détectées dans les poules' }
  }

  return { canGenerate: true }
}

// ============================================================================
// Tests
// ============================================================================

describe('Composants Mode Choisi - PouleTable', () => {

  describe('isQualified', () => {

    it('devrait qualifier les 2 premiers si qualifiedCount=2', () => {
      expect(isQualified(0, 2)).toBe(true)
      expect(isQualified(1, 2)).toBe(true)
      expect(isQualified(2, 2)).toBe(false)
      expect(isQualified(3, 2)).toBe(false)
    })

    it('devrait qualifier seulement le 1er si qualifiedCount=1', () => {
      expect(isQualified(0, 1)).toBe(true)
      expect(isQualified(1, 1)).toBe(false)
    })

    it('devrait qualifier les 3 premiers si qualifiedCount=3', () => {
      expect(isQualified(0, 3)).toBe(true)
      expect(isQualified(1, 3)).toBe(true)
      expect(isQualified(2, 3)).toBe(true)
      expect(isQualified(3, 3)).toBe(false)
    })
  })

  describe('getRowBackgroundColor', () => {

    it('devrait retourner vert pour les qualifiés', () => {
      expect(getRowBackgroundColor(0, 2)).toContain('green')
      expect(getRowBackgroundColor(1, 2)).toContain('green')
    })

    it('devrait retourner vide pour les non-qualifiés', () => {
      expect(getRowBackgroundColor(2, 2)).toBe('')
      expect(getRowBackgroundColor(3, 2)).toBe('')
    })
  })

  describe('formatPouleName', () => {

    it('devrait formater le nom de poule', () => {
      expect(formatPouleName('A')).toBe('Poule A')
      expect(formatPouleName('B')).toBe('Poule B')
    })
  })

  describe('calculateFIPJPPoints', () => {

    it('devrait calculer 9 points pour 3 victoires', () => {
      expect(calculateFIPJPPoints(3, 0)).toBe(9)
    })

    it('devrait calculer 7 points pour 2V + 1N', () => {
      expect(calculateFIPJPPoints(2, 1)).toBe(7)
    })

    it('devrait calculer 3 points pour 3 nuls', () => {
      expect(calculateFIPJPPoints(0, 3)).toBe(3)
    })

    it('devrait calculer 0 points pour 0V + 0N', () => {
      expect(calculateFIPJPPoints(0, 0)).toBe(0)
    })
  })

  describe('sortTeamsByFIPJP', () => {

    it('devrait trier par points décroissants', () => {
      const teams: TeamRanking[] = [
        { id: '1', name: 'A', poule: 'A', played: 3, victories: 1, defeats: 2, draws: 0, pointsFor: 20, pointsAgainst: 30, difference: -10, points: 3 },
        { id: '2', name: 'B', poule: 'A', played: 3, victories: 3, defeats: 0, draws: 0, pointsFor: 39, pointsAgainst: 15, difference: 24, points: 9 },
        { id: '3', name: 'C', poule: 'A', played: 3, victories: 2, defeats: 1, draws: 0, pointsFor: 30, pointsAgainst: 20, difference: 10, points: 6 }
      ]

      const sorted = sortTeamsByFIPJP(teams)

      expect(sorted[0].name).toBe('B') // 9 points
      expect(sorted[1].name).toBe('C') // 6 points
      expect(sorted[2].name).toBe('A') // 3 points
    })

    it('devrait départager par différence si points égaux', () => {
      const teams: TeamRanking[] = [
        { id: '1', name: 'X', poule: 'A', played: 3, victories: 2, defeats: 1, draws: 0, pointsFor: 25, pointsAgainst: 20, difference: 5, points: 6 },
        { id: '2', name: 'Y', poule: 'A', played: 3, victories: 2, defeats: 1, draws: 0, pointsFor: 35, pointsAgainst: 20, difference: 15, points: 6 }
      ]

      const sorted = sortTeamsByFIPJP(teams)

      expect(sorted[0].name).toBe('Y') // diff +15
      expect(sorted[1].name).toBe('X') // diff +5
    })

    it('devrait départager par pointsFor si tout égal', () => {
      const teams: TeamRanking[] = [
        { id: '1', name: 'P', poule: 'A', played: 3, victories: 2, defeats: 1, draws: 0, pointsFor: 30, pointsAgainst: 25, difference: 5, points: 6 },
        { id: '2', name: 'Q', poule: 'A', played: 3, victories: 2, defeats: 1, draws: 0, pointsFor: 35, pointsAgainst: 30, difference: 5, points: 6 }
      ]

      const sorted = sortTeamsByFIPJP(teams)

      expect(sorted[0].name).toBe('Q') // 35 points marqués
    })
  })
})

describe('Composants Mode Choisi - BracketView', () => {

  describe('getRoundDisplayName', () => {

    it('devrait retourner noms français', () => {
      expect(getRoundDisplayName('huitieme')).toBe('Huitièmes de finale')
      expect(getRoundDisplayName('quart')).toBe('Quarts de finale')
      expect(getRoundDisplayName('demi')).toBe('Demi-finales')
      expect(getRoundDisplayName('finale')).toBe('Finale')
      expect(getRoundDisplayName('petite_finale')).toBe('Petite finale')
    })

    it('devrait retourner le round tel quel si inconnu', () => {
      expect(getRoundDisplayName('unknown')).toBe('unknown')
    })
  })

  describe('getMatchStatusColor', () => {

    it('devrait retourner gris pour a_jouer', () => {
      expect(getMatchStatusColor('a_jouer')).toContain('gray')
    })

    it('devrait retourner jaune pour en_cours', () => {
      expect(getMatchStatusColor('en_cours')).toContain('yellow')
    })

    it('devrait retourner vert pour termine', () => {
      expect(getMatchStatusColor('termine')).toContain('green')
    })
  })

  describe('getMatchStatusText', () => {

    it('devrait retourner textes français', () => {
      expect(getMatchStatusText('a_jouer')).toBe('À jouer')
      expect(getMatchStatusText('en_cours')).toBe('En cours')
      expect(getMatchStatusText('termine')).toBe('Terminé')
    })
  })

  describe('getMatchWinner', () => {

    it('devrait retourner teamA pour BYE', () => {
      const match: BracketMatch = {
        id: '1',
        teamA: { id: 't1', name: 'Team A' },
        teamB: null,
        scoreA: 13,
        scoreB: 0,
        status: 'termine',
        round: 'demi',
        isBye: true
      }

      expect(getMatchWinner(match)?.name).toBe('Team A')
    })

    it('devrait retourner teamA si scoreA > scoreB', () => {
      const match: BracketMatch = {
        id: '1',
        teamA: { id: 't1', name: 'Team A' },
        teamB: { id: 't2', name: 'Team B' },
        scoreA: 13,
        scoreB: 8,
        status: 'termine',
        round: 'finale',
        isBye: false
      }

      expect(getMatchWinner(match)?.name).toBe('Team A')
    })

    it('devrait retourner teamB si scoreB > scoreA', () => {
      const match: BracketMatch = {
        id: '1',
        teamA: { id: 't1', name: 'Team A' },
        teamB: { id: 't2', name: 'Team B' },
        scoreA: 10,
        scoreB: 13,
        status: 'termine',
        round: 'finale',
        isBye: false
      }

      expect(getMatchWinner(match)?.name).toBe('Team B')
    })

    it('devrait retourner null pour match non terminé', () => {
      const match: BracketMatch = {
        id: '1',
        teamA: { id: 't1', name: 'Team A' },
        teamB: { id: 't2', name: 'Team B' },
        scoreA: null,
        scoreB: null,
        status: 'a_jouer',
        round: 'finale',
        isBye: false
      }

      expect(getMatchWinner(match)).toBeNull()
    })

    it('devrait retourner null pour égalité', () => {
      const match: BracketMatch = {
        id: '1',
        teamA: { id: 't1', name: 'Team A' },
        teamB: { id: 't2', name: 'Team B' },
        scoreA: 10,
        scoreB: 10,
        status: 'termine',
        round: 'finale',
        isBye: false
      }

      expect(getMatchWinner(match)).toBeNull()
    })
  })

  describe('formatScore', () => {

    it('devrait formater scores valides', () => {
      expect(formatScore(13, 8)).toBe('13 : 8')
      expect(formatScore(0, 0)).toBe('0 : 0')
    })

    it('devrait retourner - : - pour scores null', () => {
      expect(formatScore(null, null)).toBe('- : -')
      expect(formatScore(13, null)).toBe('- : -')
      expect(formatScore(null, 8)).toBe('- : -')
    })
  })

  describe('getTeamResultClass', () => {

    it('devrait retourner bold green pour gagnant', () => {
      const cls = getTeamResultClass(true)
      expect(cls).toContain('bold')
      expect(cls).toContain('green')
    })

    it('devrait retourner gray pour perdant', () => {
      expect(getTeamResultClass(false)).toContain('gray')
    })

    it('devrait retourner vide pour null', () => {
      expect(getTeamResultClass(null)).toBe('')
    })
  })

  describe('calculateByeCount', () => {

    it('devrait retourner 0 pour 2 équipes', () => {
      expect(calculateByeCount(2)).toBe(0)
    })

    it('devrait retourner 1 pour 3 équipes', () => {
      expect(calculateByeCount(3)).toBe(1)
    })

    it('devrait retourner 0 pour 4 équipes', () => {
      expect(calculateByeCount(4)).toBe(0)
    })

    it('devrait retourner 3 pour 5 équipes', () => {
      expect(calculateByeCount(5)).toBe(3)
    })

    it('devrait retourner 0 pour 8 équipes', () => {
      expect(calculateByeCount(8)).toBe(0)
    })

    it('devrait retourner 7 pour 9 équipes', () => {
      expect(calculateByeCount(9)).toBe(7)
    })

    it('devrait retourner 0 pour 16 équipes', () => {
      expect(calculateByeCount(16)).toBe(0)
    })
  })
})

describe('Composants Mode Choisi - TournamentProgress', () => {

  describe('getTournamentProgressText', () => {

    it('devrait afficher progression poules', () => {
      const text = getTournamentProgressText(12, 6, false)

      expect(text).toContain('6/12')
      expect(text).toContain('50%')
    })

    it('devrait afficher 100% si tous terminés', () => {
      const text = getTournamentProgressText(12, 12, false)

      expect(text).toContain('12/12')
      expect(text).toContain('100%')
    })

    it('devrait gérer 0 matchs', () => {
      const text = getTournamentProgressText(0, 0, false)

      expect(text).toContain('0%')
    })

    it('devrait afficher phase éliminatoire', () => {
      const text = getTournamentProgressText(12, 12, true)

      expect(text).toContain('éliminatoire')
    })
  })

  describe('canGenerateBracket', () => {

    it('devrait permettre si poules terminées sans égalités', () => {
      const result = canGenerateBracket(true, false, false)

      expect(result.canGenerate).toBe(true)
    })

    it('devrait refuser si déjà généré', () => {
      const result = canGenerateBracket(true, false, true)

      expect(result.canGenerate).toBe(false)
      expect(result.reason).toContain('déjà été généré')
    })

    it('devrait refuser si poules non terminées', () => {
      const result = canGenerateBracket(false, false, false)

      expect(result.canGenerate).toBe(false)
      expect(result.reason).toContain('terminés')
    })

    it('devrait refuser si égalités détectées', () => {
      const result = canGenerateBracket(true, true, false)

      expect(result.canGenerate).toBe(false)
      expect(result.reason).toContain('égalités')
    })
  })
})

describe('Composants Mode Choisi - Edge Cases', () => {

  it('devrait gérer équipe avec 0 matchs', () => {
    const team: TeamRanking = {
      id: '1',
      name: 'Nouvelle',
      poule: 'A',
      played: 0,
      victories: 0,
      defeats: 0,
      draws: 0,
      pointsFor: 0,
      pointsAgainst: 0,
      difference: 0,
      points: 0
    }

    expect(calculateFIPJPPoints(team.victories, team.draws)).toBe(0)
    expect(isQualified(0, 2)).toBe(true) // Même avec 0 matchs
  })

  it('devrait gérer nom très long', () => {
    const longName = 'Les Super Champions Internationaux de Pétanque 2024'
    const truncated = longName.length > 30 ? longName.substring(0, 30) + '...' : longName

    expect(truncated.length).toBeLessThanOrEqual(33)
  })

  it('devrait gérer score très élevé', () => {
    const formatted = formatScore(99, 99)
    expect(formatted).toBe('99 : 99')
  })

  it('devrait gérer bracket vide', () => {
    const byeCount = calculateByeCount(0)
    expect(byeCount).toBe(0)
  })

  it('devrait départager 4 équipes avec même points', () => {
    const teams: TeamRanking[] = [
      { id: '1', name: 'A', poule: 'A', played: 3, victories: 1, defeats: 1, draws: 1, pointsFor: 30, pointsAgainst: 30, difference: 0, points: 4 },
      { id: '2', name: 'B', poule: 'A', played: 3, victories: 1, defeats: 1, draws: 1, pointsFor: 35, pointsAgainst: 35, difference: 0, points: 4 },
      { id: '3', name: 'C', poule: 'A', played: 3, victories: 1, defeats: 1, draws: 1, pointsFor: 25, pointsAgainst: 25, difference: 0, points: 4 },
      { id: '4', name: 'D', poule: 'A', played: 3, victories: 1, defeats: 1, draws: 1, pointsFor: 40, pointsAgainst: 40, difference: 0, points: 4 }
    ]

    const sorted = sortTeamsByFIPJP(teams)

    // Triés par pointsFor décroissant
    expect(sorted[0].name).toBe('D') // 40
    expect(sorted[1].name).toBe('B') // 35
    expect(sorted[2].name).toBe('A') // 30
    expect(sorted[3].name).toBe('C') // 25
  })
})
