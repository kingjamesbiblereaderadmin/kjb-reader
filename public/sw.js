// KJB Reader Service Worker v20260611_500
// Cache-first loading for offline support

const CACHE_NAME = 'kjb-reader-v20260611_500';
const LEGACY_CACHE_NAME = 'kjb-legacy-v9';

const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(APP_SHELL_FILES).catch(err => {
        console.warn('[SW] Some resources failed to cache:', err);
        return Promise.resolve();
      });
    }).then(() => {
      console.log('[SW] Sending UPDATE_FOUND to all clients');
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'UPDATE_FOUND' });
        });
      });
    }).then(() => {
      console.log('[SW] Skipping waiting');
      return self.skipWaiting();
    })
  );
});

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
    }).then(() => {
      console.log('[SW] Claiming all clients');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

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
                '<!DOCTYPE html><html><body style="font-family:Arial;padding:20px;"><h1>Legacy Reader</h1><p>This page needs to be opened online once before it can be read offline.</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            });
          });
        });
      })
    );
    return;
  }

  if (url.pathname.startsWith('/api/')) return;
  if (!url.protocol.startsWith('http')) return;
  if (url.pathname === '/sw.js') return;

  if (url.pathname.includes('/@vite') || 
      url.pathname.includes('/@react-refresh') ||
      url.pathname.includes('/node_modules/.vite') ||
      url.pathname.startsWith('/src/') ||
      url.pathname.endsWith('.jsx') ||
      url.pathname.endsWith('.js') && url.pathname.includes('chunk-')) {
    return;
  }

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
