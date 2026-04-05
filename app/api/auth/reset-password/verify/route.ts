import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import bcrypt from 'bcrypt'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token et mot de passe requis' },
        { status: 400 }
      )
    }

    // Valider la longueur du mot de passe
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // Vérifier le token
    const user = await queryOne(
      `SELECT id, email, full_name, reset_token_expires
       FROM users
       WHERE reset_token = $1`,
      [token]
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 400 }
      )
    }

    // Vérifier si le token n'est pas expiré
    const now = new Date()
    const expires = new Date(user.reset_token_expires)

    if (now > expires) {
      return NextResponse.json(
        { error: 'Token expiré. Veuillez demander un nouveau lien de réinitialisation.' },
        { status: 400 }
      )
    }

    // Hasher le nouveau mot de passe
    const passwordHash = await bcrypt.hash(password, 10)

    // Mettre à jour le mot de passe et supprimer le token
    await query(
      `UPDATE users
       SET password_hash = $1,
           reset_token = NULL,
           reset_token_expires = NULL,
           updated_at = NOW()
       WHERE id = $2`,
      [passwordHash, user.id]
    )

    return NextResponse.json({
      message: 'Mot de passe réinitialisé avec succès'
    })

  } catch (error) {
    console.error('Erreur vérification token reset:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la réinitialisation' },
      { status: 500 }
    )
  }
}
