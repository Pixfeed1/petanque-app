/**
 * Vue « joueur » : ce qu'un utilisateur voit de SES fiches — tournois où il joue,
 * son équipe, et son prochain match (« c'est ton tour »).
 *
 * NB : joueurs.id / equipes.joueur_ids sont des BIGINT / BIGINT[] en production ;
 * on teste l'appartenance via `$1::bigint = ANY(e.joueur_ids)` (même motif que le
 * reste du code) plutôt que par containment JSONB.
 */
import { queryMany } from '@/lib/db'

export interface PlayerNextMatch {
  id: string
  tour: number
  terrain: number | null
  opponent: string | null
  status: string
}

export interface PlayerTournoi {
  tournoiId: string
  tournoiName: string
  status: string
  teamName: string
  nextMatch: PlayerNextMatch | null
}

export interface PlayerProfile {
  joueurId: string
  name: string
  clubName: string
  tournois: PlayerTournoi[]
}

interface JoueurLite { id: string; name: string; club_name: string }
interface TeamRow { equipe_id: string; equipe_name: string; tournoi_id: string; tournoi_name: string; status: string }
interface MatchRow {
  id: string; tour: number; terrain: number | null; status: string
  equipe_a_id: string | null; equipe_b_id: string | null; a_name: string | null; b_name: string | null
}

/** Fiches liées à un utilisateur, avec leurs tournois et prochain match. */
export async function getPlayerView(userId: string): Promise<PlayerProfile[]> {
  const joueurs = await queryMany<JoueurLite>(
    `SELECT j.id, j.name, o.name AS club_name
       FROM joueurs j JOIN organisations o ON o.id = j.org_id
      WHERE j.user_id = $1 ORDER BY j.created_at`,
    [userId]
  )

  const profiles: PlayerProfile[] = []
  for (const j of joueurs) {
    const teams = await queryMany<TeamRow>(
      `SELECT e.id AS equipe_id, e.name AS equipe_name,
              t.id AS tournoi_id, t.name AS tournoi_name, t.status
         FROM equipes e JOIN tournois t ON t.id = e.tournoi_id
        WHERE $1::bigint = ANY(e.joueur_ids)
        ORDER BY t.created_at DESC`,
      [j.id]
    )

    const tournois: PlayerTournoi[] = []
    for (const team of teams) {
      const matches = await queryMany<MatchRow>(
        `SELECT m.id, m.tour, m.terrain, m.status, m.equipe_a_id, m.equipe_b_id,
                ea.name AS a_name, eb.name AS b_name
           FROM matches m
           LEFT JOIN equipes ea ON ea.id = m.equipe_a_id
           LEFT JOIN equipes eb ON eb.id = m.equipe_b_id
          WHERE (m.equipe_a_id = $1 OR m.equipe_b_id = $1) AND m.status <> 'termine'
          ORDER BY m.tour ASC LIMIT 1`,
        [team.equipe_id]
      )
      const m = matches[0]
      let nextMatch: PlayerNextMatch | null = null
      if (m) {
        const iAmA = String(m.equipe_a_id) === String(team.equipe_id)
        nextMatch = {
          id: m.id,
          tour: m.tour,
          terrain: m.terrain,
          opponent: iAmA ? m.b_name : m.a_name,
          status: m.status,
        }
      }
      tournois.push({
        tournoiId: team.tournoi_id,
        tournoiName: team.tournoi_name,
        status: team.status,
        teamName: team.equipe_name,
        nextMatch,
      })
    }

    profiles.push({ joueurId: j.id, name: j.name, clubName: j.club_name, tournois })
  }
  return profiles
}
