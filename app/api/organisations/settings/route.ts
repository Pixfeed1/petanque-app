// app/api/organisations/settings/route.ts
// API pour mettre à jour les settings d'une organisation (personnalisation club)

import { NextRequest } from 'next/server'
import { requireAuth, checkOrgAdmin, apiSuccess, apiError } from '@/lib/middleware'
import { query, queryOne } from '@/lib/db'

// PUT - Mettre à jour la personnalisation club
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const body = await request.json()
    const { org_id, customization } = body

    if (!org_id) {
      return apiError('org_id requis', 400)
    }

    // Vérifier que l'utilisateur est admin/owner
    const isAdmin = await checkOrgAdmin(user.id, org_id)
    if (!isAdmin) {
      return apiError('Accès non autorisé', 403)
    }

    // Vérifier que l'org est sur le plan Club
    const org = await queryOne<{ settings: Record<string, any> }>(
      'SELECT settings FROM organisations WHERE id = $1',
      [org_id]
    )

    if (!org) {
      return apiError('Organisation introuvable', 404)
    }

    const settings = typeof org.settings === 'string' ? JSON.parse(org.settings) : (org.settings || {})

    if (settings.plan !== 'club') {
      return apiError('La personnalisation club nécessite le plan Club', 403)
    }

    // Valider les champs de personnalisation
    if (customization) {
      if (customization.primary_color && !/^#[0-9A-Fa-f]{6}$/.test(customization.primary_color)) {
        return apiError('Couleur principale invalide (format #RRGGBB)', 400)
      }
      if (customization.secondary_color && !/^#[0-9A-Fa-f]{6}$/.test(customization.secondary_color)) {
        return apiError('Couleur secondaire invalide (format #RRGGBB)', 400)
      }
      if (customization.club_name && customization.club_name.trim().length === 0) {
        return apiError('Le nom du club ne peut pas être vide', 400)
      }
      if (customization.logo_url && customization.logo_url.length > 500) {
        return apiError('URL du logo trop longue', 400)
      }
    }

    // Mettre à jour les settings avec la personnalisation
    const updatedSettings = {
      ...settings,
      customization: {
        ...(settings.customization || {}),
        ...customization
      }
    }

    const result = await query(
      `UPDATE organisations SET settings = $1, updated_at = NOW(), updated_by = $2
       WHERE id = $3
       RETURNING *`,
      [JSON.stringify(updatedSettings), user.id, org_id]
    )

    return apiSuccess(result.rows[0])
  } catch (error) {
    console.error('❌ Erreur PUT /api/organisations/settings:', error)
    return apiError('Erreur lors de la mise à jour des settings', 500)
  }
}

// GET - Récupérer les settings de personnalisation
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('org_id')

    if (!orgId) {
      return apiError('org_id requis', 400)
    }

    const org = await queryOne<{ id: string; settings: Record<string, any> }>(
      'SELECT id, settings FROM organisations WHERE id = $1',
      [orgId]
    )

    if (!org) {
      return apiError('Organisation introuvable', 404)
    }

    const settings = typeof org.settings === 'string' ? JSON.parse(org.settings) : (org.settings || {})

    return apiSuccess({
      plan: settings.plan || 'free',
      customization: settings.customization || {}
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/organisations/settings:', error)
    return apiError('Erreur lors de la récupération des settings', 500)
  }
}
