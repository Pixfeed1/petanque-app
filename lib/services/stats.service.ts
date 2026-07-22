/**
 * Service de calcul des statistiques pour tournois de pétanque
 * Centralise toute la logique de calcul de stats (équipes et joueurs)
 * Suit les règles FIPJP officielles
 */

import type { Match, Joueur } from '@/lib/types'

// Types pour les stats calculées
export interface TeamStats {
  id: string
  name: string
  played: number
  victories: number
  defeats: number
  draws: number
  pointsFor: number
  pointsAgainst: number
  difference: number
  points: number // Points FIPJP (victoires × 3)
}

export interface PlayerStats {
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
  points: number // Points FIPJP (victoires × 3)
}

/**
 * Calcule les statistiques d'une équipe à partir de ses matchs
 * Règles FIPJP : victoire = 3 points, nul = 1 point, défaite = 0 point
 */
// Mode fair-play (« esprit club ») : au classement, l'écart de points pris en
// compte par match est plafonné. Gagner 13-0 ne rapporte pas plus que 13-5 →
// aucun intérêt à écraser une équipe faible. Les points marqués/encaissés
// affichés restent, eux, les vrais scores.
export const FAIR_PLAY_MAX_DIFF = 5
const clampDiff = (d: number, fairPlay: boolean) =>
  fairPlay ? Math.max(-FAIR_PLAY_MAX_DIFF, Math.min(FAIR_PLAY_MAX_DIFF, d)) : d

export function calculateTeamStats(
  teamId: string,
  teamName: string,
  matches: Match[],
  fairPlay: boolean = false
): TeamStats {
  // Filtrer les matchs de cette équipe (uniquement terminés, pas les BYE)
  const teamMatches = matches.filter(m =>
    m.status === 'termine' &&
    m.type !== 'bye' &&
    (m.equipe_a?.id === teamId || m.equipe_b?.id === teamId)
  )

  // Calcul des victoires
  const victories = teamMatches.filter(m => {
    if (m.score_a === null || m.score_b === null) return false
    return (
      (m.equipe_a?.id === teamId && m.score_a > m.score_b) ||
      (m.equipe_b?.id === teamId && m.score_b > m.score_a)
    )
  }).length

  // Calcul des défaites
  const defeats = teamMatches.filter(m => {
    if (m.score_a === null || m.score_b === null) return false
    return (
      (m.equipe_a?.id === teamId && m.score_a < m.score_b) ||
      (m.equipe_b?.id === teamId && m.score_b < m.score_a)
    )
  }).length

  // Calcul des nuls
  const draws = teamMatches.filter(m => {
    if (m.score_a === null || m.score_b === null) return false
    return m.score_a === m.score_b
  }).length

  // Calcul points marqués et encaissés
  let pointsFor = 0
  let pointsAgainst = 0
  let cappedDiff = 0

  teamMatches.forEach(m => {
    if (m.score_a === null || m.score_b === null) return

    if (m.equipe_a?.id === teamId) {
      pointsFor += m.score_a
      pointsAgainst += m.score_b
      cappedDiff += clampDiff(m.score_a - m.score_b, fairPlay)
    } else if (m.equipe_b?.id === teamId) {
      pointsFor += m.score_b
      pointsAgainst += m.score_a
      cappedDiff += clampDiff(m.score_b - m.score_a, fairPlay)
    }
  })

  // Différence de points (moyenne générale FIPJP). En fair-play, elle est la
  // somme des écarts plafonnés par match ; sinon, pointsFor - pointsAgainst.
  const difference = cappedDiff

  // Points FIPJP : victoire = 3 pts, nul = 1 pt, défaite = 0 pt
  const points = victories * 3 + draws * 1

  return {
    id: teamId,
    name: teamName,
    played: teamMatches.length,
    victories,
    defeats,
    draws,
    pointsFor,
    pointsAgainst,
    difference,
    points
  }
}

/**
 * Calcule les statistiques d'un joueur à partir de tous les matchs où il a joué
 * Utilisé pour les tournois en mêlée tournante (classement individuel)
 */
export function calculatePlayerStats(
  player: Joueur,
  matches: Match[],
  teams: Array<{ id: string; joueur_ids?: string[] }>
): PlayerStats {
  // Trouver toutes les équipes où ce joueur a joué
  const playerTeamIds = teams
    .filter(t => t.joueur_ids?.includes(player.id))
    .map(t => t.id)

  // Filtrer les matchs où le joueur a participé
  const playerMatches = matches.filter(m =>
    m.status === 'termine' &&
    m.type !== 'bye' &&
    (playerTeamIds.includes(m.equipe_a?.id || '') ||
     playerTeamIds.includes(m.equipe_b?.id || ''))
  )

  let victories = 0
  let defeats = 0
  let draws = 0
  let pointsFor = 0
  let pointsAgainst = 0

  playerMatches.forEach(match => {
    if (match.score_a === null || match.score_b === null) return

    const isTeamA = playerTeamIds.includes(match.equipe_a?.id || '')

    // Comptabiliser résultat
    if (match.score_a > match.score_b) {
      if (isTeamA) victories++
      else defeats++
    } else if (match.score_a < match.score_b) {
      if (isTeamA) defeats++
      else victories++
    } else {
      draws++ // Égalité
    }

    // Comptabiliser points
    if (isTeamA) {
      pointsFor += match.score_a
      pointsAgainst += match.score_b
    } else {
      pointsFor += match.score_b
      pointsAgainst += match.score_a
    }
  })

  const difference = pointsFor - pointsAgainst
  const points = victories * 3 + draws * 1

  return {
    id: player.id,
    name: player.name,
    email: player.email,
    played: playerMatches.length,
    victories,
    defeats,
    draws,
    pointsFor,
    pointsAgainst,
    difference,
    points
  }
}

/**
 * Version batch optimisée pour calculer les stats de plusieurs joueurs
 * Évite le N+1 en construisant un index Map une seule fois
 */
export function calculateAllPlayersStats(
  players: Joueur[],
  matches: Match[],
  teams: Array<{ id: string; joueur_ids?: string[] }>,
  fairPlay: boolean = false
): PlayerStats[] {
  // Construire index joueur -> équipes une seule fois (O(n) au lieu de O(n*m))
  const playerToTeams = new Map<string, string[]>()
  teams.forEach(team => {
    team.joueur_ids?.forEach(playerId => {
      if (!playerToTeams.has(playerId)) {
        playerToTeams.set(playerId, [])
      }
      playerToTeams.get(playerId)!.push(team.id)
    })
  })

  // Filtrer les matchs terminés une seule fois
  const completedMatches = matches.filter(m =>
    m.status === 'termine' && m.type !== 'bye'
  )

  // Calculer stats pour chaque joueur avec lookup O(1)
  return players.map(player => {
    const playerTeamIds = playerToTeams.get(player.id) || []

    const playerMatches = completedMatches.filter(m =>
      playerTeamIds.includes(m.equipe_a?.id || '') ||
      playerTeamIds.includes(m.equipe_b?.id || '')
    )

    let victories = 0
    let defeats = 0
    let draws = 0
    let pointsFor = 0
    let pointsAgainst = 0
    let cappedDiff = 0

    playerMatches.forEach(match => {
      if (match.score_a === null || match.score_b === null) return

      const isTeamA = playerTeamIds.includes(match.equipe_a?.id || '')

      if (match.score_a > match.score_b) {
        if (isTeamA) victories++
        else defeats++
      } else if (match.score_a < match.score_b) {
        if (isTeamA) defeats++
        else victories++
      } else {
        draws++
      }

      if (isTeamA) {
        pointsFor += match.score_a
        pointsAgainst += match.score_b
        cappedDiff += clampDiff(match.score_a - match.score_b, fairPlay)
      } else {
        pointsFor += match.score_b
        pointsAgainst += match.score_a
        cappedDiff += clampDiff(match.score_b - match.score_a, fairPlay)
      }
    })

    return {
      id: player.id,
      name: player.name,
      email: player.email,
      played: playerMatches.length,
      victories,
      defeats,
      draws,
      pointsFor,
      pointsAgainst,
      difference: cappedDiff,
      points: victories * 3 + draws
    }
  })
}

/**
 * Départage un groupe d'équipes à ÉGALITÉ DE POINTS par confrontation directe.
 *
 * Ordre appliqué (règlement « confrontation directe d'abord ») :
 *   1. (en amont) victoires/points — identiques dans le groupe
 *   2. confrontation directe : mini-classement sur les SEULS matchs entre ces équipes
 *      (victoire = 3, nul = 1) ; pour 2 équipes = simplement le vainqueur du match direct
 *   3. goal-average particulier : différence dans ces mêmes matchs
 *   4. goal-average général : différence sur l'ensemble de la poule
 *   5. points marqués (général)
 *   6. ordre alphabétique (ultime recours)
 *
 * En cas de nul au match direct, la confrontation directe ne tranche pas : on passe
 * au critère suivant (pas d'inversion arbitraire de la paire).
 */
export function resolveMultiWayTie(
  tiedTeams: TeamStats[],
  matches: Match[],
  poule: string
): TeamStats[] {
  const tiedIds = new Set(tiedTeams.map(t => t.id))

  // Matchs entre les équipes à égalité uniquement
  const directMatches = matches.filter(m =>
    m.status === 'termine' &&
    m.poule === poule &&
    m.equipe_a_id && m.equipe_b_id &&
    tiedIds.has(m.equipe_a_id) &&
    tiedIds.has(m.equipe_b_id)
  )

  // Mini-classement : points de confrontation directe + goal-average particulier
  const mini = new Map<string, { points: number; diff: number }>()
  for (const t of tiedTeams) mini.set(t.id, { points: 0, diff: 0 })

  for (const m of directMatches) {
    const sa = m.score_a ?? 0
    const sb = m.score_b ?? 0
    const statsA = mini.get(m.equipe_a_id!)!
    const statsB = mini.get(m.equipe_b_id!)!
    statsA.diff += sa - sb
    statsB.diff += sb - sa
    if (sa > sb) statsA.points += 3
    else if (sb > sa) statsB.points += 3
    else { statsA.points += 1; statsB.points += 1 }
  }

  return [...tiedTeams].sort((a, b) => {
    const ma = mini.get(a.id)!
    const mb = mini.get(b.id)!
    if (mb.points !== ma.points) return mb.points - ma.points            // 2. confrontation directe
    if (mb.diff !== ma.diff) return mb.diff - ma.diff                    // 3. goal-average particulier
    if (b.difference !== a.difference) return b.difference - a.difference // 4. goal-average général
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor     // 5. points marqués
    return a.name.localeCompare(b.name)                                  // 6. alphabétique
  })
}

/**
 * Trie les équipes d'une poule selon les règles de départage retenues.
 *
 * Critère principal : nombre de points (victoires × 3 + nuls). À ÉGALITÉ DE POINTS,
 * la CONFRONTATION DIRECTE prime sur la différence générale (cf. resolveMultiWayTie).
 *
 * Sans `matches`/`poule` (contexte hors poule), la confrontation directe est impossible :
 * on retombe sur points -> différence générale -> points marqués -> alphabétique.
 *
 * @param teams   Les équipes à trier (stats déjà calculées)
 * @param matches Optionnel : les matchs, pour la confrontation directe
 * @param poule   Optionnel : le nom de la poule, pour filtrer les matchs directs
 */
export function sortTeamsByFIPJPRules(
  teams: TeamStats[],
  matches?: Match[],
  poule?: string
): TeamStats[] {
  // Hors contexte de poule : pas de confrontation directe possible
  if (!matches || !poule) {
    return [...teams].sort((a, b) =>
      (b.points - a.points) ||
      (b.difference - a.difference) ||
      (b.pointsFor - a.pointsFor) ||
      a.name.localeCompare(b.name)
    )
  }

  // 1. Regrouper par points égaux, puis départager chaque groupe par confrontation directe
  const byPoints = [...teams].sort((a, b) => b.points - a.points)
  const result: TeamStats[] = []
  let i = 0
  while (i < byPoints.length) {
    let j = i + 1
    while (j < byPoints.length && byPoints[j].points === byPoints[i].points) j++
    const group = byPoints.slice(i, j)
    if (group.length === 1) result.push(group[0])
    else result.push(...resolveMultiWayTie(group, matches, poule))
    i = j
  }

  return result
}

/**
 * Trie les joueurs selon les règles FIPJP
 * Mêmes règles que pour les équipes
 */
export function sortPlayersByFIPJPRules(players: PlayerStats[]): PlayerStats[] {
  return [...players].sort((a, b) => {
    // 1. Nombre de points
    if (b.points !== a.points) return b.points - a.points

    // 2. Différence de points
    if (b.difference !== a.difference) return b.difference - a.difference

    // 3. Points marqués
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor

    // 4. Ordre alphabétique
    return a.name.localeCompare(b.name)
  })
}

/**
 * Groupe les équipes par poule avec leurs stats calculées
 */
export function groupTeamsByPoule(
  teams: Array<{ id: string; name: string; poule?: string; joueur_ids?: string[] }>,
  matches: Match[]
): Record<string, TeamStats[]> {
  const poules: Record<string, TeamStats[]> = {}

  teams.forEach(team => {
    const poule = team.poule || 'Sans poule'
    const stats = calculateTeamStats(team.id, team.name, matches)

    if (!poules[poule]) {
      poules[poule] = []
    }

    poules[poule].push(stats)
  })

  // Trier chaque poule selon règles FIPJP (avec confrontation directe)
  Object.keys(poules).forEach(poule => {
    poules[poule] = sortTeamsByFIPJPRules(poules[poule], matches, poule)
  })

  return poules
}
