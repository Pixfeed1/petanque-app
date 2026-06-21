// lib/plans.ts
// Configuration centralisée des limites par plan
// Modifier ici pour changer les limites — les API routes lisent ces valeurs

import type { PlanFeatures } from './types'

// ── Cache du mode beta (évite une requête BDD à chaque vérif de plan) ──

let _betaModeCache: boolean | null = null
let _betaModeCacheTime = 0
const BETA_CACHE_TTL = 30_000 // 30 secondes

/**
 * Vérifie si le mode beta est actif (avec cache de 30s).
 * Utilisable côté serveur uniquement.
 */
export async function isBetaModeEnabled(): Promise<boolean> {
  const now = Date.now()
  if (_betaModeCache !== null && now - _betaModeCacheTime < BETA_CACHE_TTL) {
    return _betaModeCache
  }

  try {
    // Import dynamique pour éviter les dépendances circulaires
    const { queryOne } = await import('./db')
    const setting = await queryOne<{ value: { enabled: boolean } }>(
      `SELECT value FROM app_settings WHERE key = 'beta_mode'`
    )
    _betaModeCache = !!setting?.value?.enabled
    _betaModeCacheTime = now
    return _betaModeCache
  } catch {
    return _betaModeCache ?? false
  }
}

const PLAN_FEATURES: Record<string, PlanFeatures> = {
  free: {
    max_tournois: 1,
    max_equipes: 8,
    advanced_stats: false,
    custom_rules: false,
    club_customization: false
  },
  essentiel: {
    max_tournois: null,
    max_equipes: null,
    advanced_stats: false,
    custom_rules: false,
    club_customization: false
  },
  club: {
    max_tournois: null,
    max_equipes: null,
    advanced_stats: true,
    custom_rules: true,
    club_customization: true
  }
}

/**
 * Retourne les features par défaut pour un plan donné.
 * Utilisé à la création d'org et lors des upgrades/downgrades.
 */
export function getFeaturesForPlan(plan: string): PlanFeatures {
  return PLAN_FEATURES[plan] || PLAN_FEATURES.free
}

/**
 * Retourne la limite effective depuis les settings d'une organisation.
 * Priorise settings.features (configurable par org) puis fallback sur le plan.
 */
/**
 * Vérifie si une feature booléenne est activée pour l'organisation.
 */
export function hasOrgFeature(
  orgSettings: Record<string, any>,
  featureKey: 'advanced_stats' | 'custom_rules' | 'club_customization'
): boolean {
  // 1. Lire depuis features si défini explicitement
  if (orgSettings?.features && orgSettings.features[featureKey] !== undefined) {
    return !!orgSettings.features[featureKey]
  }
  // 2. Fallback sur le plan
  const plan = orgSettings?.plan || 'free'
  return !!getFeaturesForPlan(plan)[featureKey]
}

export function getOrgLimit(
  orgSettings: Record<string, any>,
  limitKey: 'max_tournois' | 'max_equipes'
): number | null {
  // 1. Lire depuis features si défini explicitement
  if (orgSettings?.features && orgSettings.features[limitKey] !== undefined) {
    return orgSettings.features[limitKey]
  }
  // 2. Fallback sur le plan
  const plan = orgSettings?.plan || 'free'
  return getFeaturesForPlan(plan)[limitKey]
}

// ── Versions async tenant compte du mode beta ──

/**
 * Version async de hasOrgFeature.
 * Gratuit pour tous — voir Phase 2 pour le retrait des plans.
 */
export async function hasOrgFeatureAsync(
  _orgSettings: Record<string, any>,
  _featureKey: 'advanced_stats' | 'custom_rules' | 'club_customization'
): Promise<boolean> {
  // Gratuit pour tous — toutes les features débloquées (Phase 2 : retrait des plans).
  return true
}

/**
 * Version async de getOrgLimit.
 * Gratuit pour tous — voir Phase 2 pour le retrait des plans.
 */
export async function getOrgLimitAsync(
  _orgSettings: Record<string, any>,
  _limitKey: 'max_tournois' | 'max_equipes'
): Promise<number | null> {
  // Gratuit pour tous — aucune limite (null = illimité). Phase 2 : retrait des plans.
  return null
}

/**
 * Version async de getFeaturesForPlan.
 * Gratuit pour tous — voir Phase 2 pour le retrait des plans.
 */
export async function getFeaturesForPlanAsync(_plan: string): Promise<PlanFeatures> {
  // Gratuit pour tous — toujours le jeu de features « club ». Phase 2 : retrait des plans.
  return PLAN_FEATURES.club
}
