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
const PageLoader = ({ isFadingOut }) => (
  <div className={`fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex flex-col items-center justify-center transition-all duration-700 ease-out ${isFadingOut ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100 scale-100'}`}>
    <div className="flex flex-col items-center justify-center -mt-16">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-foreground/10 blur-3xl rounded-full"></div>
        <img 
          src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png" 
          alt="KJB Reader" 
          className="relative w-32 h-32 object-contain drop-shadow-2xl"
        />
      </div>
      <div className="flex items-center gap-3 text-foreground bg-card/80 px-6 py-3 rounded-2xl backdrop-blur-md shadow-lg border border-border/50">
        <Loader2 className="w-5 h-5 animate-spin text-foreground" />
        <span className="font-sans text-sm font-semibold tracking-wide">Loading KJB Reader...</span>
      </div>
    </div>
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

  useEffect(() => {
    // If we just reloaded from an update, skip the delay so it's snappy
    const isPostUpdate = sessionStorage.getItem('kjb_sw_updated');
    const timer = setTimeout(() => setMinSplashDone(true), isPostUpdate ? 50 : 800); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const checkUpdatesSilently = async () => {
      try {
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
          return; // Skip if offline
        }

        if (sessionStorage.getItem('kjb_sw_updated')) {
          sessionStorage.removeItem('kjb_sw_updated');
          return; // We just reloaded from an update, skip checking again
        }

        let hasUpdates = false;

        // 1. Check App/Code Updates
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.update().catch(() => {});
            if (reg.waiting) {
              hasUpdates = true;
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            } else if (reg.installing) {
              if (reg.installing.state === 'installed') {
                hasUpdates = true;
                reg.installing.postMessage({ type: 'SKIP_WAITING' });
              } else {
                hasUpdates = await new Promise(resolve => {
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

        // 2. Check Bible Data Updates and initial cache load
        const { checkForUpdates, downloadBibleForOffline, autoDownloadBibleOnFirstLoad } = await import('@/lib/bibleCache');
        const bibleNeedsUpdate = await checkForUpdates().catch(() => false);
        
        if (bibleNeedsUpdate) {
          hasUpdates = true;
          localStorage.removeItem('bible_cache_version');
          localStorage.removeItem('bible_last_refresh');
          await downloadBibleForOffline().catch(() => {});
        } else {
          // ensure initial load happens if no updates but cache is missing
          // Use Promise.race to timeout after 30 seconds so it never hangs forever
          const downloadPromise = autoDownloadBibleOnFirstLoad().catch(() => {});
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000));
          await Promise.race([downloadPromise, timeoutPromise]).catch(() => {});
        }

        if (hasUpdates) {
          sessionStorage.setItem('kjb_sw_updated', 'true');
          if ('caches' in window) {
            const cacheNames = await caches.keys();
            await Promise.all(cacheNames.map(name => caches.delete(name)));
          }
          window.location.reload();
          return; 
        }

      } catch (err) {
        console.error('Silent update check failed:', err);
      } finally {
        if (isMounted) {
          setUpdateCheckDone(true);
        }
      }
    };

    checkUpdatesSilently();
    return () => { isMounted = false; };
  }, []);

  // Preload all route chunks in the background once auth resolves
  useEffect(() => { 
    preloadAllRoutes();
  }, []);

  const isInitializing = isLoadingPublicSettings || isLoadingAuth;
  const showSplash = isInitializing || !minSplashDone || !updateCheckDone;

  const [renderSplash, setRenderSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  useEffect(() => {
    if (!showSplash) {
      setFadeSplash(true);
      const timer = setTimeout(() => setRenderSplash(false), 700); // Wait for fade out animation
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