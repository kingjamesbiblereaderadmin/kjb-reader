import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';
const INSTALLED_KEY = 'kjb-is-installed';

let deferredPrompt = null;

if (typeof window !== 'undefined') {
  if (window.kjbDeferredPrompt) {
    deferredPrompt = window.kjbDeferredPrompt;
  }
  
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();      // Prevent auto-prompt so the custom button can trigger it
    deferredPrompt = event;      // Save the event for later
    window.kjbDeferredPrompt = event;
    // A fresh install prompt means the app is NOT installed — clear any stale flag.
    try { localStorage.removeItem(INSTALLED_KEY); } catch {}
    window.dispatchEvent(new Event('pwa-installable'));
  });

  window.addEventListener('appinstalled', () => {
    // Edge can fire `appinstalled` even when the user taps out / cancels the
    // install dialog, which previously created a FAKE "installed" state and
    // hid the Install button. If the user JUST cancelled (within the last few
    // seconds), ignore this event entirely — it's the spurious Edge cancel event.
    if (window.kjbInstallJustCancelled && Date.now() - window.kjbInstallJustCancelled < 5000) {
      return;
    }
    // Don't trust this event on its own — only act if the app is genuinely
    // running standalone now. Otherwise keep the deferredPrompt so the Install
    // button stays available (like Chrome/Samsung).
    const reallyInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (!reallyInstalled) return;
    console.log('PWA installed');
    deferredPrompt = null;
    window.kjbDeferredPrompt = null;
    try { localStorage.setItem(INSTALLED_KEY, 'true'); } catch {}
    window.dispatchEvent(new Event('pwa-installed'));
  });
}

const checkIsInstalled = () => {
  if (typeof window === 'undefined') return false;
  // The only reliable signal is the actual display mode (running standalone).
  // The stored flag can go stale if the user later uninstalls the app from the
  // browser, so we self-heal it here.
  // If the user JUST cancelled the install dialog, ignore any transient
  // standalone reading Edge briefly reports right after — it falsely flips the
  // UI to "Installed". Treat as not-installed during this short window.
  if (window.kjbInstallJustCancelled && Date.now() - window.kjbInstallJustCancelled < 5000) {
    try { localStorage.removeItem(INSTALLED_KEY); } catch {}
    return false;
  }
  const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  // The ONLY reliable signal that the app is installed AND in use is running in
  // standalone display mode. Cancelling the install prompt previously left a
  // stale localStorage flag that falsely reported "Installed" — so we no longer
  // trust that flag and rely solely on the live display-mode signal.
  if (standalone) {
    try { localStorage.setItem(INSTALLED_KEY, 'true'); } catch {}
    return true;
  }
  // Not running standalone — treat as not installed (clears any stale flag).
  try { localStorage.removeItem(INSTALLED_KEY); } catch {}
  return false;
};

export function useInstallPrompt() {
  if (!deferredPrompt && typeof window !== 'undefined' && window.kjbDeferredPrompt) {
    deferredPrompt = window.kjbDeferredPrompt;
  }
  const [isInstallable, setIsInstallable] = useState(!!deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(checkIsInstalled());
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleInstallable = () => {
      // Re-sync from the global capture before reporting installability.
      if (!deferredPrompt && typeof window !== 'undefined' && window.kjbDeferredPrompt) {
        deferredPrompt = window.kjbDeferredPrompt;
      }
      setIsInstallable(!!deferredPrompt);
      // A re-fired install prompt means the app isn't installed anymore
      // (e.g. user uninstalled it) — refresh the installed flag too.
      setIsInstalled(checkIsInstalled());
    };
    const handleInstalled = () => {
      setIsInstalled(checkIsInstalled());
      setIsInstallable(!!deferredPrompt);
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

  const promptInstall = async () => {
    // Always re-sync from the global capture in index.html — the event may have
    // fired before this hook module loaded its own listener.
    if (!deferredPrompt && typeof window !== 'undefined' && window.kjbDeferredPrompt) {
      deferredPrompt = window.kjbDeferredPrompt;
    }
    // Edge captures `beforeinstallprompt` slightly LATER than Chrome, so a fast
    // click can land before the event arrives. Instead of immediately falling
    // back to the manual guide, wait up to 3s for the prompt to fire.
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
        // The global capture may also pick it up — poll briefly as a backup.
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
      // Set the cancel-guard marker BEFORE showing the dialog. Edge can fire the
      // spurious `appinstalled` event the instant the user dismisses — sometimes
      // BEFORE userChoice resolves — so the marker must already be in place to
      // block it. We clear it only on a confirmed "accepted" outcome below.
      window.kjbInstallJustCancelled = Date.now();
      deferredPrompt.prompt();     // Show Edge/Chrome install dialog
      const result = await deferredPrompt.userChoice;
      console.log(result.outcome); // "accepted" or "dismissed"

      if (result.outcome === 'accepted') {
        // Confirmed install — clear the cancel guard and mark installed.
        window.kjbInstallJustCancelled = 0;
        deferredPrompt = null;
        window.kjbDeferredPrompt = null;
        setIsInstallable(false);
        try { localStorage.setItem(INSTALLED_KEY, 'true'); } catch {}
        window.dispatchEvent(new Event('pwa-installed'));
        window.dispatchEvent(new Event('pwa-installable'));
        return true;
      }

      // User CANCELLED — keep the guard fresh (re-stamp), don't mark installed,
      // and don't show the manual guide. Return 'cancelled' so the button stays
      // an Install button.
      window.kjbInstallJustCancelled = Date.now();
      try { localStorage.removeItem(INSTALLED_KEY); } catch {}
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
    if (accepted) {
      setShowPrompt(false);
    }
    return accepted;
  };

  const handleDismiss = () => {
    dismiss();
  };

  return { isInstallable, isInstalled, promptInstall, dismiss, wasDismissed, showPrompt, setShowPrompt, handleInstall, handleDismiss };
}