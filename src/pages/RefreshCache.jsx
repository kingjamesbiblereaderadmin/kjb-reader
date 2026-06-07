import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { downloadBibleForOfflineWithRetry } from '@/lib/bibleCache';

import { checkForUpdates, isBibleCached } from '@/lib/bibleCache';
import { Info } from 'lucide-react';

export default function RefreshCache() {
  const [status, setStatus] = useState('checking'); // checking, updating, success, no_update
  const [progress, setProgress] = useState(0);

  const handleRefresh = async () => {
    try {
      let hasCodeUpdates = false;
      let hasBibleUpdates = false;

      // 1. Check code updates
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.update().catch(() => {});
          if (reg.waiting) {
            hasCodeUpdates = true;
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          } else if (reg.installing && reg.installing.state === 'installed') {
            hasCodeUpdates = true;
            reg.installing.postMessage({ type: 'SKIP_WAITING' });
          }
        }
      }

      // 2. Check Bible updates
      hasBibleUpdates = await checkForUpdates();
      const cached = await isBibleCached();
      if (!cached) hasBibleUpdates = true;

      if (!hasCodeUpdates && !hasBibleUpdates) {
        setStatus('no_update');
        setTimeout(() => { window.location.href = '/'; }, 2000);
        return;
      }

      setStatus('updating');

      if (hasBibleUpdates) {
        // Clear caches so the new one can fetch cleanly
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));

        localStorage.removeItem('bible_cache_version');
        localStorage.removeItem('bible_last_refresh');
        localStorage.removeItem('kjb-daily-verse-cache');
        
        await downloadBibleForOfflineWithRetry((pct) => setProgress(pct));
      }

      setStatus('success');
      
      // Reload after success
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
    } catch (err) {
      console.error('Cache refresh failed:', err);
      // Fallback: just reload
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center bg-background py-12">
      <div className="text-center space-y-4">
        {status === 'checking' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="font-sans text-lg text-foreground">Checking for updates...</p>
          </>
        )}
        {status === 'updating' && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="font-sans text-lg text-foreground">Updating cache...</p>
            {progress > 0 && (
              <div className="w-48 mx-auto bg-secondary rounded-full h-2 mt-3">
                <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            )}
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <p className="font-sans text-lg text-foreground">Cache updated! Redirecting...</p>
          </>
        )}
        {status === 'no_update' && (
          <>
            <Info className="w-12 h-12 text-blue-500 mx-auto" />
            <p className="font-sans text-lg text-foreground">App is already up to date! Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}