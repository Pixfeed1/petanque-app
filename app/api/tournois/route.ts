// app/api/tournois/route.ts
// API pour gérer les tournois

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { queryMany, query } from '@/lib/db'

// GET - Récupérer les tournois de l'organisation
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult

    // Récupérer l'orgId depuis les query params
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!orgId) {
      return apiError('org_id est requis', 400)
    }

    // Vérifier l'accès
    const hasAccess = await checkOrgAccess(user.id, orgId)
    if (!hasAccess) {
      return apiError('Accès refusé à cette organisation', 403)
    }

    // Récupérer les tournois avec pagination
    const tournois = await queryMany(
      `SELECT * FROM tournois
       WHERE org_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [orgId, limit, offset]
    )

    return apiSuccess(tournois)
  } catch (error) {
    console.error('❌ Erreur GET /api/tournois:', error)
    return apiError('Erreur lors de la récupération des tournois', 500)
  }
}

// POST - Créer un nouveau tournoi
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const body = await request.json()

    const { org_id, name, format, mode, settings } = body

    // Validation des champs requis
    if (!org_id || !name || !format || !mode) {
      return apiError('Champs requis: org_id, name, format, mode', 400)
    }

    // 🔧 FIX: Validation du nom du tournoi
    if (typeof name !== 'string' || name.trim().length === 0) {
      return apiError('Le nom du tournoi ne peut pas être vide', 400)
    }
    if (name.trim().length > 200) {
      return apiError('Le nom du tournoi est trop long (maximum 200 caractères)', 400)
    }

    // 🔧 FIX: Validation du format du tournoi
    const validFormats = ['tete_a_tete', 'doublette', 'triplette']
    if (!validFormats.includes(format)) {
      return apiError(`Format invalide: ${format}. Formats acceptés: ${validFormats.join(', ')}`, 400)
    }

    // 🔧 FIX: Validation du mode du tournoi
    const validModes = ['choisi', 'melee_fixe', 'melee_tournante']
    if (!validModes.includes(mode)) {
      return apiError(`Mode invalide: ${mode}. Modes acceptés: ${validModes.join(', ')}`, 400)
    }

    // 🔧 FIX: Validation des settings si fournis
    if (settings) {
      if (settings.maxPoints !== undefined && (typeof settings.maxPoints !== 'number' || settings.maxPoints < 1 || settings.maxPoints > 50)) {
        return apiError('maxPoints doit être un nombre entre 1 et 50', 400)
      }
      if (settings.pouleSize !== undefined && (typeof settings.pouleSize !== 'number' || settings.pouleSize < 3 || settings.pouleSize > 10)) {
        return apiError('pouleSize doit être un nombre entre 3 et 10', 400)
      }
      if (settings.qualifiedPerPoule !== undefined) {
        if (typeof settings.qualifiedPerPoule !== 'number' || settings.qualifiedPerPoule < 1) {
          return apiError('qualifiedPerPoule doit être un nombre >= 1', 400)
        }
        // Vérifier la cohérence avec pouleSize si fourni
        if (settings.pouleSize !== undefined && settings.qualifiedPerPoule >= settings.pouleSize) {
          return apiError('qualifiedPerPoule doit être inférieur à pouleSize', 400)
        }
      }
      if (settings.terrains !== undefined && (typeof settings.terrains !== 'number' || settings.terrains < 1 || settings.terrains > 100)) {
        return apiError('terrains doit être un nombre entre 1 et 100', 400)
      }
      // 🔧 FIX: Validation timeLimit et timeLimitMinutes
      if (settings.timeLimit !== undefined && typeof settings.timeLimit !== 'boolean') {
        return apiError('timeLimit doit être un booléen', 400)
      }
      if (settings.timeLimitMinutes !== undefined) {
        if (typeof settings.timeLimitMinutes !== 'number' || settings.timeLimitMinutes < 1 || settings.timeLimitMinutes > 300) {
          return apiError('timeLimitMinutes doit être un nombre entre 1 et 300', 400)
        }
      }
      // 🔧 FIX: Validation consolante
      if (settings.consolante !== undefined && typeof settings.consolante !== 'boolean') {
        return apiError('consolante doit être un booléen', 400)
      }
    }

    // Vérifier l'accès
    const hasAccess = await checkOrgAccess(user.id, org_id)
    if (!hasAccess) {
      return apiError('Accès refusé à cette organisation', 403)
    }

    // Créer le tournoi
    const result = await query(
      `INSERT INTO tournois (org_id, name, format, mode, status, settings, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 'preparation', $5::jsonb, $6, NOW(), NOW())
       RETURNING *`,
      [org_id, name, format, mode, settings || {}, user.id]
    )

    const tournoi = result.rows[0]

    return apiSuccess(tournoi, 201)
  } catch (error) {
    console.error('❌ Erreur POST /api/tournois:', error)
    return apiError('Erreur lors de la création du tournoi', 500)
  }
}
