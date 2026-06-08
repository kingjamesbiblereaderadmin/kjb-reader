// KJB Reader Service Worker — offline-first app shell cache
// updated worker 61
const CACHE_NAME = 'kjb-shell-v20260608_129';
const OFFLINE_URL = '/offline.html';

// App shell files to cache on install
const SHELL_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// ── Install: pre-cache shell assets ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch(() => {
        // If offline.html isn't ready yet, pre-cache only the root
        return cache.add('/').catch(() => {});
      });
    })
  );
});

// ── Activate: remove old caches ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (names) => {
      const hadOldCaches = names.some(n => n.startsWith('kjb-shell-') && n !== CACHE_NAME);
      await Promise.all(
        names
          .filter((n) => n !== CACHE_NAME)
          .map((n) => caches.delete(n))
      );
      await self.clients.claim();
      
      // The browser side (main.jsx) listens to 'controllerchange' to trigger a reload.
    })
  );
});

// ── Fetch: network-first for API/Bible data, cache-first for app shell ───────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests that aren't our media CDN
  if (request.method !== 'GET') return;

  // Skip Base44 API calls — always need fresh data
  if (url.hostname.includes('base44.com') && url.pathname.startsWith('/api')) return;

  // Bible text file — network-first with cache fallback (large file, don't block)
  if (url.hostname.includes('media.base44.com') && url.pathname.endsWith('.txt')) {
    event.respondWith(
      fetch(request).then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // Images and fonts from our CDN — cache-first
  if (url.hostname.includes('media.base44.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(request, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // App shell (HTML, JS chunks, CSS) — network-first, cache fallback
  if (url.origin === self.location.origin) {
    // For HTML, force network fetch bypassing HTTP cache to ensure latest version is fetched
    const fetchOpts = request.mode === 'navigate' ? { cache: 'no-cache' } : {};
    event.respondWith(
      fetch(request, fetchOpts).then((res) => {
        if (res.ok && res.status < 400) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(request, clone));
        }
        return res;
      }).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // For navigation requests, serve the app shell so React Router handles it
        if (request.mode === 'navigate') {
          const shell = await caches.match('/');
          if (shell) return shell;
          return caches.match(OFFLINE_URL);
        }
        return new Response('', { status: 408 });
      })
    );
    return;
  }
});

// ── Message: handle PREWARM_ASSETS and SKIP_WAITING ─────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'PREWARM_ASSETS') {
    const urls = event.data.urls || [];
    caches.open(CACHE_NAME).then((cache) => {
      urls.forEach((url) => {
        fetch(url, { cache: 'no-cache' }).then((res) => {
          if (res.ok) cache.put(url, res);
        }).catch(() => {});
      });
    });
  }
});
