/**
 * Vérification d'email : génération/validation de jeton d'activation.
 * Logique pure (token, validité) en haut, accès DB en dessous.
 */
import { randomBytes } from 'crypto'
import { query, queryOne } from '@/lib/db'

const TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 jours

/** Jeton d'activation url-safe non devinable. */
export function generateVerificationToken(): string {
  return randomBytes(32).toString('base64url')
}

/** Une échéance est-elle encore valide ? (pure, testable) */
export function isTokenStillValid(expires: Date | string | null | undefined, now: Date = new Date()): boolean {
  if (!expires) return false
  const e = expires instanceof Date ? expires : new Date(expires)
  return e.getTime() > now.getTime()
}

/** Crée et stocke un jeton d'activation pour un utilisateur. Renvoie le jeton. */
export async function issueVerificationToken(userId: string): Promise<string> {
  const token = generateVerificationToken()
  const expires = new Date(Date.now() + TTL_MS).toISOString()
  await query(
    'UPDATE users SET verification_token = $1, verification_token_expires = $2 WHERE id = $3',
    [token, expires, userId]
  )
  return token
}

/**
 * Valide un jeton : marque l'email vérifié et efface le jeton. Idempotent-friendly.
 * Retourne true si un compte a été activé, false si le jeton est inconnu/expiré.
 */
export async function consumeVerificationToken(token: string): Promise<boolean> {
  if (!token) return false
  const row = await queryOne<{ id: string; verification_token_expires: string | null }>(
    'SELECT id, verification_token_expires FROM users WHERE verification_token = $1',
    [token]
  )
  if (!row || !isTokenStillValid(row.verification_token_expires)) return false
  await query(
    'UPDATE users SET email_verified = true, email_verified_at = NOW(), verification_token = NULL, verification_token_expires = NULL WHERE id = $1',
    [row.id]
  )
  return true
}
