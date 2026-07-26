// Génère (ou renvoie) une invitation pour lier une fiche joueur à un compte.
// Réservé aux membres de l'organisation du joueur (organisateurs).
import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError, checkOrgAccess } from '@/lib/middleware'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { queryOne } from '@/lib/db'
import { createInvitation } from '@/lib/services/playerAccounts'

function inviteUrl(request: NextRequest, token: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
  return `${base.replace(/\/$/, '')}/rejoindre/${token}`
}

// POST /api/joueurs/[id]/invite — crée une nouvelle invitation en attente.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const limited = applyRateLimit(request, 'joueur-invite', RATE_LIMITS.write)
    if (limited) return limited

    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const { id } = await params
    const joueur = await queryOne<{ org_id: string; user_id: string | null; name: string }>(
      'SELECT org_id, user_id, name FROM joueurs WHERE id = $1',
      [id]
    )
    if (!joueur) return apiError('Joueur introuvable', 404)

    const hasAccess = await checkOrgAccess(user.id, String(joueur.org_id))
    if (!hasAccess) return apiError('Accès refusé', 403)

    if (joueur.user_id) return apiError('Ce joueur a déjà un compte lié', 409)

    const token = await createInvitation(id, user.id)
    return apiSuccess({ token, url: inviteUrl(request, token), playerName: joueur.name })
  } catch (error) {
    if (error instanceof Error && error.message === 'ALREADY_LINKED') {
      return apiError('Ce joueur a déjà un compte lié', 409)
    }
    console.error('❌ joueur/invite:', error)
    return apiError('Erreur lors de la création de l\'invitation', 500)
  }
}
