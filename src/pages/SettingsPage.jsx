import React, { useState, useEffect } from 'react';
import { Settings, Bell, BellOff, Download, CheckCircle2, AlertCircle, Loader2, Trash2, Smartphone, Eye, EyeOff, ZoomIn, ZoomOut, Palette, Upload, Crop, Type } from 'lucide-react';
import ImageCropper from '@/components/bible/ImageCropper';
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
  
  const [customBg, setCustomBg] = useState(() => {
    try { return localStorage.getItem('kjb-daily-verse-bg') || ''; } catch { return ''; }
  });
  const [uploading, setUploading] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropImageForNotif, setCropImageForNotif] = useState(false);
  const [notifImage, setNotifImage] = useState(() => {
    try { return localStorage.getItem('kjb-notif-image') || ''; } catch { return ''; }
  });
  
  const [verseTextColor, setVerseTextColor] = useState(() => {
    try { return localStorage.getItem('kjb-verse-text-color') || '#ffffff'; } catch { return '#ffffff'; }
  });
  const [verseTextOpacity, setVerseTextOpacity] = useState(() => {
    try { return parseFloat(localStorage.getItem('kjb-verse-text-opacity') || '0.95'); } catch { return 0.95; }
  });
  const [verseFontFamily, setVerseFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-verse-font-family') || 'serif'; } catch { return 'serif'; }
  });

  const [zoomLevel, setZoomLevel] = useState(() => {
    try { return parseInt(localStorage.getItem('kjb-zoom') || '100'); } catch { return 100; }
  });

  const VERSE_COLORS = [
    '#000000', '#1a1a1a', '#ffffff', '#f8f8f8',
    '#fef3c7', '#fde68a', '#fbbf24', '#f59e0b',
    '#dbeafe', '#93c5fd', '#3b82f6', '#1e40af',
    '#fecaca', '#fca5a5', '#ef4444', '#b91c1c',
    '#ddd6fe', '#a78bfa', '#8b5cf6', '#5b21b6',
    '#bbf7d0', '#6ee7b7', '#10b981', '#047857',
    '#ffe4e6', '#fda4af', '#ec4899', '#9d174d',
    '#e0f2fe', '#7dd3fc', '#0ea5e9', '#0369a1'
  ];

  const VERSE_FONTS = [
    { value: 'serif', label: 'Serif' },
    { value: 'sans-serif', label: 'Sans Serif' },
    { value: 'monospace', label: 'Mono' },
    { value: 'cursive', label: 'Cursive' },
  ];

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

      {/* Appearance */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">Appearance</h2>
        <p className="font-sans text-xs text-muted-foreground">Choose how the app looks</p>
        
        {/* Custom Daily Verse Background */}
        <div className="pt-4 border-t border-border space-y-3">
          <h3 className="font-serif text-base font-semibold text-foreground">Daily Verse Background</h3>
          <p className="font-sans text-xs text-muted-foreground">Upload a custom image (stored locally, no credits)</p>
          
          {customBg ? (
            <div className="space-y-2">
              <div className="h-32 rounded-xl bg-cover bg-center border border-border" style={{ backgroundImage: `url(${customBg})` }} />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCustomBg('');
                    localStorage.removeItem('kjb-daily-verse-bg');
                    window.dispatchEvent(new Event('storage'));
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive font-sans text-xs font-medium hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Image
                </button>
                <button
                  onClick={() => {
                    const current = localStorage.getItem('kjb-daily-verse-bg');
                    if (current) setCropImage(current);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
                >
                  <Crop className="w-3.5 h-3.5" />
                  Re-crop
                </button>
              </div>
            </div>
          ) : (
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    alert('Image must be less than 2MB for storage');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const base64 = event.target?.result;
                    if (typeof base64 === 'string') {
                      setCropImage(base64); // Open cropper
                    }
                  };
                  reader.onerror = () => {
                    alert('Failed to read image');
                  };
                  reader.readAsDataURL(file);
                }}
                disabled={uploading}
                className="hidden"
              />
              <div className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-border rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer">
                {uploading ? (
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto mb-2" />
                    <p className="font-sans text-xs text-muted-foreground">Processing...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="font-sans text-xs text-muted-foreground">Click to upload image</p>
                    <p className="font-sans text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                  </div>
                )}
              </div>
            </label>
          )}
        </div>
        
        {/* Crop Modal */}
        {cropImage && (
          <ImageCropper
            image={cropImage}
            onCrop={(croppedDataUrl) => {
              try {
                if (cropImageForNotif) {
                  localStorage.setItem('kjb-notif-image', croppedDataUrl);
                  setNotifImage(croppedDataUrl);
                } else {
                  localStorage.setItem('kjb-daily-verse-bg', croppedDataUrl);
                  setCustomBg(croppedDataUrl);
                }
                window.dispatchEvent(new Event('storage'));
                setCropImage(null);
                setCropImageForNotif(false);
              } catch (err) {
                alert('Storage full! Please clear browser data or try a smaller image.');
                console.error('localStorage quota exceeded:', err);
              }
            }}
            onCancel={() => {
              setCropImage(null);
              setCropImageForNotif(false);
            }}
          />
        )}
        {/* Notification Image */}
        <div className="pt-4 border-t border-border space-y-3">
          <h3 className="font-serif text-base font-semibold text-foreground">Notification Image</h3>
          <p className="font-sans text-xs text-muted-foreground">Custom image for daily verse notifications</p>
          
          {notifImage ? (
            <div className="space-y-2">
              <div className="h-32 rounded-xl bg-cover bg-center border border-border" style={{ backgroundImage: `url(${notifImage})` }} />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setNotifImage('');
                    localStorage.removeItem('kjb-notif-image');
                    window.dispatchEvent(new Event('storage'));
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive font-sans text-xs font-medium hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
                <button
                  onClick={() => {
                    const current = localStorage.getItem('kjb-notif-image');
                    if (current) {
                      setCropImage(current);
                      setCropImageForNotif(true);
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
                >
                  <Crop className="w-3.5 h-3.5" />
                  Re-crop
                </button>
              </div>
            </div>
          ) : (
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) {
                    alert('Image must be less than 2MB for storage');
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const base64 = event.target?.result;
                    if (typeof base64 === 'string') {
                      setCropImage(base64);
                      setCropImageForNotif(true);
                    }
                  };
                  reader.onerror = () => {
                    alert('Failed to read image');
                  };
                  reader.readAsDataURL(file);
                }}
                disabled={uploading}
                className="hidden"
              />
              <div className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-border rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer">
                {uploading ? (
                  <div className="text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-accent mx-auto mb-2" />
                    <p className="font-sans text-xs text-muted-foreground">Processing...</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Bell className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                    <p className="font-sans text-xs text-muted-foreground">Click to upload notification image</p>
                    <p className="font-sans text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                  </div>
                )}
              </div>
            </label>
          )}
        </div>

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

        {/* Daily Verse Text Style */}
        <div className="pt-4 border-t border-border space-y-4">
          <h3 className="font-serif text-base font-semibold text-foreground flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Daily Verse Text Style
          </h3>
          
          {/* Text Color with Hex */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-sans text-sm text-foreground font-medium">Text Color</p>
              <code className="font-mono text-xs bg-secondary px-2 py-1 rounded">{verseTextColor}</code>
            </div>
            <div className="flex flex-wrap gap-2">
              {VERSE_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => {
                    setVerseTextColor(color);
                    localStorage.setItem('kjb-verse-text-color', color);
                    window.dispatchEvent(new Event('storage'));
                  }}
                  className={`w-8 h-8 rounded-lg border-2 transition-all ${
                    verseTextColor === color ? 'border-foreground scale-110' : 'border-slate-300 hover:border-slate-500'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Text Opacity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-sans text-sm text-foreground font-medium">Opacity</p>
              <span className="font-sans text-xs text-muted-foreground">{Math.round(verseTextOpacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.3"
              max="1"
              step="0.05"
              value={verseTextOpacity}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setVerseTextOpacity(val);
                localStorage.setItem('kjb-verse-text-opacity', String(val));
                window.dispatchEvent(new Event('storage'));
              }}
              className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
            />
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-muted-foreground" />
              <p className="font-sans text-sm text-foreground font-medium">Font Family</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {VERSE_FONTS.map(font => (
                <button
                  key={font.value}
                  onClick={() => {
                    setVerseFontFamily(font.value);
                    localStorage.setItem('kjb-verse-font-family', font.value);
                    window.dispatchEvent(new Event('storage'));
                  }}
                  className={`px-4 py-3 rounded-xl font-sans text-sm font-medium transition-all ${
                    verseFontFamily === font.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                  }`}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>







      {/* Install App */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">Install App</h2>
        <p className="font-sans text-sm text-muted-foreground leading-relaxed">
          Add the KJB Reader to your home screen for quick access and to receive daily verse notifications even when the app is closed.
        </p>
        {isInstalled ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span className="font-sans text-sm font-medium">App is installed on your home screen</span>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <Bell className="w-4 h-4 shrink-0" />
              <span className="font-sans text-xs font-medium">Notifications work when the app is open or in background</span>
            </div>
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
            <div className="space-y-2 bg-secondary/50 rounded-xl p-4">
              <p className="font-sans text-xs text-muted-foreground mb-2">
                <strong>Install instructions:</strong>
              </p>
              <div className="font-sans text-xs text-muted-foreground space-y-1.5">
                <p>• <strong>iPhone (Safari):</strong> Tap <span className="inline-flex items-center px-1.5 py-0.5 bg-background rounded text-foreground font-medium">Share</span> button at bottom, then <span className="text-foreground font-medium">"Add to Home Screen"</span></p>
                <p>• <strong>Android (Chrome):</strong> Tap <span className="inline-flex items-center px-1.5 py-0.5 bg-background rounded text-foreground font-medium">⋮ Menu</span> (top right), then <span className="text-foreground font-medium">"Install app"</span> or <span className="text-foreground font-medium">"Add to Home screen"</span></p>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <p className="font-sans text-xs text-primary font-medium flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  After installing, enable notifications below to receive daily verses
                </p>
              </div>
            </div>
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
        <h2 className="font-serif text-lg font-semibold text-foreground">Daily Verse Reminders</h2>
        <p className="font-sans text-xs text-muted-foreground">
          Get reminded to read your daily verse when you open the app. Notifications will update the verse when the app is opened.
        </p>
        {notifPermission === 'unsupported' ? (
          <div className="space-y-3">
            <p className="font-sans text-sm text-muted-foreground">
              Notifications are not supported in this browser. To enable them, install this app to your home screen:
            </p>
            <div className="font-sans text-xs text-muted-foreground space-y-1.5 bg-secondary/50 rounded-xl p-4">
              <p>• <strong>iPhone (Safari):</strong> Tap <span className="inline-flex items-center px-1.5 py-0.5 bg-background rounded text-foreground font-medium">Share</span> then <span className="text-foreground font-medium">"Add to Home Screen"</span></p>
              <p>• <strong>Android (Chrome):</strong> Tap <span className="inline-flex items-center px-1.5 py-0.5 bg-background rounded text-foreground font-medium">⋮ Menu</span> then <span className="text-foreground font-medium">"Install app"</span></p>
            </div>
          </div>
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
                    : 'Daily verse reminder when you open the app'}
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
                      Reminder when you open the app
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
                  ⏰ You will be reminded when you open the app
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* App Info */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">App Info</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center font-sans text-sm gap-4">
            <span className="text-muted-foreground shrink-0">Bible Text</span>
            <span className="text-foreground font-medium text-right">King James Bible (PCE)</span>
          </div>
          <div className="flex justify-between items-center font-sans text-sm gap-4">
            <span className="text-muted-foreground shrink-0">Version</span>
            <span className="text-foreground font-medium text-right">1.0.0</span>
          </div>
          <div className="flex justify-between items-center font-sans text-sm gap-4">
            <span className="text-muted-foreground shrink-0">Last App Revision</span>
            <span className="text-foreground font-medium text-right">{LAST_REVISED}</span>
          </div>
          <div className="flex justify-between items-center font-sans text-sm gap-4">
            <span className="text-muted-foreground shrink-0">Offline Support</span>
            <span className="text-foreground font-medium text-right flex items-center gap-1">
              {cached ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  Enabled
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  Not Downloaded
                </>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center font-sans text-sm gap-4">
            <span className="text-muted-foreground shrink-0">Notifications</span>
            <span className="text-foreground font-medium text-right flex items-center gap-1">
              {notifEnabled ? (
                <>
                  <Bell className="w-3.5 h-3.5 text-primary" />
                  Enabled
                </>
              ) : (
                <>
                  <BellOff className="w-3.5 h-3.5 text-muted-foreground" />
                  Disabled
                </>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center font-sans text-sm gap-4">
            <span className="text-muted-foreground shrink-0">PWA Status</span>
            <span className="text-foreground font-medium text-right flex items-center gap-1">
              {isInstalled ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  Installed
                </>
              ) : (
                <>
                  <Smartphone className="w-3.5 h-3.5 text-muted-foreground" />
                  Browser
                </>
              )}
            </span>
          </div>
          <div className="flex justify-between items-center font-sans text-sm gap-4">
            <span className="text-muted-foreground shrink-0">Daily Verse Panel</span>
            <span className="text-foreground font-medium text-right">Hidden by default</span>
          </div>
          <div className="flex justify-between items-center font-sans text-sm gap-4">
            <span className="text-muted-foreground shrink-0">Scroll to Top Button</span>
            <span className="text-foreground font-medium text-right">Compact size</span>
          </div>
        </div>
      </div>

      {/* App Info */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-3">
        <h2 className="font-serif text-lg font-semibold text-foreground">Credits</h2>
        <div className="space-y-2 font-sans text-xs text-muted-foreground">
          <p>• <strong className="text-foreground">Bible Text:</strong> Public Domain Edition (PCE) of the King James Bible</p>
          <p>• <strong className="text-foreground">Cormorant Garamond:</strong> Google Fonts (SIL Open Font License)</p>
          <p>• <strong className="text-foreground">Inter Font:</strong> Google Fonts (SIL Open Font License)</p>
        </div>
      </div>
    </div>
  );
}