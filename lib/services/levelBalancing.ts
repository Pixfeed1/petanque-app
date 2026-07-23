/**
 * Équilibrage des tirages par NIVEAU cumulé (historique inter-concours).
 *
 * Consomme le `niveau` calculé par lib/services/playerHistory.ts pour former des
 * équipes de force homogène (un fort avec un faible) et pour ensemencer les poules
 * de façon équilibrée. Objectif : « mieux équilibrer les parties au fil du temps ».
 *
 * Module PUR (aucune dépendance DB/React) → entièrement testable. L'aléatoire ne
 * sert qu'à départager les ex æquo (mélange préalable), pas à composer les équipes.
 */

import { fisherYatesShuffle } from './tirage.service'
import { NIVEAU_BASE } from './playerHistory'

export interface RankedPlayer {
  id: string
  /** Niveau cumulé ; défaut NIVEAU_BASE (1000) pour un joueur sans historique. */
  niveau?: number
}

const lvl = (p: RankedPlayer): number => (Number.isFinite(p.niveau as number) ? (p.niveau as number) : NIVEAU_BASE)

/**
 * Forme des équipes équilibrées par distribution serpentin sur le niveau.
 *
 * On trie les joueurs par niveau décroissant (ex æquo départagés par un mélange
 * préalable), puis on les distribue en serpentin sur `nbEquipes` équipes :
 *   rang 0 → équipe 0,1,2,…      (le meilleur dans chaque équipe)
 *   rang 1 → équipe …,2,1,0      (sens inversé)
 * Chaque équipe récupère ainsi une tranche de chaque « étage » de niveau, ce qui
 * égalise les totaux d'équipe bien mieux qu'un tirage aléatoire.
 *
 * Les joueurs surnuméraires (effectif non divisible par teamSize) sont renvoyés
 * dans `unassigned` — jamais largués en silence.
 */
export function balancedTeamsByLevel(
  players: RankedPlayer[],
  teamSize: number
): { teams: { joueur_ids: string[] }[]; unassigned: string[] } {
  if (teamSize <= 0 || players.length < teamSize) {
    return { teams: [], unassigned: players.map(p => p.id) }
  }
  const nbTeams = Math.floor(players.length / teamSize)
  // Mélange d'abord (départage aléatoire des ex æquo), puis tri stable par niveau desc.
  const sorted = fisherYatesShuffle(players).sort((a, b) => lvl(b) - lvl(a))

  const teams: string[][] = Array.from({ length: nbTeams }, () => [])
  const capacity = nbTeams * teamSize

  for (let i = 0; i < capacity; i++) {
    const row = Math.floor(i / nbTeams)
    const col = i % nbTeams
    const teamIndex = row % 2 === 0 ? col : nbTeams - 1 - col
    teams[teamIndex].push(sorted[i].id)
  }

  const unassigned = sorted.slice(capacity).map(p => p.id)
  return { teams: teams.map(joueur_ids => ({ joueur_ids })), unassigned }
}

/**
 * Niveau total d'une équipe (somme des niveaux de ses joueurs), pour l'ensemencement.
 */
export function teamLevel(joueurIds: string[], niveauById: Map<string, number>): number {
  let total = 0
  for (const id of joueurIds) total += niveauById.get(id) ?? NIVEAU_BASE
  return total
}

/**
 * Ordonne des équipes par niveau total DÉCROISSANT (têtes de série d'abord).
 * Utilisé pour ensemencer la distribution serpentin des poules : appliqué avant
 * `snakeDraftDistribution`, il remplace le mélange aléatoire par un vrai classement
 * de force, d'où des poules équilibrées. Ex æquo départagés par mélange préalable.
 */
export function seedTeamsByLevel<T extends { joueur_ids?: string[] }>(
  teams: T[],
  niveauById: Map<string, number>
): T[] {
  return fisherYatesShuffle(teams).sort(
    (a, b) => teamLevel(b.joueur_ids ?? [], niveauById) - teamLevel(a.joueur_ids ?? [], niveauById)
  )
}
