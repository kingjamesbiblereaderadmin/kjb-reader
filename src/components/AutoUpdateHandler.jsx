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
      refreshing = true;
      console.log('[AutoUpdateHandler] New SW took control — triggering SplashScreen update flow');
      console.log('[AutoUpdateHandler] Setting flags before reload...');
      // Set flag so SplashScreen shows: Found → Installing → Applying → Checking → Welcome Back
      localStorage.setItem('kjb-splash-home-update', 'true');
      sessionStorage.setItem('kjb-splash-home-update', 'true');
      console.log('[AutoUpdateHandler] Flags set:', {
        local: localStorage.getItem('kjb-splash-home-update'),
        session: sessionStorage.getItem('kjb-splash-home-update')
      });
      // Small delay to ensure flags are written before reload
      setTimeout(() => {
        window.location.reload();
      }, 200);
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  return children;
}