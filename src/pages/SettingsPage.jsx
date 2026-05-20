import React, { useState, useEffect } from 'react';
import { Settings, Bell, BellOff, Download, CheckCircle2, AlertCircle, Loader2, Trash2, Smartphone, Eye, EyeOff, ZoomIn, ZoomOut, Type, Palette } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { base44 } from '@/api/base44Client';
import { useTheme, COLOUR_PALETTES } from '@/lib/themeContext';
import {
  getNotificationsEnabled, getNotificationTime, setNotificationTime,
  requestNotificationPermission, disableNotifications, scheduleDailyNotification, showLocalNotification,
  getReadingReminderEnabled, getReadingReminderTime, setReadingReminderTime,
  enableReadingReminder, disableReadingReminder, scheduleReadingReminder
} from '@/lib/notifications';
import { getDailyVerse } from '@/lib/dailyVerse';
import { downloadBibleForOffline, clearBibleCache, isBibleCached } from '@/lib/bibleCache';

const LAST_REVISED = 'May 2026';

export default function SettingsPage() {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const { isDark, mode, setMode, colourId, setColourId } = useTheme();
  const [footerHidden, setFooterHidden] = useState(() => {
    try { return localStorage.getItem('kjb-footer-hidden') === 'true'; } catch { return false; }
  });
  const [zoomLevel, setZoomLevel] = useState(() => {
    try { return parseInt(localStorage.getItem('kjb-zoom') || '100'); } catch { return 100; }
  });
  const [dyslexicFont, setDyslexicFont] = useState(() => {
    try { return localStorage.getItem('kjb-dyslexic-font') === 'true'; } catch { return false; }
  });
  const [theme1611, setTheme1611] = useState(() => {
    try { return localStorage.getItem('kjb-theme-1611') !== 'false'; } catch { return true; }
  });
  const [notifEnabled, setNotifEnabled] = useState(getNotificationsEnabled);
  const [notifTime, setNotifTimeState] = useState(getNotificationTime);
  const [notifPermission, setNotifPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');
  const [readingReminderEnabled, setReadingReminderEnabled] = useState(getReadingReminderEnabled);
  const [readingReminderTime, setReadingReminderTimeState] = useState(getReadingReminderTime);

  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const [cached, setCached] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState(0);
  const [dlStatus, setDlStatus] = useState('');
  const [dlError, setDlError] = useState('');

  useEffect(() => {
    isBibleCached().then(setCached);

    // Listen for storage events to sync with FirstLoadPrompt
    const handleStorage = () => {
      isBibleCached().then(setCached);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Set dyslexic font attribute on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-dyslexic-font', String(dyslexicFont));
  }, [dyslexicFont]);

  // Refresh notification state on focus
  useEffect(() => {
    const handleFocus = () => {
      setNotifEnabled(getNotificationsEnabled());
      setNotifPermission('Notification' in window ? Notification.permission : 'unsupported');
      setReadingReminderEnabled(getReadingReminderEnabled());
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  const handleToggleNotifications = async () => {
    if (notifEnabled) {
      disableNotifications();
      setNotifEnabled(false);
      setNotifPermission('Notification' in window ? Notification.permission : 'unsupported');
      window.dispatchEvent(new Event('storage'));
      return;
    }
    
    if (!('Notification' in window)) {
      alert('Notifications are not supported in this browser. Try installing the app or using a different browser.');
      return;
    }
    
    try {
      const result = await requestNotificationPermission();
      setNotifPermission(result);
      
      if (result === 'granted') {
        setNotifEnabled(true);
        scheduleDailyNotification(getDailyVerse());
        window.dispatchEvent(new Event('storage'));
      } else if (result === 'denied') {
        alert('Notifications are blocked. Please allow notifications in your browser settings for this site.');
      }
    } catch (err) {
      console.error('Notification permission error:', err);
      alert('Failed to request notification permission. Please try again.');
    }
  };

  const handleTimeChange = (e) => {
    setNotifTimeState(e.target.value);
    setNotificationTime(e.target.value);
    if (notifEnabled) scheduleDailyNotification(getDailyVerse());
  };

  const handleTestNotif = () => {
    const v = getDailyVerse();
    showLocalNotification('King James Bible — Verse of the Day', `"${v.text.slice(0, 100)}${v.text.length > 100 ? '…' : ''}" — ${v.ref}`);
  };

  const handleToggleReadingReminder = async () => {
    if (readingReminderEnabled) {
      disableReadingReminder();
      setReadingReminderEnabled(false);
    } else {
      if (!('Notification' in window)) {
        alert('Notifications are not supported in this browser. Try installing the app or using a different browser.');
        return;
      }
      const result = await requestNotificationPermission();
      setNotifPermission(result);
      if (result === 'granted') {
        enableReadingReminder();
        setReadingReminderEnabled(true);
        scheduleReadingReminder();
      } else if (result === 'denied') {
        alert('Notifications are blocked. Please allow notifications in your browser settings for this site.');
      }
    }
  };

  const handleReadingReminderTimeChange = (e) => {
    setReadingReminderTimeState(e.target.value);
    setReadingReminderTime(e.target.value);
    if (readingReminderEnabled) scheduleReadingReminder();
  };

  const handleDownload = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDownloading(true);
    setDlError('');
    setDlProgress(0);
    setDlStatus('Starting download...');
    try {
      await downloadBibleForOffline((pct, msg) => {
        setDlProgress(pct);
        setDlStatus(msg);
      });
      setCached(true);
      setDlStatus('All 66 books downloaded successfully!');
      // Dispatch storage event to sync FirstLoadPrompt
      window.dispatchEvent(new Event('storage'));
      // Also update localStorage to prevent prompt from reappearing
      try {
        localStorage.setItem('kjb-prompt-dismissed', 'true');
      } catch {}
    } catch (err) {
      setDlError('Download failed: ' + err.message + '. Please check your connection and try again.');
    }
    setDownloading(false);
  };

  const handleClearCache = async () => {
    await clearBibleCache();
    setCached(false);
    setDlProgress(0);
    setDlStatus('');
    setDlError('');
    // Force reload to re-fetch with fresh parsing
    window.location.reload();
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

      {/* Appearance */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">Appearance</h2>
        <p className="font-sans text-xs text-muted-foreground">Choose how the app looks</p>
        <div className="grid grid-cols-4 gap-2">
          {[
            { id: 'light', label: '☀️ Light' },
            { id: 'dark', label: '🌙 Dark' },
            { id: 'auto', label: '🕐 Auto' },
            { id: 'system', label: '📱 System' },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setMode(opt.id)}
              className={`py-2 rounded-xl font-sans text-sm font-medium transition-colors ${
                mode === opt.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="font-sans text-xs text-muted-foreground">
          {mode === 'auto' ? '🕐 Auto: light 6am–6pm, dark 6pm–6am' :
           mode === 'system' ? '📱 System: follows your device setting' :
           mode === 'dark' ? '🌙 Dark mode always on' : '☀️ Light mode always on'}
        </p>

        {/* 1611 vs Modern Theme Toggle */}
        <div className="pt-3 border-t border-border">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="font-sans text-sm text-foreground font-medium">1611 Historical Theme</p>
              <p className="font-sans text-xs text-muted-foreground mt-0.5">
                {theme1611 ? 'Aged parchment & leather aesthetic' : 'Clean modern design'}
              </p>
            </div>
            <button
              onClick={() => {
                const newVal = !theme1611;
                setTheme1611(newVal);
                try { localStorage.setItem('kjb-theme-1611', String(newVal)); } catch {}
                // Reload to apply theme change
                setTimeout(() => window.location.reload(), 300);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-sans text-sm font-medium transition-colors ${
                theme1611
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
              }`}
            >
              <Palette className="w-4 h-4" />
              {theme1611 ? '1611' : 'Modern'}
            </button>
          </div>
        </div>

        {/* Colour palette */}
        <div className="pt-2 border-t border-border space-y-2">
          <p className="font-sans text-sm text-foreground font-medium">Accent Colour</p>
          <div className="flex flex-wrap gap-2">
            {COLOUR_PALETTES.map(p => (
              <button
                key={p.id}
                onClick={() => setColourId(p.id)}
                title={p.name}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-sans text-xs font-medium border-2 transition-all ${
                  colourId === p.id
                    ? 'border-foreground scale-105 bg-secondary'
                    : 'border-transparent bg-secondary hover:border-border'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full shrink-0"
                  style={{ backgroundColor: p.swatch }}
                />
                {p.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dyslexic Font */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">Dyslexic Font</h2>
        <p className="font-sans text-sm text-muted-foreground">Use OpenDyslexic font for easier reading</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-sans text-sm text-foreground font-medium">
              {dyslexicFont ? 'Dyslexic font enabled' : 'Standard font'}
            </p>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">
              {dyslexicFont ? 'Using OpenDyslexic font' : 'Using Cormorant Garamond font'}
            </p>
          </div>
          <button
            onClick={() => {
              const newVal = !dyslexicFont;
              setDyslexicFont(newVal);
              try { localStorage.setItem('kjb-dyslexic-font', String(newVal)); } catch {}
              // Set attribute on document root for global CSS to detect
              document.documentElement.setAttribute('data-dyslexic-font', String(newVal));
              // Dispatch event to notify other components
              window.dispatchEvent(new Event('dyslexic-font-change'));
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-sans text-sm font-medium transition-colors ${
              dyslexicFont
                ? 'bg-primary text-primary-foreground hover:opacity-90'
                : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
            }`}
          >
            <Type className="w-4 h-4" />
            {dyslexicFont ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>

      {/* Text Zoom */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">Text Size</h2>
        <p className="font-sans text-sm text-muted-foreground">Default zoom level for Bible text</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-sans text-sm text-foreground font-medium">Current: {zoomLevel}%</p>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">
              {zoomLevel < 100 ? 'Smaller text' : zoomLevel > 100 ? 'Larger text' : 'Default size'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const newZoom = Math.max(75, zoomLevel - 25);
                setZoomLevel(newZoom);
                try { localStorage.setItem('kjb-zoom', String(newZoom)); } catch {}
              }}
              className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent/20 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                const newZoom = Math.min(150, zoomLevel + 25);
                setZoomLevel(newZoom);
                try { localStorage.setItem('kjb-zoom', String(newZoom)); } catch {}
              }}
              className="p-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent/20 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            {zoomLevel !== 100 && (
              <button
                onClick={() => {
                  setZoomLevel(100);
                  try { localStorage.setItem('kjb-zoom', '100'); } catch {}
                }}
                className="px-3 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer Visibility */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">Footer Menu</h2>
        <p className="font-sans text-sm text-muted-foreground">Bottom navigation auto-hides when reading and shows after 3 seconds of inactivity</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-sans text-sm text-foreground font-medium">Auto-hide Footer</p>
            <p className="font-sans text-xs text-muted-foreground mt-0.5">
              {footerHidden ? 'Currently hidden' : 'Currently visible'}
            </p>
          </div>
          <button
            onClick={() => {
              const newVal = !footerHidden;
              setFooterHidden(newVal);
              try { localStorage.setItem('kjb-footer-hidden', String(newVal)); } catch {}
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-sans text-sm font-medium transition-colors ${
              footerHidden
                ? 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                : 'bg-primary text-primary-foreground hover:opacity-90'
            }`}
          >
            {footerHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {footerHidden ? 'Show' : 'Hide'}
          </button>
        </div>
      </div>

      {/* Install App */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">Install App</h2>
        <p className="font-sans text-sm text-muted-foreground leading-relaxed">
          Add the KJB Reader to your home screen for quick access and to enable daily verse notifications when the app is closed.
        </p>
        {isInstalled ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span className="font-sans text-sm font-medium">App is installed on your home screen</span>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={async () => {
                const accepted = await promptInstall();
                if (!accepted) {
                  // Manual install instructions will show below
                }
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Smartphone className="w-4 h-4" />
              Add to Home Screen
            </button>
            {!isInstallable && (
              <div className="space-y-2 bg-secondary/50 rounded-xl p-4">
                <p className="font-sans text-xs text-muted-foreground mb-2">
                  <strong>Manual install:</strong>
                </p>
                <div className="font-sans text-xs text-muted-foreground space-y-1">
                  <p>• <strong>iPhone (Safari):</strong> Tap <span className="inline-flex items-center px-1.5 py-0.5 bg-background rounded text-foreground font-medium">⎕ Share</span> then <span className="text-foreground font-medium">"Add to Home Screen"</span></p>
                  <p>• <strong>Android (Chrome):</strong> Tap <span className="inline-flex items-center px-1.5 py-0.5 bg-background rounded text-foreground font-medium">⋮ Menu</span> then <span className="text-foreground font-medium">"Install app"</span> or <span className="text-foreground font-medium">"Add to Home screen"</span></p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Offline Library */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6">
        <h2 className="font-serif text-lg font-semibold text-foreground mb-2">Bible Cache</h2>
        <p className="font-sans text-sm text-muted-foreground mb-4">
          Download all 66 books to your device for offline reading. Once downloaded, the Bible is available without an internet connection.
        </p>

        {cached ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span className="font-sans text-sm font-medium">The Bible is cached — available offline</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  await handleClearCache();
                  // Auto-download fresh data with pilcrows
                  setTimeout(() => handleDownload(), 500);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Download className="w-3.5 h-3.5" />
                Refresh with Latest
              </button>
              <button
                onClick={handleClearCache}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive font-sans text-xs font-medium hover:bg-destructive/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear Cache
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {!downloading && !dlStatus && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-sans text-sm">Not downloaded — Bible loads from network each visit</span>
              </div>
            )}
            <button
              onClick={handleDownload}
              onTouchEnd={(e) => { e.preventDefault(); handleDownload(e); }}
              disabled={downloading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              {downloading ? 'Downloading…' : 'Download All 66 Books (Offline)'}
            </button>
            {downloading && (
              <div className="space-y-2">
                <div className="w-full bg-secondary rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${dlProgress}%` }}
                  />
                </div>
                <p className="font-sans text-xs text-muted-foreground">{dlStatus}</p>
              </div>
            )}
            {dlStatus && !downloading && (
              <p className="font-sans text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {dlStatus}
              </p>
            )}
            {dlError && (
              <p className="font-sans text-sm text-destructive flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> {dlError}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-4">
        <h2 className="font-serif text-lg font-semibold text-foreground">Daily Notifications</h2>
        {notifPermission === 'unsupported' ? (
          <p className="font-sans text-sm text-muted-foreground">Notifications are not supported in this browser. To enable them, add this app to your home screen (install as a PWA) using Chrome on Android or Safari on iPhone.</p>
        ) : (
          <>
            {/* Verse of the Day */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="font-sans text-sm text-foreground font-medium">Verse of the Day</p>
                  {notifEnabled && <Bell className="w-3.5 h-3.5 text-primary" />}
                </div>
                <p className="font-sans text-xs text-muted-foreground">
                  {notifPermission === 'denied'
                    ? 'Blocked — go to your browser/app settings and allow notifications for this site'
                    : 'Get a daily verse at your chosen time, even when the app is closed'}
                </p>
              </div>
              <Switch
                checked={notifEnabled}
                onCheckedChange={handleToggleNotifications}
                disabled={notifPermission === 'denied'}
                className="shrink-0"
              />
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

            {/* Reading Reminder */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-sans text-sm text-foreground font-medium">Reading Reminder</p>
                      {readingReminderEnabled && <Bell className="w-3.5 h-3.5 text-primary" />}
                    </div>
                    <p className="font-sans text-xs text-muted-foreground">
                      Daily reminder to read your assigned chapter
                    </p>
                  </div>
                  {readingReminderEnabled && (
                    <div className="flex items-center gap-2">
                      <label className="font-sans text-xs text-muted-foreground">at</label>
                      <input
                        type="time"
                        value={readingReminderTime}
                        onChange={handleReadingReminderTimeChange}
                        className="px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs font-sans text-foreground focus:outline-none focus:border-accent"
                      />
                    </div>
                  )}
                </div>
                <Switch
                  checked={readingReminderEnabled}
                  onCheckedChange={handleToggleReadingReminder}
                  disabled={notifPermission === 'denied'}
                  className="shrink-0"
                />
              </div>
              {readingReminderEnabled && (
                <p className="font-sans text-xs text-muted-foreground bg-secondary/50 rounded-lg p-2">
                  ⏰ You will be reminded daily to read your assigned chapter at {readingReminderTime}
                </p>
              )}
            </div>
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

      {/* Font & Credits */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">Font & Credits</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center font-sans text-sm gap-4">
            <span className="text-muted-foreground shrink-0">Standard Font</span>
            <span className="text-foreground font-medium text-right">Cormorant Garamond</span>
          </div>
          <div className="flex justify-between items-center font-sans text-sm gap-4">
            <span className="text-muted-foreground shrink-0">Dyslexic Font</span>
            <span className="text-foreground font-medium text-right">OpenDyslexic</span>
          </div>
          <div className="flex justify-between items-center font-sans text-sm gap-4">
            <span className="text-muted-foreground shrink-0">OpenDyslexic Author</span>
            <span className="text-foreground font-medium text-right">Abelardo Gonzalez</span>
          </div>
          <div className="flex justify-between items-center font-sans text-sm gap-4">
            <span className="text-muted-foreground shrink-0">OpenDyslexic License</span>
            <span className="text-foreground font-medium text-right">SIL Open Font License</span>
          </div>
        </div>
        <div className="pt-3 mt-3 border-t border-border">
          <h3 className="font-serif text-sm font-semibold text-foreground mb-2">Public Sources</h3>
          <div className="space-y-2 font-sans text-xs text-muted-foreground">
            <p>• <strong className="text-foreground">Bible Text:</strong> Public Domain Edition (PCE) of the King James Bible</p>
            <p>• <strong className="text-foreground">OpenDyslexic Font:</strong> <a href="https://opendyslexic.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">opendyslexic.org</a> by Abelardo Gonzalez</p>
            <p>• <strong className="text-foreground">Support OpenDyslexic:</strong> <a href="https://antijingoist.itch.io/open-dyslexic" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">itch.io (donations)</a></p>
            <p>• <strong className="text-foreground">Cormorant Garamond:</strong> Google Fonts (SIL Open Font License)</p>
            <p>• <strong className="text-foreground">Inter Font:</strong> Google Fonts (SIL Open Font License)</p>
          </div>
        </div>
      </div>
    </div>
  );
}