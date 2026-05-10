// app/api/auth/reset-password/verify/route.ts
// FIX SÉCURITÉ 1 : le token reçu de l'utilisateur est hashé en SHA-256
//   avant d'être comparé à la DB (qui stocke maintenant le hash).
// FIX SÉCURITÉ 2 : rate-limit sur cet endpoint pour empêcher le brute-force
//   d'un token (un attaquant ayant ciblé un compte ne peut plus tester
//   des millions de tokens).

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { applyRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  // Rate limiting: 5 tentatives par IP toutes les 15 minutes
  const rateLimitResponse = applyRateLimit(request, 'reset-verify', RATE_LIMITS.resetVerify)
  if (rateLimitResponse) return rateLimitResponse

  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: 'Token et mot de passe requis' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Le mot de passe doit contenir au moins 8 caractères' },
        { status: 400 }
      )
    }

    // FIX SÉCURITÉ : on cherche par hash, pas par token brut.
    // Le rawToken vient du lien email, le hash est en DB.
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const user = await queryOne(
      `SELECT id, email, full_name, reset_token_expires
       FROM users
       WHERE reset_token = $1`,
      [tokenHash]
    )

    if (!user) {
      return NextResponse.json(
        { error: 'Token invalide ou expiré' },
        { status: 400 }
      )
    }

    // Vérifier expiration
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

    // Mettre à jour le mot de passe et invalider le token (single-use)
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
