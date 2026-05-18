import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Heart, Library, Info, Moon, Sun, SunMoon, Settings, Menu, X, Bookmark, ChevronLeft, ChevronDown, ChevronRight, RotateCw } from 'lucide-react';
import { useTheme } from '@/lib/themeContext';
import BibleSearchBar from '@/components/bible/BibleSearchBar';
import FirstLoadPrompt from '@/components/FirstLoadPrompt';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { requestNotificationPermission, scheduleDailyNotification } from '@/lib/notifications';
import { getDailyVerse } from '@/lib/dailyVerse';

const NAV_ITEMS = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/read', icon: BookOpen, label: 'Read' },
  { path: '/gospel', icon: Heart, label: 'Gospel' },
  { path: '/resources', icon: Library, label: 'Resources' },
  { path: '/about', icon: Info, label: 'About' },
  { path: '/saved', icon: Bookmark, label: 'Saved' },
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
  { path: '/about', icon: Info, label: 'About' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout() {
  const { pathname } = useLocation();
  const { isDark, mode, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const isRoot = pathname === '/';

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {!isRoot ? (
            <button
              onClick={() => {
                navigate(-1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex-shrink-0"
              aria-label="Go back"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="font-sans text-sm font-medium hidden sm:block">Back</span>
            </button>
          ) : (
            <Link
              to="/"
              className="flex items-center gap-2 flex-shrink-0"
              onClick={() => {
                setMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <img src="https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png" alt="KJB Reader" className="h-10 w-auto" />
              <span className="font-serif text-lg font-bold text-foreground hidden sm:block">The Holy Bible</span>
            </Link>
          )}

          <div className="flex-1 max-w-xs">
            <BibleSearchBar onClose={() => setMenuOpen(false)} />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Refresh"
            >
              <RotateCw className="w-4 h-4" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {mode === 'auto' ? <SunMoon className="w-4 h-4" /> : isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Open menu"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 top-14 z-40 bg-background/95"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute top-14 right-0 left-0 z-50 bg-card backdrop-blur-md border-b border-border shadow-lg">
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

      <main className="flex-1 pb-16 sm:pb-0">
        <Outlet />
      </main>

      <BottomNav pathname={pathname} navigate={navigate} />

      <footer className="hidden sm:block border-t border-border bg-card/80 py-4 mt-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4 mb-3">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    setMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    </div>
  );
}

function BottomNav({ pathname, navigate }) {
  const scrollRef = React.useRef(null);
  const [showArrow, setShowArrow] = useState(false);
  const { showPrompt, isInstallable, notifPermission, handleInstall, handleEnableNotif, handleDismiss } = useBottomNavPrompt();

  const ALL_NAV_ITEMS = [
    ...BOTTOM_NAV_PRIMARY,
    ...BOTTOM_NAV_SECONDARY,
  ];

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  React.useEffect(() => {
    checkScroll();
  }, []);

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border">
      <div className="relative">
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex items-center px-2 py-1 overflow-x-auto scrollbar-hide"
          style={{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }}
        >
          {ALL_NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = item.path === '/' ? pathname === '/' : pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setTimeout(() => navigate(item.path), 150);
                }}
                className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-lg transition-colors shrink-0 ${
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-sans text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
        {showArrow && (
          <button
            onClick={scrollRight}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-card/95 backdrop-blur p-1.5 rounded-full shadow-lg border border-border"
          >
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        )}
      </div>
      {showPrompt && (
        <FirstLoadPrompt
          isInstallable={isInstallable}
          notifPermission={notifPermission}
          onInstall={handleInstall}
          onEnableNotif={handleEnableNotif}
          onDismiss={handleDismiss}
        />
      )}
    </nav>
  );
}

function useBottomNavPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const { isInstallable, promptInstall, dismiss, wasDismissed } = useInstallPrompt();
  const [notifPermission, setNotifPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');

  useEffect(() => {
    if (wasDismissed()) return;
    const timer = setTimeout(() => setShowPrompt(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showPrompt) return;
    const handleInteraction = () => {
      dismiss();
      setShowPrompt(false);
    };
    document.addEventListener('click', handleInteraction, { once: true });
    document.addEventListener('touchstart', handleInteraction, { once: true });
    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [showPrompt]);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) setShowPrompt(false);
  };

  const handleEnableNotif = async () => {
    const result = await requestNotificationPermission();
    setNotifPermission(result);
    if (result === 'granted') {
      scheduleDailyNotification(getDailyVerse());
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    dismiss();
    setShowPrompt(false);
  };

  return { showPrompt, isInstallable, notifPermission, handleInstall, handleEnableNotif, handleDismiss };
}