const CACHE_NAME = 'kjb-reader-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Failed to cache some assets:', err.message);
        // Continue even if some assets fail
        return Promise.resolve();
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
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
    })
  );
  self.clients.claim();
});

// Fetch event - network first for API, cache first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external resources (keep them network-only)
  if (url.origin !== location.origin) {
    // For images, try cache-first
    if (request.destination === 'image') {
      event.respondWith(
        caches.match(request).then((cached) => {
          return cached || fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, clone);
              });
            }
            return response;
          }).catch(() => cached);
        })
      );
    }
    return;
  }

  // For HTML pages, network first with cache fallback
  if (request.destination === 'document' || url.pathname === '/') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For JS/CSS chunks, network first with cache fallback
  if (request.destination === 'script' || request.destination === 'style') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For other assets, cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      });
    })
  );
});

// Background sync for daily verse notifications
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync event:', event.tag);
  if (event.tag === 'daily-verse-sync') {
    event.waitUntil(
      // Get the latest daily verse and prepare notification
      self.registration.showNotification('King James Bible — Verse of the Day', {
        body: 'Open the app to read today\'s verse',
        icon: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png',
        badge: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png',
        tag: 'daily-verse',
        requireInteraction: false
      })
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received');
  const data = event.data?.json() || {};
  const title = data.title || 'King James Bible';
  const options = {
    body: data.body || 'Open the app to read',
    icon: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png',
    badge: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png',
    tag: data.tag || 'general',
    requireInteraction: false,
    data: data.data || {}
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If app is already open, focus it
        for (const client of clientList) {
          if (client.url === location.origin && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
  );
});

// Message handler for skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
