import { useEffect } from 'react';
import { refreshCacheIfDue } from '@/lib/bibleCache';

export default function AutoUpdateHandler({ children }) {
  useEffect(() => {
    // Only refresh if 24 hours have passed since last refresh
    // This ensures we only update when there are actual changes
    refreshCacheIfDue();
  }, []);

  // Always render children - update check happens in background
  return children;
}