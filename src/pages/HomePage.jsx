import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Heart, Library, Info, List, Settings, Bell, BellOff, Bookmark, Shuffle, ChevronRight } from 'lucide-react';
import DailyVerseImage from '@/components/bible/DailyVerseImage';
import QuickLinkCard from '@/components/home/QuickLinkCard';
import OfflineStatusBanner from '@/components/OfflineStatusBanner';
import IncognitoWarning from '@/components/IncognitoWarning';
import { getDailyVerse, getDailyVerseFromBible, getLastCachedDailyVerse } from '@/lib/dailyVerse';
import { getTodayVerseBackground } from '@/lib/dailyVerseTheme';
import { useTheme } from '@/lib/themeContext';
import { registerSW, scheduleDailyNotification, isNotifReallyOn, requestNotificationPermission, disableNotifications, showLocalNotification } from '@/lib/notifications';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { isBibleCached, CACHE_VERSION } from '@/lib/bibleCache';
import { toast } from 'sonner';
import { detectIncognito } from '@/lib/incognito';

const QUICK_LINKS = [
  { path: '/read', icon: BookOpen, label: 'Read the Bible', desc: 'KJB Pure Cambridge Edition', iconGradient: 'from-indigo-500 to-violet-600' },
  { path: '/contents', icon: List, label: 'Table of Contents', desc: 'Browse all 66 books', iconGradient: 'from-blue-500 to-indigo-600' },
  { path: null, icon: Shuffle, label: '__RANDOM__', desc: 'Jump to a random chapter', iconGradient: 'from-violet-500 to-purple-600' },
  { path: '/saved', icon: Bookmark, label: 'Saved Verses', desc: 'Your bookmarked verses', iconGradient: 'from-fuchsia-500 to-pink-600' },
  { path: '/gospel', icon: Heart, label: 'Gospel', desc: 'Learn how to be saved', iconGradient: 'from-rose-500 to-red-600' },
  { path: '/resources', icon: Library, label: 'Resources', desc: 'KJB defence & study', iconGradient: 'from-teal-500 to-emerald-600' },
  { path: '/about', icon: Info, label: 'About', desc: 'Ministry & links', iconGradient: 'from-sky-500 to-blue-600' },
  { path: '/settings', icon: Settings, label: 'Settings', desc: 'Offline downloads & info', iconGradient: 'from-slate-500 to-slate-700' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { colorMode } = useTheme();
  const dailyBg = getTodayVerseBackground();
  
  const [verse, setVerse] = useState(() => {
    const lastCached = getLastCachedDailyVerse();
    const initial = (lastCached && lastCached.isToday) ? lastCached : null;
    console.log("[HomePage] Initial verse state:", initial);
    return initial;
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

  // Auto-check for updates on home load, then every minute while the home page
  // is open. If an update is found, the splash "home update" sequence runs
  // after reload.
  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    let intervalId = null;

    const run = () => {
      if (!navigator.onLine) return;
      import('@/lib/homeUpdateCheck').then(({ checkHomeForUpdates }) => {
        checkHomeForUpdates().catch(() => {});
      }).catch(() => {});
    };

    const startChecking = () => {
      run();
      intervalId = setInterval(run, 60 * 1000); // every minute
    };

    // Also re-check whenever the app regains focus / becomes visible.
    const onVisible = () => { if (document.visibilityState === 'visible') run(); };
    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', onVisible);

    let cleanupDoneListener = null;
    if (window.kjbSplashDone) {
      const t = setTimeout(startChecking, 1000);
      cleanupDoneListener = () => clearTimeout(t);
    } else {
      const onDone = () => { window.removeEventListener('kjb-splash-done', onDone); setTimeout(startChecking, 1000); };
      window.addEventListener('kjb-splash-done', onDone);
      cleanupDoneListener = () => window.removeEventListener('kjb-splash-done', onDone);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      cleanupDoneListener?.();
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  useEffect(() => {
    // 2. Fetch today's verse in the background quietly
    console.log("[HomePage] Starting verse fetch...");
    getDailyVerseFromBible().then(v => {
      console.log("[HomePage] Verse loaded successfully:", v?.ref, v?.text?.substring(0, 50));
      setVerse(v);
      setIsOffline(navigator.onLine === false);
      window.dispatchEvent(new Event('kjb-daily-verse-updated'));
      // Trigger notification if enabled
      scheduleDailyNotification();
    }).catch((err) => {
      console.error("[HomePage] getDailyVerseFromBible failed:", err);
      const fallback = getDailyVerse();
      console.log("[HomePage] Using fallback verse:", fallback?.ref);
      setVerse(fallback);
      setIsOffline(true);
    });
    
    // Preload Bible cache on home page mount to ensure italics are ready
    // Skip in incognito/private mode since cache won't persist
    detectIncognito().then((isIncog) => {
      if (!isIncog) {
        import('@/lib/bibleCache').then(({ getBibleData }) => {
          getBibleData().catch(() => {});
        });
      }
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
            const { checkHomeForUpdates } = await import('@/lib/homeUpdateCheck');
            const updating = await checkHomeForUpdates();
            if (updating) return; // splash + reload handles the rest

            console.log('[UpdateCheck] No updates found (pull). Loading verse silently...');
            // No updates — just refresh the verse silently, no toast banner.
            const v = await getDailyVerseFromBible();
            setVerse(v);
            setIsOffline(false);
            window.dispatchEvent(new Event('kjb-daily-verse-updated'));
            scheduleDailyNotification();
          } catch (e) {
            console.error('[UpdateCheck] Pull-to-refresh check failed:', e);
            setVerse(getDailyVerse());
            setIsOffline(true);
          }
        })();
      } else {
        getDailyVerseFromBible().then(v => {
          setVerse(v);
          setIsOffline(false);
          window.dispatchEvent(new Event('kjb-daily-verse-updated'));
          scheduleDailyNotification();
        }).catch(() => {
          setVerse(getDailyVerse());
          setIsOffline(true);
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

  const [notifEnabled, setNotifEnabled] = useState(isNotifReallyOn);
  const [notifPermission, setNotifPermission] = useState(() => {
    if (!('serviceWorker' in navigator)) return 'unsupported';
    if (!('Notification' in window)) return 'supported';
    return Notification.permission;
  });

  useEffect(() => {
    // Sync notification state on mount and whenever verse changes
    setNotifEnabled(isNotifReallyOn());
    
    registerSW();
    // Notification init now runs app-wide in AppLayout, so we don't re-init here
    // (avoids clearing/re-arming the poll timer on every HomePage mount).

    const handleStorageChange = () => {
      const enabled = isNotifReallyOn();
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
      setNotifEnabled(isNotifReallyOn());
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
    // Resolve the reader's book abbreviation from the full book name.
    const bookData = BIBLE_BOOKS.find(
      b => b.shortName === verse.book || b.apiName === verse.book || b.abbr === verse.abbr
    );
    const abbr = bookData?.abbr || verse.abbr;

    if (!abbr || !verse.chapter || !verse.verse) {
      console.warn('Invalid verse data:', verse, { resolvedAbbr: abbr });
      return;
    }
    // Clear search term / stale toolbar (search+gospel) context so the
    // reader's "Currently Reading" indicator doesn't keep showing the old
    // search term next to the new Daily Verse reference.
    try {
      localStorage.removeItem('kjb-search-term');
      localStorage.removeItem('kjb-search-index');
      localStorage.removeItem('kjb-search-total');
      localStorage.removeItem('kjb-search-results');
      localStorage.removeItem('kjb-reader-toolbar-state');
    } catch {}
    // Save the DAILY VERSE location (so indicator shows correctly) plus where we came FROM (so Clear returns there)
    try {
      const currentPos = JSON.parse(localStorage.getItem('kjb-position') || '{}');
      localStorage.setItem('kjb-last-reading', JSON.stringify({
        abbr: abbr,
        chapter: verse.chapter,
        verse: verse.verse,
        fromDailyVerse: true,
        prevAbbr: currentPos?.abbr || null,
        prevChapter: currentPos?.chapter || null,
        prevScrollY: currentPos?.scrollY || 0,
      }));
    } catch {}
    // Update current position to the daily verse
    try {
      localStorage.setItem('kjb-position', JSON.stringify({ abbr: abbr, chapter: verse.chapter, verse: verse.verse }));
    } catch (err) {
      console.error('Failed to save verse position:', err);
    }
    navigate(`/read?book=${abbr}&chapter=${verse.chapter}&verse=${verse.verse}&from=daily`);
    setTimeout(() => { try { window.dispatchEvent(new Event('kjb-navigate')); } catch {} }, 0);
  };

  const handleRandomChapter = () => {
    const randomBook = BIBLE_BOOKS[Math.floor(Math.random() * BIBLE_BOOKS.length)];
    const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;
    // Clear search term / stale toolbar (search+gospel) context when navigating
    // to a random chapter, so the reader's "Currently Reading" indicator
    // doesn't keep showing the old search term next to the new reference.
    try {
      localStorage.removeItem('kjb-search-term');
      localStorage.removeItem('kjb-search-index');
      localStorage.removeItem('kjb-search-total');
      localStorage.removeItem('kjb-search-results');
      localStorage.removeItem('kjb-reader-toolbar-state');
    } catch {}
    // Save the DESTINATION random chapter (so the reader shows the "Random Chapter"
    // indicator) plus the PREVIOUS chapter (so Clear can return to it).
    try {
      // Read from kjb-prev-reading-session (BibleReader's continuous save) first,
      // fall back to kjb-position if not available
      let currentPos = null;
      try {
        const prevSession = localStorage.getItem('kjb-prev-reading-session');
        if (prevSession) currentPos = JSON.parse(prevSession);
      } catch {}
      if (!currentPos || !currentPos.abbr || !currentPos.chapter) {
        try {
          currentPos = JSON.parse(localStorage.getItem('kjb-position') || '{}');
        } catch {}
      }
      localStorage.setItem('kjb-last-reading', JSON.stringify({
        abbr: randomBook.abbr,
        chapter: randomChapter,
        fromRandom: true,
        prevAbbr: currentPos?.abbr || null,
        prevChapter: currentPos?.chapter || null,
        prevScrollY: currentPos?.scrollY || 0,
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
    <div className="bg-gradient-to-br from-background via-accent/5 to-background"
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
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
        {QUICK_LINKS.map(link =>
          link.label === '__RANDOM__' ? (
            <QuickLinkCard
              key="random"
              onClick={handleRandomChapter}
              icon={link.icon}
              label="Random Chapter"
              desc={link.desc}
              iconGradient={link.iconGradient}
            />
          ) : (
            <QuickLinkCard
              key={link.path}
              to={link.path}
              icon={link.icon}
              label={link.label}
              desc={link.desc}
              iconGradient={link.iconGradient}
            />
          )
        )}
      </div>

      {/* Gospel call */}
      <div className="print:hidden bg-gradient-to-br from-rose-50 to-red-50 dark:from-red-950/20 dark:to-rose-950/20 border border-red-200/70 dark:border-red-900/30 rounded-3xl p-6 sm:p-8 text-center mb-6 shadow-sm">
        <p className="font-serif text-xl font-bold text-red-700 dark:text-red-400 mb-2">Are you saved?</p>
        <div className="font-sans text-sm text-foreground/80 mb-4 space-y-1.5">
          <p>Jesus Christ died, shed his blood, was buried, and rose again on the third day for our sins.</p>
          <p className="font-medium">Trust Christ's blood, death, burial and resurrection for your sins, and be eternally saved.</p>
        </div>
        <Link
          to="/gospel"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-sans text-sm font-medium transition-all duration-200 hover:shadow-md active:scale-[0.98]"
        >
          <Heart className="w-4 h-4" />
          Learn How to be Saved
        </Link>
      </div>

      </div>

    </div>
  );
}