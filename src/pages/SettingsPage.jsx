import React, { useState, useEffect } from 'react';
import { Settings, Download, Trash2, CheckCircle, Loader2, RefreshCw, Bell, BellOff } from 'lucide-react';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { getCacheKey, CACHE_PREFIX } from '@/lib/bibleApi';
import { base44 } from '@/api/base44Client';
import {
  getNotificationsEnabled, getNotificationTime, setNotificationTime,
  requestNotificationPermission, disableNotifications, scheduleDailyNotification, showLocalNotification
} from '@/lib/notifications';
import { getDailyVerse } from '@/lib/dailyVerse';

const LAST_REVISED = 'May 2026';

function getBookCacheProgress(abbr, totalChapters) {
  let count = 0;
  for (let c = 1; c <= totalChapters; c++) {
    try {
      const cached = localStorage.getItem(getCacheKey(abbr, c));
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.verses && parsed.verses.length > 0) {
          count++;
        }
      }
    } catch {}
  }
  return count;
}

function deleteBook(abbr, totalChapters) {
  for (let c = 1; c <= totalChapters; c++) {
    localStorage.removeItem(getCacheKey(abbr, c));
  }
}

function validateChapterData(data) {
  return data && 
         typeof data === 'object' && 
         Array.isArray(data.verses) && 
         data.verses.length > 0 &&
         data.verses.every(v => v.verse && v.text);
}

function isChapterCached(abbr, chapter) {
  try {
    const key = getCacheKey(abbr, chapter);
    const cached = localStorage.getItem(key);
    if (!cached) return false;
    const data = JSON.parse(cached);
    return validateChapterData(data);
  } catch {
    return false;
  }
}

export default function SettingsPage() {
  const [tab, setTab] = useState('old');
  const [downloading, setDownloading] = useState({});
  const [progress, setProgress] = useState({});
  const [cacheStatus, setCacheStatus] = useState({});
  const [storageUsed, setStorageUsed] = useState(0);
  const [notifEnabled, setNotifEnabled] = useState(getNotificationsEnabled);
  const [notifTime, setNotifTimeState] = useState(getNotificationTime);
  const [notifPermission, setNotifPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');

  const books = BIBLE_BOOKS.filter(b => b.testament === tab);

  const refreshStatus = () => {
    const status = {};
    BIBLE_BOOKS.forEach(book => {
      const downloaded = getBookCacheProgress(book.abbr, book.chapters);
      const cached = downloaded === book.chapters;
      status[book.abbr] = { cached, downloaded };
    });
    try {
      let bytes = 0;
      for (let key in localStorage) {
        if (key.startsWith(CACHE_PREFIX)) {
          bytes += (localStorage.getItem(key) || '').length * 2;
        }
      }
      setStorageUsed(bytes);
    } catch {}
    setCacheStatus(status);
    setProgress({});
  };

  useEffect(() => { refreshStatus(); }, []);

  const handleToggleNotifications = async () => {
    if (notifEnabled) {
      disableNotifications();
      setNotifEnabled(false);
    } else {
      const result = await requestNotificationPermission();
      setNotifPermission(result);
      if (result === 'granted') {
        setNotifEnabled(true);
        scheduleDailyNotification(getDailyVerse());
      }
    }
  };

  const handleTimeChange = (e) => {
    setNotifTimeState(e.target.value);
    setNotificationTime(e.target.value);
    if (notifEnabled) scheduleDailyNotification(getDailyVerse());
  };

  const handleTestNotif = () => {
    const v = getDailyVerse();
    showLocalNotification('King James Bible — Daily Verse', `"${v.text.slice(0, 100)}${v.text.length > 100 ? '…' : ''}" — ${v.ref}`);
  };

  const downloadBook = async (book) => {
    if (downloading[book.abbr]) return;
    setDownloading(prev => ({ ...prev, [book.abbr]: true }));
    setProgress(prev => ({ ...prev, [book.abbr]: 0 }));

    let completed = 0;
    const maxRetries = 2;
    const timeout = 30000; // 30 seconds per chapter

    try {
      for (let c = 1; c <= book.chapters; c++) {
        // Skip if already properly cached
        if (isChapterCached(book.abbr, c)) {
          completed++;
          setProgress(prev => ({ ...prev, [book.abbr]: completed }));
          continue;
        }

        // Attempt download with retries
        let success = false;
        for (let attempt = 0; attempt < maxRetries && !success; attempt++) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            const res = await Promise.race([
              base44.functions.invoke('bibleApi', {
                action: 'getChapter',
                book: book.apiName,
                chapter: c,
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
            ]);

            clearTimeout(timeoutId);

            if (validateChapterData(res?.data)) {
              const key = getCacheKey(book.abbr, c);
              const data = { verses: res.data.verses, colophon: res.data.colophon || null };
              localStorage.setItem(key, JSON.stringify(data));
              completed++;
              success = true;
            }
          } catch (err) {
            // Retry on failure, silently continue on last attempt
            if (attempt === maxRetries - 1) {
              console.warn(`Chapter ${book.abbr} ${c} failed after retries`);
            }
          }
        }

        setProgress(prev => ({ ...prev, [book.abbr]: completed }));
      }
    } finally {
      setDownloading(prev => ({ ...prev, [book.abbr]: false }));
      refreshStatus();
    }
  };

  const removeBook = (book) => {
    deleteBook(book.abbr, book.chapters);
    refreshStatus();
  };

  const downloadAll = async () => {
    for (const book of BIBLE_BOOKS) {
      if (!cacheStatus[book.abbr]?.cached) {
        await downloadBook(book);
      }
    }
  };

  const clearAll = () => {
    BIBLE_BOOKS.forEach(book => deleteBook(book.abbr, book.chapters));
    refreshStatus();
  };

  const totalBooks = BIBLE_BOOKS.length;
  const cachedBooks = Object.values(cacheStatus).filter(s => s?.cached).length;
  const storageMB = (storageUsed / 1024 / 1024).toFixed(1);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
          <Settings className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Settings</h1>
        <p className="font-sans text-sm text-muted-foreground">Offline downloads & app information</p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-4">
        <h2 className="font-serif text-lg font-semibold text-foreground">Daily Notifications</h2>
        {notifPermission === 'unsupported' ? (
          <p className="font-sans text-sm text-muted-foreground">Notifications are not supported in this browser. Install as a PWA for full support.</p>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-sans text-sm text-foreground font-medium">Verse of the Day</p>
                <p className="font-sans text-xs text-muted-foreground mt-0.5">
                  {notifPermission === 'denied' ? 'Blocked by browser — enable in site settings' : 'Receive a daily KJB verse reminder'}
                </p>
              </div>
              <button
                onClick={handleToggleNotifications}
                disabled={notifPermission === 'denied'}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-sans text-sm font-medium transition-colors ${
                  notifEnabled
                    ? 'bg-primary text-primary-foreground hover:opacity-90'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                } disabled:opacity-40`}
              >
                {notifEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                {notifEnabled ? 'On' : 'Off'}
              </button>
            </div>
            {notifEnabled && (
              <div className="flex items-center gap-3 pt-1">
                <label className="font-sans text-sm text-muted-foreground shrink-0">Notify at</label>
                <input
                  type="time"
                  value={notifTime}
                  onChange={handleTimeChange}
                  className="flex-1 px-3 py-1.5 rounded-lg bg-secondary border border-border text-sm font-sans text-foreground focus:outline-none focus:border-accent"
                />
                <button
                  onClick={handleTestNotif}
                  className="shrink-0 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
                >
                  Test
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* App Info */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">App Info</h2>
        <div className="flex justify-between items-center font-sans text-sm gap-4">
          <span className="text-muted-foreground shrink-0">Bible Text</span>
          <span className="text-foreground font-medium text-right">King James Bible (PCE)</span>
        </div>
        <div className="flex justify-between items-center font-sans text-sm gap-4">
          <span className="text-muted-foreground shrink-0">Last App Revision</span>
          <span className="text-foreground font-medium text-right">{LAST_REVISED}</span>
        </div>

      </div>

      {/* Offline Storage Summary */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg font-semibold text-foreground">Offline Library</h2>
          <button onClick={refreshStatus} className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="font-serif text-2xl font-bold text-foreground">{cachedBooks}</p>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">Books cached</p>
          </div>
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="font-serif text-2xl font-bold text-foreground">{totalBooks - cachedBooks}</p>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">Not cached</p>
          </div>
          <div className="bg-secondary rounded-xl p-3 text-center">
            <p className="font-serif text-2xl font-bold text-foreground">{storageMB}</p>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">MB used</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadAll}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4" />
            Download All
          </button>
          <button
            onClick={clearAll}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-sans text-sm font-semibold hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        </div>
      </div>

      {/* Per-book download */}
      <div className="mb-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTab('old')}
            className={`flex-1 py-2.5 rounded-xl font-sans font-semibold text-sm transition-colors ${
              tab === 'old' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
            }`}
          >
            Old Testament
          </button>
          <button
            onClick={() => setTab('new')}
            className={`flex-1 py-2.5 rounded-xl font-sans font-semibold text-sm transition-colors ${
              tab === 'new' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
            }`}
          >
            New Testament
          </button>
        </div>

        <div className="space-y-2">
          {books.map(book => {
            const status = cacheStatus[book.abbr] || { cached: false, downloaded: 0 };
            const isDown = downloading[book.abbr];
            const prog = progress[book.abbr] || 0;

            return (
              <div key={book.abbr} className="bg-card border border-border rounded-xl px-5 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-serif text-base font-semibold text-foreground truncate">{book.shortName}</p>
                  <p className="font-sans text-xs text-muted-foreground">
                    {isDown
                      ? `Downloading… ${prog}/${book.chapters} chapters`
                      : status.cached
                      ? `${book.chapters} chapters cached`
                      : status.downloaded > 0
                      ? `${status.downloaded}/${book.chapters} chapters`
                      : `${book.chapters} chapters`}
                  </p>
                  {isDown && (
                    <div className="mt-1.5 h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent transition-all duration-300 rounded-full"
                        style={{ width: `${(prog / book.chapters) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {status.cached && !isDown && (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <button
                        onClick={() => removeBook(book)}
                        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {!status.cached && !isDown && (
                   <button
                     onClick={() => downloadBook(book)}
                     className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 transition-opacity"
                   >
                     <Download className="w-3.5 h-3.5" />
                     {status.downloaded > 0 ? 'Resume' : 'Download'}
                   </button>
                  )}
                  {isDown && (
                    <Loader2 className="w-4 h-4 animate-spin text-accent" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-center font-sans text-xs text-muted-foreground mt-4">
        Cached data is stored locally on your device and persists between sessions.
      </p>

    </div>
  );
}