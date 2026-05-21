// KJB Reader Service Worker - Optimized for offline support and performance
const CACHE_NAME = 'kjb-reader-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch(err => {
      console.error('[SW] Cache failed:', err.message);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate event');
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
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - cache-first strategy with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // NEVER cache React/Vite source files, node_modules, or dev files - always fetch fresh
  const isSourceFile = url.pathname.includes('/src/') || 
                       url.pathname.includes('/node_modules/') ||
                       url.pathname.includes('/@vite/') ||
                       url.pathname.includes('/@react-refresh/') ||
                       url.pathname.endsWith('.js') ||
                       url.pathname.endsWith('.jsx') ||
                       url.pathname.endsWith('.ts') ||
                       url.pathname.endsWith('.tsx') ||
                       url.pathname.endsWith('.css');
  
  if (isSourceFile) {
    console.log('[SW] Skipping cache for source file:', request.url);
    event.respondWith(fetch(request));
    return;
  }

  // Cache-first strategy for static assets
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

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Daily Verse', body: event.data.text() };
    }
  }

  const title = data.title || 'KJB Reader';
  const options = {
    body: data.body || 'Your daily verse is ready',
    icon: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png',
    badge: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png',
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: 'open', title: 'Read Now' },
      { action: 'dismiss', title: 'Later' }
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

  if (event.action === 'dismiss') {
    return;
  }

  // Open or focus the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if not already open
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Message event - handle skip waiting and cache version
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({
      type: 'CACHE_VERSION',
      cacheVersion: CACHE_NAME
    });
  }
});

// Background sync for daily notifications
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  
  if (event.tag === 'daily-verse') {
    event.waitUntil(
      // Fetch and cache daily verse
      fetch('https://media.base44.com/files/public/6a05d76723afe58d80c589e8/daily-verse.json')
        .then(response => response.json())
        .then(data => {
          console.log('[SW] Daily verse synced:', data);
          return caches.open(CACHE_NAME).then(cache => {
            return cache.put('/daily-verse.json', new Response(JSON.stringify(data)));
          });
        })
        .catch(err => {
          console.error('[SW] Sync failed:', err.message);
        })
    );
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  
  if (event.tag === 'daily-verse') {
    event.waitUntil(
      // Schedule daily notification
      self.registration.showNotification('KJB Reader', {
        body: 'Your daily verse is ready!',
        icon: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png',
        badge: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png',
        tag: 'daily-verse'
      })
    );
  }
});

console.log('[SW] Service worker loaded');
