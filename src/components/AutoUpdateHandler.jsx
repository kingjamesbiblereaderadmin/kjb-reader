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
    let flagSet = false;

    const setUpdateFlagAndReload = () => {
      if (refreshing || flagSet) return;
      refreshing = true;
      flagSet = true;
      console.log('[AutoUpdateHandler] Update detected — setting flags and reloading');
      // Set BOTH flags (localStorage persists through SW reloads, sessionStorage is backup)
      try {
        localStorage.setItem('kjb-splash-home-update', 'true');
        sessionStorage.setItem('kjb-splash-home-update', 'true');
        console.log('[AutoUpdateHandler] Flags verified:', {
          local: localStorage.getItem('kjb-splash-home-update'),
          session: sessionStorage.getItem('kjb-splash-home-update')
        });
      } catch (e) {
        console.error('[AutoUpdateHandler] Failed to set flags:', e);
      }
      // Reload after a short delay to ensure flags are persisted
      setTimeout(() => {
        window.location.reload();
      }, 300);
    };

    const handleControllerChange = () => {
      console.log('[AutoUpdateHandler] controllerchange fired');
      setUpdateFlagAndReload();
    };

    const handleSWMessage = (event) => {
      console.log('[AutoUpdateHandler] SW message received:', event.data);
      if (event.data?.type === 'UPDATE_FOUND') {
        console.log('[AutoUpdateHandler] UPDATE_FOUND message — setting flag immediately');
        setUpdateFlagAndReload();
      }
    };

    // Listen for both controllerchange (SW took control) and message (SW installed)
    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    navigator.serviceWorker.addEventListener('message', handleSWMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      navigator.serviceWorker.removeEventListener('message', handleSWMessage);
    };
  }, []);

  return children;
}