// KJB Reader Service Worker v20260707_1000
// Cache-first loading for offline support + web push

const CACHE_NAME = 'kjb-reader-v20260707_1000';
const LEGACY_CACHE_NAME = 'kjb-legacy-v9';

// Core app shell resources to cache immediately
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(APP_SHELL_FILES).catch(err => {
        console.warn('[SW] Some resources failed to cache:', err);
        return Promise.resolve();
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
                '' +
                '<!DOCTYPE html><html><head><title>Legacy Reader</title></head><body>' +
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

  // Always fetch the manifest fresh (network-first) so corrected icons reach
  // Chrome/Samsung/Edge immediately instead of a stale cached version.
  // Match manifest with or without query params (cache-busting version)
  if (url.pathname === '/manifest.json' || url.pathname.startsWith('/manifest.json?')) {
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
        if (!response.ok) {
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

  if (event.data && event.data.type === 'PREWARM_ASSETS') {
    const urls = event.data.urls || [];
    if (urls.length > 0) {
      console.log('[SW] Prewarming', urls.length, 'assets');
      event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
          return Promise.all(
            urls.map(url =>
              fetch(url)
                .then(response => {
                  if (response.ok) {
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

// Handle a real Push message from the server (VAPID web push). This fires the
// SW even when the app/tab is fully closed, unlike showLocalNotification()
// (which only ran while a page was open). Payload is JSON: {title, body, url}.
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (err) {
    payload = { title: 'KJB Reader', body: event.data ? event.data.text() : 'You have a new notification.' };
  }

  const title = payload.title || 'King James Bible — Daily Verse';
  const options = {
    body: payload.body || '',
    icon: payload.icon || 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png',
    badge: payload.badge || 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png',
    tag: payload.tag || 'daily-verse',
    renotify: true,
    vibrate: [200, 100, 200],
    requireInteraction: false,
    data: { url: payload.url || '/' },
  };

  // Record that push actually delivered today, in a cache separate from the
  // versioned app-shell cache (so it survives SW updates). The page checks
  // this before deciding whether it still needs to fire the old offline
  // on-open fallback — so a device that was offline when this push was sent
  // still gets the verse locally next time it's opened, same as before.
  event.waitUntil(
    self.registration.showNotification(title, options).then(() =>
      caches.open('kjb-push-log').then((cache) =>
        cache.put('/__push-last-fired', new Response(new Date().toISOString().slice(0, 10)))
      )
    )
  );
});

// The push service can invalidate/rotate a subscription at any time (token
// expiry, browser-side rotation). When that happens this event fires with a
// chance to resubscribe silently — otherwise the device silently stops
// receiving pushes with no error surfaced anywhere in the app UI.
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription ? event.oldSubscription.options : { userVisibleOnly: true })
      .then((subscription) => {
        return fetch('/api/apps/6a05d76723afe58d80c589e8/functions/subscribePush', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription.toJSON()),
        }).catch(() => {});
      })
      .catch((err) => console.warn('[SW] pushsubscriptionchange resubscribe failed:', err))
  );
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
