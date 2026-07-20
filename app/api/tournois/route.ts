// app/api/tournois/route.ts
// API pour gérer les tournois

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { queryMany, query } from '@/lib/db'
import { sanitizeTournoiSettings } from '@/lib/validations'

// GET - Récupérer les tournois de l'organisation
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult

    // Récupérer l'orgId depuis les query params
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org_id')
    // FIX : bornes + garde NaN (parseInt('abc')=NaN passé à LIMIT → 500)
    const limitRaw = parseInt(searchParams.get('limit') || '50', 10)
    const offsetRaw = parseInt(searchParams.get('offset') || '0', 10)
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 200) : 50
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0

    if (!orgId) {
      return apiError('org_id est requis', 400)
    }

    // Vérifier l'accès
    const hasAccess = await checkOrgAccess(user.id, orgId)
    if (!hasAccess) {
      return apiError('Accès refusé à cette organisation', 403)
    }

    // Récupérer les tournois avec stats (nb_joueurs, nb_matchs)
    const tournois = await queryMany(
      `SELECT t.*,
        (SELECT COUNT(DISTINCT unnest_id)
         FROM equipes e, LATERAL unnest(e.joueur_ids) AS unnest_id
         WHERE e.tournoi_id = t.id) AS nb_joueurs,
        (SELECT COUNT(*) FROM matches m WHERE m.tournoi_id = t.id) AS nb_matchs_total,
        (SELECT COUNT(*) FROM matches m WHERE m.tournoi_id = t.id AND m.status = 'termine') AS nb_matchs_joues
       FROM tournois t
       WHERE t.org_id = $1
       ORDER BY t.created_at DESC
       LIMIT $2 OFFSET $3`,
      [orgId, limit, offset]
    )

    // Convertir les counts en nombres
    tournois.forEach((t: Record<string, unknown>) => {
      t.nb_joueurs = parseInt(String(t.nb_joueurs || '0'))
      t.nb_matchs_total = parseInt(String(t.nb_matchs_total || '0'))
      t.nb_matchs_joues = parseInt(String(t.nb_matchs_joues || '0'))
    })

    return apiSuccess(tournois)
  } catch (error) {
    console.error('❌ Erreur GET /api/tournois:', error)
    return apiError('Erreur lors de la récupération des tournois', 500)
  }
}

// POST - Créer un nouveau tournoi
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitResponse = applyRateLimit(request, 'tournoi-create', RATE_LIMITS.write)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const body = await request.json()

    const { org_id, name, format, mode, settings, visibility } = body

    // Validation
    if (!org_id || !name || !format || !mode) {
      return apiError('Champs requis: org_id, name, format, mode', 400)
    }

    const validFormats = ['tete_a_tete', 'doublette', 'triplette']
    const validModes = ['choisi', 'melee_fixe', 'melee_tournante']
    if (!validFormats.includes(format)) {
      return apiError(`Format invalide. Valeurs acceptées: ${validFormats.join(', ')}`, 400)
    }
    if (!validModes.includes(mode)) {
      return apiError(`Mode invalide. Valeurs acceptées: ${validModes.join(', ')}`, 400)
    }

    // Vérifier l'accès
    const hasAccess = await checkOrgAccess(user.id, org_id)
    if (!hasAccess) {
      return apiError('Accès refusé à cette organisation', 403)
    }

    // Appliquer les valeurs par défaut aux settings
    const defaultSettings = {
      terrains: 4,
      maxPoints: 13,
      pouleSize: 4,
      timeLimit: false,
      timeLimitMinutes: 60,
      qualifiedPerPoule: 2,
      consolante: false,
      fairPlay: false,
      recordMenes: false,
      allowPhotos: false,
      sendNotifications: false
    }
    // FIX SÉCURITÉ : sanitize (whitelist + coercition + bornes) avant merge, au
    // lieu de `...settings` brut (mass assignment / valeurs absurdes / NaN).
    const mergedSettings: Record<string, any> = { ...defaultSettings, ...sanitizeTournoiSettings(settings) }

    // Valider maxPoints (range 7-25) — désormais garanti numérique par le sanitizer
    if (mergedSettings.maxPoints < 7 || mergedSettings.maxPoints > 25) {
      return apiError('maxPoints doit être entre 7 et 25', 400)
    }

    // Stocker visibility dans settings
    const validVisibility = ['private', 'public']
    mergedSettings.visibility = validVisibility.includes(visibility) ? visibility : 'private'

    // Créer le tournoi
    const result = await query(
      `INSERT INTO tournois (org_id, name, format, mode, status, settings, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'preparation', $5::jsonb, $6, NOW(), NOW())
       RETURNING *`,
      [org_id, name, format, mode, mergedSettings, user.id]
    )

    const tournoi = result.rows[0]

    return apiSuccess(tournoi, 201)
  } catch (error) {
    console.error('❌ Erreur POST /api/tournois:', error)
    return apiError('Erreur lors de la création du tournoi', 500)
  }
}
