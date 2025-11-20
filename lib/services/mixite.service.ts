/**
 * Service de gestion de la mixité (H/F) dans la formation des équipes
 * Conforme aux règles FIPJP pour les tournois de pétanque
 */

export interface Joueur {
  id: string
  gender?: 'H' | 'F'
  [key: string]: any
}

export interface TeamComposition {
  joueur_ids: string[]
}

export interface MixiteResult {
  teams: TeamComposition[]
  unassignedPlayerIds: string[]
  warnings: string[]
}

export interface MixiteValidationResult {
  valid: boolean
  error?: string
  missingGenderPlayerIds?: string[]
}

/**
 * Service centralisé pour la gestion de la mixité
 */
export class MixiteService {
  /**
   * Valide que tous les joueurs ont un genre défini si mixité obligatoire
   *
   * @param players Liste des joueurs
   * @param mixiteObligatoire Si la mixité est obligatoire
   * @returns Résultat de validation
   */
  static validatePlayerGenders(
    players: Joueur[],
    mixiteObligatoire: boolean
  ): MixiteValidationResult {
    if (!mixiteObligatoire) {
      return { valid: true }
    }

    const missingGenderPlayers = players.filter(p => !p.gender || (p.gender !== 'H' && p.gender !== 'F'))

    if (missingGenderPlayers.length > 0) {
      return {
        valid: false,
        error: `${missingGenderPlayers.length} joueur(s) n'ont pas de genre défini (H/F).\n\nLa mixité obligatoire nécessite que tous les joueurs aient un genre défini.\n\nVeuillez compléter les profils des joueurs avant de créer le tournoi.`,
        missingGenderPlayerIds: missingGenderPlayers.map(p => p.id)
      }
    }

    return { valid: true }
  }

  /**
   * Valide que le format est compatible avec la mixité obligatoire
   *
   * @param format Format du tournoi
   * @param mixiteObligatoire Si la mixité est obligatoire
   * @returns Résultat de validation
   */
  static validateFormatMixite(
    format: 'tete_a_tete' | 'doublette' | 'triplette',
    mixiteObligatoire: boolean
  ): MixiteValidationResult {
    if (mixiteObligatoire && format === 'tete_a_tete') {
      return {
        valid: false,
        error: '⚠️ Incompatibilité format / mixité\n\nLa mixité obligatoire nécessite au moins 2 joueurs par équipe (H+F dans la même équipe).\n\nElle n\'est pas compatible avec le format tête-à-tête (1 joueur par équipe).\n\nVeuillez choisir doublette ou triplette, ou désactiver la mixité obligatoire.'
      }
    }

    return { valid: true }
  }

  /**
   * Forme des équipes avec mixité encouragée (flexible)
   * Crée le maximum d'équipes mixtes, accepte des équipes non-mixtes si nécessaire
   * pour inclure tous les joueurs
   *
   * @param players Liste des joueurs à assigner
   * @param playersPerTeam Nombre de joueurs par équipe (2 pour doublette, 3 pour triplette)
   * @param mixiteObligatoire Si la mixité est obligatoire (pas encore implémenté strictement)
   * @returns Résultat avec équipes formées et joueurs non assignés
   */
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

    // Si mixité NON obligatoire : formation libre sans contrainte de genre
    if (!mixiteObligatoire) {
      const shuffled = [...players].sort(() => Math.random() - 0.5)
      const nbEquipes = Math.floor(shuffled.length / playersPerTeam)

      for (let i = 0; i < nbEquipes; i++) {
        const teamPlayerIds = shuffled
          .slice(i * playersPerTeam, (i + 1) * playersPerTeam)
          .map(p => p.id)

        result.teams.push({ joueur_ids: teamPlayerIds })
      }

      // Joueurs restants (si le nombre n'est pas divisible)
      const remaining = shuffled.slice(nbEquipes * playersPerTeam)
      result.unassignedPlayerIds = remaining.map(p => p.id)

      if (remaining.length > 0) {
        result.warnings.push(
          `${remaining.length} joueur(s) non assigné(s) car le nombre de joueurs n'est pas divisible par ${playersPerTeam}.`
        )
      }

      return result
    }

    // Si mixité OBLIGATOIRE : algorithme flexible (mixité encouragée)
    // Séparer par genre
    const playersByGender: { H: Joueur[], F: Joueur[] } = { H: [], F: [] }

    for (const player of players) {
      // Normaliser le genre : tout ce qui n'est pas 'F' est considéré comme 'H'
      const gender = player.gender === 'F' ? 'F' : 'H'
      playersByGender[gender].push(player)
    }

    // Mélanger chaque genre pour randomiser
    playersByGender.H.sort(() => Math.random() - 0.5)
    playersByGender.F.sort(() => Math.random() - 0.5)

    if (playersPerTeam === 2) {
      // DOUBLETTE : 1H + 1F autant que possible
      while (playersByGender.H.length > 0 && playersByGender.F.length > 0) {
        const teamPlayerIds = [
          playersByGender.H.shift()!.id,
          playersByGender.F.shift()!.id
        ]
        result.teams.push({ joueur_ids: teamPlayerIds })
      }

      // Équipes restantes (non-mixtes si nécessaire pour inclure tous)
      const remaining = [...playersByGender.H, ...playersByGender.F]
      remaining.sort(() => Math.random() - 0.5) // Mélanger

      while (remaining.length >= playersPerTeam) {
        const teamPlayerIds = remaining.splice(0, playersPerTeam).map(p => p.id)
        result.teams.push({ joueur_ids: teamPlayerIds })
      }

      // Joueurs non assignés
      result.unassignedPlayerIds = remaining.map(p => p.id)

      if (remaining.length > 0) {
        result.warnings.push(
          `${remaining.length} joueur(s) non assigné(s) car nombre incompatible avec le format doublette.`
        )
      }
    } else {
      // TRIPLETTE : 2H + 1F ou 1H + 2F autant que possible
      while (
        (playersByGender.H.length >= 2 && playersByGender.F.length >= 1) ||
        (playersByGender.H.length >= 1 && playersByGender.F.length >= 2)
      ) {
        let teamPlayerIds: string[]

        // Prioriser 2H + 1F si possible, sinon 1H + 2F
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

      // Équipes restantes (non-mixtes si nécessaire pour inclure tous)
      const remaining = [...playersByGender.H, ...playersByGender.F]
      remaining.sort(() => Math.random() - 0.5) // Mélanger pour alterner H/F

      while (remaining.length >= playersPerTeam) {
        const teamPlayerIds = remaining.splice(0, playersPerTeam).map(p => p.id)
        result.teams.push({ joueur_ids: teamPlayerIds })
      }

      // Joueurs non assignés
      result.unassignedPlayerIds = remaining.map(p => p.id)

      if (remaining.length > 0) {
        result.warnings.push(
          `${remaining.length} joueur(s) non assigné(s) car nombre incompatible avec le format triplette.`
        )
      }
    }

    return result
  }

  /**
   * Statistiques sur la mixité des équipes formées
   * Utile pour l'organisateur pour visualiser la répartition
   *
   * @param teams Équipes formées
   * @param players Liste complète des joueurs
   * @returns Statistiques de mixité
   */
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
