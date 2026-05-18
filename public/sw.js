const CACHE_VERSION = 'kjb-v3';
const BIBLE_TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';

// On install: cache the Bible text file immediately
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.add(BIBLE_TEXT_URL).catch(() => {
        // If network unavailable on install, that's ok - we'll cache on first fetch
      });
    })
  );
});

// On activate: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_VERSION)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy:
// - Bible text file: cache-first (serve from cache if available, else network + cache)
// - Everything else: network-first with cache fallback
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // Bible text file - cache first
  if (url === BIBLE_TEXT_URL || url.includes('WHARTON_PCE.txt')) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(cache =>
        cache.match(event.request).then(cached => {
          if (cached) return cached;
          return fetch(event.request).then(response => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          });
        })
      )
    );
    return;
  }

  // App shell and assets - network first, fallback to cache
  if (url.startsWith(self.location.origin) || url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response && response.status === 200 && event.request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
});
