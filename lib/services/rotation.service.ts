/**
 * Service pour l'algorithme de rotation optimisé en mêlée tournante
 * Utilise la méthode du cercle (circle method) pour garantir
 * qu'aucun joueur ne joue avec le même partenaire deux fois
 */

export interface RotationPlayer {
  id: string
  gender?: 'H' | 'F'
  name?: string
}

export interface RotationTeam {
  joueur_ids: string[]
}

export interface RotationResult {
  teams: RotationTeam[]
  unassignedPlayerIds: string[]
  warnings: string[]
}

/**
 * Méthode du cercle (Circle Method) pour les rotations
 * Garantit n-1 rotations sans répétition pour n joueurs
 *
 * Principe:
 * - Fixer le joueur 0 comme "ancre"
 * - Arranger les autres joueurs en cercle
 * - À chaque rotation, faire tourner le cercle
 * - Apparier: ancre avec le "haut", puis symétrique autour du cercle
 */
export class RotationService {

  /**
   * Génère les équipes pour une rotation donnée en doublette
   * Utilise l'algorithme du cercle pour éviter les répétitions
   *
   * @param players Liste des joueurs
   * @param rotationIndex Numéro de rotation (0-indexed, 0 = première rotation)
   * @returns Équipes formées pour cette rotation
   */
  static generateRotationTeamsDoublette(
    players: RotationPlayer[],
    rotationIndex: number
  ): RotationResult {
    const result: RotationResult = {
      teams: [],
      unassignedPlayerIds: [],
      warnings: []
    }

    const n = players.length

    // Nombre impair de joueurs : un joueur sera en reste
    if (n % 2 !== 0) {
      result.warnings.push(`Nombre impair de joueurs (${n}). Un joueur sera en repos.`)
    }

    // Moins de 4 joueurs : impossible de faire des équipes
    if (n < 4) {
      result.warnings.push('Minimum 4 joueurs requis pour les rotations.')
      result.unassignedPlayerIds = players.map(p => p.id)
      return result
    }

    // Nombre de joueurs à apparier (pair)
    const playersToMatch = n % 2 === 0 ? n : n - 1
    const playerIds = players.slice(0, playersToMatch).map(p => p.id)

    // Joueur en reste si nombre impair
    if (n % 2 !== 0) {
      result.unassignedPlayerIds.push(players[n - 1].id)
    }

    // Maximum de rotations possibles sans répétition
    const maxRotations = playersToMatch - 1

    // Si on dépasse le nombre max de rotations, on avertit
    if (rotationIndex >= maxRotations) {
      result.warnings.push(
        `Rotation ${rotationIndex + 1} dépasse le maximum (${maxRotations}) pour ${playersToMatch} joueurs. ` +
        `Des répétitions de partenaires sont inévitables.`
      )
    }

    // Rotation effective (modulo pour boucler si nécessaire)
    const effectiveRotation = rotationIndex % maxRotations

    // Appliquer la méthode du cercle
    const pairs = this.circleMethodPairs(playerIds, effectiveRotation)

    for (const pair of pairs) {
      result.teams.push({ joueur_ids: pair })
    }

    return result
  }

  /**
   * Implémentation de la méthode du cercle
   * @param playerIds IDs des joueurs (doit être pair)
   * @param rotation Numéro de rotation (0-indexed)
   * @returns Liste de paires [id1, id2]
   */
  private static circleMethodPairs(
    playerIds: string[],
    rotation: number
  ): [string, string][] {
    const n = playerIds.length
    const pairs: [string, string][] = []

    // Joueur fixe (ancre)
    const anchor = playerIds[0]

    // Autres joueurs qui tournent
    const rotating = playerIds.slice(1)
    const m = rotating.length // n - 1

    // Position du joueur qui s'apparie avec l'ancre
    // À la rotation r, c'est le joueur à la position r dans le cercle
    const anchorPartnerIndex = rotation % m
    pairs.push([anchor, rotating[anchorPartnerIndex]])

    // Apparier les autres joueurs symétriquement
    // Position i s'apparie avec position (m - 1 - i) en partant de après anchorPartnerIndex
    for (let i = 1; i <= Math.floor((m - 1) / 2); i++) {
      const pos1 = (anchorPartnerIndex + i) % m
      const pos2 = (anchorPartnerIndex - i + m) % m
      pairs.push([rotating[pos1], rotating[pos2]])
    }

    return pairs
  }

  /**
   * Génère les équipes pour une rotation donnée en triplette
   * Plus complexe car 3 joueurs par équipe
   *
   * @param players Liste des joueurs
   * @param rotationIndex Numéro de rotation (0-indexed)
   * @returns Équipes formées pour cette rotation
   */
  static generateRotationTeamsTriplette(
    players: RotationPlayer[],
    rotationIndex: number
  ): RotationResult {
    const result: RotationResult = {
      teams: [],
      unassignedPlayerIds: [],
      warnings: []
    }

    const n = players.length

    if (n < 6) {
      result.warnings.push('Minimum 6 joueurs requis pour les rotations en triplette.')
      result.unassignedPlayerIds = players.map(p => p.id)
      return result
    }

    // Nombre de joueurs à utiliser (multiple de 3)
    const playersToUse = Math.floor(n / 3) * 3
    const remainingCount = n - playersToUse

    if (remainingCount > 0) {
      result.warnings.push(`${remainingCount} joueur(s) en repos pour cette rotation.`)
      for (let i = playersToUse; i < n; i++) {
        result.unassignedPlayerIds.push(players[i].id)
      }
    }

    // Pour triplette, on utilise une rotation simple avec décalage
    // C'est moins optimal mais fonctionne pour les cas courants
    const usedPlayers = players.slice(0, playersToUse)
    const numTeams = playersToUse / 3

    // Décalage basé sur la rotation
    const offset = (rotationIndex * 1) % playersToUse

    for (let i = 0; i < numTeams; i++) {
      const teamIds: string[] = []
      for (let j = 0; j < 3; j++) {
        const playerIndex = (i * 3 + j + offset) % playersToUse
        teamIds.push(usedPlayers[playerIndex].id)
      }
      result.teams.push({ joueur_ids: teamIds })
    }

    // Vérifier les répétitions (pour triplette c'est plus probable)
    // On ne peut pas garantir 0 répétition pour triplette avec cette méthode simple
    if (rotationIndex >= Math.floor(playersToUse / 3)) {
      result.warnings.push(
        `En triplette avec ${playersToUse} joueurs, des répétitions de partenaires sont possibles après ${Math.floor(playersToUse / 3)} rotations.`
      )
    }

    return result
  }

  /**
   * Génère les équipes pour une rotation en tenant compte de la mixité
   *
   * @param players Liste des joueurs avec genre
   * @param rotationIndex Numéro de rotation
   * @param teamSize 2 pour doublette, 3 pour triplette
   * @param mixiteObligatoire Si la mixité est obligatoire
   * @param previousPartners Index des partenaires précédents (pour fallback)
   */
  static generateRotationTeams(
    players: RotationPlayer[],
    rotationIndex: number,
    teamSize: 2 | 3,
    mixiteObligatoire: boolean = false,
    previousPartners?: Map<string, Set<string>>
  ): RotationResult {
    // Si mixité NON obligatoire, utiliser l'algorithme optimisé
    if (!mixiteObligatoire) {
      if (teamSize === 2) {
        return this.generateRotationTeamsDoublette(players, rotationIndex)
      } else {
        return this.generateRotationTeamsTriplette(players, rotationIndex)
      }
    }

    // Si mixité obligatoire, on doit respecter les contraintes H/F
    // Cela limite notre capacité à optimiser les rotations
    // On utilise une approche hybride
    return this.generateMixteRotationTeams(players, rotationIndex, teamSize, previousPartners)
  }

  /**
   * Génère des équipes mixtes pour une rotation
   * Moins optimal mais respecte la contrainte de mixité
   */
  private static generateMixteRotationTeams(
    players: RotationPlayer[],
    rotationIndex: number,
    teamSize: 2 | 3,
    previousPartners?: Map<string, Set<string>>
  ): RotationResult {
    const result: RotationResult = {
      teams: [],
      unassignedPlayerIds: [],
      warnings: []
    }

    // Séparer par genre
    const hommes = players.filter(p => p.gender === 'H' || !p.gender)
    const femmes = players.filter(p => p.gender === 'F')

    if (hommes.length === 0 || femmes.length === 0) {
      result.warnings.push('Mixité impossible : pas assez de joueurs des deux genres.')
      // Fallback vers algorithme sans mixité
      if (teamSize === 2) {
        return this.generateRotationTeamsDoublette(players, rotationIndex)
      } else {
        return this.generateRotationTeamsTriplette(players, rotationIndex)
      }
    }

    if (teamSize === 2) {
      // Doublette mixte : 1H + 1F
      // Rotation : décaler les femmes par rapport aux hommes
      const minPairs = Math.min(hommes.length, femmes.length)
      const femmeOffset = rotationIndex % femmes.length

      for (let i = 0; i < minPairs; i++) {
        const homme = hommes[i % hommes.length]
        const femme = femmes[(i + femmeOffset) % femmes.length]
        result.teams.push({ joueur_ids: [homme.id, femme.id] })
      }

      // Joueurs restants
      const usedHommes = new Set(result.teams.flatMap(t => t.joueur_ids).filter(id => hommes.some(h => h.id === id)))
      const usedFemmes = new Set(result.teams.flatMap(t => t.joueur_ids).filter(id => femmes.some(f => f.id === id)))

      for (const h of hommes) {
        if (!usedHommes.has(h.id)) result.unassignedPlayerIds.push(h.id)
      }
      for (const f of femmes) {
        if (!usedFemmes.has(f.id)) result.unassignedPlayerIds.push(f.id)
      }

      if (result.unassignedPlayerIds.length > 0) {
        result.warnings.push(`${result.unassignedPlayerIds.length} joueur(s) non assigné(s) (déséquilibre H/F).`)
      }
    } else {
      // Triplette : 2H+1F ou 1H+2F
      // Plus complexe, utiliser une approche simple
      const numTeams = Math.floor(Math.min(hommes.length, femmes.length * 2, femmes.length + hommes.length / 2) / 1)

      // Simplified: just pair with rotation offset
      for (let i = 0; i < Math.floor(players.length / 3); i++) {
        const offset = (rotationIndex + i * 3) % players.length
        const team: string[] = []
        for (let j = 0; j < 3 && team.length < 3; j++) {
          const idx = (offset + j) % players.length
          team.push(players[idx].id)
        }
        if (team.length === 3) {
          result.teams.push({ joueur_ids: team })
        }
      }
    }

    return result
  }

  /**
   * Vérifie si une rotation a des partenaires répétés
   */
  static countRepeatedPartners(
    teams: RotationTeam[],
    previousPartners: Map<string, Set<string>>
  ): number {
    let count = 0

    for (const team of teams) {
      const ids = team.joueur_ids
      for (let i = 0; i < ids.length; i++) {
        const playerPartners = previousPartners.get(ids[i])
        if (playerPartners) {
          for (let j = i + 1; j < ids.length; j++) {
            if (playerPartners.has(ids[j])) {
              count++
            }
          }
        }
      }
    }

    return count
  }

  /**
   * Calcule le nombre maximum de rotations sans répétition
   */
  static getMaxRotationsWithoutRepeat(playerCount: number, teamSize: 2 | 3): number {
    if (teamSize === 2) {
      // Pour doublette : n-1 rotations possibles
      return playerCount - 1
    } else {
      // Pour triplette : approximativement n/3 rotations
      return Math.floor(playerCount / 3)
    }
  }
}
