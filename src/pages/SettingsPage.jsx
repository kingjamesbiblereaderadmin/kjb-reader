import React, { useState, useEffect } from 'react';
import { Settings, Bell, BellOff, Download, Trash2, ChevronDown } from 'lucide-react';
import {
  getNotificationsEnabled, getNotificationTime, setNotificationTime,
  requestNotificationPermission, disableNotifications, scheduleDailyNotification, showLocalNotification
} from '@/lib/notifications';
import { getDailyVerse } from '@/lib/dailyVerse';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { getCachedChapterCount, downloadBook, getCacheKey } from '@/lib/bibleApi';

const LAST_REVISED = 'May 2026';

export default function SettingsPage() {
  const [notifEnabled, setNotifEnabled] = useState(getNotificationsEnabled);
  const [notifTime, setNotifTimeState] = useState(getNotificationTime);
  const [notifPermission, setNotifPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');
  const [cachedCount, setCachedCount] = useState(0);
  const [downloading, setDownloading] = useState(null);
  const [expandedTestament, setExpandedTestament] = useState('all');
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
    try {
      await downloadBook(book.apiName);
      setCachedCount(getCachedChapterCount());
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
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
        <h2 className="font-serif text-lg font-semibold text-foreground mb-3">Offline Library</h2>
        <p className="font-sans text-sm text-foreground mb-4">
          Download Bible books to read offline. {cachedCount} of {BIBLE_BOOKS.length} books cached.
        </p>
        <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
          {BIBLE_BOOKS.map(book => (
            <div key={book.abbr} className="flex items-center justify-between gap-3 p-3 bg-secondary/50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm text-foreground truncate">{book.name}</p>
                <p className="font-sans text-xs text-muted-foreground">{book.chapters} chapters</p>
              </div>
              <button
                onClick={() => handleDownloadBook(book)}
                disabled={downloading === book.apiName}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Download className="w-3 h-3" />
                {downloading === book.apiName ? 'Downloading...' : 'Download'}
              </button>
            </div>
          ))}
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