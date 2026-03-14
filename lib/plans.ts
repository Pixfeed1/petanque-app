// lib/plans.ts
// Configuration centralisée des limites par plan
// Modifier ici pour changer les limites — les API routes lisent ces valeurs

import type { PlanFeatures } from './types'

const PLAN_FEATURES: Record<string, PlanFeatures> = {
  free: {
    max_tournois: 1,
    max_equipes: 8
  },
  essentiel: {
    max_tournois: null,
    max_equipes: null
  },
  club: {
    max_tournois: null,
    max_equipes: null
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
export function getOrgLimit(
  orgSettings: Record<string, any>,
  limitKey: keyof PlanFeatures
): number | null {
  // 1. Lire depuis features si défini explicitement
  if (orgSettings?.features && orgSettings.features[limitKey] !== undefined) {
    return orgSettings.features[limitKey]
  }
  // 2. Fallback sur le plan
  const plan = orgSettings?.plan || 'free'
  return getFeaturesForPlan(plan)[limitKey]
}
