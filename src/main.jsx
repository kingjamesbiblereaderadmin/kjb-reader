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
      // Silently clean up any stale SW registrations and caches in dev.
      // Do NOT reload — Vite HMR handles freshness and a reload mid-render
      // tears React's hook state (null useState errors).
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        await reg.unregister();
      }
      const cacheNames = await caches.keys();
      for (const cacheName of cacheNames) {
        await caches.delete(cacheName);
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

      // Instead of forcing a reload, notify the UI to show the update banner
      const notifyUpdate = (waitingWorker) => {
        window.dispatchEvent(new CustomEvent('kjb-update-available', { detail: { waitingWorker } }));
      };

      // If a worker is already waiting when we register, notify the UI
      if (registration.waiting && navigator.serviceWorker.controller) {
        notifyUpdate(registration.waiting);
      }

      // Listen for newly-found workers and notify the UI
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            notifyUpdate(newWorker);
          }
        });
      });

      // Reload the page when the new service worker takes over
      let refreshing = false;
      let hasExistingController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hasExistingController && !refreshing) {
          refreshing = true;
          // Clean reload bypassing cache to ensure fresh assets
          window.location.href = window.location.pathname + '?v=' + Date.now();
        }
        hasExistingController = true;
      });

      // Prewarm: tell SW to cache every <script> and <link rel=stylesheet> on the page
      // so all lazy-loaded routes work offline, even if the user never visited them online.
      const prewarmAssets = () => {
        try {
          const urls = new Set();
          document.querySelectorAll('script[src]').forEach(s => {
            try { urls.add(new URL(s.src, location.href).href); } catch {}
          });
          document.querySelectorAll('link[rel="stylesheet"], link[rel="modulepreload"], link[rel="preload"]').forEach(l => {
            try { if (l.href) urls.add(new URL(l.href, location.href).href); } catch {}
          });
          const list = Array.from(urls);
          if (list.length && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ type: 'PREWARM_ASSETS', urls: list });
            console.log('[SW] Prewarm requested for', list.length, 'assets');
          }
        } catch (err) {
          console.warn('[SW] Prewarm failed:', err);
        }
      };

      // Run prewarm when SW is controlling the page
      if (navigator.serviceWorker.controller) {
        // Already controlled — prewarm now (and after a delay to catch dynamic chunks)
        prewarmAssets();
        setTimeout(prewarmAssets, 3000);
        setTimeout(prewarmAssets, 10000);
      } else {
        // First load — wait for controllerchange, then prewarm
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          setTimeout(prewarmAssets, 500);
          setTimeout(prewarmAssets, 5000);
        });
      }

      navigator.serviceWorker.addEventListener('message', event => {
        if (event.data?.type === 'UPDATE_AVAILABLE') {
          console.log('[SW] Update available, version:', event.data.cacheVersion);
        }
        if (event.data?.type === 'CACHE_VERSION') {
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