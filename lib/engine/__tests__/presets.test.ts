import { describe, it, expect } from 'vitest'
import { presetMeleeFixe, presetMeleeTournante, presetNParties } from '../presets'
import { simulate, makePlayers, checkInvariants } from '../simulate'

describe('presets = configs du moteur (les modes actuels sont des cas particuliers)', () => {
  it('mêlée fixe (poules → élim) : classement par équipe, invariants OK', () => {
    const cfg = presetMeleeFixe({ teamSize: 2, pouleSize: 4, qualifiedPerPoule: 2, petiteFinale: true, seed: 4 })
    const ps = makePlayers(16, 4)
    const res = simulate(cfg, ps)
    expect(res.individual).toBe(false)
    expect(checkInvariants(res, ps).ok).toBe(true)
  })

  it('mêlée tournante : classement individuel, tous les joueurs classés', () => {
    const cfg = presetMeleeTournante({ teamSize: 2, rounds: 4, seed: 7 })
    const ps = makePlayers(12, 7)
    const res = simulate(cfg, ps)
    expect(res.individual).toBe(true)
    expect(res.ranking).toHaveLength(12)
    expect(checkInvariants(res, ps).ok).toBe(true)
  })

  it('fair-play plafonne l’écart de points', () => {
    const cfg = presetNParties({ teamSize: 2, fairPlay: true, seed: 2 })
    expect(cfg.scoring.capDiff).toBe(5)
  })

  it('équilibrage par niveau bascule la formation en « balanced »', () => {
    expect(presetMeleeFixe({ equilibrageNiveau: true }).formation.method).toBe('balanced')
    // ...sauf en mêlée tournante (recomposée) où la méthode reste remixed.
    expect(presetMeleeTournante({ equilibrageNiveau: true }).formation.method).toBe('remixed')
  })

  it('N parties : nombre de manches respecté', () => {
    const cfg = presetNParties({ rounds: 3, seed: 1 })
    const ps = makePlayers(8, 1)
    const res = simulate(cfg, ps)
    const rounds = new Set(res.matches.map(m => m.round))
    expect(rounds.size).toBe(3)
  })
})
