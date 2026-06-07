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
const PageLoader = ({ isFadingOut }) => {
  // Capture the updateType once on mount so it doesn't change when checkUpdatesSilently removes it
  const [updateType] = useState(() => 
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('kjb_sw_updated') : null
  );
  const [updatePhase, setUpdatePhase] = useState(updateType ? 'applying' : 'done');
  const [dynamicText, setDynamicText] = useState(null);

  const [isFirstVisit] = useState(() => {
    try {
      if (!localStorage.getItem('kjb_has_visited')) {
        localStorage.setItem('kjb_has_visited', 'true');
        return true;
      }
      return false;
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

  useEffect(() => {
    if (updateType) {
      const t1 = setTimeout(() => setUpdatePhase('success'), 2500);
      const t2 = setTimeout(() => setUpdatePhase('done'), 4000);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [updateType]);

  if (isFadingOut) return null;
  
  let text = (isFirstVisit || updateType === 'bible_first_load') ? "Welcome to KJB Reader..." : "Welcome back to KJB Reader...";
  if (dynamicText) {
    text = dynamicText;
  } else if (updateType && updatePhase !== 'done') {
    if (updatePhase === 'applying') {
      text = updateType === 'bible_first_load' ? "Finalizing setup..." : "Applying updates...";
    } else {
      text = updateType === 'bible_first_load' ? "Ready to read..." : "Updates applied successfully...";
    }
  }

  return (
    <div className={`fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center transition-opacity duration-500 ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
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
let _firstRender = true;
const FadeIn = ({ children }) => {
  const { pathname } = useLocation();
  const [isFirst] = React.useState(() => {
    if (_firstRender) {
      _firstRender = false;
      return true;
    }
    return false;
  });
  return <div key={pathname} className={isFirst ? '' : 'kjb-fade-in'}>{children}</div>;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();
  const [minSplashDone, setMinSplashDone] = useState(false);
  const [updateCheckDone, setUpdateCheckDone] = useState(false);
  const [routeLoaded, setRouteLoaded] = useState(false);

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
    // If we just reloaded from an update, stagger the splash screen longer
    // to give time for the "Applying updates..." and "Loading KJB Reader..." phases
    const timer = setTimeout(() => setMinSplashDone(true), isPostUpdate ? 5500 : 2000); 
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
              if (reg.waiting) {
                hasAppUpdates = true;
                reg.waiting.postMessage({ type: 'SKIP_WAITING' });
              } else if (reg.installing) {
                if (reg.installing.state === 'installed') {
                  hasAppUpdates = true;
                  reg.installing.postMessage({ type: 'SKIP_WAITING' });
                } else {
                  window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: 'Found updates...' } }));
                  await new Promise(r => setTimeout(r, 800));
                  window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: 'Downloading updates...' } }));
                  hasAppUpdates = await new Promise(resolve => {
                    const worker = reg.installing;
                    worker.addEventListener('statechange', () => {
                      if (worker.state === 'installed') {
                        worker.postMessage({ type: 'SKIP_WAITING' });
                        resolve(true);
                      } else if (worker.state === 'redundant') {
                        resolve(false);
                      }
                    });
                    setTimeout(() => resolve(false), 3000);
                  });
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
              window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: 'Found updates...' } }));
              await new Promise(r => setTimeout(r, 800));
            }
            const dlMessage = !bibleIsCached ? 'Downloading offline Bible...' : 'Downloading updates...';
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
          
          sessionStorage.setItem('kjb_sw_updated', updateType);
          window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: !bibleIsCached ? 'Finalizing setup...' : 'Finalizing updates...' } }));
          willReload = true;
          setTimeout(() => {
            window.location.reload();
          }, 2500);
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
    
    let isMounted = true;
    const checkNavUpdates = async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
        
        let hasAppUpdates = false;
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg && reg.active) {
            await reg.update().catch(() => {});
            if (reg.waiting) {
              hasAppUpdates = true;
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } else if (reg.installing) {
              if (reg.installing.state === 'installed') {
                hasAppUpdates = true;
                reg.installing.postMessage({ type: 'SKIP_WAITING' });
              }
            }
          }
        }
        
        if (hasAppUpdates && isMounted) {
          sessionStorage.setItem('kjb_sw_updated', 'app');
          window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'Applying update...', status: 'loading' } }));
          setTimeout(() => window.location.reload(), 2000);
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

  const isInitializing = isLoadingPublicSettings || isLoadingAuth;
  const showSplash = isInitializing || !minSplashDone || !updateCheckDone || !routeLoaded;

  const [renderSplash, setRenderSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  useEffect(() => {
    if (!showSplash) {
      setFadeSplash(true);
      const timer = setTimeout(() => setRenderSplash(false), 500);
      return () => clearTimeout(timer);
    } else {
      setRenderSplash(true);
      setFadeSplash(false);
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
      {renderSplash && <PageLoader isFadingOut={fadeSplash} />}
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