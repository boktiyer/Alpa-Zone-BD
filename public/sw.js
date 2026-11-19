// Alpa Zone BD service worker (hand-written, no build step needed).
// - Pages are never cached: they always come from the server, so prices, stock,
//   cart and orders are never out of date. With no internet, /offline.html is shown.
// - Build files (/_next/static) are cached; pictures and fonts are cached and
//   refreshed in the background.
// Change VERSION to throw away every old cache on the next visit.
const VERSION = 'v1';
const STATIC_CACHE = `alpa-static-${VERSION}`;
const IMAGE_CACHE = `alpa-images-${VERSION}`;
const OFFLINE_URL = '/offline.html';
const PRECACHE = [OFFLINE_URL, '/icons/icon-192.png'];
const MAX_IMAGES = 120;

// Routes that must never be cached (always fresh from the server).
const NEVER_CACHE =
  /^\/(api|admin|auth|cart|checkout|login|signup|account|forgot-password|reset-password|order-success|track-order|wishlist)(\/|$)/;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('alpa-') && key !== STATIC_CACHE && key !== IMAGE_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Page loads: network only, offline page when there is no connection.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match(OFFLINE_URL).then((res) => res || Response.error())),
    );
    return;
  }

  if (NEVER_CACHE.test(url.pathname)) return;

  // Build files have a hash in their name and never change: cache first.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(req));
    return;
  }

  // Pictures and fonts: show the saved copy at once, refresh it in the background.
  if (url.pathname.startsWith('/_next/image') || /\.(png|jpe?g|webp|avif|gif|svg|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req));
  }

  // Everything else (page data, server actions, etc.) goes straight to the network.
});

async function cacheFirst(req) {
  const cache = await caches.open(STATIC_CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok) cache.put(req, res.clone());
  return res;
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(IMAGE_CACHE);
  const hit = await cache.match(req);
  const network = fetch(req)
    .then((res) => {
      if (res.ok) cache.put(req, res.clone()).then(() => trim(cache));
      return res;
    })
    .catch(() => hit || Response.error());
  return hit || network;
}

// Keep the picture cache from growing without limit (oldest go first).
async function trim(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - MAX_IMAGES; i++) await cache.delete(keys[i]);
}
