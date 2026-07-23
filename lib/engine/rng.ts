/**
 * Générateur pseudo-aléatoire À GRAINE (déterministe).
 *
 * Le moteur de règles libre doit être REJOUABLE : à graine égale, un même tournoi
 * produit exactement les mêmes tirages. C'est ce qui rend le moteur testable
 * automatiquement (on rejoue mille parties et on vérifie les invariants) et
 * incontestable côté organisateur (aucun tirage « au hasard » non reproductible).
 *
 * On n'utilise donc JAMAIS Math.random() dans le moteur : tout passe par ce RNG.
 * Algorithme mulberry32 : rapide, bonne répartition, état sur 32 bits.
 */
export class Rng {
  private state: number

  constructor(seed: number) {
    // Normaliser la graine sur 32 bits (>>> 0), en évitant 0 pur.
    this.state = (seed >>> 0) || 0x9e3779b9
  }

  /** Réel dans [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0
    let t = this.state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  /** Entier dans [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n)
  }

  /** Mélange Fisher-Yates déterministe (copie, ne mute pas l'entrée). */
  shuffle<T>(arr: readonly T[]): T[] {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = this.int(i + 1)
      ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }

  /** Dérive une graine reproductible à partir d'une chaîne (nom de tournoi, etc.). */
  static seedFromString(s: string): number {
    let h = 0x811c9dc5
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i)
      h = Math.imul(h, 0x01000193)
    }
    return h >>> 0
  }
}
