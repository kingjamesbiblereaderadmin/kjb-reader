import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';

let globalDeferredPrompt = null;
let globalIsInstallable = false;
let globalIsInstalled = false;

if (typeof window !== 'undefined') {
  if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
    globalIsInstalled = true;
  }
  
  window.addEventListener('beforeinstallprompt', (e) => {
    console.log('[PWA] global beforeinstallprompt fired', e);
    e.preventDefault();
    globalDeferredPrompt = e;
    globalIsInstallable = true;
    window.dispatchEvent(new Event('pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    console.log('[PWA] global app installed');
    globalIsInstalled = true;
    globalIsInstallable = false;
    globalDeferredPrompt = null;
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
        alert("The installation prompt was already used. Please install via your browser's menu, or reload the page to try again.");
      }
      return Promise.resolve(false);
    }
    // Prevent "prompt() may only be called once" if user clicks multiple times rapidly
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
          // Dispatch to sync other hooks
          window.dispatchEvent(new Event('pwa-installed')); 
        }
        // If not accepted, keep isInstallable true so the button remains visible.
        return outcome === 'accepted';
      });
    } catch (err) {
      console.error('Failed to prompt install', err);
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