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

// Periodic background sync - only works on some Android devices when app is installed
// Falls back to checking on app open if not supported
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
          const today = new Date().toISOString().split('T')[0];
          
          console.log('[SW] Checking notification time:', {
            now,
            nextTs: config.nextTs,
            lastDate: config.lastDate || '',
            today
          });
          
          // Check if it's time to send notification and not already sent today
          if (now >= config.nextTs && config.lastDate !== today) {
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
            console.log('[SW] Skipping - not time yet or already sent today');
          }
        } catch (err) {
          console.error('[SW] Periodic sync error:', err);
        }
      })()
    );
  }
});

// Push notification event - receives messages from server even when app is closed
self.addEventListener('push', event => {
  console.log('[SW] Push event received:', event.data ? event.data.text() : 'no data');
  
  event.waitUntil(
    (async () => {
      try {
        let data = {};
        if (event.data) {
          try {
            data = event.data.json();
          } catch {
            data = { title: 'KJB Reader', body: event.data.text() };
          }
        }
        
        const title = data.title || 'King James Bible';
        const body = data.body || 'New notification';
        const icon = data.icon || 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png';
        const badge = data.badge || icon;
        const url = data.url || '/';
        const tag = data.tag || 'daily-verse';
        
        console.log('[SW] Showing notification:', { title, body, tag });
        
        await self.registration.showNotification(title, {
          body,
          icon,
          badge,
          tag,
          renotify: true,
          data: { url },
          actions: data.actions || []
        });
        
        console.log('[SW] Notification shown successfully');
      } catch (err) {
        console.error('[SW] Push notification error:', err);
      }
    })()
  );
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
