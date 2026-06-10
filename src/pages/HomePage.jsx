import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Heart, Library, Info, List, Settings, Bell, BellOff, Bookmark, Shuffle, RotateCw, ChevronRight } from 'lucide-react';
import DailyVerseImage from '@/components/bible/DailyVerseImage';
import OfflineStatusBanner from '@/components/OfflineStatusBanner';
import IncognitoWarning from '@/components/IncognitoWarning';
import FirstLoadPrompt from '@/components/FirstLoadPrompt';
import { getDailyVerse, getDailyVerseFromBible, getLastCachedDailyVerse } from '@/lib/dailyVerse';
import { getTodayVerseBackground } from '@/lib/dailyVerseTheme';
import { useTheme } from '@/lib/themeContext';
import { registerSW, scheduleDailyNotification, getNotificationsEnabled, requestNotificationPermission, disableNotifications, showLocalNotification } from '@/lib/notifications';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { isBibleCached, CACHE_VERSION } from '@/lib/bibleCache';
import { toast } from 'sonner';

const READ_LINK = { path: '/read', icon: BookOpen, label: 'Read the Bible', desc: 'KJB Pure Cambridge Edition', color: 'bg-primary text-primary-foreground' };

const QUICK_LINKS = [
  { path: '/contents', icon: List, label: 'Table of Contents', desc: 'Browse all 66 books', color: 'bg-secondary text-secondary-foreground' },
  { path: null, icon: null, label: '__RANDOM__', desc: '', color: '' },
  { path: '/saved', icon: Bookmark, label: 'Saved Verses', desc: 'Your bookmarked verses', color: 'bg-secondary text-secondary-foreground' },
  { path: '/gospel', icon: Heart, label: 'Gospel', desc: 'Learn how to be saved', color: 'bg-secondary text-secondary-foreground' },
  { path: '/resources', icon: Library, label: 'Resources', desc: 'KJB defence & study', color: 'bg-secondary text-secondary-foreground' },
  { path: '/about', icon: Info, label: 'About', desc: 'Ministry & links', color: 'bg-secondary text-secondary-foreground' },
  { path: '/settings', icon: Settings, label: 'Settings', desc: 'Offline downloads & info', color: 'bg-secondary text-secondary-foreground' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { colorMode } = useTheme();
  const dailyBg = getTodayVerseBackground();
  
  const [verse, setVerse] = useState(() => {
    const lastCached = getLastCachedDailyVerse();
    return (lastCached && lastCached.isToday) ? lastCached : null;
  });
  const [isOffline, setIsOffline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine === false);
  const [bibleCached, setBibleCached] = useState(null);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  // Track real network connectivity so the daily card's "Offline" label reflects
  // actual internet status — not merely whether the cached verse fetch succeeded.
  useEffect(() => {
    const updateOnline = () => setIsOffline(navigator.onLine === false);
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);
    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, []);

  // Check if Bible data is fully cached for offline use
  useEffect(() => {
    const checkCache = async () => {
      const cached = await isBibleCached();
      setBibleCached(cached);
    };
    checkCache();
  }, []);

  useEffect(() => {
    // 2. Fetch today's verse in the background quietly
    getDailyVerseFromBible().then(v => {
      console.log("[DEBUG] Verse generated for today:", v?.ref);
      setVerse(v);
      setIsOffline(navigator.onLine === false);
      window.dispatchEvent(new Event('kjb-daily-verse-updated'));
      // Trigger notification if enabled
      scheduleDailyNotification();
    }).catch((err) => {
      console.error("[DEBUG] getDailyVerseFromBible failed:", err);
      setVerse(getDailyVerse());
      setIsOffline(true);
    });
    
    // Preload Bible cache on home page mount to ensure italics are ready
    import('@/lib/bibleCache').then(({ getBibleData }) => {
      getBibleData().catch(() => {});
    });

    // Check frequently to instantly update the verse when midnight hits
    const minuteInterval = setInterval(() => {
      const lastCached = getLastCachedDailyVerse();
      // If we don't have today's verse cached, it's time to update silently
      if (!lastCached || !lastCached.isToday) {
        getDailyVerseFromBible().then(v => {
          setVerse(v);
          setIsOffline(navigator.onLine === false);
          window.dispatchEvent(new Event('kjb-daily-verse-updated'));
        }).catch(() => {
          setVerse(getDailyVerse());
          setIsOffline(true);
        });
      }
    }, 2000);

    return () => {
      clearInterval(minuteInterval);
    };
  }, []);

  const swipedRef = useRef(false);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchEndY.current = e.touches[0].clientY;
    swipedRef.current = false;
  };

  const handleTouchMove = (e) => {
    touchEndY.current = e.touches[0].clientY;
    if (Math.abs(touchEndY.current - touchStartY.current) > 10) {
      swipedRef.current = true;
    }
  };

  const handleTouchEnd = () => {
    if (!swipedRef.current) return;
    
    const pullDistance = touchEndY.current - touchStartY.current;
    
    // Pull down to refresh if at the top of the page
    if (pullDistance > 100 && window.scrollY <= 0) {
      console.log('[UpdateCheck] Pull-to-refresh triggered. Checking for updates...');
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        (async () => {
          try {
            let swUpdated = false;
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.getRegistration();
              if (reg) {
                await reg.update().catch(() => {});
                if (reg.waiting) {
                  swUpdated = true;
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
            console.log(`[UpdateCheck] App code updates found (pull): ${swUpdated}`);
            
            // Check Bible updates
            const { checkForUpdates, downloadBibleForOffline } = await import('@/lib/bibleCache');
            const bibleNeedsUpdate = await checkForUpdates().catch(() => false);
            console.log(`[UpdateCheck] Bible updates found (pull): ${bibleNeedsUpdate}`);

            // Ensure the checking message is visible for at least a brief moment so it doesn't flash
            await new Promise(r => setTimeout(r, 500));

            if (swUpdated || bibleNeedsUpdate) {
              console.log('[UpdateCheck] Updates found (pull). Triggering splash screen and applying...');
              let reloadText = 'Found updates...';
              let updateType = 'app';
              if (swUpdated && bibleNeedsUpdate) { reloadText = 'Found app & Bible updates...'; updateType = 'both'; }
              else if (bibleNeedsUpdate) { reloadText = 'Found Bible data updates...'; updateType = 'bible'; }
              else if (swUpdated) { reloadText = 'Found app updates...'; updateType = 'app'; }
              
              window.dispatchEvent(new Event('kjb-progress-clear'));
              window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: reloadText, status: 'loading' } }));

              await new Promise(r => setTimeout(r, 500));

              if (bibleNeedsUpdate) {
                window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'Installing updates...', status: 'loading' } }));
                console.log('[UpdateCheck] Downloading new Bible data...');
                localStorage.removeItem('bible_cache_version');
                localStorage.removeItem('bible_last_refresh');
                await downloadBibleForOffline();
              } else if (swUpdated) {
                window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'Installing updates...', status: 'loading' } }));
                await new Promise(r => setTimeout(r, 500));
              }

              window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'Applying updates...', status: 'loading' } }));
              await new Promise(r => setTimeout(r, 500));

              sessionStorage.setItem('kjb_sw_updated', updateType);

              if (swUpdated && 'serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration();
                sessionStorage.setItem('kjb_last_app_update', Date.now().toString());
                if (reg && reg.waiting) {
                  reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                } else if (reg && reg.installing && (reg.installing.state === 'installed' || reg.installing.state === 'activating' || reg.installing.state === 'activated')) {
                  reg.installing.postMessage({ type: 'SKIP_WAITING' });
                }
                console.log('[UpdateCheck] Activating new service worker...');
                return; // main.jsx reloads it
              }

              console.log('[UpdateCheck] Reloading application...');
              setTimeout(() => { window.location.href = window.location.pathname + '?refresh=' + Date.now(); }, 500);
              return;
            }

            console.log('[UpdateCheck] No updates found (pull). Loading verse...');
            // If no updates, load the verse
            const v = await getDailyVerseFromBible();
            setVerse(v);
            setIsOffline(false);
            window.dispatchEvent(new Event('kjb-daily-verse-updated'));
            
            window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: "App & Bible are up to date.", status: 'success' } }));
            setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 3000);
            scheduleDailyNotification();
          } catch (e) {
            console.error('[UpdateCheck] Pull-to-refresh check failed:', e);
            setVerse(getDailyVerse());
            setIsOffline(true);
            window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'You are offline.', status: 'info' } }));
            setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 3000);
          }
        })();
      } else {
        getDailyVerseFromBible().then(v => {
          setVerse(v);
          setIsOffline(false);
          window.dispatchEvent(new Event('kjb-daily-verse-updated'));
          window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: "Verse refreshed.", status: 'success' } }));
          setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 3000);
          scheduleDailyNotification();
        }).catch(() => {
          setVerse(getDailyVerse());
          setIsOffline(true);
          window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'You are offline.', status: 'info' } }));
          setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 3000);
        });
      }
    }
  };

  const handleVerseCardClick = () => {
    // Don't navigate if the user was swiping (pull-to-refresh or scroll gesture)
    if (swipedRef.current) {
      swipedRef.current = false;
      return;
    }
    handleVerseClick();
  };

  const [notifEnabled, setNotifEnabled] = useState(getNotificationsEnabled);
  const [notifPermission, setNotifPermission] = useState(() => {
    if (!('serviceWorker' in navigator)) return 'unsupported';
    if (!('Notification' in window)) return 'supported';
    return Notification.permission;
  });

  useEffect(() => {
    // Sync notification state on mount and whenever verse changes
    setNotifEnabled(getNotificationsEnabled());
    
    registerSW();
    // Notification init now runs app-wide in AppLayout, so we don't re-init here
    // (avoids clearing/re-arming the poll timer on every HomePage mount).

    const handleStorageChange = () => {
      const enabled = getNotificationsEnabled();
      setNotifEnabled(enabled);
      if (!('serviceWorker' in navigator)) {
        setNotifPermission('unsupported');
      } else if (!('Notification' in window)) {
        setNotifPermission('supported');
      } else {
        setNotifPermission(Notification.permission);
      }
    };
    
    // Listen for storage events (syncs across tabs/pages)
    window.addEventListener('storage', handleStorageChange);
    
    // Also check on focus and online (when user returns to the app or internet is restored)
    const handleFocus = () => {
      setNotifEnabled(getNotificationsEnabled());
      // Check if it's a new day and update the verse if needed
      const lastCached = getLastCachedDailyVerse();
      // Only fetch if we don't have today's verse cached
      if (!lastCached || !lastCached.isToday) {
        getDailyVerseFromBible().then(v => {
          setVerse(v);
          setIsOffline(navigator.onLine === false);
          window.dispatchEvent(new Event('kjb-daily-verse-updated'));
          scheduleDailyNotification();
        }).catch(() => {
          setVerse(getDailyVerse());
          setIsOffline(true);
        });
      }
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') handleFocus();
    });
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const handleVerseClick = () => {
    // Offline placeholder verse (no real reference) — don't navigate anywhere.
    if (verse.ref === 'Offline Mode' || verse.book === 'Offline') {
      return;
    }
    // Resolve the reader's book abbreviation from the full book name. We do NOT
    // trust verse.abbr from the API — it uses a different abbreviation scheme
    // (e.g. "1Jo" for 1 John) that the reader can't resolve, which previously
    // caused a fallback to Genesis. Match on book name first, then verse.abbr.
    const bookData = BIBLE_BOOKS.find(
      b => b.shortName === verse.book || b.apiName === verse.book || b.abbr === verse.abbr
    );
    const abbr = bookData?.abbr || verse.abbr;

    // Ensure we have valid verse data before navigating
    if (!abbr || !verse.chapter || !verse.verse) {
      console.warn('Invalid verse data:', verse, { resolvedAbbr: abbr });
      return;
    }
    // Clear search term when navigating to daily verse
    try {
      localStorage.removeItem('kjb-search-term');
      localStorage.removeItem('kjb-search-index');
      localStorage.removeItem('kjb-search-total');
      localStorage.removeItem('kjb-search-results');
    } catch {}
    // Save daily verse as last reading position, plus the previous chapter so
    // Clear returns to the prior reading session.
    try {
      const currentPos = JSON.parse(localStorage.getItem('kjb-position') || '{}');
      localStorage.setItem('kjb-last-reading', JSON.stringify({
        abbr: abbr,
        chapter: verse.chapter,
        verse: verse.verse,
        fromDailyVerse: true,
        prevAbbr: currentPos.abbr || null,
        prevChapter: currentPos.chapter || null,
      }));
    } catch {}
    const savedData = { abbr: abbr, chapter: verse.chapter, verse: verse.verse };
    try {
      localStorage.setItem('kjb-position', JSON.stringify(savedData));
    } catch (err) {
      console.error('Failed to save verse position:', err);
    }
    // Navigate with URL params so the reader scrolls + highlights reliably,
    // whether it's freshly mounted or already open.
    navigate(`/read?book=${abbr}&chapter=${verse.chapter}&verse=${verse.verse}&from=daily`);
    setTimeout(() => { try { window.dispatchEvent(new Event('kjb-navigate')); } catch {} }, 0);
  };

  const handleRandomChapter = () => {
    const randomBook = BIBLE_BOOKS[Math.floor(Math.random() * BIBLE_BOOKS.length)];
    const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;
    // Clear search term when navigating to random chapter
    try {
      localStorage.removeItem('kjb-search-term');
      localStorage.removeItem('kjb-search-index');
      localStorage.removeItem('kjb-search-total');
      localStorage.removeItem('kjb-search-results');
    } catch {}
    // Save the DESTINATION random chapter (so the reader shows the "Random Chapter"
    // indicator) plus the PREVIOUS chapter (so Clear can return to it).
    try {
      const currentPos = JSON.parse(localStorage.getItem('kjb-position') || '{}');
      localStorage.setItem('kjb-last-reading', JSON.stringify({
        abbr: randomBook.abbr,
        chapter: randomChapter,
        fromRandom: true,
        prevAbbr: currentPos.abbr || null,
        prevChapter: currentPos.chapter || null,
      }));
    } catch {}
    try { localStorage.setItem('kjb-position', JSON.stringify({ abbr: randomBook.abbr, chapter: randomChapter, verse: null })); } catch {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(`/read?book=${randomBook.abbr}&chapter=${randomChapter}&from=random`);
    setTimeout(() => { try { window.dispatchEvent(new Event('kjb-navigate')); } catch {} }, 0);
  };

  const handleToggleNotif = async () => {
    console.log('handleToggleNotif called on HomePage');
    
    if (notifEnabled) {
      console.log('Notifications already enabled, disabling...');
      disableNotifications();
      setNotifEnabled(false);
      setNotifPermission('Notification' in window ? Notification.permission : 'unsupported');
      window.dispatchEvent(new Event('storage'));
      return;
    }
    
    console.log('Enabling notifications...');
    
    if (!('Notification' in window)) {
      console.log('Notification API not available');
      alert('Notifications are not supported in this browser. Try installing the app or using a different browser.');
      return;
    }
    
    try {
      console.log('Calling requestNotificationPermission...');
      const result = await requestNotificationPermission();
      console.log('Notification permission result:', result);
      setNotifPermission(result);
      
      if (result === 'granted') {
        console.log('Permission granted, enabling notifications');
        setNotifEnabled(true);
        scheduleDailyNotification(verse);
        window.dispatchEvent(new Event('storage'));
        // Fire an immediate confirmation notification so the user gets instant
        // proof it works (and Android/Edge registers the notification channel).
        showLocalNotification(
          'Daily verse reminders on ✓',
          `You'll get the daily verse at ${(localStorage.getItem('kjb-notification-time') || '08:00')} each day.`,
          null
        );
      } else if (result === 'denied') {
        console.log('Permission denied');
        alert('Notifications are blocked. Please allow notifications in your browser settings for this site.');
      }
    } catch (err) {
      console.error('Notification permission error:', err);
      alert('Failed to request notification permission. Please try again.');
    }
  };

  return (
    <div
      className="bg-gradient-to-br from-background via-accent/5 to-background"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full max-w-[120rem] mx-auto px-5 sm:px-8 lg:px-12 py-6">
      <OfflineStatusBanner />
      <IncognitoWarning />

      {/* Daily verse card */}
      <div className="w-full mx-auto mb-8 relative">
        {verse ? (
          <DailyVerseImage verse={verse} onClick={handleVerseCardClick} onToggleNotif={handleToggleNotif} notifEnabled={notifEnabled} isOffline={isOffline} />
        ) : (
          <div className="w-full min-h-[300px] bg-secondary/50 animate-pulse border border-border rounded-2xl shadow-lg flex items-center justify-center">
            <span className="font-sans text-sm text-muted-foreground">Loading daily verse...</span>
          </div>
        )}
      </div>



      {/* Quick links */}
      {/* Read the Bible — full width on mobile, shares a row on desktop */}
      <Link
        to={READ_LINK.path}
        onClick={() => window.scrollTo({ top: 0 })}
        className={`print:hidden relative flex items-center gap-5 p-6 rounded-3xl shadow-lg border-2 border-white/20 hover:z-10 hover:shadow-xl active:scale-[0.98] transition-all mb-4 sm:hidden ${colorMode === 'daily' ? `bg-gradient-to-br ${dailyBg.gradient} text-white` : READ_LINK.color}`}
      >
        <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-sm text-white">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <p className="font-serif font-bold text-lg leading-tight">{READ_LINK.label}</p>
          <p className="font-sans text-xs opacity-75 mt-0.5">{READ_LINK.desc}</p>
        </div>
      </Link>
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Read the Bible inside the grid on desktop only, so rows stay even */}
        <Link
          to={READ_LINK.path}
          onClick={() => window.scrollTo({ top: 0 })}
          className={`hidden sm:flex relative items-center gap-5 p-6 rounded-3xl shadow-lg border-2 border-white/20 hover:z-10 hover:shadow-xl active:scale-[0.98] transition-all ${colorMode === 'daily' ? `bg-gradient-to-br ${dailyBg.gradient} text-white` : READ_LINK.color}`}
        >
          <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 shadow-sm text-white">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <p className="font-serif font-bold text-lg leading-tight">{READ_LINK.label}</p>
            <p className="font-sans text-xs opacity-75 mt-0.5">{READ_LINK.desc}</p>
          </div>
        </Link>
        {QUICK_LINKS.map(link => {
          if (link.label === '__RANDOM__') {
            return (
              <button
                key="random"
                onClick={handleRandomChapter}
                className="relative flex items-center gap-4 p-5 rounded-2xl border border-border shadow-sm hover:z-10 hover:shadow-md active:scale-[0.98] transition-all bg-secondary text-secondary-foreground text-left"
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-md border border-border shadow-sm text-foreground">
                  <Shuffle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-serif font-bold text-lg leading-tight">Random Chapter</p>
                  <p className="font-sans text-xs opacity-75 mt-0.5">Jump to a random chapter</p>
                </div>
              </button>
            );
          }
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => window.scrollTo({ top: 0 })}
              className={`relative flex items-center gap-4 p-5 rounded-2xl border border-border shadow-sm hover:z-10 hover:shadow-md active:scale-[0.98] transition-all ${link.color}`}
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-background/50 backdrop-blur-md border border-border shadow-sm text-foreground">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-serif font-bold text-lg leading-tight">{link.label}</p>
                <p className="font-sans text-xs opacity-75 mt-0.5">{link.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Gospel call */}
      <div className="print:hidden bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 text-center mb-6">
        <p className="font-serif text-xl font-bold text-red-700 dark:text-red-400 mb-2">Are you saved?</p>
        <div className="font-sans text-sm text-foreground/80 mb-4 space-y-1.5">
          <p>Jesus Christ died for your sins, shed his blood, was buried, and rose again on the third day.</p>
          <p className="font-medium">Trust Christ's blood, death, burial and resurrection, and be eternally saved.</p>
        </div>
        <Link
          to="/gospel"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-sans text-sm font-medium transition-all duration-200 hover:shadow-md active:scale-[0.98]"
        >
          <Heart className="w-4 h-4" />
          Learn How to be Saved
        </Link>
      </div>

      {/* Cache status indicator */}
      {bibleCached !== null && (
        <div className="print:hidden text-center py-4 border-t border-border mt-8">
          <p className="font-sans text-xs text-muted-foreground">
            {bibleCached ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                All Bible data cached for offline use
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Bible data not fully cached — some features may require internet
              </span>
            )}
          </p>
        </div>
      )}

      </div>
    </div>
  );
}