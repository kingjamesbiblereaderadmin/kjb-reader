import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Heart, Library, Info, List, Settings, Bell, BellOff, Bookmark, Shuffle, ChevronRight } from 'lucide-react';
import DailyVerseImage from '@/components/bible/DailyVerseImage';
import OfflineStatusBanner from '@/components/OfflineStatusBanner';
import IncognitoWarning from '@/components/IncognitoWarning';
import FirstLoadPrompt from '@/components/FirstLoadPrompt';
import HomeQuickLink from '@/components/home/HomeQuickLink';
import { getDailyVerse, getDailyVerseFromBible, getLastCachedDailyVerse } from '@/lib/dailyVerse';
import { getTodayVerseBackground } from '@/lib/dailyVerseTheme';
import { useTheme } from '@/lib/themeContext';
import { registerSW, scheduleDailyNotification, getNotificationsEnabled, requestNotificationPermission, disableNotifications, showLocalNotification } from '@/lib/notifications';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { isBibleCached, CACHE_VERSION } from '@/lib/bibleCache';
import { toast } from 'sonner';
import { detectIncognito } from '@/lib/incognito';

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
      });
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
    <div className="min-h-screen bg-[#F3F4F6]"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full max-w-6xl mx-auto px-5 sm:px-8 lg:px-12 py-6">
      <OfflineStatusBanner />
      <IncognitoWarning />

      {/* Header rule — Swiss technical masthead */}
      <div className="print:hidden flex items-end justify-between border-b-2 border-[#111827] pb-2 mb-7">
        <p className="font-sans text-2xl font-bold uppercase tracking-tight text-[#111827]">KJB Reader</p>
        <p className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#FF5722] font-semibold mb-1">Pure Cambridge Ed.</p>
      </div>

      {/* Main grid: verse + gospel side-by-side on desktop */}
      <div className="print:hidden grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Daily verse card */}
        <div className="lg:col-span-2 w-full relative border border-[#E5E7EB] bg-white overflow-hidden">
          {verse ? (
            <DailyVerseImage verse={verse} onClick={handleVerseCardClick} onToggleNotif={handleToggleNotif} notifEnabled={notifEnabled} isOffline={isOffline} />
          ) : (
            <div className="w-full min-h-[300px] bg-[#F3F4F6] animate-pulse flex items-center justify-center">
              <span className="font-sans text-sm text-[#6B7280]">Loading daily verse...</span>
            </div>
          )}
        </div>

        {/* Gospel call — high-contrast orange-bordered block */}
        <div className="relative border-2 border-[#FF5722] bg-white p-6 flex flex-col justify-center">
          <p className="font-sans text-xl font-bold uppercase tracking-tight text-[#111827] mb-3">Are you saved?</p>
          <div className="font-sans text-sm text-[#374151] mb-4 space-y-2">
            <p>Jesus Christ died, shed his blood, was buried, and rose again on the third day for our sins.</p>
            <p className="font-semibold text-[#111827]">Trust Christ's blood, death, burial and resurrection for your sins, and be eternally saved.</p>
          </div>
          <Link
            to="/gospel"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF5722] hover:bg-[#e64a19] text-white font-sans text-sm font-semibold uppercase tracking-wide transition-all duration-150 active:translate-y-px"
          >
            <Heart className="w-4 h-4" />
            Learn How to be Saved
          </Link>
        </div>
      </div>

      {/* Quick links — modular grid */}
      <div className="print:hidden grid grid-cols-1 sm:grid-cols-2 gap-px bg-[#E5E7EB] border border-[#E5E7EB]">
        <div className="sm:col-span-2">
          <HomeQuickLink icon={BookOpen} label={READ_LINK.label} desc={READ_LINK.desc} to={READ_LINK.path} primary />
        </div>
        {QUICK_LINKS.map(link => {
          if (link.label === '__RANDOM__') {
            return (
              <HomeQuickLink key="random" icon={Shuffle} label="Random Chapter" desc="Jump to a random chapter" onClick={handleRandomChapter} />
            );
          }
          return (
            <HomeQuickLink key={link.path} icon={link.icon} label={link.label} desc={link.desc} to={link.path} />
          );
        })}
      </div>

      </div>
    </div>
  );
}