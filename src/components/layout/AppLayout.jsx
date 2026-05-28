import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Heart, Library, Info, Moon, Sun, SunMoon, Settings, Menu, X, Bookmark, ChevronLeft, ChevronDown, ChevronRight, RotateCw, BookMarked, List } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { useHeaderHide } from '@/lib/HeaderHideContext';
import BibleSearchBar from '@/components/bible/BibleSearchBar';
import FirstLoadPrompt from '@/components/FirstLoadPrompt';
import ScrollToTop from '@/components/ScrollToTop';
import AutoUpdateHandler from '@/components/AutoUpdateHandler';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { requestNotificationPermission, scheduleDailyNotification, getNotificationsEnabled, showLocalNotification } from '@/lib/notifications';
import { getDailyVerse } from '@/lib/dailyVerse';
import { getBibleData, isBibleCached, initPeriodicCacheRefresh, downloadBibleForOffline, refreshCacheIfDue } from '@/lib/bibleCache';
import { toast } from 'sonner';
import { useSoftReload } from '@/lib/SoftReloadContext';

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
  const { reloadKey, softReload } = useSoftReload();
  const [menuOpen, setMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Close hamburger menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
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
    // Ensure default is standard font (not dyslexic)
    try {
      const saved = localStorage.getItem('kjb-dyslexic-font');
      if (saved === null) {
        localStorage.setItem('kjb-dyslexic-font', 'false');
      }
      if (saved === 'true') {
        document.documentElement.setAttribute('data-dyslexic-font', 'true');
      } else {
        document.documentElement.removeAttribute('data-dyslexic-font');
      }
    } catch {}

    // Auto-update and offline download on app load
    const initializeApp = async () => {
      // Skip entirely when offline — keep using cached data
      if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        console.log('[AppLayout] Offline — skipping Bible update check');
        return;
      }
      try {
        const { autoDownloadBibleOnFirstLoad } = await import('@/lib/bibleCache');

        // Use Promise.race to timeout after 30 seconds
        const downloadPromise = autoDownloadBibleOnFirstLoad();
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Download timeout')), 30000)
        );

        const result = await Promise.race([downloadPromise, timeoutPromise]);

        // Only show toast when something actually changed
        if (result?.updated) {
          toast.success('📖 Bible updated to latest version');
        } else if (result?.downloaded) {
          toast.success('📖 Bible downloaded for offline access');
        }

        console.log('[AppLayout] App initialized');
      } catch (err) {
        console.error('[AppLayout] Initialization failed:', err.message);
        // Don't show error to user - app can still work with cached data
      }
    };
    
    // Run initialization in background to avoid blocking UI
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initializeApp, { timeout: 10000 });
    } else {
      setTimeout(initializeApp, 500);
    }

    // Initialize periodic cache refresh (checks every 24 hours when user opens app)
    initPeriodicCacheRefresh();

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
    <div className="min-h-screen bg-background flex flex-col">
      <header className={`border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50 ${hideHeader ? 'hidden' : ''}`} style={{ paddingTop: 'env(safe-area-inset-top)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
        <div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center gap-2 sm:gap-3">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => {
              setMenuOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 flex-shrink-0 pointer-events-auto"
          >
            <img src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png" alt="KJB Reader" className="h-8 w-auto" />
          </Link>

          {/* Search - expands to fill space, capped on desktop */}
          <div className="flex-1 min-w-0 sm:max-w-xs pointer-events-auto">
            <BibleSearchBar onClose={() => setMenuOpen(false)} />
          </div>

          {/* Actions - responsive button sizes with visible square touch targets */}
          <div className="flex items-center gap-0.5 sm:gap-2 pointer-events-none shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 pointer-events-auto shrink-0 rounded-lg bg-secondary/30 hover:bg-secondary/50 active:bg-secondary transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
              onClick={async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (refreshing) return;

                // Offline: don't try to fetch — just confirm cached data is in use
                if (typeof navigator !== 'undefined' && navigator.onLine === false) {
                  toast.info('Offline — using cached Bible');
                  return;
                }

                setRefreshing(true);
                const checkToastId = toast.loading('Checking for updates…');
                try {
                  // Check version first - only recache if changed
                  const remoteVer = await fetch('https://media.base44.com/files/public/6a05adcee684459ea05d28a4/VERSION.txt?t=' + Date.now())
                    .then(r => r.text())
                    .then(t => t.trim());
                  const localVer = localStorage.getItem('bible_cache_version');

                  if (localVer && remoteVer !== localVer) {
                    // Actual new version available
                    toast.loading('New version found — updating Bible data…', { id: checkToastId });
                    localStorage.removeItem('bible_cache_version');
                    localStorage.removeItem('bible_last_refresh');
                    await downloadBibleForOffline();
                    toast.loading('Reloading…', { id: checkToastId });
                    setTimeout(() => toast.dismiss(checkToastId), 1200);
                    softReload('Bible updated, refreshing…');
                  } else {
                    toast.success('✅ Already up to date', { id: checkToastId });
                  }
                } catch (err) {
                  console.error('Refresh failed:', err);
                  toast.error('Failed to check for updates', { id: checkToastId });
                }
                setRefreshing(false);
              }}
              style={{ touchAction: 'manipulation' }}
              role="button"
              aria-label="Refresh and update cache"
            >
              <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 pointer-events-auto shrink-0 rounded-lg bg-secondary/30 hover:bg-secondary/50 active:bg-secondary transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTheme(); }}
              style={{ touchAction: 'manipulation' }}
              role="button"
              aria-label="Toggle theme"
            >
              {mode === 'auto' ? <SunMoon className="w-4 h-4 transition-transform duration-200" /> : isDark ? <Moon className="w-4 h-4 transition-transform duration-200" /> : <Sun className="w-4 h-4 transition-transform duration-200" />}
            </div>
            <div data-kjb-menu-toggle className="w-9 h-9 sm:w-10 sm:h-10 pointer-events-auto shrink-0 rounded-lg bg-secondary/30 hover:bg-secondary/50 active:bg-secondary transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(o => !o); }}
              style={{ touchAction: 'manipulation' }}
              role="button"
              aria-label="Open menu"
            >
              {menuOpen ? <X className="w-4 h-4 transition-transform duration-200" /> : <Menu className="w-4 h-4 transition-transform duration-200" />}
            </div>
          </div>
        </div>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 top-14 z-40 bg-background/95"
              onClick={() => setMenuOpen(false)}
            />
            <div data-kjb-menu className="absolute top-full right-0 left-0 z-50 bg-card backdrop-blur-md border-b border-border shadow-lg">
              <div className="max-w-4xl mx-auto px-4 py-3 grid grid-cols-2 sm:grid-cols-4 gap-1">
                {NAV_ITEMS.map(item => {
                  const Icon = item.icon;
                  const active = item.path === '/' ? pathname === '/' : pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        setMenuOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
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

      <main className="flex-1 pb-24 sm:pb-0 px-1 sm:px-2">
        <div key={reloadKey}>
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
      <footer className="hidden sm:block border-t border-border bg-card/80 py-3 mt-4">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex justify-center mb-2">
            <button
              onClick={toggle}
              className="flex items-center gap-1.5 px-3 py-1 rounded-lg font-sans text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              {open ? 'Hide menu' : 'Show menu'}
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
                    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        scheduleDailyNotification(getDailyVerse());
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

  // Bar mode - thin footer strip with only the chevron toggle (no icons)
  if (showMode === 'bar') {
    return (
      <nav className="sm:hidden fixed left-0 right-0 bottom-0 z-50 bg-card/95 backdrop-blur-md border-t border-border" style={{ paddingBottom: 'env(safe-area-inset-bottom)', paddingLeft: 'env(safe-area-inset-left)', paddingRight: 'env(safe-area-inset-right)' }}>
        <button
          type="button"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); cycleShowMode(); }}
          className="w-full h-6 flex items-center justify-center text-muted-foreground hover:text-foreground active:bg-secondary/50 transition-all duration-200"
          title="Toggle navigation"
        >
          <ChevronDown className="w-3.5 h-3.5 rotate-180 transition-transform duration-200" />
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
                  window.scrollTo({ top: 0, behavior: 'smooth' });
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
                    window.scrollTo({ top: 0, behavior: 'smooth' });
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