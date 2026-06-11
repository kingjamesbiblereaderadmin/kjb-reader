// KJB Reader Service Worker v20260611_346
// Cache-first loading for offline support

const CACHE_NAME = 'kjb-reader-v20260611_346';
// Bumped to purge any partially-cached legacy chunks so every client re-caches
// the full Bible fresh to 100% on the next online visit.
const LEGACY_CACHE_NAME = 'kjb-legacy-v4';

// Core app shell resources to cache immediately
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(APP_SHELL_FILES).catch(err => {
        console.warn('[SW] Some resources failed to cache:', err);
        return Promise.resolve(); // Don't fail install if some resources fail
      });
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== LEGACY_CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - cache-first strategy with dev mode bypass
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle legacy reader function FIRST (before the /api/ skip below), so a
  // refresh works offline. The legacy function lives at
  // /api/apps/{appId}/functions/legacy (or /functions/legacy), which would
  // otherwise be skipped by the /api/ rule and fail when offline.
  const isLegacyRequest =
    url.pathname.includes('/functions/legacy') ||
    url.pathname.endsWith('/legacy');
  if (isLegacyRequest) {
    // Book chunks (?chunk=N) are immutable — once cached they never change, so
    // serve them CACHE-FIRST. This stops the reader re-downloading the whole
    // Bible on every online refresh; it only fetches a chunk if not yet cached.
    const isChunk = url.search.indexOf('chunk=') !== -1;
    event.respondWith(
      caches.open(LEGACY_CACHE_NAME).then((cache) => {
        if (isChunk) {
          // Bible chunks are immutable — serve from cache if present, and only
          // download chunks that aren't cached yet (cache-first). This avoids
          // re-downloading the whole Bible on every online visit.
          return cache.match(request).then((cached) => {
            if (cached) return cached;
            return fetch(request).then((response) => {
              if (response && (response.ok || response.status === 0)) {
                cache.put(request, response.clone());
              }
              return response;
            });
          });
        }
        // Shell page: network-first so content updates propagate, with offline
        // fallback to the cached shell.
        return fetch(request).then((response) => {
          if (response && response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => {
          // Offline: try an exact match first, then fall back to ANY cached
          // legacy shell (ignoring query params like ?app_id=) so a refresh
          // with a slightly different URL still serves the cached page.
          return cache.match(request).then((cached) => {
            if (cached) return cached;
            return cache.matchAll().then((all) => {
              const shell = all.find((r) => {
                try {
                  const u = new URL(r.url);
                  return (u.pathname.indexOf('/functions/legacy') !== -1 || u.pathname.endsWith('/legacy')) && u.search.indexOf('chunk=') === -1;
                } catch { return false; }
              });
              if (shell) return shell;
              return new Response(
                '<!DOCTYPE html><html><body style="font-family:Arial;padding:20px;">' +
                '<h1>Legacy Reader</h1><p>This page needs to be opened online once before it can be read offline.</p>' +
                '</body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            });
          });
        });
      })
    );
    return;
  }

  // Skip all API requests - let them hit the network directly
  if (url.pathname.startsWith('/api/')) return;

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // DEV MODE: Skip service worker caching for development
  // This prevents stale React/Vite chunks from breaking the dev server
  if (url.pathname.includes('/@vite') || 
      url.pathname.includes('/@react-refresh') ||
      url.pathname.includes('/node_modules/.vite') ||
      url.pathname.startsWith('/src/') ||
      url.pathname.endsWith('.jsx') ||
      url.pathname.endsWith('.js') && url.pathname.includes('chunk-')) {
    // Let dev server handle these directly
    return;
  }

  // (Legacy reader handling moved above the /api/ skip.)
  if (false) {
    event.respondWith(
      caches.open(LEGACY_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((response) => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
            return response;
          }).catch(() => {
            // If offline and no cache, return a basic HTML page
            return new Response(
              '<html><head><title>KJB Legacy</title></head><body><h1>Legacy Reader</h1><p>Please connect to the internet to load the legacy reader.</p></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          });
        });
      })
    );
    return;
  }

  // Cache-first strategy for app resources
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[SW] Serving from cache:', request.url);
        return cachedResponse;
      }
      
      // Not in cache - fetch from network
      return fetch(request).then((response) => {
        // Don't cache non-successful responses (status 0 = opaque/CORS, skip silently)
        if (!response.ok && response.status !== 0) {
          console.log('[SW] Network response not ok:', response.status);
          return response;
        }
        if (response.status === 0) {
          return response;
        }

        // Clone the response for caching
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch((error) => {
        console.log('[SW] Fetch failed, showing offline page:', error);
        
        // For navigation requests, show offline page
        if (request.mode === 'navigate') {
          return caches.match('/offline.html');
        }
        
        // For other requests, return error
        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Handle messages from main thread (e.g., SKIP_WAITING, PREWARM_ASSETS)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting, activating now');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'PREWARM_ASSETS') {
    const urls = event.data.urls || [];
    if (urls.length > 0) {
      console.log('[SW] Prewarming', urls.length, 'assets');
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
          return Promise.all(
            urls.map(url => 
              fetch(url)
                .then(response => {
                  if (response.ok) {
                    return cache.put(url, response.clone());
                  }
                })
                .catch(err => console.warn('[SW] Prewarm failed for', url, err))
            )
          );
        })
      );
    }
  }
});
