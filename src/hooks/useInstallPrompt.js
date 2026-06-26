import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';

// Authoritative install detection — ONLY trust navigator.getInstalledRelatedApps().
// This API returns the actual installed PWAs matching the manifest, unaffected by
// Samsung's false display-mode reports or bogus appinstalled events on cancel.
// iOS lacks this API — fall back to navigator.standalone (reliable on iOS).
const checkInstalledAsync = async () => {
  if (typeof window === 'undefined') return false;
  
  // iOS: use navigator.standalone (reliable on iOS)
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    try { return window.navigator.standalone === true; } catch { return false; }
  }
  
  // Android/desktop: use getInstalledRelatedApps() as the ONLY signal
  if (navigator.getInstalledRelatedApps) {
    try {
      const apps = await navigator.getInstalledRelatedApps();
      return !!(apps && apps.length > 0);
    } catch { return false; }
  }
  
  // Fallback for browsers without the API: assume not installed
  // (better to miss an install than falsely claim one)
  return false;
};

let deferredPrompt = (typeof window !== 'undefined' && window.kjbDeferredPrompt) || null;
let promptEverOffered = (typeof window !== 'undefined' && window.kjbPromptedThisSession === true);

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.kjbDeferredPrompt = e;
    promptEverOffered = true;
    window.dispatchEvent(new Event('kjb-install-change'));
  });
  window.addEventListener('pwa-installable', () => {
    if (window.kjbDeferredPrompt) deferredPrompt = window.kjbDeferredPrompt;
    window.dispatchEvent(new Event('kjb-install-change'));
  });
  // We intentionally DO NOT listen to appinstalled — it fires on cancel in
  // Samsung/Chromium, making it untrustworthy. getInstalledRelatedApps() is
  // the only authoritative signal we use.
}

export function useInstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(!!deferredPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const installed = await checkInstalledAsync();
      console.log('[InstallHook] Checked installed:', installed, 'UA:', navigator.userAgent?.substring(0, 50));
      if (!cancelled) {
        setIsInstalled(installed);
        setIsLoading(false);
      }
    };
    check();
    
    const sync = () => {
      if (!deferredPrompt && window.kjbDeferredPrompt) deferredPrompt = window.kjbDeferredPrompt;
      setIsInstallable(!!deferredPrompt);
      console.log('[InstallHook] Sync installable:', !!deferredPrompt);
    };
    
    window.addEventListener('kjb-install-change', sync);
    window.addEventListener('focus', sync);
    return () => {
      cancelled = true;
      window.removeEventListener('kjb-install-change', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt && window.kjbDeferredPrompt) deferredPrompt = window.kjbDeferredPrompt;
    if (!deferredPrompt) return false;
    try {
      promptEverOffered = true;
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
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
  };
  const handleInstall = async () => {
    const result = await promptInstall();
    return result;
  };
  const handleDismiss = () => dismiss();

  return { isInstallable, isInstalled, isLoading, promptInstall, dismiss, wasDismissed, handleInstall, handleDismiss };
}