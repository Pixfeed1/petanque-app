/**
 * Générateur de bracket à double élimination (fonction pure)
 *
 * Objectif : structure WB + LB + grande finale, routage gagnant/perdant, byes.
 * Aucune dépendance DB/UI.
 *
 * Modèle : on génère TOUS les "slots" de match à l'avance, chacun avec un
 * routage `winnerTo` / `loserTo`. On propage ensuite les équipes au fur et à
 * mesure des résultats (comme un moteur de bracket challonge-style).
 */

export type DEBracketKind = 'W' | 'L' | 'GF'

export interface SlotRef {
  matchId: string
  slot: 'A' | 'B'
}

export interface DEMatch {
  id: string
  bracket: DEBracketKind
  round: number // 1-based, au sein de son bracket
  index: number // 0-based, position dans le round
  winnerTo: SlotRef | null // null = champion (gagnant de la GF)
  loserTo: SlotRef | null // null = éliminé
}

export interface DEBracket {
  bracketSize: number // puissance de 2 >= nbTeams
  nbTeams: number
  wbRounds: number
  lbRounds: number
  matches: DEMatch[]
}

const nextPow2 = (n: number) => (n <= 1 ? 1 : 2 ** Math.ceil(Math.log2(n)))
const log2 = (n: number) => Math.round(Math.log2(n))

/** Seeding standard d'un bracket (1,8,4,5,2,7,3,6 pour 8). */
export function seedOrder(bracketSize: number): number[] {
  if (bracketSize === 1) return [1]
  const half = seedOrder(bracketSize / 2)
  const out: number[] = []
  for (const p of half) {
    out.push(p)
    out.push(bracketSize + 1 - p)
  }
  return out
}

const wbId = (r: number, i: number) => `W${r}-${i}`
const lbId = (r: number, i: number) => `L${r}-${i}`
const GF = 'GF'
const GF2 = 'GF2'

/** Nombre de matchs d'un round WB. */
const wbRoundSize = (B: number, r: number) => B / 2 ** r
/** Nombre de matchs d'un round LB (m 1-based). i = ceil(m/2). */
const lbRoundSize = (B: number, m: number) => {
  const i = Math.ceil(m / 2)
  return B / 2 ** (i + 1)
}

/**
 * Génère toute la structure double-élim pour nbTeams équipes.
 * Ne place PAS encore les équipes — uniquement les slots + le routage.
 */
export interface DEScheme {
  wb1Reverse: boolean // inverse l'ordre des perdants WB-R1 dans le LB-R1
  dropReverseParity: 0 | 1 // pour WB round r>=2 : inverse si (r % 2 === parité)
}

const DEFAULT_SCHEME: DEScheme = { wb1Reverse: false, dropReverseParity: 0 }

export function generateDoubleElimination(
  nbTeams: number,
  scheme: DEScheme = DEFAULT_SCHEME
): DEBracket {
  if (nbTeams < 2) throw new Error('Double élimination : au moins 2 équipes')
  const B = nextPow2(nbTeams)
  if (B < 4) throw new Error('Double élimination : au moins 3 équipes (sinon pas de repêchage)')
  const W = log2(B) // nb de rounds WB
  const L = 2 * (W - 1) // nb de rounds LB
  const matches: DEMatch[] = []

  // ---- Winners bracket ----
  for (let r = 1; r <= W; r++) {
    const n = wbRoundSize(B, r)
    for (let i = 0; i < n; i++) {
      let winnerTo: SlotRef | null
      if (r < W) winnerTo = { matchId: wbId(r + 1, i >> 1), slot: i % 2 === 0 ? 'A' : 'B' }
      else winnerTo = { matchId: GF, slot: 'A' } // champion WB -> GF.A

      // loserTo : calculé plus bas (dépend du LB), placeholder pour l'instant
      matches.push({ id: wbId(r, i), bracket: 'W', round: r, index: i, winnerTo, loserTo: null })
    }
  }

  // ---- Losers bracket ----
  for (let m = 1; m <= L; m++) {
    const n = lbRoundSize(B, m)
    for (let i = 0; i < n; i++) {
      let winnerTo: SlotRef | null
      if (m < L) {
        // gagnant LB -> round LB suivant
        const nextN = lbRoundSize(B, m + 1)
        if (m % 2 === 1) {
          // round mineur -> round majeur (même i), slot B (le WB-dropdown prend A)
          winnerTo = { matchId: lbId(m + 1, i), slot: 'B' }
        } else {
          // round majeur -> round mineur suivant : 2 gagnants fusionnent
          winnerTo = { matchId: lbId(m + 1, Math.floor(i / 2)), slot: i % 2 === 0 ? 'A' : 'B' }
        }
        void nextN
      } else {
        winnerTo = { matchId: GF, slot: 'B' } // champion LB -> GF.B
      }
      // perdant LB toujours éliminé
      matches.push({ id: lbId(m, i), bracket: 'L', round: m, index: i, winnerTo, loserTo: null })
    }
  }

  // ---- Grande finale ----
  matches.push({ id: GF, bracket: 'GF', round: 1, index: 0, winnerTo: null, loserTo: null })

  // ---- Grande finale "reset" (bracket reset) ----
  // Le champion du WB arrive invaincu en GF ; s'il PERD la GF (le champion du LB
  // gagne), il n'a qu'une seule défaite → une 2e finale décisive est jouée (GF2).
  // GF2 n'a pas de routage statique (winnerTo/loserTo null) : sa condition
  // d'activation est gérée dans computeBracketState (elle dépend du résultat de GF).
  matches.push({ id: GF2, bracket: 'GF', round: 2, index: 0, winnerTo: null, loserTo: null })

  // ---- Routage des PERDANTS du WB vers le LB ----
  const byId = new Map(matches.map((mm) => [mm.id, mm]))

  // WB-R1 losers -> LB-R1 (mineur). 2 perdants consécutifs -> 1 match LB.
  // Reversal léger pour limiter les rematchs : on inverse l'ordre des matchs LB cibles.
  {
    const wb1 = wbRoundSize(B, 1)
    const lb1 = lbRoundSize(B, 1)
    for (let i = 0; i < wb1; i++) {
      const base = Math.floor(i / 2)
      const target = scheme.wb1Reverse ? lb1 - 1 - base : base
      const slot: 'A' | 'B' = i % 2 === 0 ? 'A' : 'B'
      byId.get(wbId(1, i))!.loserTo = { matchId: lbId(1, target), slot }
    }
  }

  // WB-Rr (r>=2) losers -> LB major round m = 2*(r-1), slot A (mineur-winner prend B).
  // Reversal de l'ordre des perdants pour casser les rematchs.
  for (let r = 2; r <= W; r++) {
    const m = 2 * (r - 1)
    const cnt = wbRoundSize(B, r) // = lbRoundSize(B, m)
    const reverse = r % 2 === scheme.dropReverseParity
    for (let i = 0; i < cnt; i++) {
      const target = reverse ? cnt - 1 - i : i
      byId.get(wbId(r, i))!.loserTo = { matchId: lbId(m, target), slot: 'A' }
    }
  }

  return { bracketSize: B, nbTeams, wbRounds: W, lbRounds: L, matches }
}

/* --------------------------------------------------------------------------
 * Intégration persistance : on encode l'identité du slot dans `type`
 * (ex. "de:W1-0", "de:L2-1", "de:GF") → aucune nouvelle colonne nécessaire,
 * le routage se re-dérive depuis generateDoubleElimination(nbTeams).
 * ------------------------------------------------------------------------ */

export interface DEPersistRow {
  matchId: string // identité stable du slot (= clé de re-dérivation)
  type: string // valeur stockée dans matches.type : "de:<matchId>"
  tour: number // ordre d'affichage / de jeu (global, 1-based)
  bracket: DEBracketKind
  round: number
}

/** Ordre de jeu global : WB round r, puis LB rounds intercalés, GF en dernier. */
function globalTour(m: DEMatch, wbRounds: number): number {
  if (m.bracket === 'W') return m.round // 1..W
  if (m.bracket === 'L') return wbRounds + m.round // W+1 ..
  return wbRounds + 2 * (wbRounds - 1) + m.round // GF (round 1) puis GF2 (round 2) en dernier
}

/** Transforme la structure en lignes prêtes à insérer dans `matches`. */
export function toPersistenceRows(nbTeams: number): DEPersistRow[] {
  const br = generateDoubleElimination(nbTeams)
  return br.matches
    .map((m) => ({
      matchId: m.id,
      type: `de:${m.id}`,
      tour: globalTour(m, br.wbRounds),
      bracket: m.bracket,
      round: m.round,
    }))
    .sort((a, b) => a.tour - b.tour || a.matchId.localeCompare(b.matchId))
}

/** Lit l'identité du slot depuis matches.type ("de:W1-0" → "W1-0"). */
export function parseDeType(type: string | null): string | null {
  if (!type || !type.startsWith('de:')) return null
  return type.slice(3)
}

/* --------------------------------------------------------------------------
 * RÉDUCTEUR D'ÉTAT — source de vérité unique pour l'intégration.
 *
 * computeBracketState(nbTeams, équipesParSeed, résultats) recalcule l'état
 * complet du bracket : placement des équipes, PROPAGATION DES BYES, et statut
 * de chaque match. Déterministe et pur.
 *   - Étape B (génération)  : appeler avec results vide → état initial à insérer.
 *   - Étape C (complétion)  : ajouter le résultat, rappeler → différentiel à
 *     persister (les byes en cascade sont gérés ici, pas dans l'API).
 * ------------------------------------------------------------------------ */

export interface DEMatchState<T> {
  matchId: string
  type: string
  tour: number
  bracket: DEBracketKind
  round: number
  equipeAId: T | null
  equipeBId: T | null
  winnerId: T | null
  status: 'a_jouer' | 'en_attente' | 'termine'
  isBye: boolean
}

const DE_BYE: unique symbol = Symbol('DE_BYE')

export function computeBracketState<T>(
  nbTeams: number,
  teamIdsBySeed: T[],
  results: Map<string, T> = new Map()
): DEMatchState<T>[] {
  if (teamIdsBySeed.length !== nbTeams) {
    throw new Error('computeBracketState : teamIdsBySeed.length doit valoir nbTeams')
  }
  const br = generateDoubleElimination(nbTeams)
  type Cell = T | typeof DE_BYE | undefined
  const A = new Map<string, Cell>()
  const Bm = new Map<string, Cell>()
  br.matches.forEach((m) => { A.set(m.id, undefined); Bm.set(m.id, undefined) })

  const order = seedOrder(br.bracketSize)
  for (let i = 0; i < br.bracketSize / 2; i++) {
    const sa = order[2 * i], sb = order[2 * i + 1]
    A.set(`W1-${i}`, sa <= nbTeams ? teamIdsBySeed[sa - 1] : DE_BYE)
    Bm.set(`W1-${i}`, sb <= nbTeams ? teamIdsBySeed[sb - 1] : DE_BYE)
  }

  const byId = new Map(br.matches.map((m) => [m.id, m]))
  const winner = new Map<string, T | typeof DE_BYE | null>()
  const isBye = new Map<string, boolean>()
  br.matches.forEach((m) => { winner.set(m.id, null); isBye.set(m.id, false) })
  const setCell = (ref: SlotRef | null, v: T | typeof DE_BYE) => {
    if (!ref) return
    if (ref.slot === 'A') A.set(ref.matchId, v)
    else Bm.set(ref.matchId, v)
  }

  // Propagation : on règle les matchs réglables (bye OU résultat connu).
  const settled = new Set<string>()
  let changed = true
  while (changed) {
    changed = false
    for (const m of br.matches) {
      if (settled.has(m.id)) continue
      const a = A.get(m.id), b = Bm.get(m.id)
      if (a === undefined || b === undefined) continue
      const aB = a === DE_BYE, bB = b === DE_BYE
      let w: T | typeof DE_BYE
      let l: T | typeof DE_BYE
      if (aB || bB) {
        w = aB && bB ? DE_BYE : aB ? (b as T) : (a as T)
        l = DE_BYE
        isBye.set(m.id, true)
      } else if (results.has(m.id)) {
        w = results.get(m.id) as T
        l = w === a ? (b as T) : (a as T)
      } else {
        continue // deux vraies équipes, pas encore joué : prêt mais non réglé
      }
      settled.add(m.id)
      winner.set(m.id, w)
      changed = true
      setCell(m.winnerTo, w)
      setCell(m.loserTo, l)
    }
  }

  // ---- Bracket reset (GF2) ----
  // GF2 n'a pas de routage statique : sa condition dépend du résultat de GF.
  //  - Le champion WB (placé en GF.A) gagne la GF → pas de reset : GF2 est un
  //    no-op résolu (champion = champion WB), sans équipes.
  //  - Le champion LB (GF.B) gagne la GF → reset : GF2 oppose le champion WB au
  //    champion LB (2e finale décisive).
  if (byId.has(GF2) && settled.has(GF)) {
    const gfA = A.get(GF) // champion WB
    const gfWinner = winner.get(GF)
    if (gfA !== undefined && gfA !== DE_BYE && gfWinner != null && gfWinner !== DE_BYE) {
      if (gfWinner === gfA) {
        // Pas de reset → GF2 résolu à vide (le champion WB reste champion)
        settled.add(GF2)
        winner.set(GF2, gfA as T)
        isBye.set(GF2, true)
      } else {
        // Reset → GF2 = champion WB vs champion LB (vainqueur de GF)
        A.set(GF2, gfA)
        Bm.set(GF2, gfWinner as T)
        if (results.has(GF2)) {
          settled.add(GF2)
          winner.set(GF2, results.get(GF2) as T)
        }
      }
    }
  }

  const clean = (v: Cell): T | null => (v === undefined || v === DE_BYE ? null : (v as T))
  return br.matches
    .map((m) => {
      const a = A.get(m.id), b = Bm.get(m.id)
      const ready = a !== undefined && b !== undefined && a !== DE_BYE && b !== DE_BYE
      const w = winner.get(m.id)
      const status: DEMatchState<T>['status'] = settled.has(m.id)
        ? 'termine'
        : ready
          ? 'a_jouer'
          : 'en_attente'
      return {
        matchId: m.id,
        type: `de:${m.id}`,
        tour: globalTour(m, br.wbRounds),
        bracket: m.bracket,
        round: m.round,
        equipeAId: clean(a),
        equipeBId: clean(b),
        winnerId: w === DE_BYE || w === null || w === undefined ? null : (w as T),
        status,
        isBye: isBye.get(m.id)!,
      }
    })
    .sort((x, y) => x.tour - y.tour || x.matchId.localeCompare(y.matchId))
}
