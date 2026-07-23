// lib/services/tirage.service.ts
// Service de tirage intelligent pour les tournois de pétanque
// - Distribution serpentin (snake draft) pour les poules
// - Tables de Berger pour le round-robin
// - Anti-rematch pour la mêlée tournante

export interface TeamForDraw {
  id: string
  name: string
  joueur_ids?: string[]
}

export interface PoolAssignment {
  [poolName: string]: TeamForDraw[]
}

/**
 * Shuffle Fisher-Yates (algorithme correct, contrairement à sort(() => Math.random() - 0.5))
 */
export function fisherYatesShuffle<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Distribution serpentin (snake draft) des équipes dans les poules
 *
 * Au lieu de répartir séquentiellement (ce qui donne les meilleures équipes
 * ensemble), on serpente :
 *   Rang 1 → Poule A, B, C, D
 *   Rang 2 → Poule D, C, B, A  (sens inversé)
 *   Rang 3 → Poule A, B, C, D  (sens normal)
 *   ...
 *
 * Résultat : des poules équilibrées en force.
 * On mélange d'abord les équipes (pas de classement préalable en tournoi initial)
 * mais la distribution serpentin garantit que même avec un shuffle, la répartition
 * est plus homogène qu'un découpage séquentiel.
 */
export function snakeDraftDistribution(
  teams: TeamForDraw[],
  poolSize: number
): PoolAssignment {
  const nbPools = Math.ceil(teams.length / poolSize)
  const shuffled = fisherYatesShuffle(teams)

  // Initialiser les poules
  const pools: PoolAssignment = {}
  for (let i = 0; i < nbPools; i++) {
    pools[String.fromCharCode(65 + i)] = []
  }

  const poolNames = Object.keys(pools)

  // Distribution serpentin
  for (let i = 0; i < shuffled.length; i++) {
    const row = Math.floor(i / nbPools)
    const col = i % nbPools

    // Serpentin : lignes paires → gauche à droite, impaires → droite à gauche
    const poolIndex = row % 2 === 0 ? col : (nbPools - 1 - col)
    pools[poolNames[poolIndex]].push(shuffled[i])
  }

  return pools
}

/**
 * Équilibrage des tailles de poules
 *
 * Quand le nombre d'équipes n'est pas divisible par la taille de poule,
 * on redistribue pour minimiser l'écart entre la plus grande et la plus petite poule.
 *
 * Ex: 11 équipes en poules de 4 → au lieu de 4-4-3, on fait 4-4-3
 * Ex: 14 équipes en poules de 4 → au lieu de 4-4-4-2, on fait 4-4-3-3 (meilleur équilibre)
 */
export function calculateBalancedPoolSizes(
  teamCount: number,
  targetPoolSize: number
): number[] {
  if (teamCount <= 0 || targetPoolSize <= 0) return []

  const nbPools = Math.ceil(teamCount / targetPoolSize)
  const baseSize = Math.floor(teamCount / nbPools)
  const extraTeams = teamCount % nbPools

  // Les premières poules ont 1 équipe de plus
  const sizes: number[] = []
  for (let i = 0; i < nbPools; i++) {
    sizes.push(baseSize + (i < extraTeams ? 1 : 0))
  }

  return sizes
}

/**
 * Tables de Berger pour un planning round-robin équilibré
 *
 * Garantit que chaque équipe joue à intervalle régulier (pas 3 matchs d'affilée
 * puis rien). Utilise l'algorithme classique de rotation circulaire.
 *
 * Pour N équipes (N pair), on fixe l'équipe 0 et on fait tourner les autres.
 * Pour N impair, on ajoute un "fantôme" et le match contre le fantôme = repos.
 *
 * @returns Liste ordonnée de paires [indexA, indexB] par tour
 */
export function bergerRoundRobin(
  teamCount: number
): Array<{ tour: number; pairs: Array<[number, number]> }> {
  const n = teamCount % 2 === 0 ? teamCount : teamCount + 1 // Ajouter fantôme si impair
  const rounds: Array<{ tour: number; pairs: Array<[number, number]> }> = []

  // Indices des équipes mobiles (0 est fixe)
  const indices: number[] = []
  for (let i = 1; i < n; i++) {
    indices.push(i)
  }

  for (let round = 0; round < n - 1; round++) {
    const pairs: Array<[number, number]> = []

    // Première paire : équipe fixe (0) vs premier de la rotation
    // Alternance domicile/extérieur : tours pairs → 0 reçoit, tours impairs → 0 se déplace
    if (indices[0] < teamCount) {
      if (round % 2 === 0) {
        pairs.push([0, indices[0]])
      } else {
        pairs.push([indices[0], 0])
      }
    }

    // Autres paires : indices[i] ↔ indices[n-1-i] (miroir symétrique)
    // Même alternance appliquée
    for (let i = 1; i < n / 2; i++) {
      const a = indices[i]
      const b = indices[n - 1 - i]

      // Ignorer si une des deux est le fantôme (>= teamCount)
      if (a < teamCount && b < teamCount) {
        if (round % 2 === 0) {
          pairs.push([a, b])
        } else {
          pairs.push([b, a])
        }
      }
    }

    rounds.push({ tour: round + 1, pairs })

    // Rotation circulaire des indices
    indices.push(indices.shift()!)
  }

  return rounds
}

/**
 * Génère les matchs de poule avec scheduling Berger
 * Retourne les matchs dans un ordre optimal (chaque équipe a du repos entre ses matchs)
 */
export function generateBergerMatches<T extends TeamForDraw>(
  teams: T[],
  poule: string | null
): Array<{ teamA: T; teamB: T; tour: number; poule: string | null }> {
  const schedule = bergerRoundRobin(teams.length)
  const matches: Array<{ teamA: T; teamB: T; tour: number; poule: string | null }> = []

  for (const round of schedule) {
    for (const [a, b] of round.pairs) {
      matches.push({
        teamA: teams[a],
        teamB: teams[b],
        tour: round.tour,
        poule
      })
    }
  }

  return matches
}

/**
 * Mêlée tournante en TÊTE-À-TÊTE : sélectionne les matchs d'UNE seule ronde de Berger.
 *
 * En tête-à-tête, chaque joueur est une équipe de 1 STABLE (on ne fusionne jamais les
 * individus). Une « rotation » ne recompose donc pas les équipes (impossible avec 1 joueur) :
 * elle change les ADVERSAIRES. On déroule donc le tournoi à la Berger, une ronde par rotation :
 *   - ronde 1 (création)      → tour 1
 *   - rotation r (>= 2)       → tour ((r-1) % nbRondes) + 1
 * Chaque joueur affronte ainsi un nouvel adversaire à chaque rotation, sans répétition tant que
 * le round-robin complet n'est pas épuisé. Avec un nombre impair de joueurs, un joueur est exempt
 * (bye) à chaque ronde — il n'est jamais largué.
 *
 * @param teams Équipes individuelles, dans un ordre STABLE (identique entre rotations)
 * @param rotationNumber Numéro de la rotation (1 = ronde initiale, puis 2, 3, ...)
 */
export function bergerRoundForRotation<T extends TeamForDraw>(
  teams: T[],
  rotationNumber: number
): Array<{ teamA: T; teamB: T; tour: number; poule: string | null }> {
  const all = generateBergerMatches(teams, null)
  const numRounds = all.reduce((mx, m) => Math.max(mx, m.tour), 0)
  const targetTour = numRounds > 0 ? ((rotationNumber - 1) % numRounds) + 1 : 1
  return all.filter(m => m.tour === targetTour)
}

/**
 * Anti-rematch pour la mêlée tournante
 *
 * Construit un historique des coéquipiers et adversaires de chaque joueur,
 * puis utilise un algorithme glouton avec pénalités pour minimiser les répétitions.
 *
 * @param players Liste des joueurs à redistribuer
 * @param previousTeams Équipes des rotations précédentes (avec joueur_ids)
 * @param previousMatches Matchs des rotations précédentes (avec equipe_a/b joueur_ids)
 * @param teamSize Taille d'équipe (2 ou 3)
 * @param previousExempt IDs des joueurs déjà mis au repos aux rondes précédentes
 *   (avec répétition possible), pour faire tourner l'exempt équitablement
 * @returns `{ teams, exempt }` — les compositions optimisées et les IDs des joueurs
 *   au repos cette ronde (effectif non divisible par teamSize). Personne n'est exclu
 *   en silence : tout joueur absent des `teams` figure dans `exempt`.
 */
export function antiRematchTeamFormation(
  players: Array<{ id: string; gender?: 'H' | 'F' }>,
  previousTeams: Array<{ joueur_ids: string[] }>,
  previousMatches: Array<{ equipe_a_joueur_ids: string[]; equipe_b_joueur_ids: string[] }>,
  teamSize: 2 | 3,
  previousExempt: string[] = [],
  mixite: boolean = false
): { teams: Array<{ joueur_ids: string[] }>; exempt: string[] } {
  // Genre normalisé (tout ce qui n'est pas 'F' compte comme 'H'), pour la
  // contrainte de mixité optionnelle. Une équipe est « mixte » si elle contient
  // au moins un 'H' et un 'F'.
  const genderById = new Map<string, 'H' | 'F'>()
  for (const p of players) {
    genderById.set(p.id, p.gender === 'F' ? 'F' : 'H')
  }
  const isTeamMixed = (ids: string[]): boolean => {
    let hasH = false, hasF = false
    for (const id of ids) {
      if (genderById.get(id) === 'F') hasF = true
      else hasH = true
    }
    return hasH && hasF
  }

  // Construire la matrice de pénalité
  // Pénalité coéquipier = 3, adversaire = 1
  const penalty = new Map<string, Map<string, number>>()

  for (const p of players) {
    penalty.set(p.id, new Map())
  }

  // Pénalités coéquipiers (on ne veut pas re-jouer AVEC les mêmes)
  for (const team of previousTeams) {
    for (let i = 0; i < team.joueur_ids.length; i++) {
      for (let j = i + 1; j < team.joueur_ids.length; j++) {
        const a = team.joueur_ids[i]
        const b = team.joueur_ids[j]
        if (penalty.has(a) && penalty.has(b)) {
          penalty.get(a)!.set(b, (penalty.get(a)!.get(b) || 0) + 3)
          penalty.get(b)!.set(a, (penalty.get(b)!.get(a) || 0) + 3)
        }
      }
    }
  }

  // Pénalités adversaires (on ne veut pas re-jouer CONTRE les mêmes)
  for (const match of previousMatches) {
    for (const aId of match.equipe_a_joueur_ids) {
      for (const bId of match.equipe_b_joueur_ids) {
        if (penalty.has(aId) && penalty.has(bId)) {
          penalty.get(aId)!.set(bId, (penalty.get(aId)!.get(bId) || 0) + 1)
          penalty.get(bId)!.set(aId, (penalty.get(bId)!.get(aId) || 0) + 1)
        }
      }
    }
  }

  // Équité : déterminer les exemptés (joueurs au repos) de cette ronde.
  // Quand l'effectif n'est pas divisible par teamSize, r = players.length % teamSize
  // joueurs se reposent. On choisit ceux qui ont été exemptés le MOINS souvent jusqu'ici
  // (égalités départagées au hasard via le mélange) → l'exempt TOURNE, personne n'est
  // exclu en silence. Les autres jouent et forment un effectif divisible par teamSize.
  const exemptCount = new Map<string, number>()
  for (const id of previousExempt) {
    exemptCount.set(id, (exemptCount.get(id) || 0) + 1)
  }

  const shuffled = fisherYatesShuffle(players)
  const remainder = players.length % teamSize
  // Tri stable : les moins exemptés d'abord ; les égalités gardent l'ordre (aléatoire) du mélange.
  const byFewestExempt = [...shuffled].sort(
    (a, b) => (exemptCount.get(a.id) || 0) - (exemptCount.get(b.id) || 0)
  )
  const exempt = byFewestExempt.slice(0, remainder).map(p => p.id)
  const exemptSet = new Set(exempt)

  // Algorithme glouton : former les équipes en minimisant les pénalités
  const available = new Set(shuffled.filter(p => !exemptSet.has(p.id)).map(p => p.id))
  const result: Array<{ joueur_ids: string[] }> = []

  // Calculer le score de pénalité d'une équipe
  function teamPenalty(ids: string[]): number {
    let total = 0
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        total += penalty.get(ids[i])?.get(ids[j]) || 0
      }
    }
    return total
  }

  while (available.size >= teamSize) {
    // Prendre le premier joueur disponible
    const first = [...available][0]
    available.delete(first)

    // Trouver les meilleurs coéquipiers (moindre pénalité)
    const candidates = [...available]

    if (teamSize === 2) {
      // Si mixité demandée, ne considérer QUE les partenaires de genre opposé
      // (équipe mixte). S'il n'en reste aucun, on retombe sur tous les candidats
      // (mieux vaut une équipe non mixte que d'exclure un joueur).
      let pool = candidates
      if (mixite) {
        const mixedPool = candidates.filter(c => isTeamMixed([first, c]))
        if (mixedPool.length > 0) pool = mixedPool
      }

      let bestPartner = pool[0]
      let bestScore = Infinity
      for (const c of pool) {
        const score = teamPenalty([first, c])
        if (score < bestScore) {
          bestScore = score
          bestPartner = c
        }
      }

      available.delete(bestPartner)
      result.push({ joueur_ids: [first, bestPartner] })
    } else {
      // Triplette : classer les paires par qualité de mixité puis par pénalité.
      //   rang 2 = équipe mixte dont la MAJORITÉ (2 joueurs) est du genre encore le
      //            plus abondant dans le vivier → consomme le genre en surplus et
      //            garde le vivier équilibré (évite qu'une équipe finale soit 3H/3F).
      //   rang 1 = équipe mixte (mais majorité du genre plus rare)
      //   rang 0 = équipe non mixte
      // Sans mixité, tout est rang 0 → on retombe sur la moindre pénalité.
      //
      // FIX : auparavant on préférait toujours « 1 joueur du genre minoritaire GLOBAL ».
      // Quand H = F (vivier équilibré), ça faisait des équipes 2H+1F en série →
      // épuisement des hommes → dernière équipe 3F (non mixte). L'équilibre est
      // désormais recalculé À CHAQUE équipe sur le vivier restant.
      let ph = 0
      let pf = 0
      for (const id of [first, ...candidates]) {
        if (genderById.get(id) === 'F') pf++
        else ph++
      }
      const preferMajority: 'H' | 'F' = ph >= pf ? 'H' : 'F'
      const teamMajority = (ids: string[]): 'H' | 'F' => {
        let h = 0
        let f = 0
        for (const id of ids) genderById.get(id) === 'F' ? f++ : h++
        return h >= f ? 'H' : 'F'
      }

      let bestPair = [candidates[0], candidates[1]]
      let bestScore = Infinity
      let bestRank = -1

      for (let i = 0; i < candidates.length; i++) {
        for (let j = i + 1; j < candidates.length; j++) {
          const team = [first, candidates[i], candidates[j]]
          const score = teamPenalty(team)
          let rank = 0
          if (mixite && isTeamMixed(team)) rank = teamMajority(team) === preferMajority ? 2 : 1
          const better = rank > bestRank || (rank === bestRank && score < bestScore)
          if (better) {
            bestRank = rank
            bestScore = score
            bestPair = [candidates[i], candidates[j]]
          }
        }
      }

      available.delete(bestPair[0])
      available.delete(bestPair[1])
      result.push({ joueur_ids: [first, bestPair[0], bestPair[1]] })
    }
  }

  return { teams: result, exempt }
}

/**
 * Assignation intelligente des terrains
 *
 * Distribue les matchs sur les terrains de manière à :
 * 1. Répartir équitablement le nombre de matchs par terrain
 * 2. Éviter qu'une même équipe joue sur le même terrain consécutivement
 * 3. Respecter les terrains déjà occupés (matchs en_cours)
 */
export function smartTerrainAssignment(
  matches: Array<{ id: string; equipe_a_id: string; equipe_b_id: string | null; tour: number }>,
  totalTerrains: number,
  occupiedTerrains: number[] = []
): Map<string, number> {
  const assignment = new Map<string, number>()

  // Compteur d'utilisation par terrain
  const terrainUsage: number[] = new Array(totalTerrains).fill(0)

  // Dernière assignation par équipe (pour éviter le même terrain)
  const lastTerrainByTeam = new Map<string, number>()

  // Trier matchs par tour
  const sorted = [...matches].sort((a, b) => a.tour - b.tour)

  for (const match of sorted) {
    let bestTerrain = 1
    let bestScore = Infinity

    for (let t = 1; t <= totalTerrains; t++) {
      if (occupiedTerrains.includes(t)) continue

      let score = terrainUsage[t - 1] * 10 // Pénalité pour surutilisation

      // Pénalité si même terrain que le dernier match d'une des équipes
      if (lastTerrainByTeam.get(match.equipe_a_id) === t) score += 5
      if (match.equipe_b_id && lastTerrainByTeam.get(match.equipe_b_id) === t) score += 5

      if (score < bestScore) {
        bestScore = score
        bestTerrain = t
      }
    }

    assignment.set(match.id, bestTerrain)
    terrainUsage[bestTerrain - 1]++
    lastTerrainByTeam.set(match.equipe_a_id, bestTerrain)
    if (match.equipe_b_id) {
      lastTerrainByTeam.set(match.equipe_b_id, bestTerrain)
    }
  }

  return assignment
}

export const TirageService = {
  fisherYatesShuffle,
  snakeDraftDistribution,
  calculateBalancedPoolSizes,
  bergerRoundRobin,
  generateBergerMatches,
  bergerRoundForRotation,
  antiRematchTeamFormation,
  smartTerrainAssignment
}
