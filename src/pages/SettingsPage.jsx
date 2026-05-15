import React, { useState, useEffect } from 'react';
import { Settings, Bell, BellOff, Download, Trash2, ChevronDown } from 'lucide-react';
import {
  getNotificationsEnabled, getNotificationTime, setNotificationTime,
  requestNotificationPermission, disableNotifications, scheduleDailyNotification, showLocalNotification
} from '@/lib/notifications';
import { getDailyVerse } from '@/lib/dailyVerse';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { getCachedChapterCount, fetchChapter, downloadBook, getCacheKey } from '@/lib/bibleApi';

const LAST_REVISED = 'May 2026';

export default function SettingsPage() {
  const [notifEnabled, setNotifEnabled] = useState(getNotificationsEnabled);
  const [notifTime, setNotifTimeState] = useState(getNotificationTime);
  const [notifPermission, setNotifPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');
  const [cachedCount, setCachedCount] = useState(0);
  const [downloading, setDownloading] = useState(null);
  const [downloadProgress, setDownloadProgress] = useState({});
  const [expandedOT, setExpandedOT] = useState(true);
  const [expandedNT, setExpandedNT] = useState(true);
  const [downloadingAll, setDownloadingAll] = useState(false);

  useEffect(() => {
    setCachedCount(getCachedChapterCount());
  }, []);

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

  const handleDownloadBook = async (book) => {
    setDownloading(book.apiName);
    setDownloadProgress({ [book.apiName]: 0 });
    try {
      for (let c = 1; c <= book.chapters; c++) {
        try {
          await fetchChapter(book.apiName, c);
        } catch (err) {
          // Skip chapters that don't exist in the data
          console.warn(`Skipping ${book.apiName} ${c}`);
        }
        setDownloadProgress(prev => ({
          ...prev,
          [book.apiName]: Math.round((c / book.chapters) * 100)
        }));
      }
      setCachedCount(getCachedChapterCount());
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[book.apiName];
        return newProgress;
      });
    }
  };

  const handleClearCache = () => {
    if (confirm('Clear all cached Bible chapters?')) {
      for (const book of BIBLE_BOOKS) {
        for (let c = 1; c <= book.chapters; c++) {
          try {
            localStorage.removeItem(getCacheKey(book.abbr, c));
          } catch {}
        }
      }
      setCachedCount(0);
    }
  };

  const handleDownloadAll = async () => {
    if (!confirm('Download all 66 books? This may take a few minutes.')) return;
    setDownloadingAll(true);
    try {
      let totalChapters = BIBLE_BOOKS.reduce((sum, b) => sum + b.chapters, 0);
      let downloadedChapters = 0;
      
      for (const book of BIBLE_BOOKS) {
        for (let c = 1; c <= book.chapters; c++) {
          try {
            await fetchChapter(book.apiName, c);
          } catch (err) {
            // Skip chapters that don't exist in the data
            console.warn(`Skipping ${book.apiName} ${c}`);
          }
          downloadedChapters++;
          setDownloadProgress({ 'all': Math.round((downloadedChapters / totalChapters) * 100) });
        }
      }
      setCachedCount(getCachedChapterCount());
    } catch (err) {
      console.error('Download all failed:', err);
    } finally {
      setDownloadingAll(false);
      setDownloadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress['all'];
        return newProgress;
      });
    }
  };

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

      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">Offline Library</h2>
            <p className="font-sans text-xs text-muted-foreground mt-1">
              {cachedCount} of {BIBLE_BOOKS.length} books cached
            </p>
          </div>
          {downloadProgress['all'] !== undefined ? (
            <div className="shrink-0 flex flex-col items-end gap-1">
              <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-300"
                  style={{ width: `${downloadProgress['all']}%` }}
                />
              </div>
              <span className="font-sans text-xs text-muted-foreground">{downloadProgress['all']}%</span>
            </div>
          ) : (
            <button
              onClick={handleDownloadAll}
              disabled={downloadingAll}
              className="shrink-0 px-4 py-2 rounded-lg bg-accent text-accent-foreground font-sans text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Download All
            </button>
          )}
        </div>

        {/* Old Testament */}
        <div className="space-y-2 mb-4">
          <button
            onClick={() => setExpandedOT(!expandedOT)}
            className="flex items-center gap-2 font-serif font-semibold text-foreground hover:opacity-75 transition-opacity w-full text-left"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${expandedOT ? '' : '-rotate-90'}`} />
            Old Testament ({BIBLE_BOOKS.filter(b => b.testament === 'old').length} books)
          </button>
          {expandedOT && (
            <div className="space-y-2 pl-4">
              {BIBLE_BOOKS.filter(b => b.testament === 'old').length > 0 ? (
                BIBLE_BOOKS.filter(b => b.testament === 'old').map(book => (
                  <div key={book.abbr} className="flex items-center justify-between gap-3 p-2 bg-secondary/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm text-foreground truncate">{book.name}</p>
                      <p className="font-sans text-xs text-muted-foreground">{book.chapters} chapters</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {downloadProgress[book.apiName] !== undefined ? (
                        <>
                          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${downloadProgress[book.apiName]}%` }}
                            />
                          </div>
                          <span className="font-sans text-xs text-muted-foreground">{downloadProgress[book.apiName]}%</span>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDownloadBook(book)}
                          disabled={downloading === book.apiName}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No books found</p>
              )}
            </div>
          )}
        </div>

        {/* New Testament */}
        <div className="space-y-2 mb-4">
          <button
            onClick={() => setExpandedNT(!expandedNT)}
            className="flex items-center gap-2 font-serif font-semibold text-foreground hover:opacity-75 transition-opacity w-full text-left"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${expandedNT ? '' : '-rotate-90'}`} />
            New Testament ({BIBLE_BOOKS.filter(b => b.testament === 'new').length} books)
          </button>
          {expandedNT && (
            <div className="space-y-2 pl-4">
              {BIBLE_BOOKS.filter(b => b.testament === 'new').length > 0 ? (
                BIBLE_BOOKS.filter(b => b.testament === 'new').map(book => (
                  <div key={book.abbr} className="flex items-center justify-between gap-3 p-2 bg-secondary/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-sans text-sm text-foreground truncate">{book.name}</p>
                      <p className="font-sans text-xs text-muted-foreground">{book.chapters} chapters</p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {downloadProgress[book.apiName] !== undefined ? (
                        <>
                          <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${downloadProgress[book.apiName]}%` }}
                            />
                          </div>
                          <span className="font-sans text-xs text-muted-foreground">{downloadProgress[book.apiName]}%</span>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDownloadBook(book)}
                          disabled={downloading === book.apiName}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
                        >
                          <Download className="w-3 h-3" />
                          Download
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No books found</p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleClearCache}
          className="w-full px-4 py-2 rounded-lg bg-destructive/10 text-destructive font-sans text-sm font-medium hover:bg-destructive/20 flex items-center justify-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear All
        </button>
      </div>

    </div>
  );
}