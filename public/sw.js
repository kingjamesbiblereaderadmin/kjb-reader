// Service Worker for KJB Reader - Full Offline Support
const CACHE_NAME = 'kjb-reader-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Some assets failed to cache:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
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

// Fetch event - cache-first strategy for assets, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // For Bible data and media files - cache-first
  if (url.hostname === 'media.base44.com' || 
      url.pathname.includes('.txt') ||
      url.pathname.includes('.png') ||
      url.pathname.includes('.jpg') ||
      url.pathname.includes('.jpeg') ||
      url.pathname.includes('.css') ||
      url.pathname.includes('.js')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          console.log('[SW] Cache hit:', request.url);
          // Return cached version immediately
          return cachedResponse;
        }
        
        // Not in cache - fetch from network
        try {
          const networkResponse = await fetch(request);
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          console.warn('[SW] Network fetch failed:', err);
          // Return offline fallback if available
          return new Response('Offline', { status: 503 });
        }
      })
    );
    return;
  }

  // For app routes - cache-first with network fallback
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[SW] Serving from cache:', request.url);
        return cachedResponse;
      }
      
      // Not in cache - try network
      return fetch(request).then((networkResponse) => {
        // Cache successful responses
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline - return index.html for navigation requests (SPA support)
        if (request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting');
    self.skipWaiting();
  }
});

// Background sync for notifications (Android)
self.addEventListener('periodicsync', (event) => {
  console.log('[SW] Periodic sync:', event.tag);
  if (event.tag === 'daily-verse-notif') {
    event.waitUntil(
      (async () => {
        try {
          // Read config from cache
          const cache = await caches.open('kjb-notif-config');
          const response = await cache.match('/notif-config');
          if (!response) return;
          
          const config = await response.json();
          const now = Date.now();
          
          // Check if notification is due
          if (config.nextTs && now >= config.nextTs) {
            const logoUrl = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png';
            
            // Show notification via service worker
            await self.registration.showNotification('King James Bible — Daily Verse', {
              body: `"${config.verseText}" — ${config.verseRef}`,
              icon: logoUrl,
              badge: logoUrl,
              tag: 'daily-verse',
              renotify: true,
              silent: false,
              vibrate: [200, 100, 200],
              data: { url: self.location.origin }
            });
            
            console.log('[SW] Daily verse notification shown');
          }
        } catch (err) {
          console.error('[SW] Periodic sync error:', err);
        }
      })()
    );
  }
});
