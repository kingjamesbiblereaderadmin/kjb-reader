// KJB Reader Service Worker v20260612_1900
// Cache-first loading for offline support

const CACHE_NAME = 'kjb-reader-v20260612_1900';
const LEGACY_CACHE_NAME = 'kjb-legacy-v9';

const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  console.log('[SW] Installing new version', CACHE_NAME);
  // Cache the app shell. Do NOT call skipWaiting()/clients.claim() here and do
  // NOT post UPDATE_FOUND — auto-activating on install fired controllerchange
  // immediately and caused an infinite refresh loop. The new SW stays in the
  // "waiting" state until the SplashScreen explicitly sends SKIP_WAITING.
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(APP_SHELL_FILES).catch((err) => {
        console.warn('[SW] Some resources failed to cache:', err);
        return Promise.resolve();
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new version');
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
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Skip chrome-extension and other non-http(s) requests
  if (!url.startsWith('http://') && !url.startsWith('https://')) return;

  // Handle Bible data requests with cache-first strategy
  if (url.includes('KingJamesBible-PureCambridgeEditionTextfile2.txt')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(url);
        if (cachedResponse) {
          console.log('[SW] Cache-first: returning cached Bible data');
          return cachedResponse;
        }

        console.log('[SW] Cache miss for Bible data, fetching from network');
        const fetchPromise = fetch(url).then((response) => {
          if (!response.ok) {
            throw new Error('HTTP ' + response.status);
          }
          const responseClone = response.clone();
          cache.put(url, responseClone);
          return response;
        });

        return fetchPromise;
      }).catch((err) => {
        console.warn('[SW] Bible data fetch failed:', err);
        // Return cached version even if stale
        return caches.match(url);
      })
    );
    return;
  }

  // Network-only for ALL JavaScript/JSX files (prevents stale module errors)
  const isJsFile = url.endsWith('.js') || url.endsWith('.jsx') || url.includes('/src/');
  if (isJsFile) {
    event.respondWith(
      fetch(event.request).then((response) => {
        return response;
      }).catch(() => {
        console.warn('[SW] JS fetch failed:', url);
        return caches.match(event.request);
      })
    );
    return;
  }

  // Default: cache-first for app shell, network-first for other assets
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      try {
        const response = await fetch(event.request);
        if (response.ok) {
          cache.put(event.request, response.clone());
        }
        return response;
      } catch (err) {
        console.warn('[SW] Fetch failed, returning offline page:', err);
        return caches.match('/offline.html');
      }
    })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting on message');
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'PREWARM_ASSETS') {
    const urls = event.data.urls || [];
    console.log('[SW] Prewarming', urls.length, 'assets');
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        return cache.addAll(urls).catch((err) => {
          console.warn('[SW] Some prewarm assets failed:', err);
          return Promise.resolve();
        });
      })
    );
  }
});
