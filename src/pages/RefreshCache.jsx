import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, RefreshCw } from 'lucide-react';

export default function RefreshCache() {
  const [refreshing, setRefreshing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    setSuccess(false);

    try {
      // Clear all caches
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));

      // Unregister service worker
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(reg => reg.unregister()));

      // Force reload
      setTimeout(() => {
        window.location.reload(true);
      }, 1000);
    } catch (err) {
      console.error('Cache refresh failed:', err);
      // Fallback: just reload
      window.location.reload(true);
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
            <p className="font-sans text-lg text-foreground">Refreshing cache...</p>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
            <p className="font-sans text-lg text-foreground">Cache cleared! Reloading...</p>
          </>
        )}
      </div>
    </div>
  );
}