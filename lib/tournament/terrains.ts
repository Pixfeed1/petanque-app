/**
 * Terrains nommés.
 *
 * Les terrains physiques du club ont des noms fixes (lettres et chiffres). En
 * interne, l'assignation reste numérique (index 1..N) ; on mappe l'index vers le
 * nom choisi pour l'affichage et l'impression. Pas de changement de schéma
 * (matches.terrain reste un entier = index dans la liste des terrains retenus).
 */

/** Terrains disponibles du club, dans l'ordre d'affichage. */
export const AVAILABLE_TERRAINS = ['A', 'B', 'C', '3', '4', '5', '6', '7', '8', '9'] as const

/** Filtre/normalise une liste de noms de terrains vers l'ensemble autorisé, sans doublon. */
export function sanitizeTerrainNames(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const allowed = new Set<string>(AVAILABLE_TERRAINS)
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of input) {
    const s = String(v).trim().toUpperCase()
    if (allowed.has(s) && !seen.has(s)) {
      seen.add(s)
      out.push(s)
    }
  }
  return out
}

/**
 * Nom d'un terrain à partir de son index (1-based) et de la liste des terrains
 * retenus. Repli propre sur le numéro si aucun nom n'est défini (rétrocompat).
 */
export function terrainLabel(
  index: number | null | undefined,
  terrainNames?: string[] | null
): string {
  if (index == null) return '—'
  if (terrainNames && terrainNames.length >= index && terrainNames[index - 1]) {
    return terrainNames[index - 1]
  }
  return String(index)
}
