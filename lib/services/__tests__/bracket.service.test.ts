/**
 * Tests de non-régression du bracket d'élimination — chemin COMPLET jusqu'au podium.
 *
 * Couvre le trou qui a laissé passer le bug des byes : 9 à 15 qualifiés (brackets de
 * huitièmes avec exempts). On rejoue tour par tour via `nextRoundMatchups` (la logique
 * sortie du hook) et on vérifie deux invariants forts :
 *   1. Aucun doublon d'équipe dans un tour généré.
 *   2. Si la meilleure tête de série gagne toujours, la finale oppose seed 1 à seed 2.
 *
 * Convention : le vainqueur d'un match = la meilleure tête de série (seed le plus petit),
 * encodée dans le name 'S<seed>'. Un bracket correct doit alors aboutir à S1 vs S2.
 */

import { describe, it, expect } from 'vitest'
import { generateFirstRoundPairs, getMatchWinners, nextRoundMatchups, calculateBracketMatches } from '../bracket.service'

type TM = {
  type: string; status: string
  equipe_a_id: string | null; equipe_b_id: string | null
  score_a: number | null; score_b: number | null
  equipe_a?: { id: string; name: string }; equipe_b?: { id: string; name: string }
}

const seedOf = (name: string) => parseInt(name.slice(1), 10)

function generateEliminationPhases(nbQualified: number): TM[] {
  const teams = Array.from({ length: nbQualified }, (_, i) => ({ id: `S${i + 1}`, name: `S${i + 1}` }))
  const pairs = generateFirstRoundPairs(teams)
  const firstType = pairs[0]?.round || 'finale'
  const out: TM[] = []
  for (const p of pairs) {
    if (!p.teamA) continue
    if (p.isBye) {
      out.push({ type: 'bye', status: 'termine', equipe_a_id: p.teamA.id, equipe_b_id: null, score_a: 0, score_b: 0, equipe_a: p.teamA })
    } else if (p.teamB) {
      out.push({ type: firstType, status: 'a_jouer', equipe_a_id: p.teamA.id, equipe_b_id: p.teamB.id, score_a: null, score_b: null, equipe_a: p.teamA, equipe_b: p.teamB })
    }
  }
  return out
}

// "Joue" tous les matchs à jouer : la meilleure tête de série gagne 13-7.
function playAll(matches: TM[]) {
  for (const m of matches) {
    if (m.status === 'a_jouer' && m.equipe_a && m.equipe_b) {
      const aWins = seedOf(m.equipe_a.name) < seedOf(m.equipe_b.name)
      m.score_a = aWins ? 13 : 7
      m.score_b = aWins ? 7 : 13
      m.status = 'termine'
    }
  }
}

/** Rejoue tout le tableau et renvoie les finalistes + d'éventuels doublons rencontrés. */
function runToPodium(nbQualified: number): { finalists: string[]; duplicateRound: string | null } {
  const matches = generateEliminationPhases(nbQualified)
  let duplicateRound: string | null = null

  for (let guard = 0; guard < 12; guard++) {
    playAll(matches)
    const res = nextRoundMatchups(matches as any)

    if (res.kind === 'error') break

    if (res.kind === 'finale') {
      // Reproduit generateFinales : vainqueurs de demi + vainqueur d'un éventuel
      // bye du tour courant (cas 3 qualifiés : la demi est le premier tour).
      const demis = matches.filter(m => m.type === 'demi' && m.status === 'termine')
      const w = getMatchWinners(demis.map(m => ({
        equipe_a_id: m.equipe_a_id, equipe_b_id: m.equipe_b_id,
        score_a: m.score_a ?? 0, score_b: m.score_b ?? 0,
        type: m.type, equipe_a: m.equipe_a, equipe_b: m.equipe_b,
      }))).filter((x): x is { id: string; name: string } => x !== null)
      const hasEarlierRounds = matches.some(m => m.type === 'quart' || m.type === 'huitieme')
      if (!hasEarlierRounds) {
        for (const b of matches.filter(m => m.type === 'bye' && m.status === 'termine' && m.equipe_a)) {
          w.push(b.equipe_a!)
        }
      }
      matches.push({ type: 'finale', status: 'a_jouer', equipe_a_id: w[0].id, equipe_b_id: w[1].id, score_a: null, score_b: null, equipe_a: w[0], equipe_b: w[1] })
      break
    }

    // res.kind === 'pairs' : vérifier l'absence de doublon puis créer le tour.
    const ids = res.pairs.flatMap(p => [p.a.id, p.b.id])
    if (ids.length !== new Set(ids).size) duplicateRound = res.round
    for (const p of res.pairs) {
      matches.push({ type: res.round, status: 'a_jouer', equipe_a_id: p.a.id, equipe_b_id: p.b.id, score_a: null, score_b: null, equipe_a: p.a, equipe_b: p.b })
    }
  }

  const finale = matches.find(m => m.type === 'finale')
  const finalists = finale
    ? [finale.equipe_a!.name, finale.equipe_b!.name].sort((a, b) => seedOf(a) - seedOf(b))
    : []
  return { finalists, duplicateRound }
}

describe('Bracket — progression complète jusqu\'au podium (régression byes)', () => {
  for (let n = 3; n <= 16; n++) {
    it(`${n} qualifiés : finale = seed 1 vs seed 2, sans doublon`, () => {
      const { finalists, duplicateRound } = runToPodium(n)
      expect(duplicateRound).toBeNull()
      expect(finalists).toEqual(['S1', 'S2'])
    })
  }
})

describe('Bracket — cas 3 qualifiés (régression : finale bloquée)', () => {
  it('génère 1 exempt + 1 demi, puis signale la finale', () => {
    const matches = generateEliminationPhases(3)
    expect(matches.filter(m => m.type === 'bye').length).toBe(1)
    expect(matches.filter(m => m.type === 'demi').length).toBe(1)
    playAll(matches)
    const res = nextRoundMatchups(matches as any)
    expect(res.kind).toBe('finale')
  })
})

describe('Bracket — garde au-delà de 16 qualifiés', () => {
  it('17 qualifiés : lève une erreur explicite (pas d\'exclusion silencieuse)', () => {
    expect(() => calculateBracketMatches(17)).toThrow(/max 16|Trop d'équipes/)
  })
  it('16 qualifiés : toujours accepté', () => {
    expect(() => calculateBracketMatches(16)).not.toThrow()
  })
})

describe('Bracket — cas précis du bug (huitièmes avec byes)', () => {
  it('13 qualifiés : la demi a exactement 2 matchs et 4 équipes distinctes', () => {
    // Construit huitièmes + byes, joue, avance jusqu'aux quarts, joue, avance aux demis.
    const matches = generateEliminationPhases(13)
    expect(matches.filter(m => m.type === 'bye').length).toBe(3)

    playAll(matches)
    const toQuart = nextRoundMatchups(matches as any)
    expect(toQuart.kind).toBe('pairs')
    if (toQuart.kind === 'pairs') {
      expect(toQuart.round).toBe('quart')
      expect(toQuart.pairs.length).toBe(4)
      for (const p of toQuart.pairs) matches.push({ type: 'quart', status: 'a_jouer', equipe_a_id: p.a.id, equipe_b_id: p.b.id, score_a: null, score_b: null, equipe_a: p.a, equipe_b: p.b })
    }

    playAll(matches)
    const toDemi = nextRoundMatchups(matches as any)
    expect(toDemi.kind).toBe('pairs')
    if (toDemi.kind === 'pairs') {
      expect(toDemi.round).toBe('demi')
      expect(toDemi.pairs.length).toBe(2) // ❌ valait 3+ avant le fix (byes re-comptés)
      const ids = toDemi.pairs.flatMap(p => [p.a.id, p.b.id])
      expect(new Set(ids).size).toBe(4) // 4 équipes distinctes, aucun doublon
    }
  })

  it('byes consommés une seule fois : ils ne réapparaissent pas à la transition quart→demi', () => {
    const matches = generateEliminationPhases(10) // 6 byes, 2 huitièmes réels
    playAll(matches)
    // huitième → quart
    const r1 = nextRoundMatchups(matches as any)
    if (r1.kind === 'pairs') for (const p of r1.pairs) matches.push({ type: 'quart', status: 'a_jouer', equipe_a_id: p.a.id, equipe_b_id: p.b.id, score_a: null, score_b: null, equipe_a: p.a, equipe_b: p.b })
    playAll(matches)
    // quart → demi : ne doit PAS réintégrer les 6 byes
    const r2 = nextRoundMatchups(matches as any)
    expect(r2.kind).toBe('pairs')
    if (r2.kind === 'pairs') {
      const ids = r2.pairs.flatMap(p => [p.a.id, p.b.id])
      expect(new Set(ids).size).toBe(ids.length)
      expect(r2.pairs.length).toBe(2)
    }
  })
})
