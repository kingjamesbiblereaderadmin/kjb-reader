const CACHE_NAME = 'kjb-cache-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Never cache these - always use network
const NEVER_CACHE_PATTERNS = [
  /\/src\//,
  /\/node_modules\//,
  /\/@vite/,
  /\/@react-refresh/,
  /\.js$/,
  /\.jsx$/,
  /\.ts$/,
  /\.tsx$/,
  /\.mjs$/,
  /chunk-/,
  /-legacy/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network-first for code, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Never cache JS/TS/Vite chunks - always use network
  if (NEVER_CACHE_PATTERNS.some(pattern => pattern.test(url))) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If network fails, try cache as last resort
        return caches.match(event.request);
      })
    );
    return;
  }
  
  // Cache-first for static assets (HTML, CSS, images, manifest)
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      });
    })
  );
});

// Handle notification click - navigate to app when user clicks notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // If app is already open, focus it
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic background sync for daily verse notifications
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-verse-notif') {
    console.log('[SW] Periodic sync triggered:', event.tag);
    event.waitUntil(sendDailyVerseNotification());
  }
});

// Background sync fallback (more widely supported than periodicSync)
self.addEventListener('sync', (event) => {
  if (event.tag === 'daily-verse-sync') {
    console.log('[SW] Background sync triggered:', event.tag);
    event.waitUntil(sendDailyVerseNotification());
  }
});

async function sendDailyVerseNotification() {
  try {
    console.log('[SW] sendDailyVerseNotification called');
    
    // Get config from cache
    const cache = await caches.open('kjb-notif-config');
    const response = await cache.match('/notif-config');
    if (!response) {
      console.log('[SW] No config found in cache');
      return;
    }
    
    const config = await response.json();
    const today = new Date().toISOString().split('T')[0];
    const now = Date.now();
    
    console.log('[SW] Config:', {
      nextTs: config.nextTs,
      lastDate: config.lastDate,
      today: today,
      now: now,
      shouldFire: now >= config.nextTs && config.lastDate !== today
    });
    
    // Check if we already notified today
    if (config.lastDate === today) {
      console.log('[SW] Already notified today, skipping');
      return;
    }
    
    // Check if it's time to notify
    if (now < config.nextTs) {
      console.log('[SW] Not time yet, skipping');
      return;
    }
    
    console.log('[SW] Showing notification:', {
      title: 'KJB — Daily Verse',
      body: config.verseText,
      ref: config.verseRef
    });
    
    // No icon - just show the verse text
    await self.registration.showNotification('KJB — Daily Verse', {
      body: `"${config.verseText}" — ${config.verseRef}`,
      tag: 'daily-verse',
      renotify: true,
      vibrate: [200, 100, 200],
      silent: false,
      requireInteraction: false,
      data: {
        url: '/'
      }
    });
    
    console.log('[SW] Notification shown successfully');
    
    // Update last notified date
    config.lastDate = today;
    await cache.put('/notif-config', new Response(JSON.stringify(config), {
      headers: { 'Content-Type': 'application/json' }
    }));
    
    console.log('[SW] Updated last notified date to', today);
  } catch (err) {
    console.error('[SW] Daily verse notification error:', err);
  }
}
