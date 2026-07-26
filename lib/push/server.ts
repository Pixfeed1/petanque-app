/**
 * Envoi de notifications push côté serveur.
 *
 * Deux canaux :
 *   - Web Push (VAPID) : fonctionne pour la PWA installée + le TWA Android, sans
 *     aucun compte externe. Prêt et fonctionnel dès que les clés VAPID sont en env.
 *   - FCM (Android natif Capacitor) : nécessite un projet Firebase (compte de service).
 *     Les jetons sont stockés ; l'envoi est activé quand FCM_SERVICE_ACCOUNT_JSON est fourni.
 */
import webpush from 'web-push'
import { query, queryMany } from '@/lib/db'

export interface PushPayload {
  title: string
  body: string
  url?: string
  tag?: string
  icon?: string
}

let vapidReady = false
function ensureVapid(): boolean {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const priv = process.env.VAPID_PRIVATE_KEY
  if (!pub || !priv) return false
  if (!vapidReady) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:contact@petanquepro.fr', pub, priv)
    vapidReady = true
  }
  return true
}

/** VAPID configuré ? (sinon le Web Push est indisponible). */
export function isWebPushConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY)
}

interface SubRow {
  id: string
  platform: string
  endpoint: string | null
  p256dh: string | null
  auth: string | null
  fcm_token: string | null
}

/** Enregistre (ou met à jour) un abonnement Web Push pour un utilisateur. */
export async function saveWebSubscription(
  userId: string,
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent?: string
): Promise<void> {
  await query(
    `INSERT INTO push_subscriptions (user_id, platform, endpoint, p256dh, auth, user_agent, last_seen_at)
     VALUES ($1, 'web', $2, $3, $4, $5, NOW())
     ON CONFLICT (endpoint) WHERE endpoint IS NOT NULL
     DO UPDATE SET user_id = EXCLUDED.user_id, p256dh = EXCLUDED.p256dh,
                   auth = EXCLUDED.auth, last_seen_at = NOW()`,
    [userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth, userAgent || null]
  )
}

/** Enregistre (ou met à jour) un jeton FCM (Android natif) pour un utilisateur. */
export async function saveFcmToken(userId: string, token: string, userAgent?: string): Promise<void> {
  await query(
    `INSERT INTO push_subscriptions (user_id, platform, fcm_token, user_agent, last_seen_at)
     VALUES ($1, 'android', $2, $3, NOW())
     ON CONFLICT (fcm_token) WHERE fcm_token IS NOT NULL
     DO UPDATE SET user_id = EXCLUDED.user_id, last_seen_at = NOW()`,
    [userId, token, userAgent || null]
  )
}

/**
 * Supprime un abonnement (désinscription volontaire ou expiration).
 * Si `userId` est fourni, la suppression est bornée à cet utilisateur (défense en
 * profondeur : on ne peut pas désinscrire l'appareil d'un tiers dont on connaîtrait
 * l'endpoint). Les purges internes (410/404) appellent sans userId.
 */
export async function deleteSubscription(match: { endpoint?: string; fcmToken?: string; userId?: string }): Promise<void> {
  if (match.endpoint) {
    if (match.userId) await query('DELETE FROM push_subscriptions WHERE endpoint = $1 AND user_id = $2', [match.endpoint, match.userId])
    else await query('DELETE FROM push_subscriptions WHERE endpoint = $1', [match.endpoint])
  } else if (match.fcmToken) {
    if (match.userId) await query('DELETE FROM push_subscriptions WHERE fcm_token = $1 AND user_id = $2', [match.fcmToken, match.userId])
    else await query('DELETE FROM push_subscriptions WHERE fcm_token = $1', [match.fcmToken])
  }
}

/**
 * Envoie une notification à tous les appareils d'un utilisateur.
 * Retourne le nombre d'envois réussis. Les abonnements expirés (404/410) sont purgés.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  const subs = await queryMany<SubRow>(
    'SELECT id, platform, endpoint, p256dh, auth, fcm_token FROM push_subscriptions WHERE user_id = $1',
    [userId]
  )
  let ok = 0
  const webReady = ensureVapid()
  for (const s of subs) {
    if (s.platform === 'web' && s.endpoint && s.p256dh && s.auth) {
      if (!webReady) continue
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload)
        )
        ok++
      } catch (err: unknown) {
        const status = (err as { statusCode?: number })?.statusCode
        if (status === 404 || status === 410) {
          await query('DELETE FROM push_subscriptions WHERE id = $1', [s.id])
        }
      }
    } else if (s.platform === 'android' && s.fcm_token) {
      const sent = await sendFcm(s.fcm_token, payload)
      if (sent) ok++
    }
  }
  return ok
}

/**
 * Envoi FCM (HTTP v1). Activé uniquement si FCM_SERVICE_ACCOUNT_JSON est fourni
 * (compte de service Firebase). Sans ça, no-op — les jetons restent stockés et
 * l'envoi natif s'activera dès la configuration Firebase.
 */
async function sendFcm(token: string, payload: PushPayload): Promise<boolean> {
  const raw = process.env.FCM_SERVICE_ACCOUNT_JSON
  if (!raw) return false
  try {
    const accessToken = await getFcmAccessToken(raw)
    const projectId = JSON.parse(raw).project_id
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: payload.title, body: payload.body },
          data: payload.url ? { url: payload.url } : undefined,
          android: { notification: { icon: 'ic_launcher' } },
        },
      }),
    })
    return res.ok
  } catch {
    return false
  }
}

/** Échange le compte de service contre un jeton d'accès OAuth2 (scope FCM). */
async function getFcmAccessToken(serviceAccountJson: string): Promise<string> {
  const { GoogleAuth } = await import('google-auth-library')
  const credentials = JSON.parse(serviceAccountJson)
  const auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/firebase.messaging'] })
  const client = await auth.getClient()
  const { token } = await client.getAccessToken()
  if (!token) throw new Error('Jeton FCM indisponible')
  return token
}
