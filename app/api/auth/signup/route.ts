// app/api/auth/signup/route.ts
// API d'inscription
// FIX BUG : avant ce fix, createUser() s'exécutait via le pool global et donc
// HORS de la transaction qui créait l'org + user_role. Si la création de l'org
// plantait, l'utilisateur restait orphelin en base. La logique de createUser
// est maintenant inlinée à l'intérieur de transaction() pour qu'un seul client
// PoolClient gère les 3 INSERTs ensemble (rollback complet en cas d'erreur).

import { NextRequest } from 'next/server'
import { hashPassword, generateToken } from '@/lib/auth'
import { transaction } from '@/lib/db'
import { apiError, apiSuccess, parseJsonBody } from '@/lib/middleware'
import { signupSchema, validateRequest } from '@/lib/validations'
import { applyRateLimit, RATE_LIMITS, resetRateLimit } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting: 3 créations de compte max par IP toutes les 60 minutes
  const rateLimitResponse = applyRateLimit(request, 'signup', RATE_LIMITS.signup)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const bodyResult = await parseJsonBody(request)

    if ('error' in bodyResult) {
      return bodyResult.error
    }

    const validation = validateRequest(signupSchema, bodyResult.data)
    if (!validation.success) {
      return apiError(validation.errors.join(', '), 400)
    }

    const { email, password, fullName, organizationName } = validation.data

    // Hash du mot de passe AVANT la transaction (opération CPU-bound, on
    // évite de tenir un client de pool pendant le bcrypt).
    const passwordHash = await hashPassword(password)

    const result = await transaction(async (client) => {
      // 1. Vérifier que l'email n'existe pas déjà (dans la transaction
      //    pour atomicité, même si l'index unique sur email est le vrai
      //    garde-fou).
      const existing = await client.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      )
      if (existing.rowCount && existing.rowCount > 0) {
        throw new Error('EMAIL_ALREADY_EXISTS')
      }

      // 2. Créer l'utilisateur
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, full_name, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, false, NOW(), NOW())
         RETURNING id, email, full_name, email_verified, created_at, last_login_at, metadata`,
        [email, passwordHash, fullName || null]
      )
      const user = userResult.rows[0]
      if (!user) {
        throw new Error('USER_CREATION_FAILED')
      }

      // 3. Créer l'organisation
      const orgName = organizationName || `Club de ${fullName || email.split('@')[0]}`
      const orgResult = await client.query(
        `INSERT INTO organisations (name, settings, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *`,
        [
          orgName,
          JSON.stringify({ db_version: '1.0', created_via: 'signup' }),
          user.id
        ]
      )
      const organisation = orgResult.rows[0]

      // 4. Créer le rôle owner (lien user <-> org)
      await client.query(
        `INSERT INTO user_roles (user_id, org_id, role, granted_by, granted_at)
         VALUES ($1, $2, 'owner', $1, NOW())`,
        [user.id, organisation.id]
      )

      // 5. Token JWT (peut être généré dans la transaction sans souci)
      const token = generateToken({
        userId: user.id,
        email: user.email
      })

      return { user, organisation, token }
    })

    // Inscription réussie : reset du rate limit pour cet IP
    resetRateLimit(request, 'signup')

    const response = apiSuccess({
      user: result.user,
      organisation: result.organisation,
      token: result.token,
      message: 'Compte créé avec succès'
    }, 201)

    response.cookies.set({
      name: 'auth-token',
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    })

    return response
  } catch (error: unknown) {
    console.error('❌ Erreur signup:', error)

    if (error instanceof Error && error.message === 'EMAIL_ALREADY_EXISTS') {
      return apiError('Cet email est déjà utilisé', 409)
    }

    return apiError('Erreur lors de la création du compte', 500)
  }
}
