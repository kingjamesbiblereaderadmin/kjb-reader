import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';

// Authoritative install detection.
// iOS: navigator.standalone (reliable).
// Android: getInstalledRelatedApps() ONLY — ignores false display-mode signals.
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
      const installed = !!(apps && apps.length > 0);
      console.log('[InstallCheck] getInstalledRelatedApps:', apps, '→ installed:', installed);
      return installed;
    } catch (err) {
      console.error('[InstallCheck] getInstalledRelatedApps failed:', err);
      return false;
    }
  }
  
  // No API available: assume not installed
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
      if (!cancelled) {
        setIsInstalled(installed);
        setIsLoading(false);
      }
    };
    check();
    
    const sync = () => {
      if (!deferredPrompt && window.kjbDeferredPrompt) deferredPrompt = window.kjbDeferredPrompt;
      setIsInstallable(!!deferredPrompt);
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