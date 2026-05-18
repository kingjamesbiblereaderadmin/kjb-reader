import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      setIsInstalled(true);
      return;
    }

    const handler = (e) => {
      console.log('[PWA] beforeinstallprompt fired', e);
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    
    window.addEventListener('appinstalled', () => {
      console.log('[PWA] app installed');
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    });

    // Debug: log if event never fires
    const timeout = setTimeout(() => {
      if (!isInstallable && !isInstalled) {
        console.log('[PWA] No install prompt after 3s - likely iOS or missing manifest/service worker');
        console.log('[PWA] manifest.json exists:', !!document.querySelector('link[rel="manifest"]'));
        console.log('[PWA] serviceWorker registered:', !!navigator.serviceWorker?.controller);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timeout);
    };
  }, [isInstallable, isInstalled]);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      // No beforeinstallprompt event (likely iOS Safari or already handled)
      // Return false to indicate manual install instructions should be shown
      return false;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstallable(false);
    return outcome === 'accepted';
  };

  const wasDismissed = () => {
    try { return !!localStorage.getItem(DISMISSED_KEY); } catch { return false; }
  };

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, 'true'); } catch {}
    setShowPrompt(false);
  };

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      setShowPrompt(false);
    }
    return accepted;
  };

  const handleDismiss = () => {
    dismiss();
  };

  return { isInstallable, isInstalled, promptInstall, dismiss, wasDismissed, showPrompt, setShowPrompt, handleInstall, handleDismiss };
}