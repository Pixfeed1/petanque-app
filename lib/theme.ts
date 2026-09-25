/**
 * Thème clair / sombre / système.
 *
 * Le choix est stocké dans localStorage (préférence par appareil) et appliqué
 * via la classe `dark` sur <html>. Un script inline dans le layout applique la
 * classe avant l'hydratation pour éviter le flash clair au chargement.
 */

export type ThemePref = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'pp_theme'

export function getThemePref(): ThemePref {
  if (typeof window === 'undefined') return 'system'
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch { /* stockage indisponible */ }
  return 'system'
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Applique la classe `dark` sur <html> selon la préférence. */
export function applyTheme(pref: ThemePref): void {
  if (typeof document === 'undefined') return
  const dark = pref === 'dark' || (pref === 'system' && systemPrefersDark())
  document.documentElement.classList.toggle('dark', dark)
}

/** Enregistre la préférence et l'applique immédiatement. */
export function setThemePref(pref: ThemePref): void {
  try { localStorage.setItem(STORAGE_KEY, pref) } catch { /* stockage indisponible */ }
  applyTheme(pref)
}

/**
 * Script inline (layout) : applique le thème avant l'hydratation.
 * Doit rester autonome (pas d'import) et silencieux en cas d'échec.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');}catch(e){}})()`
