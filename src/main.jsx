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
  // Only register once per browser session to avoid Chrome "tap to copy URL" banner
  const shouldRegister = !sessionStorage.getItem('kjb-sw-registered');
  window.addEventListener('load', async () => {
    let registration;
    try {
      registration = await navigator.serviceWorker.getRegistration('/');
      if (!registration && shouldRegister) {
        registration = await navigator.serviceWorker.register('/sw.js');
        sessionStorage.setItem('kjb-sw-registered', 'true');
      }
    } catch (err) {
      console.warn('[SW] Registration failed:', err);
    }
    if (registration) {
      console.log('[SW] Ready:', registration.scope);
      
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
      }).catch(() => {});
      
      initNotifications(getDailyVerse());
    } else {
      initNotifications(getDailyVerse());
    }
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