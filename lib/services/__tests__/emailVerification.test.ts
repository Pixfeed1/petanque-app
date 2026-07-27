import { describe, it, expect } from 'vitest'
import { generateVerificationToken, isTokenStillValid } from '../emailVerification'

describe('emailVerification — logique pure', () => {
  it('génère un jeton url-safe, long et unique', () => {
    const a = generateVerificationToken()
    const b = generateVerificationToken()
    expect(a).not.toBe(b)
    expect(a.length).toBeGreaterThanOrEqual(32)
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/)
  })

  describe('isTokenStillValid', () => {
    it('valide si l’échéance est dans le futur', () => {
      expect(isTokenStillValid(new Date(Date.now() + 60000))).toBe(true)
    })
    it('invalide si expirée', () => {
      expect(isTokenStillValid(new Date(Date.now() - 60000))).toBe(false)
    })
    it('invalide si null/undefined', () => {
      expect(isTokenStillValid(null)).toBe(false)
      expect(isTokenStillValid(undefined)).toBe(false)
    })
    it('accepte une date ISO en string et respecte le paramètre now', () => {
      const exp = '2026-01-10T00:00:00.000Z'
      expect(isTokenStillValid(exp, new Date('2026-01-09T00:00:00Z'))).toBe(true)
      expect(isTokenStillValid(exp, new Date('2026-01-11T00:00:00Z'))).toBe(false)
    })
  })
})
