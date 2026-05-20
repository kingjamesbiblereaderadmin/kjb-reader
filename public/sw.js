// Service Worker for KJB Reader - Enhanced with aggressive pre-caching
const CACHE_NAME = 'kjb-reader-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - pre-cache all static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        
        // Pre-cache all static assets with retry logic
        const preCacheAssets = async () => {
          const failed = [];
          for (const url of STATIC_ASSETS) {
            try {
              const response = await fetch(url, { cache: 'reload' });
              if (response.ok) {
                await cache.put(url, response);
                console.log('[SW] ✓ Pre-cached:', url);
              } else {
                failed.push(url);
              }
            } catch (err) {
              console.error('[SW] ✗ Failed to cache:', url, err.message);
              failed.push(url);
            }
          }
          if (failed.length > 0) {
            console.warn('[SW] Failed to cache:', failed);
          }
        };

        await preCacheAssets();
        
        // Also pre-fetch Bible data in background
        self.registration.sync?.register('bible-sync')
          .catch(() => console.log('[SW] Background sync not available'));
        
        console.log('[SW] Installation complete');
      } catch (err) {
        console.error('[SW] Installation failed:', err);
      }
    })()
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();
      await Promise.all(
        cacheKeys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      );
      await self.clients.claim();
      console.log('[SW] Activation complete');
    })()
  );
});

// Fetch event - cache-first strategy for static assets, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Vite chunk requests - always fetch fresh
  if (url.pathname.includes('/assets/') || url.searchParams.has('v=')) {
    return;
  }

  // Cache-first for static assets
  if (
    url.origin === location.origin &&
    (
      url.pathname === '/' ||
      url.pathname === '/index.html' ||
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.js') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.svg') ||
      url.pathname.endsWith('.json')
    )
  ) {
    event.respondWith(
      (async () => {
        try {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(request);
          
          if (cached) {
            console.log('[SW] ✓ Cache hit:', request.url);
            // Return cached version immediately
            return cached;
          }
          
          // Cache miss - fetch from network
          console.log('[SW] 🌐 Cache miss, fetching:', request.url);
          const response = await fetch(request);
          
          if (response.ok) {
            await cache.put(request, response.clone());
          }
          
          return response;
        } catch (err) {
          console.error('[SW] ✗ Fetch failed:', request.url, err.message);
          // Return offline fallback if available
          const cache = await caches.open(CACHE_NAME);
          return cache.match('/index.html');
        }
      })()
    );
    return;
  }

  // Network-first for external APIs (Bible data)
  if (url.hostname === 'media.base44.com') {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request, { cache: 'reload' });
          return response;
        } catch (err) {
          console.error('[SW] ✗ API fetch failed:', url.pathname, err.message);
          // Return cached response if available
          const cache = await caches.open(CACHE_NAME);
          return cache.match(request);
        }
      })()
    );
    return;
  }
});

// Background sync for Bible data
self.addEventListener('sync', (event) => {
  if (event.tag === 'bible-sync') {
    console.log('[SW] Background sync: Bible data');
    event.waitUntil(
      (async () => {
        try {
          // Trigger Bible data fetch in background
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({ type: 'BIBLE_SYNC' });
          });
        } catch (err) {
          console.error('[SW] Background sync failed:', err);
        }
      })()
    );
  }
});

// Push notifications
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event.data?.text());
  
  event.waitUntil(
    (async () => {
      try {
        const data = event.data?.json() || {};
        const title = data.title || 'Daily Verse';
        const options = {
          body: data.body || 'Your daily verse from KJB Reader',
          icon: '/icon-192.png',
          badge: '/badge-192.png',
          data: { url: data.url || '/daily-reading' },
          actions: [
            { action: 'open', title: 'Read' },
            { action: 'dismiss', title: 'Dismiss' }
          ],
          tag: 'daily-verse',
          renotify: true
        };
        
        await self.registration.showNotification(title, options);
      } catch (err) {
        console.error('[SW] Push notification failed:', err);
      }
    })()
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  event.notification.close();
  
  if (event.action === 'dismiss') return;
  
  event.waitUntil(
    (async () => {
      const urlToOpen = event.notification.data?.url || '/';
      
      const clients = await self.clients.matchAll({ type: 'window' });
      const matchingClient = clients.find(client => 
        client.url === urlToOpen && 'focus' in client
      );
      
      if (matchingClient) {
        await matchingClient.focus();
      } else {
        await self.clients.openWindow(urlToOpen);
      }
    })()
  );
});

// Message handler for manual cache refresh
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data?.type === 'REFRESH_CACHE') {
    console.log('[SW] Manual cache refresh requested');
    event.waitUntil(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        await cache.delete('/index.html');
        await cache.delete('/');
        
        try {
          const response = await fetch('/index.html', { cache: 'reload' });
          if (response.ok) {
            await cache.put('/index.html', response);
            console.log('[SW] ✓ Cache refreshed');
          }
        } catch (err) {
          console.error('[SW] ✗ Cache refresh failed:', err);
        }
        
        // Notify all clients
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
          client.postMessage({ type: 'CACHE_REFRESHED' });
        });
      })()
    );
  }
});
