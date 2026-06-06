import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Heart, Library, Info, Moon, Sun, SunMoon, Settings, Menu, X, Bookmark, ChevronLeft, ChevronDown, ChevronRight, RotateCw, BookMarked, List, Wifi, WifiOff } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { useHeaderHide } from '@/lib/HeaderHideContext';
import BibleSearchBar from '@/components/bible/BibleSearchBar';
import FirstLoadPrompt from '@/components/FirstLoadPrompt';
import ScrollToTop from '@/components/ScrollToTop';
import AutoUpdateHandler from '@/components/AutoUpdateHandler';
import UpdateBanner from '@/components/UpdateBanner';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { requestNotificationPermission, scheduleDailyNotification, getNotificationsEnabled, initNotifications } from '@/lib/notifications';
import { getBibleData, isBibleCached, initPeriodicCacheRefresh, downloadBibleForOffline, refreshCacheIfDue, CACHE_VERSION } from '@/lib/bibleCache';
import { toast } from 'sonner';
import { useSoftReload } from '@/lib/SoftReloadContext';
import { getAccessibilityFont, applyAccessibilityFont } from '@/lib/accessibilityFont';

const scrollMainToTop = () => {
  const el = document.getElementById('kjb-scroll');
  if (el) el.scrollTo({ top: 0, behavior: 'smooth' });
  else window.scrollTo({ top: 0, behavior: 'smooth' });
};

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/contents', icon: List, label: 'Contents' },
  { path: '/read', icon: BookOpen, label: 'Read' },
  { path: '/gospel', icon: Heart, label: 'Gospel' },
  { path: '/resources', icon: Library, label: 'Resources' },
  { path: '/saved', icon: Bookmark, label: 'Saved' },
  { path: '/about', icon: Info, label: 'About' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const BOTTOM_NAV_PRIMARY = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/contents', icon: List, label: 'Contents' },
  { path: '/read', icon: BookOpen, label: 'Read' },
  { path: '/gospel', icon: Heart, label: 'Gospel' },
];

const BOTTOM_NAV_SECONDARY = [
  { path: '/resources', icon: Library, label: 'Resources' },
  { path: '/saved', icon: Bookmark, label: 'Saved' },
  { path: '/about', icon: Info, label: 'About' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout() {
  const { pathname } = useLocation();
  const { isDark, mode, toggleTheme } = useTheme();
  const { hideHeader } = useHeaderHide();
  const { reloadKey, softReload, isReloading } = useSoftReload();
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close hamburger menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Reset the main scroll container to the top on every route change.
  // The reader (/read) manages its own scroll restoration, so skip it there.
  useEffect(() => {
    if (pathname === '/read') return;
    const el = document.getElementById('kjb-scroll');
    if (el) el.scrollTo({ top: 0 });
  }, [pathname]);

  // Close hamburger menu on any outside tap/click (excluding the menu itself and the toggle button)
  useEffect(() => {
    if (!menuOpen) return;
    const handleOutside = (e) => {
      const target = e.target;
      if (target.closest('[data-kjb-menu]') || target.closest('[data-kjb-menu-toggle]')) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [menuOpen]);
  const [footerMode, setFooterMode] = useState(() => {
    try {
      const saved = localStorage.getItem('kjb-footer-mode');
      return ['two', 'one', 'bar', 'none'].includes(saved) ? saved : 'one';
    } catch { return 'one'; }
  });
  useEffect(() => {
    const onStorage = () => {
      try {
        const saved = localStorage.getItem('kjb-footer-mode');
        setFooterMode(['two', 'one', 'bar', 'none'].includes(saved) ? saved : 'one');
      } catch {}
    };
    window.addEventListener('kjb-footer-mode-change', onStorage);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('kjb-footer-mode-change', onStorage);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  // Footer is always visible on desktop, controlled by bottom nav on mobile
  const navigate = useNavigate();
  const isRoot = pathname === '/';

  // FirstLoadPrompt state (centralized in AppLayout)
  const { isInstallable, notifPermission, handleInstall, handleEnableNotif, handleDismiss } = useAppLayoutPrompt();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Apply app-wide accessibility font preference on load
    applyAccessibilityFont(getAccessibilityFont());

    // Auto-update and offline download on app load
    const initializeApp = async () => {
      // Skip entirely when offline — keep using cached data
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        console.log('[AppLayout] Offline — skipping Bible update check');
        return;
      }
      
      try {
        let swUpdated = false;
        if ('serviceWorker' in navigator) {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            await reg.update().catch(() => {});
            // The banner handles user interaction. Just check if an update is pending.
            if (reg.waiting || (reg.installing && reg.installing.state === 'installed')) {
              swUpdated = true;
            }
          }
        }

        if (swUpdated) {
          localStorage.removeItem('kjb-daily-verse-cache');
        }

        const { autoDownloadBibleOnFirstLoad } = await import('@/lib/bibleCache');

        // Use Promise.race to timeout after 30 seconds
        const downloadPromise = autoDownloadBibleOnFirstLoad();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Download timeout')), 30000)
        );

        const result = await Promise.race([downloadPromise, timeoutPromise]);

        console.log('[AppLayout] App initialized', result);
      } catch (err) {
        console.error('[AppLayout] Initialization failed:', err.message);
        // Don't show error to user - app can still work with cached data
      }
    };
    
    // Run initialization shortly after first paint — don't wait for idle so
    // the download starts quickly and users get offline access ASAP.
    setTimeout(initializeApp, 300);

    // Initialize periodic cache refresh (checks every 24 hours when user opens app)
    initPeriodicCacheRefresh();

    // Initialize daily-verse notifications app-wide (not just on HomePage), so the
    // in-page poll is armed regardless of which page the user is on.
    if (getNotificationsEnabled()) {
      initNotifications();
    }

    // When device comes back online and has no cache yet, download the Bible
    // so they get offline access. If already cached, do nothing.
    const handleOnline = async () => {
      try {
        const { isBibleCached, autoDownloadBibleOnFirstLoad } = await import('@/lib/bibleCache');
        const cached = await isBibleCached();
        if (cached) return; // already have it — don't re-download
        console.log('[AppLayout] Back online, no cache — downloading Bible');
        const result = await autoDownloadBibleOnFirstLoad();
        // Silent — no toast needed
      } catch (err) {
        console.error('[AppLayout] Online handler failed:', err.message);
      }
    };
    window.addEventListener('online', handleOnline);

    // Show prompt once per session, after a delay
    const alreadyInstalled = window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone;
    const notifGranted = 'Notification' in window && Notification.permission === 'granted';
    const dismissed = localStorage.getItem('kjb-prompt-dismissed') === 'true' || localStorage.getItem('kjb-install-dismissed') === 'true';

    // If installed but notifications not enabled, always prompt (ignore dismissal)
    if (alreadyInstalled && !notifGranted) {
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
    // Otherwise, respect dismissal and skip when already installed
    if (!alreadyInstalled && !dismissed) {
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismissPrompt = () => {
    setShowPrompt(false);
    handleDismiss();
  };

  return (
    <AutoUpdateHandler>
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className={`border-b border-border bg-card/95 backdrop-blur-md z-50 flex-shrink-0 ${hideHeader ? 'hidden' : ''}`} style={{ paddingTop: 'env(safe-area-inset-top)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
        <div className="w-full px-5 sm:px-12 lg:px-16 h-14 flex items-center gap-2 sm:gap-3">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => {
              setMenuOpen(false);
              scrollMainToTop();
            }}
            className="flex items-center gap-2 flex-shrink-0 pointer-events-auto"
          >
            <img src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png" alt="KJB Reader" className="h-8 w-auto" />
          </Link>

          {/* Search - expands to fill all available space so icons sit flush right */}
          <div className="flex-1 min-w-0 pointer-events-auto">
            <BibleSearchBar onClose={() => setMenuOpen(false)} />
          </div>

          {/* Actions - responsive button sizes with visible square touch targets */}
          <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
            <button 
              className={`w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg border transition-all duration-200 flex items-center justify-center cursor-pointer touch-manipulation ${isOnline ? 'border-border bg-secondary/30 text-green-600 dark:text-green-400 hover:bg-secondary/50' : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/20 dark:border-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/40'}`}
              onClick={(e) => { 
                e.stopPropagation(); 
                window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: isOnline ? 'You are online' : 'You are offline (reading from cache)', status: 'info' } }));
                setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 8000);
              }}
              title={isOnline ? 'Online' : 'Offline'}
              type="button"
            >
              {isOnline ? <Wifi className="w-4 h-4 pointer-events-none" /> : <WifiOff className="w-4 h-4 pointer-events-none" />}
            </button>
            <button className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 active:bg-secondary transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer touch-manipulation"
              onClick={async (e) => {
                e.stopPropagation();
                try { window.dispatchEvent(new Event('kjb-close-popovers')); } catch {}
                if (refreshing) return;

                // Offline: don't try to fetch — just confirm cached data is in use
                if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'Offline — using cached Bible', status: 'info' } }));
                setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 8000);
                return;
                }

                setRefreshing(true);
                window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'Checking for updates...' } }));
                try {
                  let swUpdated = false;
                  if ('serviceWorker' in navigator) {
                    const reg = await navigator.serviceWorker.getRegistration();
                    if (reg) {
                      await reg.update().catch(() => {});
                      if (reg.waiting) {
                        swUpdated = true;
                        // Tell waiting worker to skip waiting to apply the update immediately
                        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                      } else if (reg.installing) {
                        if (reg.installing.state === 'installed') {
                          swUpdated = true;
                          reg.installing.postMessage({ type: 'SKIP_WAITING' });
                        } else {
                          await new Promise(resolve => {
                            const worker = reg.installing;
                            worker.addEventListener('statechange', () => {
                              if (worker.state === 'installed') {
                                swUpdated = true;
                                worker.postMessage({ type: 'SKIP_WAITING' });
                                resolve();
                              } else if (worker.state === 'redundant') {
                                resolve();
                              }
                            });
                            setTimeout(resolve, 5000);
                          });
                        }
                      }
                    }
                  }

                  // Check if the remote Bible file has actually changed via ETag/Last-Modified
                  const { checkForUpdates } = await import('@/lib/bibleCache');
                  const bibleNeedsUpdate = await checkForUpdates();

                  if (bibleNeedsUpdate && swUpdated) {
                    window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'Updating app & Bible data...' } }));
                  } else if (bibleNeedsUpdate) {
                    window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'Updating Bible data...' } }));
                  } else if (swUpdated) {
                    window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'Updating app...' } }));
                  }

                  if (bibleNeedsUpdate) {
                    localStorage.removeItem('bible_cache_version');
                    localStorage.removeItem('bible_last_refresh');
                    await downloadBibleForOffline();
                  }
                  
                  // Ensure the checking message is visible for at least a brief moment so it doesn't flash
                  await new Promise(r => setTimeout(r, 600));
                  
                  window.dispatchEvent(new Event('kjb-progress-clear'));
                  if (swUpdated && bibleNeedsUpdate) {
                    localStorage.removeItem('kjb-daily-verse-cache');
                    window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'App & Bible updated successfully. Reloading...', status: 'success' } }));
                    setTimeout(() => window.location.reload(), 1500);
                  } else if (swUpdated) {
                    localStorage.removeItem('kjb-daily-verse-cache');
                    window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'App updated successfully. Reloading...', status: 'success' } }));
                    setTimeout(() => window.location.reload(), 1500);
                  } else if (bibleNeedsUpdate) {
                    window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'Bible updated successfully.', status: 'success' } }));
                    setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 8000);
                    setRefreshing(false);
                    softReload();
                  } else {
                    window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'App & Bible are up to date.', status: 'info' } }));
                    setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 8000);
                    setRefreshing(false);
                  }
                } catch (err) {
                  console.error('Refresh failed:', err);
                  window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'Failed to check for updates', status: 'error' } }));
                  setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 8000);
                  setRefreshing(false);
                }
              }}
              type="button"
              aria-label="Refresh and update cache"
            >
              <RotateCw className={`w-4 h-4 pointer-events-none ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 active:bg-secondary transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer touch-manipulation"
              onClick={async (e) => {
                e.stopPropagation();
                try { window.dispatchEvent(new Event('kjb-close-popovers')); } catch {}
                if (refreshing) return;

                // Offline: don't try to fetch — just confirm cached data is in use
                if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'Offline — using cached Bible', status: 'info' } }));
                setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 8000);
                return;
                }

                setRefreshing(true);
                window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'Checking for updates...' } }));
                try {
                  let swUpdated = false;
                  if ('serviceWorker' in navigator) {
                    const reg = await navigator.serviceWorker.getRegistration();
                    if (reg) {
                      await reg.update().catch(() => {});
                      if (reg.waiting) {
                        swUpdated = true;
                        // Reg is waiting, we do not force reload. It will apply on next restart.
                      } else if (reg.installing) {
                        if (reg.installing.state === 'installed') {
                          swUpdated = true;
                        } else {
                          await new Promise(resolve => {
                            const worker = reg.installing;
                            worker.addEventListener('statechange', () => {
                              if (worker.state === 'installed') {
                                swUpdated = true;
                                resolve();
                              } else if (worker.state === 'redundant') {
                                resolve();
                              }
                            });
                            setTimeout(resolve, 5000);
                          });
                        }
                      }
                    }
                  }

                  const { checkForUpdates, downloadBibleForOffline } = await import('@/lib/bibleCache');
                  const bibleNeedsUpdate = await checkForUpdates();

                  if (bibleNeedsUpdate) {
                    window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'Updating Bible data...' } }));
                    localStorage.removeItem('bible_cache_version');
                    localStorage.removeItem('bible_last_refresh');
                    await downloadBibleForOffline();
                  }
                  
                  window.dispatchEvent(new Event('kjb-progress-clear'));
                  if (swUpdated || bibleNeedsUpdate) {
                    window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'Updates downloaded. They will apply naturally on your next navigation.', status: 'success' } }));
                    setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 8000);
                    setRefreshing(false);
                    if (bibleNeedsUpdate) {
                      softReload();
                    }
                  } else {
                    window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'App & Bible are up to date.', status: 'info' } }));
                    setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 8000);
                    setRefreshing(false);
                  }
                } catch (err) {
                  console.error('Refresh failed:', err);
                  window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'Failed to check for updates', status: 'error' } }));
                  setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 8000);
                  setRefreshing(false);
                }
              }}
              type="button"
              aria-label="Check for updates"
            >
              <RotateCw className={`w-4 h-4 pointer-events-none ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 active:bg-secondary transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer touch-manipulation"
              onClick={(e) => { e.stopPropagation(); try { window.dispatchEvent(new Event('kjb-close-popovers')); } catch {} toggleTheme(); }}
              type="button"
              aria-label="Toggle theme"
            >
              {mode === 'auto' ? <SunMoon className="w-4 h-4 pointer-events-none transition-transform duration-200" /> : isDark ? <Moon className="w-4 h-4 pointer-events-none transition-transform duration-200" /> : <Sun className="w-4 h-4 pointer-events-none transition-transform duration-200" />}
            </button>
            <button data-kjb-menu-toggle className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-lg border border-border bg-secondary/30 hover:bg-secondary/50 active:bg-secondary transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer touch-manipulation"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); }}
              type="button"
              aria-label="Open menu"
            >
              {menuOpen ? <X className="w-4 h-4 pointer-events-none transition-transform duration-200" /> : <Menu className="w-4 h-4 pointer-events-none transition-transform duration-200" />}
            </button>
          </div>
        </div>

        <UpdateBanner />
        
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 top-14 z-40 bg-background/95"
              onClick={() => setMenuOpen(false)}
            />
            <div data-kjb-menu className="absolute top-full right-0 left-0 z-50 bg-card backdrop-blur-md border-b border-border shadow-lg">
              <div className="w-full px-5 sm:px-12 lg:px-16 py-3 grid grid-cols-2 sm:grid-cols-4 gap-1">
                {NAV_ITEMS.map(item => {
                  const Icon = item.icon;
                  const active = item.path === '/' ? pathname === '/' : pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        setMenuOpen(false);
                        scrollMainToTop();
                        navigate(item.path);
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-sans text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0 transition-transform duration-200" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </header>

      <main id="kjb-scroll" className="flex-1 overflow-y-auto pb-[calc(5rem+env(safe-area-inset-bottom))] sm:!pb-0 px-1 sm:px-2 relative">
        {isReloading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm kjb-fade-in">
            <RotateCw className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}
        <div key={reloadKey} className={isReloading ? 'opacity-50 pointer-events-none' : ''}>
          <Outlet />
        </div>
      </main>

      <BottomNav pathname={pathname} navigate={navigate} />

      {/* Scroll to top button - appears on all pages when scrolling */}
      <ScrollToTop />

      {/* FirstLoadPrompt - shows once per session */}
      {showPrompt && (
        <FirstLoadPrompt
          isInstallable={isInstallable}
          notifPermission={notifPermission}
          onInstall={handleInstall}
          onEnableNotif={handleEnableNotif}
          onDismiss={handleDismissPrompt}
        />
      )}

      <DesktopFooter navigate={navigate} setMenuOpen={setMenuOpen} />
    </div>
    </AutoUpdateHandler>
  );
}

function DesktopFooter({ navigate, setMenuOpen }) {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem('kjb-desktop-footer-open') !== 'false'; } catch { return true; }
  });
  const toggle = () => {
    setOpen(o => {
      const next = !o;
      try { localStorage.setItem('kjb-desktop-footer-open', String(next)); } catch {}
      return next;
    });
  };
  return (
      <footer className={`hidden sm:block border-t border-border bg-card/80 flex-shrink-0 ${open ? 'py-3' : 'py-0.5'}`}>
        <div className="max-w-5xl mx-auto px-4">
          <div className={`flex justify-center ${open ? 'mb-2' : 'mb-0'}`}>
            <button
              onClick={toggle}
              className={`flex items-center gap-1.5 px-3 rounded-lg font-sans text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ${open ? 'py-1' : 'py-0.5'}`}
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? '' : 'rotate-180'}`} />
            </button>
          </div>
          {open && (
          <>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-3">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    setMenuOpen(false);
                    scrollMainToTop();
                    navigate(item.path);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Icon className="w-3.5 h-3.5 transition-transform duration-200" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <p className="text-center font-sans text-xs text-muted-foreground">
            Bible text from{' '}
            <a href="https://bibleprotector.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
              bibleprotector.com
            </a>
            {' '}· Created with{' '}
            <a href="https://base44.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition-colors">
              Base44
            </a>
          </p>
          </>
          )}
        </div>
      </footer>
  );
}

function useAppLayoutPrompt() {
  const installPromptResult = useInstallPrompt();
  const { isInstallable, isInstalled, promptInstall, dismiss } = installPromptResult;
  
  const [notifPermission, setNotifPermission] = useState(() => {
    if (!('serviceWorker' in navigator)) return 'unsupported';
    if (!('Notification' in window)) return 'supported';
    return Notification.permission;
  });
  const [notifEnabled, setNotifEnabled] = useState(() => getNotificationsEnabled());

  const handleInstall = async () => {
    const accepted = await promptInstall();
    return accepted;
  };

  const handleEnableNotif = async () => {
    try {
      const result = await requestNotificationPermission();
      setNotifPermission(result);
      if (result === 'granted' || result === 'unsupported') {
        scheduleDailyNotification();
        setNotifEnabled(true);
        window.dispatchEvent(new Event('storage'));
      } else if (result === 'denied') {
        alert('Notifications are blocked. Please allow notifications in your browser/app settings for this site.');
      }
    } catch (err) {
      console.error('Notification permission error:', err);
    }
  };

  const handleDismiss = () => {
    dismiss();
    try { localStorage.setItem('kjb-prompt-dismissed', 'true'); } catch {}
  };

  return { isInstallable, notifPermission, handleInstall, handleEnableNotif, handleDismiss };
}

function BottomNav({ pathname, navigate }) {
  const [showMode, setShowMode] = useState(() => {
    try {
      const saved = localStorage.getItem('kjb-footer-mode');
      // Migrate old 'none' value to 'bar'
      if (saved === 'none') return 'bar';
      return ['two', 'one', 'bar'].includes(saved) ? saved : 'one';
    } catch { return 'one'; }
  });

  const cycleShowMode = () => {
    // Cycle: two rows → one row → bar (centered chevron only) → two rows
    const next =
      showMode === 'two' ? 'one' :
      showMode === 'one' ? 'bar' :
      'two';
    setShowMode(next);
    try { localStorage.setItem('kjb-footer-mode', next); } catch {}
    try { window.dispatchEvent(new Event('kjb-footer-mode-change')); } catch {}
  };

  // Bar mode - ultra-thin footer strip with only the chevron toggle (no icons)
  if (showMode === 'bar') {
    return (
      <nav className="sm:hidden fixed left-0 right-0 bottom-0 z-50 bg-card/80 backdrop-blur-md border-t border-border/50" style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); cycleShowMode(); }}
          className="w-full h-4 flex items-center justify-center text-muted-foreground/50 hover:text-foreground active:bg-secondary/50 transition-all duration-200"
          title="Toggle navigation"
        >
          <ChevronDown className="w-3 h-3 rotate-180 transition-transform duration-200" />
        </button>
      </nav>
    );
  }

  return (
    <nav className="sm:hidden fixed left-0 right-0 bottom-0 z-50 bg-card/95 backdrop-blur-md border-t border-border overflow-hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
      <div className="w-full">
        {/* Primary row: 5 nav items + chevron toggle button */}
        <div className="flex items-stretch">
          {BOTTOM_NAV_PRIMARY.map(item => {
            const Icon = item.icon;
            const active = item.path === '/' ? pathname === '/' : pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  scrollMainToTop();
                  setTimeout(() => navigate(item.path), 150);
                }}
                className="flex flex-col items-center justify-center flex-1 h-11 active:bg-secondary/50 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <Icon className={`w-4 h-4 mb-0.5 ${active ? 'text-primary' : 'text-muted-foreground'} transition-transform duration-200`} />
                <span className={`font-sans text-[10px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
              </button>
            );
          })}
          {/* Chevron toggle - inline in primary row */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); cycleShowMode(); }}
            className="w-8 flex items-center justify-center text-muted-foreground hover:text-foreground active:bg-secondary/50 transition-all duration-200 hover:scale-105 active:scale-95 shrink-0 border-l border-border"
            title="Toggle navigation rows"
          >
            <ChevronDown className="w-3.5 h-3.5 transition-transform duration-200" />
          </button>
        </div>

        {/* Secondary row - shown when two rows - 4 per line */}
        {showMode === 'two' && (
          <div className="grid grid-cols-4 border-t border-border">
            {BOTTOM_NAV_SECONDARY.map(item => {
              const Icon = item.icon;
              const active = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollMainToTop();
                    navigate(item.path);
                  }}
                  className="flex flex-col items-center justify-center w-full h-11 active:bg-secondary/50 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Icon className={`w-4 h-4 mb-0.5 ${active ? 'text-primary' : 'text-muted-foreground'} transition-transform duration-200`} />
                  <span className={`font-sans text-[10px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}