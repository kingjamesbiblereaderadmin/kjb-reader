import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';

// ─────────────────────────────────────────────────────────────────────────
// Install state model — deliberately minimal so it CANNOT flip on cancel.
//
// "Installed" becomes true via EXACTLY TWO inputs, and nothing else:
//   1. `LAUNCHED_STANDALONE` — read ONCE at module load. A genuinely installed
//      PWA always launches in standalone display mode from the first paint.
//      Reading it once (not live) means a transient `display-mode: standalone`
//      report that some browsers emit AFTER cancelling an install dialog can
//      never be observed — the value is frozen before any dialog can open.
//   2. The browser's `appinstalled` event — the only authoritative runtime
//      signal that an install actually completed.
//
// Cancelling the native install dialog runs NONE of the code that sets
// installed=true. There is no display-mode listener, no focus re-check, and
// no localStorage flag. So a cancel physically cannot flip the state.
// ─────────────────────────────────────────────────────────────────────────

const inIframe = () => {
  try { return window.self !== window.top; } catch { return true; }
};

// Frozen at module load — see note above.
const LAUNCHED_STANDALONE = (() => {
  if (typeof window === 'undefined') return false;
  // The Base44 preview runs the app in an iframe, which can falsely report
  // standalone. A real installed PWA is never inside an iframe.
  if (inIframe()) return false;
  if (window.navigator.standalone === true) return true; // iOS Safari
  try { return window.matchMedia('(display-mode: standalone)').matches; } catch { return false; }
})();

// Shared module state.
let deferredPrompt = (typeof window !== 'undefined' && window.kjbDeferredPrompt) || null;
let appInstalledFired = false;
// True once the browser has ever offered an install prompt this session. A real
// installed PWA NEVER fires beforeinstallprompt, so this firing is definitive
// proof the app is NOT installed — used to veto a false standalone read on
// browsers (e.g. Samsung Internet) that wrongly report standalone in a tab.
let promptEverOffered = (typeof window !== 'undefined' && window.kjbPromptedThisSession === true);

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.kjbDeferredPrompt = e;
    promptEverOffered = true;
    window.dispatchEvent(new Event('kjb-install-change'));
  });
  // index.html may capture the prompt before this module loads.
  window.addEventListener('pwa-installable', () => {
    if (window.kjbDeferredPrompt) deferredPrompt = window.kjbDeferredPrompt;
    window.dispatchEvent(new Event('kjb-install-change'));
  });
  // THE ONLY runtime input that marks the app installed.
  window.addEventListener('appinstalled', () => {
    appInstalledFired = true;
    deferredPrompt = null;
    window.kjbDeferredPrompt = null;
    window.dispatchEvent(new Event('kjb-install-change'));
  });
}

// The appinstalled event is always authoritative. Otherwise, a standalone
// launch counts as installed ONLY if no install prompt has ever been offered
// (since an installed PWA never gets one). This vetoes Samsung Internet's
// bogus standalone-in-a-tab report.
const computeInstalled = () => appInstalledFired || (LAUNCHED_STANDALONE && !promptEverOffered);

export function useInstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(!!deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(computeInstalled());
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const sync = () => {
      if (!deferredPrompt && window.kjbDeferredPrompt) deferredPrompt = window.kjbDeferredPrompt;
      setIsInstallable(!!deferredPrompt);
      setIsInstalled(computeInstalled());
    };
    window.addEventListener('kjb-install-change', sync);
    sync();
    return () => window.removeEventListener('kjb-install-change', sync);
  }, []);

  // Fire the native install dialog.
  //   true   → accepted (install started; `appinstalled` will set installed)
  //   false  → no native prompt available (caller shows the manual guide)
  // A cancel intentionally returns false too — the button stays actionable and
  // the installed state is untouched.
  const promptInstall = async () => {
    if (!deferredPrompt && window.kjbDeferredPrompt) deferredPrompt = window.kjbDeferredPrompt;
    if (!deferredPrompt) return false;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      // The captured event is single-use; drop it. Chrome re-fires
      // beforeinstallprompt afterward, which our listener re-captures so the
      // button can prompt again.
      deferredPrompt = null;
      window.kjbDeferredPrompt = null;
      setIsInstallable(false);
      return outcome === 'accepted';
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
  const handleDismiss = () => dismiss();

  return { isInstallable, isInstalled, promptInstall, dismiss, wasDismissed, showPrompt, setShowPrompt, handleInstall, handleDismiss };
}