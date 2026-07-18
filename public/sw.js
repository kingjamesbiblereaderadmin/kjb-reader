// KJB Reader Service Worker v20260718_1956
// Cache-first loading for offline support

const CACHE_NAME = 'kjb-reader-v20260718_1956';
const LEGACY_CACHE_NAME = 'kjb-legacy-v9';

// Core app shell resources to cache immediately
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
];

// Cross-origin assets to precache separately from the app shell (addAll is
// atomic — one failure rejects the whole batch, so these go in individually).
const PRECACHE_ASSETS = [
  'https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/c2459f3df_kjb-icon512-v20260713.png',
  // Self-hosted OpenDyslexic fonts — precache at install so they're available
  // offline immediately, not just after the first page that uses them.
  '/fonts/OpenDyslexic-regular.woff',
  '/fonts/OpenDyslexic-bold.woff',
  '/fonts/OpenDyslexic-italic.woff',
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      // Cache the app shell first; then precache cross-origin assets
      // individually so a single failure doesn't reject the whole batch.
      return cache.addAll(APP_SHELL_FILES).catch(err => {
        console.warn('[SW] Some shell resources failed to cache:', err);
        return Promise.resolve();
      }).then(() => {
        // Cross-origin images (e.g. the logo from media.base44.com) return
        // "opaque" responses with no CORS headers. cache.add() defaults to
        // cors mode and rejects these — so fetch in no-cors and cache.put
        // the opaque response directly, which caches.match() can still serve.
        return Promise.all(
          PRECACHE_ASSETS.map(url =>
            fetch(url, { mode: 'no-cors' })
              .then(response => cache.put(url, response))
              .catch(err => console.warn('[SW] Precache failed for', url, err))
          )
        );
      });
    })
  );
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

  // Handle legacy reader function FIRST
  const isLegacyRequest =
    url.pathname.includes('/functions/legacy') ||
    url.pathname.endsWith('/legacy');
  if (isLegacyRequest) {
    const isChunk = url.search.indexOf('chunk=') !== -1;
    event.respondWith(
      caches.open(LEGACY_CACHE_NAME).then((cache) => {
        if (isChunk) {
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
        return fetch(request).then((response) => {
          if (response && response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => {
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
                '<!DOCTYPE html>' +
                '<html><head><title>Legacy Reader</title></head><body>' +
                '<h1>Legacy Reader</h1>' +
                '<p>This page needs to be opened online once before it can be read offline.</p>' +
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

  // Never cache sw.js itself — browser must always fetch it fresh for update detection
  if (url.pathname === '/sw.js') return;

  // Navigation requests (the HTML document) use NETWORK-FIRST so a freshly
  // deployed build's index.html — which references the new hashed JS chunks —
  // is always fetched when online. Serving a stale cached index.html was the
  // cause of black screens on reload: the old HTML pointed at lazy chunks that
  // no longer exist on the CDN (404), crashing the page. Falling back to cache
  // (then offline.html) keeps full offline support.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() =>
        caches.match(request).then((cached) =>
          cached || caches.match('/index.html').then((idx) => idx || caches.match('/offline.html'))
        )
      )
    );
    return;
  }

  // Always fetch the manifest fresh (network-first) so corrected icons reach
  // Chrome/Samsung/Edge immediately instead of a stale cached version.
  // Match both the static manifest.json (legacy) and the dynamic
  // /functions/manifest endpoint the app now links to.
  if (url.pathname === '/manifest.json' || url.pathname.startsWith('/manifest.json?') ||
      url.pathname === '/functions/manifest' || url.pathname.startsWith('/functions/manifest?')) {
    event.respondWith(
      fetch(request).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // DEV MODE: Skip service worker caching for development
  if (url.pathname.includes('/@vite') ||
      url.pathname.includes('/@react-refresh') ||
      url.pathname.includes('/node_modules/.vite') ||
      url.pathname.startsWith('/src/') ||
      url.pathname.endsWith('.jsx') ||
      url.pathname.endsWith('.js') && url.pathname.includes('chunk-')) {
    return;
  }

  // Cache-first strategy for app resources
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        console.log('[SW] Serving from cache:', request.url);
        return cachedResponse;
      }

      return fetch(request).then((response) => {
        // Cross-origin  fetches (e.g. the logo from media.base44.com) come
        // back as "opaque" responses when there's no CORS grant: status 0,
        // ok === false, but the body is still valid and cacheable. Previously
        // this handler skipped caching anything with !response.ok, so the logo
        // (and any other cross-origin asset) never got cached and disappeared
        // once the device went offline.
        const isCacheable = response.ok || response.type === 'opaque';

        if (!isCacheable) {
          console.log('[SW] Network response not ok:', response.status);
          return response;
        }

        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });

        return response;
      }).catch((error) => {
        console.log('[SW] Fetch failed, showing offline page:', error);

        if (request.mode === 'navigate') {
          return caches.match('/offline.html');
        }

        return new Response('Offline', { status: 503 });
      });
    })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting, activating now');
    self.skipWaiting();
  }

  // Report the ACTUAL running service worker version (its live CACHE_NAME) back
  // to whoever asked, via the provided MessagePort. This lets the UI show the
  // real live worker version instead of a hardcoded constant that can drift.
  if (event.data && event.data.type === 'GET_VERSION') {
    const reply = { type: 'VERSION', version: CACHE_NAME.replace('kjb-reader-', '') };
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage(reply);
    } else if (event.source && event.source.postMessage) {
      event.source.postMessage(reply);
    }
  }

  if (event.data && event.data.type === 'PREWARM_ASSETS') {
    const urls = event.data.urls || [];
    if (urls.length > 0) {
      console.log('[SW] Prewarming', urls.length, 'assets');
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
          return Promise.all(
            urls.map(url =>
              fetch(url, { mode: 'no-cors' })
                .then(response => {
                  // Opaque cross-origin responses have ok===false but are valid
                  // and cacheable — same check as the fetch handler uses.
                  if (response.ok || response.type === 'opaque') {
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

// Handle notification taps - focus an existing window (and navigate it) or open a
// new one. Required on Android/Samsung where notifications are shown via the SW.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Reuse an open window if one exists - focus it and navigate to the verse.
      for (const client of clientList) {
        if ('focus' in client) {
          const focused = client.focus();
          if ('navigate' in client) {
            try {
              client.navigate(targetUrl);
            } catch (err) {
              console.warn('[SW] notificationclick navigate failed:', err);
            }
          }
          return focused;
        }
      }
      // No window open - open a new one.
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
      return undefined;
    })
  );
});
