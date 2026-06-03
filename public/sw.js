// KJB Reader Service Worker — offline-first PWA
// Caches the app shell (HTML/JS/CSS) so the app loads without network.
// Bible text data is stored separately in IndexedDB by bibleCache.js.

const SHELL_CACHE = 'kjb-shell-v5';

// Minimal shell assets to pre-cache on install
const SHELL_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
];

// ── Install: pre-cache the shell ────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing, caching shell...');
  event.waitUntil(
    caches.open(SHELL_CACHE).then(cache => {
      return Promise.allSettled(
        SHELL_ASSETS.map(url =>
          fetch(url, { cache: 'no-store' })
            .then(res => { if (res.ok) cache.put(url, res); })
            .catch(() => {})
        )
      );
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

// ── Fetch: cache-first for assets, network-first for navigation ──────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (url.origin !== self.location.origin) return;
  if (request.method !== 'GET') return;

  // Skip Base44 API / auth calls — always go to network
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return;

  // JS/CSS/font/image assets (fingerprinted) — cache-first, populate on miss
  const isAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(js|css|woff2?|ttf|otf|eot|png|jpg|jpeg|gif|svg|ico|webp)$/);

  if (isAsset) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(SHELL_CACHE).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => new Response('', { status: 408 }));
      })
    );
    return;
  }

  // Navigation (HTML) — network-first, fall back to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone();
          caches.open(SHELL_CACHE).then(cache => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match('/index.html')
            .then(cached => cached || caches.match('/offline.html'))
            .then(fallback => fallback || new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } }))
        )
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
