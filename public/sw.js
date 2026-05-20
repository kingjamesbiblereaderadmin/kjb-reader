const CACHE_VERSION = 'v4-notif-fix';
const CACHE_NAME = `kjb-reader-${CACHE_VERSION}`;
const NOTIF_CACHE = 'kjb-notif-config';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Install event, version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activate event');
  event.waitUntil(
    caches.keys().then(names => {
      return Promise.all(
        names.filter(name => name.startsWith('kjb-reader-') && name !== CACHE_NAME).map(name => {
          console.log('[SW] Deleting old cache:', name);
          return caches.delete(name);
        })
      );
    })
  );
  // Claim all clients immediately
  self.clients.claim();
});

// Fetch - network first for HTML, cache first for assets
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // HTML pages - network first with cache fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // API calls - network first
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Static assets - cache first
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      });
    }).catch(() => {
      // Offline fallback for images
      if (request.destination === 'image') {
        return caches.match('/manifest.json'); // Return something valid
      }
    })
  );
});

// Periodic background sync - fires even when app is closed (Android)
self.addEventListener('periodicsync', event => {
  console.log('[SW] Periodic sync triggered:', event.tag);
  
  if (event.tag === 'daily-verse-notif') {
    event.waitUntil(
      (async () => {
        try {
          // Fetch notification config from cache
          const cache = await caches.open(NOTIF_CACHE);
          const response = await cache.match('/notif-config');
          if (!response) {
            console.log('[SW] No notification config found');
            return;
          }
          
          const config = await response.json();
          const now = Date.now();
          
          console.log('[SW] Checking notification time:', {
            now,
            nextTs: config.nextTs,
            lastDate: config.lastDate
          });
          
          // Check if it's time to send notification
          if (now >= config.nextTs) {
            const today = new Date().toISOString().split('T')[0];
            const lastDate = config.lastDate || '';
            
            // Don't send if already sent today
            if (lastDate !== today) {
              const logoUrl = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png';
              
              console.log('[SW] Sending notification:', config.verseRef);
              
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
              
              console.log('[SW] Notification sent successfully');
            } else {
              console.log('[SW] Already sent today, skipping');
            }
          } else {
            console.log('[SW] Not time yet, next fire at:', new Date(config.nextTs));
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
  console.log('[SW] Notification clicked');
  event.notification.close();
  
  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        // If app is already open, focus it
        for (let client of windowClients) {
          if (client.url === event.notification.data.url && 'focus' in client) {
            console.log('[SW] Focusing existing window');
            return client.focus();
          }
        }
        // Otherwise, open a new window
        if (clients.openWindow) {
          console.log('[SW] Opening new window');
          return clients.openWindow(event.notification.data.url);
        }
      })
    );
  }
});

// Handle skip waiting message
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting');
    self.skipWaiting();
  }
});
