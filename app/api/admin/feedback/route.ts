// app/api/admin/feedback/route.ts
// Gestion des feedbacks côté admin

import { NextRequest } from 'next/server'
import { requireAdmin, apiSuccess, apiError, parseJsonBody } from '@/lib/middleware'
import { queryMany, queryOne, query } from '@/lib/db'

// GET : lister tous les feedbacks (avec filtres)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof Response) return authResult

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'all'
    const userEmail = searchParams.get('user_email')

    let sql = `
      SELECT f.*, u.full_name as user_full_name
      FROM feedback f
      LEFT JOIN users u ON u.id = f.user_id
    `
    const conditions: string[] = []
    const params: any[] = []

    if (status !== 'all') {
      params.push(status)
      conditions.push(`f.status = $${params.length}`)
    }

    if (userEmail) {
      params.push(userEmail)
      conditions.push(`f.user_email = $${params.length}`)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    sql += ' ORDER BY f.created_at DESC LIMIT 100'

    const feedbacks = await queryMany(sql, params)

    // Stats
    const stats = await queryOne<{ total: string; new_count: string; read_count: string; replied_count: string }>(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'new') as new_count,
        COUNT(*) FILTER (WHERE status = 'read') as read_count,
        COUNT(*) FILTER (WHERE status = 'replied') as replied_count
      FROM feedback
    `)

    return apiSuccess({
      feedbacks,
      stats: {
        total: parseInt(stats?.total || '0'),
        new: parseInt(stats?.new_count || '0'),
        read: parseInt(stats?.read_count || '0'),
        replied: parseInt(stats?.replied_count || '0')
      }
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/admin/feedback:', error)
    return apiError('Erreur serveur', 500)
  }
}

// PUT : répondre à un feedback
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    const bodyResult = await parseJsonBody<{
      feedback_id: number
      admin_reply?: string
      status?: string
    }>(request)
    if ('error' in bodyResult) return bodyResult.error

    const { feedback_id, admin_reply, status } = bodyResult.data

    if (!feedback_id) {
      return apiError('feedback_id requis', 400)
    }

    if (admin_reply) {
      // Répondre au feedback
      await query(
        `UPDATE feedback
         SET admin_reply = $1, admin_replied_at = NOW(), admin_replied_by = $2, status = 'replied'
         WHERE id = $3`,
        [admin_reply.trim(), user.id, feedback_id]
      )
    } else if (status) {
      // Changer le statut (read, archived...)
      await query(
        `UPDATE feedback SET status = $1 WHERE id = $2`,
        [status, feedback_id]
      )
    }

    return apiSuccess({ updated: true })
  } catch (error) {
    console.error('❌ Erreur PUT /api/admin/feedback:', error)
    return apiError('Erreur serveur', 500)
  }
}
