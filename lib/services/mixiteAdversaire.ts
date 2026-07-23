/**
 * Mixité des ADVERSAIRES (règle « esprit club » du cahier des charges).
 *
 * Règle : une équipe à majorité féminine (ex. 2F+1H) ne doit pas affronter une
 * équipe à majorité masculine (2H+1F). Elle doit tomber contre une équipe de même
 * profil (majorité féminine) OU contre une équipe équilibrée (doublette 1H+1F).
 * Symétriquement pour une équipe à majorité masculine.
 *
 * Exception prévue par la règle : « sauf s'il y a impossibilité de faire
 * autrement ». Les fonctions ci-dessous appliquent donc la contrainte en
 * BEST-EFFORT et signalent le nombre d'appariements « forcés » (dérogations).
 *
 * ⚠️ Portée : cette contrainte n'a de sens que pour un appariement d'UNE ronde
 * (un match par équipe contre un seul adversaire tiré). Elle est incompatible
 * avec un round-robin de poule (où chaque équipe affronte toutes les autres).
 * C'est une fonction pure : elle sera branchée sur un tirage « une partie = un
 * adversaire », pas sur les poules.
 */

/** Profil de genre d'une équipe : majorité Femmes, majorité Hommes, ou éQuilibré. */
export type GenderProfile = 'F' | 'M' | 'N'

/** Détermine le profil d'une équipe à partir des genres de ses joueurs. */
export function teamGenderProfile(
  joueurIds: string[],
  genderById: Map<string, 'H' | 'F'>
): GenderProfile {
  let f = 0
  let h = 0
  for (const id of joueurIds) {
    if (genderById.get(id) === 'F') f++
    else h++
  }
  if (f > h) return 'F'
  if (h > f) return 'M'
  return 'N'
}

/**
 * Deux profils peuvent-ils s'affronter selon la règle ?
 * - N (équilibré) est compatible avec tout le monde.
 * - Sinon, uniquement même profil (F↔F, M↔M). Jamais F↔M.
 */
export function profilesCompatible(a: GenderProfile, b: GenderProfile): boolean {
  if (a === 'N' || b === 'N') return true
  return a === b
}

export interface MixitePairing {
  /** Paires d'index d'équipes (dans le tableau d'entrée) qui s'affrontent. */
  pairs: Array<[number, number]>
  /** Index de l'équipe exempte (nombre impair d'équipes), ou null. */
  bye: number | null
  /** Nb d'appariements ayant dû déroger à la règle (aucun adversaire compatible). */
  forced: number
}

/**
 * Apparie les équipes d'UNE ronde en respectant au mieux la mixité adversaire.
 *
 * Algorithme glouton : pour chaque équipe non appariée, on cherche un adversaire
 * COMPATIBLE encore libre ; si aucun n'existe, on prend le premier libre et on
 * compte une dérogation (exception « impossibilité de faire autrement »).
 *
 * @param profiles profils de genre des équipes, indexés comme le tableau d'équipes
 * @returns paires d'index, bye éventuel, et nombre de dérogations
 */
export function pairRoundByMixite(profiles: GenderProfile[]): MixitePairing {
  return pairRound(profiles)
}

/**
 * Appariement d'une ronde, glouton, maximisant à la fois :
 *   - la compatibilité de genre (F↔F/N, M↔M/N ; jamais F↔M),
 *   - la fraîcheur de l'adversaire (éviter de rejouer contre un ancien adversaire).
 *
 * Score d'un candidat = (compatible ? 2 : 0) + (déjà affronté ? 0 : 1). On prend
 * le meilleur score → on privilégie « compatible ET nouveau », puis on dégrade
 * proprement (dérogations comptées) « s'il y a impossibilité de faire autrement ».
 *
 * @param profiles profils de genre par équipe (mettre tout à 'N' pour ignorer la mixité)
 * @param avoid    (i, j) => true si i et j se sont déjà affrontés (à éviter)
 */
export function pairRound(
  profiles: GenderProfile[],
  avoid?: (i: number, j: number) => boolean
): MixitePairing & { repeats: number } {
  const remaining = profiles.map((_, i) => i)
  const pairs: Array<[number, number]> = []
  let forced = 0
  let repeats = 0

  while (remaining.length > 1) {
    const a = remaining.shift() as number
    let bestIdx = 0
    let bestScore = -1
    for (let k = 0; k < remaining.length; k++) {
      const b = remaining[k]
      const comp = profilesCompatible(profiles[a], profiles[b]) ? 2 : 0
      const fresh = avoid && avoid(a, b) ? 0 : 1
      const score = comp + fresh
      if (score > bestScore) {
        bestScore = score
        bestIdx = k
      }
    }
    const b = remaining.splice(bestIdx, 1)[0]
    if (!profilesCompatible(profiles[a], profiles[b])) forced++
    if (avoid && avoid(a, b)) repeats++
    pairs.push([a, b])
  }

  const bye = remaining.length === 1 ? remaining[0] : null
  return { pairs, bye, forced, repeats }
}
