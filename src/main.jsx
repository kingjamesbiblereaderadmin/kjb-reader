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

// Service worker registration for offline support
if ('serviceWorker' in navigator) {
  // In development, unregister any existing service workers to prevent stale cache
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(reg => reg.unregister());
    });
    // Clear all caches
    caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
  } else {
    // Production: register service worker
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then(registration => {
          console.log('[SW] Registered:', registration.scope);
          
          // Listen for update messages from service worker
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
          });
          
          // Re-arm daily notification scheduler on every app load
          initNotifications(getDailyVerse());
        })
        .catch(err => console.error('[SW] Registration failed:', err));
    });
  }
}