/**
 * Abonnement aux notifications push côté client.
 *
 * Deux chemins, choisis automatiquement :
 *   - App native (Capacitor) → FCM via @capacitor/push-notifications
 *   - Navigateur / PWA installée / TWA → Web Push (VAPID) via le service worker
 *
 * Tout est tolérant : si le navigateur ne supporte pas le push, les fonctions
 * renvoient un statut clair au lieu de planter.
 */
import { isNative } from '@/lib/native'

export type PushStatus = 'unsupported' | 'denied' | 'granted' | 'default'

/** Le push est-il possible sur cet appareil/navigateur ? */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false
  if (isNative()) return true
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

/** État courant de la permission (sans rien demander). */
export function pushPermission(): PushStatus {
  if (!isPushSupported()) return 'unsupported'
  if (isNative()) return 'default'
  return Notification.permission as PushStatus
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const buffer = new ArrayBuffer(raw.length)
  const arr = new Uint8Array(buffer)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

async function post(path: string, body: unknown): Promise<boolean> {
  try {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(body),
    })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Active les notifications : demande la permission puis enregistre l'abonnement
 * côté serveur. Renvoie le statut final.
 */
export async function enablePush(): Promise<PushStatus> {
  if (!isPushSupported()) return 'unsupported'

  // --- Chemin natif (Android/Capacitor) : FCM ---
  if (isNative()) {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications')
      const perm = await PushNotifications.requestPermissions()
      if (perm.receive !== 'granted') return 'denied'
      // Le jeton arrive de façon asynchrone via l'événement 'registration'.
      await new Promise<void>((resolve) => {
        PushNotifications.addListener('registration', async (token) => {
          await post('/api/push/subscribe', { fcmToken: token.value })
          resolve()
        })
        PushNotifications.addListener('registrationError', () => resolve())
        PushNotifications.register()
        setTimeout(resolve, 4000) // garde-fou : ne pas bloquer indéfiniment
      })
      return 'granted'
    } catch {
      return 'unsupported'
    }
  }

  // --- Chemin web (Web Push / VAPID) ---
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  if (!vapidPublic) return 'unsupported'
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return permission as PushStatus

  try {
    const reg = await navigator.serviceWorker.ready
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublic),
      })
    }
    const json = sub.toJSON() as { endpoint?: string; keys?: { p256dh: string; auth: string } }
    await post('/api/push/subscribe', { subscription: { endpoint: json.endpoint, keys: json.keys } })
    return 'granted'
  } catch {
    return 'unsupported'
  }
}

/** Désactive les notifications web (désabonne le navigateur + purge côté serveur). */
export async function disablePush(): Promise<void> {
  if (isNative()) return // désinscription native gérée par l'OS
  try {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      const endpoint = sub.endpoint
      await sub.unsubscribe()
      await post('/api/push/unsubscribe', { endpoint })
    }
  } catch {
    /* ignore */
  }
}
