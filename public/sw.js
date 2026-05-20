const CACHE_VERSION = 'kjb-v1';

// Cache strategies
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(
        names
          .filter(name => name.startsWith('kjb-') && name !== CACHE_VERSION)
          .map(name => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Network-first for HTML/JS, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin and non-GET requests
  if (url.origin !== self.location.origin || request.method !== 'GET') {
    return;
  }

  // HTML/JS: network-first, fallback to cache
  if (url.pathname === '/' || url.pathname.match(/\.(js|html)$/)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets: cache-first, fallback to network
  if (url.pathname.match(/\.(css|woff2|woff|ttf|png|jpg|svg|json)$/)) {
    event.respondWith(
      caches.match(request).then(response =>
        response || fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
          }
          return response;
        })
      )
    );
    return;
  }

  // API requests: network-first with offline fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request) || new Response('Offline', { status: 503 }))
  );
});

// Handle notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Focus existing window
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
  );
});

// Periodic sync for notifications (fires ~hourly on Android)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-verse-notif') {
    event.waitUntil(fireNotificationIfDue());
  }
});

async function fireNotificationIfDue() {
  try {
    const config = await caches.open(CACHE_VERSION).then(cache =>
      cache.match('/notif-config').then(r => r ? r.json() : {})
    );

    if (!config.nextTs || Date.now() < config.nextTs) return;
    if (config.lastDate === getTodayString()) return; // Already fired

    // Fetch fresh verse for today
    const verseUrl = 'https://kjb-api.tinyverses.com/api/verses/daily';
    const verse = await fetch(verseUrl).then(r => r.json());
    
    await self.registration.showNotification('King James Bible — Verse of the Day', {
      body: `"${verse.text.slice(0, 100)}${verse.text.length > 100 ? '…' : ''}" — ${verse.reference}`,
      icon: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png',
      badge: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png',
      tag: 'daily-verse',
      renotify: true,
    });

    // Update config with new fire time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const [hh, mm] = (localStorage.getItem('kjb-notification-time') || '08:00').split(':');
    tomorrow.setHours(parseInt(hh), parseInt(mm), 0, 0);

    await caches.open(CACHE_VERSION).then(cache =>
      cache.put('/notif-config', new Response(JSON.stringify({
        nextTs: tomorrow.getTime(),
        lastDate: getTodayString(),
        verseText: verse.text.slice(0, 120),
        verseRef: verse.reference,
      })))
    );
  } catch (err) {
    console.error('[SW] Periodic sync error:', err);
  }
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
