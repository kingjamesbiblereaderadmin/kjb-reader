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
//
// Samsung Internet wrongly reports `display-mode: standalone` in a NORMAL tab,
// which is the root cause of the false "Installed" state. To defeat that we
// require BOTH: (a) the standalone display signal, AND (b) a launch that
// looks like a real app launch rather than an in-browser tab — i.e. the page
// was NOT opened from another browsing context (no referrer, no opener).
// A genuinely installed PWA launches from the OS home-screen with an empty
// referrer; a Samsung tab that's been navigated to always has one. Treating
// any ambiguous/in-browser launch as NOT installed errs on the safe side.
const LAUNCHED_STANDALONE = (() => {
  if (typeof window === 'undefined') return false;
  // The Base44 preview runs the app in an iframe, which can falsely report
  // standalone. A real installed PWA is never inside an iframe.
  if (inIframe()) return false;
  // iOS Safari's navigator.standalone is reliable — trust it directly.
  if (window.navigator.standalone === true) return true;

  let displayStandalone = false;
  try { displayStandalone = window.matchMedia('(display-mode: standalone)').matches; } catch { displayStandalone = false; }
  if (!displayStandalone) return false;

  // Secondary check to filter out Samsung's false standalone-in-tab report:
  // a real home-screen launch has no opener and an empty referrer. If the page
  // was reached from a browsing context, it's a tab — not an installed app.
  try {
    const hasOpener = !!window.opener;
    const hasReferrer = !!document.referrer;
    if (hasOpener || hasReferrer) return false;
  } catch {}

  return true;
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
  // appinstalled fires on a real install — but Samsung Internet and some
  // Chromium builds ALSO fire it the instant you CANCEL the dialog. Since any
  // tab that was offered a prompt is provably not an installed PWA, we ignore
  // appinstalled entirely once a prompt has been offered. It only marks the app
  // installed in the (rare) case it fires without a prompt ever being seen.
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.kjbDeferredPrompt = null;
    if (!promptEverOffered) appInstalledFired = true;
    window.dispatchEvent(new Event('kjb-install-change'));
  });
}

// A real installed PWA launches standalone and NEVER fires beforeinstallprompt.
// So in any tab/session where a prompt has been offered, the app is provably
// NOT installed — regardless of any appinstalled event. Samsung Internet (and
// some Chromium builds) fire a bogus `appinstalled` the instant you CANCEL the
// dialog, so we must NOT trust appinstalled once a prompt was offered. Installed
// is true only for a clean standalone launch with no prompt ever seen.
const computeInstalled = () => {
  if (promptEverOffered) return false;
  return appInstalledFired || LAUNCHED_STANDALONE;
};

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
      // Showing the prompt is definitive proof this is NOT an installed PWA
      // (installed apps never get a prompt). Set the veto NOW so the bogus
      // `appinstalled` Samsung Internet fires on Cancel can never mark the app
      // installed — no matter the event timing/race.
      promptEverOffered = true;
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