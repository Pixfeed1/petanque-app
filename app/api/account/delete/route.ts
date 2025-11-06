// app/api/account/delete/route.ts
// API pour supprimer/fermer un compte utilisateur

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { verifyToken } from '@/lib/auth'
import { serialize } from 'cookie'

export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authCookie = request.cookies.get('auth-token')

    if (!authCookie) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const decoded = verifyToken(authCookie.value)
    if (!decoded) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 })
    }

    const userId = parseInt(decoded.userId)

    console.log('🔵 [Suppression Compte] Utilisateur ID:', userId)

    // 1. Vérifier que l'utilisateur existe
    const user = await queryOne<any>(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    )

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
    }

    console.log('🔵 [Suppression Compte] Email:', user.email)

    // 2. Marquer le compte comme "à supprimer" au lieu de le supprimer immédiatement
    // Cela permet une récupération pendant 30 jours
    const deletionDate = new Date()
    deletionDate.setDate(deletionDate.getDate() + 30)

    await query(
      `UPDATE users
       SET metadata = jsonb_set(
         COALESCE(metadata, '{}'::jsonb),
         '{deletion_requested}',
         to_jsonb($2::timestamp),
         true
       ),
       metadata = jsonb_set(
         COALESCE(metadata, '{}'::jsonb),
         '{deletion_scheduled}',
         to_jsonb($3::timestamp),
         true
       )
       WHERE id = $1`,
      [userId, new Date().toISOString(), deletionDate.toISOString()]
    )

    console.log('✅ [Suppression Compte] Compte marqué pour suppression dans 30 jours')

    // 3. Déconnecter l'utilisateur
    const cookie = serialize('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    })

    const response = NextResponse.json({
      message: 'Compte fermé avec succès',
      deletion_date: deletionDate.toISOString(),
      recovery_instructions: 'Vous pouvez vous reconnecter dans les 30 prochains jours pour annuler la suppression.'
    })

    response.headers.set('Set-Cookie', cookie)

    return response

  } catch (error) {
    console.error('❌ [Suppression Compte] Erreur:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du compte' },
      { status: 500 }
    )
  }
}
