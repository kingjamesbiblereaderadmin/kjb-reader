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
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('[SW] Registered:', registration.scope);
        
        // Check for updates periodically
        setInterval(() => {
          registration.update().then(() => {
            console.log('[SW] Checked for updates');
          });
        }, 60000); // Check every minute
        
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