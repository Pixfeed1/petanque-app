/**
 * Comptes joueurs : liaison d'une fiche joueur (org-scopée) à un compte utilisateur.
 *
 * Deux voies de liaison :
 *   1. Auto-liaison par email : à l'inscription/connexion, une fiche non liée dont
 *      l'email correspond à celui du compte est automatiquement rattachée.
 *   2. Invitation par jeton : l'organisateur génère un lien ; le joueur le suit,
 *      se connecte/s'inscrit, et sa fiche est rattachée.
 *
 * La logique pure (validation, normalisation) est isolée en haut du fichier pour
 * être testable sans base de données.
 */
import { randomBytes } from 'crypto'
import { query, queryMany, queryOne, transaction } from '@/lib/db'

// ─────────────────────────── Logique pure (testable) ───────────────────────────

/** Normalise un email pour comparaison (minuscules, sans espaces). */
export function normalizeEmail(email: string | null | undefined): string {
  return (email || '').trim().toLowerCase()
}

/** Deux emails désignent-ils le même compte ? (comparaison normalisée, non vide) */
export function emailsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeEmail(a)
  const nb = normalizeEmail(b)
  return na.length > 0 && na === nb
}

export interface InvitationLike {
  status: string
  expires_at: Date | string
}

/** Une invitation est-elle acceptable maintenant ? (en attente et non expirée) */
export function isInvitationValid(inv: InvitationLike | null | undefined, now: Date = new Date()): boolean {
  if (!inv) return false
  if (inv.status !== 'pending') return false
  const exp = inv.expires_at instanceof Date ? inv.expires_at : new Date(inv.expires_at)
  return exp.getTime() > now.getTime()
}

/** Génère un jeton d'invitation url-safe (non devinable). */
export function generateInviteToken(): string {
  return randomBytes(32).toString('base64url')
}

// ─────────────────────────── Accès base de données ───────────────────────────

export interface JoueurRow {
  id: string
  org_id: string
  name: string
  email: string | null
  user_id: string | null
}

/** Fiches joueurs liées à un utilisateur (toutes organisations confondues). */
export async function getLinkedJoueurs(userId: string): Promise<JoueurRow[]> {
  return queryMany<JoueurRow>(
    'SELECT id, org_id, name, email, user_id FROM joueurs WHERE user_id = $1 ORDER BY created_at',
    [userId]
  )
}

/** Compte utilisateur lié à une fiche (pour cibler une notification). NULL si non lié. */
export async function userIdForJoueur(joueurId: string): Promise<string | null> {
  const row = await queryOne<{ user_id: string | null }>(
    'SELECT user_id FROM joueurs WHERE id = $1',
    [joueurId]
  )
  return row?.user_id ?? null
}

/**
 * Lie une fiche à un utilisateur. Échoue proprement si :
 *  - la fiche est déjà liée à un AUTRE utilisateur (LINKED_TO_OTHER)
 *  - l'utilisateur a déjà une fiche dans cette organisation (ALREADY_HAS_PROFILE)
 * Idempotent si la fiche est déjà liée à ce même utilisateur.
 */
export async function linkJoueurToUser(joueurId: string, userId: string): Promise<void> {
  const joueur = await queryOne<JoueurRow>(
    'SELECT id, org_id, name, email, user_id FROM joueurs WHERE id = $1',
    [joueurId]
  )
  if (!joueur) throw new Error('JOUEUR_NOT_FOUND')
  if (joueur.user_id === userId) return // déjà lié à ce compte
  if (joueur.user_id) throw new Error('LINKED_TO_OTHER')

  const existing = await queryOne<{ id: string }>(
    'SELECT id FROM joueurs WHERE org_id = $1 AND user_id = $2',
    [joueur.org_id, userId]
  )
  if (existing) throw new Error('ALREADY_HAS_PROFILE')

  await query('UPDATE joueurs SET user_id = $1, updated_at = NOW() WHERE id = $2', [userId, joueurId])
}

/**
 * Auto-liaison à l'inscription/connexion : rattache les fiches non liées dont
 * l'email correspond à celui du compte, en respectant « une fiche par org ».
 * Retourne le nombre de fiches nouvellement rattachées.
 */
export async function autoLinkByEmail(userId: string, email: string): Promise<number> {
  const norm = normalizeEmail(email)
  if (!norm) return 0
  // Fiches candidates : email correspondant, non liées, et l'utilisateur n'a pas
  // déjà une fiche dans la même organisation.
  const candidates = await queryMany<JoueurRow>(
    `SELECT j.id, j.org_id, j.name, j.email, j.user_id
       FROM joueurs j
      WHERE j.user_id IS NULL
        AND LOWER(TRIM(j.email)) = $1
        AND NOT EXISTS (
          SELECT 1 FROM joueurs k WHERE k.org_id = j.org_id AND k.user_id = $2
        )`,
    [norm, userId]
  )
  let linked = 0
  const seenOrgs = new Set<string>()
  for (const c of candidates) {
    if (seenOrgs.has(c.org_id)) continue // au plus une fiche par org
    try {
      await query('UPDATE joueurs SET user_id = $1, updated_at = NOW() WHERE id = $2 AND user_id IS NULL', [userId, c.id])
      seenOrgs.add(c.org_id)
      linked++
    } catch { /* course/contrainte : on ignore cette fiche */ }
  }
  return linked
}

export interface InvitationRow extends InvitationLike {
  id: string
  joueur_id: string
  org_id: string
  email: string | null
  token: string
}

/**
 * Crée (ou remplace) l'invitation en attente d'une fiche et renvoie le jeton.
 * Une seule invitation « pending » par fiche (contrainte d'unicité partielle).
 */
export async function createInvitation(joueurId: string, createdBy: string): Promise<string> {
  const joueur = await queryOne<JoueurRow>(
    'SELECT id, org_id, name, email, user_id FROM joueurs WHERE id = $1',
    [joueurId]
  )
  if (!joueur) throw new Error('JOUEUR_NOT_FOUND')
  if (joueur.user_id) throw new Error('ALREADY_LINKED')

  const token = generateInviteToken()
  await transaction(async (client) => {
    await client.query(`UPDATE joueur_invitations SET status = 'revoked' WHERE joueur_id = $1 AND status = 'pending'`, [joueurId])
    await client.query(
      `INSERT INTO joueur_invitations (joueur_id, org_id, email, token, status, created_by)
       VALUES ($1, $2, $3, $4, 'pending', $5)`,
      [joueurId, joueur.org_id, joueur.email, token, createdBy]
    )
  })
  return token
}

/**
 * Accepte une invitation : valide le jeton puis lie la fiche à l'utilisateur, le
 * tout de façon atomique. Renvoie la fiche liée.
 * Erreurs : INVALID_INVITATION, LINKED_TO_OTHER, ALREADY_HAS_PROFILE.
 */
export async function acceptInvitation(token: string, userId: string): Promise<JoueurRow> {
  return transaction(async (client) => {
    const inv = (await client.query<InvitationRow>(
      'SELECT * FROM joueur_invitations WHERE token = $1 FOR UPDATE',
      [token]
    )).rows[0]
    if (!isInvitationValid(inv)) throw new Error('INVALID_INVITATION')

    const joueur = (await client.query<JoueurRow>(
      'SELECT id, org_id, name, email, user_id FROM joueurs WHERE id = $1 FOR UPDATE',
      [inv.joueur_id]
    )).rows[0]
    if (!joueur) throw new Error('INVALID_INVITATION')
    if (joueur.user_id && joueur.user_id !== userId) throw new Error('LINKED_TO_OTHER')

    if (!joueur.user_id) {
      const existing = (await client.query<{ id: string }>(
        'SELECT id FROM joueurs WHERE org_id = $1 AND user_id = $2',
        [joueur.org_id, userId]
      )).rows[0]
      if (existing) throw new Error('ALREADY_HAS_PROFILE')
      await client.query('UPDATE joueurs SET user_id = $1, updated_at = NOW() WHERE id = $2', [userId, joueur.id])
    }

    await client.query(
      `UPDATE joueur_invitations SET status = 'accepted', accepted_by = $1, accepted_at = NOW() WHERE id = $2`,
      [userId, inv.id]
    )
    return { ...joueur, user_id: userId }
  })
}
