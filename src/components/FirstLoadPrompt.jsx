import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Share, MonitorSmartphone, Download, Accessibility, Palette, Type, Moon, Sun, Monitor, Star } from 'lucide-react';
import { toast } from 'sonner';
import { getAccessibilityFont, setAccessibilityFont } from '@/lib/accessibilityFont';
import ThemeColorPicker from '@/components/bible/ThemeColorPicker';
import { useTheme } from '@/lib/themeContext';
import { detectIncognito } from '@/lib/incognito';
import { getNotificationsEnabled, requestNotificationPermission, scheduleDailyNotification, showLocalNotification, cleanForNotification } from '@/lib/notifications';
import { getDailyVerse } from '@/lib/dailyVerse';

const VERSE_FONTS = [
  { value: 'serif', label: 'Serif' },
  { value: 'sans-serif', label: 'Sans' },
  { value: 'monospace', label: 'Mono' },
  { value: 'cursive', label: 'Cursive' },
];

const A11Y_FONTS = [
  { value: 'default', label: 'Off' },
  { value: 'dyslexic', label: 'Dyslexic', preview: "'OpenDyslexic', 'Comic Sans MS', sans-serif" },
  { value: 'hyperlegible', label: 'Legible', preview: "'Atkinson Hyperlegible', system-ui, sans-serif" },
];

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isMobile = () => /iphone|ipad|ipod|android/i.test(navigator.userAgent);
const isAndroid = () => /android/i.test(navigator.userAgent);
const isSamsung = () => /SamsungBrowser/i.test(navigator.userAgent);
const isEdgeMobile = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isEdge = /edg/i.test(ua);
  const isMobile = /iphone|ipad|ipod|android/i.test(ua);
  return isEdge && isMobile;
};
const isEdgeDesktop = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const isEdge = /edg/i.test(ua);
  const isMobile = /iphone|ipad|ipod|android/i.test(ua);
  return isEdge && !isMobile;
};

const isBookmarkBrowser = () => {
  const ua = navigator.userAgent;
  const isFirefox = /firefox/i.test(ua);
  const isMac = /Macintosh|Mac OS X/i.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
  const mobile = /iphone|ipad|ipod|android/i.test(ua);
  return !mobile && (isFirefox || (isMac && isSafari));
};

const inIframe = () => {
  try { return window.self !== window.top; } catch (e) { return true; }
};

// Detect if running as installed PWA (standalone mode)
const isStandalonePWA = () => {
  if (typeof window === 'undefined') return false;
  // Never report installed when running inside an iframe (preview/embed)
  try {
    if (window.self !== window.top) return false;
  } catch (e) {
    return false;
  }
  // Check display-mode media queries (covers all display_override values from manifest)
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
  if (window.matchMedia('(display-mode: window-controls-overlay)').matches) return true;
  // iOS Safari
  if (window.navigator.standalone === true) return true;
  // Edge PWA: check for running in app window (no browser chrome)
  if (window.outerWidth - window.innerWidth > 100 && window.outerHeight - window.innerHeight > 100) return true;
  return false;
};

const DISMISSED_KEY = 'kjb-prompt-dismissed';

export default function FirstLoadPrompt({ isInstallable, isInstalled: parentIsInstalled, notifPermission, onInstall, onDismiss, onEnableNotif }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === 'true'; } catch { return false; }
  });
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [installDone, setInstallDone] = useState(parentIsInstalled || false);
  const [promptCancelled, setPromptCancelled] = useState(false);
  const [notifDone, setNotifDone] = useState(false);
  const [a11yFont, setA11yFont] = useState(getAccessibilityFont);
  const { mode, setMode } = useTheme();
  const [readerFontFamily, setReaderFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-reader-font-family') || 'serif'; } catch { return 'serif'; }
  });
  const [verseFontFamily, setVerseFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-verse-font-family') || 'serif'; } catch { return 'serif'; }
  });
  const [notifFailed, setNotifFailed] = useState(false);
  const [isIncognito, setIsIncognito] = useState(false);
  const [incognitoChecked, setIncognitoChecked] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const promptedRef = useRef(false);

  useEffect(() => {
    detectIncognito().then((v) => {
      setIsIncognito(v);
      setIncognitoChecked(true);
    });
  }, []);

  // Samsung Internet (older versions) doesn't fire beforeinstallprompt, so the native
  // install button is a no-op. Show the manual guide up front for Samsung users.
  useEffect(() => {
    if (isSamsung() && !window.kjbDeferredPrompt) setShowIOSHint(true);
  }, []);

  // Detect standalone PWA mode on mount and when focus changes
  useEffect(() => {
    const checkStandalone = () => {
      const standalone = isStandalonePWA();
      setIsStandalone(standalone);
      if (standalone) setInstallDone(true);
    };
    checkStandalone();
    window.addEventListener('focus', checkStandalone);
    return () => window.removeEventListener('focus', checkStandalone);
  }, []);

  // Sync install state from parent hook - but don't auto-close prompt
  useEffect(() => {
    if (parentIsInstalled) setInstallDone(true);
  }, [parentIsInstalled]);

  // Keep prompt open even after installation - only close on explicit dismiss
  useEffect(() => {
    if (installDone && !dismissed) {
      // Prompt stays open after install until user taps out
    }
  }, [installDone, dismissed]);

  // Sync notif state on mount and focus - show enabled if localStorage flag is set AND browser permission is granted
  useEffect(() => {
    const checkNotif = () => {
      try {
        // Check localStorage (persistent) AND browser permission is granted
        const enabled = localStorage.getItem('kjb-notifications-enabled') === 'true';
        const permissionGranted = 'Notification' in window && Notification.permission === 'granted';
        if (enabled && permissionGranted) {
          setNotifDone(true);
        } else {
          setNotifDone(false);
        }
      } catch {}
    };
    checkNotif();
    window.addEventListener('focus', checkNotif);
    document.addEventListener('visibilitychange', checkNotif);
    return () => {
      window.removeEventListener('focus', checkNotif);
      document.removeEventListener('visibilitychange', checkNotif);
    };
  }, []);

  const pickReaderFont = (value) => {
    try { localStorage.setItem('kjb-reader-font-family', value); } catch {}
    setReaderFontFamily(value);
    if (a11yFont !== 'default') { setA11yFont('default'); setAccessibilityFont('default'); }
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('kjb-fonts-changed'));
  };

  const pickVerseFont = (value) => {
    try { localStorage.setItem('kjb-verse-font-family', value); } catch {}
    setVerseFontFamily(value);
    if (a11yFont !== 'default') { setA11yFont('default'); setAccessibilityFont('default'); }
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('kjb-fonts-changed'));
  };

  // Hide install section if already in standalone PWA mode or parent says installed
  const actuallyInstalled = isStandalone || parentIsInstalled || installDone;
  
  // Show install button if NOT installed AND (native prompt available OR was cancelled/manual guide needed).
  // On Edge mobile & Samsung (no beforeinstallprompt), skip the broken button — show guide directly.
  // Wait until the incognito check has resolved so the button never flashes in (or
  // stays) during the async detection in a private window.
  const skipNativeButton = (isEdgeMobile() || isSamsung()) && !window.kjbDeferredPrompt;
  const showInstall = incognitoChecked && !isIncognito && !actuallyInstalled && !skipNativeButton && (isInstallable || isIOS() || isAndroid() || !isMobile() || promptCancelled);

  // Show prompt for configuration even when installed — only hide install section
  const shouldShow = !dismissed;

  if (!shouldShow) return null;

  const handleClose = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setDismissed(true);
    try { localStorage.setItem(DISMISSED_KEY, 'true'); } catch {}
    if (onDismiss) onDismiss();
  };

  const handleInstallClick = async (e) => {
    promptedRef.current = true;
    try { window.kjbPromptedThisSession = true; } catch {}
    
    console.log('[FirstLoadPrompt] Install clicked | deferredPrompt:', !!window.kjbDeferredPrompt, '| isInstallable:', isInstallable);
    
    // Always try native prompt first (Edge desktop/mobile, Chrome, Samsung)
    if (onInstall) {
      try {
        const accepted = await onInstall();
        console.log('[FirstLoadPrompt] promptInstall result:', accepted);
        if (accepted) {
          setInstallDone(true);
          return;
        }
        // Prompt was cancelled - keep button visible, show manual guide
        setPromptCancelled(true);
        setShowIOSHint(true);
        return;
      } catch (err) {
        console.error('Install prompt failed:', err);
        setPromptCancelled(true);
        setShowIOSHint(true);
        return;
      }
    }
    // No native prompt available, show manual guide
    console.log('[FirstLoadPrompt] No onInstall handler available');
    setPromptCancelled(true);
    setShowIOSHint(true);
  };

  const handleNotifClick = async (e) => {
    if (!('Notification' in window)) {
      setNotifFailed(true);
      alert('Notifications are not supported in this browser. Please install the app for notification support.');
      return;
    }
    
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('kjb-notifications-enabled', 'true');
        window.kjbNotifEnabledThisSession = true;
        setNotifDone(true);
        setNotifFailed(false);
        await requestNotificationPermission();
        scheduleDailyNotification();
        const v = getDailyVerse();
        showLocalNotification('KJB — Reminders On', `"${cleanForNotification(v.text)}" — ${v.ref} (KJB)`, null, '/');
      }
    } catch (err) {
      console.error('Notif permission error:', err);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-[99998] bg-black/50 backdrop-blur-md"
        onClick={handleClose}
        onTouchEnd={(e) => { e.preventDefault(); handleClose(); }}
      />
      <div
        className="fixed bottom-20 sm:bottom-6 right-4 z-[99999] w-72 sm:w-80 bg-card border border-border rounded-2xl shadow-2xl p-3 sm:p-4 flex flex-col min-h-0 pointer-events-auto max-h-[calc(100dvh-7rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2 mb-2 shrink-0">
            <div className="flex flex-col">
              <p className="font-serif text-base sm:text-lg font-bold text-foreground leading-tight">Welcome to KJB Reader</p>
              <p className="font-sans text-[10px] sm:text-xs text-muted-foreground mt-0.5">Get the most out of your app</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary active:bg-secondary transition-colors cursor-pointer touch-manipulation -mt-1 -mr-1"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 space-y-2 pr-1 scrollbar-hide">
          {isIncognito && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/40 p-2.5 sm:p-3">
              <p className="font-sans text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 font-medium leading-snug flex items-start gap-1.5">
                <span className="shrink-0 leading-none mt-0.5">⚠️</span>
                <span>You're in a private window (Incognito, InPrivate, or Guest). App install and notifications won't work, and your settings will be erased when you close this window.</span>
              </p>
            </div>
          )}
          {showInstall && isBookmarkBrowser() && (
            <div className="space-y-2 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const isMac = /Macintosh|Mac OS X/i.test(navigator.userAgent);
                  toast.info('Add to Favourites / Bookmarks', {
                    description: isMac
                      ? 'Press ⌘ D to bookmark this app for quick access.'
                      : 'Press Ctrl + D to bookmark this app for quick access.',
                  });
                }}
                className="w-full flex items-center gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl font-sans text-[13px] sm:text-sm font-medium transition-all duration-200 touch-manipulation hover:scale-[1.02] active:scale-[0.98] bg-primary text-primary-foreground border-2 border-primary"
              >
                <Star className="w-4 h-4 shrink-0" />
                <span className="text-left leading-tight">
                  <span className="block font-semibold">Add to Favourites</span>
                  <span className="block text-[10px] sm:text-xs opacity-80">Bookmark for quick access</span>
                </span>
              </button>
            </div>
          )}
          {inIframe() && (
            <div className="bg-secondary/40 border border-border rounded-xl p-2.5 sm:p-3 shrink-0">
              <p className="font-sans text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium flex items-start gap-1 leading-snug">
                <span className="shrink-0 leading-none mt-0.5">ℹ️</span>
                You are viewing this inside the embed preview window, where browsers block PWA installation. Please open the app in a new tab to install it!
              </p>
            </div>
          )}
          
          {(showInstall || (skipNativeButton && !isBookmarkBrowser() && !inIframe())) && !actuallyInstalled && (
            <div className="space-y-2 shrink-0">
              {showInstall && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full flex items-center gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl font-sans text-[13px] sm:text-sm font-medium transition-all duration-200 touch-manipulation hover:scale-[1.02] active:scale-[0.98] bg-primary text-primary-foreground border-2 border-primary"
                >
                  {isIOS() ? <Share className="w-4 h-4 shrink-0" /> : isMobile() ? <Download className="w-4 h-4 shrink-0" /> : <MonitorSmartphone className="w-4 h-4 shrink-0" />}
                  <span className="text-left leading-tight">
                    <span className="block font-semibold">{isMobile() ? 'Add to Home Screen' : 'Install App'}</span>
                    <span className="block text-[10px] sm:text-xs opacity-80">Offline access, faster loading</span>
                  </span>
                </button>
              )}
              
              {showIOSHint && !parentIsInstalled && (
                <div className="bg-secondary/40 border border-border rounded-xl p-2.5 sm:p-3">
                  {inIframe() ? (
                    <p className="font-sans text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium flex items-start gap-1 leading-snug">
                      <span className="shrink-0 leading-none mt-0.5">ℹ️</span>
                      You are viewing this inside the embed preview window, where browsers block PWA installation. Please open the app in a new tab to install it!
                    </p>
                  ) : (
                    <>
                      <p className="font-sans text-[10px] sm:text-xs text-foreground leading-relaxed">
                        <strong>Manual Installation Guide:</strong>
                        <br />
                        {isIOS() ? (
                          <>Please tap the <strong>Share</strong> icon in your browser menu, then select <strong>"Add to Home Screen"</strong>.</>
                        ) : isEdgeMobile() ? (
                          <>Tap the <strong>Menu (⋯)</strong> at the bottom or top, then select <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</>
                        ) : isSamsung() ? (
                          <>Tap the <strong>Menu (≡)</strong> at the bottom, then select <strong>"Add page to"</strong> → <strong>"Home screen"</strong>.</>
                        ) : isMobile() ? (
                          <>Please open your browser's <strong>Menu (⋮ or ⋯)</strong> and select <strong>"Add to phone"</strong>, <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</>
                        ) : isEdgeDesktop() ? (
                          <>Click the <strong>Apps</strong> or <strong>Install</strong> icon in your address bar, or go to <strong>Menu (⋯) → Apps → Install this site as an app</strong>. Choose <strong>App</strong> (not Shortcut) for the full experience.</>
                        ) : (
                          <>If an <strong>Install</strong> icon appears in your address bar, click it. Otherwise, check your browser's main menu. <span className="italic opacity-80">(Note: Firefox and Safari for Mac do not support desktop installation)</span>.</>
                        )}
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
          
          {installDone && (
            <>
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 p-2.5 shrink-0">
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-sans text-[11px] sm:text-xs text-emerald-800 dark:text-emerald-300 font-bold leading-snug">✓ Installed!</p>
                  <p className="font-sans text-[10px] sm:text-xs text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
                    <strong>Find the app:</strong>
                    {isIOS() && (
                      <span className="block mt-0.5">Home screen (swipe right to App Library)</span>
                    )}
                    {isAndroid() && (
                      <span className="block mt-0.5">App drawer or home screen</span>
                    )}
                    {!isMobile() && (
                      <span className="block mt-0.5">Taskbar, Start menu, or Applications folder</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!confirm('Reset installation status? This won\'t uninstall the app — it only clears the "installed" flag so you can see the install prompt again.')) {
                  return;
                }
                localStorage.removeItem('kjb-is-installed');
                localStorage.removeItem('kjb-install-dismissed');
                localStorage.removeItem('kjb-prompt-dismissed');
                window.dispatchEvent(new Event('storage'));
                window.dispatchEvent(new Event('kjb-install-change'));
                setInstallDone(false);
                setPromptCancelled(false);
                setShowIOSHint(false);
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive font-sans text-xs font-medium hover:bg-destructive/20 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16M4 20l16-16" />
              </svg>
              Reset — Show Install Button Again
            </button>
            </>
          )}

          {/* Theme Mode */}
          <div className="rounded-xl bg-secondary/40 border border-border p-2">
            <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
              <Monitor className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="font-sans text-[11px] sm:text-xs font-medium text-foreground">Theme Mode</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'light', label: 'Light', icon: <Sun className="w-3.5 h-3.5" /> },
                { id: 'dark', label: 'Dark', icon: <Moon className="w-3.5 h-3.5" /> },
                { id: 'auto', label: 'Auto', icon: <Monitor className="w-3.5 h-3.5" /> },
              ].map(opt => {
                const isActive = mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setMode(opt.id); }}
                    className={`flex flex-col items-center gap-1 px-1 py-1.5 rounded-lg border font-sans text-[10px] font-medium transition-all touch-manipulation ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                        : 'bg-card text-foreground border-border hover:border-accent'
                    }`}
                  >
                    {opt.icon}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Read Font */}
          <div className="rounded-xl bg-secondary/40 border border-border p-2">
            <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
              <Type className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="font-sans text-[11px] sm:text-xs font-medium text-foreground">Read Font</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {VERSE_FONTS.map(font => {
                const isActive = a11yFont !== 'default' ? false : readerFontFamily === font.value;
                const isDisabled = a11yFont !== 'default';
                return (
                <button
                  key={font.value}
                  disabled={isDisabled}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); pickReaderFont(font.value); }}
                  className={`px-1 py-1.5 rounded-lg border font-sans text-[9px] sm:text-[10px] font-medium transition-all touch-manipulation ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-foreground border-border hover:border-accent'
                  } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              )})}
            </div>
          </div>

          {/* Daily Verse Font */}
          <div className="rounded-xl bg-secondary/40 border border-border p-2">
            <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
              <Type className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="font-sans text-[11px] sm:text-xs font-medium text-foreground">Daily Verse Font</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {VERSE_FONTS.map(font => {
                const isActive = a11yFont !== 'default' ? false : verseFontFamily === font.value;
                const isDisabled = a11yFont !== 'default';
                return (
                <button
                  key={font.value}
                  disabled={isDisabled}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); pickVerseFont(font.value); }}
                  className={`px-1 py-1.5 rounded-lg border font-sans text-[9px] sm:text-[10px] font-medium transition-all touch-manipulation ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-foreground border-border hover:border-accent'
                  } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              )})}
            </div>
          </div>

          {/* Accessibility font */}
          <div className="rounded-xl bg-primary/5 border-2 border-primary/20 p-2">
            <div className="flex items-center gap-1.5 mb-1.5 px-0.5">
              <Accessibility className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="font-sans text-[11px] sm:text-xs font-semibold text-primary">Accessibility Font</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {A11Y_FONTS.map(font => (
                <button
                  key={font.value}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setA11yFont(font.value); setAccessibilityFont(font.value); }}
                  className={`px-1 py-2 rounded-xl border-2 font-sans text-[10px] sm:text-xs font-bold transition-all touch-manipulation flex flex-col items-center justify-center text-center ${
                    a11yFont === font.value
                      ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                      : 'bg-card text-foreground border-border hover:border-accent'
                  }`}
                  style={font.preview ? { fontFamily: font.preview } : undefined}
                >
                  <span className="mb-0.5">{font.label}</span>
                  {font.value === 'dyslexic' && <span className="text-[8px] sm:text-[9px] opacity-75 font-sans font-normal leading-none mt-0.5">Dyslexia</span>}
                  {font.value === 'hyperlegible' && <span className="text-[8px] sm:text-[9px] opacity-75 font-sans font-normal leading-none mt-0.5">Low Vision</span>}
                </button>
              ))}
            </div>
          </div>

          {!isIncognito && (
          <button
            type="button"
            disabled={notifDone}
            onClick={(e) => {
              e.stopPropagation();
              handleNotifClick(e);
            }}
            onTouchEnd={(e) => {
              if (!notifDone) {
                e.stopPropagation();
                handleNotifClick(e);
              }
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left touch-manipulation transition-all duration-200 ${
              notifDone
                ? 'bg-secondary/40 border-border text-foreground cursor-not-allowed opacity-80' 
                : 'bg-primary/10 border-primary/20 text-primary cursor-pointer hover:bg-primary/20 active:bg-primary/25 active:scale-[0.98] font-medium'
            }`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left leading-tight">
              <span className={`block ${notifDone ? 'font-medium' : 'font-semibold'}`}>
                {notifDone ? 'Notifications Enabled' : 'Enable Daily Notifications'}
              </span>
              <span className="block text-[10px] sm:text-xs opacity-80 mt-0.5">
                {notifDone ? 'You will receive the daily verse every morning' : 'Get the daily verse every morning'}
              </span>
            </span>
          </button>
          )}
          </div>
      </div>
    </>
  );
}