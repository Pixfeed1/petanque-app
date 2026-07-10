import { describe, it, expect } from 'vitest'
import { generateDoubleElimination, seedOrder, type DEMatch } from '../doubleElimination.service'

// Sentinelle "bye" : se propage comme une équipe fantôme.
const BYE = Symbol('BYE')
type Team = number | typeof BYE

/**
 * Simule un tournoi complet en double élimination.
 * picker : choisit le gagnant entre deux vraies équipes (par défaut, le meilleur seed).
 * Retourne le champion + le nb de défaites RÉELLES par équipe + le journal des matchs réels.
 */
function simulate(nbTeams: number, picker: (a: number, b: number) => number = (a, b) => Math.min(a, b)) {
  const bracket = generateDoubleElimination(nbTeams)
  const byId = new Map<string, DEMatch>(bracket.matches.map((m) => [m.id, m]))
  const slots = new Map<string, { A?: Team; B?: Team }>()
  bracket.matches.forEach((m) => slots.set(m.id, {}))

  // Placement WB-R1 selon le seeding (seeds > nbTeams = BYE)
  const order = seedOrder(bracket.bracketSize) // ex [1,8,4,5,2,7,3,6]
  const wb1 = bracket.bracketSize / 2
  for (let i = 0; i < wb1; i++) {
    const seedA = order[i * 2]
    const seedB = order[i * 2 + 1]
    slots.get(`W1-${i}`)!.A = seedA <= nbTeams ? seedA : BYE
    slots.get(`W1-${i}`)!.B = seedB <= nbTeams ? seedB : BYE
  }

  const losses = new Map<number, number>()
  for (let t = 1; t <= nbTeams; t++) losses.set(t, 0)
  const realMatches: Array<[number, number, number]> = [] // [a, b, winner]
  const winnerOf = new Map<string, Team>()

  const put = (ref: { matchId: string; slot: 'A' | 'B' } | null, team: Team) => {
    if (!ref) return team // null = sortie (champion)
    const s = slots.get(ref.matchId)!
    s[ref.slot] = team
    return undefined
  }

  // Ordre topologique : WB rounds, puis on traite par vagues jusqu'à stabilité.
  const resolved = new Set<string>()
  let champion: Team | undefined
  let guard = 0
  while (resolved.size < bracket.matches.length && guard++ < 10000) {
    for (const m of bracket.matches) {
      if (resolved.has(m.id)) continue

      // GF2 (bracket reset) : pas de routage statique, résolu à partir de la GF.
      if (m.id === 'GF2') {
        if (!resolved.has('GF')) continue
        const gfSlots = slots.get('GF')!
        const wbChamp = gfSlots.A as Team // champion WB (placé en GF.A)
        const gfWinner = winnerOf.get('GF')!
        resolved.add('GF2')
        if (gfWinner === wbChamp) {
          champion = gfWinner // pas de reset
        } else {
          // reset joué : champion WB vs vainqueur GF (champion LB)
          const w = picker(wbChamp as number, gfWinner as number)
          champion = w
          const loser = w === wbChamp ? gfWinner : wbChamp
          losses.set(loser as number, (losses.get(loser as number) || 0) + 1)
          realMatches.push([wbChamp as number, gfWinner as number, w as number])
          winnerOf.set('GF2', w)
        }
        continue
      }

      const s = slots.get(m.id)!
      if (s.A === undefined || s.B === undefined) continue // pas prêt
      resolved.add(m.id)

      const a = s.A
      const b = s.B
      let winner: Team
      let loser: Team
      if (a === BYE && b === BYE) { winner = BYE; loser = BYE }
      else if (a === BYE) { winner = b; loser = BYE }
      else if (b === BYE) { winner = a; loser = BYE }
      else {
        const w = picker(a as number, b as number)
        winner = w
        loser = w === a ? b : a
        losses.set(loser as number, (losses.get(loser as number) || 0) + 1)
        realMatches.push([a as number, b as number, w])
      }

      winnerOf.set(m.id, winner)
      const champ = put(m.winnerTo, winner)
      if (m.id === 'GF') champion = winner
      else void champ
      put(m.loserTo, loser)
    }
  }

  return { bracket, champion, losses, realMatches, resolvedCount: resolved.size }
}

describe('Double élimination — structure', () => {
  for (const [n, B, W, L] of [
    [4, 4, 2, 2],
    [8, 8, 3, 4],
    [16, 16, 4, 6],
  ] as const) {
    it(`${n} équipes : ${W} rounds WB, ${L} rounds LB, ${2 * B - 1} matchs`, () => {
      const br = generateDoubleElimination(n)
      expect(br.bracketSize).toBe(B)
      expect(br.wbRounds).toBe(W)
      expect(br.lbRounds).toBe(L)
      // total slots = 2B-1 (WB:B-1, LB:B-2, GF+GF2:2)
      expect(br.matches.length).toBe(2 * B - 1)
      expect(br.matches.filter((m) => m.bracket === 'W').length).toBe(B - 1)
      expect(br.matches.filter((m) => m.bracket === 'L').length).toBe(B - 2)
      expect(br.matches.filter((m) => m.bracket === 'GF').length).toBe(2)
    })
  }
})

describe('Double élimination — routage valide (toutes les cibles existent)', () => {
  for (const n of [4, 8, 16]) {
    it(`${n} équipes : tous les winnerTo/loserTo pointent vers un match existant`, () => {
      const br = generateDoubleElimination(n)
      const ids = new Set(br.matches.map((m) => m.id))
      for (const m of br.matches) {
        if (m.winnerTo) expect(ids.has(m.winnerTo.matchId), `${m.id}.winnerTo`).toBe(true)
        if (m.loserTo) expect(ids.has(m.loserTo.matchId), `${m.id}.loserTo`).toBe(true)
      }
      // chaque match WB sauf la GF a un loserTo ; la finale WB aussi (vers LB final)
      for (const m of br.matches.filter((x) => x.bracket === 'W')) {
        expect(m.loserTo, `${m.id} doit avoir un loserTo`).not.toBeNull()
      }
    })
  }
})

describe('Double élimination — simulation complète (le seed gagne)', () => {
  for (const n of [4, 8, 16]) {
    it(`${n} équipes : 1 champion (≤1 défaite), tous les autres éliminés à 2 défaites`, () => {
      const { champion, losses, resolvedCount, bracket } = simulate(n)
      expect(resolvedCount).toBe(bracket.matches.length) // tout s'est résolu
      expect(champion).toBe(1) // seed 1 gagne tout
      expect(losses.get(1)).toBeLessThanOrEqual(1)
      for (let t = 2; t <= n; t++) {
        expect(losses.get(t), `équipe ${t}`).toBe(2)
      }
    })
  }
})

describe('Double élimination — byes (effectif non puissance de 2)', () => {
  for (const n of [6, 12, 5, 7]) {
    it(`${n} équipes : se résout, 1 champion, personne avec >2 défaites`, () => {
      const { champion, losses, resolvedCount, bracket } = simulate(n)
      expect(resolvedCount).toBe(bracket.matches.length)
      expect(typeof champion).toBe('number')
      // chaque équipe non-championne finit avec exactement 2 défaites réelles
      let withTwo = 0
      for (let t = 1; t <= n; t++) {
        expect(losses.get(t)!, `équipe ${t}`).toBeLessThanOrEqual(2)
        if (losses.get(t) === 2) withTwo++
      }
      expect(withTwo).toBe(n - 1) // tout le monde sauf le champion
    })
  }
})

import { toPersistenceRows, parseDeType } from '../doubleElimination.service'

// Compte les rematchs LB : deux équipes qui se sont déjà affrontées et
// se retrouvent dans un match du losers bracket.
function countLbRematches(nbTeams: number, picker: (a: number, b: number) => number) {
  const br = generateDoubleElimination(nbTeams)
  const slots = new Map<string, { A?: Team; B?: Team }>(br.matches.map((m) => [m.id, {}]))
  const order = seedOrder(br.bracketSize)
  for (let i = 0; i < br.bracketSize / 2; i++) {
    const sa = order[i * 2], sb = order[i * 2 + 1]
    slots.get(`W1-${i}`)!.A = sa <= nbTeams ? sa : BYE
    slots.get(`W1-${i}`)!.B = sb <= nbTeams ? sb : BYE
  }
  const met = new Set<string>()
  const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`)
  const put = (ref: { matchId: string; slot: 'A' | 'B' } | null, t: Team) => { if (ref) slots.get(ref.matchId)![ref.slot] = t }
  const resolved = new Set<string>()
  let guard = 0, lb = 0, rematch = 0
  while (resolved.size < br.matches.length && guard++ < 10000) {
    for (const m of br.matches) {
      if (resolved.has(m.id)) continue
      const s = slots.get(m.id)!
      if (s.A === undefined || s.B === undefined) continue
      resolved.add(m.id)
      const a = s.A, b = s.B
      let w: Team, l: Team
      if (a === BYE && b === BYE) { w = BYE; l = BYE }
      else if (a === BYE) { w = b; l = BYE }
      else if (b === BYE) { w = a; l = BYE }
      else {
        if (m.bracket === 'L') { lb++; if (met.has(key(a as number, b as number))) rematch++ }
        met.add(key(a as number, b as number))
        w = picker(a as number, b as number); l = w === a ? b : a
      }
      put(m.winnerTo, w); put(m.loserTo, l)
    }
  }
  return { lb, rematch }
}

describe('Double élimination — évitement des rematchs dans le LB', () => {
  for (const n of [8, 16, 32]) {
    it(`${n} équipes : ≤1 rematch LB (seul le finale LB peut l'être, structurellement)`, () => {
      const seedWins = countLbRematches(n, (a, b) => Math.min(a, b))
      const upset = countLbRematches(n, (a, b) => Math.max(a, b))
      // Zéro rematch précoce ; le seul toléré est la finale LB (le finaliste
      // perdants peut y retomber sur une équipe déjà battue — inévitable).
      expect(seedWins.rematch, `seed-wins n=${n}`).toBeLessThanOrEqual(1)
      expect(upset.rematch, `upset n=${n}`).toBeLessThanOrEqual(1)
    })
  }
  it('taux de rematch faible sur 20 tirages variés (n=8)', () => {
    let total = 0
    for (let s = 1; s <= 20; s++) total += countLbRematches(8, (a, b) => ((a * 7 + b * 13 + s * 17) % 2 ? a : b)).rematch
    expect(total).toBeLessThanOrEqual(20) // ≤ 1 par tournoi en moyenne
  })
})

describe('Double élimination — encodage persistance (type/tour)', () => {
  it('8 équipes : 15 lignes (GF + GF2), types "de:*" uniques, GF2 en dernier', () => {
    const rows = toPersistenceRows(8)
    expect(rows.length).toBe(15)
    expect(new Set(rows.map((r) => r.type)).size).toBe(15) // tous uniques
    expect(rows.every((r) => parseDeType(r.type) === r.matchId)).toBe(true) // round-trip
    const gf2 = rows.find((r) => r.matchId === 'GF2')!
    expect(gf2.tour).toBe(Math.max(...rows.map((r) => r.tour))) // GF2 (reset) jouée en dernier
    const gf = rows.find((r) => r.matchId === 'GF')!
    expect(gf.tour).toBeLessThan(gf2.tour)
    expect(parseDeType('classique')).toBeNull() // n'interfère pas avec l'élim simple
  })
})

import { computeBracketState, generateDoubleElimination as genDE } from '../doubleElimination.service'

// Pilote le réducteur comme l'API : joue les matchs "a_jouer", enregistre le
// résultat (le meilleur seed gagne), recalcule, jusqu'à ce que tout soit terminé.
function driveToCompletion(nbTeams: number) {
  const teams = Array.from({ length: nbTeams }, (_, i) => `T${i + 1}`) // seed i+1 -> "T{i+1}"
  const results = new Map<string, string>()
  let guard = 0
  let state = computeBracketState(nbTeams, teams, results)
  while (state.some((m) => m.status === 'a_jouer') && guard++ < 1000) {
    for (const m of state) {
      if (m.status !== 'a_jouer') continue
      // meilleur seed = numéro le plus petit (T3 bat T5)
      const sa = parseInt(m.equipeAId!.slice(1))
      const sb = parseInt(m.equipeBId!.slice(1))
      results.set(m.matchId, sa < sb ? m.equipeAId! : m.equipeBId!)
    }
    state = computeBracketState(nbTeams, teams, results)
  }
  return state
}

describe('Double élimination — réducteur computeBracketState (flux API)', () => {
  for (const n of [8, 16, 5, 6, 7, 11, 3]) {
    it(`${n} équipes : se joue jusqu'au bout, 1 champion, byes propagés`, () => {
      const state = driveToCompletion(n)
      // tout est terminé
      expect(state.every((m) => m.status === 'termine')).toBe(true)
      // le champion = vainqueur de la GF = meilleur seed (T1)
      const gf = state.find((m) => m.matchId === 'GF')!
      expect(gf.winnerId).toBe('T1')
      // aucune incohérence : un match terminé non-bye a deux équipes
      for (const m of state) {
        if (m.status === 'termine' && !m.isBye) {
          expect(m.equipeAId, `${m.matchId}.A`).not.toBeNull()
          expect(m.equipeBId, `${m.matchId}.B`).not.toBeNull()
        }
      }
    })
  }

  it('état initial (results vide) : 1er tour jouable, le reste en attente', () => {
    const teams = Array.from({ length: 8 }, (_, i) => i + 1)
    const init = computeBracketState(8, teams)
    const wb1 = init.filter((m) => m.matchId.startsWith('W1-'))
    expect(wb1.every((m) => m.status === 'a_jouer')).toBe(true)
    expect(init.find((m) => m.matchId === 'GF')!.status).toBe('en_attente')
  })

  it('byes pré-résolus à l\'init : un match WB-R1 avec un seul présent est terminé', () => {
    const teams = Array.from({ length: 6 }, (_, i) => i + 1) // 6 équipes -> 2 byes
    const init = computeBracketState(6, teams)
    const byes = init.filter((m) => m.isBye && m.bracket === 'W')
    expect(byes.length).toBeGreaterThan(0)
    expect(byes.every((m) => m.status === 'termine' && m.winnerId !== null)).toBe(true)
  })

  it('garde-fou : < 3 équipes refusé', () => {
    expect(() => genDE(2)).toThrow()
  })
})

describe('Double élimination — bracket reset (GF2)', () => {
  it('champion WB gagne la GF : GF2 no-op (pas de 2e finale)', () => {
    // 4 équipes, meilleur seed gagne tout → le champion WB (T1) gagne la GF.
    const state = driveToCompletion(4)
    const gf2 = state.find((m) => m.matchId === 'GF2')!
    expect(gf2.isBye).toBe(true) // résolu à vide
    expect(gf2.equipeAId).toBeNull()
    expect(gf2.equipeBId).toBeNull()
  })

  it('upset en GF : le champion LB gagne → GF2 opposant les deux finalistes', () => {
    // 4 équipes. On force un upset : en GF, l'équipe B (champion LB) gagne.
    const teams = ['T1', 'T2', 'T3', 'T4']
    const results = new Map<string, string>()
    let state = computeBracketState(4, teams, results)
    let guard = 0
    // Phase 1 : jouer tout SAUF la GF (meilleur seed gagne)
    while (guard++ < 100) {
      const playable = state.filter((m) => m.status === 'a_jouer' && m.matchId !== 'GF')
      if (playable.length === 0) break
      for (const m of playable) {
        const sa = parseInt(m.equipeAId!.slice(1))
        const sb = parseInt(m.equipeBId!.slice(1))
        results.set(m.matchId, sa < sb ? m.equipeAId! : m.equipeBId!)
      }
      state = computeBracketState(4, teams, results)
    }
    const gf = state.find((m) => m.matchId === 'GF')!
    expect(gf.status).toBe('a_jouer')
    // La GF oppose le champion WB (A) au champion LB (B). On fait gagner B (upset).
    const wbChamp = gf.equipeAId!
    const lbChamp = gf.equipeBId!
    results.set('GF', lbChamp)
    state = computeBracketState(4, teams, results)

    // GF2 doit être activée avec les deux finalistes
    const gf2 = state.find((m) => m.matchId === 'GF2')!
    expect(gf2.isBye).toBe(false)
    expect(new Set([gf2.equipeAId, gf2.equipeBId])).toEqual(new Set([wbChamp, lbChamp]))
    expect(gf2.status).toBe('a_jouer')

    // On joue la GF2 : le champion WB prend sa revanche → champion final
    results.set('GF2', wbChamp)
    state = computeBracketState(4, teams, results)
    const gf2Final = state.find((m) => m.matchId === 'GF2')!
    expect(gf2Final.status).toBe('termine')
    expect(gf2Final.winnerId).toBe(wbChamp)
  })
})
