import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';

let deferredPrompt = null;
let didInstall = false; // set true only by a genuine `appinstalled` event

// Is the app genuinely running as an installed standalone app right now?
const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  if (window.navigator.standalone === true) return true; // iOS
  return window.matchMedia('(display-mode: standalone)').matches;
};

// The single source of truth for "installed":
// - true if running in a standalone window, OR
// - true if a genuine `appinstalled` event fired this session.
// Crucially, if the browser is STILL offering an install prompt
// (deferredPrompt present), the app is NOT installed — this stops a cancelled
// install dialog (Chrome & Edge) from flipping the UI to "installed".
const computeInstalled = () => {
  if (deferredPrompt || window.kjbDeferredPrompt) return false;
  return didInstall || isStandalone();
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

  // Fires only when the app is actually added. With a valid manifest this is
  // reliable; we still clear the deferred prompt so state is consistent.
  window.addEventListener('appinstalled', () => {
    didInstall = true;
    deferredPrompt = null;
    window.kjbDeferredPrompt = null;
    window.dispatchEvent(new Event('pwa-installable'));
  });
}

export function useInstallPrompt() {
  if (!deferredPrompt && typeof window !== 'undefined' && window.kjbDeferredPrompt) {
    deferredPrompt = window.kjbDeferredPrompt;
  }
  const [isInstallable, setIsInstallable] = useState(!!deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(computeInstalled());
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (!deferredPrompt && typeof window !== 'undefined' && window.kjbDeferredPrompt) {
        deferredPrompt = window.kjbDeferredPrompt;
      }
      setIsInstallable(!!deferredPrompt);
      setIsInstalled(computeInstalled());
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

      // Cancelled — keep the Install button. deferredPrompt stays set, so
      // computeInstalled() still returns false.
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