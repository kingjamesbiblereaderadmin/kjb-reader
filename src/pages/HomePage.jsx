import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Heart, Library, Info, List, Settings, Bell, BellOff, Bookmark, Shuffle, ChevronRight, FlaskConical } from 'lucide-react';
import DailyVerseImage from '@/components/bible/DailyVerseImage';
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
  { path: '/read', icon: BookOpen, label: 'Read the Bible', desc: 'KJB Pure Cambridge Edition', iconGradient: 'from-indigo-500 to-violet-600', fullSpan: true },
  { path: '/contents', icon: List, label: 'Table of Contents', desc: 'Browse all 66 books', iconGradient: 'from-blue-500 to-indigo-600' },
  { path: null, icon: Shuffle, label: '__RANDOM__', desc: 'Jump to a random chapter', iconGradient: 'from-violet-500 to-purple-600' },
  { path: '/saved', icon: Bookmark, label: 'Saved Verses', desc: 'Your bookmarked verses', iconGradient: 'from-fuchsia-500 to-pink-600' },
  { path: '/advanced-search', icon: FlaskConical, label: 'Advanced Search', desc: 'Research verses by properties', iconGradient: 'from-indigo-500 to-purple-600' },
  { path: '/gospel', icon: Heart, label: 'Gospel', desc: 'Learn how to be saved', iconGradient: 'from-primary to-accent' },
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
    <div className="relative bg-gradient-to-br from-background via-accent/5 to-background"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Decorative ambient background — purposeful colour, no images */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-10 left-1/4 w-80 h-80 rounded-full bg-violet-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-[120rem] mx-auto px-5 sm:px-8 lg:px-12 py-6">
      <OfflineStatusBanner />
      <IncognitoWarning />

      {/* Daily verse card — framed with a gradient ring + ambient glow */}
      <div className="w-full mx-auto mb-8 relative animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationFillMode: 'both' }}>
        <div className="absolute -inset-1 bg-gradient-to-br from-primary/20 via-accent/15 to-primary/20 rounded-[2rem] blur-xl opacity-60" />
        <div className="relative rounded-[1.75rem] p-1 bg-gradient-to-br from-primary/40 via-accent/25 to-primary/40">
          <div className="rounded-[1.65rem] overflow-hidden">
            {verse ? (
              <DailyVerseImage verse={verse} onClick={handleVerseCardClick} onToggleNotif={handleToggleNotif} notifEnabled={notifEnabled} isOffline={isOffline} />
            ) : (
              <div className="w-full min-h-[300px] bg-secondary/50 animate-pulse border border-border flex items-center justify-center">
                <span className="font-sans text-sm text-muted-foreground">Loading daily verse...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured: Read the Bible */}
      <Link
        to="/read"
        onClick={() => window.scrollTo({ top: 0 })}
        className="print:hidden group relative block overflow-hidden rounded-3xl border-2 border-border bg-card/70 backdrop-blur-xl shadow-sm hover:shadow-xl hover:border-indigo-400/60 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 mb-4 sm:mb-5 animate-in fade-in slide-in-from-bottom-4"
        style={{ animationDuration: '500ms', animationDelay: '80ms', animationFillMode: 'both' }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent" />
        <div className="absolute -right-6 -bottom-8 opacity-[0.06] dark:opacity-[0.12] text-indigo-500 dark:text-indigo-300 pointer-events-none">
          <BookOpen className="w-40 h-40" />
        </div>
        <div className="relative flex items-center gap-5 p-6 sm:p-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-3xl text-white shadow-xl bg-gradient-to-br from-indigo-500 to-violet-600 ring-1 ring-white/20 shrink-0">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-serif font-bold text-2xl sm:text-3xl leading-tight text-foreground">Read the Bible</p>
            <p className="font-sans text-sm text-muted-foreground mt-1">KJB Pure Cambridge Edition</p>
          </div>
          <ChevronRight className="w-6 h-6 text-muted-foreground/50 group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0" />
        </div>
      </Link>



      {/* Quick links bento */}
      <div className="print:hidden grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 auto-rows-fr animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '140ms', animationFillMode: 'both' }}>
        {QUICK_LINKS.slice(1).map((link) => {
          const Icon = link.icon;
          const isRandom = link.label === '__RANDOM__';
          const label = isRandom ? 'Random Chapter' : link.label;
          const cardClass = 'group relative flex flex-col p-5 rounded-3xl bg-card/70 backdrop-blur-xl border-2 border-border shadow-sm hover:shadow-xl hover:border-accent/60 hover:-translate-y-1 active:scale-[0.98] transition-all duration-300 overflow-hidden text-left';
          const inner = (
            <>
              <div className={`absolute -top-10 -right-10 w-28 h-28 rounded-full bg-gradient-to-br ${link.iconGradient} opacity-[0.12] blur-2xl`} />
              <div className="relative flex items-center justify-between">
                <div className={`w-12 h-12 flex items-center justify-center rounded-2xl text-white shadow-md bg-gradient-to-br ${link.iconGradient} ring-1 ring-white/15`}>
                  <Icon className="w-6 h-6" />
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="relative mt-3">
                <p className="font-serif font-bold text-base sm:text-lg leading-tight text-foreground">{label}</p>
                <p className="font-sans text-xs text-muted-foreground mt-1">{link.desc}</p>
              </div>
            </>
          );
          if (isRandom) {
            return <button key="random" onClick={handleRandomChapter} className={cardClass}>{inner}</button>;
          }
          return (
            <Link key={link.path} to={link.path} onClick={() => window.scrollTo({ top: 0 })} className={cardClass}>
              {inner}
            </Link>
          );
        })}
      </div>

      {/* Gospel call */}
      <div className="print:hidden relative overflow-hidden rounded-3xl border border-primary/20 shadow-lg mb-6 animate-in fade-in slide-in-from-bottom-4" style={{ animationDuration: '500ms', animationDelay: '200ms', animationFillMode: 'both' }}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5" />
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -right-4 -bottom-4 opacity-[0.06] dark:opacity-[0.12] text-primary pointer-events-none">
          <Heart className="w-32 h-32" />
        </div>
        <div className="relative p-6 sm:p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg mb-3">
            <Heart className="w-6 h-6" />
          </div>
          <p className="font-serif text-2xl font-bold text-primary mb-2">Are you saved?</p>
          <div className="font-sans text-sm text-foreground/80 mb-5 space-y-1.5 max-w-xl mx-auto">
            <p>Jesus Christ died, shed his blood, was buried, and rose again on the third day for our sins according to the scriptures.</p>
            <p className="font-medium">Trust Christ's blood, death, burial and resurrection on the third day according to the scriptures for your sins, and be eternally saved.</p>
          </div>
          <Link
            to="/gospel"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-sans text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:scale-[1.03] active:scale-[0.97] shadow-md"
          >
            <Heart className="w-4 h-4" />
            Learn How to be Saved
          </Link>
        </div>
      </div>

      </div>

    </div>
  );
}