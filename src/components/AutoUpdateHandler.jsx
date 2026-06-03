import { useEffect } from 'react';
import { refreshCacheIfDue } from '@/lib/bibleCache';

export default function AutoUpdateHandler({ children }) {
  useEffect(() => {
    // Initial check on mount
    refreshCacheIfDue();

    // Periodically check for updates in the background (e.g. every 15 minutes)
    const interval = setInterval(() => {
      refreshCacheIfDue();
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, []);

  // Always render children - update check happens in background
  return children;
}