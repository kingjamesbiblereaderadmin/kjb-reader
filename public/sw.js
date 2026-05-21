const CACHE_NAME = 'kjb-cache-v1';
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
          .filter((name) => name !== CACHE_NAME)
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

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // NEVER cache these in development or hot-reload scenarios
  if (
    url.pathname.includes('/src/') ||
    url.pathname.includes('/node_modules/.vite/') ||
    url.pathname.includes('/@vite') ||
    url.pathname.includes('/@react-refresh') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.jsx') ||
    url.pathname.endsWith('.css') ||
    url.search.includes('v=') // Vite cache-busting param
  ) {
    // Network-only for JS/CSS chunks to prevent stale React errors
    return event.respondWith(
      fetch(request).catch((err) => {
        console.error('[SW] Fetch failed for dynamic asset:', err.message);
        return new Response('Offline', { status: 503 });
      })
    );
  }

  // Cache-first strategy for static assets (HTML, images, etc.)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[SW] Cache hit:', request.url);
        return cachedResponse;
      }

      // Network fallback
      return fetch(request).then((networkResponse) => {
        // Only cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.error('[SW] Fetch failed:', err.message);
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Push event - handle push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event.data ? event.data.text() : 'No data');
  
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error('[SW] Failed to parse push data:', e);
    data = { title: 'Daily Verse', body: event.data ? event.data.text() : 'New notification' };
  }

  const title = data.title || 'Daily Verse';
  const options = {
    body: data.body || 'Your daily verse is ready',
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    data: data.data || {},
    actions: [
      { action: 'open', title: 'Read' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: 'daily-verse',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();

  if (event.action === 'dismiss') return;

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus existing window
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data?.verseUrl || '/');
      }
    })
  );
});

// Message event - handle messages from main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting...');
    event.waitUntil(
      self.skipWaiting().then(() => {
        console.log('[SW] Skipped waiting, claiming clients');
        return self.clients.claim();
      })
    );
  }
  
  if (event.data && event.data.type === 'GET_CACHE_VERSION') {
    event.ports[0].postMessage({ type: 'CACHE_VERSION', cacheVersion: CACHE_NAME });
  }
});

// Background sync for daily verse
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'daily-verse-sync') {
    event.waitUntil(
      fetch('/api/daily-verse')
        .then(response => response.json())
        .then(data => {
          console.log('[SW] Daily verse synced:', data);
          return caches.open(CACHE_NAME).then(cache => {
            return cache.put('/api/daily-verse', new Response(JSON.stringify(data)));
          });
        })
        .catch(err => console.error('[SW] Sync failed:', err))
    );
  }
});

// Periodic background sync
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'daily-verse-periodic') {
    event.waitUntil(
      self.registration.showNotification('Daily Verse', {
        body: 'Your daily verse is ready to read',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'daily-verse',
        data: { verseUrl: '/' }
      })
    );
  }
});
