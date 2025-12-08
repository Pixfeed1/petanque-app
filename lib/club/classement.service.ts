// lib/club/classement.service.ts
// Service de calcul du classement Pack Club
// Gère : victoires > points, différence de points, etc.

import {
  ClubRules,
  ClubClassementMethode,
  ClubPartieScore,
  ClubClassementEntry,
  ClubClassement
} from './types'

/**
 * Calcule la différence pour une partie
 * Ex: gagné 13-4 = +9, perdu 5-13 = -8
 */
function calculerDifference(scoreEquipe: number, scoreAdversaire: number): number {
  return scoreEquipe - scoreAdversaire
}

/**
 * Détermine si c'est une victoire
 */
function estVictoire(scoreEquipe: number, scoreAdversaire: number, pointsGagnants: number): boolean {
  return scoreEquipe >= pointsGagnants && scoreEquipe > scoreAdversaire
}

/**
 * Service de calcul du classement Pack Club
 */
export class ClubClassementService {
  /**
   * Calcule le classement complet selon les règles du club
   */
  static calculerClassement(
    entries: Omit<ClubClassementEntry, 'position' | 'totalDifference' | 'victoires' | 'defaites'>[],
    parties: Map<string, ClubPartieScore[]>, // Map joueurId/equipeId -> parties
    rules: ClubRules
  ): ClubClassement {
    // Calculer les stats pour chaque entrée
    const entriesAvecStats: ClubClassementEntry[] = entries.map(entry => {
      const id = entry.joueurId || entry.equipeId || ''
      const partiesJoueur = parties.get(id) || []

      const victoires = partiesJoueur.filter(p => p.victoire).length
      const defaites = partiesJoueur.filter(p => !p.victoire).length
      const totalDifference = partiesJoueur.reduce((sum, p) => sum + p.difference, 0)

      return {
        ...entry,
        parties: partiesJoueur,
        victoires,
        defaites,
        totalDifference,
        position: 0 // Sera calculé après tri
      }
    })

    // Trier selon la méthode configurée
    const sorted = this.trierParMethode(entriesAvecStats, rules.classement.methode)

    // Attribuer les positions
    sorted.forEach((entry, index) => {
      entry.position = index + 1
    })

    return {
      entries: sorted,
      methode: rules.classement.methode
    }
  }

  /**
   * Trie les entrées selon la méthode de classement
   */
  private static trierParMethode(
    entries: ClubClassementEntry[],
    methode: ClubClassementMethode
  ): ClubClassementEntry[] {
    return [...entries].sort((a, b) => {
      switch (methode) {
        case 'victoires_puis_points':
          // 1. Victoires (desc)
          if (b.victoires !== a.victoires) {
            return b.victoires - a.victoires
          }
          // 2. Différence de points (desc)
          return b.totalDifference - a.totalDifference

        case 'points_puis_victoires':
          // 1. Différence de points (desc)
          if (b.totalDifference !== a.totalDifference) {
            return b.totalDifference - a.totalDifference
          }
          // 2. Victoires (desc)
          return b.victoires - a.victoires

        case 'difference_points':
          // Uniquement différence de points
          return b.totalDifference - a.totalDifference

        default:
          return b.victoires - a.victoires
      }
    })
  }

  /**
   * Crée un score de partie à partir des résultats
   */
  static creerPartieScore(
    partieNum: number,
    scoreEquipe: number,
    scoreAdversaire: number,
    pointsGagnants: number
  ): ClubPartieScore {
    return {
      partieNum,
      scoreEquipe,
      scoreAdversaire,
      difference: calculerDifference(scoreEquipe, scoreAdversaire),
      victoire: estVictoire(scoreEquipe, scoreAdversaire, pointsGagnants)
    }
  }

  /**
   * Exemple de calcul :
   * Eric a gagné 13 à 4 = +9
   * Perdu 5 à 13 = -8
   * Gagné 13 à 2 = +11
   * Total = 9 - 8 + 11 = 12 points
   *
   * Jean Marc a 22 points avec 3 parties sur 3
   * Eric a 24 points avec 2 parties sur 3
   *
   * Avec methode = 'victoires_puis_points':
   * 1. Jean Marc (3 victoires)
   * 2. Eric (2 victoires)
   */
  static exempleCalcul(): void {
    const ericParties: ClubPartieScore[] = [
      { partieNum: 1, scoreEquipe: 13, scoreAdversaire: 4, difference: 9, victoire: true },
      { partieNum: 2, scoreEquipe: 5, scoreAdversaire: 13, difference: -8, victoire: false },
      { partieNum: 3, scoreEquipe: 13, scoreAdversaire: 2, difference: 11, victoire: true }
    ]

    const jeanMarcParties: ClubPartieScore[] = [
      { partieNum: 1, scoreEquipe: 13, scoreAdversaire: 6, difference: 7, victoire: true },
      { partieNum: 2, scoreEquipe: 13, scoreAdversaire: 8, difference: 5, victoire: true },
      { partieNum: 3, scoreEquipe: 13, scoreAdversaire: 3, difference: 10, victoire: true }
    ]

    // Eric: 2 victoires, différence = 9 - 8 + 11 = 12
    // Jean Marc: 3 victoires, différence = 7 + 5 + 10 = 22

    // Avec victoires_puis_points:
    // 1. Jean Marc (3 victoires, 22 pts)
    // 2. Eric (2 victoires, 12 pts)

    console.log('Eric - Victoires:', 2, 'Diff:', 12)
    console.log('Jean Marc - Victoires:', 3, 'Diff:', 22)
  }

  /**
   * Génère un résumé textuel du classement pour impression
   */
  static genererResumeClassement(classement: ClubClassement): string {
    let resume = '=== CLASSEMENT ===\n'
    resume += `Méthode: ${classement.methode}\n\n`

    classement.entries.forEach(entry => {
      const statsParties = entry.parties
        .map(p => `${p.victoire ? 'V' : 'D'} ${p.scoreEquipe}-${p.scoreAdversaire} (${p.difference >= 0 ? '+' : ''}${p.difference})`)
        .join(' | ')

      resume += `${entry.position}. ${entry.nom}\n`
      resume += `   Victoires: ${entry.victoires}/${entry.parties.length}\n`
      resume += `   Différence: ${entry.totalDifference >= 0 ? '+' : ''}${entry.totalDifference}\n`
      resume += `   Parties: ${statsParties}\n\n`
    })

    return resume
  }

  /**
   * Vérifie s'il y a des égalités dans le classement
   */
  static detecterEgalites(classement: ClubClassement): { positions: number[]; joueurs: string[] }[] {
    const egalites: { positions: number[]; joueurs: string[] }[] = []

    for (let i = 0; i < classement.entries.length - 1; i++) {
      const current = classement.entries[i]
      const next = classement.entries[i + 1]

      // Vérifier si égalité selon la méthode
      const estEgal =
        current.victoires === next.victoires &&
        current.totalDifference === next.totalDifference

      if (estEgal) {
        // Chercher s'il existe déjà un groupe d'égalité
        const groupeExistant = egalites.find(e =>
          e.joueurs.includes(current.nom)
        )

        if (groupeExistant) {
          groupeExistant.joueurs.push(next.nom)
          groupeExistant.positions.push(next.position)
        } else {
          egalites.push({
            positions: [current.position, next.position],
            joueurs: [current.nom, next.nom]
          })
        }
      }
    }

    return egalites
  }
}
