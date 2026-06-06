import { useEffect } from 'react';
import { refreshCacheIfDue } from '@/lib/bibleCache';

export default function AutoUpdateHandler({ children }) {
  useEffect(() => {
    // Initial check on mount
    refreshCacheIfDue();

    // Periodically check for updates in the background (every 10 minutes)
    const interval = setInterval(() => {
      refreshCacheIfDue();
    }, 10 * 60 * 1000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshCacheIfDue();
      }
    };

    const handleFocus = () => {
      refreshCacheIfDue();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Always render children - update check happens in background
  return children;
}