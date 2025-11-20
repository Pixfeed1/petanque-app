/**
 * Service de gestion des brackets d'élimination
 * Gère le seeding, la génération des matchs, et les BYE
 */

import type { TeamStats } from './stats.service'

export interface BracketMatch {
  teamA: { id: string; name: string } | null
  teamB: { id: string; name: string } | null
  isBye: boolean
  round: 'huitieme' | 'quart' | 'demi' | 'finale' | 'petite_finale'
}

/**
 * Applique le seeding correct pour éviter que deux équipes
 * de la même poule se rencontrent trop tôt
 *
 * Exemple avec 2 poules, 2 qualifiés par poule:
 * AVANT: [1er A, 2ème A, 1er B, 2ème B] → 1er A vs 2ème A (même poule ❌)
 * APRÈS: [1er A, 1er B, 2ème A, 2ème B] → 1er A vs 1er B (différent ✅)
 */
export function applySeedingByRank(
  qualifiedTeams: Array<{ id: string; name: string; poule: string }>,
  qualifiedPerPoule: number,
  nbPoules: number
): Array<{ id: string; name: string }> {
  const reordered: Array<{ id: string; name: string }> = []

  // Réorganiser par rang plutôt que par poule
  for (let rank = 0; rank < qualifiedPerPoule; rank++) {
    for (let pouleIdx = 0; pouleIdx < nbPoules; pouleIdx++) {
      const teamIdx = pouleIdx * qualifiedPerPoule + rank
      if (teamIdx < qualifiedTeams.length) {
        reordered.push(qualifiedTeams[teamIdx])
      }
    }
  }

  return reordered
}

/**
 * Calcule le nombre de matchs nécessaires pour un bracket
 * Gère les puissances de 2 et les cas avec BYE
 */
export function calculateBracketMatches(nbTeams: number): {
  nbMatches: number
  round: 'huitieme' | 'quart' | 'demi' | 'finale'
  hasByes: boolean
  nbByes: number
} {
  if (nbTeams <= 1) {
    throw new Error('Impossible de créer un bracket avec moins de 2 équipes')
  }

  if (nbTeams === 2) {
    return { nbMatches: 1, round: 'finale', hasByes: false, nbByes: 0 }
  }

  if (nbTeams === 3 || nbTeams === 4) {
    // 3 ou 4 équipes → demi-finales
    const hasByes = nbTeams === 3
    return {
      nbMatches: 2,
      round: 'demi',
      hasByes,
      nbByes: hasByes ? 1 : 0
    }
  }

  if (nbTeams <= 8) {
    // 5-8 équipes → quarts de finale
    const nextPowerOf2 = 8
    const nbByes = nextPowerOf2 - nbTeams
    return {
      nbMatches: 4,
      round: 'quart',
      hasByes: nbByes > 0,
      nbByes
    }
  }

  // 9-16 équipes → huitièmes de finale
  const nextPowerOf2 = 16
  const nbByes = nextPowerOf2 - nbTeams
  return {
    nbMatches: 8,
    round: 'huitieme',
    hasByes: nbByes > 0,
    nbByes
  }
}

/**
 * Génère les paires de matchs pour le premier tour d'élimination
 * Place intelligemment les BYE pour équilibrer le bracket
 */
export function generateFirstRoundPairs(
  teams: Array<{ id: string; name: string }>
): BracketMatch[] {
  const { nbMatches, round } = calculateBracketMatches(teams.length)
  const matches: BracketMatch[] = []

  for (let i = 0; i < nbMatches; i++) {
    const teamA = teams[i * 2] || null
    const teamB = teams[i * 2 + 1] || null
    const isBye = teamA !== null && teamB === null

    matches.push({
      teamA,
      teamB,
      isBye,
      round
    })
  }

  return matches
}

/**
 * Valide qu'un bracket peut être généré
 * Vérifie qu'il n'y a pas d'égalités dans les matchs précédents
 */
export function validateBracketGeneration(
  previousMatches: Array<{
    equipe_a?: { name: string }
    equipe_b?: { name: string }
    score_a: number
    score_b: number
    status: string
  }>
): { valid: boolean; error?: string } {
  // Vérifier que tous les matchs sont terminés
  const unfinished = previousMatches.filter(m => m.status !== 'termine')
  if (unfinished.length > 0) {
    return {
      valid: false,
      error: `${unfinished.length} match(s) non terminé(s). Terminez tous les matchs avant de générer la phase suivante.`
    }
  }

  // Vérifier qu'il n'y a pas d'égalités
  const draws = previousMatches.filter(m => m.score_a === m.score_b)
  if (draws.length > 0) {
    const drawNames = draws
      .map(m => `${m.equipe_a?.name} vs ${m.equipe_b?.name}`)
      .join(', ')
    return {
      valid: false,
      error: `⚠️ Égalité détectée dans : ${drawNames}. Les égalités ne sont pas autorisées en phase d'élimination. Rejouez le(s) match(s).`
    }
  }

  return { valid: true }
}

/**
 * Détermine les gagnants des matchs pour passer au tour suivant
 */
export function getMatchWinners(
  matches: Array<{
    equipe_a_id: string | null
    equipe_b_id: string | null
    score_a: number
    score_b: number
    type?: string
    equipe_a?: { id: string; name: string }
    equipe_b?: { id: string; name: string }
  }>
): Array<{ id: string; name: string } | null> {
  return matches.map(match => {
    // Match BYE → équipe A qualifiée automatiquement
    if (match.type === 'bye' || !match.equipe_b_id) {
      return match.equipe_a ? { id: match.equipe_a.id, name: match.equipe_a.name } : null
    }

    // Match normal → vérifier le score
    if (!match.equipe_a || !match.equipe_b) {
      return null
    }

    if (match.score_a > match.score_b) {
      return { id: match.equipe_a.id, name: match.equipe_a.name }
    } else if (match.score_b > match.score_a) {
      return { id: match.equipe_b.id, name: match.equipe_b.name }
    }

    // Égalité (ne devrait pas arriver après validation)
    return null
  })
}

/**
 * Calcule le prochain tour à partir du tour actuel
 */
export function getNextRound(
  currentRound: 'huitieme' | 'quart' | 'demi' | 'finale'
): 'quart' | 'demi' | 'finale' | null {
  const progression: Record<string, 'quart' | 'demi' | 'finale' | null> = {
    huitieme: 'quart',
    quart: 'demi',
    demi: 'finale',
    finale: null // Pas de tour suivant après la finale
  }

  return progression[currentRound]
}
