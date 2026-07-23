/**
 * Moteur libre — ADAPTATEUR entre le moteur (indices d'équipe) et l'app (équipes/matchs
 * persistés). Sert à la fois à la création (moteur → payload atomique) et à l'avance
 * incrémentale côté serveur (DB → moteur → nouveaux matchs).
 *
 * Module pur, testable. Aucune dépendance DB : il manipule des structures simples.
 */

import type { EngineMatch, EngineTeam, RuleConfig } from './types'

// ── Moteur → payload de création atomique (/api/tournois/full) ─────────
export interface PayloadTeam { name: string; joueur_ids: string[] }
export interface PayloadMatch {
  team_a_index: number
  team_b_index: number | null
  tour: number
  terrain: number | null
  type: string
  poule: string | null
  status: string
}

/** Type de match DB à partir de la phase/poule moteur. */
export function engineMatchType(m: EngineMatch, config: RuleConfig): string {
  if (m.poule === 'petite') return 'petite_finale'
  const phase = config.phases[m.phase]
  if (phase?.type === 'elimination') return 'elimination'
  return 'poule'
}

export function engineTeamsToPayload(teams: EngineTeam[], prefix = ''): PayloadTeam[] {
  return teams.map((t, i) => ({ name: `${prefix}Équipe ${i + 1}`, joueur_ids: t.joueur_ids }))
}

export function engineMatchesToPayload(
  matches: EngineMatch[], config: RuleConfig, terrains: number,
): PayloadMatch[] {
  let terrainCursor = 0
  return matches.map(m => {
    const isBye = m.b === null
    const terrain = isBye || terrains <= 0 ? null : ((terrainCursor++ % terrains) + 1)
    return {
      team_a_index: m.a,
      team_b_index: m.b,
      tour: m.round,
      terrain,
      type: isBye ? 'bye' : engineMatchType(m, config),
      poule: m.poule === 'petite' ? null : (m.poule ?? null),
      status: 'a_jouer',
    }
  })
}

// ── DB → moteur (pour l'avance incrémentale) ───────────────────────────
export interface DbTeam { id: string; joueur_ids: string[] }
export interface DbMatch {
  equipe_a_id: string | null
  equipe_b_id: string | null
  score_a: number | null
  score_b: number | null
  status: string
  tour: number
  type: string | null
  poule: string | null
}

/** Index de phase déduit du type de match, selon la config (1 à 2 phases en pratique). */
function phaseOfType(type: string | null, config: RuleConfig): number {
  if (type === 'elimination' || type === 'petite_finale' || type === 'finale' || type === 'demi' || type === 'quart' || type === 'huitieme') {
    const idx = config.phases.findIndex(p => p.type === 'elimination')
    return idx >= 0 ? idx : 0
  }
  const idx = config.phases.findIndex(p => p.type === 'poules' || p.type === 'rounds')
  return idx >= 0 ? idx : 0
}

/**
 * Reconstruit les matchs moteur depuis les lignes DB. `originalTeamIds` = équipes de
 * la phase 0 dans l'ordre (définit l'espace d'indices pour les modes à équipes stables).
 * Les équipes recomposées (mêlée) ont un index -1 : sans effet, l'avance recomposée ne
 * s'appuie que sur les effectifs (aIds/bIds).
 */
export function dbMatchesToEngine(
  rows: DbMatch[], config: RuleConfig,
  originalTeamIds: string[], joueursByTeamId: Map<string, string[]>,
): EngineMatch[] {
  const indexOf = new Map(originalTeamIds.map((id, i) => [String(id), i]))
  return rows.map(r => {
    const aId = r.equipe_a_id != null ? String(r.equipe_a_id) : null
    const bId = r.equipe_b_id != null ? String(r.equipe_b_id) : null
    const isBye = r.type === 'bye' || bId === null
    const m: EngineMatch = {
      a: aId != null ? (indexOf.get(aId) ?? -1) : -1,
      b: isBye ? null : (bId != null ? (indexOf.get(bId) ?? -1) : null),
      phase: phaseOfType(r.type, config),
      round: r.tour,
      poule: r.type === 'petite_finale' ? 'petite' : (r.poule ?? null),
      aIds: aId != null ? (joueursByTeamId.get(aId) ?? []) : [],
      bIds: bId != null ? (joueursByTeamId.get(bId) ?? []) : undefined,
    }
    if (r.status === 'termine' && r.score_a != null && r.score_b != null) {
      m.scoreA = r.score_a
      m.scoreB = r.score_b
    }
    return m
  })
}
