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

// Detect first visit ONCE at module level so PageLoader can read it without
// side-effects (localStorage.setItem is handled in AuthenticatedApp).
const _isFirstVisit = (() => {
  try { return !localStorage.getItem('kjb-has-visited-app'); } catch { return false; }
})();

// Print persisted splash logs from ALL previous runs on every load
try {
  const prev = JSON.parse(localStorage.getItem('kjb-splash-log') || '[]');
  const label = prev.length
    ? `[KJB Splash History] ${prev.length} run(s) on record`
    : '[KJB Splash History] No previous runs recorded';
  console.group(label);
  if (prev.length) {
    prev.forEach((run, i) => {
      const hasError = run.log.some(l => l.includes('❌'));
      const hasUpdate = run.log.some(l => l.includes('Found updates') || l.includes('Applying updates') || l.includes('Bible update'));
      const outcome = hasError ? '❌ Error' : hasUpdate ? '🔄 Updated' : '✅ No updates';
      console.groupCollapsed(`Run ${i + 1} [${outcome}] — ${run.at}`);
      run.log.forEach(l => console.log(l));
      console.groupEnd();
    });
  } else {
    console.log('(No splash history saved yet)');
  }
  console.groupEnd();
} catch {}

const PageLoader = ({ isFadingOut, welcomeText, staticText }) => {
  const [text, setText] = useState(staticText || 'Loading...');

  useEffect(() => {
    if (staticText) { setText(staticText); return; }
    const handler = (e) => { if (e.detail?.message) setText(e.detail.message); };
    const doneHandler = () => setText(welcomeText);
    window.addEventListener('kjb-progress', handler);
    window.addEventListener('kjb-splash-done-soon', doneHandler);
    return () => {
      window.removeEventListener('kjb-progress', handler);
      window.removeEventListener('kjb-splash-done-soon', doneHandler);
    };
  }, [welcomeText, staticText]);

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
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Determine visit context once on mount
  const [visitContext] = useState(() => {
    const isFirstVisit = _isFirstVisit;
    // Mark visited now so subsequent loads see it
    if (isFirstVisit) { try { localStorage.setItem('kjb-has-visited-app', 'true'); } catch {} }
    const isPostUpdate = !!(sessionStorage.getItem('kjb_sw_updated') || window.location.search.includes('updated=true'));
    try { sessionStorage.removeItem('kjb_sw_updated'); } catch {}
    return { isFirstVisit, isPostUpdate };
  });

  const welcomeText = visitContext.isFirstVisit
    ? 'Welcome to KJB Reader!'
    : 'Welcome back to KJB Reader!';

  useEffect(() => {
    const originalTitle = document.title;
    const beforePrint = () => { document.title = '\u200B'; };
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
        timeout = setTimeout(() => setFontsLoaded(true), 300);
      });
      setTimeout(() => setFontsLoaded(true), 3000);
    } else {
      setFontsLoaded(true);
    }
    return () => clearTimeout(timeout);
  }, []);

  // minSplash is controlled entirely by the scripted sequence below
  useEffect(() => {
    const timer = setTimeout(() => setMinSplashDone(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const STEP = 10000; // 10-second pause between each visible banner step
    const splashLog = [];

    const logEntry = (msg) => {
      const ts = new Date().toISOString().slice(11, 23);
      splashLog.push(`${ts} ${msg}`);
      console.log('[KJB Splash]', msg);
    };
    const saveSplashLog = () => {
      try {
        const prev = JSON.parse(localStorage.getItem('kjb-splash-log') || '[]');
        const next = [{ at: new Date().toISOString(), log: splashLog }, ...prev].slice(0, 5);
        localStorage.setItem('kjb-splash-log', JSON.stringify(next));
      } catch {}
    };
    const emit = (msg) => {
      logEntry(msg);
      window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: msg } }));
    };
    const wait = (ms) => new Promise(r => setTimeout(r, ms));
    const done = () => { saveSplashLog(); if (!cancelled) setUpdateCheckDone(true); };

    const SW_VER = 'v20260611_350';
    const CURRENT_BIBLE_VERSION = 'v20260611_340';
    const getBibleVer = () => { try { return localStorage.getItem('bible_cache_version') || '(none)'; } catch { return '(none)'; } };

    const check = async () => {
      // --- Detect context ---
      const isFirst = _isFirstVisit;
      const localBibleVersion = (() => { try { return localStorage.getItem('bible_cache_version'); } catch { return null; } })();
      const hasBibleUpdate = localBibleVersion && localBibleVersion !== CURRENT_BIBLE_VERSION;

      let hasSwUpdate = false;
      let reg = null;
      if ('serviceWorker' in navigator) {
        try {
          reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            console.log('[KJB Splash] Pre-update SW — waiting:', !!reg.waiting, '| installing:', !!reg.installing);
            let swDetected = false;
            let ctrlChanged = false;
            reg.addEventListener('updatefound', () => { swDetected = true; });
            navigator.serviceWorker.addEventListener('controllerchange', () => { ctrlChanged = true; });
            await reg.update().catch((e) => console.warn('[KJB Splash] reg.update():', e.message));
            // Wait for installing worker to settle
            if (reg.installing) {
              await new Promise((resolve) => {
                const w = reg.installing;
                if (!w) { resolve(); return; }
                const h = () => { if (['installed','activating','activated','redundant'].includes(w.state)) { w.removeEventListener('statechange', h); resolve(); } };
                w.addEventListener('statechange', h);
                setTimeout(resolve, 3000);
              });
            }
            const hasCtrl = !!navigator.serviceWorker.controller;
            hasSwUpdate = !!(reg.waiting || reg.installing || swDetected || ctrlChanged) && hasCtrl;
            console.log('[KJB Splash] Post-update SW — waiting:', !!reg.waiting, '| installing:', !!reg.installing, '| swUpdate:', hasSwUpdate);
          }
        } catch (e) { console.warn('[KJB Splash] SW check error:', e.message); }
      }

      console.log('[KJB Splash] Context — firstVisit:', isFirst, '| hasBibleUpdate:', hasBibleUpdate, '| hasSwUpdate:', hasSwUpdate);

      // Helper: apply pending SW worker and re-check for more updates
      const applyAndRecheck = async () => {
        let keepChecking = true;
        while (keepChecking && !cancelled) {
          emit('Applying updates...');
          if (reg) {
            const target = reg.waiting || reg.installing;
            if (target) target.postMessage({ type: 'SKIP_WAITING' });
          }
          await wait(STEP);
          emit('Checking for updates...');
          if (reg) await reg.update().catch(() => {});
          await wait(STEP);
          const stillHasSw = reg ? !!(reg.waiting || reg.installing) : false;
          const localBibleNow = (() => { try { return localStorage.getItem('bible_cache_version'); } catch { return null; } })();
          const stillHasBible = localBibleNow && localBibleNow !== CURRENT_BIBLE_VERSION;
          keepChecking = !!(stillHasSw || stillHasBible);
          if (keepChecking) {
            emit('Found updates...');
            await wait(STEP);
            emit('Installing updates...');
            await wait(STEP);
          } else {
            emit('No updates found');
            await wait(STEP);
          }
        }
      };

      // ── FIRST LOAD ──
      if (isFirst) {
        emit('Loading...');
        await wait(STEP);
        emit('Downloading offline Bible data...');
        await wait(STEP);
        emit('Checking for updates...');
        await wait(STEP);
        if (hasSwUpdate || hasBibleUpdate) {
          emit('Found updates...');
          await wait(STEP);
          emit('Installing updates...');
          await wait(STEP);
          await applyAndRecheck();
        } else {
          emit('No updates found');
          await wait(STEP);
        }
        emit(welcomeText);
        await wait(STEP);
        logEntry(`✅ First load complete — SW: ${SW_VER} | Bible: ${getBibleVer()}`);
        done();
        return;
      }

      // ── SUBSEQUENT LOAD ──
      emit('Loading...');
      await wait(STEP);
      emit('Checking for updates...');
      await wait(STEP);
      if (hasSwUpdate || hasBibleUpdate) {
        emit('Found updates...');
        await wait(STEP);
        emit('Installing updates...');
        await wait(STEP);
        await applyAndRecheck();
      } else {
        emit('No updates found');
        await wait(STEP);
      }
      emit(welcomeText);
      await wait(STEP);
      logEntry(`✅ Load complete — SW: ${SW_VER} | Bible: ${getBibleVer()}`);
      done();
    };

    check();
    return () => { cancelled = true; };
  }, []);

  // Preload route chunks in background
  useEffect(() => { preloadAllRoutes(); }, []);

  // Check for SW updates whenever the tab becomes visible (Home screen / tab focus).
  // Sequence: Found updates → Installing → Applying → Checking for updates → Welcome back!
  const [tabFocusUpdatePending, setTabFocusUpdatePending] = useState(false);
  const [tabFocusSplashMsg, setTabFocusSplashMsg] = useState('Found updates...');
  useEffect(() => {
    const STEP = 10000;
    let applying = false;
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      if (!('serviceWorker' in navigator)) return;
      if (applying) return;
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) return;
        await reg.update().catch(() => {});
        const waiting = reg.waiting;
        const installing = reg.installing;
        console.log('[KJB Tab-Focus] SW check — waiting:', !!waiting, '| installing:', !!installing);
        if (!waiting && !installing) return;
        applying = true;
        setTabFocusSplashMsg('Found updates...');
        setTabFocusUpdatePending(true);
        await new Promise(r => setTimeout(r, STEP));
        setTabFocusSplashMsg('Installing updates...');
        await new Promise(r => setTimeout(r, STEP));
        let keepChecking = true;
        while (keepChecking) {
          setTabFocusSplashMsg('Applying updates...');
          const target = reg.waiting || reg.installing || waiting || installing;
          if (target) target.postMessage({ type: 'SKIP_WAITING' });
          await new Promise(r => setTimeout(r, STEP));
          setTabFocusSplashMsg('Checking for updates...');
          await reg.update().catch(() => {});
          await new Promise(r => setTimeout(r, STEP));
          keepChecking = !!(reg.waiting || reg.installing);
          if (keepChecking) {
            setTabFocusSplashMsg('Found updates...');
            await new Promise(r => setTimeout(r, STEP));
            setTabFocusSplashMsg('Installing updates...');
            await new Promise(r => setTimeout(r, STEP));
          } else {
            setTabFocusSplashMsg('No updates found');
            await new Promise(r => setTimeout(r, STEP));
          }
        }
        setTabFocusSplashMsg('Welcome back to KJB Reader!');
        // controllerchange in main.jsx triggers the page reload
      } catch (err) {
        console.warn('[KJB Tab-Focus] Update check failed:', err.message);
        setTabFocusUpdatePending(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  const isInitializing = isLoadingPublicSettings || isLoadingAuth;
  const isLegacyRoute = location.pathname === '/legacy';
  const showSplash = !isLegacyRoute && (isInitializing || !minSplashDone || !updateCheckDone || !fontsLoaded);

  const [renderSplash, setRenderSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  useEffect(() => {
    if (!showSplash) {
      // Emit welcome text, then fade out
      window.dispatchEvent(new Event('kjb-splash-done-soon'));

      const fadeTimer = setTimeout(() => setFadeSplash(true), 600);
      const timer = setTimeout(() => {
        setRenderSplash(false);
        window.kjbSplashDone = true;
        window.dispatchEvent(new Event('kjb-splash-done'));

        // Print full summary NOW — app is fully loaded and visible.
        // The current run was already saved to localStorage by check() via saveSplashLog().
        try {
          const allRuns = JSON.parse(localStorage.getItem('kjb-splash-log') || '[]');
          const current = allRuns[0];
          if (current) {
            const hasError = current.log.some(l => l.includes('❌'));
            const hasUpdate = current.log.some(l => l.includes('Found updates') || l.includes('Applying') || l.includes('Bible update'));
            const outcome = hasError ? '❌ Error' : hasUpdate ? '🔄 Updated' : '✅ No updates';
            const bibleVer = (() => { try { return localStorage.getItem('bible_cache_version') || '(none)'; } catch { return '(none)'; } })();
            console.group(`[KJB Splash Summary] App loaded — ${outcome} — SW: v20260611_350 | Bible: ${bibleVer}`);
            current.log.forEach((l, i) => console.log(`  ${i + 1}. ${l}`));
            if (allRuns.length > 1) {
              console.groupCollapsed(`Previous ${allRuns.length - 1} run(s)`);
              allRuns.slice(1).forEach((run, i) => {
                const e = run.log.some(l => l.includes('❌'));
                const u = run.log.some(l => l.includes('Found updates') || l.includes('Applying'));
                const ro = e ? '❌' : u ? '🔄' : '✅';
                console.groupCollapsed(`Run -${i + 1} [${ro}] — ${run.at}`);
                run.log.forEach((l, j) => console.log(`  ${j + 1}. ${l}`));
                console.groupEnd();
              });
              console.groupEnd();
            }
            console.groupEnd();
          }
        } catch {}

        // Final background SW check after splash — ensures any newly-deployed
        // SW that arrived while the app was loading gets registered for next visit.
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (!reg) return;
            return reg.update().then(() => {
              const waiting = reg.waiting;
              const installing = reg.installing;
              console.log('[KJB Post-Splash] SW state after check — waiting:', !!waiting, '| installing:', !!installing);
              if (waiting || installing) {
                console.log('[KJB Post-Splash] 🔧 New SW available — will activate on next page load');
              } else {
                console.log('[KJB Post-Splash] ✅ SW is current — no pending updates');
              }
            });
          }).catch(() => {});
        }
      }, 1100);
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
      {renderSplash && <PageLoader isFadingOut={fadeSplash} welcomeText={welcomeText} />}
      {tabFocusUpdatePending && (
        <PageLoader isFadingOut={false} welcomeText={tabFocusSplashMsg} staticText={tabFocusSplashMsg} />
      )}
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