import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';
const INSTALLED_KEY = 'kjb-is-installed';

// Authoritative install detection.
// Primary: display-mode media queries (most reliable cross-browser).
// Secondary: navigator.standalone (iOS).
// Tertiary: getInstalledRelatedApps() (Android Chrome 94+ only).
// Quaternary: localStorage flag (persists across browser/PWA windows).
const checkInstalledAsync = async () => {
  if (typeof window === 'undefined') return false;
  
  // Never report installed when running inside an iframe (preview/embed)
  try {
    if (window.self !== window.top) return false;
  } catch (e) {
    return false;
  }
  
  let isInstalled = false;
  
  // PRIMARY: display-mode media queries - most reliable signal
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('[InstallCheck] display-mode: standalone → installed');
    isInstalled = true;
  } else if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    console.log('[InstallCheck] display-mode: minimal-ui → installed');
    isInstalled = true;
  } else if (window.matchMedia('(display-mode: window-controls-overlay)').matches) {
    console.log('[InstallCheck] display-mode: window-controls-overlay → installed');
    isInstalled = true;
  }
  
  // iOS: use navigator.standalone
  if (!isInstalled && /iphone|ipad|ipod/i.test(navigator.userAgent)) {
    try {
      const isStandalone = window.navigator.standalone === true;
      console.log('[InstallCheck] iOS navigator.standalone:', isStandalone);
      if (isStandalone) isInstalled = true;
    } catch { return false; }
  }
  
  // Android/desktop: try getInstalledRelatedApps() (limited browser support)
  if (!isInstalled && navigator.getInstalledRelatedApps) {
    try {
      const apps = await navigator.getInstalledRelatedApps();
      const installed = !!(apps && apps.length > 0);
      console.log('[InstallCheck] getInstalledRelatedApps:', apps, '→ installed:', installed);
      if (installed) isInstalled = true;
    } catch (err) {
      console.error('[InstallCheck] getInstalledRelatedApps failed:', err);
    }
  }
  
  // Persist install state to localStorage for cross-tab sync
  // This MUST happen FIRST so browser tabs can detect the install immediately
  if (isInstalled) {
    try {
      localStorage.setItem(INSTALLED_KEY, 'true');
      console.log('[InstallCheck] ✓ Detected standalone, persisted to localStorage');
    } catch {}
  }
  
  // Fallback: check localStorage flag (set by PWA window when installed)
  // This allows normal browser tabs to show "Installed" when PWA is installed
  try {
    const stored = localStorage.getItem(INSTALLED_KEY);
    if (stored === 'true') {
      console.log('[InstallCheck] ✓ localStorage flag → installed (PWA installed)');
      return true;
    }
  } catch {}
  
  // NOT in standalone mode and no flag - clear any stale flag (user may have uninstalled)
  if (!isInstalled) {
    try {
      localStorage.removeItem(INSTALLED_KEY);
      console.log('[InstallCheck] ✓ Cleared localStorage flag (not in standalone mode)');
    } catch {}
  }
  
  console.log('[InstallCheck] ✗ Not installed (no standalone mode, no localStorage flag)');
  return false;
};

let deferredPrompt = (typeof window !== 'undefined' && window.kjbDeferredPrompt) || null;
let promptEverOffered = (typeof window !== 'undefined' && window.kjbPromptedThisSession === true);

// Samsung Internet DOES support beforeinstallprompt (native prompt available)
const isSamsungInternet = () => {
  if (typeof window === 'undefined') return false;
  return /SamsungBrowser/i.test(navigator.userAgent);
};

// Mobile browsers that support native PWA install prompts
const supportsNativeInstall = () => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  const isMobile = /iphone|ipad|ipod|android/i.test(ua);
  const isSamsung = /SamsungBrowser/i.test(ua);
  const isChrome = /chrome|crios/i.test(ua);
  const isEdge = /edg/i.test(ua);
  // iOS requires manual "Add to Home Screen", Android browsers support native prompts
  return isMobile && !/iphone|ipad|ipod/i.test(ua) && (isChrome || isEdge || isSamsung);
};

// Edge/Chrome desktop: check if PWA meets install criteria even before beforeinstallprompt fires
const isPwaInstallable = () => {
  if (typeof window === 'undefined') return false;
  // Has manifest with proper icons + start_url
  const hasManifest = !!document.querySelector('link[rel="manifest"]');
  // Running over HTTPS or localhost
  const isSecure = location.protocol === 'https:' || location.hostname === 'localhost';
  // Not already in standalone mode
  const notStandalone = !window.matchMedia('(display-mode: standalone)').matches && 
                        !window.matchMedia('(display-mode: minimal-ui)').matches &&
                        !window.matchMedia('(display-mode: window-controls-overlay)').matches &&
                        window.navigator.standalone !== true;
  return hasManifest && isSecure && notStandalone;
};

if (typeof window !== 'undefined') {
  // Capture beforeinstallprompt immediately on load (fires on Android Chrome/Edge/Samsung)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    window.kjbDeferredPrompt = e;
    promptEverOffered = true;
    console.log('[InstallPrompt] beforeinstallprompt captured - native prompt ready');
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
  const [isInstallable, setIsInstallable] = useState(!!deferredPrompt || isPwaInstallable());
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSamsung, setIsSamsung] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      const installed = await checkInstalledAsync();
      if (!cancelled) {
        setIsInstalled(installed);
        setIsLoading(false);
        setIsSamsung(isSamsungInternet());
      }
    };
    check();
    
    const sync = () => {
      // Always check window.kjbDeferredPrompt first (set by index.html event listener)
      if (!deferredPrompt && window.kjbDeferredPrompt) {
        deferredPrompt = window.kjbDeferredPrompt;
        console.log('[useInstallPrompt] ✓ Synced deferredPrompt from window');
      }
      // Use deferredPrompt OR PWA criteria check (for Edge desktop on first load)
      const installable = !!deferredPrompt || isPwaInstallable();
      console.log('[useInstallPrompt] isInstallable:', installable, '| deferredPrompt:', !!deferredPrompt, '| window.kjbDeferredPrompt:', !!window.kjbDeferredPrompt);
      setIsInstallable(installable);
      // Re-check installed state on focus (user may have just installed)
      checkInstalledAsync().then(installed => {
        if (!cancelled) setIsInstalled(installed);
      });
    };
    
    window.addEventListener('kjb-install-change', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('pwa-installed', sync);
    window.addEventListener('storage', sync);
    // Initial sync on mount
    sync();
    return () => {
      cancelled = true;
      window.removeEventListener('kjb-install-change', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('pwa-installed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const promptInstall = async () => {
    // Always check window.kjbDeferredPrompt first (set by index.html event listener)
    if (!deferredPrompt && window.kjbDeferredPrompt) {
      deferredPrompt = window.kjbDeferredPrompt;
      console.log('[InstallPrompt] Synced deferredPrompt from window.kjbDeferredPrompt');
    }
    
    // If we have a deferred prompt, use it (standard Chrome/Edge/Samsung flow)
    if (deferredPrompt) {
      try {
        promptEverOffered = true;
        console.log('[InstallPrompt] Firing native prompt...');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log('[InstallPrompt] User choice:', outcome);
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
      console.log('[InstallPrompt] PWA installable but no deferred prompt - user may need to reload or use browser menu');
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