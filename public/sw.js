const CACHE_NAME = 'kjb-shell-v3';
const BIBLE_CACHE = 'kjb-bible-v1';
const BIBLE_TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';

// On install: cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add('/'))
      .then(() => self.skipWaiting())
  );
});

// On activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME && k !== BIBLE_CACHE).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Cache-first for the large Bible text file
  if (request.url === BIBLE_TEXT_URL) {
    event.respondWith(
      caches.open(BIBLE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) cache.put(request, response.clone());
        return response;
      })
    );
    return;
  }

  // Network-first for JS, CSS, fonts — fall back to cache
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return cache.match(request);
        }
      })
    );
    return;
  }

  // Navigation requests: network-first, fall back to cached '/'
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.open(CACHE_NAME).then((cache) => cache.match('/'))
      )
    );
    return;
  }
});

// Open the app when user taps a notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
