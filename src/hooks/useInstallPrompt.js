import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';
const INSTALLED_KEY = 'kjb-is-installed';

let deferredPrompt = null;

if (typeof window !== 'undefined') {
  if (window.kjbDeferredPrompt) {
    deferredPrompt = window.kjbDeferredPrompt;
  }
  
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();      // Prevent auto-prompt
    deferredPrompt = event;      // Save the event for later
    window.kjbDeferredPrompt = event;
    window.dispatchEvent(new Event('pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA installed');
    deferredPrompt = null;
    window.kjbDeferredPrompt = null;
    try { localStorage.setItem(INSTALLED_KEY, 'true'); } catch {}
    window.dispatchEvent(new Event('pwa-installed'));
  });
}

const checkIsInstalled = () => {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) return true;
  try { return localStorage.getItem(INSTALLED_KEY) === 'true'; } catch { return false; }
};

export function useInstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(!!deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(checkIsInstalled());
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleInstallable = () => setIsInstallable(!!deferredPrompt);
    const handleInstalled = () => {
      setIsInstalled(checkIsInstalled());
      setIsInstallable(!!deferredPrompt);
    };

    window.addEventListener('pwa-installable', handleInstallable);
    window.addEventListener('pwa-installed', handleInstalled);

    handleInstallable();
    handleInstalled();

    return () => {
      window.removeEventListener('pwa-installable', handleInstallable);
      window.removeEventListener('pwa-installed', handleInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();     // Show Edge/Chrome install dialog
      const result = await deferredPrompt.userChoice;
      console.log(result.outcome); // "accepted" or "dismissed"

      deferredPrompt = null;       // Must reset
      window.kjbDeferredPrompt = null;
      setIsInstallable(false);
      window.dispatchEvent(new Event('pwa-installable'));

      if (result.outcome === 'accepted') {
        try { localStorage.setItem(INSTALLED_KEY, 'true'); } catch {}
        window.dispatchEvent(new Event('pwa-installed'));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Install prompt error:', err);
      return false;
    }
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