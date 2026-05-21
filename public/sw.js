const CACHE_NAME = 'kjb-cache-v2';
const LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => {
      console.log('[SW] Install complete, skipping waiting');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && !name.startsWith('kjb-notif'))
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Activate complete, claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - cache-first with exclusions for dev/hot-reload assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  if (
    url.pathname.includes('/src/') ||
    url.pathname.includes('/node_modules/.vite/') ||
    url.pathname.includes('/@vite') ||
    url.pathname.includes('/@react-refresh') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.jsx') ||
    url.pathname.endsWith('.css') ||
    url.search.includes('v=')
  ) {
    return event.respondWith(
      fetch(request).catch((err) => {
        console.error('[SW] Fetch failed for dynamic asset:', err.message);
        return new Response('Offline', { status: 503 });
      })
    );
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Push event - handle push notifications from the server
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'KJB Reader', body: event.data ? event.data.text() : 'Daily verse ready' };
  }

  const title = data.title || 'KJB Reader';
  const options = {
    body: data.body || 'Your daily verse is ready',
    icon: data.icon || LOGO_URL,
    badge: data.badge || LOGO_URL,
    image: data.image || undefined,
    data: { url: data.url || '/', ...(data.data || {}) },
    tag: data.tag || 'daily-verse',
    renotify: true,
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click - open or focus the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate?.(targetUrl).catch(() => {});
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    event.waitUntil(
      self.skipWaiting().then(() => self.clients.claim())
    );
  }
  if (event.data && event.data.type === 'GET_CACHE_VERSION') {
    event.ports[0]?.postMessage({ type: 'CACHE_VERSION', cacheVersion: CACHE_NAME });
  }
});

// Periodic background sync (Chrome Android only, when installed as PWA)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-verse-notif') {
    event.waitUntil(checkAndFireDailyVerse());
  }
});

async function checkAndFireDailyVerse() {
  try {
    const cache = await caches.open('kjb-notif-config');
    const res = await cache.match('/notif-config');
    if (!res) return;
    const config = await res.json();
    const today = new Date().toISOString().slice(0, 10);
    if (config.lastDate === today) return; // already shown today
    if (Date.now() < config.nextTs) return; // not time yet
    await self.registration.showNotification('KJB — Daily Verse', {
      body: config.verseText ? `"${config.verseText}" — ${config.verseRef}` : 'Your daily verse is ready',
      icon: LOGO_URL,
      badge: LOGO_URL,
      tag: 'daily-verse',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: '/' },
    });
    config.lastDate = today;
    config.nextTs = config.nextTs + 24 * 60 * 60 * 1000;
    await cache.put('/notif-config', new Response(JSON.stringify(config), {
      headers: { 'Content-Type': 'application/json' }
    }));
  } catch (err) {
    console.error('[SW] Daily verse check failed:', err);
  }
}
