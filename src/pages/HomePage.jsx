import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Heart, Library, Info, List, Settings, Bell, BellOff, Bookmark, Shuffle, RotateCw } from 'lucide-react';
import DailyVerseImage from '@/components/bible/DailyVerseImage';
import { getRandomVerseFromBible, getDailyVerseFallback } from '@/lib/dailyVerse';
import { registerSW, scheduleDailyNotification, getNotificationsEnabled, requestNotificationPermission, disableNotifications } from '@/lib/notifications';
import { BIBLE_BOOKS } from '@/lib/bibleData';

const READ_LINK = { path: '/read', icon: BookOpen, label: 'Read the Bible', desc: 'KJB Pure Cambridge Edition', color: 'bg-primary text-primary-foreground' };

const QUICK_LINKS = [
  { path: '/contents', icon: List, label: 'Table of Contents', desc: 'Browse all 66 books', color: 'bg-secondary text-secondary-foreground' },
  { path: null, icon: null, label: '__RANDOM__', desc: '', color: '' },
  { path: '/saved', icon: Bookmark, label: 'Saved Verses', desc: 'Your bookmarked verses', color: 'bg-secondary text-secondary-foreground' },
  { path: '/resources', icon: Library, label: 'Resources', desc: 'KJB defence & study', color: 'bg-secondary text-secondary-foreground' },
  { path: '/about', icon: Info, label: 'About', desc: 'Ministry & links', color: 'bg-secondary text-secondary-foreground' },
  { path: '/settings', icon: Settings, label: 'Settings', desc: 'Offline downloads & info', color: 'bg-secondary text-secondary-foreground' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [verse, setVerse] = useState(getDailyVerseFallback());
  const [refreshing, setRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  useEffect(() => {
    getRandomVerseFromBible().then(v => setVerse(v)).catch(() => {});
  }, []);

  const handleRefresh = async () => {
    if (refreshing) return;
    setRefreshing(true);
    try {
      await getRandomVerseFromBible().then(v => setVerse(v)).catch(() => {});
      // Small delay to show the animation
      await new Promise(resolve => setTimeout(resolve, 600));
    } finally {
      setRefreshing(false);
    }
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const diff = touchEndY.current - touchStartY.current;
    // Pull down more than 100px from the very top
    if (diff > 100 && window.scrollY === 0) {
      handleRefresh();
    }
  };

  const handleRandomVerse = () => {
    const book = BIBLE_BOOKS[Math.floor(Math.random() * BIBLE_BOOKS.length)];
    const chapter = Math.floor(Math.random() * book.chapters) + 1;
    try { localStorage.setItem('kjb-position', JSON.stringify({ abbr: book.abbr, chapter, verse: null })); } catch {}
    navigate('/read');
  };

  const [notifEnabled, setNotifEnabled] = useState(getNotificationsEnabled);
  const [notifPermission, setNotifPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');

  useEffect(() => {
    registerSW();
    if (getNotificationsEnabled()) scheduleDailyNotification(verse);

    const handleStorageChange = () => {
      setNotifEnabled(getNotificationsEnabled());
      setNotifPermission('Notification' in window ? Notification.permission : 'unsupported');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleVerseClick = () => {
    // Ensure we have valid verse data before navigating
    if (!verse.abbr || !verse.chapter || !verse.verse) {
      console.warn('Invalid verse data:', verse);
      return;
    }
    console.log('Saving verse position:', { abbr: verse.abbr, chapter: verse.chapter, verse: verse.verse });
    try {
      localStorage.setItem('kjb-position', JSON.stringify({ abbr: verse.abbr, chapter: verse.chapter, verse: verse.verse }));
    } catch (err) {
      console.error('Failed to save verse position:', err);
    }
    navigate('/read');
  };

  const handleToggleNotif = async (e) => {
    if (e) e.stopPropagation();
    if (notifEnabled) {
      disableNotifications();
      setNotifEnabled(false);
    } else {
      if (!('Notification' in window)) {
        alert('Notifications are not supported in this browser. Try installing the app or using a different browser.');
        return;
      }
      const result = await requestNotificationPermission();
      setNotifPermission(result);
      if (result === 'granted') {
        setNotifEnabled(true);
        scheduleDailyNotification(verse);
      } else if (result === 'denied') {
        alert('Notifications are blocked. Please allow notifications in your browser settings for this site.');
      }
    }
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-background"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Pull-to-refresh indicator */}
      {refreshing && (
        <div className="fixed top-16 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="bg-card/90 backdrop-blur border border-border rounded-full px-4 py-2 shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
            <RotateCw className="w-4 h-4 text-accent animate-spin" />
            <span className="font-sans text-sm font-medium text-foreground">Refreshing...</span>
          </div>
        </div>
      )}

      {/* Daily verse card */}
      <div
        onClick={handleVerseClick}
        className="w-full mb-6 cursor-pointer group relative"
      >
        <DailyVerseImage verse={verse} />
        {/* Bell overlay */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleNotif(e);
          }}
          className="absolute top-3 right-3 p-2 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur transition-colors"
          title={notifEnabled ? 'Reminders on' : 'Reminders off'}
        >
          {notifEnabled ? (
            <Bell className="w-5 h-5 text-white" />
          ) : (
            <BellOff className="w-5 h-5 text-white/60" />
          )}
        </button>
      </div>

      {/* Quick links */}
      {/* Full-width Read the Bible */}
      <Link
        to={READ_LINK.path}
        className={`flex items-center gap-4 p-5 rounded-2xl shadow-sm hover:opacity-90 transition-opacity mb-4 ${READ_LINK.color}`}
      >
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl bg-white/20">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <p className="font-serif font-bold text-lg leading-tight">{READ_LINK.label}</p>
          <p className="font-sans text-xs opacity-75 mt-0.5">{READ_LINK.desc}</p>
        </div>
      </Link>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {QUICK_LINKS.map(link => {
          if (link.label === '__RANDOM__') {
            return (
              <button
                key="random"
                onClick={handleRandomVerse}
                className="flex items-center gap-4 p-5 rounded-2xl shadow-sm hover:opacity-90 transition-opacity bg-secondary text-secondary-foreground text-left"
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
              className={`flex items-center gap-4 p-5 rounded-2xl shadow-sm hover:opacity-90 transition-opacity ${link.color}`}
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