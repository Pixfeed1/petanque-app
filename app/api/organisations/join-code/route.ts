// Code club : lecture (GET) et génération/rotation (POST) du code d'adhésion joueur.
// Le code est stocké dans organisations.settings.joinCode. Génération réservée aux admins.
import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess, checkOrgAdmin, parseJsonBody } from '@/lib/middleware'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { queryOne, query } from '@/lib/db'
import { generateJoinCode } from '@/lib/services/playerAccounts'

async function readSettings(orgId: string): Promise<Record<string, unknown> | null> {
  const org = await queryOne<{ settings: Record<string, unknown> | string }>(
    'SELECT settings FROM organisations WHERE id = $1', [orgId]
  )
  if (!org) return null
  return typeof org.settings === 'string' ? JSON.parse(org.settings) : (org.settings || {})
}

// GET ?org_id= — renvoie le code courant (membres de l'org).
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const orgId = new URL(request.url).searchParams.get('org_id')
    if (!orgId) return apiError('org_id requis', 400)
    if (!(await checkOrgAccess(user.id, orgId))) return apiError('Accès refusé', 403)

    const settings = await readSettings(orgId)
    if (!settings) return apiError('Organisation introuvable', 404)
    return apiSuccess({ code: (settings.joinCode as string) || null })
  } catch (error) {
    console.error('❌ join-code GET:', error)
    return apiError('Erreur lors de la lecture du code', 500)
  }
}

// POST {org_id} — génère (ou remplace) le code. Admin uniquement.
export async function POST(request: NextRequest) {
  try {
    const limited = applyRateLimit(request, 'join-code', RATE_LIMITS.write)
    if (limited) return limited

    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const parsed = await parseJsonBody<{ org_id?: string }>(request)
    if ('error' in parsed) return parsed.error
    const orgId = parsed.data.org_id
    if (!orgId) return apiError('org_id requis', 400)
    if (!(await checkOrgAdmin(user.id, orgId))) return apiError('Réservé aux administrateurs du club', 403)

    const settings = await readSettings(orgId)
    if (!settings) return apiError('Organisation introuvable', 404)

    const code = generateJoinCode()
    await query(
      `UPDATE organisations SET settings = $1::jsonb, updated_at = NOW() WHERE id = $2`,
      [{ ...settings, joinCode: code }, orgId]
    )
    return apiSuccess({ code })
  } catch (error) {
    console.error('❌ join-code POST:', error)
    return apiError('Erreur lors de la génération du code', 500)
  }
}
