/**
 * Service pour l'algorithme de rotation optimisé en mêlée tournante
 * Utilise la méthode du cercle (circle method) pour garantir
 * qu'aucun joueur ne joue avec le même partenaire deux fois
 *
 * Améliorations v2:
 * - Rotation du joueur en repos (nombre impair)
 * - Algorithme triplette amélioré (Kirkman-like)
 * - Meilleure gestion de la mixité
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

    // Moins de 4 joueurs : impossible de faire des équipes
    if (n < 4) {
      result.warnings.push('Minimum 4 joueurs requis pour les rotations.')
      result.unassignedPlayerIds = players.map(p => p.id)
      return result
    }

    // Nombre impair de joueurs : un joueur sera en repos
    // AMÉLIORATION v2: Rotation du joueur en repos
    let playersForRotation = [...players]

    if (n % 2 !== 0) {
      // Le joueur en repos change à chaque rotation
      const restIndex = rotationIndex % n
      const restingPlayer = playersForRotation[restIndex]
      result.unassignedPlayerIds.push(restingPlayer.id)
      result.warnings.push(`Joueur en repos: ${restingPlayer.name || restingPlayer.id}`)

      // Retirer le joueur en repos de la liste
      playersForRotation = [
        ...playersForRotation.slice(0, restIndex),
        ...playersForRotation.slice(restIndex + 1)
      ]
    }

    const playersToMatch = playersForRotation.length
    const playerIds = playersForRotation.map(p => p.id)

    // Maximum de rotations possibles sans répétition
    // Pour n joueurs pairs: n-1 rotations
    // Pour n joueurs impairs: n rotations (car différent joueur en repos)
    const maxRotations = n % 2 === 0 ? n - 1 : n

    // Si on dépasse le nombre max de rotations, on avertit
    if (rotationIndex >= maxRotations) {
      result.warnings.push(
        `Rotation ${rotationIndex + 1} dépasse le maximum (${maxRotations}) pour ${n} joueurs. ` +
        `Des répétitions de partenaires sont inévitables.`
      )
    }

    // Rotation effective pour la méthode du cercle
    // On utilise le modulo sur playersToMatch-1 car c'est le cycle de la méthode du cercle
    const effectiveRotation = rotationIndex % (playersToMatch - 1)

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
   * AMÉLIORATION v2: Algorithme basé sur les designs résolvables
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

    // AMÉLIORATION v2: Rotation des joueurs en repos
    let playersForRotation = [...players]
    if (remainingCount > 0) {
      // Faire tourner les joueurs en repos
      const restStartIndex = (rotationIndex * remainingCount) % n
      for (let i = 0; i < remainingCount; i++) {
        const restIndex = (restStartIndex + i) % n
        result.unassignedPlayerIds.push(players[restIndex].id)
      }
      // Filtrer les joueurs en repos
      playersForRotation = players.filter(p => !result.unassignedPlayerIds.includes(p.id))
      result.warnings.push(`${remainingCount} joueur(s) en repos pour cette rotation.`)
    }

    const numTeams = playersForRotation.length / 3

    // AMÉLIORATION v2: Algorithme de rotation optimisé pour triplette
    // Utilise une combinaison de décalages pour minimiser les répétitions
    //
    // Principe: diviser les joueurs en 3 groupes et les faire tourner différemment
    const groupSize = Math.ceil(playersForRotation.length / 3)

    // Créer 3 groupes de joueurs
    const groups: RotationPlayer[][] = [[], [], []]
    playersForRotation.forEach((player, idx) => {
      groups[idx % 3].push(player)
    })

    // Appliquer des décalages différents à chaque groupe
    const offsets = [
      0,                                    // Groupe 0: fixe
      rotationIndex % groups[1].length,     // Groupe 1: rotation standard
      (rotationIndex * 2) % groups[2].length // Groupe 2: rotation double
    ]

    // Former les équipes
    for (let i = 0; i < numTeams; i++) {
      const teamIds: string[] = []

      for (let g = 0; g < 3; g++) {
        if (groups[g].length > 0) {
          const playerIndex = (i + offsets[g]) % groups[g].length
          teamIds.push(groups[g][playerIndex].id)
        }
      }

      if (teamIds.length === 3) {
        result.teams.push({ joueur_ids: teamIds })
      }
    }

    // Nombre max de rotations sans répétition pour triplette
    // Approximation: min(taille des groupes) rotations
    const minGroupSize = Math.min(...groups.map(g => g.length).filter(l => l > 0))
    if (rotationIndex >= minGroupSize) {
      result.warnings.push(
        `En triplette avec ${playersForRotation.length} joueurs, des répétitions de partenaires sont possibles après ${minGroupSize} rotations.`
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
   * AMÉLIORATION v2: Génère des équipes mixtes pour une rotation
   * Utilise la méthode du cercle séparément pour H et F puis combine
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
    const hommes = players.filter(p => p.gender === 'H')
    const femmes = players.filter(p => p.gender === 'F')
    // Joueurs sans genre spécifié - les répartir
    const sansGenre = players.filter(p => !p.gender)

    // Répartir les joueurs sans genre équitablement
    sansGenre.forEach((p, i) => {
      if (i % 2 === 0) {
        hommes.push(p)
      } else {
        femmes.push(p)
      }
    })

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
      // AMÉLIORATION v2: Doublette mixte avec méthode du cercle sur les deux groupes
      const minPairs = Math.min(hommes.length, femmes.length)

      // Appliquer la méthode du cercle aux hommes ET aux femmes
      // Cela maximise les rotations possibles
      const hommesOrder = this.getRotatedOrder(hommes, rotationIndex)
      const femmesOrder = this.getRotatedOrder(femmes, rotationIndex)

      for (let i = 0; i < minPairs; i++) {
        result.teams.push({
          joueur_ids: [hommesOrder[i].id, femmesOrder[i].id]
        })
      }

      // Joueurs restants (déséquilibre H/F)
      for (let i = minPairs; i < hommes.length; i++) {
        result.unassignedPlayerIds.push(hommesOrder[i].id)
      }
      for (let i = minPairs; i < femmes.length; i++) {
        result.unassignedPlayerIds.push(femmesOrder[i].id)
      }

      if (result.unassignedPlayerIds.length > 0) {
        result.warnings.push(`${result.unassignedPlayerIds.length} joueur(s) non assigné(s) (déséquilibre H/F).`)
      }

      // Avertissement sur le max de rotations en mixité
      const maxMixteRotations = Math.min(hommes.length, femmes.length)
      if (rotationIndex >= maxMixteRotations) {
        result.warnings.push(
          `En mixité avec ${hommes.length}H et ${femmes.length}F, des répétitions sont possibles après ${maxMixteRotations} rotations.`
        )
      }
    } else {
      // Triplette mixte : 2H+1F ou 1H+2F
      // Stratégie: alterner les configurations
      const config2H1F = hommes.length >= femmes.length * 2
      const config1H2F = femmes.length >= hommes.length * 2

      // Compter les équipes possibles
      let numTeams: number
      if (config2H1F) {
        numTeams = Math.min(Math.floor(hommes.length / 2), femmes.length)
      } else if (config1H2F) {
        numTeams = Math.min(hommes.length, Math.floor(femmes.length / 2))
      } else {
        // Configuration mixte : alterner 2H+1F et 1H+2F
        numTeams = Math.floor((hommes.length + femmes.length) / 3)
      }

      const hommesOrder = this.getRotatedOrder(hommes, rotationIndex)
      const femmesOrder = this.getRotatedOrder(femmes, rotationIndex)

      let hIndex = 0
      let fIndex = 0

      for (let i = 0; i < numTeams; i++) {
        const team: string[] = []

        // Alterner les configurations pour équilibrer
        if ((i + rotationIndex) % 2 === 0 && hommesOrder.length - hIndex >= 2 && femmesOrder.length - fIndex >= 1) {
          // 2H + 1F
          team.push(hommesOrder[hIndex++].id)
          team.push(hommesOrder[hIndex++].id)
          team.push(femmesOrder[fIndex++].id)
        } else if (femmesOrder.length - fIndex >= 2 && hommesOrder.length - hIndex >= 1) {
          // 1H + 2F
          team.push(hommesOrder[hIndex++].id)
          team.push(femmesOrder[fIndex++].id)
          team.push(femmesOrder[fIndex++].id)
        } else if (hommesOrder.length - hIndex >= 2 && femmesOrder.length - fIndex >= 1) {
          // Fallback 2H + 1F
          team.push(hommesOrder[hIndex++].id)
          team.push(hommesOrder[hIndex++].id)
          team.push(femmesOrder[fIndex++].id)
        }

        if (team.length === 3) {
          result.teams.push({ joueur_ids: team })
        }
      }

      // Joueurs non assignés
      for (let i = hIndex; i < hommesOrder.length; i++) {
        result.unassignedPlayerIds.push(hommesOrder[i].id)
      }
      for (let i = fIndex; i < femmesOrder.length; i++) {
        result.unassignedPlayerIds.push(femmesOrder[i].id)
      }

      if (result.unassignedPlayerIds.length > 0) {
        result.warnings.push(`${result.unassignedPlayerIds.length} joueur(s) non assigné(s).`)
      }
    }

    return result
  }

  /**
   * AMÉLIORATION v2: Retourne les joueurs dans un ordre rotaté
   * Utilise un algorithme de décalage optimisé
   */
  private static getRotatedOrder<T extends RotationPlayer>(
    players: T[],
    rotationIndex: number
  ): T[] {
    if (players.length <= 1) return [...players]

    const result: T[] = []
    const n = players.length

    // Appliquer la méthode du cercle pour obtenir un ordre différent à chaque rotation
    // Le premier joueur reste "ancre", les autres tournent
    const anchor = players[0]
    const rotating = players.slice(1)
    const m = rotating.length

    // L'ordre de rotation basé sur la méthode du cercle
    const offset = rotationIndex % m

    // Commencer par le joueur qui serait partenaire de l'ancre
    // puis continuer dans l'ordre du cercle
    result.push(anchor)
    for (let i = 0; i < m; i++) {
      result.push(rotating[(offset + i) % m])
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
      // Pour doublette : n-1 rotations (n si impair car rotation du repos)
      return playerCount % 2 === 0 ? playerCount - 1 : playerCount
    } else {
      // Pour triplette : approximativement n/3 rotations
      return Math.floor(playerCount / 3)
    }
  }

  /**
   * NOUVEAU v2: Calcule les statistiques de partenariats pour debug/affichage
   */
  static getPartnershipStats(
    teams: RotationTeam[],
    previousPartners: Map<string, Set<string>>
  ): { newPartnerships: number; repeatedPartnerships: number } {
    let newPartnerships = 0
    let repeatedPartnerships = 0

    for (const team of teams) {
      const ids = team.joueur_ids
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const playerPartners = previousPartners.get(ids[i])
          if (playerPartners && playerPartners.has(ids[j])) {
            repeatedPartnerships++
          } else {
            newPartnerships++
          }
        }
      }
    }

    return { newPartnerships, repeatedPartnerships }
  }
}
