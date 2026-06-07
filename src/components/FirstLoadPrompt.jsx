import React, { useState, useEffect } from 'react';
import { Bell, X, Share, MonitorSmartphone, Download, Accessibility, Palette } from 'lucide-react';
import { getAccessibilityFont, setAccessibilityFont } from '@/lib/accessibilityFont';
import ThemeColorPicker from '@/components/bible/ThemeColorPicker';

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
  const PROMO_SCREENSHOT_MODE = true;

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
        className="fixed inset-0 z-[99998] bg-background/60 backdrop-blur-sm"
        onPointerDown={handleClose}
      />
      <div className="fixed bottom-20 sm:bottom-6 right-4 z-[99999] w-80 pointer-events-auto">
        <div
          className="bg-card border border-border rounded-2xl shadow-2xl p-4 space-y-3 relative"
          onPointerDown={e => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-serif text-base font-semibold text-foreground leading-tight">Get the most from KJB Reader</p>
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
            <div>
              {isInstallable ? (
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
              ) : (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3">
                  <p className="font-sans text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                    <strong>Your browser doesn't support automatic installation.</strong>
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
                  className={`px-2 py-2 rounded-lg font-sans text-xs font-medium transition-all touch-manipulation ${
                    a11yFont === font.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card text-foreground border border-border hover:border-accent'
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