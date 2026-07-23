/**
 * Historique de niveau par joueur — statistiques cumulées ENTRE les concours.
 *
 * À la clôture d'un tournoi, les contributions de chaque joueur (parties jouées,
 * victoires/défaites, points pour/contre) sont ajoutées à son agrégat persistant
 * (colonne `joueurs.stats`). On en dérive un « niveau » qui sert ensuite à mieux
 * équilibrer les tirages au fil du temps (voir lib/services/levelBalancing.ts).
 *
 * Module PUR (aucune dépendance DB/React) → entièrement testable.
 */

export interface PlayerHistory {
  /** Nombre de concours terminés auxquels le joueur a participé. */
  concours: number
  /** Nombre de parties (matchs) jouées, tous concours confondus. */
  parties: number
  victoires: number
  defaites: number
  nuls: number
  pointsPour: number
  pointsContre: number
  /** Niveau dérivé (rating), mis en cache pour l'affichage et le tirage. Base 1000. */
  niveau: number
}

/** Contribution d'un joueur sur UN concours (avant cumul). */
export interface PlayerDelta {
  parties: number
  victoires: number
  defaites: number
  nuls: number
  pointsPour: number
  pointsContre: number
}

export const NIVEAU_BASE = 1000
const NIVEAU_MIN = 400
const NIVEAU_MAX = 1600
/** Écart moyen par partie borné avant pondération (anti-outlier, cohérent fair-play). */
const AVG_DIFF_CLAMP = 13

export const EMPTY_HISTORY: PlayerHistory = {
  concours: 0,
  parties: 0,
  victoires: 0,
  defaites: 0,
  nuls: 0,
  pointsPour: 0,
  pointsContre: 0,
  niveau: NIVEAU_BASE,
}

function num(v: unknown): number {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number)
  return Number.isFinite(n) ? n : 0
}

/**
 * Lit un agrégat depuis un `joueurs.stats` potentiellement vide, partiel ou legacy.
 * Toute valeur absente/non numérique retombe à 0 ; le niveau est TOUJOURS recalculé
 * (on ne fait jamais confiance à un niveau stocké éventuellement incohérent).
 */
export function readHistory(stats: unknown): PlayerHistory {
  const raw = (typeof stats === 'string' ? safeParse(stats) : stats) as Record<string, unknown> | null
  const src = raw && typeof raw === 'object' ? raw : {}
  const h: PlayerHistory = {
    concours: Math.max(0, Math.round(num(src.concours))),
    parties: Math.max(0, Math.round(num(src.parties))),
    victoires: Math.max(0, Math.round(num(src.victoires))),
    defaites: Math.max(0, Math.round(num(src.defaites))),
    nuls: Math.max(0, Math.round(num(src.nuls))),
    pointsPour: Math.max(0, Math.round(num(src.pointsPour))),
    pointsContre: Math.max(0, Math.round(num(src.pointsContre))),
    niveau: NIVEAU_BASE,
  }
  h.niveau = computeNiveau(h)
  return h
}

function safeParse(s: string): Record<string, unknown> | null {
  try {
    const v = JSON.parse(s)
    return v && typeof v === 'object' ? v : null
  } catch {
    return null
  }
}

/**
 * Niveau dérivé d'un agrégat. Base 1000 (neutre, aucun historique).
 *   - taux de victoire : (ratio - 0.5) × 600  → ±300 aux extrêmes
 *   - écart moyen/partie (borné ±13) × 10     → ±130 aux extrêmes
 * Le résultat est arrondi puis borné à [400, 1600]. Un joueur sans partie garde 1000
 * (on ne pénalise ni ne récompense l'absence de données).
 */
export function computeNiveau(h: Pick<PlayerHistory, 'parties' | 'victoires' | 'pointsPour' | 'pointsContre'>): number {
  if (!h.parties || h.parties <= 0) return NIVEAU_BASE
  const ratio = h.victoires / h.parties
  const rawAvgDiff = (h.pointsPour - h.pointsContre) / h.parties
  const avgDiff = Math.max(-AVG_DIFF_CLAMP, Math.min(AVG_DIFF_CLAMP, rawAvgDiff))
  const niveau = NIVEAU_BASE + (ratio - 0.5) * 600 + avgDiff * 10
  return Math.max(NIVEAU_MIN, Math.min(NIVEAU_MAX, Math.round(niveau)))
}

/**
 * Cumule la contribution d'un concours dans l'agrégat courant et recalcule le niveau.
 * `concours` n'est incrémenté que si le joueur a réellement joué au moins une partie
 * (un joueur inscrit mais jamais aligné ne « consomme » pas un concours).
 */
export function accumulate(current: PlayerHistory, delta: PlayerDelta): PlayerHistory {
  const next: PlayerHistory = {
    concours: current.concours + (delta.parties > 0 ? 1 : 0),
    parties: current.parties + Math.max(0, delta.parties),
    victoires: current.victoires + Math.max(0, delta.victoires),
    defaites: current.defaites + Math.max(0, delta.defaites),
    nuls: current.nuls + Math.max(0, delta.nuls),
    pointsPour: current.pointsPour + Math.max(0, delta.pointsPour),
    pointsContre: current.pointsContre + Math.max(0, delta.pointsContre),
    niveau: NIVEAU_BASE,
  }
  next.niveau = computeNiveau(next)
  return next
}

/** Un match terminé, réduit à ses deux effectifs et son score. */
export interface MatchResult {
  teamAIds: string[]
  teamBIds: string[]
  scoreA: number
  scoreB: number
}

/**
 * Agrège les contributions par joueur à partir des matchs TERMINÉS d'un concours.
 * Les byes (une seule équipe, ou score manquant) sont ignorés : un exempt ne gagne
 * ni ne perd de points. Chaque joueur reçoit +1 partie par match réellement disputé.
 */
export function contributionsFromTournament(matches: MatchResult[]): Map<string, PlayerDelta> {
  const acc = new Map<string, PlayerDelta>()
  const bump = (id: string, fn: (d: PlayerDelta) => void) => {
    let d = acc.get(id)
    if (!d) {
      d = { parties: 0, victoires: 0, defaites: 0, nuls: 0, pointsPour: 0, pointsContre: 0 }
      acc.set(id, d)
    }
    fn(d)
  }

  for (const m of matches) {
    // Bye / match incomplet : pas de contribution.
    if (!m.teamAIds?.length || !m.teamBIds?.length) continue
    const a = num(m.scoreA)
    const b = num(m.scoreB)
    const aWins = a > b
    const draw = a === b
    for (const id of m.teamAIds) {
      bump(id, d => {
        d.parties++
        d.pointsPour += a
        d.pointsContre += b
        if (draw) d.nuls++
        else if (aWins) d.victoires++
        else d.defaites++
      })
    }
    for (const id of m.teamBIds) {
      bump(id, d => {
        d.parties++
        d.pointsPour += b
        d.pointsContre += a
        if (draw) d.nuls++
        else if (!aWins) d.victoires++
        else d.defaites++
      })
    }
  }

  return acc
}
