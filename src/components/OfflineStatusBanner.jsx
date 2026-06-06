import React, { useState, useEffect, useRef } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { isBibleCached, CACHE_VERSION, downloadBibleForOffline } from '@/lib/bibleCache';
import { useNavigate } from 'react-router-dom';

export default function OfflineStatusBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [bibleReady, setBibleReady] = useState(null); // null = checking
  const [cacheStale, setCacheStale] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [done, setDone] = useState(false);
  const didAutoUpdate = useRef(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const checkCache = () => {
      isBibleCached().then(cached => {
        setBibleReady(cached);
        if (cached) {
          const localVer = localStorage.getItem('bible_cache_version');
          const stale = !!localVer && localVer !== CACHE_VERSION;
          setCacheStale(stale);
          // Auto-update immediately when stale and online
          if (stale && navigator.onLine && !didAutoUpdate.current) {
            didAutoUpdate.current = true;
            setUpdating(true);
            downloadBibleForOffline().then(() => {
              setDone(true);
              setCacheStale(false);
              setTimeout(() => setDone(false), 2000);
            }).catch(() => setUpdating(false));
          }
        }
      });
    };
    checkCache();
    window.addEventListener('kjb-cache-updated', checkCache);
    return () => window.removeEventListener('kjb-cache-updated', checkCache);
  }, [isOnline]);

  const handleUpdate = async () => {
    if (updating) return;
    setUpdating(true);
    try {
      await downloadBibleForOffline();
      setDone(true);
      setCacheStale(false);
      // Hide banner after 2 seconds
      setTimeout(() => setDone(false), 2000);
    } catch {
      setUpdating(false);
    }
  };

  // Online + Bible ready (stale or not) → no banner needed; auto-update runs silently in background
  if (isOnline && bibleReady && !done) return null;
  // Still checking
  if (bibleReady === null) return null;

  // Done state
  if (done) {
    return null; // Silently finish update
  }

  // Offline + Bible ready
  if (!isOnline && bibleReady) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 mb-4">
        <WifiOff className="w-4 h-4 flex-shrink-0" />
        <p className="font-sans text-xs font-medium flex-1">You're offline — reading from cached Bible data.</p>
      </div>
    );
  }

  // Online + cache is stale (new version available) — auto-update in place silently
  if (isOnline && bibleReady && cacheStale) {
    return null; // Silently update in background, no banner
  }

  // Offline + no Bible cache = can't read
  if (!isOnline && !bibleReady) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-800 dark:text-red-300 mb-4">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <p className="font-sans text-xs font-medium flex-1">Offline & Bible not downloaded. Connect to the internet to download it.</p>
      </div>
    );
  }

  // Online but no Bible cache yet
  if (isOnline && !bibleReady) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/40 text-blue-800 dark:text-blue-300 mb-4">
        <Wifi className="w-4 h-4 flex-shrink-0" />
        <p className="font-sans text-xs font-medium flex-1">Bible not yet saved for offline use.</p>
        <button
          onClick={() => navigate('/settings')}
          className="font-sans text-xs font-semibold underline underline-offset-2 hover:opacity-75 transition-opacity shrink-0"
        >
          Download
        </button>
      </div>
    );
  }

  return null;
}