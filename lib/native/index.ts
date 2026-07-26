/**
 * Couche d'intégration native (Capacitor).
 *
 * Tout ce fichier est conçu pour vivre dans le code web partagé : chaque fonction
 * vérifie `isNative()` et ne fait RIEN dans un navigateur classique. Les plugins
 * sont importés dynamiquement pour ne jamais alourdir le bundle web ni casser le SSR.
 *
 * L'app Android (Capacitor) charge le site en production ; ce code s'exécute donc
 * côté téléphone et pilote les fonctions natives, tandis que sur petanquepro.fr
 * dans un navigateur il reste totalement inerte.
 */
import { Capacitor } from '@capacitor/core'

/** Vrai uniquement dans la coquille native (Android/iOS), jamais dans un navigateur. */
export function isNative(): boolean {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

let backHandlerBound = false

/**
 * Initialise l'expérience native au démarrage : barre de statut aux couleurs de la
 * marque, masquage du splash une fois l'app prête, et gestion du bouton « retour »
 * Android (sinon il quitte l'app brutalement). Idempotent.
 */
export async function initNative(): Promise<void> {
  if (!isNative()) return

  // Barre de statut : fond vert foncé de marque, texte clair.
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar')
    await StatusBar.setStyle({ style: Style.Dark }) // texte clair sur fond sombre
    await StatusBar.setBackgroundColor({ color: '#1a3322' })
  } catch { /* plugin absent : on ignore */ }

  // Masque le splash natif une fois la page chargée.
  try {
    const { SplashScreen } = await import('@capacitor/splash-screen')
    await SplashScreen.hide()
  } catch { /* ignore */ }

  // Bouton retour matériel Android : revenir en arrière dans l'historique,
  // et à la racine, laisser le comportement système (mettre en arrière-plan).
  if (!backHandlerBound) {
    try {
      const { App } = await import('@capacitor/app')
      await App.addListener('backButton', ({ canGoBack }) => {
        if (canGoBack && window.history.length > 1) {
          window.history.back()
        } else {
          App.minimizeApp?.().catch(() => {})
        }
      })
      backHandlerBound = true
    } catch { /* ignore */ }
  }

  // Notification native tapée → naviguer vers l'URL portée par le message (data.url).
  try {
    const { PushNotifications } = await import('@capacitor/push-notifications')
    await PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const url = (action.notification?.data as { url?: string } | undefined)?.url
      if (url) window.location.assign(url)
    })
  } catch { /* plugin absent : on ignore */ }

  // Initialise la pub native (AdMob) — no-op sur le web.
  try {
    const { initAds } = await import('./ads')
    await initAds()
  } catch { /* ignore */ }
}

/**
 * Garde l'écran allumé (utile pendant le score d'une partie : l'écran ne doit pas
 * s'éteindre au milieu d'une mène). No-op sur le web.
 */
export async function keepAwake(): Promise<void> {
  if (!isNative()) return
  try {
    const { KeepAwake } = await import('@capacitor-community/keep-awake')
    await KeepAwake.keepAwake()
  } catch { /* ignore */ }
}

/** Réautorise la mise en veille de l'écran. No-op sur le web. */
export async function allowSleep(): Promise<void> {
  if (!isNative()) return
  try {
    const { KeepAwake } = await import('@capacitor-community/keep-awake')
    await KeepAwake.allowSleep()
  } catch { /* ignore */ }
}

/** Petit retour haptique (validation d'une mène, d'un score). No-op sur le web. */
export async function hapticTap(): Promise<void> {
  if (!isNative()) return
  try {
    const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
    await Haptics.impact({ style: ImpactStyle.Medium })
  } catch { /* ignore */ }
}

/**
 * Partage natif (feuille de partage Android) pour un résultat/podium. Sur le web,
 * retourne false (l'appelant peut alors garder son propre bouton de partage web).
 */
export async function shareNative(opts: { title?: string; text?: string; url?: string }): Promise<boolean> {
  if (!isNative()) return false
  try {
    const { Share } = await import('@capacitor/share')
    await Share.share({ title: opts.title, text: opts.text, url: opts.url, dialogTitle: opts.title })
    return true
  } catch {
    return false
  }
}
