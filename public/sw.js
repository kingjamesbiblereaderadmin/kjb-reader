const CACHE_NAME = 'kjb-shell-v3';
const BIBLE_CACHE = 'kjb-bible-v1';
const BIBLE_TEXT_URL = 'https://media.base44.com/files/public/6a05d76723afe58d80c589e8/91ec9491e_WHARTON_PCE.txt';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.add('/'))
      .then(() => self.skipWaiting())
  );
});

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

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.open(CACHE_NAME).then((cache) => cache.match('/'))
      )
    );
    return;
  }
});

// Periodic background sync — fires hourly if OS grants it (Android Chrome)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-verse-notif') {
    event.waitUntil(checkAndNotify());
  }
});

async function checkAndNotify() {
  // Read scheduled time from all open clients' storage via a message round-trip
  // Simpler: use IndexedDB or a dedicated cache entry for the schedule config
  const cache = await caches.open('kjb-notif-config');
  const configRes = await cache.match('/notif-config');
  if (!configRes) return;

  const config = await configRes.json();
  const { nextTs, lastDate, verseText, verseRef } = config;
  if (!nextTs || !verseText) return;

  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);

  if (now >= nextTs && lastDate !== today) {
    // Fire the notification
    await self.registration.showNotification('King James Bible — Daily Verse', {
      body: `"${verseText}" — ${verseRef}`,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-verse',
      renotify: true,
    });

    // Update config with next fire time
    const next = new Date(nextTs);
    next.setDate(next.getDate() + 1);
    const updated = { ...config, nextTs: next.getTime(), lastDate: today };
    await cache.put('/notif-config', new Response(JSON.stringify(updated), {
      headers: { 'Content-Type': 'application/json' }
    }));
  }
}

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
