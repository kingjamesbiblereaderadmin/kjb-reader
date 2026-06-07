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
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  useEffect(() => {
    // 1. Immediately show the cached verse only if it belongs to today
    const lastCached = getLastCachedDailyVerse();
    if (lastCached && lastCached.isToday) {
      setVerse(lastCached);
    }

    // 2. Fetch today's verse in the background quietly
    getDailyVerseFromBible().then(v => {
      console.log("[DEBUG] Verse generated for today:", v?.ref);
      setVerse(v);
      setIsOffline(false);
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
          setIsOffline(false);
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
      window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: "Checking for updates...", status: 'loading' } }));
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
            
            const { checkForUpdates, downloadBibleForOffline } = await import('@/lib/bibleCache');
            const bibleNeedsUpdate = await checkForUpdates();
            console.log(`[UpdateCheck] Bible updates found (pull): ${bibleNeedsUpdate}`);

            // Ensure the checking message is visible for at least a brief moment so it doesn't flash
            await new Promise(r => setTimeout(r, 600));

            if (swUpdated || bibleNeedsUpdate) {
              console.log('[UpdateCheck] Updates found (pull). Triggering splash screen and applying...');
              let reloadText = 'Applying Updates...';
              if (swUpdated && bibleNeedsUpdate) reloadText = 'Applying App & Bible Updates...';
              else if (bibleNeedsUpdate) reloadText = 'Applying Bible Data Updates...';
              else if (swUpdated) reloadText = 'Applying App Updates...';
              
              // Switch to splash screen
              window.dispatchEvent(new Event('kjb-progress-clear'));
              window.dispatchEvent(new CustomEvent('kjb-reloading', { detail: { text: reloadText } }));

              if (bibleNeedsUpdate) {
                console.log('[UpdateCheck] Downloading new Bible data...');
                localStorage.removeItem('bible_cache_version');
                localStorage.removeItem('bible_last_refresh');
                await downloadBibleForOffline();
              }

              if (swUpdated && 'serviceWorker' in navigator) {
                const reg = await navigator.serviceWorker.getRegistration();
                if (reg && reg.waiting) {
                  reg.waiting.postMessage({ type: 'SKIP_WAITING' });
                } else if (reg && reg.installing && reg.installing.state === 'installed') {
                  reg.installing.postMessage({ type: 'SKIP_WAITING' });
                }
                console.log('[UpdateCheck] Activating new service worker...');
              }

              if ('caches' in window) {
                const cacheNames = await caches.keys();
                await Promise.all(cacheNames.map(name => caches.delete(name)));
                console.log('[UpdateCheck] Cleared HTTP caches.');
              }
              if ('serviceWorker' in navigator) {
                const regs = await navigator.serviceWorker.getRegistrations();
                for (const reg of regs) {
                  await reg.unregister();
                }
                console.log('[UpdateCheck] Unregistered service workers.');
              }

              console.log('[UpdateCheck] Reloading application...');
              setTimeout(() => { window.location.href = window.location.pathname + '?refresh=' + Date.now(); }, 800);
              return;
            }

            console.log('[UpdateCheck] No updates found (pull). Loading verse...');
            window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: "Loading today's verse...", status: 'loading' } }));
            // If no SW updates (or just Bible update), load the verse
            const v = await getDailyVerseFromBible();
            setVerse(v);
            setIsOffline(false);
            
            window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: "App & Bible are up to date.", status: 'info' } }));
            setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 3000);
            scheduleDailyNotification();
          } catch (e) {
            console.error('[UpdateCheck] Pull-to-refresh check failed:', e);
            setVerse(getDailyVerse());
            setIsOffline(true);
            window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'You are offline.', status: 'info' } }));
            setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 8000);
          }
        })();
      } else {
        window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: "Loading today's verse...", status: 'loading' } }));
        getDailyVerseFromBible().then(v => {
          setVerse(v);
          setIsOffline(false);
          window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: "Today's verse loaded.", status: 'success' } }));
          setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 8000);
          scheduleDailyNotification();
        }).catch(() => {
          setVerse(getDailyVerse());
          setIsOffline(true);
          window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: 'You are offline.', status: 'info' } }));
          setTimeout(() => window.dispatchEvent(new Event('kjb-progress-clear')), 8000);
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
          setIsOffline(false);
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
    // If verse.abbr is missing (e.g. from API), try to find it using verse.book
    const bookData = BIBLE_BOOKS.find(b => b.shortName === verse.book || b.apiName === verse.book);
    const abbr = verse.abbr || bookData?.abbr || verse.book?.slice(0, 3).toUpperCase();

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
      <div className="w-full max-w-[90rem] mx-auto px-4 sm:px-8 lg:px-16 py-6">
      <OfflineStatusBanner />

      {/* Temporary Test Button for Cache Update */}
      <div className="mb-4 flex flex-col gap-2">
        <button
          onClick={() => {
            const states = [
              { msg: 'Updating Bible data...', status: 'loading' },
              { msg: 'Applying updates...', status: 'loading' },
              { msg: 'Updates applied.', status: 'success' },
              { msg: 'App is up to date.', status: 'info' },
              { msg: 'Failed to update.', status: 'error' }
            ];
            let i = 0;
            const step = () => {
              if (i < states.length) {
                window.dispatchEvent(new CustomEvent('kjb-progress', { detail: { message: states[i].msg, status: states[i].status } }));
                i++;
                setTimeout(step, 2000); // 2 seconds per state
              } else {
                window.dispatchEvent(new Event('kjb-progress-clear'));
              }
            };
            step();
          }}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-sans text-sm font-medium w-full shadow hover:opacity-90 active:scale-[0.98] transition-all"
        >
          [TEST] Show Update Banner Animation
        </button>
        <button
          onClick={() => {
            window.dispatchEvent(new CustomEvent('kjb-reloading', { detail: { text: 'Applying App & Bible Updates...' } }));
            setTimeout(() => window.location.reload(), 3000);
          }}
          className="px-4 py-2 bg-secondary text-secondary-foreground border border-border rounded-lg font-sans text-sm font-medium w-full shadow hover:opacity-90 active:scale-[0.98] transition-all"
        >
          [TEST] Show Unified Overlay
        </button>
      </div>

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
                onClick={handleRandomChapter}
                className="flex items-center gap-4 p-5 rounded-2xl border border-border shadow-sm hover:opacity-90 transition-opacity bg-secondary text-secondary-foreground text-left"
              >
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/20">
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