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
import { getDailyVerse } from '@/lib/dailyVerse';
import React, { lazy, Suspense, useEffect, useState } from 'react';
import FirstLoadPrompt from '@/components/FirstLoadPrompt';
import { useAppLayoutPrompt } from '@/hooks/useAppLayoutPrompt';

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
import { Loader2, ChevronRight, Heart } from 'lucide-react';
import DailyVerseImage from '@/components/bible/DailyVerseImage';

const PageLoader = ({ isFadingOut, isReady, onDismiss }) => {
  const [activeCard, setActiveCard] = useState('gospel');
  const [updateType] = useState(() => 
    typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('kjb_sw_updated') : null
  );
  const [dynamicText, setDynamicText] = useState(null);

  const [isFirstVisit] = useState(() => {
    try {
      if (!localStorage.getItem('kjb_has_visited_v2')) {
        localStorage.setItem('kjb_has_visited_v2', 'true');
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  const promptProps = useAppLayoutPrompt();
  const [dailyVerse] = useState(() => getDailyVerse());

  useEffect(() => {
    const handleProgress = (e) => {
      if (e.detail?.message) setDynamicText(e.detail.message);
    };
    window.addEventListener('kjb-splash-update', handleProgress);
    return () => window.removeEventListener('kjb-splash-update', handleProgress);
  }, []);

  const [minTimePassed, setMinTimePassed] = useState(true);

  if (isFadingOut) return null;

  let welcomeText = isFirstVisit ? "Welcome to KJB Reader" : "Welcome back";
  let loadingText = null;
  
  if (dynamicText) {
    loadingText = dynamicText;
  } else if (updateType) {
    if (updateType === 'both') loadingText = "Applying app & Bible updates...";
    else if (updateType === 'bible') loadingText = "Applying Bible data updates...";
    else loadingText = "Applying app updates...";
  } else if (!isReady) {
    loadingText = isFirstVisit ? "Loading KJB Reader..." : "Welcome back...";
  }

  const isAppReady = isReady;

  return (
    <div className={`fixed inset-0 z-[9999] bg-background overflow-hidden ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-300`}>
      <div className={`flex flex-col items-center w-full h-[100dvh] px-4 max-w-xl mx-auto pt-8 ${isFirstVisit ? 'pb-8' : 'pb-32'} space-y-6 overflow-y-auto`}>
        
        {/* Logo and Welcome Banner (Only show on first visit before continuing) */}
        {isFirstVisit && (
          <div className="flex flex-col items-center justify-center pt-6 mb-4">
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-foreground/10 blur-3xl rounded-full"></div>
              <img 
                src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png" 
                alt="KJB Reader" 
                className="relative w-28 h-28 object-contain drop-shadow-2xl"
              />
            </div>
            <h1 className="text-3xl font-serif font-bold text-foreground text-center">Welcome to KJB Reader</h1>
          </div>
        )}

        {/* First Visit Flow */}
        {isFirstVisit ? (
          <>
            {loadingText ? (
              <div className="flex flex-col items-center mt-4 w-full">
                <div className="flex items-center gap-3 text-foreground bg-card px-6 py-4 rounded-2xl shadow-lg border border-border/80 justify-center w-full">
                  <Loader2 className="w-5 h-5 animate-spin text-accent shrink-0" />
                  <span className="font-sans text-sm font-semibold tracking-wide truncate">{loadingText}</span>
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="w-full shrink-0 mb-6 px-1">
                  <FirstLoadPrompt 
                    splashMode={true}
                    isInstallable={promptProps.isInstallable}
                    notifPermission={promptProps.notifPermission}
                    onInstall={promptProps.handleInstall}
                    onEnableNotif={promptProps.handleEnableNotif}
                    onDismiss={() => {}}
                    loadingText={null}
                    isAppReady={true}
                    continueText="Hidden"
                  />
                </div>
                
                <div className="w-full shrink-0 mb-6 px-1">
                 <div className="bg-gradient-to-br from-[#0c3483] via-[#592b98] to-[#9925a1] border border-white/20 rounded-2xl p-6 text-center shadow-xl flex flex-col justify-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-black/10"></div>
                   <div className="relative z-10">
                     <p className="font-serif text-2xl font-bold text-white mb-1" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>The Gospel of Salvation</p>
                     <p className="font-sans text-xs font-bold text-[#eec759] mb-4" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>1 Corinthians 15:1–4 & Romans 3:25</p>
                     
                     <div className="w-3/4 mx-auto h-px bg-white/20 mb-4" />

                     <p className="font-serif text-lg font-bold text-[#f5d970] mb-4 leading-relaxed" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                       Trust that Jesus is God, died on the cross, shed His Blood, was buried, and rose again the third day for our sins.
                     </p>

                     <div className="w-3/4 mx-auto h-px bg-white/20 mb-4" />

                     <p className="font-serif text-[13px] font-medium text-white italic mb-3 leading-relaxed" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                       How Christ died: He shed His blood as the full payment for sin — the propitiation through faith in His blood.
                     </p>

                     <div className="w-1/2 mx-auto h-px bg-white/20 mb-3" />

                     <p className="font-serif text-[13px] font-medium text-white italic mb-6 leading-relaxed" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                       The Gospel — the power of God unto salvation to everyone that believeth.
                     </p>

                     <button
                       onClick={() => {
                         onDismiss();
                         setTimeout(() => { window.location.href = '/gospel'; }, 100);
                       }}
                       className="inline-flex items-center justify-center gap-2 w-full px-5 py-4 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-xl font-sans text-sm font-bold transition-all duration-200 shadow-md active:scale-[0.98]"
                     >
                       <Heart className="w-4 h-4 fill-white" />
                       Learn How to be Saved
                     </button>
                   </div>
                 </div>
                </div>

                <div className="w-full relative px-1 shrink-0 mb-6">
                  <DailyVerseImage 
                    verse={dailyVerse} 
                    splashMode={true} 
                    onClick={() => {}} 
                    onToggleNotif={promptProps.handleEnableNotif}
                    notifEnabled={'Notification' in window && Notification.permission === 'granted'}
                  />
                </div>

                <div className="w-full px-1">
                  <button 
                    onClick={onDismiss}
                    className="flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-sans font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl border border-primary/20 w-full rounded-2xl text-lg"
                  >
                    Continue to App
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Returning Visit Flow */
          <>
            <div className="w-full relative px-2 shrink-0 mb-4 pt-16">
              <DailyVerseImage 
                verse={dailyVerse} 
                splashMode={true} 
                onClick={() => {}} 
                onToggleNotif={promptProps.handleEnableNotif}
                notifEnabled={'Notification' in window && Notification.permission === 'granted'}
              />
            </div>
            
            <div className="w-full flex flex-col items-center justify-center shrink-0 pb-6 pt-2 px-4 bg-background absolute bottom-0 left-0 right-0 z-50">
              {loadingText ? (
                <div className="flex items-center gap-3 text-foreground bg-card px-6 py-3.5 rounded-2xl shadow-lg border border-border/80 w-full justify-center max-w-xl mx-auto">
                  <Loader2 className="w-5 h-5 animate-spin text-accent shrink-0" />
                  <span className="font-sans text-sm font-semibold tracking-wide truncate">{loadingText}</span>
                </div>
              ) : (
                <button 
                  onClick={onDismiss}
                  className="flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground font-sans font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-2xl border border-primary/20 max-w-xl mx-auto px-10 rounded-full text-lg"
                >
                  Continue
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

const RouteLoader = () => (
  <div className="flex justify-center py-24">
    <Loader2 className="w-8 h-8 animate-spin text-accent" />
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
  const [splashDismissed, setSplashDismissed] = useState(false);
  const [failsafeTriggered, setFailsafeTriggered] = useState(false);

  // Global failsafe to guarantee the splash screen / prompt never loads indefinitely
  useEffect(() => {
    const failsafeTimer = setTimeout(() => setFailsafeTriggered(true), 6000);
    return () => clearTimeout(failsafeTimer);
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
    // If we just reloaded from an update, stagger the splash screen longer
    // to give time for the "Applying updates..." and "Loading KJB Reader..." phases
    const timer = setTimeout(() => setMinSplashDone(true), isPostUpdate ? 5000 : 0); 
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
                  window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: 'Downloading app updates...' } }));
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
        const { checkForUpdates, downloadBibleForOffline, autoDownloadBibleOnFirstLoad } = await import('@/lib/bibleCache');
        const bibleNeedsUpdate = await checkForUpdates().catch(() => false);
        
        if (bibleNeedsUpdate) {
          localStorage.removeItem('bible_cache_version');
          localStorage.removeItem('bible_last_refresh');
          try {
            window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: 'Downloading Bible data...' } }));
            await downloadBibleForOffline();
            hasBibleUpdates = true;
          } catch(e) {
            console.error('Failed to download bible updates', e);
          }
        } else {
          // ensure initial load happens if no updates but cache is missing
          // Silently trigger background download without blocking the splash screen
          import('@/lib/bibleCache').then(({ preloadBibleData }) => {
            preloadBibleData();
          }).catch(() => {});
        }

        if (hasAppUpdates || hasBibleUpdates) {
          let updateType = 'app';
          let reloadText = 'Applying updates...';
          if (hasAppUpdates && hasBibleUpdates) { updateType = 'both'; reloadText = 'Applying app & Bible updates...'; }
          else if (hasBibleUpdates) { updateType = 'bible'; reloadText = 'Applying Bible data updates...'; }
          else if (hasAppUpdates) { updateType = 'app'; reloadText = 'Applying app updates...'; }
          
          sessionStorage.setItem('kjb_sw_updated', updateType);
          window.dispatchEvent(new CustomEvent('kjb-splash-update', { detail: { message: reloadText } }));
          willReload = true;
          setTimeout(() => {
            window.location.reload();
          }, 1500);
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
  const isAppReady = (!isInitializing && minSplashDone && updateCheckDone && routeLoaded) || failsafeTriggered;
  const showSplash = !isAppReady || !splashDismissed;

  const [renderSplash, setRenderSplash] = useState(true);
  const [fadeSplash, setFadeSplash] = useState(false);

  useEffect(() => {
    if (!showSplash) {
      setFadeSplash(true);
      const t = setTimeout(() => setRenderSplash(false), 280);
      return () => clearTimeout(t);
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
      {renderSplash && <PageLoader isFadingOut={fadeSplash} isReady={isAppReady} onDismiss={() => setSplashDismissed(true)} />}
      {!isInitializing && !authError && (
        <>
          {/* TEST BUTTONS */}
          <div className="fixed bottom-24 right-4 z-50 flex flex-col gap-2 pointer-events-auto">
            <button 
              onClick={() => { 
                localStorage.removeItem('kjb_has_visited_v2');
                localStorage.removeItem('kjb-prompt-dismissed');
                localStorage.removeItem('kjb-install-dismissed');
                window.location.reload(); 
              }}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg"
            >
              TEST FIRST TIME
            </button>
            <button 
              onClick={() => { 
                localStorage.setItem('kjb_has_visited_v2', 'true');
                window.location.reload(); 
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg"
            >
              TEST SUBSEQUENT
            </button>
          </div>
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
        </>
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