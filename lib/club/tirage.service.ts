// lib/club/tirage.service.ts
// Service de tirage des équipes avec règles H/F avancées Pack Club
// Gère : mêlées, mêlées tournantes, composition H/F, nombres impairs

import {
  ClubRules,
  ClubJoueur,
  ClubEquipe,
  ClubMatch,
  ClubTirageResult,
  ClubMixiteRules,
  ClubTerrainsConfig
} from './types'

/**
 * Fisher-Yates shuffle - Algorithme de mélange uniforme
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * Génère un ID unique
 */
function generateId(): string {
  return `eq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
}

/**
 * Détermine la composition genre d'une équipe (ex: "2H1F", "1H1F")
 */
function getCompositionGenre(joueurs: ClubJoueur[]): string {
  const hommes = joueurs.filter(j => j.gender === 'H').length
  const femmes = joueurs.filter(j => j.gender === 'F').length

  if (hommes === 0) return `${femmes}F`
  if (femmes === 0) return `${hommes}H`
  return `${hommes}H${femmes}F`
}

/**
 * Vérifie si une équipe respecte la règle "jamais 3 du même genre"
 */
function respecteJamaisTroisMemeGenre(joueurs: ClubJoueur[]): boolean {
  const hommes = joueurs.filter(j => j.gender === 'H').length
  const femmes = joueurs.filter(j => j.gender === 'F').length
  return hommes < 3 && femmes < 3
}

/**
 * Vérifie si un match respecte la règle d'équilibre H/F
 * (2F1H ne joue pas contre 2H1F)
 */
function respecteEquilibreMatchHF(equipeA: ClubEquipe, equipeB: ClubEquipe): boolean {
  const compA = equipeA.compositionGenre
  const compB = equipeB.compositionGenre

  // Interdire 2H1F vs 2F1H
  if ((compA === '2H1F' && compB === '2F1H') || (compA === '2F1H' && compB === '2H1F')) {
    return false
  }

  // Interdire 1H2F vs 2H1F (même règle, notation différente possible)
  if ((compA === '1H2F' && compB === '2H1F') || (compA === '2H1F' && compB === '1H2F')) {
    return false
  }

  return true
}

/**
 * Service de tirage des équipes Pack Club
 */
export class ClubTirageService {
  /**
   * Effectue le tirage complet selon les règles du club
   */
  static tirage(
    joueurs: ClubJoueur[],
    rules: ClubRules,
    tour: number = 1
  ): ClubTirageResult {
    const result: ClubTirageResult = {
      equipes: [],
      matchs: [],
      joueursNonAssignes: [],
      warnings: []
    }

    if (joueurs.length < 2) {
      result.warnings.push('Pas assez de joueurs pour former des équipes')
      result.joueursNonAssignes = joueurs.map(j => j.id)
      return result
    }

    // Déterminer le nombre de joueurs par équipe selon le format
    const playersPerTeam = rules.format === 'triplette' ? 3 : 2

    // Former les équipes selon le mode
    if (rules.mode === 'choisi') {
      // En mode choisi, on ne forme pas les équipes automatiquement
      result.warnings.push('Mode choisi : les équipes doivent être composées manuellement')
      return result
    }

    // Mêlées ou Mêlées tournantes : tirage automatique
    const equipesFormees = this.formerEquipes(joueurs, playersPerTeam, rules)
    result.equipes = equipesFormees.equipes
    result.joueursNonAssignes = equipesFormees.nonAssignes
    result.warnings.push(...equipesFormees.warnings)

    // Générer les matchs si on a au moins 2 équipes
    if (result.equipes.length >= 2) {
      const matchsGeneres = this.genererMatchs(result.equipes, rules, tour)
      result.matchs = matchsGeneres.matchs
      result.warnings.push(...matchsGeneres.warnings)
    }

    return result
  }

  /**
   * Forme les équipes en respectant les règles H/F
   */
  private static formerEquipes(
    joueurs: ClubJoueur[],
    playersPerTeam: number,
    rules: ClubRules
  ): { equipes: ClubEquipe[]; nonAssignes: string[]; warnings: string[] } {
    const equipes: ClubEquipe[] = []
    const warnings: string[] = []

    // Séparer par genre si mixité activée
    const hommes = shuffle(joueurs.filter(j => j.gender === 'H'))
    const femmes = shuffle(joueurs.filter(j => j.gender === 'F'))
    let restants: ClubJoueur[] = []

    if (rules.mixite.enabled && rules.mixite.prioriteMixite) {
      // Formation avec priorité mixité
      if (playersPerTeam === 2) {
        // Doublette : 1H + 1F
        while (hommes.length > 0 && femmes.length > 0) {
          const equipe = this.creerEquipe([hommes.shift()!, femmes.shift()!])
          equipes.push(equipe)
        }
        restants = [...hommes, ...femmes]
      } else {
        // Triplette : 2H1F ou 1H2F (en évitant 3 du même genre)
        while (hommes.length >= 2 && femmes.length >= 1) {
          const equipe = this.creerEquipe([hommes.shift()!, hommes.shift()!, femmes.shift()!])
          if (rules.mixite.jamaisTroisMemeGenre && !respecteJamaisTroisMemeGenre([...equipe.joueurIds.map(id => joueurs.find(j => j.id === id)!)])) {
            // Ne devrait pas arriver avec 2H1F, mais sécurité
            warnings.push('Équipe non conforme aux règles H/F')
          }
          equipes.push(equipe)
        }
        while (hommes.length >= 1 && femmes.length >= 2) {
          const equipe = this.creerEquipe([hommes.shift()!, femmes.shift()!, femmes.shift()!])
          equipes.push(equipe)
        }
        restants = [...hommes, ...femmes]
      }
    } else {
      // Formation sans priorité mixité (mélange simple)
      restants = shuffle([...joueurs])
    }

    // Former les équipes restantes (possiblement non-mixtes)
    if (rules.autoriserMelangeFormats && restants.length > 0) {
      // Autoriser mélange doublette/triplette si nombre impair
      while (restants.length >= playersPerTeam) {
        const membres = restants.splice(0, playersPerTeam)
        const equipe = this.creerEquipe(membres)

        // Vérifier règle "jamais 3 même genre"
        if (playersPerTeam === 3 && rules.mixite.enabled && rules.mixite.jamaisTroisMemeGenre) {
          if (!respecteJamaisTroisMemeGenre(membres)) {
            warnings.push(`Équipe ${equipe.compositionGenre} : 3 personnes du même genre (impossible à éviter)`)
          }
        }

        equipes.push(equipe)
      }

      // Gérer le reste si autoriserMelangeFormats
      if (restants.length > 0 && rules.autoriserMelangeFormats) {
        if (playersPerTeam === 3 && restants.length === 2) {
          // Créer une doublette avec les 2 restants
          const equipe = this.creerEquipe(restants.splice(0, 2))
          equipes.push(equipe)
          warnings.push('1 doublette créée pour compléter (nombre impair de joueurs)')
        } else if (playersPerTeam === 2 && restants.length === 1) {
          // 1 joueur restant en doublette - chercher à faire une triplette
          // Prendre 2 joueurs d'une équipe existante et faire 1 triplette
          if (equipes.length > 0) {
            const derniereEquipe = equipes.pop()!
            const joueursDerniereEquipe = derniereEquipe.joueurIds.map(id => joueurs.find(j => j.id === id)!)
            const nouveauxMembres = [...joueursDerniereEquipe, ...restants]
            const nouvelleEquipe = this.creerEquipe(nouveauxMembres)
            equipes.push(nouvelleEquipe)
            restants = []
            warnings.push('1 triplette créée pour inclure le joueur restant')
          }
        }
      }
    } else {
      // Pas de mélange : équipes standard uniquement
      while (restants.length >= playersPerTeam) {
        const membres = restants.splice(0, playersPerTeam)
        equipes.push(this.creerEquipe(membres))
      }
    }

    return {
      equipes,
      nonAssignes: restants.map(j => j.id),
      warnings
    }
  }

  /**
   * Crée une équipe à partir des joueurs
   */
  private static creerEquipe(joueurs: ClubJoueur[]): ClubEquipe {
    return {
      id: generateId(),
      joueurIds: joueurs.map(j => j.id),
      compositionGenre: getCompositionGenre(joueurs)
    }
  }

  /**
   * Génère les matchs en respectant les règles H/F
   */
  private static genererMatchs(
    equipes: ClubEquipe[],
    rules: ClubRules,
    tour: number
  ): { matchs: ClubMatch[]; warnings: string[] } {
    const matchs: ClubMatch[] = []
    const warnings: string[] = []
    const terrains = [...rules.terrains.noms]

    // Mélanger les équipes pour le tirage
    const equipesShuffled = shuffle([...equipes])

    // Générer les paires de matchs
    const equipesDisponibles = [...equipesShuffled]

    let terrainIndex = 0

    while (equipesDisponibles.length >= 2) {
      const equipeA = equipesDisponibles.shift()!
      let equipeB: ClubEquipe | undefined

      // Chercher un adversaire valide selon les règles H/F
      if (rules.mixite.enabled && rules.mixite.equilibreMatchsHF) {
        // Chercher un adversaire compatible
        const indexCompatible = equipesDisponibles.findIndex(eq =>
          respecteEquilibreMatchHF(equipeA, eq)
        )

        if (indexCompatible >= 0) {
          equipeB = equipesDisponibles.splice(indexCompatible, 1)[0]
        } else {
          // Pas d'adversaire compatible, prendre le premier et avertir
          equipeB = equipesDisponibles.shift()
          if (equipeB) {
            warnings.push(
              `Match ${equipeA.compositionGenre} vs ${equipeB.compositionGenre} : règle équilibre H/F non respectée (impossible à éviter)`
            )
          }
        }
      } else {
        equipeB = equipesDisponibles.shift()
      }

      if (equipeB) {
        const terrain = rules.terrains.attributionAuto
          ? terrains[terrainIndex % terrains.length]
          : ''

        matchs.push({
          equipeAId: equipeA.id,
          equipeBId: equipeB.id,
          terrain,
          tour,
          valideHF: rules.mixite.enabled
            ? respecteEquilibreMatchHF(equipeA, equipeB)
            : true
        })

        terrainIndex++
      }
    }

    // Équipe sans adversaire (nombre impair d'équipes)
    if (equipesDisponibles.length === 1) {
      warnings.push(`Équipe ${equipesDisponibles[0].compositionGenre} sans adversaire ce tour (nombre impair d'équipes)`)
    }

    return { matchs, warnings }
  }

  /**
   * Refait le tirage pour un nouveau tour (mêlée tournante)
   * Les joueurs changent d'équipe
   */
  static nouveauTourMeleeTournante(
    joueurs: ClubJoueur[],
    rules: ClubRules,
    tour: number
  ): ClubTirageResult {
    // En mêlée tournante, on refait un tirage complet
    return this.tirage(joueurs, rules, tour)
  }

  /**
   * Garde les mêmes équipes pour un nouveau tour (mêlée fixe)
   * Seuls les adversaires changent
   */
  static nouveauTourMeleeFixe(
    equipes: ClubEquipe[],
    rules: ClubRules,
    tour: number
  ): { matchs: ClubMatch[]; warnings: string[] } {
    return this.genererMatchs(equipes, rules, tour)
  }
}
