import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate, Outlet } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { ThemeProvider } from '@/lib/themeContext';
import { HeaderHideProvider } from '@/lib/HeaderHideContext';
import { SoftReloadProvider, useSoftReload } from '@/lib/SoftReloadContext';
import AppLayout from '@/components/layout/AppLayout';
import React, { lazy, Suspense, useEffect, useState } from 'react';

// Lazy-load pages. Each import() factory is kept as a reference so we can
// also trigger it manually in the background to preload all routes.
const loaders = {
  Home: () => import('@/pages/HomePage').catch((err) => { console.error('Failed to load HomePage:', err); throw err; }),
  BibleReader: () => import('@/pages/BibleReader').catch((err) => { console.error('Failed to load BibleReader:', err); throw err; }),
  Gospel: () => import('@/pages/GospelPage').catch((err) => { console.error('Failed to load GospelPage:', err); throw err; }),
  Resources: () => import('@/pages/ResourcesPage').catch((err) => { console.error('Failed to load ResourcesPage:', err); throw err; }),
  About: () => import('@/pages/AboutPage').catch((err) => { console.error('Failed to load AboutPage:', err); throw err; }),
  Contents: () => import('@/pages/ContentsPage.jsx').catch((err) => { console.error('Failed to load ContentsPage:', err); throw err; }),
  Settings: () => import('@/pages/SettingsPage.jsx').catch((err) => { console.error('Failed to load SettingsPage:', err); throw err; }),
  Search: () => import('@/pages/SearchPage.jsx').catch((err) => { console.error('Failed to load SearchPage:', err); throw err; }),
  Saved: () => import('@/pages/SavedVersesPage.jsx').catch((err) => { console.error('Failed to load SavedVersesPage:', err); throw err; }),
  RefreshCache: () => import('@/pages/RefreshCache.jsx').catch((err) => { console.error('Failed to load RefreshCache:', err); throw err; }),
};
const HomePage = lazy(loaders.Home);
const BibleReader = lazy(loaders.BibleReader);
const GospelPage = lazy(loaders.Gospel);
const ResourcesPage = lazy(loaders.Resources);
const AboutPage = lazy(loaders.About);
const ContentsPage = lazy(loaders.Contents);
const SettingsPage = lazy(loaders.Settings);
const SearchPage = lazy(loaders.Search);
const SavedVersesPage = lazy(loaders.Saved);
const RefreshCache = lazy(loaders.RefreshCache);

const getLoaderForPath = (pathname) => {
  if (pathname === '/') return loaders.Home;
  if (pathname === '/read') return loaders.BibleReader;
  if (pathname === '/gospel') return loaders.Gospel;
  if (pathname === '/resources') return loaders.Resources;
  if (pathname === '/about') return loaders.About;
  if (pathname === '/contents') return loaders.Contents;
  if (pathname === '/settings') return loaders.Settings;
  if (pathname === '/search') return loaders.Search;
  if (pathname === '/saved') return loaders.Saved;
  if (pathname === '/refresh-cache') return loaders.RefreshCache;
  return null;
};

// Preload all route chunks in the background after first paint so subsequent
// navigations are instant (no Suspense delay = no blank page).
let _preloaded = false;
function preloadAllRoutes() {
  if (_preloaded) return;
  _preloaded = true;
  const run = () => {
    // Skip preloading when offline — chunks not yet cached would 404 and
    // pollute the browser's failed-module map. Already-cached chunks still
    // load fine on demand via the SW.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    const imports = Object.values(loaders).map(fn => fn().catch(() => {}));

    // After all chunks load, ask the SW to cache the newly-injected <script>
    // tags so every route works fully offline next time.
    Promise.all(imports).then(() => {
      try {
        if (navigator.serviceWorker?.controller) {
          const urls = [];
          document.querySelectorAll('script[src]').forEach(s => {
            try { urls.push(new URL(s.src, location.href).href); } catch {}
          });
          document.querySelectorAll('link[rel="modulepreload"], link[rel="preload"]').forEach(l => {
            try { if (l.href) urls.push(new URL(l.href, location.href).href); } catch {}
          });
          if (urls.length) {
            navigator.serviceWorker.controller.postMessage({ type: 'PREWARM_ASSETS', urls });
          }
        }
      } catch {}
    });
  };
  if ('requestIdleCallback' in window) {
    requestIdleCallback(run, { timeout: 2000 });
  } else {
    setTimeout(run, 300);
  }
}

// Provide a beautiful splash screen for initial app loading
import { Loader2 } from 'lucide-react';
const PageLoader = ({ isFadingOut, forcedText }) => {
  // Capture the updateType once on mount so it doesn't change when checkUpdatesSilently removes it
  const [updateType] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('updated') === 'true') {
        try { window.history.replaceState({}, '', window.location.pathname); } catch(e) {}
        return 'forced_update';
      }
    }
    return typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('kjb_sw_updated') : null;
  });
  const [dynamicText, setDynamicText] = useState(null);

  const [isFirstVisit] = useState(() => {
    try {
      return !localStorage.getItem('kjb-prompt-dismissed');
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleProgress = (e) => {
      if (e.detail?.message) setDynamicText(e.detail.message);
    };
    window.addEventListener('kjb-splash-update', handleProgress);
    return () => window.removeEventListener('kjb-splash-update', handleProgress);
  }, []);
  
  let text = (isFirstVisit || updateType === 'bible_first_load') ? "Welcome to KJB Reader..." : "Welcome back to KJB Reader...";
             
  if (dynamicText) {
    text = dynamicText;
  } else if (forcedText) {
    text = forcedText;
  } else if (updateType) {
    if (updateType === 'bible_first_load' || isFirstVisit) text = "Welcome to KJB Reader...";
    else if (updateType === 'forced_update' || updateType === 'app' || updateType === 'both' || updateType === 'bible') text = "Welcome back to KJB Reader...";
    else if (updateType === 'up_to_date') text = "App is up to date...";
    else text = "Welcome back to KJB Reader...";
  }

  // Right before fading out, change text to "Ready to read..."
  useEffect(() => {
    if (isFadingOut && !dynamicText && !forcedText) {
      setDynamicText("Ready to read...");
    }
  }, [isFadingOut, dynamicText, forcedText]);

  return (
    <div className={`fixed inset-0 z-[999999] bg-background flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="flex flex-col items-center justify-center -mt-16 w-full max-w-sm px-6">
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
          <img 
            src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png" 
            alt="KJB Reader" 
            className="relative w-32 h-32 object-contain drop-shadow-xl"
          />
        </div>
        
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="flex flex-col items-center gap-3 text-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary/70" style={{ animationDuration: '2s' }} />
            <span className="font-sans text-xs text-foreground/70 font-medium tracking-[0.2em] uppercase">
              {text}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const RouteLoader = () => (
  <div className="flex justify-center py-24">
    <Loader2 className="w-6 h-6 animate-spin text-primary/70" style={{ animationDuration: '2s' }} />
  </div>
);

// Wraps each route in a fast CSS fade so transitions feel smooth, not blank.
// Keyed by pathname so the animation replays on every navigation —
// but skipped on the very first render to avoid a flash on refresh.
let _firstRenderDone = false;
const FadeIn = ({ children }) => {
  const { pathname } = useLocation();
  
  useEffect(() => {
    _firstRenderDone = true;
  }, [pathname]);

  return <div key={pathname} className={_firstRenderDone ? 'kjb-fade-in' : ''}>{children}</div>;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const [minSplashDone, setMinSplashDone] = useState(false);
  const [updateCheckDone, setUpdateCheckDone] = useState(false);
  const [routeLoaded, setRouteLoaded] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const originalTitle = document.title;
    const beforePrint = () => { document.title = '\u200B'; }; // Zero-width space removes title from print header
    const afterPrint = () => { document.title = originalTitle; };
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, []);

  useEffect(() => {
    if (document.fonts) {
      document.fonts.ready.then(() => {
        // Add a small buffer after fonts report 'ready' to ensure browser painting catches up
        // and avoids the FOUT (Flash of Unstyled Text)
        setTimeout(() => setFontsLoaded(true), 300);
      });
    } else {
      setFontsLoaded(true);
    }
  }, []);

  useEffect(() => {
    const loader = getLoaderForPath(location.pathname);
    if (loader) {
      loader().then(() => setRouteLoaded(true)).catch(() => setRouteLoaded(true));
    } else {
      setRouteLoaded(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    const isPostUpdate = sessionStorage.getItem('kjb_sw_updated');
    const isForcedUpdate = window.location.search.includes('updated=true');
    let isFresh = true;
    try {
      isFresh = !sessionStorage.getItem('kjb_session_active_timer');
      sessionStorage.setItem('kjb_session_active_timer', 'true');
    } catch {}
    
    // Extend minimum splash times so text is readable
    let delay = 2500; // Fresh load: 2.5s
    if (isPostUpdate || isForcedUpdate) {
      delay = 2500; // Update applied: 2.5s (gives time to read "Updates applied successfully")
    } else if (!isFresh) {
      delay = 1200; // Returning session: 1.2s
    }

    const timer = setTimeout(() => setMinSplashDone(true), delay); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    let updateCheckInProgress = false;

    const checkUpdatesSilently = async () => {
      if (updateCheckInProgress) return;
      updateCheckInProgress = true;
      let willReload = false;
      try {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          updateCheckInProgress = false;
          return; // Skip if offline
        }

        const justUpdated = sessionStorage.getItem('kjb_sw_updated');
        if (justUpdated) {
          sessionStorage.removeItem('kjb_sw_updated');
        }

        let hasAppUpdates = false;
        let hasBibleUpdates = false;

        // 1. Check App/Code Updates (Skip if we just performed an update reload, to avoid loops)
        if (!justUpdated || justUpdated === 'bible') {
          if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.getRegistration();
            // ONLY trigger automatic update reload if there is ALREADY an active SW.
            // Otherwise, it's a first-time install, and we don't want to reload the user.
            if (reg && reg.active) {
              await reg.update().catch(() => {});
              const isReadyToActivate = reg.waiting || (reg.installing && (reg.installing.state === 'installed' || reg.installing.state === 'activating' || reg.installing.state === 'activated'));
              
              if (isReadyToActivate) {
                setIsApplyingUpdates(true);
                setApplyMessage('Found updates...');
                window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: 'Found updates...' } }));
                await new Promise(r => setTimeout(r, 1000));
                setApplyMessage('Installing updates...');
                window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: 'Installing updates...' } }));
                await new Promise(r => setTimeout(r, 1000));
                
                setApplyMessage('Applying updates...');
                window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: 'Applying updates...' } }));
                await new Promise(r => setTimeout(r, 1000));
                
                if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                else if (reg.installing) reg.installing.postMessage({ type: 'SKIP_WAITING' });
                return; // Let main.jsx handle reload
              } else if (reg.installing) {
                setIsApplyingUpdates(true);
                setApplyMessage('Found updates...');
                window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: 'Found updates...' } }));
                await new Promise(r => setTimeout(r, 1000));
                setApplyMessage('Installing updates...');
                window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: 'Installing updates...' } }));
                
                const workerToSkip = reg.installing;
                const installed = await new Promise(resolve => {
                  let resolved = false;
                  const handler = () => {
                    if (workerToSkip.state === 'installed' || workerToSkip.state === 'activating' || workerToSkip.state === 'activated') {
                      if (!resolved) {
                        resolved = true;
                        resolve(true);
                      }
                    } else if (workerToSkip.state === 'redundant') {
                      if (!resolved) {
                        resolved = true;
                        resolve(false);
                      }
                    }
                  };
                  workerToSkip.addEventListener('statechange', handler);
                  setTimeout(() => {
                    if (!resolved) {
                      resolved = true;
                      workerToSkip.removeEventListener('statechange', handler);
                      resolve(false);
                    }
                  }, 6000);
                });
                
                if (installed) {
                  setApplyMessage('Applying updates...');
                  window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: 'Applying updates...' } }));
                  await new Promise(r => setTimeout(r, 1000));
                  workerToSkip.postMessage({ type: 'SKIP_WAITING' });
                  return; // Let main.jsx handle reload
                }
              }
            }
          }
        }

        // 2. Check Bible Data Updates and initial cache load
        const { checkForUpdates, downloadBibleForOffline, isBibleCached } = await import('@/lib/bibleCache');
        const bibleNeedsUpdate = await checkForUpdates().catch(() => false);
        const bibleIsCached = await isBibleCached().catch(() => true);
        
        if (bibleNeedsUpdate || !bibleIsCached) {
          localStorage.removeItem('bible_cache_version');
          localStorage.removeItem('bible_last_refresh');
          try {
            if (!hasAppUpdates && bibleNeedsUpdate) {
              setIsApplyingUpdates(true);
              setApplyMessage('Found updates...');
              window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: 'Found updates...' } }));
              await new Promise(r => setTimeout(r, 1000));
            }
            const dlMessage = !bibleIsCached ? 'Downloading offline Bible...' : 'Installing updates...';
            setIsApplyingUpdates(true);
            setApplyMessage(dlMessage);
            window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: dlMessage } }));
            await downloadBibleForOffline();
            hasBibleUpdates = true;
          } catch(e) {
            console.error('Failed to download bible updates', e);
          }
        }

        if (hasAppUpdates || hasBibleUpdates) {
          let updateType = 'app';
          if (hasAppUpdates && hasBibleUpdates) { updateType = 'both'; }
          else if (hasBibleUpdates && !bibleIsCached) { updateType = 'bible_first_load'; }
          else if (hasBibleUpdates) { updateType = 'bible'; }
          else if (hasAppUpdates) { updateType = 'app'; }
          
          // If we activated a new service worker, we MUST reload the page to load the new JS bundle.
          // Otherwise, manual update checks will think there's no update because the worker is already active,
          // but the old JS remains in memory.
          // We only skip reload for minor bible updates if not on root, but app code updates MUST reload.
          if (window.location.pathname !== '/' && updateType === 'bible') {
            return;
          }

          sessionStorage.setItem('kjb_sw_updated', updateType);
          const applyMsg = !bibleIsCached ? 'Welcome to KJB Reader...' : 'Applying updates...';
          setApplyMessage(applyMsg);
          window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: applyMsg } }));
          setIsApplyingUpdates(true);
          willReload = true;
          setTimeout(() => {
            window.location.reload();
          }, 1200);
          return; 
        }

      } catch (err) {
        console.error('Silent update check failed:', err);
      } finally {
        if (isMounted && !willReload) {
          setUpdateCheckDone(true);
        }
        updateCheckInProgress = false;
      }
    };

    checkUpdatesSilently();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkUpdatesSilently();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkUpdatesSilently);

    return () => { 
      isMounted = false; 
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkUpdatesSilently);
    };
  }, []);

  // Check for updates on route change (e.g. navigating around)
  useEffect(() => {
    if (!updateCheckDone) return;
    if (location.pathname !== '/') return;
    
    let isMounted = true;
    const checkNavUpdates = async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
        
        let hasAppUpdates = false;
        let workerToSkip = null;
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.active) {
            await reg.update().catch(() => {});
            if (reg.waiting) {
              workerToSkip = reg.waiting;
            } else if (reg.installing) {
              if (reg.installing.state === 'installed' || reg.installing.state === 'activating' || reg.installing.state === 'activated') {
                workerToSkip = reg.installing;
              }
            }
          }
        }
        
        if (workerToSkip && isMounted) {
          setIsApplyingUpdates(true);
          setApplyMessage('Found updates...');
          window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: 'Found updates...' } }));
          await new Promise(r => setTimeout(r, 1000));
          setApplyMessage('Installing updates...');
          window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: 'Installing updates...' } }));
          await new Promise(r => setTimeout(r, 1000));
          
          sessionStorage.setItem('kjb_sw_updated', 'app');
          setApplyMessage('Applying updates...');
          window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: 'Applying updates...' } }));
          await new Promise(r => setTimeout(r, 1000));
          
          workerToSkip.postMessage({ type: 'SKIP_WAITING' });
        }
      } catch (err) {
        // ignore
      }
    };
    
    // Small delay so it doesn't block the actual page transition
    const timer = setTimeout(checkNavUpdates, 1000);
    return () => { 
      isMounted = false;
      clearTimeout(timer);
    };
  }, [location.pathname, updateCheckDone]);

  // Preload all route chunks in the background once auth resolves
  useEffect(() => { 
    preloadAllRoutes();
  }, []);

  const [isApplyingUpdates, setIsApplyingUpdates] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');

  const isInitializing = isLoadingPublicSettings || isLoadingAuth;
  const showSplash = isInitializing || !minSplashDone || !updateCheckDone || !routeLoaded || !fontsLoaded || isApplyingUpdates;

  const [renderSplash, setRenderSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  useEffect(() => {
    if (!showSplash) {
      setFadeSplash(true);
      const timer = setTimeout(() => {
        setRenderSplash(false);
        window.kjbSplashDone = true;
        window.dispatchEvent(new Event('kjb-splash-done'));
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setRenderSplash(true);
      setFadeSplash(false);
      window.kjbSplashDone = false;
    }
  }, [showSplash]);

  if (authError && !isInitializing) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <>
      {renderSplash && <PageLoader isFadingOut={fadeSplash} forcedText={applyMessage} />}
      {!isInitializing && !authError && (
        <Routes location={location}>
          <Route element={<AppLayout />}>
        <Route path="/" element={<Suspense fallback={<RouteLoader />}><FadeIn><HomePage /></FadeIn></Suspense>} />
        <Route path="/read" element={<Suspense fallback={<RouteLoader />}><FadeIn><BibleReader /></FadeIn></Suspense>} />
        <Route path="/gospel" element={<Suspense fallback={<RouteLoader />}><FadeIn><GospelPage /></FadeIn></Suspense>} />
        <Route path="/resources" element={<Suspense fallback={<RouteLoader />}><FadeIn><ResourcesPage /></FadeIn></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<RouteLoader />}><FadeIn><AboutPage /></FadeIn></Suspense>} />
        <Route path="/contents" element={<Suspense fallback={<RouteLoader />}><FadeIn><ContentsPage /></FadeIn></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<RouteLoader />}><FadeIn><SettingsPage /></FadeIn></Suspense>} />
        <Route path="/search" element={<Suspense fallback={<RouteLoader />}><FadeIn><SearchPage /></FadeIn></Suspense>} />
        <Route path="/saved" element={<Suspense fallback={<RouteLoader />}><FadeIn><SavedVersesPage /></FadeIn></Suspense>} />
        <Route path="/refresh-cache" element={<Suspense fallback={<RouteLoader />}><FadeIn><RefreshCache /></FadeIn></Suspense>} />
          </Route>
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      )}
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <HeaderHideProvider>
          <SoftReloadProvider>
            <QueryClientProvider client={queryClientInstance}>
              <Router>
                <AuthenticatedApp />
              </Router>
              <Toaster />
              <SonnerToaster position="top-center" offset={70} expand={false} visibleToasts={1} />
            </QueryClientProvider>
          </SoftReloadProvider>
        </HeaderHideProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App