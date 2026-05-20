// Cache version - increment this to force cache refresh on updates
const CACHE_VERSION = 'v3-dyslexic-fix';
const CACHE_NAME = `kjb-reader-${CACHE_VERSION}`;

// Assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing cache:', CACHE_NAME);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch(err => console.error('[SW] Pre-cache failed:', err))
  );
  // Force activation immediately
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating:', CACHE_NAME);
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => {
      // Claim all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - network first for HTML/JS/API, cache first for static assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // Network-first for HTML, JS, CSS, API calls
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'document' ||
    url.pathname.startsWith('/api/') ||
    url.hostname !== self.location.hostname
  ) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful responses
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback to cache if offline
          return caches.match(request);
        })
    );
    return;
  }

  // Cache-first for images, fonts, and other static assets
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then(response => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});

// Handle skip waiting message
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic background sync - fires even when app is closed (Android)
self.addEventListener('periodicsync', event => {
  console.log('[SW] Periodic sync triggered:', event.tag);
  
  if (event.tag === 'daily-verse-notif') {
    event.waitUntil(
      (async () => {
        try {
          // Fetch notification config from cache
          const cache = await caches.open('kjb-notif-config');
          const response = await cache.match('/notif-config');
          if (!response) return;
          
          const config = await response.json();
          const now = Date.now();
          
          // Check if it's time to send notification
          if (now >= config.nextTs) {
            const today = new Date().toISOString().split('T')[0];
            const lastDate = config.lastDate || '';
            
            // Don't send if already sent today
            if (lastDate !== today) {
              const logoUrl = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png';
              
              // Show notification
              await self.registration.showNotification('King James Bible — Daily Verse', {
                body: `"${config.verseText}" — ${config.verseRef}`,
                icon: logoUrl,
                badge: logoUrl,
                tag: 'daily-verse',
                renotify: true,
                data: {
                  url: '/'
                }
              });
              
              // Update last sent date in cache
              config.lastDate = today;
              await cache.put('/notif-config', new Response(JSON.stringify(config), {
                headers: { 'Content-Type': 'application/json' }
              }));
            }
          }
        } catch (err) {
          console.error('[SW] Periodic sync error:', err);
        }
      })()
    );
  }
});

// Handle notification click
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        // If app is already open, focus it
        for (let client of windowClients) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
});
