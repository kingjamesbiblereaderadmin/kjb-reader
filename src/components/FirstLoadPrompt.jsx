import React, { useState, useEffect } from 'react';
import { Bell, X, Share, MonitorSmartphone, Download, Accessibility, Palette, Type, Moon, Sun, Monitor } from 'lucide-react';
import { getAccessibilityFont, setAccessibilityFont } from '@/lib/accessibilityFont';
import ThemeColorPicker from '@/components/bible/ThemeColorPicker';
import { useTheme } from '@/lib/themeContext';
import { detectIncognito } from '@/lib/incognito';

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
const isInStandaloneMode = () => {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone) return true;
  try { return localStorage.getItem('kjb-is-installed') === 'true'; } catch { return false; }
};

const DISMISSED_KEY = 'kjb-prompt-dismissed';

const inIframe = () => {
  try { return window.self !== window.top; } catch (e) { return true; }
};

export default function FirstLoadPrompt({ isInstallable, notifPermission, onInstall, onDismiss, onEnableNotif }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === 'true'; } catch { return false; }
  });
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [installDone, setInstallDone] = useState(isInStandaloneMode);
  const [notifDone, setNotifDone] = useState(() =>
    'Notification' in window && Notification.permission === 'granted'
  );
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

  useEffect(() => {
    detectIncognito().then(setIsIncognito);
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

  // Keep notifDone in sync when permission changes externally
  useEffect(() => {
    const checkNotif = () => {
      if ('Notification' in window && Notification.permission === 'granted') {
        setNotifDone(true);
      }
    };
    checkNotif();
    window.addEventListener('focus', checkNotif);
    window.addEventListener('storage', checkNotif);
    return () => {
      window.removeEventListener('focus', checkNotif);
      window.removeEventListener('storage', checkNotif);
    };
  }, [notifPermission]);

  // When installed, mark installDone
  useEffect(() => {
    if (isInStandaloneMode()) setInstallDone(true);
    const handler = () => {
      if (isInStandaloneMode()) setInstallDone(true);
    };
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  const alreadyInstalled = isInStandaloneMode() || installDone;
  const showInstall = !isIncognito && !isInStandaloneMode() && (isInstallable || isIOS() || isAndroid() || !isMobile());

  const shouldShow = !dismissed;

  if (!shouldShow) return null;

  const handleClose = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setDismissed(true);
    try { localStorage.setItem(DISMISSED_KEY, 'true'); } catch {}
    if (onDismiss) onDismiss();
  };

  const handleInstallClick = async (e) => {
    if (!isInstallable) {
      setShowIOSHint(true);
      return;
    }
    if (onInstall) {
      try {
        const accepted = await onInstall();
        if (accepted) {
          setInstallDone(true);
        }
      } catch (err) {
        console.error('Install prompt failed:', err);
        setShowIOSHint(true);
      }
    } else {
      setShowIOSHint(true);
    }
  };

  const handleNotifClick = async (e) => {
    if (onEnableNotif) {
      try {
        const ok = await onEnableNotif();
        // Trust the result from onEnableNotif (covers granted + unsupported
        // platforms where Notification.permission may not read 'granted').
        if (ok || ('Notification' in window && Notification.permission === 'granted')) {
          setNotifDone(true);
        } else {
          setNotifFailed(true);
        }
      } catch (err) {
        setNotifFailed(true);
      }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[99998] bg-black/50 backdrop-blur-md"
        onClick={handleClose}
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

          <div className="overflow-y-auto overscroll-contain flex-1 min-h-0 space-y-2.5 sm:space-y-3 pr-1 scrollbar-hide">
          {isIncognito && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/40 p-2.5 sm:p-3">
              <p className="font-sans text-[10px] sm:text-xs text-amber-700 dark:text-amber-400 font-medium leading-snug flex items-start gap-1.5">
                <span className="shrink-0 leading-none mt-0.5">⚠️</span>
                <span>You're in an incognito / guest window. App install and notifications won't work, and your settings will be erased when you close this window.</span>
              </p>
            </div>
          )}
          {showInstall && (
            <div className="space-y-2 shrink-0">
              <button
                type="button"
                disabled={installDone}
                onClick={installDone ? undefined : handleInstallClick}
                className={`w-full flex items-center gap-2 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl font-sans text-[13px] sm:text-sm font-medium transition-all duration-200 touch-manipulation ${
                  installDone 
                    ? 'bg-secondary/40 border border-border text-foreground cursor-not-allowed opacity-80'
                    : 'hover:scale-[1.02] active:scale-[0.98] bg-primary text-primary-foreground border-2 border-primary'
                }`}
              >
                {isIOS() ? <Share className="w-4 h-4 shrink-0" /> : isMobile() ? <Download className="w-4 h-4 shrink-0" /> : <MonitorSmartphone className="w-4 h-4 shrink-0" />}
                <span className="text-left leading-tight">
                  <span className="block font-semibold">{installDone ? 'App Installed' : isInstallable ? (isMobile() ? 'Add to Home Screen' : 'Install App') : 'How to Install App'}</span>
                  <span className="block text-[10px] sm:text-xs opacity-80">{installDone ? 'Available on your device' : isInstallable ? 'Offline access, faster loading' : 'View manual instructions'}</span>
                </span>
              </button>
              
              {showIOSHint && !installDone && (
                <div className="bg-secondary/40 border border-border rounded-xl p-2.5 sm:p-3">
                  {!isInstallable && (
                    <div className="mb-2 pb-2 border-b border-border/50">
                      {inIframe() ? (
                        <p className="font-sans text-[10px] sm:text-xs text-blue-600 dark:text-blue-400 font-medium flex items-start gap-1 leading-snug">
                          <span className="shrink-0 leading-none mt-0.5">ℹ️</span>
                          You are viewing this inside the Base44 preview window, where Chrome/Edge block the PWA install prompt. Please click "Open in New Tab" (top right) to install it!
                        </p>
                      ) : (
                        <p className="font-sans text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 font-medium flex items-start gap-1 leading-snug">
                          <span className="shrink-0 leading-none mt-0.5">⚠️</span>
                          The automatic prompt was blocked by your browser. Try the manual steps below!
                        </p>
                      )}
                    </div>
                  )}
                  <p className="font-sans text-[10px] sm:text-xs text-foreground leading-relaxed">
                    <strong>Manual Installation Guide:</strong>
                    <br />
                    {isIOS() ? (
                      <>Please tap the <strong>Share</strong> icon in your browser menu, then select <strong>"Add to Home Screen"</strong>.</>
                    ) : isMobile() ? (
                      <>Please open your browser's <strong>Menu (⋮ or ⋯)</strong> and select <strong>"Add to phone"</strong>, <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</>
                    ) : (
                      <>If an <strong>Install</strong> icon appears in your address bar, click it. Otherwise, check your browser's main menu. <span className="italic opacity-80">(Note: Firefox and Safari for Mac do not support desktop installation)</span>.</>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Theme Mode */}
          <div className="rounded-xl bg-secondary/40 border border-border p-2 sm:p-2.5">
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
          <div className="rounded-xl bg-secondary/40 border border-border p-2 sm:p-2.5">
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

          {/* Accessibility font — dyslexic & high-legibility options */}
          <div className="rounded-xl bg-primary/5 border-2 border-primary/20 p-2 sm:p-2.5 mt-1">
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
            disabled={notifFailed || notifDone}
            onClick={notifFailed || notifDone ? undefined : handleNotifClick}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left touch-manipulation transition-colors ${
              notifFailed || notifDone
                ? 'bg-secondary/40 border-border text-foreground cursor-not-allowed opacity-80' 
                : 'bg-primary/10 border-primary/20 text-primary hover:bg-primary/20 active:bg-primary/25 font-medium'
            }`}
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span className="flex-1 text-left leading-tight">
              <span className={`block ${notifFailed || notifDone ? 'font-medium' : 'font-semibold'}`}>
                {notifDone ? 'Notifications Enabled' : 'Enable Daily Notifications'}
              </span>
              <span className="block text-[10px] sm:text-xs opacity-80 mt-0.5">
                {notifDone ? 'You will receive the daily verse every morning' : notifFailed ? 'Blocked or not supported by browser' : 'Get the daily verse every morning'}
              </span>
            </span>
          </button>
          )}
          </div>
      </div>
    </>
  );
}