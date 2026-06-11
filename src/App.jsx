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
  ManifestIcons: () => import('@/pages/ManifestIcons.jsx').catch((err) => { console.error('Failed to load ManifestIcons:', err); throw err; }),
  Privacy: () => import('@/pages/PrivacyPolicyPage.jsx').catch((err) => { console.error('Failed to load PrivacyPolicyPage:', err); throw err; }),
  LegacyReader: () => import('@/pages/LegacyReader.jsx').catch((err) => { console.error('Failed to load LegacyReader:', err); throw err; }),
  Debug: () => import('@/pages/DebugPage').catch((err) => { console.error('Failed to load DebugPage:', err); throw err; }),
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
const ManifestIcons = lazy(loaders.ManifestIcons);
const PrivacyPolicyPage = lazy(loaders.Privacy);
const LegacyReader = lazy(loaders.LegacyReader);
const DebugPage = lazy(loaders.Debug);

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
  const [isFirstVisit] = useState(() => {
    try {
      const visited = localStorage.getItem('kjb-has-visited-app');
      if (!visited) {
        localStorage.setItem('kjb-has-visited-app', 'true');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  const isPostUpdate = sessionStorage.getItem('kjb_sw_updated');
  const isForcedUpdate = window.location.search.includes('updated=true');
  const isUpdate = !!(isPostUpdate || isForcedUpdate);
  if (isPostUpdate) { try { sessionStorage.removeItem('kjb_sw_updated'); } catch {} }

  const welcomeText = isFirstVisit ? "Welcome to KJB Reader!" : "Welcome back!";

  const [text, setText] = useState(isUpdate ? "Applying updates..." : "Loading...");

  useEffect(() => {
    const handler = (e) => { if (e.detail?.message) setText(e.detail.message); };
    // Use a ref-stable callback so the closure captures the correct welcomeText
    const doneHandler = () => setText(isFirstVisit ? "Welcome to KJB Reader!" : "Welcome back!");
    window.addEventListener('kjb-progress', handler);
    window.addEventListener('kjb-splash-done-soon', doneHandler);
    return () => {
      window.removeEventListener('kjb-progress', handler);
      window.removeEventListener('kjb-splash-done-soon', doneHandler);
    };
  }, [isFirstVisit]);

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

// Wraps each route in a native-like horizontal slide so transitions feel like
// a mobile app: forward navigation slides in from the right, back navigation
// slides in from the left. Direction is detected from the browser history
// index (popstate / back = negative). Keyed by pathname so the animation
// replays on every navigation — but skipped on the very first render to
// avoid a flash on refresh.
let _firstRenderDone = false;
let _lastHistoryIdx = typeof window !== 'undefined' ? (window.history.state?.idx ?? 0) : 0;
const FadeIn = ({ children }) => {
  const { pathname } = useLocation();
  const [direction, setDirection] = useState('forward');

  useEffect(() => {
    const idx = window.history.state?.idx ?? 0;
    setDirection(idx < _lastHistoryIdx ? 'back' : 'forward');
    _lastHistoryIdx = idx;
    _firstRenderDone = true;
  }, [pathname]);

  const animClass = !_firstRenderDone
    ? ''
    : direction === 'back'
      ? 'kjb-slide-back'
      : 'kjb-slide-forward';

  return <div key={pathname} className={animClass}>{children}</div>;
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
    let timeout;
    if (document.fonts) {
      document.fonts.ready.then(() => {
        // Add a small buffer after fonts report 'ready' to ensure browser painting catches up
        // and avoids the FOUT (Flash of Unstyled Text)
        timeout = setTimeout(() => setFontsLoaded(true), 300);
      });
      // Fallback in case fonts.ready hangs indefinitely
      setTimeout(() => setFontsLoaded(true), 3000);
    } else {
      setFontsLoaded(true);
    }
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    // Always release routeLoaded quickly - chunks load in background via Suspense
    const timer = setTimeout(() => setRouteLoaded(true), 500);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  useEffect(() => {
    const isPostUpdate = sessionStorage.getItem('kjb_sw_updated');
    const isForcedUpdate = window.location.search.includes('updated=true');
    let isFresh = true;
    try {
      isFresh = !sessionStorage.getItem('kjb_session_active_timer');
      sessionStorage.setItem('kjb_session_active_timer', 'true');
    } catch {}
    
    // Extend minimum splash times just enough to not flash abruptly
    let delay = 1000; // Fresh load
    if (isPostUpdate || isForcedUpdate) {
      delay = 1500; // Update applied
    } else if (!isFresh) {
      delay = 500; // Returning session
    }

    const timer = setTimeout(() => setMinSplashDone(true), delay); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const emit = (msg) => window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: msg } }));

    const check = async () => {
      if (!('serviceWorker' in navigator)) { if (!cancelled) setUpdateCheckDone(true); return; }
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) { if (!cancelled) setUpdateCheckDone(true); return; }

        emit('Checking for updates...');
        await reg.update().catch(() => {});

        const waitingWorker = reg.waiting;
        const installingWorker = reg.installing;

        if ((waitingWorker || installingWorker) && navigator.serviceWorker.controller) {
          // There's a new SW ready or installing — drive the progress messages
          if (installingWorker && !waitingWorker) {
            emit('Installing updates...');
            // Wait for it to reach 'installed' state
            await new Promise((resolve) => {
              const worker = installingWorker;
              const handler = () => {
                if (worker.state === 'installed' || worker.state === 'activating' || worker.state === 'activated' || worker.state === 'redundant') {
                  worker.removeEventListener('statechange', handler);
                  resolve();
                }
              };
              worker.addEventListener('statechange', handler);
              setTimeout(resolve, 5000); // safety timeout
            });
          }

          emit('Applying updates...');
          const target = reg.waiting || reg.installing;
          if (target) target.postMessage({ type: 'SKIP_WAITING' });
          // controllerchange in main.jsx will reload — hold splash until then
          // (up to 3s safety fallback)
          setTimeout(() => { if (!cancelled) setUpdateCheckDone(true); }, 3000);
          return;
        }
      } catch {}
      if (!cancelled) setUpdateCheckDone(true);
    };
    check();
    return () => { cancelled = true; };
  }, []);

  // Preload route chunks in background
  useEffect(() => { 
    preloadAllRoutes();
  }, []);

  const isInitializing = isLoadingPublicSettings || isLoadingAuth;
  // Skip splash for /legacy route — it redirects to server-rendered HTML
  const isLegacyRoute = location.pathname === '/legacy';
  const showSplash = !isLegacyRoute && (isInitializing || !minSplashDone || !updateCheckDone || !routeLoaded || !fontsLoaded);

  const [renderSplash, setRenderSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  useEffect(() => {
    if (!showSplash) {
      // Show welcome message briefly before fading out
      window.dispatchEvent(new Event('kjb-splash-done-soon'));
      const fadeTimer = setTimeout(() => setFadeSplash(true), 400);
      const timer = setTimeout(() => {
        setRenderSplash(false);
        window.kjbSplashDone = true;
        window.dispatchEvent(new Event('kjb-splash-done'));
      }, 900);
      return () => { clearTimeout(fadeTimer); clearTimeout(timer); };
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
        <Route path="/manifest-icons" element={<Suspense fallback={<RouteLoader />}><FadeIn><ManifestIcons /></FadeIn></Suspense>} />
        <Route path="/privacy" element={<Suspense fallback={<RouteLoader />}><FadeIn><PrivacyPolicyPage /></FadeIn></Suspense>} />
        <Route path="/legacy" element={<Suspense fallback={<RouteLoader />}><FadeIn><LegacyReader /></FadeIn></Suspense>} />
        <Route path="/debug" element={<Suspense fallback={<RouteLoader />}><FadeIn><DebugPage /></FadeIn></Suspense>} />
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