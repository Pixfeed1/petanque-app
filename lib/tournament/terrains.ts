/**
 * Terrains nommés — SAISIE LIBRE.
 *
 * L'organisateur nomme ses terrains comme il veut (« A », « 12 », « Boulodrome »,
 * « Platane »…). En interne, l'assignation reste numérique (index 1..N) ; on mappe
 * l'index vers le nom choisi pour l'affichage et l'impression. Aucun changement de
 * schéma (matches.terrain reste un entier = index dans la liste des terrains retenus).
 */

/** Suggestions rapides (facultatives) proposées dans l'UI — l'utilisateur reste libre. */
export const SUGGESTED_TERRAINS = ['A', 'B', 'C', 'D', '1', '2', '3', '4', '5', '6', '7', '8'] as const

/** Rétrocompat : ancien nom encore importé ailleurs. Ce ne sont que des suggestions. */
export const AVAILABLE_TERRAINS = SUGGESTED_TERRAINS

const MAX_TERRAINS = 60
const MAX_NAME_LEN = 24

/**
 * Normalise une liste de noms de terrains LIBRES : trim, longueur bornée, sans
 * doublon (comparaison insensible à la casse) et casse d'origine conservée.
 */
export function sanitizeTerrainNames(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const v of input) {
    const s = String(v).trim().slice(0, MAX_NAME_LEN)
    if (!s) continue
    const key = s.toUpperCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(s)
    if (out.length >= MAX_TERRAINS) break
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
