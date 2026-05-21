// King James Bible PWA Service Worker
const CACHE_NAME = 'kjb-cache-v3';
const OFFLINE_URL = '/offline.html';
const APP_LOGO = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png';

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
];

// ─── Install ───────────────────────────────────────────────
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v3');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(err => console.warn('[SW] Cache add failed:', err)))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate ──────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v3');
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== 'kjb-notif-config').map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ─────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Bypass dev/build assets
  if (url.pathname.startsWith('/@') || url.pathname.startsWith('/src/') || url.pathname.includes('node_modules')) return;
  // Bypass API/function calls
  if (url.pathname.startsWith('/api/')) return;

  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).catch(() => {
        if (request.mode === 'navigate') return caches.match(OFFLINE_URL);
        return new Response('', { status: 503 });
      });
    })
  );
});

// ─── Push Event (THIS is what fires when app is closed) ────
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
        // Re-subscribe with same options if available
        if (oldSub) {
          const newSub = await reg.pushManager.subscribe(oldSub.options);
          // Inform clients to save new subscription server-side
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
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
