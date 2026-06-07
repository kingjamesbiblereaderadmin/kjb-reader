import React, { useState, useEffect } from 'react';
import { Bell, X, Share, MonitorSmartphone, Download, Accessibility, Palette, Type } from 'lucide-react';
import { getAccessibilityFont, setAccessibilityFont } from '@/lib/accessibilityFont';
import ThemeColorPicker from '@/components/bible/ThemeColorPicker';

const VERSE_FONTS = [
  { value: 'serif', label: 'Serif' },
  { value: 'sans-serif', label: 'Sans' },
  { value: 'monospace', label: 'Mono' },
  { value: 'cursive', label: 'Cursive' },
];

const A11Y_FONTS = [
  { value: 'default', label: 'Off' },
  { value: 'dyslexic', label: 'OpenDyslexic', preview: "'OpenDyslexic', 'Comic Sans MS', sans-serif" },
  { value: 'hyperlegible', label: 'Hyperlegible', preview: "'Atkinson Hyperlegible', system-ui, sans-serif" },
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
  const [readerFontFamily, setReaderFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-reader-font-family') || 'serif'; } catch { return 'serif'; }
  });
  const [verseFontFamily, setVerseFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-verse-font-family') || 'serif'; } catch { return 'serif'; }
  });

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
    if ('Notification' in window && Notification.permission === 'granted') {
      setNotifDone(true);
    }
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
  const showInstall = !alreadyInstalled && (isInstallable || isIOS() || isAndroid() || !isMobile());
  const showNotif = !notifDone;

  // TEMP: promo screenshot mode — prompt disabled while capturing marketing shots.
  const PROMO_SCREENSHOT_MODE = false;

  // Once dismissed (or all tasks done), never show again. Respect the user's choice.
  const shouldShow = !dismissed && (showInstall || showNotif);

  if (PROMO_SCREENSHOT_MODE || !shouldShow) return null;

  const handleClose = (e) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    setDismissed(true);
    try { localStorage.setItem(DISMISSED_KEY, 'true'); } catch {}
    if (onDismiss) onDismiss();
  };

  const handleInstallClick = (e) => {
    if (isIOS() && !isInstallable) {
      setShowIOSHint(h => !h);
      return;
    }
    if (isInstallable && onInstall) {
      const result = onInstall();
      if (result && result.then) {
        result.then(accepted => {
          if (accepted) setInstallDone(true);
          else setShowIOSHint(h => !h);
        });
      }
    } else {
      // Desktop/Android without deferred prompt — show browser hint
      setShowIOSHint(h => !h);
    }
  };

  const handleNotifClick = async (e) => {
    e.stopPropagation();
    if (onEnableNotif) {
      await onEnableNotif();
      setNotifDone(true);
      // If there's nothing else to show, dismiss the whole prompt
      if (!showInstall) {
        setDismissed(true);
        try { localStorage.setItem(DISMISSED_KEY, 'true'); } catch {}
        if (onDismiss) onDismiss();
      }
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[99998] bg-black/50 backdrop-blur-md"
        onPointerDown={handleClose}
      />
      <div className="fixed bottom-20 sm:bottom-6 right-4 z-[99999] w-80 pointer-events-auto">
        <div
          className="bg-card border border-border rounded-2xl shadow-2xl p-4 space-y-3 relative"
          onPointerDown={e => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex flex-col">
              <p className="font-serif text-lg font-bold text-foreground leading-tight">Welcome to KJB Reader</p>
              <p className="font-sans text-xs text-muted-foreground mt-1">Get the most out of your app</p>
            </div>
            <button
              type="button"
              onPointerDown={handleClose}
              className="shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary active:bg-secondary transition-colors cursor-pointer touch-manipulation"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {showInstall && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-sans text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:active:scale-100 touch-manipulation bg-primary text-primary-foreground border-2 border-primary"
              >
                {isIOS() ? <Share className="w-4 h-4 shrink-0" /> : isMobile() ? <Download className="w-4 h-4 shrink-0" /> : <MonitorSmartphone className="w-4 h-4 shrink-0" />}
                <span className="text-left">
                  <span className="block font-semibold">{isMobile() ? 'Add to Home Screen' : 'Install App'}</span>
                  <span className="block text-xs opacity-80">Offline access, faster loading</span>
                </span>
              </button>
              
              {(!isInstallable && showIOSHint) && (
                <div className="bg-secondary/40 border border-border rounded-xl p-3">
                  <p className="font-sans text-xs text-foreground leading-relaxed">
                    <strong>Install KJB Reader from your browser menu:</strong>
                    <br />
                    {isIOS() ? (
                      <>Tap <strong>Share</strong>, then <strong>"Add to Home Screen"</strong>.</>
                    ) : isMobile() ? (
                      <>Use your browser menu → <strong>"Install app"</strong>.</>
                    ) : (
                      <>Use the browser menu to install.</>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Read Font */}
          <div className="rounded-xl bg-secondary/40 border border-border p-2.5">
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <Type className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="font-sans text-xs font-medium text-foreground">Read Font</span>
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
                  onPointerDown={e => e.stopPropagation()}
                  className={`px-1 py-1.5 rounded-lg border font-sans text-[10px] font-medium transition-all touch-manipulation ${
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
          <div className="rounded-xl bg-secondary/40 border border-border p-2.5">
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <Type className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="font-sans text-xs font-medium text-foreground">Daily Verse Font</span>
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
                  onPointerDown={e => e.stopPropagation()}
                  className={`px-1 py-1.5 rounded-lg border font-sans text-[10px] font-medium transition-all touch-manipulation ${
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
          <div className="rounded-xl bg-secondary/40 border border-border p-2.5">
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <Accessibility className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="font-sans text-xs font-medium text-foreground">Accessibility Font</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {A11Y_FONTS.map(font => (
                <button
                  key={font.value}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setA11yFont(font.value); setAccessibilityFont(font.value); }}
                  onPointerDown={e => e.stopPropagation()}
                  className={`px-2 py-2 rounded-lg border font-sans text-xs font-medium transition-all touch-manipulation ${
                    a11yFont === font.value
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card text-foreground border-border hover:border-accent'
                  }`}
                  style={font.preview ? { fontFamily: font.preview } : undefined}
                >
                  {font.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme color — match daily verse or pick a fixed colour */}
          <div className="rounded-xl bg-secondary/40 border border-border p-2.5">
            <div className="flex items-center gap-1.5 mb-2 px-0.5">
              <Palette className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="font-sans text-xs font-medium text-foreground">Theme Color</span>
            </div>
            <ThemeColorPicker compact />
          </div>

          {showNotif && (
            <button
              type="button"
              onPointerUp={handleNotifClick}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-sans text-sm font-medium hover:bg-primary/20 active:bg-primary/25 transition-colors text-left touch-manipulation"
            >
              <Bell className="w-4 h-4 shrink-0" />
              <span className="flex-1">
                <span className="block font-semibold">Enable Daily Notifications</span>
                <span className="block text-xs opacity-80">Get the daily verse every morning</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}