import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';
const INSTALLED_KEY = 'kjb-is-installed';

class PWAInstallManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstallable = false;
    this.isInstalled = false;

    if (typeof window !== 'undefined') {
      if (window.kjbDeferredPrompt) {
        this.deferredPrompt = window.kjbDeferredPrompt;
        this.isInstallable = true;
      }

      try {
        if (localStorage.getItem(INSTALLED_KEY) === 'true') {
          this.isInstalled = true;
        }
      } catch {}

      if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
        this.isInstalled = true;
        try { localStorage.setItem(INSTALLED_KEY, 'true'); } catch {}
      }
      
      window.addEventListener('beforeinstallprompt', (e) => {
        console.log('[PWA] global beforeinstallprompt fired', e);
        e.preventDefault();
        this.deferredPrompt = e;
        window.kjbDeferredPrompt = e;
        this.isInstallable = true;
        this.isInstalled = false;
        try { localStorage.removeItem(INSTALLED_KEY); } catch {}
        window.dispatchEvent(new Event('pwa-installable'));
      });

      window.addEventListener('appinstalled', () => {
        console.log('[PWA] global app installed');
        this.isInstalled = true;
        this.isInstallable = false;
        this.deferredPrompt = null;
        window.kjbDeferredPrompt = null;
        try { localStorage.setItem(INSTALLED_KEY, 'true'); } catch {}
        window.dispatchEvent(new Event('pwa-installed'));
      });
    }
  }

  async promptInstall() {
    const promptEvent = this.deferredPrompt || window.kjbDeferredPrompt;

    // Use standard beforeinstallprompt if available, as it's the most reliable
    if (promptEvent) {
      try {
        // MUST be called completely synchronously in the click handler
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        console.log('User choice:', outcome);
        
        this.deferredPrompt = null;
        window.kjbDeferredPrompt = null;
        this.isInstallable = false;
        window.dispatchEvent(new Event('pwa-installable'));
        
        if (outcome === 'accepted') {
          this.isInstalled = true;
          try { localStorage.setItem(INSTALLED_KEY, 'true'); } catch {}
          window.dispatchEvent(new Event('pwa-installed')); 
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to prompt install via beforeinstallprompt:', err);
        return false;
      }
    }
    
    return false;
  }
}

const installManager = new PWAInstallManager();

export function useInstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(installManager.isInstallable);
  const [isInstalled, setIsInstalled] = useState(installManager.isInstalled);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleInstallable = () => setIsInstallable(installManager.isInstallable);
    const handleInstalled = () => {
      setIsInstalled(installManager.isInstalled);
      setIsInstallable(installManager.isInstallable);
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

  const promptInstall = () => installManager.promptInstall();

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