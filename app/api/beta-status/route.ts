// app/api/beta-status/route.ts
// Endpoint public : vérifie si le mode beta est actif

import { queryOne } from '@/lib/db'
import { apiSuccess, apiError } from '@/lib/middleware'

export async function GET() {
  try {
    const setting = await queryOne<{ value: { enabled: boolean; message: string } }>(
      `SELECT value FROM app_settings WHERE key = 'beta_mode'`
    )

    if (!setting) {
      return apiSuccess({ enabled: false, message: '' })
    }

    return apiSuccess({
      enabled: !!setting.value?.enabled,
      message: setting.value?.message || ''
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/beta-status:', error)
    return apiError('Erreur serveur', 500)
  }
}
