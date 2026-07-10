// lib/auth.ts
// Utilitaires d'authentification JWT

import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { query, queryOne } from './db'
import { SQLValue } from './types'

// Clé secrète JWT (OBLIGATOIRE dans .env)
const envSecret = process.env.JWT_SECRET

// Validation critique : JWT_SECRET doit être défini et sécurisé
if (!envSecret) {
  throw new Error(
    '❌ ERREUR FATALE: JWT_SECRET n\'est pas défini.\n' +
    'Définissez JWT_SECRET dans votre fichier .env\n' +
    'Exemple: JWT_SECRET=$(openssl rand -base64 32)'
  )
}

if (envSecret.length < 32) {
  throw new Error(
    '❌ ERREUR FATALE: JWT_SECRET doit contenir au moins 32 caractères.\n' +
    'Utilisez une clé forte: openssl rand -base64 32'
  )
}

// Type assertion after validation - we know it's defined and non-empty
const JWT_SECRET: string = envSecret

const JWT_EXPIRES_IN = '7d' // Token valide 7 jours

// Types TypeScript
export interface User {
  id: string
  email: string
  full_name: string | null
  email_verified: boolean
  created_at: Date
  last_login_at: Date | null
  metadata: Record<string, unknown> | null
}

export interface JWTPayload {
  userId: string
  email: string
  iat?: number
  exp?: number
}

export interface AuthSession {
  user: User
  token: string
}

/**
 * Hash un mot de passe avec bcrypt
 * @param password - Mot de passe en clair
 * @returns Hash du mot de passe
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10
  return await bcrypt.hash(password, saltRounds)
}

/**
 * Vérifie un mot de passe contre son hash
 * @param password - Mot de passe en clair
 * @param hash - Hash stocké en BDD
 * @returns True si le mot de passe correspond
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash)
}

/**
 * Génère un token JWT
 * @param payload - Données à encoder dans le token
 * @returns Token JWT
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  })
}

/**
 * Vérifie et décode un token JWT
 * @param token - Token JWT à vérifier
 * @returns Payload du token ou null si invalide
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload
    return decoded
  } catch (error) {
    return null
  }
}

/**
 * Crée un nouvel utilisateur
 * @param email - Email de l'utilisateur
 * @param password - Mot de passe en clair
 * @param fullName - Nom complet (optionnel)
 * @returns Utilisateur créé
 */
export async function createUser(
  email: string,
  password: string,
  fullName?: string
): Promise<User> {
  // Vérifier si l'email existe déjà
  const existing = await queryOne<User>(
    'SELECT id FROM users WHERE email = $1',
    [email]
  )

  if (existing) {
    throw new Error('EMAIL_ALREADY_EXISTS')
  }

  // Hash du mot de passe
  const passwordHash = await hashPassword(password)

  // Insérer l'utilisateur
  const user = await queryOne<User>(
    `INSERT INTO users (email, password_hash, full_name, email_verified, created_at, updated_at)
     VALUES ($1, $2, $3, false, NOW(), NOW())
     RETURNING id, email, full_name, email_verified, created_at, last_login_at, metadata`,
    [email, passwordHash, fullName || null]
  )

  if (!user) {
    throw new Error('USER_CREATION_FAILED')
  }

  return user
}

/**
 * Authentifie un utilisateur
 * @param email - Email de l'utilisateur
 * @param password - Mot de passe en clair
 * @returns Session avec utilisateur et token
 */
export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthSession> {
  // Récupérer l'utilisateur et son hash.
  // FIX : comparaison insensible à la casse — le reset password normalisait
  // déjà l'email en minuscules, mais le login comparait en respectant la casse,
  // rendant certains comptes (email en majuscules) incohérents.
  const user = await queryOne<User & { password_hash: string }>(
    'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
    [email]
  )

  if (!user) {
    throw new Error('INVALID_CREDENTIALS')
  }

  // Vérifier le mot de passe
  const isValid = await verifyPassword(password, user.password_hash)

  if (!isValid) {
    throw new Error('INVALID_CREDENTIALS')
  }

  // Mettre à jour last_login_at
  await query(
    'UPDATE users SET last_login_at = NOW() WHERE id = $1',
    [user.id]
  )

  // Générer le token
  const token = generateToken({
    userId: user.id,
    email: user.email
  })

  // Retirer le password_hash de l'objet user
  const { password_hash, ...userWithoutPassword } = user

  return {
    user: userWithoutPassword as User,
    token
  }
}

/**
 * Récupère un utilisateur par son ID
 * @param userId - ID de l'utilisateur
 * @returns Utilisateur ou null
 */
export async function getUserById(userId: string): Promise<User | null> {
  return await queryOne<User>(
    `SELECT id, email, full_name, email_verified, created_at, last_login_at, metadata
     FROM users WHERE id = $1`,
    [userId]
  )
}

/**
 * Récupère un utilisateur par son email
 * @param email - Email de l'utilisateur
 * @returns Utilisateur ou null
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return await queryOne<User>(
    `SELECT id, email, full_name, email_verified, created_at, last_login_at, metadata
     FROM users WHERE email = $1`,
    [email]
  )
}

/**
 * Met à jour le profil utilisateur
 * @param userId - ID de l'utilisateur
 * @param updates - Champs à mettre à jour
 */
export async function updateUser(
  userId: string,
  updates: {
    full_name?: string
    email_verified?: boolean
    metadata?: Record<string, unknown>
  }
): Promise<User | null> {
  const fields: string[] = []
  const values: SQLValue[] = []
  let paramIndex = 1

  if (updates.full_name !== undefined) {
    fields.push(`full_name = $${paramIndex++}`)
    values.push(updates.full_name)
  }

  if (updates.email_verified !== undefined) {
    fields.push(`email_verified = $${paramIndex++}`)
    values.push(updates.email_verified)
  }

  if (updates.metadata !== undefined) {
    fields.push(`metadata = $${paramIndex++}`)
    values.push(JSON.stringify(updates.metadata))
  }

  if (fields.length === 0) {
    return await getUserById(userId)
  }

  fields.push(`updated_at = NOW()`)
  values.push(userId)

  const user = await queryOne<User>(
    `UPDATE users SET ${fields.join(', ')}
     WHERE id = $${paramIndex}
     RETURNING id, email, full_name, email_verified, created_at, last_login_at, metadata`,
    values
  )

  return user
}

// NOTE : les anciennes fonctions generateResetToken()/resetPassword() ont été
// retirées. Elles étaient inutilisées ET incohérentes avec le flux réel : elles
// stockaient un JWT brut dans reset_token et le comparaient via verifyToken,
// alors que les routes /api/auth/reset-password stockent un hash SHA-256 à usage
// unique. Les garder exposait au risque de les rebrancher par erreur.

/**
 * Change le mot de passe d'un utilisateur connecté
 * @param userId - ID de l'utilisateur
 * @param currentPassword - Mot de passe actuel
 * @param newPassword - Nouveau mot de passe
 */
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  // Récupérer le hash actuel
  const user = await queryOne<{ password_hash: string }>(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  )

  if (!user) {
    throw new Error('USER_NOT_FOUND')
  }

  // Vérifier le mot de passe actuel
  const isValid = await verifyPassword(currentPassword, user.password_hash)

  if (!isValid) {
    throw new Error('INVALID_CURRENT_PASSWORD')
  }

  // Hash du nouveau mot de passe
  const passwordHash = await hashPassword(newPassword)

  // Mettre à jour
  await query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, userId]
  )
}
