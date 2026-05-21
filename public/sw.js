const CACHE_NAME = 'kjb-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
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

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
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

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic background sync for daily verse notifications
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-verse-notif') {
    event.waitUntil(sendDailyVerseNotification());
  }
});

async function sendDailyVerseNotification() {
  try {
    // Get config from cache
    const cache = await caches.open('kjb-notif-config');
    const response = await cache.match('/notif-config');
    if (!response) return;
    
    const config = await response.json();
    const today = new Date().toISOString().split('T')[0];
    
    // Check if we already notified today
    if (config.lastDate === today) return;
    
    // Check if it's time to notify
    if (Date.now() < config.nextTs) return;
    
    const logoUrl = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png';
    
    await self.registration.showNotification('KJB — Daily Verse', {
      body: `"${config.verseText}" — KJB ${config.verseRef}`,
      icon: logoUrl,
      badge: logoUrl,
      tag: 'daily-verse',
      renotify: true,
      vibrate: [200, 100, 200],
      data: {
        url: '/'
      }
    });
    
    // Update last notified date
    config.lastDate = today;
    await cache.put('/notif-config', new Response(JSON.stringify(config), {
      headers: { 'Content-Type': 'application/json' }
    }));
  } catch (err) {
    console.error('Daily verse notification error:', err);
  }
}
