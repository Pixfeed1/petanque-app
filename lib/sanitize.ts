// lib/sanitize.ts
// Fonctions de sanitization pour prévenir les injections

/**
 * Sanitize une valeur pour l'export CSV/Excel
 *
 * Prévient les attaques par injection de formules (CSV Formula Injection)
 *
 * @example
 * Input:  "=1+1"
 * Output: "'=1+1"  (préfixé avec une apostrophe pour forcer le texte)
 *
 * @example
 * Input:  "@SUM(A1:A10)"
 * Output: "'@SUM(A1:A10)"
 *
 * Références:
 * - https://owasp.org/www-community/attacks/CSV_Injection
 * - https://www.contextis.com/en/blog/comma-separated-vulnerabilities
 */
export function sanitizeForCSV(value: string | null | undefined): string {
  if (!value) return ''

  const str = String(value).trim()

  // Caractères dangereux qui peuvent déclencher l'exécution de formules
  // dans Excel, LibreOffice Calc, Google Sheets, etc.
  const dangerousChars = ['=', '+', '-', '@', '\t', '\r', '\n']

  // Si la valeur commence par un caractère dangereux,
  // préfixer avec une apostrophe pour forcer l'interprétation comme texte
  if (dangerousChars.some(char => str.startsWith(char))) {
    return "'" + str.replace(/"/g, '""')  // Échapper aussi les guillemets
  }

  // Échapper les guillemets doubles pour la sécurité CSV standard
  return str.replace(/"/g, '""')
}

/**
 * Sanitize une valeur pour l'export Excel
 * Alias de sanitizeForCSV car la logique est identique
 */
export function sanitizeForExcel(value: string | null | undefined): string {
  return sanitizeForCSV(value)
}

/**
 * Sanitize un tableau de valeurs pour CSV
 */
export function sanitizeRowForCSV(row: (string | null | undefined)[]): string[] {
  return row.map(sanitizeForCSV)
}

/**
 * Nettoie une chaîne pour l'affichage en enlevant les caractères de contrôle
 * et les caractères invisibles qui pourraient causer des problèmes
 *
 * Utilisation: Nettoyer les noms avant affichage dans les PDFs
 */
export function cleanControlCharacters(value: string | null | undefined): string {
  if (!value) return ''

  return String(value)
    // Supprimer les caractères de contrôle (sauf newline/tab si nécessaire)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Supprimer les marqueurs de direction Unicode (LTR/RTL marks)
    .replace(/[\u200E\u200F\u202A-\u202E]/g, '')
    // Normaliser les espaces
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Valide qu'une chaîne ne contient que des caractères sûrs
 * pour les noms d'utilisateurs, tournois, équipes, etc.
 *
 * Autorisé: Lettres (tous alphabets), chiffres, espaces, tirets, apostrophes, points
 */
export function isValidName(value: string): boolean {
  if (!value || value.length === 0) return false
  if (value.length > 200) return false  // Limite raisonnable

  // Unicode-aware regex: lettres de tous alphabets + chiffres + caractères de ponctuation basiques
  const validNamePattern = /^[\p{L}\p{N}\s\-'.()]+$/u

  return validNamePattern.test(value)
}

/**
 * Sanitize une URL pour éviter les injections JavaScript
 *
 * @example
 * Input:  "javascript:alert(1)"
 * Output: ""
 *
 * @example
 * Input:  "https://example.com/path?query=value"
 * Output: "https://example.com/path?query=value"
 */
export function sanitizeURL(url: string | null | undefined): string {
  if (!url) return ''

  const str = String(url).trim().toLowerCase()

  // Bloquer les protocoles dangereux
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:']

  if (dangerousProtocols.some(protocol => str.startsWith(protocol))) {
    console.warn('⚠️ URL dangereuse bloquée:', url)
    return ''
  }

  // N'autoriser que http:, https: et les URLs relatives
  if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('/')) {
    return url.trim()
  }

  // Si pas de protocole, supposer que c'est une URL relative
  if (!str.includes(':')) {
    return url.trim()
  }

  console.warn('⚠️ URL avec protocole inconnu bloquée:', url)
  return ''
}

/**
 * Échapper les caractères HTML pour prévenir XSS
 * Note: React fait cela automatiquement, mais cette fonction
 * peut être utile pour les cas où on manipule du HTML brut
 */
export function escapeHTML(value: string | null | undefined): string {
  if (!value) return ''

  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Tronque une chaîne à une longueur maximale avec ellipse
 */
export function truncate(value: string | null | undefined, maxLength: number): string {
  if (!value) return ''

  const str = String(value)

  if (str.length <= maxLength) return str

  return str.substring(0, maxLength - 3) + '...'
}

/**
 * Sanitize un email pour l'affichage (protection anti-spam)
 *
 * @example
 * Input:  "user@example.com"
 * Output: "u***@example.com"
 */
export function sanitizeEmailForDisplay(email: string | null | undefined): string {
  if (!email) return ''

  const [localPart, domain] = email.split('@')

  if (!domain) return email  // Email invalide, retourner tel quel

  // Masquer tout sauf le premier caractère de la partie locale
  const maskedLocal = localPart.charAt(0) + '***'

  return `${maskedLocal}@${domain}`
}
