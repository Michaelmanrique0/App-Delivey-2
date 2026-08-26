/* Service Worker — Delivery v5: no cachea app.js (siempre red) */
const CACHE_NAME = 'delivery-static-v5';
const PRECACHE = ['./manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).catch(() => undefined)
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  if (sameOrigin && url.pathname.startsWith('/api/')) return;

  // Nunca cachear JS/CSS/HTML: evita parsers viejos
  if (
    sameOrigin &&
    (url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.html') ||
      url.pathname.endsWith('/') ||
      req.mode === 'navigate')
  ) {
    event.respondWith(fetch(req).catch(() => caches.match(req).then((c) => c || Response.error())));
    return;
  }

  if (!sameOrigin) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req)
          .then((res) => {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => undefined);
            return res;
          })
          .catch(() => cached);
      })
    );
  }
});
