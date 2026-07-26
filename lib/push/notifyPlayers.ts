/**
 * Notifications « c'est à toi de jouer » : quand un nouveau match devient jouable,
 * on prévient les joueurs LIÉS (ceux qui ont un compte) des deux équipes.
 *
 * Best-effort : toute erreur est avalée (ne doit jamais bloquer l'avancement du tournoi).
 * Volume naturellement faible : seuls les joueurs ayant lié leur fiche reçoivent un push.
 */
import { queryMany, queryOne } from '@/lib/db'
import { sendPushToUser } from './server'

interface MatchInfo {
  tournoi_id: string
  terrain: number | null
  equipe_a_id: string | null
  equipe_b_id: string | null
  a_name: string | null
  b_name: string | null
  tournoi_name: string
}

/** Notifie les joueurs liés pour une liste de matchs nouvellement créés. */
export async function notifyPlayersMatchesReady(matchIds: Array<string | number>): Promise<void> {
  for (const id of matchIds) {
    try {
      await notifyOne(String(id))
    } catch (e) {
      console.error('notify match ready (non bloquant):', e)
    }
  }
}

async function notifyOne(matchId: string): Promise<void> {
  const m = await queryOne<MatchInfo>(
    `SELECT m.tournoi_id, m.terrain, m.equipe_a_id, m.equipe_b_id,
            ea.name AS a_name, eb.name AS b_name, t.name AS tournoi_name
       FROM matches m
       LEFT JOIN equipes ea ON ea.id = m.equipe_a_id
       LEFT JOIN equipes eb ON eb.id = m.equipe_b_id
       JOIN tournois t ON t.id = m.tournoi_id
      WHERE m.id = $1`,
    [matchId]
  )
  if (!m || !m.equipe_a_id || !m.equipe_b_id) return
  await notifyTeam(m.equipe_a_id, m.b_name, m.terrain, matchId, m.tournoi_name)
  await notifyTeam(m.equipe_b_id, m.a_name, m.terrain, matchId, m.tournoi_name)
}

async function notifyTeam(
  equipeId: string,
  opponentName: string | null,
  terrain: number | null,
  matchId: string,
  tournoiName: string
): Promise<void> {
  const rows = await queryMany<{ user_id: string }>(
    `SELECT DISTINCT j.user_id
       FROM joueurs j
      WHERE j.user_id IS NOT NULL
        AND j.id IN (SELECT unnest(joueur_ids) FROM equipes WHERE id = $1)`,
    [equipeId]
  )
  if (rows.length === 0) return
  const body = `${tournoiName} — contre ${opponentName || 'ton adversaire'}${terrain != null ? ` · terrain ${terrain}` : ''}`
  for (const r of rows) {
    await sendPushToUser(r.user_id, {
      title: '🎯 À toi de jouer',
      body,
      url: `/match/${matchId}`,
      tag: `match-${matchId}`,
    })
  }
}
