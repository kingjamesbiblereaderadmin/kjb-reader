import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';

let deferredPrompt = null;

// The ONE source of truth for "is the app installed AND running as an app":
// is this page actually running in standalone display mode right now?
// A normal browser tab (where Settings lives) is NEVER standalone, so cancelling
// an install dialog can never flip this to true. This is deterministic — no
// localStorage flags, no timing windows, no spurious `appinstalled` events.
const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  // If the browser is still offering to install (a beforeinstallprompt is
  // available), the app is NOT installed — Edge can briefly report a browser
  // tab as "standalone" right after the install dialog is cancelled, which
  // falsely flipped the UI. Having a live install prompt rules that out.
  if (deferredPrompt || window.kjbDeferredPrompt) return false;
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
};

if (typeof window !== 'undefined') {
  if (window.kjbDeferredPrompt) {
    deferredPrompt = window.kjbDeferredPrompt;
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();      // Prevent auto-prompt so the custom button can trigger it
    deferredPrompt = event;      // Save the event for later
    window.kjbDeferredPrompt = event;
    window.dispatchEvent(new Event('pwa-installable'));
  });

  // NOTE: We intentionally do NOT listen for `appinstalled`. Edge fires it even
  // when the user CANCELS the install dialog, which falsely flipped the UI to
  // "installed". Installed state is derived solely from the live display-mode
  // check (isStandalone) instead, so it's always accurate.
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
      // Always re-read the live display mode — the only reliable signal.
      setIsInstalled(isStandalone());
    };

    window.addEventListener('pwa-installable', sync);
    window.addEventListener('focus', sync);
    // The display-mode media query itself changes when the app is launched
    // standalone — listen so the UI updates without needing a reload.
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
    // Always re-sync from the global capture in index.html — the event may have
    // fired before this hook module loaded its own listener.
    if (!deferredPrompt && typeof window !== 'undefined' && window.kjbDeferredPrompt) {
      deferredPrompt = window.kjbDeferredPrompt;
    }
    // Edge captures `beforeinstallprompt` slightly LATER than Chrome, so a fast
    // click can land before the event arrives. Wait up to 3s for it to fire
    // before falling back to the manual guide.
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
      deferredPrompt.prompt();     // Show Edge/Chrome install dialog
      const result = await deferredPrompt.userChoice;
      console.log(result.outcome); // "accepted" or "dismissed"

      if (result.outcome === 'accepted') {
        // Consumed — the browser will relaunch the app in standalone mode, where
        // isStandalone() becomes true. We don't manually flip installed state.
        deferredPrompt = null;
        window.kjbDeferredPrompt = null;
        setIsInstallable(false);
        return true;
      }

      // User cancelled — keep the Install button (return 'cancelled'). Installed
      // state stays false because the page is still a normal browser tab.
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