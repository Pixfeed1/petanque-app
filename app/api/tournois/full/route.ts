// app/api/tournois/full/route.ts
// Création ATOMIQUE d'un tournoi complet : nouveaux joueurs + tournoi + équipes
// + matchs, le tout dans une seule transaction PG. Remplace l'ancienne saga
// client (N requêtes HTTP séquentielles) qui laissait des données partielles en
// cas d'échec (joueurs orphelins, tournoi sans matchs...).
//
// Références de joueurs à créer : les équipes / settings.players utilisent des
// jetons "new:<index>" pointant vers le tableau newPlayers ; le serveur les
// résout après insertion des joueurs.

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { transaction } from '@/lib/db'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { sanitizeTournoiSettings } from '@/lib/validations'
import { emitTournamentEvent } from '@/lib/tournament-events'

interface NewPlayerInput {
  name: string
  gender?: 'H' | 'F' | null
  email?: string | null
  phone?: string | null
}
interface TeamInput {
  name: string
  joueur_ids: string[] // ids existants ou jetons "new:<index>"
}
interface MatchInput {
  team_a_index: number
  team_b_index: number | null
  tour?: number
  terrain?: number | null
  type?: string
  poule?: string | null
  status?: string
}

const VALID_FORMATS = ['tete_a_tete', 'doublette', 'triplette']
const VALID_MODES = ['choisi', 'melee_fixe', 'melee_tournante']

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 'tournoi-full', RATE_LIMITS.batch)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const body = await request.json()
    const tournoi = body.tournoi || {}
    const newPlayers: NewPlayerInput[] = Array.isArray(body.newPlayers) ? body.newPlayers : []
    const teams: TeamInput[] = Array.isArray(body.teams) ? body.teams : []
    const matches: MatchInput[] = Array.isArray(body.matches) ? body.matches : []

    // --- Validation d'entrée ---
    const { org_id, name, format, mode, visibility } = tournoi
    if (!org_id || !name || !format || !mode) {
      return apiError('Champs requis: tournoi.org_id, name, format, mode', 400)
    }
    if (!VALID_FORMATS.includes(format)) return apiError('Format invalide', 400)
    if (!VALID_MODES.includes(mode)) return apiError('Mode invalide', 400)
    if (newPlayers.length > 512) return apiError('Trop de nouveaux joueurs (max 512)', 400)
    if (teams.length > 200) return apiError('Trop d\'équipes (max 200)', 400)
    if (matches.length > 500) return apiError('Trop de matchs (max 500)', 400)
    for (const np of newPlayers) {
      if (!np?.name || !String(np.name).trim()) return apiError('Nouveau joueur sans nom', 400)
    }

    const hasAccess = await checkOrgAccess(user.id, String(org_id))
    if (!hasAccess) return apiError('Accès refusé à cette organisation', 403)

    // --- Settings : défauts + sanitize ---
    const defaultSettings = {
      terrains: 4, maxPoints: 13, pouleSize: 4, timeLimit: false, timeLimitMinutes: 60,
      qualifiedPerPoule: 2, consolante: false, fairPlay: false, recordMenes: false,
      allowPhotos: false, sendNotifications: false,
    }
    const mergedSettings: Record<string, any> = {
      ...defaultSettings,
      ...sanitizeTournoiSettings(tournoi.settings),
    }
    if (mergedSettings.maxPoints < 7 || mergedSettings.maxPoints > 25) {
      return apiError('maxPoints doit être entre 7 et 25', 400)
    }
    mergedSettings.visibility = (visibility === 'public') ? 'public' : 'private'

    const result = await transaction(async (client) => {
      // 1) Créer les nouveaux joueurs → ids par index
      const newIds: string[] = []
      for (const np of newPlayers) {
        const r = await client.query(
          `INSERT INTO joueurs (org_id, name, gender, email, phone, stats)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING id`,
          [
            org_id,
            String(np.name).trim(),
            np.gender === 'H' || np.gender === 'F' ? np.gender : null,
            np.email ? String(np.email).trim() : null,
            np.phone ? String(np.phone).trim() : null,
            JSON.stringify({ gender: np.gender || null }),
          ]
        )
        newIds.push(String(r.rows[0].id))
      }

      // Résolveur de jeton "new:<index>" → id réel
      const resolve = (token: unknown): string | null => {
        const s = String(token)
        if (s.startsWith('new:')) {
          const idx = parseInt(s.slice(4), 10)
          if (!Number.isInteger(idx) || idx < 0 || idx >= newIds.length) {
            throw new Error(`Référence de joueur invalide: ${s}`)
          }
          return newIds[idx]
        }
        return s
      }

      // 2) Résoudre les listes de joueurs dans les settings
      if (Array.isArray(mergedSettings.players)) {
        mergedSettings.players = mergedSettings.players.map(resolve)
      }
      if (Array.isArray(mergedSettings.melee_tournante_players)) {
        mergedSettings.melee_tournante_players = mergedSettings.melee_tournante_players.map(resolve)
      }

      // 3) Créer le tournoi
      const tRes = await client.query(
        `INSERT INTO tournois (org_id, name, format, mode, status, settings, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'preparation', $5::jsonb, $6, NOW(), NOW())
         RETURNING *`,
        [org_id, String(name).trim(), format, mode, JSON.stringify(mergedSettings), user.id]
      )
      const createdTournoi = tRes.rows[0]
      const tournoiId = createdTournoi.id

      // 4) Créer les équipes → ids par index
      const teamIds: string[] = []
      if (teams.length > 0) {
        const values: any[] = []
        const rows: string[] = []
        teams.forEach((t, i) => {
          const b = i * 4
          rows.push(`($${b + 1}, $${b + 2}, $${b + 3}::bigint[], $${b + 4}::jsonb)`)
          const resolvedIds = (Array.isArray(t.joueur_ids) ? t.joueur_ids : []).map(resolve)
          values.push(
            tournoiId,
            String(t.name || `Équipe ${i + 1}`).slice(0, 255),
            resolvedIds,
            JSON.stringify({ victoires: 0, defaites: 0, points_pour: 0, points_contre: 0 })
          )
        })
        const teamsRes = await client.query(
          `INSERT INTO equipes (tournoi_id, name, joueur_ids, stats)
           VALUES ${rows.join(', ')} RETURNING id`,
          values
        )
        teamsRes.rows.forEach((r: any) => teamIds.push(String(r.id)))
      }

      // 5) Créer les matchs (références par index d'équipe)
      let matchesCreated = 0
      if (matches.length > 0) {
        const values: any[] = []
        const rows: string[] = []
        matches.forEach((m, i) => {
          if (m.team_a_index < 0 || m.team_a_index >= teamIds.length) {
            throw new Error(`Match ${i}: team_a_index invalide`)
          }
          if (m.team_b_index !== null && m.team_b_index !== undefined &&
              (m.team_b_index < 0 || m.team_b_index >= teamIds.length)) {
            throw new Error(`Match ${i}: team_b_index invalide`)
          }
          if (m.team_b_index !== null && m.team_b_index !== undefined && m.team_a_index === m.team_b_index) {
            throw new Error(`Match ${i}: les deux équipes doivent être différentes`)
          }
          const b = i * 8
          rows.push(`($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7}, $${b + 8})`)
          values.push(
            tournoiId,
            m.tour || 1,
            m.terrain ?? null,
            teamIds[m.team_a_index],
            (m.team_b_index !== null && m.team_b_index !== undefined) ? teamIds[m.team_b_index] : null,
            m.type || 'poule',
            m.poule ?? null,
            m.status || 'a_jouer'
          )
        })
        const mRes = await client.query(
          `INSERT INTO matches (tournoi_id, tour, terrain, equipe_a_id, equipe_b_id, type, poule, status)
           VALUES ${rows.join(', ')} RETURNING id`,
          values
        )
        matchesCreated = mRes.rows.length
      }

      return { tournoi: createdTournoi, teams_created: teamIds.length, matches_created: matchesCreated }
    })

    emitTournamentEvent('tournament:updated', String(result.tournoi.id), { created: true })

    return apiSuccess(result, 201)
  } catch (error: any) {
    // Erreurs de référence (jeton/index) = 400 métier ; sinon 500 générique.
    if (error?.message && /invalide|Référence/.test(error.message)) {
      return apiError(error.message, 400)
    }
    console.error('❌ Erreur POST /api/tournois/full:', error)
    return apiError('Erreur lors de la création du tournoi', 500)
  }
}
