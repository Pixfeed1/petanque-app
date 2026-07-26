/**
 * Consentement RGPD (cookies/traceurs). Stocke le choix de l'utilisateur côté client.
 *
 * Catégories :
 *  - 'essential' : toujours autorisé (auth, sécurité) — non traçant, pas de consentement requis.
 *  - 'analytics' : mesure d'audience.
 *  - 'ads'       : publicité (AdSense).
 *
 * Les scripts tiers (analytics/pub) NE DOIVENT se charger que si le consentement de la
 * catégorie correspondante est donné (voir components/ConsentedScripts.tsx).
 */
export type ConsentCategory = 'analytics' | 'ads'

export interface ConsentState {
  analytics: boolean
  ads: boolean
  /** version du texte de consentement, pour redemander si la politique change */
  v: number
  /** date ISO du choix */
  at: string
}

const KEY = 'pp_consent'
export const CONSENT_VERSION = 1

/** Événement émis quand le consentement change (pour recharger les scripts). */
export const CONSENT_EVENT = 'pp:consent-changed'
/** Événement pour rouvrir le bandeau (bouton « gérer mes cookies »). */
export const CONSENT_REOPEN_EVENT = 'pp:consent-reopen'

/** Rouvre le bandeau de consentement (permet à l'utilisateur de changer d'avis). */
export function reopenConsent(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CONSENT_REOPEN_EVENT))
}

/** Lit le choix courant, ou null si l'utilisateur n'a pas encore répondu. */
export function getConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as ConsentState
    if (parsed.v !== CONSENT_VERSION) return null // politique changée → redemander
    return parsed
  } catch {
    return null
  }
}

/** L'utilisateur a-t-il consenti à cette catégorie ? (false tant qu'il n'a pas répondu) */
export function hasConsent(category: ConsentCategory): boolean {
  return !!getConsent()?.[category]
}

/** Enregistre un choix et notifie l'app (les scripts consentis peuvent alors se charger). */
export function setConsent(choice: { analytics: boolean; ads: boolean }): void {
  if (typeof window === 'undefined') return
  const state: ConsentState = { ...choice, v: CONSENT_VERSION, at: new Date().toISOString() }
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
    window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: state }))
  } catch {
    /* stockage indisponible : on ignore (le bandeau réapparaîtra) */
  }
}
