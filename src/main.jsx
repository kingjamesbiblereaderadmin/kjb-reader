import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initNotifications } from '@/lib/notifications'
import { getDailyVerse } from '@/lib/dailyVerse'
import { toast } from 'sonner'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

// Service worker registration for offline support and notifications
window.addEventListener('load', async () => {
  // Clear ALL caches on every load to prevent stale React chunks
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[APP] Cleared all caches');
    } catch (err) {
      console.warn('[APP] Failed to clear caches:', err);
    }
  }
  
  // Unregister any existing service workers in dev mode
  if ('serviceWorker' in navigator && import.meta.env.DEV) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));
      console.log('[APP] Unregistered all service workers (dev mode)');
    } catch (err) {
      console.warn('[APP] Failed to unregister service workers:', err);
    }
    return; // Don't register in dev mode
  }
  
  // Register fresh service worker (production only)
  if ('serviceWorker' in navigator && !import.meta.env.DEV) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[SW] Registered:', registration.scope);
      
      // Check for updates periodically
      setInterval(() => {
        registration.update().then(() => {
          console.log('[SW] Checked for updates');
        }).catch(() => {});
      }, 60000);
      
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
      
      // Pre-fetch Bible data only if not already cached
      import('@/lib/bibleCache').then(({ isBibleCached, preloadBibleData }) => {
        isBibleCached().then(cached => {
          if (!cached) {
            console.log('[APP] Preloading Bible data...');
            preloadBibleData();
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
    // Still initialize notifications even without SW
    initNotifications(getDailyVerse());
  }
});