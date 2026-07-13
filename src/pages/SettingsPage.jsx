import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Bell, BellOff, Download, CheckCircle2, AlertCircle, Loader2, Trash2, Smartphone, MonitorSmartphone, Eye, EyeOff, ZoomIn, ZoomOut, Palette, Upload, Crop, Type, ChevronDown, CheckCircle, ExternalLink, Shield, MessageCircle, Instagram, Youtube, RotateCcw, Accessibility, Keyboard, Star, Server, Globe, Mail } from 'lucide-react';
import ShortcutsList from '@/components/ShortcutsList';

const TikTokIcon = () => (
  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05 6.33 6.33 0 0 0-5 10.14 6.32 6.32 0 0 0 10.93-4.5V8.38a7.72 7.72 0 0 0 4.22 1.28V6.69a4.76 4.76 0 0 1-3.77-4.25Z"/>
  </svg>
);

const DiscordIcon = () => (
  <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);
import ImageCropper from '@/components/bible/ImageCropper';
import DownloadBibleSection from '@/components/bible/DownloadBibleSection';
import OfflineHtmlSection from '@/components/bible/OfflineHtmlSection';
import ThemeColorPicker from '@/components/bible/ThemeColorPicker';
import { Switch } from '@/components/ui/switch';
import InstallAppSection from '@/components/settings/InstallAppSection';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { useTheme, COLOUR_PALETTES } from '@/lib/themeContext';
import { toast } from 'sonner';
import { useNavigate, Link } from 'react-router-dom';
import {
  getNotificationsEnabled, getNotificationTime, setNotificationTime,
  requestNotificationPermission, disableNotifications, scheduleDailyNotification, showLocalNotification, cleanForNotification
} from '@/lib/notifications';
import { shrinkImageUnderLimit } from '@/lib/imageCompress';

import { getDailyVerse } from '@/lib/dailyVerse';
import { downloadBibleForOffline, downloadBibleForOfflineWithRetry, clearBibleCache, isBibleCached, CACHE_VERSION } from '@/lib/bibleCache';
import { getAccessibilityFont, setAccessibilityFont } from '@/lib/accessibilityFont';
import { detectIncognito } from '@/lib/incognito';
import { getLiveWorkerVersion, getDeployedWorkerVersion } from '@/lib/liveWorkerVersion';

const A11Y_FONTS = [
  { value: 'dyslexic', label: 'OpenDyslexic', desc: 'Designed for readers with dyslexia', preview: "'OpenDyslexic', 'Comic Sans MS', sans-serif" },
  { value: 'hyperlegible', label: 'Atkinson Hyperlegible', desc: 'High legibility for low vision', preview: "'Atkinson Hyperlegible', system-ui, sans-serif" },
];

const inIframe = () => {
  try { return window.self !== window.top; } catch (e) { return true; }
};

// Firefox (any OS) and Safari on Mac don't support PWA install, so we offer
// "Add to Favourites/Bookmarks" instead via the browser's bookmark shortcut.
const isEdgeDesktop = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isEdge = /edg/i.test(ua);
  const isMobile = /iphone|ipad|ipod|android/i.test(ua);
  return isEdge && !isMobile;
};

const isBookmarkBrowser = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isFirefox = /firefox/i.test(ua);
  const isMac = /Macintosh|Mac OS X/i.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
  const isMobile = /iphone|ipad|ipod|android/i.test(ua);
  return !isMobile && (isFirefox || (isMac && isSafari));
};

const LAST_REVISED = 'July 13th, 2026';
const WORKER_VERSION = 'v20260714_1000';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [a11yFont, setA11yFont] = useState(getAccessibilityFont);
  const [bookmarkBrowser] = useState(isBookmarkBrowser);
  const [isIncognito, setIsIncognito] = useState(false);
  // Diagnostic for the Edge-mobile "manual install prompt only" investigation:
  // navigator.getInstalledRelatedApps() lets the page ask the browser directly
  // whether it already considers a matching app "installed" for this origin
  // (e.g. a stray/orphaned WebAPK from earlier testing). If the browser thinks
  // an install already exists, per the documented Chrome/Edge criteria it will
  // never fire the automatic beforeinstallprompt banner again for this origin
  // — only the manual "Add to phone" path stays available. This surfaces that
  // state in Settings > Advanced instead of requiring someone to dig through
  // OS app-list settings by hand.
  //   'unsupported' — API not available in this browser (e.g. desktop Firefox,
  //                    iOS Safari, or a browser that hasn't shipped it)
  //   'checking'    — request in flight
  //   'none'        — supported, and no related app is currently registered
  //   'installed'   — supported, and the browser reports at least one match
  //   'error'       — the call itself threw
  const [relatedAppsStatus, setRelatedAppsStatus] = useState('checking');
  const [relatedAppsList, setRelatedAppsList] = useState([]);
  // The ACTUAL running service worker's version, read live from the SW itself.
  // Falls back to the hardcoded WORKER_VERSION constant only if the SW can't be
  // reached (dev, unsupported browser, or not yet controlling the page).
  const [liveWorkerVersion, setLiveWorkerVersion] = useState(null);

  const refreshVersions = React.useCallback(() => {
    getDeployedWorkerVersion().then(v => v ? setLiveWorkerVersion(v) : getLiveWorkerVersion().then(setLiveWorkerVersion));
  }, []);

  useEffect(() => {
    refreshVersions();
    // Re-query when the tab regains focus (e.g. after bumping in DevTools) so
    // the Advanced section reflects the latest pushed version without a reload.
    window.addEventListener('focus', refreshVersions);
    // Also poll periodically while Settings is open, so a bump made elsewhere
    // (another tab, or the DevTools bump) shows up here within a few seconds
    // without needing to refocus or reload.
    const poll = setInterval(refreshVersions, 8000);
    return () => {
      window.removeEventListener('focus', refreshVersions);
      clearInterval(poll);
    };
  }, [refreshVersions]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof navigator === 'undefined' || typeof navigator.getInstalledRelatedApps !== 'function') {
        if (!cancelled) setRelatedAppsStatus('unsupported');
        return;
      }
      try {
        const apps = await navigator.getInstalledRelatedApps();
        if (cancelled) return;
        setRelatedAppsList(Array.isArray(apps) ? apps : []);
        setRelatedAppsStatus(apps && apps.length > 0 ? 'installed' : 'none');
      } catch (err) {
        console.warn('[Settings] getInstalledRelatedApps failed:', err?.message);
        if (!cancelled) setRelatedAppsStatus('error');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const [expandedSections, setExpandedSections] = useState({
    text: true,
    accessibility: true,
    shortcuts: true,
    appearance: true,
    install: true,
    offline: true,
    downloadPdf: true,
    notifications: true,
    offlineHtml: true,
    info: true,
    credits: true,
    advanced: true,
    contact: true,
    developer: false,
  });
  const { isDark, mode, setMode, colourId, setColourId } = useTheme();
  
  const [customBg, setCustomBg] = useState(() => {
    try { return localStorage.getItem('kjb-daily-verse-bg') || ''; } catch { return ''; }
  });
  const [uploading, setUploading] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [cropImageForNotif, setCropImageForNotif] = useState(false);
  const [pendingBg, setPendingBg] = useState(null);
  const bgFileInputRef = useRef(null);

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
    try { return parseFloat(localStorage.getItem('kjb-verse-text-opacity') || '1'); } catch { return 1; }
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

  // Accessibility fonts that also appear in every font picker (reader, daily
  // card, settings). Choosing one applies it app-wide via setAccessibilityFont,
  // so all pickers stay in sync. Picking a normal font turns it back off.
  const A11Y_FONT_OPTIONS = [
    { value: 'dyslexic', label: 'Dyslexic' },
    { value: 'hyperlegible', label: 'Legible' },
  ];

  // Unified font-pick handler for the reader font: normal fonts write
  // kjb-reader-font-family and clear any a11y font; dyslexic/hyperlegible set
  // the app-wide accessibility font. Mirrors the reader & daily card exactly.
  const pickReaderFont = (value) => {
    if (value === 'dyslexic' || value === 'hyperlegible') {
      setA11yFont(value);
      setAccessibilityFont(value);
      return;
    }
    // Write the key BEFORE disabling a11y to avoid the sync listener reading a
    // stale value and reverting the chosen font.
    try { localStorage.setItem('kjb-reader-font-family', value); } catch {}
    setReaderFontFamily(value);
    if (a11yFont !== 'default') { setA11yFont('default'); setAccessibilityFont('default'); }
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('kjb-fonts-changed'));
  };

  // Same for the daily-verse font picker.
  const pickVerseFont = (value) => {
    if (value === 'dyslexic' || value === 'hyperlegible') {
      setA11yFont(value);
      setAccessibilityFont(value);
      return;
    }
    try { localStorage.setItem('kjb-verse-font-family', value); } catch {}
    setVerseFontFamily(value);
    if (a11yFont !== 'default') { setA11yFont('default'); setAccessibilityFont('default'); }
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('kjb-fonts-changed'));
  };

  const [notifPermission, setNotifPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');
  // The toggle is only truly "on" when BOTH the app flag is set AND the OS
  // permission is actually granted. Otherwise notifications silently fail
  // (the old behaviour that showed "Enabled" but never fired anything).
  const isNotifReallyOn = () => getNotificationsEnabled() && ('Notification' in window) && Notification.permission === 'granted';
  const [notifEnabled, setNotifEnabled] = useState(isNotifReallyOn);
  const [notifTime, setNotifTimeState] = useState(getNotificationTime);
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
        if (localStorage.getItem('kjb-auto-redownload') === 'true') {
          localStorage.removeItem('kjb-auto-redownload');
          handleDownload(null, true); // retry on transient failures
        }
      } catch {}
    });

    // Listen for storage + focus events to keep Settings in sync with changes
    // made on the reader or daily card (font, accessibility font, zoom, etc.).
    const handleStorage = () => {
      isBibleCached().then(setCached);
      try { setReaderFontFamily(localStorage.getItem('kjb-reader-font-family') || 'serif'); } catch {}
      try { setVerseFontFamily(localStorage.getItem('kjb-verse-font-family') || 'serif'); } catch {}
      try { setZoomLevel(parseInt(localStorage.getItem('kjb-zoom') || '100')); } catch {}
      try { setA11yFont(getAccessibilityFont()); } catch {}
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleStorage);
    window.addEventListener('kjb-fonts-changed', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleStorage);
      window.removeEventListener('kjb-fonts-changed', handleStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



  // Detect incognito/private mode once on mount
  useEffect(() => {
    detectIncognito().then(setIsIncognito);
  }, []);

  // Refresh notification state on focus
  useEffect(() => {
    const handleFocus = () => {
      setNotifPermission('Notification' in window ? Notification.permission : 'unsupported');
      setNotifEnabled(isNotifReallyOn());
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

    // Check current permission status first
    const currentPermission = Notification.permission;
    console.log('[Settings] Current notification permission:', currentPermission);
    
    if (currentPermission === 'denied') {
      // Permission was previously denied - Chrome won't show prompt again
      // Clearing cache doesn't reset permissions - must reset site data completely
      alert('Notifications are blocked in Chrome.\n\nTo reset:\n1. Tap the lock icon (🔒) in the address bar\n2. Tap "Site settings" or "Permissions"\n3. Tap "Clear data" or "Reset permissions"\n4. Refresh the page\n5. Toggle the notifications switch again\n\nOr go to: Chrome Settings → Site settings → Notifications → Find this site → Remove');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);

      if (permission === 'granted') {
        await requestNotificationPermission();
        localStorage.setItem('kjb-notifications-enabled', 'true');
        setNotifEnabled(true);
        scheduleDailyNotification();
        const v = getDailyVerse();
        showLocalNotification('KJB — Reminders On', `"${cleanForNotification(v.text)}" — ${v.ref} (KJB)`, null, '/');
        window.dispatchEvent(new Event('storage'));
      } else if (permission === 'denied') {
        alert('Notifications blocked. To enable:\n1. Tap the lock icon (🔒) in the address bar\n2. Select "Site settings" or "Permissions"\n3. Find "Notifications" and change to "Allow"');
      }
    } catch (err) {
      console.error('Notification permission error:', err);
      alert('Failed to request notification permission. Please try again.');
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
    
    // Ensure OS-level permission is actually granted before testing.
    // The toggle only flips localStorage; the real Notification permission
    // may still be 'default' or 'denied', which makes showNotification fail silently.
    if (!('Notification' in window)) {
      alert('This browser/PWA does not support notifications.');
      return;
    }
    if (Notification.permission !== 'granted') {
      const result = await Notification.requestPermission();
      setNotifPermission(result);
      if (result !== 'granted') {
        alert('Notifications are blocked. Please enable notifications for this app in your device settings, then try again.');
        return;
      }
    }

    const v = getDailyVerse();
    console.log('[Settings] Showing test notification...');
    try {
      // Use timestamp string to prevent notification caching/overwriting the real one
      await showLocalNotification('KJB — Daily Verse Test', `"${cleanForNotification(v.text)}" — ${v.ref} (KJB)`, null, `/?test=${Date.now()}`);
      console.log('[Settings] Test notification completed');
    } catch (err) {
      console.error('[Settings] Test notification failed:', err);
      alert('Test failed: ' + err.message);
    }
  };





  const handleDownload = async (e, withRetry = false) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDownloading(true);
    setDlError('');
    setDlProgress(0);
    setDlStatus('Starting download...');
    try {
      const dl = withRetry ? downloadBibleForOfflineWithRetry : downloadBibleForOffline;
      await dl((pct, msg) => {
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
    // Navigate to refresh-cache page which handles everything properly
    // including service worker updates and Bible re-download
    console.log('[Settings] Navigating to refresh-cache for complete cache clear...');
    navigate('/refresh-cache');
  };

  const allExpanded = Object.values(expandedSections).every(v => v);
  
  const toggleAll = () => {
    const newState = !allExpanded;
    setExpandedSections({
      text: newState,
      accessibility: newState,
      shortcuts: newState,
      appearance: newState,
      install: newState,
      offline: newState,
      downloadPdf: newState,
      notifications: newState,
      offlineHtml: newState,
      info: newState,
      credits: newState,
      advanced: newState,
      contact: newState,
      developer: newState,
    });
  };

  const toggleSection = (section) => {
    // When opening the Notifications section, re-read the live OS permission so
    // the toggle un-disables itself the moment the user has unblocked the site
    // (the mounted value can be a stale 'denied').
    if (section === 'notifications' && !expandedSections.notifications) {
      setNotifPermission('Notification' in window ? Notification.permission : 'unsupported');
      setNotifEnabled(isNotifReallyOn());
    }
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="w-full max-w-[120rem] mx-auto px-5 sm:px-8 lg:px-12 pt-10 pb-32">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-500 to-slate-700 shadow-lg shadow-slate-500/30 mb-4">
          <Settings className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Settings</h1>
        <p className="font-sans text-sm text-muted-foreground">Customize your experience</p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
        <button
          onClick={toggleAll}
          className="mt-4 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          {allExpanded ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* Text Settings */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-5 overflow-hidden shadow-lg shadow-black/[0.03]">
        <button
          onClick={() => toggleSection('text')}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/5 transition-colors text-left"
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-lg font-semibold text-foreground">Text</h2>
            <p className="font-sans text-xs text-muted-foreground">Customize text size and font</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.text ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.text && (
        <div className="px-5 pb-6 pt-2 space-y-3">
        
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
                className="p-2 rounded-xl bg-transparent border border-border text-foreground hover:border-accent transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  const newZoom = Math.min(150, zoomLevel + 25);
                  setZoomLevel(newZoom);
                  try { localStorage.setItem('kjb-zoom', String(newZoom)); } catch {}
                }}
                className="p-2 rounded-xl bg-transparent border border-border text-foreground hover:border-accent transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              {zoomLevel !== 100 && (
                <button
                  onClick={() => {
                    setZoomLevel(100);
                    try { localStorage.setItem('kjb-zoom', '100'); } catch {}
                  }}
                  className="px-3 py-2 rounded-xl bg-primary border border-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
        {a11yFont !== 'default' && (
          <p className="font-sans text-xs text-muted-foreground -mt-1 leading-snug">
            An accessibility font is on and overrides reading fonts. Pick another accessibility font, or disable it in the Accessibility section.
          </p>
        )}
        <div className="flex flex-col gap-2">
        {[...VERSE_FONTS, ...A11Y_FONT_OPTIONS].map(font => {
          const isA11yChoice = font.value === 'dyslexic' || font.value === 'hyperlegible';
          const isActive = a11yFont !== 'default' ? a11yFont === font.value : readerFontFamily === font.value;
          const isDisabled = a11yFont !== 'default' && !isA11yChoice;
          return (
          <button
            key={font.value}
            disabled={isDisabled}
            onClick={() => pickReaderFont(font.value)}
            className={`w-full py-3 rounded-xl font-sans text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-center border ${
              isActive
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-secondary/50 backdrop-blur-sm text-foreground border-border hover:border-accent'
            } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
            style={isA11yChoice ? undefined : { fontFamily: font.value }}
          >
            {font.label}
          </button>
          );
        })}
        {a11yFont === 'default' && (
          <button
            onClick={() => pickReaderFont('serif')}
            className="w-full py-3 rounded-xl font-sans text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-center bg-secondary/50 backdrop-blur-sm border border-border text-foreground hover:border-accent"
          >
            Reset to Default
          </button>
        )}
        </div>
        </div>
        </div>
        )}
      </div>

      {/* Accessibility */}
      <div id="kjb-accessibility-section" className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-6 overflow-hidden shadow-lg shadow-black/[0.03] scroll-mt-4">
        <button
          onClick={() => toggleSection('accessibility')}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/5 transition-colors text-left"
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-lg font-semibold text-foreground">Accessibility</h2>
            <p className="font-sans text-xs text-muted-foreground">Reading fonts for the whole app</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.accessibility ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.accessibility && (
        <div className="px-5 pb-6 pt-2 space-y-3">
          <div className="flex items-center gap-2">
            <Accessibility className="w-4 h-4 text-muted-foreground" />
            <p className="font-sans text-sm text-foreground font-medium">Accessibility Font</p>
          </div>
          <p className="font-sans text-xs text-muted-foreground -mt-1">
            Applies across the entire app — menus, pages, and scripture.
          </p>
          <div className="flex flex-col gap-2">
            {A11Y_FONTS.map(font => (
              <button
                key={font.value}
                onClick={() => {
                  setA11yFont(font.value);
                  setAccessibilityFont(font.value);
                }}
                className={`w-full py-3 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] text-left border ${
                  a11yFont === font.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-secondary/50 backdrop-blur-sm text-foreground border-border hover:border-accent'
                }`}
              >
                <div className="flex flex-col items-start justify-center gap-0.5">
                  <p className="font-sans text-sm font-medium" style={font.preview ? { fontFamily: font.preview } : undefined}>
                    {font.label}
                  </p>
                  <p className="font-sans text-[10px] opacity-70">{font.desc}</p>
                </div>
              </button>
            ))}
          </div>
          {a11yFont !== 'default' && (
            <button
              onClick={() => { setA11yFont('default'); setAccessibilityFont('default'); }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary/50 backdrop-blur-sm border border-destructive text-destructive font-sans text-sm font-medium hover:bg-destructive/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Disable
            </button>
          )}
        </div>
        )}
      </div>

      {/* Keyboard Shortcuts */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-5 overflow-hidden shadow-lg shadow-black/[0.03]">
        <button
          onClick={() => toggleSection('shortcuts')}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/5 transition-colors text-left"
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-lg font-semibold text-foreground">Keyboard Shortcuts</h2>
            <p className="font-sans text-xs text-muted-foreground">Quick keys for navigation and search</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.shortcuts ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.shortcuts && (
          <div className="px-5 pb-6 pt-3 space-y-4">
            <ShortcutsList />
            <button
              onClick={() => window.dispatchEvent(new Event('kjb-open-shortcuts'))}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Keyboard className="w-4 h-4" />
              Open Shortcuts Overlay
            </button>
          </div>
        )}
      </div>

      {/* Appearance */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-5 overflow-hidden shadow-lg shadow-black/[0.03]">
        <button
          onClick={() => toggleSection('appearance')}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/5 transition-colors text-left"
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-lg font-semibold text-foreground">Appearance</h2>
            <p className="font-sans text-xs text-muted-foreground">Customize the look and feel</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.appearance ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.appearance && (
        <div className="px-5 pb-6 pt-2 space-y-3">
        
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
                className={`py-2 rounded-xl font-sans text-sm font-medium border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                  mode === opt.id
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-transparent text-foreground border-border hover:border-accent'
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

        {/* Theme Color */}
        <div className="pt-4 border-t border-border">
          <ThemeColorPicker />
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-transparent border border-border text-foreground font-sans text-xs font-medium hover:border-accent transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary border border-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-transparent border border-destructive text-destructive font-sans text-xs font-medium hover:bg-destructive/10 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Remove Image
                  </button>
                  <button
                    onClick={() => {
                      const current = localStorage.getItem('kjb-daily-verse-bg');
                      if (current) setCropImage(current);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-transparent border border-border text-foreground font-sans text-xs font-medium hover:border-accent transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Crop className="w-3.5 h-3.5" />
                    Re-crop
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <input
                ref={bgFileInputRef}
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const base64 = await shrinkImageUnderLimit(file);
                    setCropImage(base64);
                  } catch (err) {
                    alert(err.message || 'Failed to process image');
                  } finally {
                    // Reset so picking the same file again still fires onChange
                    e.target.value = '';
                  }
                }}
                disabled={uploading}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => bgFileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-border rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer"
              >
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
              </button>
            </>
          )}
        </div>
        
        {/* Crop Modal — portaled to document.body so the full-screen overlay
            isn't trapped inside the settings card's transform/stacking context. */}
        {cropImage && createPortal(
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
          />,
          document.body
        )}

        {/* Daily Verse Text Style */}
        <div className="pt-4 border-t border-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-base font-semibold text-foreground flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Daily Verse Style
          </h3>
          <button
            onClick={() => {
              setVerseTextColor('#ffffff');
              setVerseTextOpacity(1);
              setVerseFontFamily('serif');
              setShowVersePanel(true);
              localStorage.setItem('kjb-verse-text-color', '#ffffff');
              localStorage.setItem('kjb-verse-text-opacity', '1');
              localStorage.setItem('kjb-verse-font-family', 'serif');
              localStorage.setItem('kjb-verse-panel-visible', 'true');
              window.dispatchEvent(new Event('storage'));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>
          
          {/* Hide Panel Toggle — only relevant when a custom background is set */}
          {(customBg || pendingBg) && (
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
          )}
          
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
                  className={`w-8 h-8 rounded-lg border-2 transition-all duration-200 hover:scale-110 active:scale-95 ${
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
            {a11yFont !== 'default' && (
              <p className="font-sans text-xs text-muted-foreground leading-snug">
                An accessibility font is on and overrides reading fonts. Pick another accessibility font, or disable it in the Accessibility section.
              </p>
            )}
            <div className="grid grid-cols-2 gap-2">
              {[...VERSE_FONTS, ...A11Y_FONT_OPTIONS].map(font => {
                const isA11yChoice = font.value === 'dyslexic' || font.value === 'hyperlegible';
                const isActive = a11yFont !== 'default' ? a11yFont === font.value : verseFontFamily === font.value;
                const isDisabled = a11yFont !== 'default' && !isA11yChoice;
                return (
                <button
                  key={font.value}
                  disabled={isDisabled}
                  onClick={() => pickVerseFont(font.value)}
                  className={`px-4 py-3 rounded-xl font-sans text-sm font-medium border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary/50 backdrop-blur-sm text-foreground border-border hover:border-accent'
                  } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
                  style={isA11yChoice ? undefined : { fontFamily: font.value }}
                >
                  {font.label}
                </button>
                );
              })}
            </div>
          </div>
        </div>
        </div>
        )}
      </div>

      {/* Install App */}
      <InstallAppSection expanded={expandedSections.install} isIncognito={isIncognito} />

      {/* Notifications — hidden in private/incognito windows where they won't persist */}
      {!isIncognito && (
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-5 overflow-hidden shadow-lg shadow-black/[0.03]">
        <button
          onClick={() => toggleSection('notifications')}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/5 transition-colors text-left"
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-lg font-semibold text-foreground">Daily Verse Reminders</h2>
            <p className="font-sans text-xs text-muted-foreground">Get daily verse notifications</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.notifications ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.notifications && (
        <div className="px-5 pb-6 pt-2 space-y-3">
        {isIncognito && (
          <div className="rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/40 p-3">
            <p className="font-sans text-xs text-amber-700 dark:text-amber-400 font-medium leading-snug flex items-start gap-1.5">
              <span className="shrink-0 leading-none mt-0.5">⚠️</span>
              <span>You're in a private window (Incognito, InPrivate, or Guest) — notifications are unreliable here and won't persist after you close the window.</span>
            </p>
          </div>
        )}
        {notifPermission === 'unsupported' ? (
          <div className="space-y-3">
            <p className="font-sans text-sm text-muted-foreground">
              Browser notifications are not supported in your current environment. To enable this feature, please install the application:
            </p>
            <div className="font-sans text-xs text-muted-foreground space-y-1.5 bg-secondary/50 rounded-xl p-4">
              <p>• <strong>Apple iOS:</strong> Tap the <span className="inline-flex items-center px-1.5 py-0.5 bg-background rounded text-foreground font-medium">Share</span> button in Safari, then select <span className="text-foreground font-medium">"Add to Home Screen"</span>.</p>
              <p>• <strong>Android / Chrome:</strong> Open the browser menu <span className="inline-flex items-center px-1.5 py-0.5 bg-background rounded text-foreground font-medium">(⋮ or ⋯)</span>, then select <span className="text-foreground font-medium">"Add to phone"</span>, <span className="text-foreground font-medium">"Install app"</span> or <span className="text-foreground font-medium">"Add to Home screen"</span>.</p>
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
                    : 'Shows the daily verse when you open the app on a new day'}
                </p>
              </div>
              <div
                role="switch"
                aria-checked={notifEnabled}
                tabIndex={notifPermission === 'denied' ? -1 : 0}
                onClick={(e) => {
                  if (notifPermission !== 'denied') {
                    e.stopPropagation();
                    handleToggleNotifications();
                  }
                }}
                onTouchEnd={(e) => {
                  if (notifPermission !== 'denied') {
                    e.stopPropagation();
                    e.preventDefault();
                    handleToggleNotifications();
                  }
                }}
                className={`shrink-0 inline-flex h-5 w-9 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
                  notifEnabled ? 'bg-primary' : 'bg-input'
                } ${notifPermission === 'denied' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div
                  className={`pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform ${
                    notifEnabled ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
            {notifEnabled && (
            <div className="pt-1">
              <button
                onClick={handleTestNotif}
                className="px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-xs font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:border-accent"
              >
                Test Notification
              </button>
            </div>
            )}


          </>
        )}
        </div>
        )}
      </div>
      )}

      {/* Offline Library — shows disabled state in private/incognito windows and iframes */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-5 overflow-hidden shadow-lg shadow-black/[0.03]">
        <button
          onClick={() => toggleSection('offline')}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/5 transition-colors text-left"
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-lg font-semibold text-foreground">Offline Library</h2>
            <p className="font-sans text-xs text-muted-foreground">{isIncognito || inIframe() ? 'Not available in preview mode' : 'Download for offline reading'}</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.offline ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.offline && (
          <div className="px-5 pb-6 pt-2">
            {isIncognito || inIframe() ? (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/40 p-4">
                <p className="font-sans text-sm text-amber-700 dark:text-amber-400 font-medium leading-relaxed flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <span>{isIncognito ? 'Offline downloads are not available in private/incognito mode. The cache would be deleted when you close the private window. Open this app in a normal window to download the Bible for offline reading.' : 'You are viewing this inside a preview window where offline downloads are disabled. Open the app in a new tab to download the Bible for offline reading.'}</span>
                </p>
              </div>
            ) : (
              <>
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

                {downloading && (
                  <div className="w-full bg-secondary/70 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${dlProgress}%` }}
                    />
                  </div>
                )}
                {!downloading && (
                  <button
                    onClick={async () => {
                      setDownloading(true);
                      setDlError('');
                      setDlProgress(0);
                      setDlStatus('Checking for updates...');
                      try {
                        let hasCodeUpdates = false;
                        let swReg = null;
                        if ('serviceWorker' in navigator) {
                          swReg = await navigator.serviceWorker.getRegistration();
                          if (swReg) {
                            await swReg.update().catch(() => {});
                            if (swReg.waiting) hasCodeUpdates = true;
                            else if (swReg.installing) {
                              if (swReg.installing.state === 'installed' || swReg.installing.state === 'activating' || swReg.installing.state === 'activated') hasCodeUpdates = true;
                              else {
                                hasCodeUpdates = await new Promise(resolve => {
                                  let resolved = false;
                                  const worker = swReg.installing;
                                  const handler = () => {
                                    if (worker.state === 'installed' || worker.state === 'activating' || worker.state === 'activated') {
                                      if (!resolved) { resolved = true; resolve(true); }
                                    } else if (worker.state === 'redundant') {
                                      if (!resolved) { resolved = true; resolve(false); }
                                    }
                                  };
                                  worker.addEventListener('statechange', handler);
                                  setTimeout(() => {
                                    if (!resolved) { resolved = true; worker.removeEventListener('statechange', handler); resolve(false); }
                                  }, 6000);
                                });
                              }
                            }
                          }
                        }

                        const { checkForUpdates, downloadBibleForOffline, isBibleCached } = await import('@/lib/bibleCache');
                        let hasBibleUpdates = await checkForUpdates().catch(() => false);
                        if (!hasBibleUpdates) {
                          const cached = await isBibleCached().catch(() => false);
                          if (!cached) hasBibleUpdates = true;
                        }

                        if (!hasCodeUpdates && !hasBibleUpdates) {
                          setDlStatus('App & Bible data are up to date. Reloading to ensure latest version...');
                          sessionStorage.setItem('kjb_sw_updated', 'up_to_date');
                          setTimeout(() => {
                            window.location.href = window.location.pathname + '?refresh=' + Date.now();
                          }, 1500);
                          return;
                        }

                        let reloadText = 'Found updates...';
                        let updateType = 'app';
                        if (hasCodeUpdates && hasBibleUpdates) { reloadText = 'Found app & Bible updates...'; updateType = 'both'; }
                        else if (hasBibleUpdates) { reloadText = 'Found Bible data updates...'; updateType = 'bible'; }
                        else if (hasCodeUpdates) { reloadText = 'Found app updates...'; updateType = 'app'; }

                        setDlStatus(reloadText);

                        if (hasBibleUpdates) {
                          localStorage.removeItem('bible_cache_version');
                          localStorage.removeItem('bible_last_refresh');
                          await downloadBibleForOffline((pct, msg) => {
                             setDlProgress(pct);
                             setDlStatus(msg);
                          });
                        }

                        if (hasCodeUpdates && swReg) {
                          sessionStorage.setItem('kjb_last_app_update', Date.now().toString());
                          if (swReg.waiting) swReg.waiting.postMessage({ type: 'SKIP_WAITING' });
                          else if (swReg.installing && swReg.installing.state === 'installed') swReg.installing.postMessage({ type: 'SKIP_WAITING' });
                        }
                        
                        sessionStorage.setItem('kjb_sw_updated', updateType);
                        setTimeout(() => {
                          window.location.href = window.location.pathname + '?refresh=' + Date.now();
                        }, 2500);
                      } catch (err) {
                        setDlError('Check failed: ' + err.message);
                        setDownloading(false);
                      }
                    }}
                    disabled={downloading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium hover:border-accent disabled:opacity-60 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Check for Updates & Reload
                  </button>
                )}
                {dlStatus && !downloading && (
                  <p className="font-sans text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5 mt-2">
                    <CheckCircle2 className="w-4 h-4" /> {dlStatus}
                  </p>
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
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary border border-primary text-primary-foreground font-sans text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:active:scale-100 disabled:opacity-60"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {downloading ? 'Downloading…' : 'Download All 66 Books'}
                </button>
                {downloading && (
                  <div className="space-y-2">
                    <div className="w-full bg-secondary/70 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300"
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
                </>
              )}
          </div>
        )}
      </div>

      {/* Download Bible as PDF */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-5 overflow-hidden shadow-lg shadow-black/[0.03]">
        <button
          onClick={() => toggleSection('downloadPdf')}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/5 transition-colors text-left"
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-lg font-semibold text-foreground">Download Bible</h2>
            <p className="font-sans text-xs text-muted-foreground">Whole Bible with layout options</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.downloadPdf ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.downloadPdf && <DownloadBibleSection />}
      </div>

      {/* Offline HTML Bible & Legacy Reader — for old browsers / no-JS environments */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-5 overflow-hidden shadow-lg shadow-black/[0.03]">
        <button
          onClick={() => toggleSection('offlineHtml')}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/5 transition-colors text-left"
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-lg font-semibold text-foreground">Old Browser & Offline Options</h2>
            <p className="font-sans text-xs text-muted-foreground">Standalone HTML file and Legacy Reader for IE & old devices</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.offlineHtml ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.offlineHtml && (
          <div>
            <OfflineHtmlSection />
            <div className="px-5 pb-5 pt-1 border-t border-border space-y-2">

              <Link
                to="/legacy"
                className="flex items-center gap-3 p-3 rounded-xl bg-transparent border border-border hover:border-accent transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
              >
                <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-background/50 backdrop-blur-md border border-border shadow-sm">
                  <MonitorSmartphone className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Open Legacy Reader</p>
                  <p className="font-sans text-xs text-muted-foreground">Tested on Internet Explorer 11 / Windows 8.1. Old iOS, macOS, and Android are untested — email kingjamesbiblereader@outlook.sg to report any issues.</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* App Info */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-5 overflow-hidden shadow-lg shadow-black/[0.03]">
        <button
          onClick={() => toggleSection('info')}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/5 transition-colors text-left"
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-lg font-semibold text-foreground">App Info</h2>
            <p className="font-sans text-xs text-muted-foreground">Version and features</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.info ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.info && (
          <div className="px-5 pb-6 pt-2 space-y-2">
            <div className="p-3 mb-4 rounded-xl bg-secondary/50 border border-border">
              <div className="flex items-start gap-2 text-primary">
                <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-sans text-sm font-medium">Automatic Updates</p>
                  <p className="font-sans text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    This app connects to the internet in the background to automatically apply new features, typo corrections, and security fixes. You never have to refresh manually!
                  </p>
                </div>
              </div>
            </div>
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
                  {inIframe() || isIncognito ? (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      Unavailable
                    </>
                  ) : cached ? (
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
                  {(() => {
                    try {
                      const dmStandalone = window.matchMedia('(display-mode: standalone)').matches;
                      const dmMinimal = window.matchMedia('(display-mode: minimal-ui)').matches;
                      const dmOverlay = window.matchMedia('(display-mode: window-controls-overlay)').matches;
                      if (dmStandalone || dmMinimal || dmOverlay || navigator.standalone === true) {
                        return <><CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> Installed</>;
                      }
                    } catch {}
                    return <><Smartphone className="w-3.5 h-3.5 text-muted-foreground" /> Browser</>;
                  })()}
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
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-5 overflow-hidden shadow-lg shadow-black/[0.03]">
        <button
          onClick={() => toggleSection('credits')}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/5 transition-colors text-left"
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-lg font-semibold text-foreground">Credits</h2>
            <p className="font-sans text-xs text-muted-foreground">Attributions and licenses</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.credits ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.credits && (
        <div className="px-5 pb-6 pt-2 space-y-2">
          <div className="space-y-2 font-sans text-xs text-muted-foreground">
        <p>• <strong className="text-foreground">App Platform:</strong> Built with <a href="https://base44.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Base44</a></p>
        <p>• <strong className="text-foreground">Special Thanks:</strong> Elvish Ishaan for fixing bugs and issues</p>
        <p>• <strong className="text-foreground">Bible Text:</strong> King James Bible: Pure Cambridge Edition: Wharton Text Format</p>
        <p>• <strong className="text-foreground">Cormorant Garamond:</strong> Google Fonts (SIL Open Font License)</p>
        <p>• <strong className="text-foreground">Inter:</strong> Google Fonts (SIL Open Font License)</p>
        <p>• <strong className="text-foreground">Merriweather:</strong> Google Fonts (SIL Open Font License)</p>
        <p>• <strong className="text-foreground">Dancing Script:</strong> Google Fonts (SIL Open Font License)</p>
        <p className="pt-2 text-[10px] opacity-75">All fonts are open source and freely available under the SIL Open Font License.</p>
        <p>• <strong className="text-foreground">King James Bible Text:</strong> Public domain worldwide. In the United Kingdom, the KJB is protected by a perpetual Crown Copyright administered by the King's Printer. This app is for personal, non-commercial use only. For commercial use within the UK, a licence from Cambridge University Press or the King's Printer may be required. See <a href="https://www.cambridge.org/bibles/about/rights-and-permissions" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">cambridge.org/bibles/about/rights-and-permissions</a> for details.</p>
        <p className="pt-2 text-[11px] text-foreground/80">This app is public domain and freely shareable. Made in Singapore. 🇸🇬</p>
        <p className="pt-1 text-[11px] text-foreground/80">• <strong className="text-foreground">AI Disclaimer:</strong> This app was built with the assistance of artificial intelligence (AI). AI-generated code and content may contain errors. The King James Bible text itself is not AI-generated. Please report any issues so we can correct them.</p>
      </div>
        </div>
        )}
      </div>

      {/* Advanced */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-5 overflow-hidden shadow-lg shadow-black/[0.03]">
        <button
          onClick={() => toggleSection('advanced')}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/5 transition-colors text-left"
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-lg font-semibold text-foreground">Advanced</h2>
            <p className="font-sans text-xs text-muted-foreground">Reset settings and check for updates</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.advanced ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.advanced && (
          <div className="px-5 pb-6 pt-2 space-y-3">
            <div className="space-y-2 mb-4 pt-1 border-b border-border pb-4">
              <div className="flex justify-between items-center font-sans text-sm gap-4">
                <span className="text-muted-foreground shrink-0">Worker Version</span>
                <span className="text-foreground font-medium text-right flex items-center gap-1.5">
                  {liveWorkerVersion ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      {liveWorkerVersion}
                    </>
                  ) : (
                    <span className="text-muted-foreground">{WORKER_VERSION} (expected)</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center font-sans text-sm gap-4">
                <span className="text-muted-foreground shrink-0">Data Cache</span>
                <span className="text-foreground font-medium text-right">{CACHE_VERSION}</span>
              </div>
              <div className="flex justify-between items-center font-sans text-sm gap-4">
                <span className="text-muted-foreground shrink-0">Browser Sees As Installed</span>
                <span className={`font-medium text-right ${relatedAppsStatus === 'installed' ? 'text-amber-500' : 'text-foreground'}`}>
                  {relatedAppsStatus === 'checking' && 'Checking…'}
                  {relatedAppsStatus === 'unsupported' && 'Not supported here'}
                  {relatedAppsStatus === 'error' && 'Check failed'}
                  {relatedAppsStatus === 'none' && 'No'}
                  {relatedAppsStatus === 'installed' && `Yes (${relatedAppsList.length})`}
                </span>
              </div>
              {relatedAppsStatus === 'installed' && (
                <p className="font-sans text-[11px] text-muted-foreground leading-relaxed">
                  The browser already considers an app matching this site installed. That's why the
                  automatic install banner won't appear — only the manual "Add to phone" option will.
                  If this doesn't match a real install on your device, uninstall any stray KJB Reader
                  entry from your phone's app list, then clear site data for this domain in the browser
                  and revisit.
                </p>
              )}

            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={async () => {
                  if (confirm('Reset all settings to default? This cannot be undone. (Your daily verse background image is kept.)')) {
                    // Reset all localStorage settings — but KEEP the custom
                    // daily-verse background image (kjb-daily-verse-bg), since the
                    // user's uploaded daily verse image should survive a reset.
                    localStorage.removeItem('kjb-verse-text-color');
                    localStorage.removeItem('kjb-verse-text-opacity');
                    localStorage.removeItem('kjb-verse-font-family');
                    localStorage.removeItem('kjb-reader-font-family');
                    localStorage.removeItem('kjb-verse-panel-visible');
                    localStorage.removeItem('kjb-zoom');
                    localStorage.removeItem('kjb-notif-image');
                    localStorage.removeItem('kjb-daily-verse-cache');
localStorage.removeItem('kjb-daily-verse-cache-v16');
localStorage.removeItem('kjb-daily-verse-cache-v17');
                    // Flag a fresh re-download, THEN clear the Bible cache.
                    // clearBibleCache() reloads the page itself, so set the flag first.
                    try { localStorage.setItem('kjb-auto-redownload', 'true'); } catch {}
                    await clearBibleCache(); // clears cache + reloads the page
                  }
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-transparent border border-destructive text-destructive font-sans text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                Reset All Settings
              </button>
              <button
                onClick={handleClearCache}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-transparent border border-border text-foreground font-sans text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:border-accent"
              >
                <RotateCcw className="w-4 h-4" />
                Clear Cache & Reload
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Contact & Feedback */}
      <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl mb-5 overflow-hidden shadow-lg shadow-black/[0.03]">
        <button
          onClick={() => toggleSection('contact')}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-accent/5 transition-colors text-left"
        >
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-lg font-semibold text-foreground">Contact & Feedback</h2>
            <p className="font-sans text-xs text-muted-foreground">Report bugs or share feedback</p>
          </div>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSections.contact ? 'rotate-180' : ''}`} />
        </button>
        {expandedSections.contact && (
          <div className="px-5 pb-6 pt-2 space-y-2">
            <button
              onClick={() => navigate('/privacy')}
              className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group text-left"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-violet-500 to-purple-600">
                <Shield className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Privacy Policy</p>
                <p className="font-sans text-xs text-muted-foreground">How your data is handled</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
            </button>
            <a
              href="mailto:kingjamesbiblereader@outlook.sg"
              className="flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-emerald-500 to-teal-600">
                <Mail className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Email for Support</p>
                <p className="font-sans text-xs text-muted-foreground">kingjamesbiblereader@outlook.sg</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
            </a>
            <a
              href="https://godisgracious1031ministriescom.odoo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-sky-500 to-blue-600">
                <Globe className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Ministry Website</p>
                <p className="font-sans text-xs text-muted-foreground">godisgracious1031ministries.com</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
            </a>
            <a
              href="https://discord.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-indigo-500 to-violet-600">
                <DiscordIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Discord</p>
                <p className="font-sans text-xs text-muted-foreground">shawn_faithinhisbloodr325av</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
            </a>
            <a
              href="https://www.tiktok.com/@svdbyfaithinr325av?_r=1&_t=ZS-96WRhWSLUoe"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-slate-700 to-slate-900">
                <TikTokIcon />
              </div>
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
              className="flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-fuchsia-500 to-pink-600">
                <Instagram className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">Instagram</p>
                <p className="font-sans text-xs text-muted-foreground">@svdbyfaithinhisbloodr325av</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
            </a>
            <a
              href="https://youtube.com/@shawnr325av?si=zC_gQm4I2S_xj-NS"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 rounded-2xl bg-card/70 backdrop-blur-xl border border-border/60 shadow-sm hover:shadow-lg hover:border-accent/40 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 group"
            >
              <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl text-white shadow-md bg-gradient-to-br from-red-500 to-rose-600">
                <Youtube className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans font-medium text-sm text-foreground group-hover:text-accent transition-colors">YouTube</p>
                <p className="font-sans text-xs text-muted-foreground">@shawnr325av</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}