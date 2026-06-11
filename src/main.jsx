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
  
  // Skip service worker registration in development mode to prevent React hook errors
  if (import.meta.env.DEV) {
    console.log('[SW] Skipping registration in development mode');
    // Unregister any existing service workers in dev mode
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(reg => reg.unregister());
      });
    }
    return;
  }
  
  // Register fresh service worker
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none', scope: '/' });
      console.log('[SW] Registered:', registration.scope);

      // Reload when a new SW takes over — but only AFTER the SplashScreen is
      // done. SplashScreen sets window.kjbSplashDone and fires 'kjb-splash-done'
      // when it finishes, so we wait for that before reloading.
      let refreshing = false;
      let hasExistingController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (hasExistingController && !refreshing) {
          refreshing = true;
          console.log('[SW] Controller changed. Waiting for splash before reload.');
          try { sessionStorage.setItem('kjb_sw_updated', 'app'); } catch {}
          const doReload = () => {
            console.log('[SW] Reloading to apply updates.');
            const sep = window.location.search ? '&' : '?';
            window.location.href = window.location.pathname + window.location.search + sep + 'updated=true';
          };
          if (window.kjbSplashDone) {
            doReload();
          } else {
            window.addEventListener('kjb-splash-done', doReload, { once: true });
            // Safety fallback: reload after 10s even if splash never fires
            setTimeout(() => { window.removeEventListener('kjb-splash-done', doReload); doReload(); }, 10000);
          }
        }
        hasExistingController = true;
      });

      // NOTE: SKIP_WAITING and update activation are handled by SplashScreen.
      // main.jsx must NOT auto-activate waiting workers on load, or the page
      // reloads before SplashScreen can show the update flow to the user.

      // Periodic background update check — starts after SplashScreen is done.

      // Periodic background update check — every 60s while tab is visible.
      const POLL_MS = 60 * 1000;
      setInterval(() => {
        if (document.visibilityState !== 'visible') return;
        if (navigator.onLine === false) return;
        registration.update().catch(() => {});
      }, POLL_MS);

      // Also check immediately whenever the tab becomes visible again.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine !== false) {
          registration.update().catch(() => {});
        }
      });

      // Prewarm: tell SW to cache every <script> and <link rel=stylesheet> on the page
      // so all lazy-loaded routes work offline, even if the user never visited them online.
      // Critical fonts that load lazily (accessibility fonts + Google Fonts CSS).
      // Explicitly prewarm them so the FULL app — including dyslexic/legible
      // fonts and all scripture fonts — works offline even if never triggered online.
      const CRITICAL_FONT_ASSETS = [
        'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/woff/OpenDyslexic-Regular.woff',
        'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/woff/OpenDyslexic-Bold.woff',
        'https://cdn.jsdelivr.net/npm/open-dyslexic@1.0.3/woff/OpenDyslexic-Italic.woff',
        'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400;1,700&display=block',
        // App logo/icon used on the splash screen, daily card, and PWA.
        'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png',
        'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/f69363ad9_generated_image.png',
      ];

      const prewarmAssets = () => {
        try {
          const urls = new Set(CRITICAL_FONT_ASSETS);
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
      
      initNotifications(getDailyVerse());
    } catch (err) {
      console.warn('[SW] Registration failed:', err);
      initNotifications(getDailyVerse());
    }
  } else {
    initNotifications(getDailyVerse());
  }
});