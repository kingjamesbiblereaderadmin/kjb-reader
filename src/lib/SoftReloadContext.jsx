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

  // Listen for service-worker controller change
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const onControllerChange = () => {
      console.log('[SW] Controller changed. Reloading automatically for app update.');
      const overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.inset = '0';
      overlay.style.zIndex = '999999';
      overlay.style.backgroundColor = 'hsl(var(--background))';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.innerHTML = '<svg class="animate-spin" style="width: 2.5rem; height: 2.5rem; margin-bottom: 1rem; color: hsl(var(--primary));" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg><div style="font-family: var(--font-sans); font-size: 1.125rem; font-weight: 500; color: hsl(var(--foreground));">Updating app...</div>';
      document.body.appendChild(overlay);
      setTimeout(() => {
        window.location.reload();
      }, 300);
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