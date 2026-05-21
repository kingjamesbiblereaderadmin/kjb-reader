// Service Worker for KJB Reader PWA
// Enables offline access and push notifications

const CACHE_NAME = 'kjb-reader-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install event');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch(err => {
      console.error('[SW] Cache addAll failed:', err);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
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
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response for caching
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      }).catch(err => {
        console.error('[SW] Fetch failed:', err);
        // Return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'KJB Reader', body: event.data.text() };
    }
  }
  
  const title = data.title || 'King James Bible — Daily Verse';
  const options = {
    body: data.body || 'Your daily verse is ready',
    tag: 'daily-verse',
    renotify: true,
    vibrate: [200, 100, 200],
    silent: false,
    requireInteraction: false,
    data: {
      url: data.url || '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Open app if not already open
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Periodic background sync for daily notifications
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync event:', event.tag);
  
  if (event.tag === 'daily-verse-notif') {
    event.waitUntil(
      (async () => {
        try {
          // Read config from cache
          const cache = await caches.open('kjb-notif-config');
          const response = await cache.match('/notif-config');
          
          if (!response) {
            console.log('[SW] No notification config found');
            return;
          }
          
          const config = await response.json();
          const now = Date.now();
          
          // Check if it's time to send notification
          if (config.nextTs && now >= config.nextTs) {
            const today = new Date().toISOString().split('T')[0];
            
            // Check if already notified today
            const lastNotifDate = config.lastDate || '';
            if (lastNotifDate !== today) {
              // Show notification
              await self.registration.showNotification('King James Bible — Daily Verse', {
                body: `"${config.verseText}" — ${config.verseRef}`,
                tag: 'daily-verse',
                renotify: true,
                vibrate: [200, 100, 200],
                silent: false,
                requireInteraction: false,
                data: { url: '/' }
              });
              
              console.log('[SW] Daily verse notification sent');
              
              // Update config with new last notification date
              config.lastDate = today;
              config.nextTs = now + (24 * 60 * 60 * 1000); // Schedule for tomorrow
              
              await cache.put('/notif-config', new Response(JSON.stringify(config), {
                headers: { 'Content-Type': 'application/json' }
              }));
            }
          }
        } catch (err) {
          console.error('[SW] Periodic sync failed:', err);
        }
      })()
    );
  }
});

console.log('[SW] Service Worker loaded');
