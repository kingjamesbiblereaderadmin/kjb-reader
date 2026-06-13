import { useEffect } from 'react';
import { refreshCacheIfDue } from '@/lib/bibleCache';

export default function AutoUpdateHandler({ children }) {
  useEffect(() => {
    // Bible data cache refresh check
    refreshCacheIfDue();

    // SW auto-reload: when a new service worker takes control (after skipWaiting),
    // reload the page so the user gets the latest app shell immediately.
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;
    const handleControllerChange = () => {
      if (refreshing) return;
      // If the splash is applying the update itself, never reload — the splash
      // plays "Found updates → Installing → Applying" then finishes in place.
      if (window._kjbSplashApplyingUpdate) return;
      // Never reload while a home-update splash is pending — reloading now would
      // drop into the "subsequent" flow instead of starting with FOUND UPDATES.
      if (sessionStorage.getItem('kjb-splash-home-update') === 'true') return;
      // Only reload when the user is on the HOME screen. On any other page
      // (e.g. reading) the update applies silently and is picked up next time
      // they return home — so we never interrupt reading.
      if (window.location.pathname !== '/') return;
      // Reload once per session, setting the HOME-update flag first so the
      // splash starts with "FOUND UPDATES" (home flow), not "LOADING → CHECKING".
      if (sessionStorage.getItem('kjb_sw_reloaded')) return;
      refreshing = true;
      console.log('[AutoUpdateHandler] New SW took control on home — reloading once.');
      try {
        sessionStorage.setItem('kjb_sw_updated', 'app');
        sessionStorage.setItem('kjb_sw_reloaded', '1');
        sessionStorage.setItem('kjb-splash-home-update', 'true');
      } catch {}
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return children;
}