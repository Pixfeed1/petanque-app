// app/api/organisations/route.ts
// API pour gérer les organisations

import { NextRequest } from 'next/server'
import { requireAuth, apiSuccess, apiError } from '@/lib/middleware'
import { queryMany, query } from '@/lib/db'

// GET - Récupérer les organisations de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult

    // Récupérer toutes les organisations dont l'utilisateur fait partie
    const organisations = await queryMany(
      `SELECT o.*, ur.role
       FROM organisations o
       JOIN user_roles ur ON ur.org_id = o.id
       WHERE ur.user_id = $1
       ORDER BY o.created_at DESC`,
      [user.id]
    )

    return apiSuccess(organisations)
  } catch (error) {
    console.error('❌ Erreur GET /api/organisations:', error)
    return apiError('Erreur lors de la récupération des organisations', 500)
  }
}

// POST - Créer une nouvelle organisation
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(request)
    if (authResult instanceof Response) return authResult

    const { user } = authResult
    const body = await request.json()

    const { name, settings } = body

    if (!name) {
      return apiError('Le nom de l\'organisation est requis', 400)
    }

    // Créer l'organisation
    const result = await query(
      `INSERT INTO organisations (name, settings, created_by, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       RETURNING *`,
      [name, JSON.stringify(settings || { plan: 'free' }), user.id]
    )

    const organisation = result.rows[0]

    // Créer le rôle owner pour l'utilisateur
    await query(
      `INSERT INTO user_roles (user_id, org_id, role, granted_by, granted_at)
       VALUES ($1, $2, 'owner', $1, NOW())`,
      [user.id, organisation.id]
    )

    return apiSuccess(organisation, 201)
  } catch (error) {
    console.error('❌ Erreur POST /api/organisations:', error)
    return apiError('Erreur lors de la création de l\'organisation', 500)
  }
}
