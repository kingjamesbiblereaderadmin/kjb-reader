// KJB Reader Service Worker
// Handles: asset caching, background notifications via periodicsync + push

const CACHE_NAME = 'kjb-app-v3';
const NOTIF_CONFIG_CACHE = 'kjb-notif-config';

const PRECACHE_URLS = [
  '/',
  '/index.html',
];

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== NOTIF_CONFIG_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch (cache-first, but skip Vite/React chunks) ─────────────────────────
self.addEventListener('fetch', (event) => {
  // Don't intercept non-GET or external requests
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  // Skip caching for Vite/React chunks to prevent stale React errors
  const pathname = url.pathname;
  if (
    pathname.includes('/@vite') ||
    pathname.includes('/@react-refresh') ||
    pathname.includes('chunk-') ||
    pathname.includes('.vite/deps') ||
    pathname.includes('node_modules')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Cache successful HTML/JS/CSS responses (excluding Vite chunks)
        if (response && response.status === 200) {
          const ct = response.headers.get('content-type') || '';
          if (ct.includes('text/html') || (ct.includes('javascript') && !pathname.includes('chunk-'))) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
        }
        return response;
      });
    })
  );
});

// ── Helper: read notification config from cache ───────────────────────────────
async function getNotifConfig() {
  try {
    const cache = await caches.open(NOTIF_CONFIG_CACHE);
    const res = await cache.match('/notif-config');
    if (!res) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ── Helper: show daily verse notification ─────────────────────────────────────
async function showDailyVerseNotif() {
  const config = await getNotifConfig();
  if (!config) return;

  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);

  // Don't fire if already fired today
  if (config.lastDate === today) return;
  // Don't fire if not yet time
  if (config.nextTs && now < config.nextTs) return;

  const logoUrl = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png';

  await self.registration.showNotification('King James Bible — Verse of the Day', {
    body: config.verseText
      ? `"${config.verseText}" — ${config.verseRef}`
      : 'Open the app to read today\'s verse.',
    icon: logoUrl,
    badge: logoUrl,
    tag: 'daily-verse',
    renotify: true,
  });

  // Update lastDate in config so we don't double-fire
  try {
    const cache = await caches.open(NOTIF_CONFIG_CACHE);
    const updated = { ...config, lastDate: today };
    await cache.put('/notif-config', new Response(JSON.stringify(updated), {
      headers: { 'Content-Type': 'application/json' }
    }));
  } catch {}
}

// ── Periodic Background Sync ──────────────────────────────────────────────────
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-verse-notif') {
    event.waitUntil(showDailyVerseNotif());
  }
});

// ── Push notifications (optional, if push is set up) ─────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'King James Bible';
  const body = data.body || 'Your daily verse is ready.';
  const logoUrl = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: logoUrl,
      badge: logoUrl,
      tag: 'daily-verse',
    })
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// ── Message from app (e.g. "check and fire now if overdue") ──────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_NOTIF') {
    event.waitUntil(showDailyVerseNotif());
  }
});
