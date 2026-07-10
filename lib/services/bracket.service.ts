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

  if (nbTeams <= 16) {
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

  // Au-delà de 16, le bracket (limité aux huitièmes) exclurait silencieusement
  // les équipes 17+. On lève une erreur explicite plutôt que de perdre des équipes.
  throw new Error(
    `Trop d'équipes qualifiées (${nbTeams}) pour une élimination directe (max 16). ` +
    `Réduisez le nombre de qualifiés par poule ou utilisez des poules plus grandes.`
  )
}

/**
 * Génère les positions de seeding standard pour un bracket.
 *
 * Pour un bracket de taille 8 :
 *   [1, 8, 4, 5, 2, 7, 3, 6]
 * → Match 1: Seed 1 vs Seed 8
 * → Match 2: Seed 4 vs Seed 5
 * → Match 3: Seed 2 vs Seed 7
 * → Match 4: Seed 3 vs Seed 6
 *
 * Garantit que si les mieux classés gagnent, Seed 1 rencontre
 * Seed 2 en finale (bracket équilibré).
 */
export function generateBracketSeeding(bracketSize: number): number[] {
  if (bracketSize === 1) return [1]

  const half = generateBracketSeeding(bracketSize / 2)
  const result: number[] = []

  for (const pos of half) {
    result.push(pos)
    result.push(bracketSize + 1 - pos)
  }

  return result
}

/**
 * Génère les paires de matchs pour le premier tour d'élimination.
 *
 * Place les BYE aux bonnes positions : les têtes de série (mieux classées)
 * sont exemptées au 1er tour et passent directement au tour suivant.
 *
 * Exemple avec 6 équipes (bracket de 8, 2 BYE) :
 *   Seeding: [1,8,4,5,2,7,3,6]
 *   Seed 7 et 8 n'existent pas → BYE
 *   Match 1: Seed 1 vs BYE    → Seed 1 passe directement
 *   Match 2: Seed 4 vs Seed 5 → match normal
 *   Match 3: Seed 2 vs BYE    → Seed 2 passe directement
 *   Match 4: Seed 3 vs Seed 6 → match normal
 */
export function generateFirstRoundPairs(
  teams: Array<{ id: string; name: string }>
): BracketMatch[] {
  const { nbMatches, round } = calculateBracketMatches(teams.length)
  const bracketSize = nbMatches * 2 // Puissance de 2
  const matches: BracketMatch[] = []

  // Positions de seeding standard (ex: [1,8,4,5,2,7,3,6] pour 8)
  const seeding = generateBracketSeeding(bracketSize)

  for (let i = 0; i < nbMatches; i++) {
    const seedA = seeding[i * 2]     // Position seed du côté A
    const seedB = seeding[i * 2 + 1] // Position seed du côté B

    // Si le seed dépasse le nombre d'équipes → BYE
    const teamA = seedA <= teams.length ? teams[seedA - 1] : null
    const teamB = seedB <= teams.length ? teams[seedB - 1] : null

    const isBye = (teamA !== null && teamB === null) ||
                  (teamA === null && teamB !== null)

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

/**
 * Calcule les appariements du tour d'élimination suivant à partir de l'état courant des matchs.
 *
 * Corrige le bug des byes (9–15 qualifiés) :
 *  - les byes (tour 1) ne sont consommés QU'UNE FOIS, à la transition du premier tour généré ;
 *  - les vainqueurs sont pris DANS L'ORDRE DES MATCHS (= ordre de seeding posé par
 *    generateFirstRoundPairs) et appariés consécutivement, sans alternance bye/réel.
 *
 * `kind: 'finale'` est un SIGNAL : le hook délègue à generateFinales() (finale + petite
 * finale + garde anti-égalité). Le hook ne contient plus aucune logique de bracket.
 */
type MatchLike = {
  type: string
  status: string
  equipe_a_id: string | null
  equipe_b_id: string | null
  score_a: number | null
  score_b: number | null
  equipe_a?: { id: string; name: string }
  equipe_b?: { id: string; name: string }
}

export function nextRoundMatchups(matches: MatchLike[]):
  | { kind: 'pairs'; round: 'quart' | 'demi'; current: string; pairs: Array<{ a: { id: string; name: string }; b: { id: string; name: string } }> }
  | { kind: 'finale'; current: string }
  | { kind: 'error'; code: 'no_current_round' | 'round_unfinished' | 'no_next_round' | 'next_already_exists' | 'not_enough_winners'; current?: string }
{
  const order: Array<'huitieme' | 'quart' | 'demi'> = ['huitieme', 'quart', 'demi']
  let cur: 'huitieme' | 'quart' | 'demi' | null = null
  for (const rt of order) if (matches.some(m => m.type === rt)) cur = rt
  if (!cur) return { kind: 'error', code: 'no_current_round' }

  // byes consommés UNE SEULE FOIS : seulement à la transition du PREMIER tour généré
  const firstRound = order.find(rt => matches.some(m => m.type === rt))
  const isFirstTransition = cur === firstRound
  const crm = matches.filter(m => m.type === cur || (isFirstTransition && m.type === 'bye'))
  if (!crm.every(m => m.status === 'termine')) return { kind: 'error', code: 'round_unfinished', current: cur }

  const next = getNextRound(cur)
  if (!next) return { kind: 'error', code: 'no_next_round', current: cur }
  if (matches.some(m => m.type === next)) return { kind: 'error', code: 'next_already_exists', current: cur }

  if (next === 'finale') return { kind: 'finale', current: cur }

  // vainqueurs dans l'ordre des matchs, appariés consécutivement (pas d'alternance)
  const winners = getMatchWinners(
    crm.map(m => ({
      equipe_a_id: m.equipe_a_id,
      equipe_b_id: m.equipe_b_id,
      score_a: m.score_a ?? 0,
      score_b: m.score_b ?? 0,
      type: m.type,
      equipe_a: m.equipe_a,
      equipe_b: m.equipe_b
    }))
  ).filter((x): x is { id: string; name: string } => x !== null)

  if (winners.length < 2) return { kind: 'error', code: 'not_enough_winners', current: cur }

  const pairs: Array<{ a: { id: string; name: string }; b: { id: string; name: string } }> = []
  for (let i = 0; i + 1 < winners.length; i += 2) pairs.push({ a: winners[i], b: winners[i + 1] })
  return { kind: 'pairs', round: next, current: cur, pairs }
}