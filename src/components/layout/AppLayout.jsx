import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Heart, Library, Info, Moon, Sun, SunMoon, Settings, Menu, X, Bookmark, ChevronLeft, ChevronDown, ChevronRight, RotateCw, BookMarked, EyeOff, Eye } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import { useHeaderHide } from '@/lib/HeaderHideContext';
import BibleSearchBar from '@/components/bible/BibleSearchBar';
import FirstLoadPrompt from '@/components/FirstLoadPrompt';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { requestNotificationPermission, scheduleDailyNotification, getNotificationsEnabled } from '@/lib/notifications';
import { getDailyVerse } from '@/lib/dailyVerse';
import { getBibleData, isBibleCached } from '@/lib/bibleCache';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/read', icon: BookOpen, label: 'Read' },
  { path: '/gospel', icon: Heart, label: 'Gospel' },
  { path: '/resources', icon: Library, label: 'Resources' },
  { path: '/saved', icon: Bookmark, label: 'Saved' },
  { path: '/daily-reading', icon: BookMarked, label: 'Daily Reading' },
  { path: '/about', icon: Info, label: 'About' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

const BOTTOM_NAV_PRIMARY = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/read', icon: BookOpen, label: 'Read' },
  { path: '/gospel', icon: Heart, label: 'Gospel' },
  { path: '/resources', icon: Library, label: 'Resources' },
  { path: '/saved', icon: Bookmark, label: 'Saved' },
];

const BOTTOM_NAV_SECONDARY = [
  { path: '/daily-reading', icon: BookMarked, label: 'Daily Reading' },
  { path: '/resources', icon: Library, label: 'Resources' },
  { path: '/about', icon: Info, label: 'About' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout() {
  const { pathname } = useLocation();
  const { isDark, mode, toggleTheme } = useTheme();
  const { hideHeader } = useHeaderHide();
  const [menuOpen, setMenuOpen] = useState(false);
  const [footerHidden, setFooterHidden] = useState(false);
  const navigate = useNavigate();
  const isRoot = pathname === '/';

  // FirstLoadPrompt state (centralized in AppLayout)
  const { isInstallable, notifPermission, handleInstall, handleEnableNotif, handleDismiss } = useAppLayoutPrompt();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[SW] Registered:', registration.scope);
        })
        .catch((err) => {
          console.error('[SW] Registration failed:', err);
        });
    }

    // Silently pre-cache all 66 books in the background on first load
    isBibleCached().then(cached => {
      if (!cached) {
        console.log('[CACHE] Not cached yet — pre-fetching in background...');
        getBibleData().catch(err => console.warn('[CACHE] Background fetch failed:', err));
      }
    });

    // Only show prompt once per session, after a delay, if not dismissed
    const alreadyInstalled = window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone;
    const dismissed = localStorage.getItem('kjb-prompt-dismissed') === 'true' || localStorage.getItem('kjb-install-dismissed') === 'true';
    if (!alreadyInstalled && !dismissed) {
      const timer = setTimeout(() => setShowPrompt(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []); // Only run once on mount

  const handleDismissPrompt = () => {
    setShowPrompt(false);
    handleDismiss();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className={`border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50 ${hideHeader ? 'hidden' : ''}`} style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-2 sm:gap-3">
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

          {/* Search - expands to fill space */}
          <div className="flex-1 min-w-0 pointer-events-auto">
            <BibleSearchBar onClose={() => setMenuOpen(false)} />
          </div>

          {/* Actions - responsive button sizes with visible square touch targets */}
          <div className="flex items-center gap-1 sm:gap-2 pointer-events-none shrink-0">
            <div className="w-10 h-10 pointer-events-auto shrink-0 rounded-lg bg-secondary/30 hover:bg-secondary/50 active:bg-secondary transition-colors flex items-center justify-center cursor-pointer"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.reload(); }}
              style={{ touchAction: 'manipulation' }}
              role="button"
              aria-label="Refresh"
            >
              <RotateCw className="w-4 h-4" />
            </div>
            <div className="w-10 h-10 pointer-events-auto shrink-0 rounded-lg bg-secondary/30 hover:bg-secondary/50 active:bg-secondary transition-colors flex items-center justify-center cursor-pointer"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTheme(); }}
              style={{ touchAction: 'manipulation' }}
              role="button"
              aria-label="Toggle theme"
            >
              {mode === 'auto' ? <SunMoon className="w-4 h-4" /> : isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div className="w-10 h-10 pointer-events-auto shrink-0 rounded-lg bg-secondary/30 hover:bg-secondary/50 active:bg-secondary transition-colors flex items-center justify-center cursor-pointer"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpen(o => !o); }}
              style={{ touchAction: 'manipulation' }}
              role="button"
              aria-label="Open menu"
            >
              {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 top-14 z-40 bg-background/95"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute top-full right-0 left-0 z-50 bg-card backdrop-blur-md border-b border-border shadow-lg">
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
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg font-sans text-sm font-medium transition-colors ${
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-secondary'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </header>

      <main className="flex-1 pb-20 sm:pb-0">
        <Outlet />
      </main>

      <BottomNav pathname={pathname} navigate={navigate} hidden={footerHidden} onToggleHide={() => setFooterHidden(true)} />

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

      {!footerHidden && (
        <footer className="hidden sm:block border-t border-border bg-card/80 py-3 mt-8 relative">
          <button
            onClick={() => { setFooterHidden(true); try { localStorage.setItem('kjb-footer-hidden', 'true'); } catch {} }}
            className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center shadow-sm"
            title="Hide footer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <div className="max-w-5xl mx-auto px-4">
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
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
          </div>
        </footer>
      )}
      {footerHidden && (
        <footer className="hidden sm:block border-t border-border bg-card/80 py-1 mt-8 relative">
          <button
            onClick={() => { setFooterHidden(false); try { localStorage.setItem('kjb-footer-hidden', 'false'); } catch {} }}
            className="w-full h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Show footer"
          >
            <ChevronDown className="w-4 h-4 rotate-180" />
          </button>
        </footer>
      )}
    </div>
  );
}

function useAppLayoutPrompt() {
  const { isInstallable, isInstalled, promptInstall, dismiss } = useInstallPrompt();
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
    console.log('handleEnableNotif called');
    
    if (!('Notification' in window)) {
      console.log('Notification API not available');
      alert('Notifications are not supported in this browser. Try installing the app or using a different browser.');
      return;
    }
    
    try {
      console.log('Requesting notification permission...');
      const result = await requestNotificationPermission();
      console.log('Notification permission result:', result);
      setNotifPermission(result);
      if (result === 'granted') {
        console.log('Permission granted, scheduling notification');
        scheduleDailyNotification(getDailyVerse());
        setNotifEnabled(true);
        window.dispatchEvent(new Event('storage'));
      } else if (result === 'denied') {
        console.log('Permission denied');
        alert('Notifications are blocked. Please allow notifications in your browser/app settings for this site.');
      }
    } catch (err) {
      console.error('Notification permission error:', err);
      alert('Failed to request notification permission. Please try again.');
    }
  };

  const handleDismiss = () => {
    dismiss();
    try { localStorage.setItem('kjb-prompt-dismissed', 'true'); } catch {}
  };

  return { isInstallable, notifPermission, handleInstall, handleEnableNotif, handleDismiss };
}

function BottomNav({ pathname, navigate, hidden, onToggleHide }) {
  const [showMode, setShowMode] = useState(() => {
    try {
      const saved = localStorage.getItem('kjb-footer-mode');
      return saved === 'two' ? 'two' : saved === 'hidden' ? 'hidden' : 'one';
    } catch { return 'one'; }
  });

  const cycleShowMode = () => {
    const next = showMode === 'one' ? 'two' : showMode === 'two' ? 'hidden' : 'one';
    setShowMode(next);
    try { localStorage.setItem('kjb-footer-mode', next); } catch {}
    if (next === 'hidden') onToggleHide?.();
  };

  const chevronIcon = showMode === 'hidden'
    ? <ChevronDown className="w-3.5 h-3.5 rotate-180" />
    : showMode === 'one'
    ? <ChevronDown className="w-3.5 h-3.5" />
    : <ChevronDown className="w-3.5 h-3.5" />;

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-area-pb">
      {showMode === 'hidden' ? (
        /* Collapsed state - just a slim bar with chevron */
        <button
          onClick={() => { cycleShowMode(); }}
          onTouchStart={(e) => { e.preventDefault(); cycleShowMode(); }}
          className="w-full h-8 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors border-t border-border"
          title="Show navigation"
        >
          <ChevronDown className="w-4 h-4 rotate-180" />
        </button>
      ) : (
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
                  className="flex flex-col items-center justify-center flex-1 h-14 active:bg-secondary/50 transition-colors"
                >
                  <Icon className={`w-5 h-5 mb-0.5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                  <span className={`font-sans text-[10px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
                </button>
              );
            })}
            {/* Chevron toggle - inline in primary row */}
            <button
              onClick={() => { cycleShowMode(); onToggleHide?.(); }}
              onTouchStart={(e) => { e.preventDefault(); cycleShowMode(); onToggleHide?.(); }}
              className="w-8 flex items-center justify-center text-muted-foreground hover:text-foreground active:bg-secondary/50 transition-colors shrink-0 border-l border-border"
              title="Toggle navigation rows"
            >
              {showMode === 'two' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5 rotate-180" />}
            </button>
          </div>

          {/* Secondary row - shown when two rows */}
          {showMode === 'two' && (
            <div className="grid grid-cols-4 gap-0 border-t border-border">
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
                    className="flex flex-col items-center justify-center w-full h-12 active:bg-secondary/50 transition-colors"
                  >
                    <Icon className={`w-5 h-5 mb-0.5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                    <span className={`font-sans text-[10px] font-medium ${active ? 'text-primary' : 'text-muted-foreground'}`}>{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}