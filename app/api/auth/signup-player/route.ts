// Inscription d'un JOUEUR : crée un compte utilisateur SANS organisation.
// Utilisé par la page « Rejoindre » (invitation) : le joueur crée son compte puis
// sa fiche est liée. Il ne devient pas organisateur (aucune org, aucun user_role).
import { NextRequest } from 'next/server'
import { hashPassword, generateToken } from '@/lib/auth'
import { queryOne } from '@/lib/db'
import { apiError, apiSuccess, parseJsonBody } from '@/lib/middleware'
import { signupPlayerSchema, validateRequest } from '@/lib/validations'
import { applyRateLimit, RATE_LIMITS, resetRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  const rateLimitResponse = applyRateLimit(request, 'signup', RATE_LIMITS.signup)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const bodyResult = await parseJsonBody(request)
    if ('error' in bodyResult) return bodyResult.error

    const validation = validateRequest(signupPlayerSchema, bodyResult.data)
    if (!validation.success) return apiError(validation.errors.join(', '), 400)

    const { password, fullName } = validation.data
    const email = validation.data.email.toLowerCase().trim()
    const passwordHash = await hashPassword(password)

    const existing = await queryOne<{ id: string }>('SELECT id FROM users WHERE LOWER(email) = $1', [email])
    if (existing) return apiError('Cet email est déjà utilisé', 409)

    const user = await queryOne<{ id: string; email: string; full_name: string | null }>(
      `INSERT INTO users (email, password_hash, full_name, email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, false, NOW(), NOW())
       RETURNING id, email, full_name`,
      [email, passwordHash, fullName]
    )
    if (!user) return apiError('Erreur lors de la création du compte', 500)

    // Auto-liaison des fiches dont l'email correspond (best-effort).
    try {
      const { autoLinkByEmail } = await import('@/lib/services/playerAccounts')
      await autoLinkByEmail(user.id, user.email)
    } catch (e) {
      console.error('auto-link joueur (signup-player, non bloquant):', e)
    }

    // Email d'activation (best-effort).
    try {
      const { issueVerificationToken } = await import('@/lib/services/emailVerification')
      const { sendVerificationEmail } = await import('@/lib/server/mailer')
      const token = await issueVerificationToken(user.id)
      await sendVerificationEmail(user.email, token, user.full_name || undefined)
    } catch (e) {
      console.error('email activation (signup-player, non bloquant):', e)
    }

    resetRateLimit(request, 'signup')
    const token = generateToken({ userId: user.id, email: user.email })
    const response = apiSuccess({ user: { id: user.id, email: user.email, full_name: user.full_name }, token }, 201)
    response.cookies.set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('❌ signup-player:', error)
    return apiError('Erreur lors de la création du compte', 500)
  }
}
