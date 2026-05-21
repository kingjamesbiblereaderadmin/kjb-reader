import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initNotifications } from '@/lib/notifications'
import { getDailyVerse } from '@/lib/dailyVerse'
import { toast } from 'sonner'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Service worker registration for offline support and notifications
window.addEventListener('load', async () => {
  
  // DEV: Aggressive cleanup - unregister all service workers and clear ALL caches
  if (import.meta.env.DEV) {
    try {
      console.log('[SW] DEV mode - cleaning up all service workers and caches...');
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
        console.log('[SW] Unregistered:', reg.scope);
      }
      const cacheNames = await caches.keys();
      console.log('[SW] Found caches to delete:', cacheNames);
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
        console.log('[SW] Deleted cache:', cacheName);
      }
      // Force reload to ensure fresh React code
      if (cacheNames.length > 0 || registrations.length > 0) {
        console.log('[SW] Reloading to clear stale code...');
        window.location.reload();
      }
    } catch (err) {
      console.error('[SW] Dev cleanup failed:', err);
    }
    return; // Don't register SW in dev mode
  }
  
  // Register fresh service worker (production only)
  if ('serviceWorker' in navigator && !import.meta.env.DEV) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      console.log('[SW] Registered:', registration.scope);
      
      // Check for updates periodically (every 5 minutes when app is open)
      setInterval(() => {
        registration.update().then(() => {
          console.log('[SW] Checked for updates');
        }).catch(() => {});
      }, 300000);
      
      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data && event.data.type === 'UPDATE_AVAILABLE') {
          console.log('[SW] Update available, version:', event.data.cacheVersion);
          toast.info('App update available', {
            description: 'New features are ready. Refresh to update.',
            action: {
              label: 'Refresh',
              onClick: () => {
                registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
                window.location.reload();
              }
            },
            duration: 8000,
          });
        }
        if (event.data && event.data.type === 'CACHE_VERSION') {
          console.log('[SW] Cache version:', event.data.cacheVersion);
        }
      });
      
      // Pre-fetch Bible data with priority
      import('@/lib/bibleCache').then(({ isBibleCached, preloadBibleData }) => {
        isBibleCached().then(cached => {
          if (!cached) {
            console.log('[APP] Preloading Bible data (high priority)...');
            // Use requestIdleCallback to avoid blocking main thread
            if ('requestIdleCallback' in window) {
              requestIdleCallback(() => preloadBibleData(), { timeout: 5000 });
            } else {
              setTimeout(() => preloadBibleData(), 100);
            }
          } else {
            console.log('[APP] Bible data already cached, skipping preload');
          }
        });
      }).catch(() => {});
      
      initNotifications(getDailyVerse());
    } catch (err) {
      console.warn('[SW] Registration failed:', err);
      initNotifications(getDailyVerse());
    }
  } else {
    initNotifications(getDailyVerse());
  }
});