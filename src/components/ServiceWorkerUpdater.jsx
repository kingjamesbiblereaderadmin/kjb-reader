import { useEffect } from 'react';

export default function ServiceWorkerUpdater() {
  useEffect(() => {
    // Only register service worker in production
    if (import.meta.env.DEV) {
      console.log('[SW] Skipping service worker registration in dev mode');
      // Unregister any existing dev service workers
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const registration of registrations) {
            registration.unregister();
            console.log('[SW] Unregistered dev service worker');
          }
        });
      }
      return;
    }

    // Clear stale caches on app load
    const clearStaleCaches = async () => {
      try {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          for (const cacheName of cacheNames) {
            // Delete old cache versions (keep only current)
            if (cacheName !== 'kjb-reader-v1') {
              await caches.delete(cacheName);
              console.log('[SW] Deleted stale cache:', cacheName);
            }
          }
        }
      } catch (err) {
        console.error('[SW] Failed to clear stale caches:', err);
      }
    };

    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('[SW] Registered:', registration.scope);
            clearStaleCaches();
            
            // Check for updates periodically
            setInterval(() => {
              registration.update();
            }, 60000); // Check every minute
          })
          .catch((err) => {
            console.error('[SW] Registration failed:', err);
          });
      });
    }
  }, []);

  return null;
}