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
      const outcome = run.log.some(l => l.includes('Updated') || l.includes('🔄'))
        ? '🔄 Updated'
        : run.log.some(l => l.includes('Error') || l.includes('❌'))
          ? '❌ Error'
          : '✅ No updates';
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
    : 'Welcome back!';

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

  // Minimum splash: always at least 2500ms; extended when an update is applying
  useEffect(() => {
    const timer = setTimeout(() => setMinSplashDone(true), 2500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let cancelled = false;
    // Persist splash log to localStorage so it survives reloads
    const splashLog = [];
    const logEntry = (msg) => {
      const ts = new Date().toISOString().slice(11, 23);
      splashLog.push(`${ts} ${msg}`);
      console.log('[KJB Splash]', msg);
    };
    const saveSplashLog = () => {
      try {
        const prev = JSON.parse(localStorage.getItem('kjb-splash-log') || '[]');
        const entry = { at: new Date().toISOString(), log: splashLog };
        const next = [entry, ...prev].slice(0, 5);
        localStorage.setItem('kjb-splash-log', JSON.stringify(next));
      } catch {}
      // Print a concise summary to the console
      const last = splashLog[splashLog.length - 1] || '';
      const outcome = last.includes('No updates') ? '✅ No updates' : last.includes('Error') ? '❌ Error' : '🔄 Updated';
      const swVer = 'v20260611_346';
      const bibleVer = (() => { try { return localStorage.getItem('bible_cache_version') || '(none)'; } catch { return '(none)'; } })();
      console.groupCollapsed(`[KJB Splash] ${outcome} — SW: ${swVer} | Bible: ${bibleVer} — ${splashLog.length} step(s)`);
      splashLog.forEach(l => console.log(l));
      console.groupEnd();
    };
    const emit = (msg) => {
      logEntry(msg);
      window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: msg } }));
    };

    const check = async () => {
      const swVer = 'v20260611_346';
      const bibleVerAtStart = (() => { try { return localStorage.getItem('bible_cache_version') || '(none)'; } catch { return '(none)'; } })();
      console.log(`[KJB Splash] 🚦 Update check starting — SW: ${swVer} | Bible: ${bibleVerAtStart}`);
      if (!('serviceWorker' in navigator)) {
        console.log('[KJB Splash] ⏭ No SW support — skipping update check');
        saveSplashLog();
        if (!cancelled) setUpdateCheckDone(true);
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        if (!reg) {
          console.log('[KJB Splash] ⏭ No SW registration found — skipping update check');
          saveSplashLog();
          if (!cancelled) setUpdateCheckDone(true);
          return;
        }

        // Log what SW state looks like BEFORE calling update() — this is what
        // the browser already has from the previous session.
        console.log('[KJB Splash] 📋 Pre-update() SW snapshot — waiting:', !!reg.waiting, '| installing:', !!reg.installing, '| controller:', !!navigator.serviceWorker.controller, '| scriptURL:', reg.active?.scriptURL || '(none)');

        // If an update is already waiting (e.g. loaded after a previous reload),
        // skip straight to "Found updates..." — no need to show "Checking" first.
        const alreadyWaiting = !!(reg.waiting || reg.installing);

        // Listen BEFORE reg.update() so we catch skipWaiting() activations
        // that happen before reg.waiting can be read.
        let swUpdateDetected = false;
        let controllerChanged = false;
        const onUpdateFound = () => { swUpdateDetected = true; console.log('[KJB Splash] 🆕 updatefound fired'); };
        const onControllerChange = () => { controllerChanged = true; console.log('[KJB Splash] 🔄 controllerchange fired'); };
        reg.addEventListener('updatefound', onUpdateFound);
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

        if (!alreadyWaiting) {
          emit('Checking for updates...');
          console.log('[KJB Splash] 🔍 Calling reg.update() to fetch latest SW from network...');
        } else {
          console.log('[KJB Splash] ⚡ Update already waiting — skipping "Checking" phase');
        }

        await reg.update().catch((e) => console.warn('[KJB Splash] reg.update() threw:', e.message));

        if (!alreadyWaiting) {
          await new Promise(r => setTimeout(r, 900));
        }

        // reg.update() resolves when the SW file is fetched, but the new worker
        // may still be mid-install. Wait up to 3s for it to reach 'installed'
        // (i.e. move to reg.waiting) before we decide there's no update.
        if (reg.installing) {
          console.log('[KJB Splash] ⏳ New SW is installing — waiting for it to settle...');
          await new Promise((resolve) => {
            const worker = reg.installing;
            if (!worker) { resolve(); return; }
            const handler = () => {
              console.log('[KJB Splash] SW install progress:', worker.state);
              if (['installed', 'activating', 'activated', 'redundant'].includes(worker.state)) {
                worker.removeEventListener('statechange', handler);
                resolve();
              }
            };
            worker.addEventListener('statechange', handler);
            setTimeout(resolve, 3000);
          });
        }

        reg.removeEventListener('updatefound', onUpdateFound);
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);

        const waitingWorker = reg.waiting;
        const installingWorker = reg.installing;
        const hasController = !!navigator.serviceWorker.controller;
        console.log('[KJB Splash] 📋 Post-update() SW snapshot — waiting:', !!waitingWorker, '| installing:', !!installingWorker, '| controller:', hasController, '| updatefound:', swUpdateDetected, '| controllerchange:', controllerChanged);

        // Check for Bible data update (version mismatch in localStorage)
        const localBibleVersion = (() => { try { return localStorage.getItem('bible_cache_version'); } catch { return null; } })();
        const CURRENT_BIBLE_VERSION = 'v20260611_340';
        const hasBibleUpdate = localBibleVersion && localBibleVersion !== CURRENT_BIBLE_VERSION;
        // Include swUpdateDetected/controllerChanged to catch cases where skipWaiting()
        // caused the new SW to activate before we could read reg.waiting.
        const hasSwUpdate = !!(waitingWorker || installingWorker || swUpdateDetected || controllerChanged) && hasController;

        console.log('[KJB Splash] Bible cache version — local:', localBibleVersion || '(none)', '| current:', CURRENT_BIBLE_VERSION, '| needs update:', hasBibleUpdate);
        console.log('[KJB Splash] SW update available:', hasSwUpdate);

        if (!hasBibleUpdate && !hasSwUpdate) {
          logEntry('✅ No updates needed');
          emit('No updates found');
          saveSplashLog();
          // Show "No updates found" for a readable moment before dismissing
          await new Promise(r => setTimeout(r, 1200));
          if (!cancelled) setUpdateCheckDone(true);
          return;
        }

        // Bible-data-only update (no new SW)
        if (hasBibleUpdate && !hasSwUpdate) {
          console.log('[KJB Splash] 📖 Bible data update detected:', localBibleVersion, '→', CURRENT_BIBLE_VERSION);
          setTimeout(() => { if (!cancelled) setMinSplashDone(true); }, 4000);
          emit('Found updates...');
          console.log('[KJB Splash] 📥 Splash: "Found updates"');
          await new Promise(r => setTimeout(r, 700));
          emit('Installing updates...');
          console.log('[KJB Splash] ⚙️ Splash: "Installing updates"');
          await new Promise(r => setTimeout(r, 700));
          emit('Applying updates...');
          console.log('[KJB Splash] 🔄 Splash: "Applying updates" — Bible data will re-download in background');
          await new Promise(r => setTimeout(r, 600));
          // Re-check SW after Bible update in case a new worker also arrived
          console.log('[KJB Splash] 🔁 Re-checking SW after Bible data update...');
          await reg.update().catch(() => {});
          const postBibleWaiting = reg.waiting;
          const postBibleInstalling = reg.installing;
          console.log('[KJB Splash] Post-Bible-update SW state — waiting:', !!postBibleWaiting, '| installing:', !!postBibleInstalling);
          if ((postBibleWaiting || postBibleInstalling) && hasController) {
            logEntry('🔧 SW update also found after Bible update — activating');
            saveSplashLog();
            const target = postBibleWaiting || postBibleInstalling;
            if (target) { target.postMessage({ type: 'SKIP_WAITING' }); console.log('[KJB Splash] ✉️ SKIP_WAITING sent after Bible update'); }
            setTimeout(() => { if (!cancelled) setUpdateCheckDone(true); }, 3000);
            return;
          }
          logEntry('✅ Bible update applied, no SW update needed');
          saveSplashLog();
          if (!cancelled) setUpdateCheckDone(true);
          return;
        }

        // SW update (with or without Bible update)
        if (hasSwUpdate) {
          console.log('[KJB Splash] 🔧 SW update detected — activating new worker');
          setTimeout(() => { if (!cancelled) setMinSplashDone(true); }, 4000);

          emit('Found updates...');
          await new Promise(r => setTimeout(r, 1200));

          emit('Installing updates...');
          console.log('[KJB Splash] ⏳ Waiting for installing worker to reach installed state...');
          if (installingWorker && !waitingWorker) {
            await new Promise((resolve) => {
              const worker = installingWorker;
              const handler = () => {
                console.log('[KJB Splash] SW installing state change:', worker.state);
                if (['installed', 'activating', 'activated', 'redundant'].includes(worker.state)) {
                  worker.removeEventListener('statechange', handler);
                  resolve();
                }
              };
              worker.addEventListener('statechange', handler);
              setTimeout(resolve, 5000);
            });
          }
          await new Promise(r => setTimeout(r, 1200));

          emit('Applying updates...');
          console.log('[KJB Splash] 🚀 Splash: "Applying updates" — posting SKIP_WAITING');
          const target = reg.waiting || reg.installing;
          if (target) {
            target.postMessage({ type: 'SKIP_WAITING' });
            console.log('[KJB Splash] ✉️ SKIP_WAITING sent to', target.state, 'worker');
          } else {
            console.log('[KJB Splash] ⚠️ No target worker to send SKIP_WAITING to');
          }
          await new Promise(r => setTimeout(r, 1200));
          // Re-check after SW update: Bible data may also need updating
          emit('Checking for updates...');
          console.log('[KJB Splash] 🔁 Re-check after SW update — looking for Bible data updates...');
          await new Promise(r => setTimeout(r, 1000));
          await reg.update().catch(() => {});
          const postSwWaiting = reg.waiting;
          const postSwInstalling = reg.installing;
          console.log('[KJB Splash] 🔁 Re-check after SW update — waiting:', !!postSwWaiting, '| installing:', !!postSwInstalling);

          // Check if Bible data also needs a re-download
          const postSwLocalBibleVersion = (() => { try { return localStorage.getItem('bible_cache_version'); } catch { return null; } })();
          const postSwHasBibleUpdate = postSwLocalBibleVersion && postSwLocalBibleVersion !== CURRENT_BIBLE_VERSION;
          console.log('[KJB Splash] Post-SW Bible version check — local:', postSwLocalBibleVersion, '| current:', CURRENT_BIBLE_VERSION, '| needs update:', postSwHasBibleUpdate);

          if (postSwHasBibleUpdate) {
            console.log('[KJB Splash] 📖 Bible data also needs updating after SW update');
            emit('Installing updates...');
            await new Promise(r => setTimeout(r, 700));
            emit('Applying updates...');
            console.log('[KJB Splash] 🔄 Bible data will re-download in background');
            await new Promise(r => setTimeout(r, 600));
          } else {
            logEntry('✅ No further updates after SW update');
            emit('No updates found');
          }

          saveSplashLog();
          setTimeout(() => { if (!cancelled) setUpdateCheckDone(true); }, 3000);
          return;
        }
      } catch (err) {
        logEntry('❌ Error: ' + err.message);
        console.error('[KJB Splash] ❌ Update check error:', err.message);
        saveSplashLog();
      }
      if (!cancelled) setUpdateCheckDone(true);
    };
    check();
    return () => { cancelled = true; };
  }, []);

  // Preload route chunks in background
  useEffect(() => { preloadAllRoutes(); }, []);

  // Check for SW updates whenever the tab becomes visible again.
  // If a new SW is waiting, show the full splash overlay and reload to apply it.
  const [tabFocusUpdatePending, setTabFocusUpdatePending] = useState(false);
  const [tabFocusSplashMsg, setTabFocusSplashMsg] = useState('Found updates...');
  useEffect(() => {
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
        console.log('[KJB Tab-Focus] 🔧 New SW found — showing splash and applying update...');
        setTabFocusSplashMsg('Found updates...');
        setTabFocusUpdatePending(true);
        await new Promise(r => setTimeout(r, 1000));
        setTabFocusSplashMsg('Installing updates...');
        await new Promise(r => setTimeout(r, 1000));
        setTabFocusSplashMsg('Applying updates...');
        const target = waiting || installing;
        if (target) target.postMessage({ type: 'SKIP_WAITING' });
        await new Promise(r => setTimeout(r, 1000));
        setTabFocusSplashMsg('Checking for updates...');
        await new Promise(r => setTimeout(r, 1000));
        setTabFocusSplashMsg('Welcome back!');
        // controllerchange in main.jsx triggers the reload
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

        // Print full splash history to console now that this run is complete
        try {
          const allRuns = JSON.parse(localStorage.getItem('kjb-splash-log') || '[]');
          console.group(`[KJB Splash Summary] ${allRuns.length} run(s) on record`);
          allRuns.forEach((run, i) => {
            const outcome = run.log.some(l => l.includes('🔄 Updated') || (!l.includes('No updates') && l.includes('update')))
              ? '🔄 Updated'
              : run.log.some(l => l.includes('❌'))
                ? '❌ Error'
                : '✅ No updates';
            console.groupCollapsed(`Run ${i + 1} [${outcome}] — ${run.at}`);
            run.log.forEach(l => console.log(l));
            console.groupEnd();
          });
          console.groupEnd();
        } catch {}

        // Final background SW check after splash — ensures any newly-deployed
        // SW that arrived while the app was loading gets registered for next visit.
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.getRegistration().then((reg) => {
            if (!reg) {
              console.log('[KJB Post-Splash] ⏭ No SW registration — skipping post-splash check');
              return;
            }
            console.log('[KJB Post-Splash] 🔍 Running final SW update check...');
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
          }).catch((err) => {
            console.warn('[KJB Post-Splash] ⚠️ Post-splash SW check failed:', err.message);
          });
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