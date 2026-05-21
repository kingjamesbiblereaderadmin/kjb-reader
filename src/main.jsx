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
// Skip registration in development mode to avoid caching stale bundles
if ('serviceWorker' in navigator && !import.meta.env.DEV) {
  window.addEventListener('load', async () => {
    // Don't re-register if already registered — avoids Chrome "tap to copy URL" banner
    const existing = await navigator.serviceWorker.getRegistration('/').catch(() => null);
    const regPromise = existing
      ? Promise.resolve(existing)
      : navigator.serviceWorker.register('/sw.js');
    regPromise
      .then(registration => {
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
          if (event.data && event.data.type === 'CACHE_REFRESHED') {
            console.log('[SW] Cache refreshed');
          }
        });
        
        // Pre-fetch Bible data immediately
        import('@/lib/bibleCache').then(({ preloadBibleData }) => {
          console.log('[APP] Preloading Bible data...');
          preloadBibleData();
        });
        
        initNotifications(getDailyVerse());
      })
      .catch(err => {
        console.warn('[SW] Registration failed (ok for dev):', err.message);
        initNotifications(getDailyVerse());
      });
  });
} else if ('serviceWorker' in navigator && import.meta.env.DEV) {
  // In development mode, unregister any existing service workers to prevent stale cache
  navigator.serviceWorker.getRegistrations().then(registrations => {
    for (const registration of registrations) {
      registration.unregister();
      console.log('[SW] Unregistered service worker in dev mode');
    }
  });
}