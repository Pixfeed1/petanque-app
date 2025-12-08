// lib/club/rules.service.ts
// Service de gestion des règles personnalisées Pack Club
// Gère la persistance et validation des règles

import { ClubRules, DEFAULT_CLUB_RULES } from './types'

const STORAGE_KEY = 'petanque-pro-club-rules'

/**
 * Service de gestion des règles personnalisées
 */
export class ClubRulesService {
  /**
   * Génère un ID unique pour les règles
   */
  private static generateId(): string {
    return `rules_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Récupère toutes les règles d'un utilisateur depuis le localStorage
   * (À terme, remplacer par un appel API)
   */
  static getRulesByUserId(userId: string): ClubRules[] {
    if (typeof window === 'undefined') return []

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []

      const allRules: ClubRules[] = JSON.parse(stored)
      return allRules.filter(r => r.userId === userId)
    } catch {
      console.warn('Erreur lecture règles club')
      return []
    }
  }

  /**
   * Récupère une règle par son ID
   */
  static getRulesById(rulesId: string): ClubRules | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null

      const allRules: ClubRules[] = JSON.parse(stored)
      return allRules.find(r => r.id === rulesId) || null
    } catch {
      return null
    }
  }

  /**
   * Crée un nouveau jeu de règles avec les valeurs par défaut
   */
  static createDefaultRules(userId: string, name: string): ClubRules {
    const now = new Date().toISOString()

    return {
      ...DEFAULT_CLUB_RULES,
      id: this.generateId(),
      userId,
      name,
      createdAt: now,
      updatedAt: now
    }
  }

  /**
   * Sauvegarde un jeu de règles
   */
  static saveRules(rules: ClubRules): ClubRules {
    if (typeof window === 'undefined') {
      throw new Error('localStorage non disponible')
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      const allRules: ClubRules[] = stored ? JSON.parse(stored) : []

      // Mettre à jour updatedAt
      const updatedRules = {
        ...rules,
        updatedAt: new Date().toISOString()
      }

      // Chercher si existe déjà
      const existingIndex = allRules.findIndex(r => r.id === rules.id)

      if (existingIndex >= 0) {
        // Mise à jour
        allRules[existingIndex] = updatedRules
      } else {
        // Nouvelle règle
        allRules.push(updatedRules)
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(allRules))
      return updatedRules
    } catch (e) {
      console.error('Erreur sauvegarde règles:', e)
      throw new Error('Impossible de sauvegarder les règles')
    }
  }

  /**
   * Supprime un jeu de règles
   */
  static deleteRules(rulesId: string): boolean {
    if (typeof window === 'undefined') return false

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return false

      const allRules: ClubRules[] = JSON.parse(stored)
      const filtered = allRules.filter(r => r.id !== rulesId)

      if (filtered.length === allRules.length) {
        return false // Pas trouvé
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
      return true
    } catch {
      return false
    }
  }

  /**
   * Duplique un jeu de règles existant
   */
  static duplicateRules(rulesId: string, newName: string): ClubRules | null {
    const original = this.getRulesById(rulesId)
    if (!original) return null

    const now = new Date().toISOString()
    const duplicate: ClubRules = {
      ...original,
      id: this.generateId(),
      name: newName,
      createdAt: now,
      updatedAt: now
    }

    return this.saveRules(duplicate)
  }

  /**
   * Valide un jeu de règles
   */
  static validateRules(rules: Partial<ClubRules>): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!rules.name || rules.name.trim().length === 0) {
      errors.push('Le nom des règles est obligatoire')
    }

    if (rules.name && rules.name.length > 100) {
      errors.push('Le nom ne peut pas dépasser 100 caractères')
    }

    if (rules.nombreParties && ![2, 3, 4].includes(rules.nombreParties)) {
      errors.push('Le nombre de parties doit être 2, 3 ou 4')
    }

    if (rules.pointsGagnants && ![11, 13, 15, 21].includes(rules.pointsGagnants)) {
      errors.push('Les points gagnants doivent être 11, 13, 15 ou 21')
    }

    if (rules.terrains?.noms && rules.terrains.noms.length === 0) {
      errors.push('Au moins un terrain doit être défini')
    }

    if (rules.terrains?.noms && rules.terrains.noms.length > 20) {
      errors.push('Maximum 20 terrains')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Exporte les règles en JSON (pour partage)
   */
  static exportRulesToJSON(rules: ClubRules): string {
    // Retirer les infos sensibles
    const exportData = {
      ...rules,
      userId: undefined,
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined
    }
    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Importe des règles depuis JSON
   */
  static importRulesFromJSON(userId: string, jsonString: string): ClubRules | null {
    try {
      const parsed = JSON.parse(jsonString)
      const now = new Date().toISOString()

      // Valider la structure minimale
      if (!parsed.name || !parsed.mode || !parsed.format) {
        return null
      }

      const imported: ClubRules = {
        ...DEFAULT_CLUB_RULES,
        ...parsed,
        id: this.generateId(),
        userId,
        name: `${parsed.name} (importé)`,
        createdAt: now,
        updatedAt: now
      }

      return this.saveRules(imported)
    } catch {
      return null
    }
  }
}
