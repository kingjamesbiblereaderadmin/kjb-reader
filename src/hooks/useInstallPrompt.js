import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';

let deferredPrompt = null;
// True once the browser has fired beforeinstallprompt at least once. Used to
// decide whether to wait for a RE-fired prompt after a cancel (Chrome/Edge
// re-fire it; Samsung Internet does not).
let hadPromptOnce = false;
// Set to true ONLY by the browser's real `appinstalled` event. This is the one
// authoritative signal that the app was actually installed. We never infer
// "installed" from display-mode alone in a tab that produced an install prompt,
// because Chrome/Samsung can momentarily mis-report `display-mode: standalone`
// as the window refocuses after a cancelled dialog.
let trulyInstalled = false;

const inIframe = () => {
  try { return window.self !== window.top; } catch { return true; }
};

// The page is genuinely running as a standalone app.
const isStandalone = () => {
  if (typeof window === 'undefined') return false;
  // The Base44 preview renders the app in an iframe, which can falsely report
  // display-mode: standalone — an iframe is never a real installed PWA.
  if (inIframe()) return false;
  if (window.navigator.standalone === true) return true; // iOS
  return window.matchMedia('(display-mode: standalone)').matches;
};

// The single source of truth for the "Installed" state.
// Rule: if this browser tab EVER fired `beforeinstallprompt`, it is a browser
// tab — not a standalone PWA — so it can only be considered installed once the
// real `appinstalled` event fires. Tabs that never fire beforeinstallprompt
// (iOS Safari, an actual launched PWA) fall back to the live display-mode check.
const computeInstalled = () => {
  if (trulyInstalled) return true;
  if (hadPromptOnce) return false; // a browser tab with an install prompt is not installed
  return isStandalone();
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

  // The ONLY trustworthy "installed" signal — fired after a real install.
  window.addEventListener('appinstalled', () => {
    trulyInstalled = true;
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
      // A cancel means the app is NOT installed — never flip to "Installed".
      setIsInstalled(false);
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