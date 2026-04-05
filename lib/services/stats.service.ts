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
export function calculateTeamStats(
  teamId: string,
  teamName: string,
  matches: Match[]
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

  teamMatches.forEach(m => {
    if (m.score_a === null || m.score_b === null) return

    if (m.equipe_a?.id === teamId) {
      pointsFor += m.score_a
      pointsAgainst += m.score_b
    } else if (m.equipe_b?.id === teamId) {
      pointsFor += m.score_b
      pointsAgainst += m.score_a
    }
  })

  // Différence de points (moyenne générale FIPJP)
  const difference = pointsFor - pointsAgainst

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
  teams: Array<{ id: string; joueur_ids?: string[] }>
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
      } else {
        pointsFor += match.score_b
        pointsAgainst += match.score_a
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
      difference: pointsFor - pointsAgainst,
      points: victories * 3 + draws
    }
  })
}

/**
 * Résout une égalité entre 3+ équipes par confrontation directe
 * Filtre les matchs entre les équipes à égalité uniquement,
 * recalcule un mini-classement (points FIPJP + différence) sur ces matchs-là
 */
export function resolveMultiWayTie(
  tiedTeams: TeamStats[],
  matches: Match[],
  poule: string
): TeamStats[] {
  const tiedIds = new Set(tiedTeams.map(t => t.id))

  // Filtrer les matchs entre les équipes à égalité uniquement
  const directMatches = matches.filter(m =>
    m.status === 'termine' &&
    m.poule === poule &&
    m.equipe_a_id && m.equipe_b_id &&
    tiedIds.has(m.equipe_a_id) &&
    tiedIds.has(m.equipe_b_id)
  )

  // Si pas de confrontations directes, ne pas départager
  if (directMatches.length === 0) return tiedTeams

  // Recalculer un mini-classement sur ces matchs
  const miniStats = new Map<string, { points: number; diff: number; pointsFor: number }>()
  for (const t of tiedTeams) {
    miniStats.set(t.id, { points: 0, diff: 0, pointsFor: 0 })
  }

  for (const m of directMatches) {
    const sa = m.score_a ?? 0
    const sb = m.score_b ?? 0
    const statsA = miniStats.get(m.equipe_a_id!)!
    const statsB = miniStats.get(m.equipe_b_id!)!

    statsA.pointsFor += sa
    statsA.diff += sa - sb
    statsB.pointsFor += sb
    statsB.diff += sb - sa

    if (sa > sb) {
      statsA.points += 3
    } else if (sb > sa) {
      statsB.points += 3
    } else {
      statsA.points += 1
      statsB.points += 1
    }
  }

  return [...tiedTeams].sort((a, b) => {
    const sa = miniStats.get(a.id)!
    const sb = miniStats.get(b.id)!
    if (sb.points !== sa.points) return sb.points - sa.points
    if (sb.diff !== sa.diff) return sb.diff - sa.diff
    if (sb.pointsFor !== sa.pointsFor) return sb.pointsFor - sa.pointsFor
    return a.name.localeCompare(b.name)
  })
}

/**
 * Trie les équipes selon les règles FIPJP officielles
 * 1. Nombre de points (victoires × 3 + nuls × 1)
 * 2. Différence de points (moyenne générale)
 * 3. Confrontation directe (si matchs et poule fournis)
 *    - 2 équipes : résultat direct
 *    - 3+ équipes : mini-classement sur les matchs entre elles
 * 4. Points marqués
 * 5. Ordre alphabétique (en cas d'égalité parfaite)
 *
 * @param teams - Les équipes à trier
 * @param matches - Optionnel : les matchs pour gérer la confrontation directe
 * @param poule - Optionnel : le nom de la poule pour filtrer les confrontations directes
 */
export function sortTeamsByFIPJPRules(
  teams: TeamStats[],
  matches?: Match[],
  poule?: string
): TeamStats[] {
  // Première passe : tri par points, différence, points marqués, alphabétique
  const sorted = [...teams].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.difference !== a.difference) return b.difference - a.difference
    if (b.pointsFor !== a.pointsFor) return b.pointsFor - a.pointsFor
    return a.name.localeCompare(b.name)
  })

  // Si pas de matchs ou poule, pas de confrontation directe
  if (!matches || !poule) return sorted

  // Deuxième passe : résoudre les égalités par confrontation directe
  const result: TeamStats[] = []
  let i = 0

  while (i < sorted.length) {
    // Trouver le groupe d'équipes à égalité (mêmes points + même différence)
    let j = i + 1
    while (j < sorted.length && sorted[j].points === sorted[i].points && sorted[j].difference === sorted[i].difference) {
      j++
    }

    const tiedGroup = sorted.slice(i, j)

    if (tiedGroup.length === 1) {
      result.push(tiedGroup[0])
    } else if (tiedGroup.length === 2) {
      // 2 équipes : confrontation directe simple
      const directMatch = matches.find((m: Match) =>
        m.status === 'termine' && m.poule === poule &&
        ((m.equipe_a_id === tiedGroup[0].id && m.equipe_b_id === tiedGroup[1].id) ||
         (m.equipe_a_id === tiedGroup[1].id && m.equipe_b_id === tiedGroup[0].id))
      )

      if (directMatch) {
        const firstWon =
          (directMatch.equipe_a_id === tiedGroup[0].id && (directMatch.score_a ?? 0) > (directMatch.score_b ?? 0)) ||
          (directMatch.equipe_b_id === tiedGroup[0].id && (directMatch.score_b ?? 0) > (directMatch.score_a ?? 0))
        if (firstWon) {
          result.push(tiedGroup[0], tiedGroup[1])
        } else {
          result.push(tiedGroup[1], tiedGroup[0])
        }
      } else {
        result.push(...tiedGroup)
      }
    } else {
      // 3+ équipes : mini-classement par confrontation directe
      result.push(...resolveMultiWayTie(tiedGroup, matches, poule))
    }

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
