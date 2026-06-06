import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Heart, Library, Info, List, Settings, Bell, BellOff, Bookmark, Shuffle, RotateCw, ChevronRight } from 'lucide-react';
import DailyVerseImage from '@/components/bible/DailyVerseImage';
import OfflineStatusBanner from '@/components/OfflineStatusBanner';
import FirstLoadPrompt from '@/components/FirstLoadPrompt';
import { getDailyVerse, getDailyVerseFromBible, getLastCachedDailyVerse } from '@/lib/dailyVerse';
import { registerSW, scheduleDailyNotification, getNotificationsEnabled, requestNotificationPermission, disableNotifications, showLocalNotification } from '@/lib/notifications';
import { BIBLE_BOOKS } from '@/lib/bibleData';
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
  const [verse, setVerse] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateText, setUpdateText] = useState("Updating today's verse...");
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  useEffect(() => {
    if (isUpdating) {
      window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: updateText, status: 'loading' } }));
    }
  }, [isUpdating, updateText]);

  useEffect(() => {
    // 1. Immediately show the last cached verse (even if it's from yesterday)
    const lastCached = getLastCachedDailyVerse();
    if (lastCached) {
      setVerse(lastCached);
      if (!lastCached.isToday) {
        setIsUpdating(true);
        setUpdateText("Loading today's verse...");
        window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: "Showing yesterday's verse while we fetch today's...", status: 'info' } }));
        setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 3000);
      }
    }

    // 2. Fetch today's verse in the background
    getDailyVerseFromBible().then(v => {
      console.log("[DEBUG] Verse generated for today:", v?.ref);
      setVerse(v);
      setIsUpdating(false);
      setIsOffline(false);
      window.dispatchEvent(new Event('kjb-progress-clear'));
      // Trigger notification if enabled
      scheduleDailyNotification();
    }).catch((err) => {
      console.error("[DEBUG] getDailyVerseFromBible failed:", err);
      setVerse(getDailyVerse());
      setIsUpdating(false);
      setIsOffline(true);
      window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'You are offline. Showing a random verse.', status: 'info' } }));
      setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 3000);
    });
    
    // Preload Bible cache on home page mount to ensure italics are ready
    import('@/lib/bibleCache').then(({ getBibleData }) => {
      getBibleData().catch(() => {});
    });

    // Schedule an automatic refresh exactly at local midnight
    let midnightTimer;
    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const msUntilMidnight = tomorrow.getTime() - now.getTime() + 1000; // 1 second after midnight
      
      midnightTimer = setTimeout(() => {
        setIsUpdating(true);
        setUpdateText("Updating today's verse...");
        getDailyVerseFromBible().then(v => {
          setVerse(v);
          setIsUpdating(false);
          setIsOffline(false);
          scheduleMidnightRefresh(); // Schedule for the next night
        }).catch(() => {
          setVerse(getDailyVerse());
          setIsUpdating(false);
          setIsOffline(true);
          scheduleMidnightRefresh();
        });
      }, msUntilMidnight);
    };

    scheduleMidnightRefresh();

    return () => {
      if (midnightTimer) clearTimeout(midnightTimer);
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
      setIsUpdating(true);
      setUpdateText("Checking for updates...");
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        (async () => {
          try {
            let swUpdated = false;
            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.getRegistration();
              if (reg) {
                await reg.update().catch(() => {});
                if (reg.waiting || (reg.installing && reg.installing.state === 'installed')) {
                  swUpdated = true;
                }
              }
            }
            if (swUpdated) {
              setUpdateText("Update ready");
              setIsUpdating(false);
              return;
            }
            
            // If no app updates, just get the verse
            setUpdateText("Loading today's verse...");
            const v = await getDailyVerseFromBible();
            setVerse(v);
            setIsUpdating(false);
            setIsOffline(false);
            window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: "No new updates found. Today's verse loaded.", status: 'success' } }));
            setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 3000);
            scheduleDailyNotification();
          } catch (e) {
            setVerse(getDailyVerse());
            setIsUpdating(false);
            setIsOffline(true);
            window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'You are offline.', status: 'info' } }));
            setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 3000);
          }
        })();
      } else {
        setUpdateText("Loading today's verse...");
        getDailyVerseFromBible().then(v => {
          setVerse(v);
          setIsUpdating(false);
          setIsOffline(false);
          window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: "Today's verse loaded.", status: 'success' } }));
          setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 3000);
          scheduleDailyNotification();
        }).catch(() => {
          setVerse(getDailyVerse());
          setIsUpdating(false);
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
        setIsUpdating(true);
        setUpdateText("Loading today's verse...");
        getDailyVerseFromBible().then(v => {
          setVerse(v);
          setIsUpdating(false);
          setIsOffline(false);
          window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: "Internet restored. Today's verse loaded.", status: 'success' } }));
          setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 3000);
          scheduleDailyNotification();
        }).catch(() => {
          setVerse(getDailyVerse());
          setIsUpdating(false);
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
    // Ensure we have valid verse data before navigating
    if (!verse.abbr || !verse.chapter || !verse.verse) {
      console.warn('Invalid verse data:', verse);
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
        abbr: verse.abbr,
        chapter: verse.chapter,
        verse: verse.verse,
        fromDailyVerse: true,
        prevAbbr: currentPos.abbr || null,
        prevChapter: currentPos.chapter || null,
      }));
    } catch {}
    const savedData = { abbr: verse.abbr, chapter: verse.chapter, verse: verse.verse };
    try {
      localStorage.setItem('kjb-position', JSON.stringify(savedData));
    } catch (err) {
      console.error('Failed to save verse position:', err);
    }
    // Navigate with URL params so the reader scrolls + highlights reliably,
    // whether it's freshly mounted or already open.
    navigate(`/read?book=${verse.abbr}&chapter=${verse.chapter}&verse=${verse.verse}&from=daily`);
    setTimeout(() => { try { window.dispatchEvent(new Event('kjb-navigate')); } catch {} }, 0);
  };

  const handleRandomVerse = async () => {
    let bookName, chapterNum, verseNum;
    let abbr;

    const navigateToVerse = () => {
      try {
        localStorage.removeItem('kjb-search-term');
        localStorage.removeItem('kjb-search-index');
        localStorage.removeItem('kjb-search-total');
        localStorage.removeItem('kjb-search-results');
      } catch {}
      try {
        const currentPos = JSON.parse(localStorage.getItem('kjb-position') || '{}');
        localStorage.setItem('kjb-last-reading', JSON.stringify({
          abbr: abbr,
          chapter: chapterNum,
          verse: verseNum,
          fromRandom: true,
          prevAbbr: currentPos.abbr || null,
          prevChapter: currentPos.chapter || null,
        }));
        localStorage.setItem('kjb-position', JSON.stringify({ abbr, chapter: chapterNum, verse: verseNum }));
      } catch {}
      window.scrollTo({ top: 0, behavior: 'smooth' });
      navigate(`/read?book=${abbr}&chapter=${chapterNum}&verse=${verseNum}&from=random`);
      setTimeout(() => { try { window.dispatchEvent(new Event('kjb-navigate')); } catch {} }, 0);
    };

    if (typeof navigator !== 'undefined' && navigator.onLine) {
      try {
        const { base44 } = await import('@/api/base44Client');
        const res = await base44.functions.invoke('bibleApi', { action: 'random_verse' });
        if (res.data?.verse) {
          bookName = res.data.verse.book;
          chapterNum = res.data.verse.chapter;
          verseNum = res.data.verse.verse;
          const bookData = BIBLE_BOOKS.find(b => b.name === bookName || b.shortName === bookName);
          abbr = bookData ? bookData.abbr : bookName.slice(0, 3).toUpperCase();
          navigateToVerse();
          return;
        }
      } catch (err) {
        console.warn("Random verse API failed, falling back to local:", err);
      }
    }

    try {
      const { getBibleData } = await import('@/lib/bibleCache');
      const bible = await getBibleData();
      if (!bible || !bible['Genesis']) throw new Error();
      const bookNames = Object.keys(bible).filter(k => k !== '__colophons');
      
      let currentSeed = Math.floor(Math.random() * 10000000);
      let verseObj;
      while (true) {
        bookName = bookNames[currentSeed % bookNames.length];
        const chapters = Object.keys(bible[bookName]);
        chapterNum = chapters[currentSeed % chapters.length];
        const verses = bible[bookName][chapterNum];
        verseObj = verses[currentSeed % verses.length];
        
        const ref = `${bookName} ${chapterNum}:${verseObj.verse}`;
        // Import EXCLUDED_REFS logic for offline match
        const isExcludedChapter = bookName === 'Romans' && parseInt(chapterNum) === 10;
        const EXCLUDED_REFS = new Set(["Genesis 26:11","Genesis 33:14","Exodus 15:6","Exodus 18:23","Exodus 19:12","Exodus 21:12","Exodus 21:15","Exodus 21:16","Exodus 21:17","Exodus 21:29","Exodus 22:19","Exodus 31:14","Exodus 31:15","Exodus 35:2","Leviticus 5:5","Leviticus 16:21","Leviticus 19:20","Leviticus 20:2","Leviticus 20:9","Leviticus 20:10","Leviticus 20:11","Leviticus 20:12","Leviticus 20:13","Leviticus 20:15","Leviticus 20:16","Leviticus 20:27","Leviticus 24:16","Leviticus 24:17","Leviticus 24:21","Leviticus 27:29","Numbers 1:51","Numbers 3:10","Numbers 3:38","Numbers 5:7","Numbers 15:35","Numbers 18:7","Numbers 35:16","Numbers 35:17","Numbers 35:18","Numbers 35:21","Numbers 35:30","Numbers 35:31","Deuteronomy 13:5","Deuteronomy 17:6","Deuteronomy 21:22","Deuteronomy 24:16","Joshua 1:18","Judges 6:31","Judges 21:5","1 Samuel 11:13","2 Samuel 8:2","2 Samuel 19:21","2 Samuel 19:22","2 Samuel 21:9","1 Kings 1:12","1 Kings 2:24","1 Kings 8:33","1 Kings 8:35","1 Kings 20:31","2 Kings 14:6","1 Chronicles 16:34","1 Chronicles 16:41","2 Chronicles 5:13","2 Chronicles 6:24","2 Chronicles 6:26","2 Chronicles 7:3","2 Chronicles 7:6","2 Chronicles 15:13","2 Chronicles 20:21","2 Chronicles 23:7","Ezra 3:11","Nehemiah 1:6","Nehemiah 9:2","Esther 8:6","Job 8:15","Job 31:23","Psalms 2:9","Psalms 9:7","Psalms 30:5","Psalms 32:5","Psalms 52:1","Psalms 72:5","Psalms 72:7","Psalms 72:17","Psalms 81:15","Psalms 89:29","Psalms 89:36","Psalms 100:5","Psalms 102:12","Psalms 102:26","Psalms 104:31","Psalms 106:1","Psalms 107:1","Psalms 111:3","Psalms 111:10","Psalms 112:3","Psalms 112:9","Psalms 117:2","Psalms 118:1","Psalms 118:2","Psalms 118:3","Psalms 118:4","Psalms 118:29","Psalms 119:160","Psalms 135:13","Psalms 136:1","Psalms 136:2","Psalms 136:3","Psalms 136:4","Psalms 136:5","Psalms 136:6","Psalms 136:7","Psalms 136:8","Psalms 136:9","Psalms 136:10","Psalms 136:11","Psalms 136:12","Psalms 136:13","Psalms 136:14","Psalms 136:15","Psalms 136:16","Psalms 136:17","Psalms 136:18","Psalms 136:19","Psalms 136:20","Psalms 136:21","Psalms 136:22","Psalms 136:23","Psalms 136:24","Psalms 136:25","Psalms 136:26","Psalms 138:8","Psalms 145:13","Proverbs 27:24","Proverbs 28:13","Isaiah 13:16","Isaiah 13:18","Isaiah 45:20","Jeremiah 18:21","Jeremiah 33:11","Jeremiah 38:4","Ezekiel 22:14","Daniel 9:20","Hosea 10:14","Hosea 13:16","Nahum 2:1","Nahum 3:10","Matthew 3:6","Matthew 10:21","Matthew 10:22","Matthew 24:13","Mark 1:5","Mark 4:17","Mark 13:12","Mark 13:13","Luke 21:16","Luke 23:32","John 6:27","Acts 12:19","Acts 26:10","Romans 9:22","Romans 10:1","Romans 15:9","1 Corinthians 13:7","2 Thessalonians 1:4","2 Timothy 2:3","2 Timothy 2:10","2 Timothy 3:11","2 Timothy 4:3","2 Timothy 4:5","Hebrews 5:7","Hebrews 6:15","Hebrews 10:32","Hebrews 11:27","Hebrews 12:2","Hebrews 12:3","Hebrews 12:7","Hebrews 12:20","James 1:12","James 2:20","James 2:26","James 5:11","James 5:15","1 Peter 1:25","1 Peter 2:19","1 Peter 3:18","1 John 1:9"]);
        
        if (!EXCLUDED_REFS.has(ref) && !isExcludedChapter) break;
        currentSeed++;
      }
      const bookData = BIBLE_BOOKS.find(b => b.name === bookName || b.shortName === bookName);
      abbr = bookData ? bookData.abbr : bookName.slice(0, 3).toUpperCase();
      verseNum = verseObj.verse;
      navigateToVerse();
    } catch (e) {
      // Fallback if local cache is not available and offline
      const randomBook = BIBLE_BOOKS[Math.floor(Math.random() * BIBLE_BOOKS.length)];
      const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;
      abbr = randomBook.abbr;
      chapterNum = randomChapter;
      verseNum = null;
      navigateToVerse();
    }
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
      <div className="w-full max-w-[90rem] mx-auto px-4 sm:px-8 lg:px-16 py-6">
      <OfflineStatusBanner />

      {/* Daily verse card */}
      <div className="w-full mb-6 relative">
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
        className={`flex items-center gap-4 p-5 rounded-2xl shadow-sm hover:opacity-90 transition-opacity mb-4 sm:hidden ${READ_LINK.color}`}
      >
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/20">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <p className="font-serif font-bold text-lg leading-tight">{READ_LINK.label}</p>
          <p className="font-sans text-xs opacity-75 mt-0.5">{READ_LINK.desc}</p>
        </div>
      </Link>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Read the Bible inside the grid on desktop only, so rows stay even */}
        <Link
          to={READ_LINK.path}
          onClick={() => window.scrollTo({ top: 0 })}
          className={`hidden sm:flex items-center gap-4 p-5 rounded-2xl shadow-sm hover:opacity-90 transition-opacity ${READ_LINK.color}`}
        >
          <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/20">
            <BookOpen className="w-5 h-5" />
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
                onClick={handleRandomVerse}
                className="flex items-center gap-4 p-5 rounded-2xl border border-border shadow-sm hover:opacity-90 transition-opacity bg-secondary text-secondary-foreground text-left"
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/20">
                  <Shuffle className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-serif font-bold text-lg leading-tight">Random Verse</p>
                  <p className="font-sans text-xs opacity-75 mt-0.5">Jump to a random verse</p>
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
              className={`flex items-center gap-4 p-5 rounded-2xl border border-border shadow-sm hover:opacity-90 transition-opacity ${link.color}`}
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/20">
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
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 text-center">
        <p className="font-serif text-xl font-bold text-red-700 dark:text-red-400 mb-2">Are you saved?</p>
        <p className="font-sans text-sm text-foreground/80 mb-4">
          Jesus Christ died for your sins, shed his blood, was buried, and rose again on the third day. Trust the blood — believe the gospel and be saved.
        </p>
        <Link
          to="/gospel"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-sans text-sm font-medium transition-colors"
        >
          <Heart className="w-4 h-4" />
          Learn How to be Saved
        </Link>
      </div>
      </div>
    </div>
  );
}