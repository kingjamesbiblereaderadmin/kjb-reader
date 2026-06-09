// KJB Reader Service Worker - Offline-First Strategy
const CACHE_VERSION = 'v20260609_272';
const APP_SHELL_CACHE = `kjb-app-shell-${CACHE_VERSION}`;
const BIBLE_DATA_CACHE = `kjb-bible-data-${CACHE_VERSION}`;

// Core app shell resources to cache immediately
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing version:', CACHE_VERSION);
  event.waitUntil(
    caches.open(APP_SHELL_CACHE)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(APP_SHELL_FILES).catch(err => {
          console.warn('[SW] Some files failed to cache:', err);
          return Promise.resolve(); // Continue even if some files fail
        });
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating version:', CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('kjb-') && name !== APP_SHELL_CACHE && name !== BIBLE_DATA_CACHE)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - cache-first for app shell, network-first for API
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) return;

  // Handle navigation requests (HTML pages) - cache-first for offline support
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            // Return cached version immediately for offline support
            return cached;
          }
          // Not in cache - try network
          return fetch(request)
            .then((response) => {
              if (response.ok) {
                const responseClone = response.clone();
                caches.open(APP_SHELL_CACHE).then((cache) => {
                  cache.put(request, responseClone);
                });
              }
              return response;
            })
            .catch(() => {
              // Completely offline - return offline page
              return caches.match('/offline.html');
            });
        })
    );
    return;
  }

  // Cache-first strategy for static assets (CSS, JS, images, fonts)
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'image' || 
      request.destination === 'font') {
    event.respondWith(
      caches.match(request)
        .then((cached) => {
          if (cached) {
            // Also fetch in background to update cache
            fetch(request).then((response) => {
              if (response.ok) {
                caches.open(APP_SHELL_CACHE).then((cache) => {
                  cache.put(request, response);
                });
              }
            }).catch(() => {});
            return cached;
          }
          return fetch(request).then((response) => {
            if (response.ok) {
              const responseClone = response.clone();
              caches.open(APP_SHELL_CACHE).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          });
        })
    );
    return;
  }

  // Network-first for API calls and other requests
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting, activating now');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'PREWARM_ASSETS') {
    const urls = event.data.urls || [];
    console.log('[SW] Prewarming', urls.length, 'assets');
    event.waitUntil(
      caches.open(APP_SHELL_CACHE)
        .then((cache) => {
          return Promise.all(
            urls.map((url) => {
              return fetch(url)
                .then((response) => {
                  if (response.ok) {
                    return cache.put(url, response);
                  }
                })
                .catch((err) => {
                  console.warn('[SW] Failed to prewarm:', url, err);
                });
            })
          );
        })
    );
  }
});
