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
import React, { lazy, Suspense, useEffect } from 'react';

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

// No spinner — render nothing while a chunk loads (usually instant once cached)
const PageLoader = () => null;

// Wraps each route in a fast CSS fade so transitions feel smooth, not blank.
// Keyed by pathname so the animation replays on every navigation —
// but skipped on the very first render to avoid a flash on refresh.
let _firstRender = true;
const FadeIn = ({ children }) => {
  const { pathname } = useLocation();
  const isFirst = _firstRender;
  if (_firstRender) _firstRender = false;
  return <div key={pathname} className={isFirst ? '' : 'kjb-fade-in'}>{children}</div>;
};

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const location = useLocation();

  // Preload all route chunks in the background once auth resolves
  useEffect(() => { preloadAllRoutes(); }, []);

  // Don't return null while auth resolves — that causes a blank flash on reload.
  // The app shell (header/nav) renders immediately; only block on hard auth errors.
  if (isLoadingPublicSettings || isLoadingAuth) {
    // Keep the previously-rendered tree alive (no flash). Routes will hydrate
    // as soon as auth resolves.
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes location={location}>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Suspense fallback={<PageLoader />}><FadeIn><HomePage /></FadeIn></Suspense>} />
        <Route path="/read" element={<Suspense fallback={<PageLoader />}><FadeIn><BibleReader /></FadeIn></Suspense>} />
        <Route path="/gospel" element={<Suspense fallback={<PageLoader />}><FadeIn><GospelPage /></FadeIn></Suspense>} />
        <Route path="/resources" element={<Suspense fallback={<PageLoader />}><FadeIn><ResourcesPage /></FadeIn></Suspense>} />
        <Route path="/about" element={<Suspense fallback={<PageLoader />}><FadeIn><AboutPage /></FadeIn></Suspense>} />
        <Route path="/contents" element={<Suspense fallback={<PageLoader />}><FadeIn><ContentsPage /></FadeIn></Suspense>} />
        <Route path="/settings" element={<Suspense fallback={<PageLoader />}><FadeIn><SettingsPage /></FadeIn></Suspense>} />
        <Route path="/search" element={<Suspense fallback={<PageLoader />}><FadeIn><SearchPage /></FadeIn></Suspense>} />
        <Route path="/saved" element={<Suspense fallback={<PageLoader />}><FadeIn><SavedVersesPage /></FadeIn></Suspense>} />
        <Route path="/refresh-cache" element={<Suspense fallback={<PageLoader />}><FadeIn><RefreshCache /></FadeIn></Suspense>} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
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
              <SonnerToaster position="top-center" />
            </QueryClientProvider>
          </SoftReloadProvider>
        </HeaderHideProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App