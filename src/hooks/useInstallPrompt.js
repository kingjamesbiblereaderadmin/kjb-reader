import { useState, useEffect } from 'react';

const DISMISSED_KEY = 'kjb-install-dismissed';
const INSTALLED_KEY = 'kjb-is-installed';

// Cross-tab PWA install detection:
// - Inside PWA: display-mode: standalone detects it immediately
// - Browser tab: getInstalledRelatedApps() detects installed PWA (Android Chrome/Samsung)
// - localStorage syncs state across tabs for instant UI updates

// Authoritative install detection.
// 1. display-mode: works inside PWA window (standalone mode)
// 2. getInstalledRelatedApps(): works in browser tabs (Android Chrome/Samsung only)
// 3. navigator.standalone: iOS Safari
// This combination gives the best possible cross-tab install detection.
const checkInstalledAsync = async () => {
  if (typeof window === 'undefined') return false;
  
  // Never report installed when running inside an iframe (preview/embed)
  try {
    if (window.self !== window.top) return false;
  } catch (e) {
    return false;
  }
  
  // 1. PRIMARY: display-mode media queries (works inside PWA)
  const dmStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const dmMinimal = window.matchMedia('(display-mode: minimal-ui)').matches;
  const dmOverlay = window.matchMedia('(display-mode: window-controls-overlay)').matches;
  

  
  if (dmStandalone || dmMinimal || dmOverlay) {

    localStorage.setItem(INSTALLED_KEY, 'true');
    return true;
  }
  
  // 2. getInstalledRelatedApps() - detects PWA from browser tab (Android Chrome/Samsung)
  // IMPORTANT: This API only works on Android Chrome 94+ and Samsung Internet
  // It does NOT work on iOS Safari or desktop browsers

  if (navigator.getInstalledRelatedApps) {
    try {
      const apps = await navigator.getInstalledRelatedApps();

      if (apps && apps.length > 0) {

        localStorage.setItem(INSTALLED_KEY, 'true');
        return true;
      } else {

      }
    } catch (err) {
  
    }
  } else {

  }
  
  // 3. iOS fallback: navigator.standalone
  if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
    try {
      const iOSStandalone = window.navigator.standalone === true;
      if (iOSStandalone) {

        localStorage.setItem(INSTALLED_KEY, 'true');
        return true;
      }
    } catch {}
  }
  
  // Not installed - clear flag
  localStorage.removeItem(INSTALLED_KEY);

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

// BroadcastChannel for cross-tab install status sync
let installChannel = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  installChannel = new BroadcastChannel('kjb-install-status');
}

// Poll for install status changes every 2 seconds (works even when BroadcastChannel fails)
let installPollInterval = null;

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
    
    const sync = (fromBroadcast = false) => {
      if (!deferredPrompt && window.kjbDeferredPrompt) {
        deferredPrompt = window.kjbDeferredPrompt;
      }
      const installable = !!deferredPrompt || isPwaInstallable();
      setIsInstallable(installable);
      checkInstalledAsync().then(installed => {
        if (!cancelled) {
          setIsInstalled(installed);
          // Broadcast to other tabs
          if (!fromBroadcast && installChannel) {
            installChannel.postMessage({ type: 'install-status', installed });
          }
        }
      }).catch(err => {
        console.error('[useInstallPrompt] sync error:', err);
      });
    };
    
    // Listen for broadcast messages from PWA window
    if (installChannel) {
      installChannel.onmessage = (event) => {
        if (event.data?.type === 'install-status') {
          setIsInstalled(event.data.installed);
          if (event.data.installed) {
            localStorage.setItem(INSTALLED_KEY, 'true');
          } else {
            localStorage.removeItem(INSTALLED_KEY);
          }
          window.dispatchEvent(new Event('storage'));
        }
      };
    }
    
    // Poll localStorage every 2 seconds for install status changes (fallback when BroadcastChannel fails)
    const startPolling = () => {
      if (installPollInterval) clearInterval(installPollInterval);
      installPollInterval = setInterval(() => {
        const stored = localStorage.getItem(INSTALLED_KEY);
        const timestamp = localStorage.getItem('kjb-install-timestamp');
        const shouldBeInstalled = stored === 'true';
        if (shouldBeInstalled) {
          setIsInstalled(true);
          window.dispatchEvent(new Event('kjb-install-change'));
        } else if (timestamp && Date.now() - parseInt(timestamp) < 5000) {
          setIsInstalled(true);
        }
      }, 2000);
    };
    
    // Listen for storage events (when PWA writes to localStorage)
    const handleStorageEvent = (e) => {
      if (e.key === 'kjb-is-installed' || e.key === 'kjb-install-timestamp') {
        if (e.newValue === 'true') {
          setIsInstalled(true);
        }
      }
    };
    
    // Listen for events that might indicate install state change
    window.addEventListener('kjb-install-change', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('visibilitychange', sync);
    sync();
    startPolling();
    return () => {
      cancelled = true;
      window.removeEventListener('kjb-install-change', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('storage', handleStorageEvent);
      if (installPollInterval) clearInterval(installPollInterval);
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