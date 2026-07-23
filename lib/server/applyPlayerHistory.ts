/**
 * Application (serveur) de l'historique de niveau à la clôture d'un concours.
 *
 * À l'appel, on relit les matchs TERMINÉS du tournoi, on calcule la contribution
 * de chaque joueur (via lib/services/playerHistory) et on l'ajoute à son agrégat
 * persistant `joueurs.stats`. Le tout dans UNE transaction : soit tous les joueurs
 * sont mis à jour, soit aucun.
 *
 * L'idempotence est gérée par l'appelant (drapeau `settings.playerStatsApplied`) :
 * on n'ajoute jamais deux fois le même concours.
 */

import { transaction } from '@/lib/db'
import {
  readHistory,
  accumulate,
  contributionsFromTournament,
  type MatchResult,
} from '@/lib/services/playerHistory'

/**
 * Cumule l'historique des joueurs d'un tournoi terminé.
 * @returns le nombre de joueurs mis à jour (0 si aucun match terminé).
 */
export async function applyPlayerHistoryForTournament(tournoiId: string | number): Promise<number> {
  return transaction(async (client) => {
    // Matchs terminés joints aux effectifs des deux équipes.
    const { rows: matchRows } = await client.query(
      `SELECT ea.joueur_ids AS a_ids, eb.joueur_ids AS b_ids,
              m.score_a, m.score_b
         FROM matches m
         LEFT JOIN equipes ea ON ea.id = m.equipe_a_id
         LEFT JOIN equipes eb ON eb.id = m.equipe_b_id
        WHERE m.tournoi_id = $1
          AND m.status = 'termine'
          AND m.equipe_a_id IS NOT NULL
          AND m.equipe_b_id IS NOT NULL`,
      [tournoiId]
    )

    const toIds = (arr: unknown): string[] =>
      Array.isArray(arr) ? arr.map((v) => String(v)) : []

    const matches: MatchResult[] = matchRows.map((r) => ({
      teamAIds: toIds(r.a_ids),
      teamBIds: toIds(r.b_ids),
      scoreA: Number(r.score_a) || 0,
      scoreB: Number(r.score_b) || 0,
    }))

    const contributions = contributionsFromTournament(matches)
    if (contributions.size === 0) return 0

    // Charger les agrégats courants des joueurs concernés, puis réécrire.
    const ids = [...contributions.keys()]
    const { rows: playerRows } = await client.query(
      `SELECT id, stats FROM joueurs WHERE id = ANY($1::bigint[]) FOR UPDATE`,
      [ids]
    )
    const currentById = new Map<string, unknown>(
      playerRows.map((p) => [String(p.id), p.stats])
    )

    let updated = 0
    for (const [playerId, delta] of contributions) {
      // Un joueur pu être supprimé entre-temps : on ignore silencieusement.
      if (!currentById.has(playerId)) continue
      const next = accumulate(readHistory(currentById.get(playerId)), delta)
      await client.query(
        `UPDATE joueurs SET stats = $1::jsonb, updated_at = NOW() WHERE id = $2`,
        [JSON.stringify(next), playerId]
      )
      updated++
    }

    return updated
  })
}
