import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { initNotifications } from '@/lib/notifications'
import { getDailyVerse } from '@/lib/dailyVerse'
import { toast } from 'sonner'

// Swallow the harmless, transient "Failed to update a ServiceWorker ... Not
// found" rejection that the preview sandbox throws when /sw.js momentarily
// can't be fetched. It's already caught at every call site; this is a final
// safety net so it never surfaces as an uncaught error.
const isSwNotFoundError = (msg) => /Failed to (update|register) a ServiceWorker/i.test(msg || '');

window.addEventListener('unhandledrejection', (event) => {
  const msg = event?.reason?.message || String(event?.reason || '');
  if (isSwNotFoundError(msg)) {
    event.preventDefault();
  }
});

// The browser also emits this as a window 'error' event during its automatic
// SW update check (separate from manual reg.update() calls). Catch it here too.
window.addEventListener('error', (event) => {
  const msg = event?.error?.message || event?.message || '';
  if (isSwNotFoundError(msg)) {
    event.preventDefault();
  }
});

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
  
  // The preview sandbox occasionally can't serve /sw.js, making
  // registration.update() reject with "Failed to update a ServiceWorker ...
  // Not found". Wrap update() so any such transient rejection is fully
  // swallowed and never surfaces as an uncaught error.
  const safeSwUpdate = (reg) => {
    try {
      return Promise.resolve(reg.update()).catch(() => {});
    } catch {
      return Promise.resolve();
    }
  };

  // Register fresh service worker
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none', scope: '/' });
      console.log('[SW] Registered:', registration.scope);

      // Reload when a new SW takes over in the BACKGROUND (after splash is done).
      // If the splash itself applied the update (_kjbSplashApplyingUpdate), skip
      // the reload entirely — the new SW is already active, no reload needed.
      // Only reload on controllerchange if it's a background update (not triggered by splash).
      // Splash sets window._kjbSplashApplyingUpdate before calling SKIP_WAITING so we skip reload.
      let refreshing = false;
      let hasExistingController = !!navigator.serviceWorker.controller;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        const wasExisting = hasExistingController;
        hasExistingController = true;
        // If the splash is applying the update itself, never reload here — the
        // splash plays "Found updates → Installing → Applying" then finishes in
        // place. Reloading would interrupt it and consume the flag prematurely.
        if (window._kjbSplashApplyingUpdate) return;
        // Also never reload while a home-update splash is still pending/in-flight.
        // Its mode flag is only cleared once the splash completes, so reloading
        // now would drop us into the "subsequent" flow (LOADING → CHECKING →
        // FOUND) instead of starting with FOUND UPDATES.
        if (sessionStorage.getItem('kjb-splash-home-update') === 'true') return;
        // In-app updates only reload when the user is on the HOME screen. On any
        // other page (e.g. reading), do nothing — the update applies silently and
        // will be picked up next time they land on home / reopen the app, so we
        // never interrupt reading.
        if (window.location.pathname !== '/') return;
        // Only reload ONCE per session for a background SW takeover, and set the
        // HOME-update flag BEFORE reloading so the splash starts with
        // "FOUND UPDATES" first (home flow), not "LOADING → CHECKING".
        if (wasExisting && !refreshing && !sessionStorage.getItem('kjb_sw_reloaded')) {
          refreshing = true;
          console.log('[SW] Background controller change on home — reloading once.');
          try {
            sessionStorage.setItem('kjb_sw_updated', 'app');
            sessionStorage.setItem('kjb_sw_reloaded', '1');
            sessionStorage.setItem('kjb-splash-home-update', 'true');
          } catch {}
          const sep = window.location.search ? '&' : '?';
          window.location.href = window.location.pathname + window.location.search + sep + 'updated=true';
        }
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
        safeSwUpdate(registration);
      }, POLL_MS);

      // Also check immediately whenever the tab becomes visible again.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && navigator.onLine !== false) {
          safeSwUpdate(registration);
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
        // Main scripture/UI fonts (Google Fonts CSS). The actual woff2 files it
        // references are extracted and prewarmed in prewarmAssets() below.
        'https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&family=Dancing+Script:wght@300;400;500;600;700&family=Great+Vibes&family=Inter:wght@300;400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;0,900;1,300;1,400;1,700;1,900&display=block',
        // App logo/icon used on the splash screen, daily card, and PWA.
        'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png',
        'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/f69363ad9_generated_image.png',
        // PWA icon (favicon, apple-touch-icon, boot splash image).
        'https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/c2459f3df_kjb-icon512-v20260713.png',
      ];

      const prewarmAssets = async () => {
        try {
          const urls = new Set(CRITICAL_FONT_ASSETS);
          document.querySelectorAll('script[src]').forEach(s => {
            try { urls.add(new URL(s.src, location.href).href); } catch {}
          });
          document.querySelectorAll('link[rel="stylesheet"], link[rel="modulepreload"], link[rel="preload"]').forEach(l => {
            try { if (l.href) urls.add(new URL(l.href, location.href).href); } catch {}
          });
          // Fetch each stylesheet and extract @font-face url() references so the
          // actual font files (woff2) are cached — not just the CSS that points at
          // them. Without this, a font face never rendered while online (e.g.
          // italic Merriweather) would be missing offline.
          const cssUrls = [...urls].filter(u => u.includes('fonts.googleapis.com/css') || u.endsWith('.css'));
          await Promise.all(cssUrls.map(async (cssUrl) => {
            try {
              const res = await fetch(cssUrl, { cache: 'no-store' });
              const text = await res.text();
              const re = /url\(([^)]+)\)/g;
              let m;
              while ((m = re.exec(text)) !== null) {
                const u = m[1].replace(/["']/g, '');
                if (u.startsWith('http')) urls.add(u);
              }
            } catch {}
          }));
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