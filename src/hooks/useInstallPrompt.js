import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';

// ── Module-level state (shared across all hook instances) ───────────────────
// The latest captured beforeinstallprompt event. Null when none is available.
let deferredPrompt = (typeof window !== 'undefined' && window.kjbDeferredPrompt) || null;
// True once this browser tab has fired beforeinstallprompt at least once.
// Such a tab is a browser tab (not a launched PWA), so it is NOT installed
// until the real `appinstalled` event fires.
let promptedThisSession = false;
// Set to true ONLY by the browser's authoritative `appinstalled` event.
let installedThisSession = false;

const inIframe = () => {
  try { return window.self !== window.top; } catch { return true; }
};

// Whether the page was LAUNCHED as a real standalone PWA. Captured ONCE at
// module load, before any runtime install-dialog cancel can transiently flip
// `display-mode: standalone` (the Chrome/Samsung/Edge false-positive). A real
// installed PWA always launches standalone from the very first paint, so this
// frozen-at-load value is the only trustworthy display-mode signal.
const launchedStandalone = (() => {
  if (typeof window === 'undefined') return false;
  // The Base44 preview renders the app in an iframe, which can falsely report
  // standalone — a real installed PWA is never in an iframe.
  if (inIframe()) return false;
  if (window.navigator.standalone === true) return true; // iOS Safari
  return window.matchMedia('(display-mode: standalone)').matches;
})();

// Single source of truth for "is the app installed?".
// 1. Real appinstalled event fired this session → installed (authoritative).
// 2. The page was launched standalone at load    → installed.
// 3. Anything else (incl. any runtime display-mode change after a cancel)
//    → NOT installed. We deliberately ignore live display-mode reads so a
//    cancelled install dialog can never flip the state.
const computeInstalled = () => installedThisSession || launchedStandalone;

if (typeof window !== 'undefined') {
  // index.html may have already captured a prompt before this module loaded.
  if (window.kjbPromptedThisSession) promptedThisSession = true;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    window.kjbDeferredPrompt = event;
    window.kjbPromptedThisSession = true;
    promptedThisSession = true;
    window.dispatchEvent(new Event('kjb-install-state'));
  });

  // Bridge the legacy event name used by index.html's early listener.
  window.addEventListener('pwa-installable', () => {
    if (window.kjbDeferredPrompt) deferredPrompt = window.kjbDeferredPrompt;
    if (window.kjbPromptedThisSession) promptedThisSession = true;
    window.dispatchEvent(new Event('kjb-install-state'));
  });

  window.addEventListener('appinstalled', () => {
    installedThisSession = true;
    deferredPrompt = null;
    window.kjbDeferredPrompt = null;
    window.dispatchEvent(new Event('kjb-install-state'));
  });
}

export function useInstallPrompt() {
  // Adopt a prompt captured before this hook mounted (e.g. by index.html).
  if (!deferredPrompt && typeof window !== 'undefined' && window.kjbDeferredPrompt) {
    deferredPrompt = window.kjbDeferredPrompt;
    promptedThisSession = true;
  }

  const [isInstallable, setIsInstallable] = useState(!!deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(computeInstalled());
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (!deferredPrompt && typeof window !== 'undefined' && window.kjbDeferredPrompt) {
        deferredPrompt = window.kjbDeferredPrompt;
        promptedThisSession = true;
      }
      setIsInstallable(!!deferredPrompt);
      setIsInstalled(computeInstalled());
    };

    window.addEventListener('kjb-install-state', sync);
    window.addEventListener('focus', sync);

    sync();

    return () => {
      window.removeEventListener('kjb-install-state', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  // Fire the native install dialog. Returns:
  //   true        → user accepted (installing)
  //   'cancelled' → user dismissed the native dialog
  //   false       → no native prompt available (caller shows manual guide)
  const promptInstall = async () => {
    if (!deferredPrompt && typeof window !== 'undefined' && window.kjbDeferredPrompt) {
      deferredPrompt = window.kjbDeferredPrompt;
    }
    // Chrome/Edge re-fire a fresh beforeinstallprompt shortly after a cancel,
    // which can arrive a moment late. If this tab has prompted before, wait
    // briefly for the re-fired event so a repeat click re-opens the dialog.
    if (!deferredPrompt && promptedThisSession && typeof window !== 'undefined') {
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
      const { outcome } = await deferredPrompt.userChoice;
      // The event is single-use either way.
      deferredPrompt = null;
      window.kjbDeferredPrompt = null;

      if (outcome === 'accepted') {
        // `appinstalled` will flip isInstalled; until then just hide the button.
        setIsInstallable(false);
        return true;
      }
      // Cancelled: stay "not installed" and keep the button visible. The browser
      // re-fires beforeinstallprompt, which our listener re-captures.
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
    const result = await promptInstall();
    if (result === true) setShowPrompt(false);
    return result;
  };

  const handleDismiss = () => {
    dismiss();
  };

  return { isInstallable, isInstalled, promptInstall, dismiss, wasDismissed, showPrompt, setShowPrompt, handleInstall, handleDismiss };
}