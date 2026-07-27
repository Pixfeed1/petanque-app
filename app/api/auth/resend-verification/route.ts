// Renvoie l'email d'activation à l'utilisateur connecté (s'il n'est pas déjà vérifié).
import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { queryOne } from '@/lib/db'
import { issueVerificationToken } from '@/lib/services/emailVerification'
import { sendVerificationEmail } from '@/lib/server/mailer'

export async function POST(request: NextRequest) {
  try {
    const limited = applyRateLimit(request, 'resend-verification', RATE_LIMITS.resetPassword)
    if (limited) return limited

    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    if (user.email_verified) return apiSuccess({ alreadyVerified: true })

    const token = await issueVerificationToken(user.id)
    try {
      await sendVerificationEmail(user.email, token, user.full_name || undefined)
    } catch (e) {
      console.error('resend verification mail:', e)
      return apiError('Envoi de l\'email impossible pour le moment', 502)
    }
    return apiSuccess({ sent: true })
  } catch (error) {
    console.error('❌ resend-verification:', error)
    return apiError('Erreur lors du renvoi de l\'email', 500)
  }
}
