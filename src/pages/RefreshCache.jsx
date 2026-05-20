import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { downloadBibleForOffline } from '@/lib/bibleCache';

export default function RefreshCache() {
  const [refreshing, setRefreshing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleRefresh = async () => {
    setRefreshing(true);
    setSuccess(false);
    setProgress(0);

    try {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));

      // Unregister service worker
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));

      // Download fresh Bible data
      await downloadBibleForOffline((pct) => setProgress(pct));

      setSuccess(true);
      
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        {refreshing && !success ? (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
            <p className="font-sans text-lg text-foreground">Updating cache...</p>
            {progress > 0 && (
              <div className="w-48 mx-auto bg-secondary rounded-full h-2 mt-3">
                <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
              </div>
            )}
          </>
        ) : (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <p className="font-sans text-lg text-foreground">Cache updated! Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}