/**
 * Moteur libre — formation des équipes (déterministe).
 *
 * Compose les équipes selon la méthode choisie, en réutilisant les briques déjà
 * éprouvées (équilibrage par niveau, mixité des adversaires) mais TOUJOURS via le
 * RNG à graine → reproductible et testable.
 */

import type { Rng } from './rng'
import type { EnginePlayer, EngineTeam, FormationRule } from './types'
import { NIVEAU_BASE } from '@/lib/services/playerHistory'

const lvl = (p: EnginePlayer): number => (Number.isFinite(p.niveau as number) ? (p.niveau as number) : NIVEAU_BASE)

/**
 * Forme les équipes d'une manche. `previousTeams` sert à l'anti-rematch (mêlée).
 * Renvoie les équipes + les joueurs surnuméraires (exempts), jamais largués en silence.
 */
export function formTeams(
  rule: FormationRule,
  players: EnginePlayer[],
  rng: Rng,
  previousTeams: EngineTeam[] = []
): { teams: EngineTeam[]; exempt: string[] } {
  const size = rule.teamSize
  if (size <= 0 || players.length < size) {
    return { teams: [], exempt: players.map(p => p.id) }
  }

  // Ordre de base des joueurs selon la méthode.
  let ordered: EnginePlayer[]
  switch (rule.method) {
    case 'balanced':
      // Mélange (départage des ex æquo) puis tri par niveau décroissant.
      ordered = rng.shuffle(players).sort((a, b) => lvl(b) - lvl(a))
      break
    case 'manual':
    case 'random':
    case 'remixed':
    default:
      ordered = rng.shuffle(players)
      break
  }

  // Mixité d'équipe : entrelacer H et F pour maximiser les équipes mixtes.
  if (rule.mixiteEquipe && size >= 2) {
    ordered = interleaveByGender(ordered)
  }

  const nbTeams = Math.floor(players.length / size)
  const teams: EngineTeam[] = Array.from({ length: nbTeams }, () => ({ id: '', joueur_ids: [] as string[] }))

  if (rule.method === 'balanced') {
    // Serpentin pour égaliser la force des équipes.
    const capacity = nbTeams * size
    for (let i = 0; i < capacity; i++) {
      const row = Math.floor(i / nbTeams)
      const col = i % nbTeams
      const t = row % 2 === 0 ? col : nbTeams - 1 - col
      teams[t].joueur_ids.push(ordered[i].id)
    }
  } else {
    // Découpage séquentiel (l'ordre a déjà été mélangé/entrelacé).
    for (let i = 0; i < nbTeams; i++) {
      teams[i].joueur_ids = ordered.slice(i * size, (i + 1) * size).map(p => p.id)
    }
  }

  const exempt = ordered.slice(nbTeams * size).map(p => p.id)
  teams.forEach((t, i) => { t.id = String(i) })

  // Anti-rematch (mêlée) : améliore localement les coéquipiers si demandé.
  if (rule.antiRematch && previousTeams.length > 0) {
    applyAntiRematch(teams, previousTeams)
  }

  return { teams, exempt }
}

/** Entrelace H/F pour que le découpage séquentiel donne des équipes mixtes. */
function interleaveByGender(players: EnginePlayer[]): EnginePlayer[] {
  const H = players.filter(p => p.gender !== 'F')
  const F = players.filter(p => p.gender === 'F')
  const out: EnginePlayer[] = []
  let i = 0, j = 0
  while (i < H.length || j < F.length) {
    if (i < H.length) out.push(H[i++])
    if (j < F.length) out.push(F[j++])
  }
  return out
}

/**
 * Anti-rematch minimal : pénalise les paires de coéquipiers déjà vues et tente des
 * échanges 1-1 qui réduisent la pénalité totale. Déterministe (parcours ordonné),
 * borné (une passe) → suffisant pour casser les répétitions sans exploser le coût.
 */
function applyAntiRematch(teams: EngineTeam[], previous: EngineTeam[]): void {
  const seen = new Set<string>()
  const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`)
  for (const t of previous) {
    for (let i = 0; i < t.joueur_ids.length; i++)
      for (let j = i + 1; j < t.joueur_ids.length; j++)
        seen.add(key(t.joueur_ids[i], t.joueur_ids[j]))
  }
  const teamRepeats = (ids: string[]): number => {
    let n = 0
    for (let i = 0; i < ids.length; i++)
      for (let j = i + 1; j < ids.length; j++)
        if (seen.has(key(ids[i], ids[j]))) n++
    return n
  }
  for (let a = 0; a < teams.length; a++) {
    for (let b = a + 1; b < teams.length; b++) {
      for (let i = 0; i < teams[a].joueur_ids.length; i++) {
        for (let j = 0; j < teams[b].joueur_ids.length; j++) {
          const before = teamRepeats(teams[a].joueur_ids) + teamRepeats(teams[b].joueur_ids)
          if (before === 0) continue
          const ta = [...teams[a].joueur_ids], tb = [...teams[b].joueur_ids]
          ;[ta[i], tb[j]] = [tb[j], ta[i]]
          const after = teamRepeats(ta) + teamRepeats(tb)
          if (after < before) {
            teams[a].joueur_ids = ta
            teams[b].joueur_ids = tb
          }
        }
      }
    }
  }
}
