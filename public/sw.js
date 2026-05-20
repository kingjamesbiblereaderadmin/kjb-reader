const CACHE_NAME = 'kjb-cache-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Install event - cache static assets and force skip waiting
self.addEventListener('install', (event) => {
  console.log('[SW] Install - forcing update');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force skip waiting to activate new SW immediately
  self.skipWaiting();
});

// Activate event - clean old caches and force claim all clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate - claiming all clients');
  event.waitUntil(
    Promise.all([
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      }),
      // Force all clients to use this new service worker immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - network first for API and dynamic content, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip caching for Vite dev server, node_modules, and source files
  if (url.includes('/@vite') || 
      url.includes('/@react-refresh') ||
      url.includes('/node_modules') ||
      url.includes('/src/') ||
      url.endsWith('.js') || 
      url.endsWith('.jsx') || 
      url.endsWith('.ts') || 
      url.endsWith('.tsx') ||
      url.endsWith('.css')) {
    // Always fetch from network for development files
    return;
  }
  
  // Network-first for Bible API and dynamic content
  if (url.includes('bible-api') || url.includes('api')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Cache-first for static assets with network fallback refresh
  event.respondWith(
    caches.match(event.request).then(async (cachedResponse) => {
      if (cachedResponse) {
        // Return cached version but update in background
        fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      });
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Received SKIP_WAITING message');
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'REFRESH_CACHE') {
    console.log('[SW] Received REFRESH_CACHE message');
    caches.delete(CACHE_NAME).then(() => {
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      });
    });
    event.ports[0].postMessage({ type: 'CACHE_REFRESHED' });
  }
  // Handle notification click - open app instead of showing share
  if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
    event.waitUntil(
      self.clients.openWindow(event.data.url || '/')
    );
  }
});

// Handle notification clicks to open app properly
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.notification.tag);
  event.notification.close();
  
  // Open the app when notification is clicked
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // If app is already open, focus it
      if (clients.length > 0) {
        return clients[0].focus();
      }
      // Otherwise open a new window
      const urlToOpen = event.notification.data?.url || '/';
      return self.clients.openWindow(urlToOpen);
    })
  );
});
