/**
 * Service de validation pour la logique métier des tournois
 * Centralise toutes les règles de validation
 */

export interface ValidationResult {
  valid: boolean
  error?: string
  warning?: string
}

/**
 * Valide qu'un nombre de joueurs est compatible avec un format
 * Détecte si des joueurs seraient exclus
 */
export function validatePlayerCount(
  nbPlayers: number,
  format: 'tete_a_tete' | 'doublette' | 'triplette',
  mode: 'choisi' | 'melee_fixe' | 'melee_tournante'
): ValidationResult {
  const playersPerTeam = format === 'tete_a_tete' ? 1 : format === 'doublette' ? 2 : 3

  // Mode choisi : peut avoir 0 joueurs (ajoutés plus tard)
  if (mode === 'choisi' && nbPlayers === 0) {
    return { valid: true }
  }

  // Minimum de joueurs
  if (nbPlayers < playersPerTeam) {
    return {
      valid: false,
      error: `Minimum ${playersPerTeam} joueur(s) requis pour une ${format}`
    }
  }

  // Vérifier exclusion de joueurs en mêlée
  if (mode === 'melee_fixe' || mode === 'melee_tournante') {
    const remainingPlayers = nbPlayers % playersPerTeam

    if (remainingPlayers > 0) {
      return {
        valid: false,
        error:
          `❌ Erreur critique : ${remainingPlayers} joueur(s) seraient exclus du tournoi.\n\n` +
          `Vous avez ${nbPlayers} joueurs pour une ${format} (${playersPerTeam} joueurs/équipe).\n` +
          `Ajoutez ${playersPerTeam - remainingPlayers} joueur(s) ou retirez-en ${remainingPlayers}.`
      }
    }
  }

  return { valid: true }
}

/**
 * Valide qu'un numéro de terrain est dans la plage autorisée
 */
export function validateTerrainNumber(
  terrain: number,
  maxTerrains: number
): ValidationResult {
  if (terrain < 1) {
    return {
      valid: false,
      error: 'Le numéro de terrain doit être au moins 1'
    }
  }

  if (terrain > maxTerrains) {
    return {
      valid: false,
      error:
        `❌ Terrain invalide !\n\n` +
        `Le terrain ${terrain} n'existe pas.\n` +
        `Ce tournoi dispose de ${maxTerrains} terrain(s) (numérotés de 1 à ${maxTerrains}).`
    }
  }

  return { valid: true }
}

/**
 * Valide qu'une taille de poule est correcte
 * Minimum 3 équipes par poule pour viabilité statistique
 */
export function validatePouleSize(
  pouleSize: number,
  totalTeams: number
): ValidationResult {
  if (pouleSize < 3) {
    return {
      valid: false,
      error: 'Minimum 3 équipes par poule pour assurer la viabilité du tournoi'
    }
  }

  if (pouleSize > totalTeams) {
    return {
      valid: false,
      error: `Taille de poule (${pouleSize}) supérieure au nombre d'équipes (${totalTeams})`
    }
  }

  // Vérifier déséquilibre extrême
  const nbPoules = Math.ceil(totalTeams / pouleSize)
  const lastPouleSize = totalTeams % pouleSize || pouleSize

  if (lastPouleSize < 2 && nbPoules > 1) {
    return {
      valid: false,
      warning: `La dernière poule n'aurait que ${lastPouleSize} équipe(s). Ajustez la taille des poules.`
    }
  }

  return { valid: true }
}

/**
 * Valide qu'un nombre de qualifiés par poule est cohérent
 */
export function validateQualifiedPerPoule(
  qualifiedPerPoule: number,
  pouleSize: number
): ValidationResult {
  if (qualifiedPerPoule < 1) {
    return {
      valid: false,
      error: 'Au moins 1 qualifié par poule requis'
    }
  }

  if (qualifiedPerPoule >= pouleSize) {
    return {
      valid: false,
      error: `Nombre de qualifiés (${qualifiedPerPoule}) doit être inférieur à la taille de poule (${pouleSize})`
    }
  }

  return { valid: true }
}

/**
 * Valide qu'un match peut être démarré
 */
export function validateMatchStart(match: {
  terrain: number | null
  equipe_a_id: string | null
  equipe_b_id: string | null
  status: string
}): ValidationResult {
  if (match.status === 'termine') {
    return {
      valid: false,
      error: 'Ce match est déjà terminé'
    }
  }

  // 🔧 FIX Bug #15 : Empêcher de redémarrer un match déjà en cours
  if (match.status === 'en_cours') {
    return {
      valid: false,
      error: 'Ce match est déjà en cours'
    }
  }

  if (!match.terrain) {
    return {
      valid: false,
      error: '⚠️ Veuillez d\'abord assigner un terrain au match avant de le démarrer.'
    }
  }

  if (!match.equipe_a_id || !match.equipe_b_id) {
    return {
      valid: false,
      error: 'Match incomplet : équipe(s) manquante(s)'
    }
  }

  return { valid: true }
}

/**
 * Valide qu'un score est conforme aux règles FIPJP
 *
 * @param scoreA Score de l'équipe A
 * @param scoreB Score de l'équipe B
 * @param maxPoints Score maximum (ex: 13)
 * @param options.allowTimeLimitEnd Si true, accepte un match terminé même si personne n'atteint maxPoints (temps limite FIPJP)
 * @param options.isElimination Si true, refuse les égalités (pas de nul en phase éliminatoire)
 */
export function validateScore(
  scoreA: number,
  scoreB: number,
  maxPoints: number,
  options: { allowTimeLimitEnd?: boolean; isElimination?: boolean } = {}
): ValidationResult {
  const { allowTimeLimitEnd = true, isElimination = false } = options

  if (scoreA < 0 || scoreB < 0) {
    return {
      valid: false,
      error: 'Les scores ne peuvent pas être négatifs'
    }
  }

  // Les deux équipes ne peuvent pas atteindre maxPoints simultanément
  if (scoreA === maxPoints && scoreB === maxPoints) {
    return {
      valid: false,
      error: `Impossible : les deux équipes ne peuvent pas atteindre ${maxPoints} points simultanément`
    }
  }

  if (scoreA > maxPoints || scoreB > maxPoints) {
    return {
      valid: false,
      error: `Score maximum autorisé : ${maxPoints} points`
    }
  }

  // Cas temps limite FIPJP : personne n'a atteint maxPoints
  if (scoreA < maxPoints && scoreB < maxPoints) {
    if (!allowTimeLimitEnd) {
      return {
        valid: false,
        error: `Le match ne peut être terminé que si une équipe atteint ${maxPoints} points`
      }
    }

    // En élimination, pas d'égalité possible (même au temps limite, le meneur gagne)
    if (isElimination && scoreA === scoreB) {
      return {
        valid: false,
        error: 'Pas d\'égalité possible en phase éliminatoire. Le meneur au temps limite gagne.'
      }
    }
  }

  return { valid: true }
}

/**
 * Valide que les poules ont toutes un nom
 */
export function validatePouleNames(pouleNames: (string | null | undefined)[]): ValidationResult {
  const invalidPoules = pouleNames.filter(p => !p)

  if (invalidPoules.length > 0) {
    return {
      valid: false,
      error: `⚠️ Erreur critique : ${invalidPoules.length} poule(s) sans nom détectée(s).\nImpossible de générer les phases finales.\nContactez un administrateur.`
    }
  }

  return { valid: true }
}

/**
 * Valide qu'une mixité est réalisable avec les joueurs disponibles
 */
export function validateMixity(
  hommes: number,
  femmes: number,
  format: 'tete_a_tete' | 'doublette' | 'triplette',
  mixiteObligatoire: boolean
): ValidationResult {
  if (!mixiteObligatoire) {
    return { valid: true }
  }

  if (format === 'tete_a_tete') {
    // Pas de mixité possible en tête-à-tête
    return {
      valid: false,
      warning: 'La mixité obligatoire n\'est pas applicable en tête-à-tête'
    }
  }

  if (format === 'doublette') {
    // Besoin d'au moins 1H et 1F
    if (hommes < 1 || femmes < 1) {
      return {
        valid: false,
        error: 'Mixité obligatoire en doublette requiert au moins 1 homme et 1 femme'
      }
    }
  }

  if (format === 'triplette') {
    // Besoin d'au moins 1H et 1F (l'algorithme forme des équipes 2H+1F ou 1H+2F)
    if (hommes < 1 || femmes < 1) {
      return {
        valid: false,
        error: 'Mixité obligatoire en triplette requiert au moins 1 homme et 1 femme'
      }
    }
  }

  const total = hommes + femmes
  const minorityRatio = Math.min(hommes, femmes) / total

  if (total > 0 && minorityRatio < 0.3) {
    const minority = hommes < femmes ? 'hommes' : 'femmes'
    return {
      valid: true,
      warning: `Ratio H/F déséquilibré (${hommes}H / ${femmes}F). Moins de 30% de ${minority} : certaines équipes ne seront pas mixtes.`
    }
  }

  return { valid: true }
}
