// app/api/auth/account/route.ts
// Suppression définitive du compte utilisateur + données associées (RGPD / exigence Google Play).
//
// Modèle centré organisation : les tournois/joueurs appartiennent au club (org), pas
// directement au user. La suppression est donc :
//   1. On supprime chaque club dont l'utilisateur est le SEUL membre → cascade sur
//      tournois, équipes, matches et joueurs de ce club (données personnelles du solo).
//   2. On supprime le user → CASCADE sur user_roles, push_subscriptions, payment_attempts ;
//      SET NULL sur reviews, feedback, joueurs.user_id, organisations/tournois.created_by
//      (les clubs PARTAGÉS survivent, on retire seulement ce membre).
// Le tout dans une transaction : soit tout part, soit rien.

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/middleware'
import { transaction } from '@/lib/db'

export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (authResult instanceof Response) return authResult
  const { user } = authResult

  try {
    await transaction(async (client) => {
      // Clubs où cet utilisateur est le SEUL membre → suppression complète (cascade).
      await client.query(
        `DELETE FROM organisations o
         WHERE o.id IN (SELECT org_id FROM user_roles WHERE user_id = $1)
           AND NOT EXISTS (
             SELECT 1 FROM user_roles ur
             WHERE ur.org_id = o.id AND ur.user_id <> $1
           )`,
        [user.id]
      )

      // Suppression du compte : CASCADE (rôles, abonnements push, paiements) +
      // SET NULL (avis, feedback, fiches joueur, clubs partagés restants).
      await client.query('DELETE FROM users WHERE id = $1', [user.id])
    })
  } catch (error) {
    console.error('❌ Erreur suppression compte:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du compte' },
      { status: 500 }
    )
  }

  // Compte supprimé → on invalide la session (cookie httpOnly).
  const response = NextResponse.json({ message: 'Compte supprimé' })
  response.cookies.set({
    name: 'auth-token',
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/',
  })
  return response
}
