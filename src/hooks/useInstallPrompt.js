import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';
const INSTALLED_KEY = 'kjb-is-installed';

// Install detection using display-mode media queries (synchronous, no flicker).
// Once installed, state persists via localStorage until user manually resets.
const checkInstalled = () => {
  if (typeof window === 'undefined') return false;
  
  // Never report installed when running inside an iframe (preview/embed)
  try {
    if (window.self !== window.top) return false;
  } catch (e) {
    return false;
  }
  
  // 1. PRIMARY: display-mode media queries (works inside PWA, synchronous, no flicker)
  const dmStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const dmMinimal = window.matchMedia('(display-mode: minimal-ui)').matches;
  const dmOverlay = window.matchMedia('(display-mode: window-controls-overlay)').matches;
  
  if (dmStandalone || dmMinimal || dmOverlay) {
    localStorage.setItem(INSTALLED_KEY, 'true');
    return true;
  }
  
  // 2. Check localStorage persistence (survives page reloads, no async flicker)
  try {
    if (localStorage.getItem(INSTALLED_KEY) === 'true') {
      return true;
    }
  } catch {}
  
  // 3. iOS Safari standalone (older iOS versions)
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    try {
      if (window.navigator.standalone === true) {
        localStorage.setItem(INSTALLED_KEY, 'true');
        return true;
      }
    } catch {}
  }
  
  // Not installed - do NOT clear localStorage (prevents flicker on unreliable APIs)
  return false;
};

let deferredPrompt = (typeof window !== 'undefined' && window.kjbDeferredPrompt) || null;

const isSamsungInternet = () => {
  if (typeof window === 'undefined') return false;
  return /SamsungBrowser/i.test(navigator.userAgent);
};

const isPwaInstallable = () => {
  if (typeof window === 'undefined') return false;
  const hasManifest = !!document.querySelector('link[rel="manifest"]');
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
  const notStandalone = !window.matchMedia('(display-mode: standalone)').matches && 
                        !window.matchMedia('(display-mode: minimal-ui)').matches &&
                        !window.matchMedia('(display-mode: window-controls-overlay)').matches &&
                        window.navigator.standalone !== true;
  return hasManifest && isSecure && notStandalone;
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.kjbDeferredPrompt = e;
    window.dispatchEvent(new Event('kjb-install-change'));
  });
}

export function useInstallPrompt() {
  const [isInstallable, setIsInstallable] = useState(!!deferredPrompt || isPwaInstallable());
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSamsung, setIsSamsung] = useState(false);

  useEffect(() => {
    const installed = checkInstalled();
    setIsInstalled(installed);
    setIsLoading(false);
    setIsSamsung(isSamsungInternet());

    const handleStorage = () => {
      setIsInstalled(checkInstalled());
    };

    // beforeinstallprompt can fire seconds after load (Chrome engagement heuristic).
    // index.html captures it into window.kjbDeferredPrompt and dispatches these events,
    // so re-evaluate installability when they arrive instead of staying stale.
    const handleInstallChange = () => {
      deferredPrompt = (typeof window !== 'undefined' && window.kjbDeferredPrompt) || deferredPrompt;
      setIsInstallable(!!deferredPrompt || isPwaInstallable());
      setIsInstalled(checkInstalled());
    };

    // When the user accepts the install, flip to installed immediately in this tab.
    const handleAppInstalled = () => {
      deferredPrompt = null;
      try { window.kjbDeferredPrompt = null; } catch {}
      try { localStorage.setItem(INSTALLED_KEY, 'true'); } catch {}
      setIsInstallable(false);
      setIsInstalled(true);
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('kjb-install-change', handleInstallChange);
    window.addEventListener('pwa-installable', handleInstallChange);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('kjb-install-change', handleInstallChange);
      window.removeEventListener('pwa-installable', handleInstallChange);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    // Always check window.kjbDeferredPrompt first (set by index.html event listener)
    if (!deferredPrompt && window.kjbDeferredPrompt) {
      deferredPrompt = window.kjbDeferredPrompt;
    }
    
    // If we have a deferred prompt, use it (standard Chrome/Edge/Samsung flow)
    if (deferredPrompt) {
      try {
        // Prompt accepted
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
    }
    
    // No deferredPrompt available - check if we're on a browser that should support native installs
    // If so, the prompt may have been lost (e.g., after page reload) - return false to show manual guide
    // Edge Desktop: if PWA is installable but no prompt, user needs to reload or use browser menu
    if (isPwaInstallable()) {
      return false;
    }
    
    return false;
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

  return { isInstallable, isInstalled, isLoading, isSamsung, promptInstall, dismiss, wasDismissed, handleInstall, handleDismiss };
}