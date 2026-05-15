import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Heart, Library, Info, List, Settings, Bell, BellOff, Download, X, Loader2, CheckCircle, Bookmark, Shuffle } from 'lucide-react';
import { getDailyVerse } from '@/lib/dailyVerse';
import { registerSW, scheduleDailyNotification, getNotificationsEnabled, requestNotificationPermission, disableNotifications } from '@/lib/notifications';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { fetchChapter, getCacheKey, CACHE_PREFIX } from '@/lib/bibleApi';

const QUICK_LINKS = [
  { path: '/read', icon: BookOpen, label: 'Read the Bible', desc: 'KJB Pure Cambridge Edition', color: 'bg-primary text-primary-foreground' },
  { path: '/contents', icon: List, label: 'Table of Contents', desc: 'Browse all 66 books', color: 'bg-secondary text-secondary-foreground' },
  { path: null, icon: null, label: '__RANDOM__', desc: '', color: '' },
  { path: '/gospel', icon: Heart, label: 'The Gospel', desc: 'How to be saved', color: 'bg-red-600 text-white' },
  { path: '/resources', icon: Library, label: 'Resources', desc: 'KJB defence & study', color: 'bg-secondary text-secondary-foreground' },
  { path: '/about', icon: Info, label: 'About', desc: 'Ministry & links', color: 'bg-secondary text-secondary-foreground' },
  { path: '/saved', icon: Bookmark, label: 'Saved Verses', desc: 'Your bookmarked verses', color: 'bg-secondary text-secondary-foreground' },
  { path: '/settings', icon: Settings, label: 'Settings', desc: 'Offline downloads & info', color: 'bg-secondary text-secondary-foreground' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const verse = getDailyVerse();

  const handleRandomVerse = () => {
    const book = BIBLE_BOOKS[Math.floor(Math.random() * BIBLE_BOOKS.length)];
    const chapter = Math.floor(Math.random() * book.chapters) + 1;
    try { localStorage.setItem('kjb-position', JSON.stringify({ abbr: book.abbr, chapter, verse: null })); } catch {}
    navigate('/read');
  };
  const [notifEnabled, setNotifEnabled] = useState(getNotificationsEnabled);
  const [notifPermission, setNotifPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ done: 0, total: 0 });
  const [cachedCount, setCachedCount] = useState(0);

  useEffect(() => {
    registerSW();
    if (getNotificationsEnabled()) scheduleDailyNotification(verse);
    // Count cached books
    let count = 0;
    for (const book of BIBLE_BOOKS) {
      let allCached = true;
      for (let c = 1; c <= book.chapters; c++) {
        if (!localStorage.getItem(getCacheKey(book.abbr, c))) { allCached = false; break; }
      }
      if (allCached) count++;
    }
    setCachedCount(count);
  }, []);

  const handleVerseClick = () => {
    try {
      localStorage.setItem('kjb-position', JSON.stringify({ abbr: verse.abbr, chapter: verse.chapter, verse: verse.verse }));
    } catch {}
    navigate('/read');
  };

  const handleToggleNotif = async (e) => {
    e.stopPropagation();
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
  };

  const handleDownloadAll = async () => {
    if (downloading) return;
    setDownloading(true);
    const booksToDownload = BIBLE_BOOKS.filter(book => {
      for (let c = 1; c <= book.chapters; c++) {
        if (!localStorage.getItem(getCacheKey(book.abbr, c))) return true;
      }
      return false;
    });
    const totalChapters = booksToDownload.reduce((sum, b) => sum + b.chapters, 0);
    let done = 0;
    setDownloadProgress({ done: 0, total: totalChapters });
    for (const book of booksToDownload) {
      for (let c = 1; c <= book.chapters; c++) {
        if (!localStorage.getItem(getCacheKey(book.abbr, c))) {
          try {
            await fetchChapter(book.apiName, c);
          } catch {}
        }
        done++;
        setDownloadProgress({ done, total: totalChapters });
      }
    }
    setDownloading(false);
    setCachedCount(BIBLE_BOOKS.length);
  };

  const totalBooks = BIBLE_BOOKS.length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Daily verse of the day */}
      <div className="w-full bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-2xl mb-4 overflow-hidden">
        <button
          onClick={handleVerseClick}
          className="w-full p-8 md:p-12 text-center hover:from-primary/15 hover:to-accent/15 transition-all cursor-pointer"
        >
          <p className="font-sans text-xs text-primary tracking-widest uppercase font-semibold mb-4">Verse of the Day</p>
          <blockquote className="font-serif text-2xl md:text-3xl font-bold text-foreground leading-relaxed italic mb-4">
            "{verse.text}"
          </blockquote>
          <p className="font-sans text-base font-semibold text-primary">— {verse.ref} (KJB)</p>
          <div className="mt-6 w-12 h-px bg-accent mx-auto" />
        </button>
        {/* Action buttons */}
        <div className="flex border-t border-primary/15">
          <button
            onClick={handleToggleNotif}
            className={`flex-1 flex items-center justify-center gap-2 py-3 font-sans text-sm font-medium transition-colors border-r border-primary/15 ${
              notifEnabled ? 'text-primary bg-primary/10 hover:bg-primary/15' : 'text-muted-foreground hover:bg-primary/5'
            }`}
          >
            {notifEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            {notifEnabled ? 'Reminders On' : 'Daily Reminder'}
          </button>
          <button
            onClick={() => setShowOfflineModal(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 font-sans text-sm font-medium text-muted-foreground hover:bg-primary/5 transition-colors"
          >
            <Download className="w-4 h-4" />
            {cachedCount === totalBooks ? 'Downloaded' : 'Download Offline'}
          </button>
        </div>
      </div>

      {/* Quick links */}
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
                  <p className="font-serif font-bold text-lg leading-tight">Random Verse</p>
                  <p className="font-sans text-xs opacity-75 mt-0.5">Jump to a random passage</p>
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

      {/* Offline Download Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => !downloading && setShowOfflineModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-foreground">Offline Bible</h2>
              {!downloading && (
                <button onClick={() => setShowOfflineModal(false)} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            {cachedCount === totalBooks ? (
              <div className="text-center py-4">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="font-sans text-sm text-foreground font-semibold mb-1">All 66 books downloaded</p>
                <p className="font-sans text-xs text-muted-foreground">You can read the entire Bible offline.</p>
              </div>
            ) : downloading ? (
              <div className="py-2">
                <div className="flex items-center gap-2 mb-3">
                  <Loader2 className="w-4 h-4 animate-spin text-accent flex-shrink-0" />
                  <p className="font-sans text-sm text-foreground">Downloading… {downloadProgress.done}/{downloadProgress.total} chapters</p>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-300 rounded-full"
                    style={{ width: `${downloadProgress.total ? (downloadProgress.done / downloadProgress.total) * 100 : 0}%` }}
                  />
                </div>
                <p className="font-sans text-xs text-muted-foreground mt-2 text-center">Please keep this page open</p>
              </div>
            ) : (
              <>
                <p className="font-sans text-sm text-muted-foreground mb-1">
                  <span className="font-semibold text-foreground">{cachedCount}/{totalBooks}</span> books cached
                </p>
                <p className="font-sans text-sm text-muted-foreground mb-5">
                  Download the entire King James Bible to read without an internet connection.
                </p>
                <button
                  onClick={handleDownloadAll}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  <Download className="w-4 h-4" />
                  Download All 66 Books
                </button>
              </>
            )}
          </div>
        </div>
      )}

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
  );
}