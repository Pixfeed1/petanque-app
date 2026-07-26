// Service worker Pétanque Pro.
// Stratégie prudente pour une app connectée à une base :
//  - navigations (pages) : réseau d'abord, repli sur le cache puis page hors-ligne
//  - assets Next immuables (/_next/static, /icons) : cache d'abord (hashés → sûrs)
//  - jamais de cache pour les appels API (/api) : toujours le réseau
// Le but est l'installabilité + une dégradation propre hors-ligne, pas un mode offline complet.
const VERSION = 'v3'
const CACHE = `petanque-pro-${VERSION}`
const OFFLINE_URL = '/offline.html'
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png', '/icons/icon-512.png']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

function isStaticAsset(url) {
  return url.pathname.startsWith('/_next/static') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/fonts/')
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  // Les appels API/auth ne sont jamais servis depuis le cache.
  if (url.pathname.startsWith('/api')) return

  // Assets immuables : cache d'abord, sinon réseau (et on met en cache).
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(request).then((cached) =>
        cached ||
        fetch(request).then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy))
          return res
        })
      )
    )
    return
  }

  // Navigations : réseau d'abord, repli cache puis page hors-ligne.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy))
          return res
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)))
    )
  }
})

// --- Notifications push (Web Push) ---
// Le serveur envoie un JSON { title, body, url?, tag?, icon? }.
self.addEventListener('push', (event) => {
  let data = {}
  try { data = event.data ? event.data.json() : {} } catch { data = { body: event.data && event.data.text() } }
  const title = data.title || 'Pétanque Pro'
  const options = {
    body: data.body || '',
    icon: data.icon || '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: data.tag || 'petanque-pro',
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Clic sur la notification : focalise un onglet existant ou en ouvre un.
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) { client.navigate(url); return client.focus() }
      }
      return self.clients.openWindow(url)
    })
  )
})
