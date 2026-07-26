/**
 * Publicité mobile native (AdMob) — app Capacitor UNIQUEMENT.
 *
 * Tout est guardé par isNative() : sur le web (navigateur/PWA), ces fonctions ne font
 * RIEN. On n'utilise JAMAIS AdSense dans l'app (interdit par Google) — la pub in-app
 * passe par AdMob ; AdSense reste réservé au site web.
 *
 * Par défaut, on utilise les identifiants de TEST officiels de Google (bannières/interstitiels
 * de démonstration) — aucun revenu, mais rien ne crashe et on peut tout tester. En production,
 * renseigner les vrais identifiants AdMob via l'environnement :
 *   NEXT_PUBLIC_ADMOB_BANNER_ID, NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID
 * et l'App ID dans android/app/src/main/AndroidManifest.xml (voir docs/ADMOB.md).
 */
import { isNative } from './index'

// Identifiants de TEST officiels Google (sûrs, sans revenu).
const TEST_BANNER = 'ca-app-pub-3940256099942544/6300978111'
const TEST_INTERSTITIAL = 'ca-app-pub-3940256099942544/1033173712'

const BANNER_ID = process.env.NEXT_PUBLIC_ADMOB_BANNER_ID || TEST_BANNER
const INTERSTITIAL_ID = process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID || TEST_INTERSTITIAL
// Mode test tant qu'aucun vrai identifiant n'est fourni (affiche des pubs de démo).
const IS_TESTING = !process.env.NEXT_PUBLIC_ADMOB_BANNER_ID

let initialized = false
let interstitialReady = false

/** Initialise AdMob (une fois) au démarrage de l'app native. No-op sur le web. */
export async function initAds(): Promise<void> {
  if (!isNative() || initialized) return
  try {
    const { AdMob } = await import('@capacitor-community/admob')
    await AdMob.initialize({})
    initialized = true
  } catch { /* plugin absent / non natif : on ignore */ }
}

/** Affiche une bannière discrète en bas de l'écran. No-op hors app native. */
export async function showBanner(): Promise<void> {
  if (!isNative()) return
  try {
    await initAds()
    const { AdMob, BannerAdSize, BannerAdPosition } = await import('@capacitor-community/admob')
    await AdMob.showBanner({
      adId: BANNER_ID,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 0,
      isTesting: IS_TESTING,
    })
  } catch { /* ignore */ }
}

/** Retire la bannière. No-op hors app native. */
export async function hideBanner(): Promise<void> {
  if (!isNative()) return
  try {
    const { AdMob } = await import('@capacitor-community/admob')
    await AdMob.hideBanner()
    await AdMob.removeBanner()
  } catch { /* ignore */ }
}

/** Pré-charge un interstitiel (à appeler un peu avant de vouloir l'afficher). */
export async function prepareInterstitial(): Promise<void> {
  if (!isNative()) return
  try {
    await initAds()
    const { AdMob } = await import('@capacitor-community/admob')
    await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID, isTesting: IS_TESTING })
    interstitialReady = true
  } catch { /* ignore */ }
}

/**
 * Affiche un interstitiel à un moment de pause naturel (ex : après la clôture d'un
 * tournoi). Le pré-charge si nécessaire. No-op hors app native. Jamais bloquant.
 */
export async function showInterstitial(): Promise<void> {
  if (!isNative()) return
  try {
    const { AdMob } = await import('@capacitor-community/admob')
    if (!interstitialReady) await AdMob.prepareInterstitial({ adId: INTERSTITIAL_ID, isTesting: IS_TESTING })
    await AdMob.showInterstitial()
    interstitialReady = false // à re-préparer pour la prochaine fois
  } catch { /* ignore : ne casse jamais le flux */ }
}
