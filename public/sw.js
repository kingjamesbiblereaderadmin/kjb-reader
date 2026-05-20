const CACHE_VERSION = 'kjb-v3';

// Pre-cache essential assets
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png',
];

// Cache strategies
self.addEventListener('install', (event) => {
  console.log('[SW] Install');
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      console.log('[SW] Pre-caching assets');
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activate');
  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(names =>
        Promise.all(
          names
            .filter(name => name.startsWith('kjb-') && name !== CACHE_VERSION)
            .map(name => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        )
      ),
      // Clean old config cache
      caches.keys().then(names =>
        Promise.all(
          names
            .filter(name => name.startsWith('kjb-notif'))
            .map(name => caches.delete(name))
        )
      )
    ]).then(() => {
      console.log('[SW] Claiming clients');
      self.clients.claim();
      // Notify all clients about update
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'UPDATE_AVAILABLE', cacheVersion: CACHE_VERSION });
        });
      });
    })
  );
});

// Network-first for HTML/JS, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin and non-GET requests
  if (url.origin !== self.location.origin || request.method !== 'GET') {
    return;
  }

  // HTML/JS: network-first, fallback to cache, update cache in background
  if (url.pathname === '/' || url.pathname.match(/\.(js|jsx|html)$/)) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          console.log('[SW] Network failed, serving from cache:', request.url);
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets (CSS, fonts, images): cache-first, fallback to network
  if (url.pathname.match(/\.(css|woff2|woff|ttf|png|jpg|jpeg|svg|gif|webp|ico)$/)) {
    event.respondWith(
      caches.match(request).then(response => {
        if (response) {
          return response;
        }
        // Not in cache, fetch and cache
        return fetch(request).then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
          }
          return response;
        }).catch(() => {
          console.log('[SW] Static asset not available:', request.url);
          return new Response('', { status: 404 });
        });
      })
    );
    return;
  }

  // API requests: network-first with offline fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => {
          console.log('[SW] API offline, trying cache:', request.url);
          return caches.match(request) || new Response(JSON.stringify({ error: 'Offline' }), { 
            status: 503, 
            headers: { 'Content-Type': 'application/json' } 
          });
        })
    );
    return;
  }

  // Default: network-first with cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request) || new Response('Offline', { status: 503 }))
  );
});

// Handle notifications
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(clientList => {
        // Focus existing window
        for (const client of clientList) {
          if (client.url.includes('/read') && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window to daily reading
        if (self.clients.openWindow) {
          return self.clients.openWindow('/daily-reading');
        }
      })
  );
});

// Message handler for cache updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CACHE_BIBLE') {
    // Pre-cache all Bible data
    event.waitUntil(cacheAllBibleData());
  }
});

async function cacheAllBibleData() {
  try {
    const cache = await caches.open(CACHE_VERSION);
    const books = [
      'GEN','EXO','LEV','NUM','DEU','JOS','JDG','RUT','1SA','2SA','1KI','2KI','1CH','2CH','EZR','NEH','EST','JOB','PSA','PRO','ECC','SNG','ISA','JER','LAM','EZK','DAN','HOS','JOL','AMO','OBA','JON','MIC','NAM','HAB','ZEP','HAG','ZEC','MAL',
      'MAT','MRK','LUK','JHN','ACT','ROM','1CO','2CO','GAL','EPH','PHP','COL','1TH','2TH','1TI','2TI','TIT','PHM','HEB','JAS','1PE','2PE','1JN','2JN','3JN','JUD','REV'
    ];
    
    for (const book of books) {
      for (let ch = 1; ch <= 150; ch++) {
        try {
          const url = `https://kjb-api.tinyverses.com/api/chapters/${book}/${ch}`;
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response.clone());
          }
        } catch {
          break; // Chapter doesn't exist
        }
      }
    }
    console.log('[SW] Bible data cached');
  } catch (err) {
    console.error('[SW] Cache Bible error:', err);
  }
}

// Periodic sync for notifications (fires ~hourly on Android)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-verse-notif') {
    event.waitUntil(fireNotificationIfDue());
  }
});

async function fireNotificationIfDue() {
  try {
    // Try to get config from cache
    let config = {};
    try {
      const configResp = await caches.match('/notif-config');
      if (configResp) config = await configResp.json();
    } catch {}

    if (!config.nextTs || Date.now() < config.nextTs) return;
    if (config.lastDate === getTodayString()) return; // Already fired

    // Try to fetch fresh verse, fallback to cached
    let verse;
    try {
      const verseUrl = 'https://kjb-api.tinyverses.com/api/verses/daily';
      const response = await fetch(verseUrl);
      if (response.ok) {
        verse = await response.json();
      } else {
        // Use cached verse
        verse = { text: config.verseText || 'God is gracious.', reference: config.verseRef || 'Unknown' };
      }
    } catch {
      verse = { text: config.verseText || 'God is gracious.', reference: config.verseRef || 'Unknown' };
    }
    
    await self.registration.showNotification('King James Bible — Verse of the Day', {
      body: `"${verse.text.slice(0, 100)}${verse.text.length > 100 ? '…' : ''}" — ${verse.reference}`,
      icon: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png',
      badge: 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png',
      tag: 'daily-verse',
      renotify: true,
    });

    // Update config with new fire time
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const timeStr = config.lastDate ? (localStorage.getItem('kjb-notification-time') || '08:00') : (localStorage.getItem('kjb-notification-time') || '08:00');
    const [hh, mm] = timeStr.split(':');
    tomorrow.setHours(parseInt(hh), parseInt(mm), 0, 0);

    const cache = await caches.open(CACHE_VERSION);
    await cache.put('/notif-config', new Response(JSON.stringify({
      nextTs: tomorrow.getTime(),
      lastDate: getTodayString(),
      verseText: verse.text.slice(0, 120),
      verseRef: verse.reference,
    })));
  } catch (err) {
    console.error('[SW] Periodic sync error:', err);
  }
}

function getTodayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
