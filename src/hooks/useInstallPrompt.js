import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';
const INSTALLED_KEY = 'kjb-is-installed';

let globalDeferredPrompt = null;
let globalIsInstallable = false;
let globalIsInstalled = false;

if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem(INSTALLED_KEY) === 'true') {
      globalIsInstalled = true;
    }
  } catch {}

  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    globalIsInstalled = true;
    try { localStorage.setItem(INSTALLED_KEY, 'true'); } catch {}
  }
  
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] global beforeinstallprompt fired', e);
    e.preventDefault();
    globalDeferredPrompt = e;
    globalIsInstallable = true;
    globalIsInstalled = false;
    try { localStorage.removeItem(INSTALLED_KEY); } catch {}
    window.dispatchEvent(new Event('pwa-installable'));
    window.dispatchEvent(new Event('pwa-installed'));
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] global app installed');
    globalIsInstalled = true;
    globalIsInstallable = false;
    globalDeferredPrompt = null;
    try { localStorage.setItem(INSTALLED_KEY, 'true'); } catch {}
    window.dispatchEvent(new Event('pwa-installed'));
  });
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(globalDeferredPrompt);
  const [isInstallable, setIsInstallable] = useState(globalIsInstallable);
  const [isInstalled, setIsInstalled] = useState(globalIsInstalled);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleInstallable = () => {
      setDeferredPrompt(globalDeferredPrompt);
      setIsInstallable(globalIsInstallable);
    };
    const handleInstalled = () => {
      setIsInstalled(globalIsInstalled);
      setIsInstallable(globalIsInstallable);
      setDeferredPrompt(globalDeferredPrompt);
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

  const promptInstall = () => {
    if (!globalDeferredPrompt) {
      if (globalIsInstallable) {
        // The prompt was used. The browser requires a fresh event to show the native popup again.
        // We'll quickly reload the page to get a fresh event so they can try again.
        window.location.reload();
      }
      return Promise.resolve(false);
    }
    
    const promptEvent = globalDeferredPrompt;
    globalDeferredPrompt = null;
    setDeferredPrompt(null);
    
    try {
      promptEvent.prompt();
      return promptEvent.userChoice.then((choice) => {
        const outcome = choice.outcome;
        if (outcome === 'accepted') {
          globalIsInstallable = false;
          setIsInstallable(false);
          globalIsInstalled = true;
          setIsInstalled(true);
          try { localStorage.setItem(INSTALLED_KEY, 'true'); } catch {}
          window.dispatchEvent(new Event('pwa-installed')); 
        }
        return outcome === 'accepted';
      });
    } catch (err) {
      console.error('Failed to prompt install', err);
      window.location.reload();
      return Promise.resolve(false);
    }
  };

  const wasDismissed = () => {
    try { return !!localStorage.getItem(DISMISSED_KEY); } catch { return false; }
  };

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, 'true'); } catch {}
    setShowPrompt(false);
  };

  const handleInstall = () => {
    return promptInstall().then(accepted => {
      if (accepted) {
        setShowPrompt(false);
      }
      return accepted;
    });
  };

  const handleDismiss = () => {
    dismiss();
  };

  return { isInstallable, isInstalled, promptInstall, dismiss, wasDismissed, showPrompt, setShowPrompt, handleInstall, handleDismiss };
}