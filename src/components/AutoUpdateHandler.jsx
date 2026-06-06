import { useEffect } from 'react';
import { refreshCacheIfDue } from '@/lib/bibleCache';

export default function AutoUpdateHandler({ children }) {
  useEffect(() => {
    // Initial check on mount
    refreshCacheIfDue();


  }, []);

  // Always render children - update check happens in background
  return children;
}