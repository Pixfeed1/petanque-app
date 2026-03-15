// app/api/admin/beta-mode/route.ts
// Toggle du mode beta (admin uniquement)

import { NextRequest } from 'next/server'
import { requireAdmin, apiSuccess, apiError, parseJsonBody } from '@/lib/middleware'
import { queryOne, query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof Response) return authResult

    const setting = await queryOne<{ value: any; updated_at: string }>(
      `SELECT value, updated_at FROM app_settings WHERE key = 'beta_mode'`
    )

    return apiSuccess({
      enabled: !!setting?.value?.enabled,
      message: setting?.value?.message || '',
      updated_at: setting?.updated_at
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/admin/beta-mode:', error)
    return apiError('Erreur serveur', 500)
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const bodyResult = await parseJsonBody<{ enabled: boolean; message?: string }>(request)
    if ('error' in bodyResult) return bodyResult.error

    const { enabled, message } = bodyResult.data

    await query(
      `INSERT INTO app_settings (key, value, updated_at, updated_by)
       VALUES ('beta_mode', $1::jsonb, NOW(), $2)
       ON CONFLICT (key) DO UPDATE SET
         value = $1::jsonb,
         updated_at = NOW(),
         updated_by = $2`,
      [
        JSON.stringify({
          enabled: !!enabled,
          message: message || "Nous sommes en phase de test ! Toutes les fonctionnalités sont gratuites. Vos retours nous aident à améliorer l'outil."
        }),
        user.id
      ]
    )

    return apiSuccess({ enabled: !!enabled })
  } catch (error) {
    console.error('❌ Erreur PUT /api/admin/beta-mode:', error)
    return apiError('Erreur serveur', 500)
  }
}
