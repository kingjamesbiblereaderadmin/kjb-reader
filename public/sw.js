// King James Bible PWA Service Worker
// Strategy:
//  - Navigation requests: network-first, fall back to cached app shell ('/')
//  - Same-origin static assets (JS/CSS/fonts/images): cache-first, populate on demand
//  - Cross-origin (fonts, images CDN): cache-first runtime cache
//  - On page load, the client sends a PREWARM_ASSETS message with all <script>/<link>
//    URLs from the current page. The SW fetches+caches them so every route works offline.
const CACHE_NAME = 'kjb-cache-v6';
const RUNTIME_CACHE = 'kjb-runtime-v6';
const OFFLINE_URL = '/offline.html';
const APP_SHELL_URL = '/';
const APP_LOGO = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
];

// ─── Install ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v6');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => Promise.all(
        PRECACHE_URLS.map(url =>
          cache.add(new Request(url, { cache: 'reload' })).catch(err => console.warn('[SW] Precache failed:', url, err.message))
        )
      ))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v6');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE && k !== 'kjb-notif-config' && k !== 'kjb-notif-images')
          .map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ─────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Bypass dev/build assets (dev only — shouldn't hit in prod)
  if (url.pathname.startsWith('/@') || url.pathname.startsWith('/src/') || url.pathname.includes('node_modules')) return;

  // Bypass API/function calls — always go to network, never cache
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/functions/')) return;

  // ── Navigation requests (page loads) ──
  // Network-first, fall back to cached app shell so the SPA can boot offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Cache successful navigations as the app shell
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(APP_SHELL_URL, copy)).catch(() => {});
          }
          return response;
        })
        .catch(async () => {
          // Offline: return cached app shell so React can boot and route client-side
          const cached = await caches.match(APP_SHELL_URL) || await caches.match('/index.html');
          if (cached) return cached;
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
          return new Response('Offline', { status: 503, headers: { 'Content-Type': 'text/plain' } });
        })
    );
    return;
  }

  // ── Same-origin static assets: cache-first, populate on demand ──
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          // Only cache successful, basic (same-origin) responses
          if (response && response.ok && response.type === 'basic') {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy)).catch(() => {});
          }
          return response;
        }).catch(() => {
          // For failed JS/CSS, return empty response to avoid hard crash
          return new Response('', { status: 503 });
        });
      })
    );
    return;
  }

  // ── Cross-origin (fonts.googleapis, media CDN, etc.): cache-first runtime cache ──
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && (response.ok || response.type === 'opaque')) {
          const copy = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(request, copy)).catch(() => {});
        }
        return response;
      }).catch(() => new Response('', { status: 503 }));
    })
  );
});

// ─── Push Event ────────────────────────────────────────────
self.addEventListener('push', (event) => {
  console.log('[SW] Push event received');

  let data = {};
  try {
    if (event.data) data = event.data.json();
  } catch (err) {
    console.warn('[SW] Push payload not JSON, using text');
    try { data = { body: event.data.text() }; } catch {}
  }

  const title = data.title || 'King James Bible — Daily Verse';
  const body = data.body || 'Your daily verse from the King James Bible';
  const icon = data.icon || APP_LOGO;
  const badge = data.badge || APP_LOGO;
  const tag = data.tag || 'daily-verse';
  const url = data.url || '/';

  const options = {
    body,
    icon,
    badge,
    tag,
    renotify: true,
    requireInteraction: false,
    vibrate: [200, 100, 200],
    silent: false,
    data: { url },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => console.log('[SW] Notification shown:', title))
      .catch(err => console.error('[SW] showNotification failed:', err))
  );
});

// ─── Notification Click ────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});

// ─── Push Subscription Change (re-subscribe) ───────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('[SW] Push subscription changed, attempting re-subscribe');
  event.waitUntil(
    (async () => {
      try {
        const reg = self.registration;
        const oldSub = event.oldSubscription;
        if (oldSub) {
          const newSub = await reg.pushManager.subscribe(oldSub.options);
          const clients = await self.clients.matchAll();
          clients.forEach(c => c.postMessage({ type: 'resubscribe', subscription: newSub.toJSON() }));
        }
      } catch (err) {
        console.error('[SW] Re-subscribe failed:', err);
      }
    })()
  );
});

// ─── Messages from page ────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  // Page sends list of asset URLs to prewarm (all <script> + <link rel=stylesheet>).
  // SW fetches and caches them so every lazy route works offline.
  if (event.data?.type === 'PREWARM_ASSETS' && Array.isArray(event.data.urls)) {
    const urls = event.data.urls;
    event.waitUntil(
      caches.open(RUNTIME_CACHE).then(async (cache) => {
        await Promise.all(urls.map(async (u) => {
          try {
            // Skip if already cached
            const existing = await cache.match(u);
            if (existing) return;
            const res = await fetch(u, { cache: 'no-cache' });
            if (res && (res.ok || res.type === 'opaque')) {
              await cache.put(u, res.clone());
            }
          } catch (err) {
            // Silent — best effort
          }
        }));
        console.log('[SW] Prewarmed', urls.length, 'assets');
      })
    );
  }
});
