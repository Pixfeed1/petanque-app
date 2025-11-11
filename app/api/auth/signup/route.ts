// app/api/auth/signup/route.ts
// API d'inscription

import { NextRequest, NextResponse } from 'next/server'
import { createUser, generateToken } from '@/lib/auth'
import { query, transaction } from '@/lib/db'
import { apiError, apiSuccess, parseJsonBody } from '@/lib/middleware'
import { signupSchema, validateRequest } from '@/lib/validations'

export async function POST(request: NextRequest) {
  try {
    // Parse le body
    const bodyResult = await parseJsonBody(request)

    if ('error' in bodyResult) {
      return bodyResult.error
    }

    // Validation Zod
    const validation = validateRequest(signupSchema, bodyResult.data)
    if (!validation.success) {
      return apiError(validation.errors.join(', '), 400)
    }

    const { email, password, fullName, organizationName } = validation.data

    // Transaction pour créer l'utilisateur ET son organisation
    const result = await transaction(async (client) => {
      // 1. Créer l'utilisateur
      const user = await createUser(email, password, fullName)

      // 2. Créer l'organisation
      const orgName = organizationName || `Club de ${fullName || email.split('@')[0]}`

      const orgResult = await client.query(
        `INSERT INTO organisations (name, settings, created_by, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING *`,
        [
          orgName,
          JSON.stringify({ plan: 'free', db_version: '1.0', created_via: 'signup' }),
          user.id
        ]
      )

      const organisation = orgResult.rows[0]

      // 3. Créer le rôle owner
      await client.query(
        `INSERT INTO user_roles (user_id, org_id, role, granted_by, granted_at)
         VALUES ($1, $2, 'owner', $1, NOW())`,
        [user.id, organisation.id]
      )

      // 4. Générer le token
      const token = generateToken({
        userId: user.id,
        email: user.email
      })

      return {
        user,
        organisation,
        token
      }
    })

    // Créer la réponse avec le cookie
    const response = apiSuccess({
      user: result.user,
      organisation: result.organisation,
      token: result.token,
      message: 'Compte créé avec succès'
    }, 201)

    // Définir le cookie avec le token
    // sameSite: 'strict' pour protection CSRF maximale
    response.cookies.set({
      name: 'auth-token',
      value: result.token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Protection CSRF renforcée
      maxAge: 7 * 24 * 60 * 60, // 7 jours
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
