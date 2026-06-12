import { useEffect } from 'react';
import { refreshCacheIfDue } from '@/lib/bibleCache';

export default function AutoUpdateHandler({ children }) {
  useEffect(() => {
    // Bible data cache refresh check
    refreshCacheIfDue();

    // NOTE: We intentionally do NOT auto-reload on controllerchange or
    // UPDATE_FOUND here. The service worker calls skipWaiting()/clients.claim()
    // on install, which fires controllerchange — auto-reloading on that caused
    // an infinite refresh loop. The SplashScreen owns the update flow and
    // performs any needed reloads at the right time.
  }, []);

  return children;
}