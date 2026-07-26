// Invitation par jeton :
//   GET  — aperçu public (nom du joueur + club) pour afficher la page « Rejoindre »
//   POST — acceptation par l'utilisateur connecté (lie la fiche à son compte)
import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { queryOne } from '@/lib/db'
import { acceptInvitation, isInvitationValid } from '@/lib/services/playerAccounts'

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const limited = applyRateLimit(request, 'invite-preview', RATE_LIMITS.api)
    if (limited) return limited

    const { token } = await params
    const row = await queryOne<{
      status: string; expires_at: string; joueur_name: string; org_name: string; already_linked: boolean
    }>(
      `SELECT i.status, i.expires_at, j.name AS joueur_name, o.name AS org_name,
              (j.user_id IS NOT NULL) AS already_linked
         FROM joueur_invitations i
         JOIN joueurs j ON j.id = i.joueur_id
         JOIN organisations o ON o.id = i.org_id
        WHERE i.token = $1`,
      [token]
    )
    if (!row) return apiError('Invitation introuvable', 404)
    const valid = isInvitationValid({ status: row.status, expires_at: row.expires_at }) && !row.already_linked
    return apiSuccess({
      valid,
      playerName: row.joueur_name,
      clubName: row.org_name,
      alreadyLinked: row.already_linked,
    })
  } catch (error) {
    console.error('❌ invitation GET:', error)
    return apiError('Erreur lors de la lecture de l\'invitation', 500)
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const limited = applyRateLimit(request, 'invite-accept', RATE_LIMITS.write)
    if (limited) return limited

    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const { token } = await params
    const joueur = await acceptInvitation(token, user.id)
    return apiSuccess({ linked: true, joueur: { id: joueur.id, name: joueur.name, orgId: joueur.org_id } })
  } catch (error) {
    const msg = error instanceof Error ? error.message : ''
    if (msg === 'INVALID_INVITATION') return apiError('Invitation invalide ou expirée', 410)
    if (msg === 'LINKED_TO_OTHER') return apiError('Cette fiche est déjà liée à un autre compte', 409)
    if (msg === 'ALREADY_HAS_PROFILE') return apiError('Tu as déjà une fiche dans ce club', 409)
    console.error('❌ invitation POST:', error)
    return apiError('Erreur lors de l\'acceptation de l\'invitation', 500)
  }
}
