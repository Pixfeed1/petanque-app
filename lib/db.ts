// lib/db.ts
// Couche de connexion PostgreSQL centralisée

import { Pool, QueryResult, QueryResultRow, PoolClient } from 'pg'
import { SQLValue } from './types'

// Configuration du pool de connexions PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  database: process.env.POSTGRES_DATABASE || 'petanque',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || '',
  max: 20, // Maximum de connexions dans le pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// Gestion des erreurs de connexion
pool.on('error', (err) => {
  console.error('❌ Erreur PostgreSQL inattendue:', err)
  process.exit(-1)
})

// Test de connexion au démarrage
pool.on('connect', () => {
  console.log('✅ Connexion PostgreSQL établie')
})

/**
 * Exécute une requête SQL
 * @param text - Requête SQL avec placeholders $1, $2, etc.
 * @param params - Paramètres de la requête
 * @returns Résultat de la requête
 */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: SQLValue[]
): Promise<QueryResult<T>> {
  const start = Date.now()
  try {
    const res = await pool.query<T>(text, params)
    const duration = Date.now() - start

    // Log des requêtes en dev
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 SQL:', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        duration: `${duration}ms`,
        rows: res.rowCount
      })
    }

    return res
  } catch (error) {
    console.error('❌ Erreur SQL:', {
      error,
      text: text.substring(0, 100),
      params
    })
    throw error
  }
}

/**
 * Exécute une transaction
 * @param callback - Fonction contenant les requêtes de la transaction
 * @returns Résultat de la transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect()

  try {
    await client.query('BEGIN')
    const result = await callback(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

/**
 * Récupère une seule ligne
 */
export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: SQLValue[]
): Promise<T | null> {
  const result = await query<T>(text, params)
  return result.rows[0] || null
}

/**
 * Récupère plusieurs lignes
 */
export async function queryMany<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: SQLValue[]
): Promise<T[]> {
  const result = await query<T>(text, params)
  return result.rows
}

/**
 * Vérifie la connexion à la base de données
 */
export async function checkConnection(): Promise<boolean> {
  try {
    await query('SELECT NOW()')
    return true
  } catch (error) {
    console.error('❌ Impossible de se connecter à PostgreSQL:', error)
    return false
  }
}

/**
 * Ferme le pool de connexions (utile pour les tests)
 */
export async function closePool(): Promise<void> {
  await pool.end()
}

// Export du pool pour les cas avancés
export { pool }

// Export des types
export type { QueryResult } from 'pg'
