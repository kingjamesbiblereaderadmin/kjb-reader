import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';

const SoftReloadContext = createContext({ reloadKey: 0, softReload: () => {} });

export function SoftReloadProvider({ children }) {
  const [reloadKey, setReloadKey] = useState(0);
  const [isReloading, setIsReloading] = useState(false);

  const softReload = useCallback((message = 'Refreshing…') => {
    setIsReloading(true);
    toast.loading(message, { id: 'soft-reload', duration: 1200 });
    // Remount the page content (header/footer stay mounted)
    setTimeout(() => {
      setReloadKey(k => k + 1);
      setIsReloading(false);
      toast.success('Refreshed', { id: 'soft-reload', duration: 1500 });
    }, 400);
  }, []);

  // Listen for service-worker controller change → trigger a silent hard reload
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onControllerChange = () => {
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    return () => navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
  }, []);

  return (
    <SoftReloadContext.Provider value={{ reloadKey, softReload, isReloading }}>
      {children}
    </SoftReloadContext.Provider>
  );
}

export const useSoftReload = () => useContext(SoftReloadContext);