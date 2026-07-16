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
import ChunkErrorBoundary from '@/components/ChunkErrorBoundary';
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
  AdvancedSearch: () => import('@/pages/AdvancedSearchPage.jsx').catch((err) => { console.error('Failed to load AdvancedSearchPage:', err); throw err; }),
  Saved: () => import('@/pages/SavedVersesPage.jsx').catch((err) => { console.error('Failed to load SavedVersesPage:', err); throw err; }),
  RefreshCache: () => import('@/pages/RefreshCache.jsx').catch((err) => { console.error('Failed to load RefreshCache:', err); throw err; }),
  ManifestIcons: () => import('@/pages/ManifestIcons.jsx').catch((err) => { console.error('Failed to load ManifestIcons:', err); throw err; }),
  ManifestScreenshots: () => import('@/pages/ManifestScreenshots.jsx').catch((err) => { console.error('Failed to load ManifestScreenshots:', err); throw err; }),
  Privacy: () => import('@/pages/PrivacyPolicyPage.jsx').catch((err) => { console.error('Failed to load PrivacyPolicyPage:', err); throw err; }),
  LegacyReader: () => import('@/pages/LegacyReader.jsx').catch((err) => { console.error('Failed to load LegacyReader:', err); throw err; }),
  BibleTxt: () => import('@/pages/BibleTxt.jsx').catch((err) => { console.error('Failed to load BibleTxt:', err); throw err; }),
  DevTools: () => import('@/pages/DevToolsPage.jsx').catch((err) => { console.error('Failed to load DevToolsPage:', err); throw err; }),
  Account: () => import('@/pages/AccountPage.jsx').catch((err) => { console.error('Failed to load AccountPage:', err); throw err; }),
  Login: () => import('@/pages/Login').catch((err) => { console.error('Failed to load Login:', err); throw err; }),
  Landing: () => import('@/pages/LandingPage').catch((err) => { console.error('Failed to load LandingPage:', err); throw err; }),
  Terms: () => import('@/pages/TermsOfServicePage').catch((err) => { console.error('Failed to load TermsOfServicePage:', err); throw err; }),
  Salvation: () => import('@/pages/SalvationPage').catch((err) => { console.error('Failed to load SalvationPage:', err); throw err; }),

};
const HomePage = lazy(loaders.Home);
const BibleReader = lazy(loaders.BibleReader);
const GospelPage = lazy(loaders.Gospel);
const ResourcesPage = lazy(loaders.Resources);
const AboutPage = lazy(loaders.About);
const ContentsPage = lazy(loaders.Contents);
const SettingsPage = lazy(loaders.Settings);
const SearchPage = lazy(loaders.Search);
const AdvancedSearchPage = lazy(loaders.AdvancedSearch);
const SavedVersesPage = lazy(loaders.Saved);
const RefreshCache = lazy(loaders.RefreshCache);
const ManifestIcons = lazy(loaders.ManifestIcons);
const ManifestScreenshots = lazy(loaders.ManifestScreenshots);
const PrivacyPolicyPage = lazy(loaders.Privacy);
const LegacyReader = lazy(loaders.LegacyReader);
const BibleTxt = lazy(loaders.BibleTxt);
const DevToolsPage = lazy(loaders.DevTools);
const AccountPage = lazy(loaders.Account);
const Login = lazy(loaders.Login);
const LandingPage = lazy(loaders.Landing);
const TermsOfServicePage = lazy(loaders.Terms);
const SalvationPage = lazy(loaders.Salvation);


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

import { Loader2 } from 'lucide-react';
import SplashScreen from '@/components/SplashScreen';
import { syncAllFromCloud } from '@/lib/syncAll';

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
  const [showSplash, setShowSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  // The app's canonical tab title. Printing/exporting opens a temporary
  // document whose title (e.g. "KJB Advanced Search") can otherwise get stuck
  // in the browser tab if `afterprint` doesn't fire (cancelled dialog, mobile
  // "Save as PDF"). We always restore to this fixed value, never a captured
  // snapshot that could itself already be stale.
  const CANONICAL_TITLE = 'KJB Reader';
  useEffect(() => {
    const beforePrint = () => { document.title = '\u200B'; };
    const afterPrint = () => { document.title = CANONICAL_TITLE; };
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);
    return () => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    };
  }, []);

  // Keep the tab title pinned to the canonical name. The browser can otherwise
  // derive a title from the URL path (e.g. "/advanced-search" → "Advanced
  // Search") on a hard refresh, or restore a stale title from a history entry
  // that was captured mid print/export. We force it on every route change AND
  // on a short delay after mount, so any late browser override is corrected.
  useEffect(() => {
    document.title = CANONICAL_TITLE;
    const t = setTimeout(() => { document.title = CANONICAL_TITLE; }, 400);
    return () => clearTimeout(t);
  }, [location.pathname]);

  // Preload route chunks in background
  useEffect(() => { preloadAllRoutes(); }, []);

  // App mounted successfully — clear the one-shot chunk-reload guard so a
  // future genuine chunk failure can auto-recover again.
  useEffect(() => { try { sessionStorage.removeItem('kjb-chunk-reloaded'); } catch {} }, []);

  // Pull cloud data on every route / query-param change (covers search, daily
  // verse, chapter changes, etc.) and when the tab regains focus — so changes
  // from another device appear without needing a manual sync.
  useEffect(() => {
    syncAllFromCloud();
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onFocus = () => syncAllFromCloud();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, []);

  const isInitializing = isLoadingPublicSettings || isLoadingAuth;
  
  // Determine splash mode once on mount.
  // IMPORTANT: do NOT remove the 'kjb-splash-home-update' flag here. If a
  // background SW reload happens mid-flow, removing it early would drop us back
  // into the 'subsequent' flow (showing "LOADING → CHECKING → FOUND" instead of
  // "FOUND UPDATES" first). The flag is cleared only when the splash completes.
  const splashMode = React.useMemo(() => {
    const homeUpdate = sessionStorage.getItem('kjb-splash-home-update') === 'true';
    const hasVisited = localStorage.getItem('kjb-has-visited-app');

    if (homeUpdate) {
      return 'home_update';
    }
    return hasVisited ? 'subsequent' : 'first_load';
  }, []);

  const handleSplashDone = () => {
    // Splash flow finished — now it's safe to clear the home-update flag.
    try { sessionStorage.removeItem('kjb-splash-home-update'); } catch {}
    setFadeSplash(true);
    setTimeout(() => {
      setShowSplash(false);
      window.kjbSplashDone = true;
      window.dispatchEvent(new Event('kjb-splash-done'));
    }, 500);
  };

  if (authError && !isInitializing) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  // First-time visitors are sent to the landing/setup page
  if (!isInitializing && !authError && location.pathname === '/') {
    try {
      if (localStorage.getItem('kjb-has-visited-app') !== 'true') {
        return <Navigate to="/landing" replace />;
      }
    } catch {}
  }

  return (
    <>
      {/* Splash screen ALWAYS renders on first paint to prevent flash — hidden via opacity, not removed */}
      <SplashScreen
        isFadingOut={fadeSplash}
        onDone={handleSplashDone}
        mode={splashMode}
        isVisible={showSplash && location.pathname !== '/legacy' && location.pathname !== '/bible.txt'}
      />
      {!isInitializing && !authError && (
        <ChunkErrorBoundary>
          <Routes location={location}>
            <Route path="/login" element={<Suspense fallback={<RouteLoader />}><Login /></Suspense>} />
            <Route path="/landing" element={<Suspense fallback={<RouteLoader />}><LandingPage /></Suspense>} />
            <Route path="/terms" element={<Suspense fallback={<RouteLoader />}><TermsOfServicePage /></Suspense>} />
            <Route path="/privacy" element={<Suspense fallback={<RouteLoader />}><PrivacyPolicyPage /></Suspense>} />
            <Route path="/salvation" element={<Suspense fallback={<RouteLoader />}><SalvationPage /></Suspense>} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Suspense fallback={<RouteLoader />}><FadeIn><HomePage /></FadeIn></Suspense>} />
              <Route path="/read" element={<Suspense fallback={<RouteLoader />}><FadeIn><BibleReader /></FadeIn></Suspense>} />
              <Route path="/gospel" element={<Suspense fallback={<RouteLoader />}><FadeIn><GospelPage /></FadeIn></Suspense>} />
              <Route path="/resources" element={<Suspense fallback={<RouteLoader />}><FadeIn><ResourcesPage /></FadeIn></Suspense>} />
              <Route path="/about" element={<Suspense fallback={<RouteLoader />}><FadeIn><AboutPage /></FadeIn></Suspense>} />
              <Route path="/contents" element={<Suspense fallback={<RouteLoader />}><FadeIn><ContentsPage /></FadeIn></Suspense>} />
              <Route path="/settings" element={<Suspense fallback={<RouteLoader />}><FadeIn><SettingsPage /></FadeIn></Suspense>} />
              <Route path="/search" element={<Suspense fallback={<RouteLoader />}><FadeIn><SearchPage /></FadeIn></Suspense>} />
              <Route path="/advanced-search" element={<Suspense fallback={<RouteLoader />}><FadeIn><AdvancedSearchPage /></FadeIn></Suspense>} />
              <Route path="/saved" element={<Suspense fallback={<RouteLoader />}><FadeIn><SavedVersesPage /></FadeIn></Suspense>} />
              <Route path="/refresh-cache" element={<Suspense fallback={<RouteLoader />}><FadeIn><RefreshCache /></FadeIn></Suspense>} />
              <Route path="/manifest-icons" element={<Suspense fallback={<RouteLoader />}><FadeIn><ManifestIcons /></FadeIn></Suspense>} />
              <Route path="/manifest-screenshots" element={<Suspense fallback={<RouteLoader />}><FadeIn><ManifestScreenshots /></FadeIn></Suspense>} />
              <Route path="/legacy" element={<Suspense fallback={<RouteLoader />}><FadeIn><LegacyReader /></FadeIn></Suspense>} />
              <Route path="/dev-tools" element={<Suspense fallback={<RouteLoader />}><FadeIn><DevToolsPage /></FadeIn></Suspense>} />
              <Route path="/account" element={<Suspense fallback={<RouteLoader />}><FadeIn><AccountPage /></FadeIn></Suspense>} />
            </Route>
            <Route path="/bible.txt" element={<Suspense fallback={null}><BibleTxt /></Suspense>} />
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </ChunkErrorBoundary>
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