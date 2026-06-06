export interface PouleDistribution {
  nbPoules: number
  pouleSize: number
  sizes: number[]
  label: string
  recommended: boolean
}

export function computePouleDistributions(nbEquipes: number): PouleDistribution[] {
  if (!nbEquipes || nbEquipes < 3) return []
  const dists: PouleDistribution[] = []
  const maxPoules = Math.floor(nbEquipes / 3)
  for (let P = 1; P <= maxPoules; P++) {
    const base = Math.floor(nbEquipes / P)
    const reste = nbEquipes % P
    const sizes: number[] = []
    for (let i = 0; i < P; i++) sizes.push(i < reste ? base + 1 : base)
    const pouleSize = Math.max(...sizes)
    const uniform = sizes.every((s) => s === sizes[0])
    let label: string
    if (P === 1) label = `1 poule de ${sizes[0]}`
    else if (uniform) label = `${P} poules de ${sizes[0]}`
    else label = `${P} poules (${reste} de ${base + 1}, ${P - reste} de ${base})`
    dists.push({ nbPoules: P, pouleSize, sizes, label, recommended: false })
  }
  let bestIdx = 0
  let bestScore = Infinity
  dists.forEach((d, i) => {
    const avg = nbEquipes / d.nbPoules
    let score = Math.abs(avg - 3.5)
    if (d.nbPoules === 1 && dists.length > 1) score += 5
    if (score < bestScore) { bestScore = score; bestIdx = i }
  })
  if (dists[bestIdx]) dists[bestIdx].recommended = true
  return dists
}
