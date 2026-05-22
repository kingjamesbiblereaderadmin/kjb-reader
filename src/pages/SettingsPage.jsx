import React, { useState, useEffect } from 'react';
import { Settings, Bell, BellOff, Download, CheckCircle2, AlertCircle, Loader2, Trash2, Smartphone, Eye, EyeOff, ZoomIn, ZoomOut, Palette, Upload, Crop, Type, ChevronDown, CheckCircle, ExternalLink, Shield, MessageCircle, Instagram } from 'lucide-react';

const TikTokIcon = () => (
  <svg className="w-4 h-4 text-green-500" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05 6.33 6.33 0 0 0-5 10.14 6.32 6.32 0 0 0 10.93-4.5V8.38a7.72 7.72 0 0 0 4.22 1.28V6.69a4.76 4.76 0 0 1-3.77-4.25Z"/>
  </svg>
);
import ImageCropper from '@/components/bible/ImageCropper';
import { Switch } from '@/components/ui/switch';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { base44 } from '@/api/base44Client';
import { useTheme, COLOUR_PALETTES } from '@/lib/themeContext';
import { useNavigate } from 'react-router-dom';
import {
  getNotificationsEnabled, getNotificationTime, setNotificationTime,
  requestNotificationPermission, disableNotifications, scheduleDailyNotification, showLocalNotification,
  updatePushPreferredHour
} from '@/lib/notifications';

import { getDailyVerse } from '@/lib/dailyVerse';
import { downloadBibleForOffline, clearBibleCache, isBibleCached } from '@/lib/bibleCache';

const LAST_REVISED = 'May 2026';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    text: true,
    appearance: true,
    install: true,
    offline: true,
    notifications: true,
    info: true,
    credits: true,
    advanced: true,
    contact: true,
  });
  const { isDark, mode, setMode, colourId, setColourId } = useTheme();
  
  const [customBg, setCustomBg] = useState(() => {
    try { return localStorage.getItem('kjb-daily-verse-bg') || ''; } catch { return ''; }
  });
  const [uploading, setUploading] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropImageForNotif, setCropImageForNotif] = useState(false);
  const [pendingBg, setPendingBg] = useState(null);

  // Clear pending image when storage changes (sync across tabs)
  useEffect(() => {
    const handleStorage = () => {
      try { setCustomBg(localStorage.getItem('kjb-daily-verse-bg') || ''); } catch {}
      setPendingBg(null);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  
  const [verseTextColor, setVerseTextColor] = useState(() => {
    try { return localStorage.getItem('kjb-verse-text-color') || '#ffffff'; } catch { return '#ffffff'; }
  });
  const [verseTextOpacity, setVerseTextOpacity] = useState(() => {
    try { return parseFloat(localStorage.getItem('kjb-verse-text-opacity') || '0.95'); } catch { return 0.95; }
  });
  const [readerFontFamily, setReaderFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-reader-font-family') || 'serif'; } catch { return 'serif'; }
  });
  const [verseFontFamily, setVerseFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-verse-font-family') || 'serif'; } catch { return 'serif'; }
  });
  const [showVersePanel, setShowVersePanel] = useState(() => {
    try { return localStorage.getItem('kjb-verse-panel-visible') !== 'false'; } catch { return true; }
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
    { value: 'serif', label: 'Serif (Merriweather)' },
    { value: 'sans-serif', label: 'Sans Serif (Inter)' },
    { value: 'monospace', label: 'Mono' },
    { value: 'cursive', label: 'Cursive' },
  ];

  const [notifEnabled, setNotifEnabled] = useState(getNotificationsEnabled);
  const [notifTime, setNotifTimeState] = useState(getNotificationTime);
  const [notifPermission, setNotifPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');

  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();
  const [cached, setCached] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [dlProgress, setDlProgress] = useState(0);
  const [dlStatus, setDlStatus] = useState('');
  const [dlError, setDlError] = useState('');

  useEffect(() => {
    isBibleCached().then(async (isCached) => {
      setCached(isCached);
      // If user just triggered "Clear Cache & Reload", auto-start the download now
      try {
        if (!isCached && localStorage.getItem('kjb-auto-redownload') === 'true') {
          localStorage.removeItem('kjb-auto-redownload');
          handleDownload();
        }
      } catch {}
    });

    // Listen for storage events to sync settings across tabs
    const handleStorage = () => {
      isBibleCached().then(setCached);
      try { setReaderFontFamily(localStorage.getItem('kjb-reader-font-family') || 'serif'); } catch {}
      try { setZoomLevel(parseInt(localStorage.getItem('kjb-zoom') || '100')); } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Refresh notification state on focus
  useEffect(() => {
    const handleFocus = () => {
      setNotifEnabled(getNotificationsEnabled());
      setNotifPermission('Notification' in window ? Notification.permission : 'unsupported');
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
    if (notifEnabled) {
      scheduleDailyNotification(getDailyVerse());
      // Update server-side preferred hour so background push fires at the new time
      updatePushPreferredHour();
    }
  };

  const handleTestNotif = async () => {
    console.log('[Settings] Test notification button clicked');
    console.log('[Settings] Notifications enabled:', getNotificationsEnabled());
    console.log('[Settings] Service Worker available:', 'serviceWorker' in navigator);
    console.log('[Settings] Notification API available:', 'Notification' in window);
    console.log('[Settings] Notification permission:', 'Notification' in window ? Notification.permission : 'N/A');
    
    // Check SW registration
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.getRegistration('/');
        console.log('[Settings] SW registered:', !!reg);
        console.log('[Settings] SW active:', reg?.active?.scriptURL);
      } catch (err) {
        console.error('[Settings] SW check failed:', err);
      }
    }
    
    const v = getDailyVerse();
    console.log('[Settings] Showing test notification...');
    try {
      await showLocalNotification('KJB — Daily Verse Test', `"${v.text.slice(0, 100)}${v.text.length > 100 ? '…' : ''}" — ${v.ref} (KJB)`);
      console.log('[Settings] Test notification completed');
    } catch (err) {
      console.error('[Settings] Test notification failed:', err);
      alert('Test failed! Check console for details.');
    }
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
      console.error('Download error:', err);
      setDlError('Download failed: ' + err.message + '. Please check your connection and try again.');
    }
    setDownloading(false);
  };

  const handleClearCache = async () => {
    await clearBibleCache();
    // Also clear service worker cache
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    setCached(false);
    setDlProgress(0);
    setDlStatus('');
    setDlError('');
    // Force reload to re-fetch with fresh parsing
    console.log('[Settings] Clearing cache and reloading to fetch fresh Bible data with pilcrows...');
    window.location.reload();
  };

  const allExpanded = Object.values(expandedSections).every(v => v);
  
  const toggleAll = () => {
    const newState = !allExpanded;
    setExpandedSections({
      text: newState,
      appearance: newState,
      install: newState,
      offline: newState,
      notifications: newState,
      info: newState,
      credits: newState,
      advanced: newState,
      contact: newState,
    });
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
          <Settings className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Settings</h1>
        <p className="font-sans text-sm text-muted-foreground">Customize your experience</p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        <button
          onClick={toggleAll}
          className="mt-4 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Text Settings */}
      <div className="bg-card border border-border rounded-2xl mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection('text')}
          className="w-full flex items-center justify-between p-5 bg-card hover:bg-accent/5 transition-colors text-left"
        >
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">Text</h2>
            <p className="font-sans text-xs text-muted-foreground">Customize text size and font</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.text ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.text && (
        <div className="p-5 pt-0 space-y-4">
        
        {/* Zoom Level */}
        <div className="pt-2 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-sans text-sm text-foreground font-medium">Text Size: {zoomLevel}%</p>
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

        {/* Font Family */}
        <div className="pt-4 border-t border-border space-y-3">
        <div className="flex items-center gap-2">
        <Type className="w-4 h-4 text-muted-foreground" />
        <p className="font-sans text-sm text-foreground font-medium">Font Family</p>
        </div>
        <div className="flex flex-col gap-2">
        {VERSE_FONTS.map(font => (
          <button
            key={font.value}
            onClick={() => {
              setReaderFontFamily(font.value);
              localStorage.setItem('kjb-reader-font-family', font.value);
              window.dispatchEvent(new Event('storage'));
            }}
            className={`w-full py-3 rounded-xl font-sans text-sm font-medium transition-all text-center border-2 ${
              readerFontFamily === font.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent text-foreground border-border hover:border-accent'
            }`}
            style={{ fontFamily: font.value }}
          >
            {font.label}
          </button>
        ))}
        <button
          onClick={() => {
            setReaderFontFamily('serif');
            localStorage.setItem('kjb-reader-font-family', 'serif');
            window.dispatchEvent(new Event('storage'));
          }}
          className="w-full py-3 rounded-xl font-sans text-sm font-medium transition-all text-center bg-secondary text-secondary-foreground border-2 border-border hover:border-accent"
        >
          Reset to Default
        </button>
        </div>
        </div>
        </div>
        )}
      </div>

      {/* Appearance */}
      <div className="bg-card border border-border rounded-2xl mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection('appearance')}
          className="w-full flex items-center justify-between p-5 bg-card hover:bg-accent/5 transition-colors text-left"
        >
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">Appearance</h2>
            <p className="font-sans text-xs text-muted-foreground">Customize the look and feel</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.appearance ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.appearance && (
        <div className="p-5 pt-0 space-y-4">
        
        {/* Theme Mode */}
        <div className="space-y-3">
          <h3 className="font-serif text-base font-semibold text-foreground">Theme</h3>
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


        </div>
        
        {/* Custom Daily Verse Background */}
        <div className="pt-4 border-t border-border space-y-3">
          <h3 className="font-serif text-base font-semibold text-foreground">Daily Verse Background</h3>
          <p className="font-sans text-xs text-muted-foreground">Upload a custom image for the daily verse card</p>
          
          {pendingBg || customBg ? (
            <div className="space-y-2">
              <div className="w-full max-w-2xl mx-auto rounded-xl bg-cover bg-center border border-border shadow-lg" style={{ backgroundImage: `url(${pendingBg || customBg})`, minHeight: '400px', backgroundSize: 'contain', backgroundRepeat: 'no-repeat' }} />
              {pendingBg && (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setPendingBg(null);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 rotate-180" />
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      try {
                        localStorage.setItem('kjb-daily-verse-bg', pendingBg);
                        setCustomBg(pendingBg);
                        setPendingBg(null);
                        window.dispatchEvent(new Event('storage'));
                      } catch (err) {
                        alert('Storage full! Please clear browser data or try a smaller image.');
                        console.error('localStorage quota exceeded:', err);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Save Image
                  </button>
                </div>
              )}
              {!pendingBg && (
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
              )}
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
                      setPendingBg(base64);
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
                    <p className="font-sans text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
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
              setPendingBg(croppedDataUrl);
              setCropImage(null);
            }}
            onCancel={() => {
              setCropImage(null);
              setCropImageForNotif(false);
              setPendingBg(null);
            }}
          />
        )}

        {/* Daily Verse Text Style */}
        <div className="pt-4 border-t border-border space-y-4">
          <h3 className="font-serif text-base font-semibold text-foreground flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Daily Verse Style
          </h3>
          
          {/* Hide Panel Toggle */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="font-sans text-sm text-foreground font-medium">Show Verse Panel</p>
              <p className="font-sans text-xs text-muted-foreground">Display the "Verse of the Day" panel background</p>
            </div>
            <Switch
              checked={showVersePanel}
              onCheckedChange={(checked) => {
                setShowVersePanel(checked);
                localStorage.setItem('kjb-verse-panel-visible', String(checked));
                window.dispatchEvent(new Event('storage'));
              }}
              className="shrink-0"
            />
          </div>
          
          {/* Text Color */}
          <div className="space-y-2">
            <p className="font-sans text-sm text-foreground font-medium">Text Color</p>
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
        )}
      </div>

      {/* Install App */}
      <div className="bg-card border border-border rounded-2xl mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection('install')}
          className="w-full flex items-center justify-between p-5 bg-card hover:bg-accent/5 transition-colors text-left"
        >
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">Install App</h2>
            <p className="font-sans text-xs text-muted-foreground">Add to home screen for notifications</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.install ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.install && (
        <div className="p-5 pt-0 space-y-3">
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
        )}
      </div>

      {/* Offline Library */}
      <div className="bg-card border border-border rounded-2xl mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection('offline')}
          className="w-full flex items-center justify-between p-5 bg-card hover:bg-accent/5 transition-colors text-left"
        >
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">Bible Cache</h2>
            <p className="font-sans text-xs text-muted-foreground">Download for offline reading</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.offline ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.offline && (
          <div className="p-5 pt-0">
            <p className="font-sans text-sm text-muted-foreground mb-4">
              Download all 66 books to your device for offline reading. Once downloaded, the Bible is available without an internet connection.
            </p>

            {cached ? (
              <div className="space-y-3">
                {!downloading && (
                  <div className="flex items-start gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-sans text-sm font-medium">
                        The Bible is cached — available offline
                      </span>
                    </div>
                  </div>
                )}
                <button
                  onClick={async () => {
                    setDownloading(true);
                    setDlError('');
                    setDlProgress(0);
                    setDlStatus('Starting reload...');
                    try {
                      await downloadBibleForOffline((pct, msg) => {
                        setDlProgress(pct);
                        setDlStatus(msg);
                      });
                      setCached(true);
                      window.dispatchEvent(new Event('storage'));
                    } catch (err) {
                      setDlError('Refresh failed: ' + err.message);
                    }
                    setDownloading(false);
                  }}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 disabled:opacity-60 transition-colors"
                >
                  {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  {downloading ? 'Reloading Bible data…' : 'Reload Bible Data'}
                </button>
                {downloading && (
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${dlProgress}%` }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {!downloading && !dlStatus && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span className="font-sans text-sm">Not downloaded — Bible loads from network each visit</span>
                    </div>

                  </div>
                )}
                <button
                  onClick={handleDownload}
                  onTouchEnd={(e) => { e.preventDefault(); handleDownload(e); }}
                  disabled={downloading}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {downloading ? 'Downloading…' : 'Download All 66 Books'}
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
                  <p className="font-sans text-sm text-green-600 text-green-600 dark:text-green-400 flex items-center gap-1.5">
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
        )}
      </div>

      {/* Notifications */}
      <div className="bg-card border border-border rounded-2xl mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection('notifications')}
          className="w-full flex items-center justify-between p-5 bg-card hover:bg-accent/5 transition-colors text-left"
        >
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">Daily Verse Reminders</h2>
            <p className="font-sans text-xs text-muted-foreground">Get daily verse notifications</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.notifications ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.notifications && (
        <div className="p-5 pt-0 space-y-4">
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
                    : 'Daily verse reminder'}
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
            <div className="space-y-3 pt-1">
            <div className="flex items-center gap-3">
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
            </div>
            )}


          </>
        )}
        </div>
        )}
      </div>

      {/* App Info */}
      <div className="bg-card border border-border rounded-2xl mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection('info')}
          className="w-full flex items-center justify-between p-5 bg-card hover:bg-accent/5 transition-colors text-left"
        >
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">App Info</h2>
            <p className="font-sans text-xs text-muted-foreground">Version and features</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.info ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.info && (
          <div className="p-5 pt-0 space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center font-sans text-sm gap-4">
                <span className="text-muted-foreground shrink-0">Bible Text</span>
                <span className="text-foreground font-medium text-right">King James Bible (PCE)</span>
              </div>
              <div className="flex justify-between items-center font-sans text-sm gap-4">
                <span className="text-muted-foreground shrink-0">Version</span>
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
                <span className="text-foreground font-medium text-right">Customizable</span>
              </div>
              <div className="flex justify-between items-center font-sans text-sm gap-4">
                <span className="text-muted-foreground shrink-0">Theme</span>
                <span className="text-foreground font-medium text-right">
                  {mode === 'auto' ? '🕐 Auto' :
                   mode === 'system' ? '📱 System' :
                   mode === 'dark' ? '🌙 Dark' : '☀️ Light'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Credits */}
      <div className="bg-card border border-border rounded-2xl mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection('credits')}
          className="w-full flex items-center justify-between p-5 bg-card hover:bg-accent/5 transition-colors text-left"
        >
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">Credits</h2>
            <p className="font-sans text-xs text-muted-foreground">Attributions and licenses</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.credits ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.credits && (
        <div className="p-5 pt-0 space-y-3">
          <div className="space-y-2 font-sans text-xs text-muted-foreground">
        <p>• <strong className="text-foreground">Bible Text:</strong> King James Bible: Pure Cambridge Edition: Wharton Text Format</p>
        <p>• <strong className="text-foreground">Cormorant Garamond:</strong> Google Fonts (SIL Open Font License)</p>
        <p>• <strong className="text-foreground">Inter:</strong> Google Fonts (SIL Open Font License)</p>
        <p>• <strong className="text-foreground">Merriweather:</strong> Google Fonts (SIL Open Font License)</p>
        <p>• <strong className="text-foreground">Dancing Script:</strong> Google Fonts (SIL Open Font License)</p>
        <p className="pt-2 text-[10px] opacity-75">All fonts are open source and freely available under the SIL Open Font License.</p>
      </div>
        </div>
        )}
      </div>

      {/* Advanced */}
      <div className="bg-card border border-border rounded-2xl mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection('advanced')}
          className="w-full flex items-center justify-between p-5 bg-card hover:bg-accent/5 transition-colors text-left"
        >
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">Advanced</h2>
            <p className="font-sans text-xs text-muted-foreground">Reset settings and check for updates</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.advanced ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.advanced && (
          <div className="p-5 pt-0 space-y-4">
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  if (confirm('Reset all settings to default? This cannot be undone.')) {
                    // Reset all localStorage settings
                    localStorage.removeItem('kjb-daily-verse-bg');
                    localStorage.removeItem('kjb-verse-text-color');
                    localStorage.removeItem('kjb-verse-text-opacity');
                    localStorage.removeItem('kjb-verse-font-family');
                    localStorage.removeItem('kjb-reader-font-family');
                    localStorage.removeItem('kjb-verse-panel-visible');
                    localStorage.removeItem('kjb-zoom');
                    localStorage.removeItem('kjb-notif-image');
                    // Reload to apply defaults
                    window.location.reload();
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive font-sans text-sm font-medium hover:bg-destructive/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Reset All Settings
              </button>
              <button
                onClick={async () => {
                  // Clear ALL caches and reload
                  await clearBibleCache();
                  if ('caches' in window) {
                    const cacheNames = await caches.keys();
                    await Promise.all(cacheNames.map(name => caches.delete(name)));
                  }
                  if ('serviceWorker' in navigator) {
                    const regs = await navigator.serviceWorker.getRegistrations();
                    await Promise.all(regs.map(reg => reg.unregister()));
                  }
                  localStorage.clear();
                  // Re-set the auto-redownload flag after localStorage.clear()
                  try { localStorage.setItem('kjb-auto-redownload', 'true'); } catch {}
                  window.location.reload();
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear Cache & Reload
              </button>

            </div>
          </div>
        )}
      </div>

      {/* Contact & Feedback */}
      <div className="bg-card border border-border rounded-2xl mb-6 overflow-hidden">
        <button
          onClick={() => toggleSection('contact')}
          className="w-full flex items-center justify-between p-5 bg-card hover:bg-accent/5 transition-colors text-left"
        >
          <div>
            <h2 className="font-serif text-lg font-semibold text-foreground">Contact & Feedback</h2>
            <p className="font-sans text-xs text-muted-foreground">Report bugs or share feedback</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.contact ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.contact && (
          <div className="p-5 pt-0 space-y-2">
            <a
              href="mailto:Godisgracious1031@outlook.com"
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-accent/20 transition-colors group"
            >
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Email for Support</p>
                <p className="font-sans text-xs text-muted-foreground">Godisgracious1031@outlook.com</p>
              </div>
            </a>
            <a
              href="https://godisgracious1031ministriescom.odoo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-accent/20 transition-colors group"
            >
              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Ministry Website</p>
                <p className="font-sans text-xs text-muted-foreground">godisgracious1031ministries.com</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
            </a>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary">
              <MessageCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-sm text-foreground">Discord</p>
                <p className="font-sans text-xs text-muted-foreground">shawn_svdbyfaithinhisbloodr325av</p>
              </div>
            </div>
            <a
              href="https://www.tiktok.com/@svdbyfaithinr325av?_r=1&_t=ZS-96WRhWSLUoe"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-accent/20 transition-colors group"
            >
              <TikTokIcon />
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">TikTok</p>
                <p className="font-sans text-xs text-muted-foreground">@svdbyfaithinr325av</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
            </a>
            <a
              href="https://www.instagram.com/svdbyfaithinhisbloodr325av?igsh=NTl0NmM1NWoyb2F0"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-accent/20 transition-colors group"
            >
              <Instagram className="w-4 h-4 text-green-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Instagram</p>
                <p className="font-sans text-xs text-muted-foreground">@svdbyfaithinhisbloodr325av</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}