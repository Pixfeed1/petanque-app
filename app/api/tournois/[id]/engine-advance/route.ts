// app/api/tournois/[id]/engine-advance/route.ts
// Mode « Personnalisé » : avance le tournoi via le moteur de règles libre.
// À partir des scores déjà saisis, génère et persiste le prochain lot de matchs
// (et, en mêlée recomposée, les nouvelles équipes) dans UNE transaction.

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { transaction, queryOne, queryMany } from '@/lib/db'
import { emitTournamentEvent } from '@/lib/tournament-events'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { advance } from '@/lib/engine/incremental'
import { dbMatchesToEngine, engineMatchesToPayload, type DbMatch } from '@/lib/engine/adapter'
import { readHistory } from '@/lib/services/playerHistory'
import type { EnginePlayer, EngineTeam, RuleConfig } from '@/lib/engine/types'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = applyRateLimit(request, 'engine-advance', RATE_LIMITS.batch)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult
    const { id: tournoiId } = await params

    const tournoi = await queryOne<{ org_id: string; mode: string; settings: unknown }>(
      'SELECT org_id, mode, settings FROM tournois WHERE id = $1', [tournoiId]
    )
    if (!tournoi) return apiError('Tournoi introuvable', 404)
    // SÉCURITÉ : autoriser AVANT toute vérif révélant le mode/état du tournoi.
    const hasAccess = await checkOrgAccess(user.id, tournoi.org_id)
    if (!hasAccess) return apiError('Accès refusé', 403)
    if (tournoi.mode !== 'personnalise') return apiError('Avance moteur réservée au mode personnalisé', 400)

    const settings = (typeof tournoi.settings === 'string' ? JSON.parse(tournoi.settings) : tournoi.settings) || {}
    const config = settings.ruleEngine as RuleConfig | undefined
    const teamCount = Number(settings.ruleEngineTeamCount) || 0
    if (!config || !config.phases?.length) return apiError('Config moteur absente', 400)

    // Équipes (ordre de création = espace d'indices), matchs, joueurs.
    const equipes = await queryMany<{ id: string; joueur_ids: unknown }>(
      'SELECT id, joueur_ids FROM equipes WHERE tournoi_id = $1 ORDER BY id ASC', [tournoiId]
    )
    const toIds = (a: unknown): string[] => (Array.isArray(a) ? a.map(String) : [])
    const joueursByTeamId = new Map(equipes.map(e => [String(e.id), toIds(e.joueur_ids)]))
    const originalTeamIds = equipes.slice(0, teamCount || equipes.length).map(e => String(e.id))

    const matchRows = await queryMany<DbMatch & { equipe_a_id: string | null; equipe_b_id: string | null }>(
      `SELECT equipe_a_id, equipe_b_id, score_a, score_b, status, tour, type, poule
         FROM matches WHERE tournoi_id = $1`, [tournoiId]
    )
    const engineMatches = dbMatchesToEngine(matchRows as DbMatch[], config, originalTeamIds, joueursByTeamId)
    const engineTeams: EngineTeam[] = originalTeamIds.map(id => ({ id, joueur_ids: joueursByTeamId.get(id) ?? [] }))

    // Joueurs (genre + niveau cumulé) pour la formation/mixité.
    const playerIds = [...new Set([...joueursByTeamId.values()].flat())]
    const players: EnginePlayer[] = []
    if (playerIds.length) {
      const rows = await queryMany<{ id: string; gender: string | null; stats: unknown }>(
        `SELECT id, gender, stats FROM joueurs WHERE id = ANY($1::bigint[])`, [playerIds]
      )
      for (const r of rows) players.push({ id: String(r.id), gender: r.gender === 'F' ? 'F' : 'H', niveau: readHistory(r.stats).niveau })
    }

    const res = advance(config, players, engineTeams, engineMatches)
    if (res.waiting) return apiSuccess({ waiting: true, done: false })
    if (res.done) return apiSuccess({ waiting: false, done: true })

    // Persister le prochain lot (nouvelles équipes en mêlée recomposée, puis matchs).
    const result = await transaction(async (client) => {
      let batchTeamIds = originalTeamIds
      let createdTeams = 0
      if (res.newTeams.length > 0) {
        // Nom lisible (jamais l'id interne) : « Manche N · Équipe i ».
        const manche = res.newMatches[0]?.round ?? 0
        const vals: unknown[] = []
        const rows: string[] = []
        res.newTeams.forEach((t, i) => {
          const b = i * 3
          rows.push(`($${b + 1}, $${b + 2}, $${b + 3})`)
          vals.push(tournoiId, `Manche ${manche} · Équipe ${i + 1}`, t.joueur_ids)
        })
        const ins = await client.query(
          `INSERT INTO equipes (tournoi_id, name, joueur_ids) VALUES ${rows.join(', ')} RETURNING id`, vals
        )
        batchTeamIds = ins.rows.map((r: { id: string }) => String(r.id))
        createdTeams = ins.rows.length
      }

      const payload = engineMatchesToPayload(res.newMatches, config, Number(settings.terrains) || 0)
      const mv: unknown[] = []
      const ms: string[] = []
      payload.forEach((m, i) => {
        const aId = batchTeamIds[m.team_a_index]
        const bId = m.team_b_index === null ? null : batchTeamIds[m.team_b_index]
        if (!aId) throw new Error(`team_a_index invalide (${m.team_a_index})`)
        const b = i * 8
        ms.push(`($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7}, $${b + 8})`)
        mv.push(tournoiId, m.tour, m.terrain, aId, bId, m.type, m.poule, bId === null ? 'termine' : 'a_jouer')
      })
      const insM = await client.query(
        `INSERT INTO matches (tournoi_id, tour, terrain, equipe_a_id, equipe_b_id, type, poule, status)
         VALUES ${ms.join(', ')} RETURNING *`, mv
      )
      return { createdTeams, matches: insM.rows, phaseIndex: res.phaseIndex }
    })

    if (result.createdTeams > 0) emitTournamentEvent('team:created', tournoiId, { count: result.createdTeams })
    emitTournamentEvent('match:created', tournoiId, { count: result.matches.length })

    return apiSuccess({ waiting: false, done: false, matches_created: result.matches.length, teams_created: result.createdTeams, matches: result.matches }, 201)
  } catch (error: unknown) {
    console.error('❌ Erreur POST /api/tournois/[id]/engine-advance:', error)
    return apiError(error instanceof Error ? error.message : 'Erreur avance moteur', 500)
  }
}
