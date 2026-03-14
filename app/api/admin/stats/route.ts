// app/api/admin/stats/route.ts
// API admin - statistiques globales

import { NextRequest } from 'next/server'
import { requireAdmin, apiSuccess, apiError } from '@/lib/middleware'
import { queryOne, queryMany } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (authResult instanceof Response) return authResult

    // Stats globales en parallèle
    const [
      usersStats,
      tournoisStats,
      plansStats,
      recentUsers,
      recentTournois,
      topOrgs
    ] = await Promise.all([
      // Nombre total d'utilisateurs + inscrits aujourd'hui / cette semaine / ce mois
      queryOne<{
        total: string
        today: string
        this_week: string
        this_month: string
      }>(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as this_week,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as this_month
        FROM users
      `),

      // Stats tournois
      queryOne<{
        total: string
        en_cours: string
        preparation: string
        termine: string
        today: string
        this_month: string
      }>(`
        SELECT
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE status = 'en_cours') as en_cours,
          COUNT(*) FILTER (WHERE status = 'preparation') as preparation,
          COUNT(*) FILTER (WHERE status = 'termine') as termine,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as today,
          COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as this_month
        FROM tournois
      `),

      // Répartition des plans
      queryMany(`
        SELECT
          COALESCE(settings->>'plan', 'free') as plan,
          COUNT(*) as count
        FROM organisations
        GROUP BY COALESCE(settings->>'plan', 'free')
        ORDER BY count DESC
      `),

      // 20 derniers utilisateurs inscrits
      queryMany(`
        SELECT
          u.id, u.email, u.full_name, u.created_at, u.last_login_at,
          o.name as org_name,
          COALESCE(o.settings->>'plan', 'free') as plan,
          (SELECT COUNT(*) FROM tournois t WHERE t.org_id = o.id) as nb_tournois
        FROM users u
        LEFT JOIN user_roles ur ON ur.user_id = u.id
        LEFT JOIN organisations o ON o.id = ur.org_id
        ORDER BY u.created_at DESC
        LIMIT 20
      `),

      // 20 derniers tournois créés
      queryMany(`
        SELECT
          t.id, t.name, t.format, t.mode, t.status, t.created_at,
          o.name as org_name,
          u.email as created_by_email,
          u.full_name as created_by_name,
          (SELECT COUNT(*) FROM equipes e WHERE e.tournoi_id = t.id) as nb_equipes,
          (SELECT COUNT(*) FROM matches m WHERE m.tournoi_id = t.id) as nb_matchs
        FROM tournois t
        LEFT JOIN organisations o ON o.id = t.org_id
        LEFT JOIN users u ON u.id = t.created_by
        ORDER BY t.created_at DESC
        LIMIT 20
      `),

      // Top organisations (par nombre de tournois)
      queryMany(`
        SELECT
          o.id, o.name,
          COALESCE(o.settings->>'plan', 'free') as plan,
          COUNT(t.id) as nb_tournois,
          u.email as owner_email,
          o.created_at
        FROM organisations o
        LEFT JOIN tournois t ON t.org_id = o.id
        LEFT JOIN user_roles ur ON ur.org_id = o.id AND ur.role = 'owner'
        LEFT JOIN users u ON u.id = ur.user_id
        GROUP BY o.id, o.name, o.settings, o.created_at, u.email
        ORDER BY nb_tournois DESC
        LIMIT 10
      `)
    ])

    return apiSuccess({
      users: {
        total: parseInt(usersStats?.total || '0'),
        today: parseInt(usersStats?.today || '0'),
        thisWeek: parseInt(usersStats?.this_week || '0'),
        thisMonth: parseInt(usersStats?.this_month || '0'),
      },
      tournois: {
        total: parseInt(tournoisStats?.total || '0'),
        enCours: parseInt(tournoisStats?.en_cours || '0'),
        preparation: parseInt(tournoisStats?.preparation || '0'),
        termine: parseInt(tournoisStats?.termine || '0'),
        today: parseInt(tournoisStats?.today || '0'),
        thisMonth: parseInt(tournoisStats?.this_month || '0'),
      },
      plans: plansStats.map((p: any) => ({
        plan: p.plan,
        count: parseInt(p.count)
      })),
      recentUsers,
      recentTournois,
      topOrgs
    })
  } catch (error) {
    console.error('❌ Erreur GET /api/admin/stats:', error)
    return apiError('Erreur lors de la récupération des statistiques admin', 500)
  }
}
