import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';

let deferredPrompt = null;
// True once the browser has fired beforeinstallprompt at least once. Used to
// decide whether to wait for a RE-fired prompt after a cancel (Chrome/Edge
// re-fire it; Samsung Internet does not).
let hadPromptOnce = false;

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
    hadPromptOnce = true;
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
    // Chrome/Edge re-fire a fresh beforeinstallprompt shortly after a cancel,
    // but it can arrive a moment late — wait briefly so a repeat click re-opens
    // the native dialog. ONLY do this if a prompt has fired before; Samsung
    // Internet never re-fires, so waiting there would just stall and then
    // wrongly flip to the manual guide.
    if (!deferredPrompt && hadPromptOnce && typeof window !== 'undefined') {
      deferredPrompt = await new Promise((resolve) => {
        const start = Date.now();
        const poll = setInterval(() => {
          if (window.kjbDeferredPrompt || Date.now() - start > 1500) {
            clearInterval(poll);
            resolve(window.kjbDeferredPrompt || null);
          }
        }, 100);
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
      // Cancelled — the used prompt event is spent and can't be re-fired.
      // Drop the stale reference, but the browser (Chrome/Edge) re-fires a
      // FRESH `beforeinstallprompt` shortly after a cancel; our global listener
      // captures it into window.kjbDeferredPrompt, so the button keeps working
      // and re-opens the native dialog on the next click. Keep isInstallable
      // true so the Install button stays visible until the app is installed.
      deferredPrompt = null;
      window.kjbDeferredPrompt = null;
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