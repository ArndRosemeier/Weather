/* Offline shell for the weather app. API responses are cached by the app itself
   (localStorage), so this worker only keeps the static shell and hashed assets. */
const CACHE = 'weather-compare-shell-v1'

self.addEventListener('install', (event) => {
  // Precache the shell and its hashed assets at install time. Without this the
  // first visit's requests happen before the worker controls the page, and an
  // offline reload would have no shell to fall back to.
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      const response = await fetch('/')
      await cache.put('/index.html', response.clone())
      const html = await response.text()
      const urls = [...html.matchAll(/(?:src|href)="(\/[^"]+)"/g)]
        .map((match) => match[1])
        .filter((url) => !url.startsWith('//'))
      await Promise.all(
        urls.map(async (url) => {
          try {
            const asset = await fetch(url)
            if (asset.ok) await cache.put(url, asset)
          } catch {
            /* an asset that fails to precache is retried by the fetch handler */
          }
        }),
      )
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put('/index.html', copy))
          return response
        })
        .catch(() => caches.match('/index.html').then((hit) => hit ?? Response.error())),
    )
    return
  }

  if (/\.(?:js|css|webp|svg|png|woff2|webmanifest)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((hit) => {
        if (hit) return hit
        return fetch(request).then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy))
          return response
        })
      }),
    )
  }
})
