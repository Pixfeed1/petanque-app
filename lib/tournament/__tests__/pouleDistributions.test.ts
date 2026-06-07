/**
 * Tests des répartitions de poules proposées par le wizard.
 *
 * Garantit le contrat : une carte n'est affichée que si le générateur
 * (snakeDraftDistribution, qui crée ceil(n / pouleSize) poules) peut réellement
 * la produire — ce qui élimine au passage toute collision de pouleSize.
 */

import { describe, it, expect } from 'vitest'
import { computePouleDistributions } from '../pouleDistributions'

describe('computePouleDistributions — répartitions honnêtes et atteignables', () => {
  it('ne propose aucune répartition que le générateur ne peut pas produire (3..40 équipes)', () => {
    for (let n = 3; n <= 40; n++) {
      const dists = computePouleDistributions(n)
      expect(dists.length).toBeGreaterThan(0)
      for (const d of dists) {
        // snakeDraftDistribution crée ceil(n / pouleSize) poules : la carte doit y correspondre
        expect(Math.ceil(n / d.pouleSize)).toBe(d.nbPoules)
      }
    }
  })

  it('aucune collision de pouleSize entre cartes (sélection sans ambiguïté)', () => {
    for (let n = 3; n <= 40; n++) {
      const sizes = computePouleDistributions(n).map(d => d.pouleSize)
      expect(new Set(sizes).size).toBe(sizes.length)
    }
  })

  it('exactement une répartition recommandée par configuration', () => {
    for (let n = 3; n <= 40; n++) {
      expect(computePouleDistributions(n).filter(d => d.recommended).length).toBe(1)
    }
  })

  it('20 équipes : plus de "6 poules" fantôme, 5 poules de 4 recommandées', () => {
    const d = computePouleDistributions(20)
    expect(d.some(x => x.nbPoules === 6)).toBe(false) // inatteignable, retiré
    const rec = d.find(x => x.recommended)
    expect(rec?.nbPoules).toBe(5)
    expect(rec?.pouleSize).toBe(4)
  })
})
