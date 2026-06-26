import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';

let deferredPrompt = null;

// "Installed" === the page is genuinely running as a standalone app RIGHT NOW.
// A normal browser tab is never standalone, so cancelling an install dialog
// cannot flip this. No sticky session flags, no `appinstalled` (which Chromium
// fires even on cancel) — purely the live display mode, recomputed each render.
const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  if (window.navigator.standalone === true) return true; // iOS
  return window.matchMedia('(display-mode: standalone)').matches;
};

if (typeof window !== 'undefined') {
  if (window.kjbDeferredPrompt) {
    deferredPrompt = window.kjbDeferredPrompt;
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    window.kjbDeferredPrompt = event;
    window.dispatchEvent(new Event('pwa-installable'));
  });
}

export function useInstallPrompt() {
  if (!deferredPrompt && typeof window !== 'undefined' && window.kjbDeferredPrompt) {
    deferredPrompt = window.kjbDeferredPrompt;
  }
  const [isInstallable, setIsInstallable] = useState(!!deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(isStandalone());
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (!deferredPrompt && typeof window !== 'undefined' && window.kjbDeferredPrompt) {
        deferredPrompt = window.kjbDeferredPrompt;
      }
      setIsInstallable(!!deferredPrompt);
      setIsInstalled(isStandalone());
    };

    window.addEventListener('pwa-installable', sync);
    window.addEventListener('focus', sync);
    const mq = window.matchMedia('(display-mode: standalone)');
    mq.addEventListener?.('change', sync);

    sync();

    return () => {
      window.removeEventListener('pwa-installable', sync);
      window.removeEventListener('focus', sync);
      mq.removeEventListener?.('change', sync);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt && typeof window !== 'undefined' && window.kjbDeferredPrompt) {
      deferredPrompt = window.kjbDeferredPrompt;
    }
    // Edge captures `beforeinstallprompt` slightly later — wait up to 3s.
    if (!deferredPrompt && typeof window !== 'undefined') {
      deferredPrompt = await new Promise((resolve) => {
        let settled = false;
        const onPrompt = () => {
          if (settled) return;
          settled = true;
          window.removeEventListener('beforeinstallprompt', onPrompt);
          resolve(window.kjbDeferredPrompt || null);
        };
        window.addEventListener('beforeinstallprompt', onPrompt);
        const start = Date.now();
        const poll = setInterval(() => {
          if (window.kjbDeferredPrompt || Date.now() - start > 3000) {
            clearInterval(poll);
            onPrompt();
          }
        }, 150);
      });
    }
    if (!deferredPrompt) return false;

    try {
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;

      if (result.outcome === 'accepted') {
        deferredPrompt = null;
        window.kjbDeferredPrompt = null;
        setIsInstallable(false);
        return true;
      }
      // Cancelled — keep the Install button. isInstalled stays false because
      // the page is still a normal browser tab (not standalone).
      return 'cancelled';
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
    if (accepted === true) {
      setShowPrompt(false);
    }
    return accepted;
  };

  const handleDismiss = () => {
    dismiss();
  };

  return { isInstallable, isInstalled, promptInstall, dismiss, wasDismissed, showPrompt, setShowPrompt, handleInstall, handleDismiss };
}