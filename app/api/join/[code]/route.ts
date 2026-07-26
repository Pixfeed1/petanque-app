// Adhésion par code club :
//   GET  — aperçu public : club + fiches non liées (le joueur choisit son nom)
//   POST — l'utilisateur connecté lie la fiche choisie à son compte
import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, parseJsonBody } from '@/lib/middleware'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { queryOne, queryMany } from '@/lib/db'
import { normalizeJoinCode, linkJoueurToUser } from '@/lib/services/playerAccounts'

async function findOrgByCode(code: string): Promise<{ id: string; name: string } | null> {
  const norm = normalizeJoinCode(code)
  if (norm.length < 6) return null
  return queryOne<{ id: string; name: string }>(
    `SELECT id, name FROM organisations WHERE settings->>'joinCode' = $1`,
    [norm]
  )
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const limited = applyRateLimit(request, 'join-preview', RATE_LIMITS.api)
    if (limited) return limited

    const { code } = await params
    const org = await findOrgByCode(code)
    if (!org) return apiError('Code club invalide', 404)

    // Fiches non liées de ce club (le joueur choisit la sienne).
    const players = await queryMany<{ id: string; name: string }>(
      'SELECT id, name FROM joueurs WHERE org_id = $1 AND user_id IS NULL ORDER BY name',
      [org.id]
    )
    return apiSuccess({ clubName: org.name, players })
  } catch (error) {
    console.error('❌ join GET:', error)
    return apiError('Erreur lors de la lecture du code', 500)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    const limited = applyRateLimit(request, 'join-claim', RATE_LIMITS.write)
    if (limited) return limited

    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const { code } = await params
    const org = await findOrgByCode(code)
    if (!org) return apiError('Code club invalide', 404)

    const parsed = await parseJsonBody<{ joueurId?: string }>(request)
    if ('error' in parsed) return parsed.error
    const joueurId = parsed.data.joueurId
    if (!joueurId) return apiError('joueurId requis', 400)

    // La fiche doit appartenir à ce club (le code prouve l'appartenance).
    const joueur = await queryOne<{ id: string }>(
      'SELECT id FROM joueurs WHERE id = $1 AND org_id = $2',
      [joueurId, org.id]
    )
    if (!joueur) return apiError('Cette fiche n\'appartient pas à ce club', 400)

    await linkJoueurToUser(joueurId, user.id)
    return apiSuccess({ linked: true, joueur: { id: joueurId }, orgId: org.id })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'LINKED_TO_OTHER') return apiError('Cette fiche est déjà liée à un autre compte', 409)
    if (msg === 'ALREADY_HAS_PROFILE') return apiError('Tu as déjà une fiche dans ce club', 409)
    console.error('❌ join POST:', error)
    return apiError('Erreur lors de la liaison', 500)
  }
}
