import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';

let deferredPrompt = null;

// "Installed" === the page is genuinely running as a standalone app RIGHT NOW.
// A normal browser tab is never standalone, so cancelling an install dialog
// cannot flip this. No sticky session flags, no `appinstalled` (which Chromium
// fires even on cancel) — purely the live display mode, recomputed each render.
const inIframe = () => {
  try { return window.self !== window.top; } catch { return true; }
};

const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  // A real installed PWA is never inside an iframe. The Base44 preview renders
  // the app in an iframe, which can falsely report display-mode: standalone —
  // so an iframe is never "installed".
  if (inIframe()) return false;
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
      // Cancelled — the prompt event is now spent and can't be re-fired.
      // Clear it so the button stays visible and the NEXT click falls back to
      // the manual install guide instead of silently doing nothing.
      deferredPrompt = null;
      window.kjbDeferredPrompt = null;
      setIsInstallable(false);
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