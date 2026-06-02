// KJB Reader Service Worker — offline-first PWA
// Caches the app shell (HTML/JS/CSS) so the app loads without network.
// Bible text data is stored separately in IndexedDB by bibleCache.js.

const SHELL_CACHE = 'kjb-shell-v4';

// App shell assets to pre-cache on install
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
];

// ── Install: pre-cache the minimal shell ────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing, caching shell...');
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => {
      // Cache what we can; ignore failures (some assets may not exist yet)
      return cache.addAll(SHELL_ASSETS).catch(err => {
        console.warn('[SW] Some shell assets failed to cache:', err.message);
      });
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean up old shell caches ─────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== SHELL_CACHE)
          .map(k => {
            console.log('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: network-first for navigation, cache-first for assets ──────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip Base44 API / auth calls
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

  // Navigation requests (HTML pages): network-first, fall back to cached /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache the fresh response
          const clone = response.clone();
          caches.open(SHELL_CACHE).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() => {
          // Offline: serve cached index.html for all navigation
          return caches.match('/index.html').then(cached => {
            if (cached) return cached;
            return caches.match('/offline.html');
          });
        })
    );
    return;
  }

  // JS/CSS/font assets: cache-first (they're fingerprinted, safe to cache long-term)
  if (
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot)$/) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Images: cache-first with network fallback
  if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|webp)$/)) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 404 }));
      })
    );
    return;
  }
});

// ── Manual cache warm-up (sent from preloadAllRoutes in App.jsx) ─────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'PREWARM_ASSETS') {
    const urls = event.data.urls || [];
    if (!urls.length) return;
    caches.open(SHELL_CACHE).then(cache => {
      urls.forEach(url => {
        cache.match(url).then(hit => {
          if (!hit) {
            fetch(url, { cache: 'no-store' }).then(res => {
              if (res.ok) cache.put(url, res);
            }).catch(() => {});
          }
        });
      });
    });
  }
});

// ── Push notifications ───────────────────────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title || 'KJB Daily Verse', {
        body: data.body || '',
        icon: data.icon || '/icons/icon-192.png',
        badge: data.icon || '/icons/icon-192.png',
        tag: 'daily-verse',
        renotify: true,
        data: { url: data.url || '/' },
      })
    );
  } catch {}
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
