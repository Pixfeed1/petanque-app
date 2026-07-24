// Service worker Pétanque Pro.
// Stratégie prudente pour une app connectée à une base :
//  - navigations (pages) : réseau d'abord, repli sur le cache puis page hors-ligne
//  - assets Next immuables (/_next/static, /icons) : cache d'abord (hashés → sûrs)
//  - jamais de cache pour les appels API (/api) : toujours le réseau
// Le but est l'installabilité + une dégradation propre hors-ligne, pas un mode offline complet.
const VERSION = 'v2'
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
