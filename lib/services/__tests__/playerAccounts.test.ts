import { describe, it, expect } from 'vitest'
import {
  normalizeEmail,
  emailsMatch,
  isInvitationValid,
  generateInviteToken,
  generateJoinCode,
  normalizeJoinCode,
} from '../playerAccounts'

describe('playerAccounts — logique pure', () => {
  describe('normalizeEmail', () => {
    it('met en minuscules et retire les espaces', () => {
      expect(normalizeEmail('  Marc@Petanque.FR ')).toBe('marc@petanque.fr')
    })
    it('gère null/undefined/vide', () => {
      expect(normalizeEmail(null)).toBe('')
      expect(normalizeEmail(undefined)).toBe('')
      expect(normalizeEmail('   ')).toBe('')
    })
  })

  describe('emailsMatch', () => {
    it('vrai pour deux emails équivalents (casse/espaces)', () => {
      expect(emailsMatch('Marc@x.fr', ' marc@x.fr ')).toBe(true)
    })
    it('faux si différents', () => {
      expect(emailsMatch('a@x.fr', 'b@x.fr')).toBe(false)
    })
    it('faux si l’un est vide (pas de liaison sur email absent)', () => {
      expect(emailsMatch('', '')).toBe(false)
      expect(emailsMatch(null, 'a@x.fr')).toBe(false)
    })
  })

  describe('isInvitationValid', () => {
    const future = new Date(Date.now() + 86400000)
    const past = new Date(Date.now() - 86400000)

    it('valide si en attente et non expirée', () => {
      expect(isInvitationValid({ status: 'pending', expires_at: future })).toBe(true)
    })
    it('invalide si expirée', () => {
      expect(isInvitationValid({ status: 'pending', expires_at: past })).toBe(false)
    })
    it('invalide si déjà acceptée ou révoquée', () => {
      expect(isInvitationValid({ status: 'accepted', expires_at: future })).toBe(false)
      expect(isInvitationValid({ status: 'revoked', expires_at: future })).toBe(false)
    })
    it('invalide si null', () => {
      expect(isInvitationValid(null)).toBe(false)
    })
    it('accepte une date ISO en string', () => {
      expect(isInvitationValid({ status: 'pending', expires_at: future.toISOString() })).toBe(true)
    })
    it('respecte le paramètre now', () => {
      const exp = new Date('2026-01-10T00:00:00Z')
      expect(isInvitationValid({ status: 'pending', expires_at: exp }, new Date('2026-01-09T00:00:00Z'))).toBe(true)
      expect(isInvitationValid({ status: 'pending', expires_at: exp }, new Date('2026-01-11T00:00:00Z'))).toBe(false)
    })
  })

  describe('generateInviteToken', () => {
    it('produit un jeton url-safe suffisamment long et unique', () => {
      const a = generateInviteToken()
      const b = generateInviteToken()
      expect(a).not.toBe(b)
      expect(a.length).toBeGreaterThanOrEqual(32)
      expect(a).toMatch(/^[A-Za-z0-9_-]+$/) // base64url : pas de +/= ni d’espace
    })
  })

  describe('generateJoinCode', () => {
    it('produit un code de 8 caractères lisibles (sans 0/O/1/I/L)', () => {
      const c = generateJoinCode()
      expect(c).toHaveLength(8)
      expect(c).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{8}$/)
    })
    it('varie d’un appel à l’autre', () => {
      expect(generateJoinCode()).not.toBe(generateJoinCode())
    })
  })

  describe('normalizeJoinCode', () => {
    it('met en majuscules et retire les espaces', () => {
      expect(normalizeJoinCode('  ab cd 23 ')).toBe('ABCD23')
      expect(normalizeJoinCode(null)).toBe('')
    })
  })
})
