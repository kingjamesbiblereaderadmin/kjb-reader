import React, { useState, useEffect } from 'react';
import { Bell, X, Share, MonitorSmartphone, Download, Accessibility, Palette, Type } from 'lucide-react';
import { getAccessibilityFont, setAccessibilityFont } from '@/lib/accessibilityFont';
import ThemeColorPicker from '@/components/bible/ThemeColorPicker';

const READING_FONTS = [
  { value: 'serif', label: 'Serif', preview: "'Merriweather', 'Cormorant Garamond', Georgia, serif" },
  { value: 'sans-serif', label: 'Sans', preview: "'Inter', system-ui, -apple-system, sans-serif" },
  { value: 'monospace', label: 'Mono', preview: "'Courier New', monospace" },
  { value: 'cursive', label: 'Cursive', preview: "'Dancing Script', cursive" },
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

export default function FirstLoadPrompt({ isInstallable, notifPermission, onInstall, onDismiss, onEnableNotif, splashMode = false, isAppReady = true, loadingText = null }) {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(DISMISSED_KEY) === 'true'; } catch { return false; }
  });
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [installDone, setInstallDone] = useState(isInStandaloneMode);
  const [notifDone, setNotifDone] = useState(() =>
    'Notification' in window && Notification.permission === 'granted'
  );
  const [a11yFont, setA11yFont] = useState(getAccessibilityFont);
  const [readingFont, setReadingFont] = useState(() => {
    try { return localStorage.getItem('kjb-verse-font-family') || 'serif'; } catch { return 'serif'; }
  });

  const handleFontSelect = (val) => {
    setReadingFont(val);
    try {
      localStorage.setItem('kjb-verse-font-family', val);
      localStorage.setItem('kjb-reader-font', val);
      document.documentElement.setAttribute('data-reader-font', val);
      window.dispatchEvent(new Event('storage'));
    } catch {}
    if (a11yFont !== 'default') {
      setA11yFont('default');
      setAccessibilityFont('default');
    }
  };

  const handleA11ySelect = (val) => {
    setA11yFont(val);
    setAccessibilityFont(val);
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

  useEffect(() => {
    if (splashMode && (!shouldShow || PROMO_SCREENSHOT_MODE)) {
      if (onDismiss) onDismiss();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [splashMode, shouldShow]);

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

  if (splashMode) {
    return (
      <div className="w-full pointer-events-auto">
        <div className="space-y-6 relative">
          {showInstall && (
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-sans text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] bg-primary text-primary-foreground border-2 border-primary"
              >
                {isIOS() ? <Share className="w-5 h-5" /> : isMobile() ? <Download className="w-5 h-5" /> : <MonitorSmartphone className="w-5 h-5" />}
                <span>{isMobile() ? 'Add to Home Screen' : 'Install App'}</span>
              </button>
              
              {(!isInstallable && showIOSHint) && (
                <div className="bg-secondary/40 border border-border rounded-xl p-3 text-center">
                  <p className="font-sans text-xs text-foreground leading-relaxed">
                    <strong>Install from browser menu:</strong><br />
                    {isIOS() ? <>Tap <strong>Share</strong>, then <strong>"Add to Home Screen"</strong></> : <>Use browser menu to install</>}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div className="rounded-xl bg-secondary/40 border border-border p-3">
              <div className="flex items-center gap-2 mb-3">
                <Type className="w-4 h-4 text-muted-foreground" />
                <span className="font-sans text-sm font-medium">Reading Font</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {READING_FONTS.map(font => {
                  const isActive = a11yFont === 'default' && readingFont === font.value;
                  return (
                    <button
                      key={font.value}
                      type="button"
                      onClick={() => handleFontSelect(font.value)}
                      className={`px-2 py-2.5 rounded-lg font-sans text-xs font-medium transition-all ${
                        isActive ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:border-accent'
                      }`}
                      style={font.preview ? { fontFamily: font.preview } : undefined}
                    >
                      {font.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl bg-secondary/40 border border-border p-3">
              <div className="flex items-center gap-2 mb-3">
                <Accessibility className="w-4 h-4 text-muted-foreground" />
                <span className="font-sans text-sm font-medium">Font Accessibility</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {A11Y_FONTS.map(font => (
                  <button
                    key={font.value}
                    type="button"
                    onClick={() => handleA11ySelect(font.value)}
                    className={`px-2 py-2.5 rounded-lg font-sans text-xs font-medium transition-all ${
                      a11yFont === font.value ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:border-accent'
                    }`}
                    style={font.preview ? { fontFamily: font.preview } : undefined}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-secondary/40 border border-border p-3">
              <div className="flex items-center gap-2 mb-3">
                <Palette className="w-4 h-4 text-muted-foreground" />
                <span className="font-sans text-sm font-medium">Theme Color</span>
              </div>
              <ThemeColorPicker compact />
            </div>

            {showNotif && (
              <button
                type="button"
                onClick={handleNotifClick}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-sans text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span>Enable Daily Reminders</span>
              </button>
            )}
          </div>

          <div className="pt-4 mt-2 border-t border-border">
            {!isAppReady ? (
               <div className="w-full py-3.5 rounded-xl bg-secondary/50 flex justify-center items-center gap-2.5 border border-border/30">
                 <div className="w-4 h-4 rounded-full border-2 border-muted-foreground border-t-transparent animate-spin"></div>
                 <span className="font-sans text-sm font-bold text-muted-foreground">{loadingText || "Loading..."}</span>
               </div>
            ) : (
              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-xl font-sans text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-md active:scale-[0.98]"
              >
                Continue to App
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[99998] bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
        onPointerDown={handleClose}
      >
        <div className="w-full max-w-sm pointer-events-auto">
          <div
            className="bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5 relative"
            onPointerDown={e => e.stopPropagation()}
          >
            <div className="flex flex-col items-center justify-center gap-1 mb-2">
              <button
                type="button"
                onPointerDown={handleClose}
                className="absolute top-4 right-4 shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary active:bg-secondary transition-colors cursor-pointer touch-manipulation"
                aria-label="Dismiss"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="font-serif text-xl font-bold text-foreground">Quick Setup</h2>
              <p className="font-sans text-sm text-muted-foreground text-center">Customize your reading experience</p>
            </div>

            {showInstall && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-sans text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] bg-primary text-primary-foreground border-2 border-primary"
                >
                  {isIOS() ? <Share className="w-5 h-5" /> : isMobile() ? <Download className="w-5 h-5" /> : <MonitorSmartphone className="w-5 h-5" />}
                  <span>{isMobile() ? 'Add to Home Screen' : 'Install App'}</span>
                </button>
                
                {(!isInstallable && showIOSHint) && (
                  <div className="bg-secondary/40 border border-border rounded-xl p-3 text-center">
                    <p className="font-sans text-xs text-foreground leading-relaxed">
                      <strong>Install from browser menu:</strong><br />
                      {isIOS() ? <>Tap <strong>Share</strong>, then <strong>"Add to Home Screen"</strong></> : <>Use browser menu to install</>}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <div className="rounded-xl bg-secondary/40 border border-border p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Type className="w-4 h-4 text-muted-foreground" />
                  <span className="font-sans text-sm font-medium">Reading Font</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {READING_FONTS.map(font => {
                    const isActive = a11yFont === 'default' && readingFont === font.value;
                    return (
                      <button
                        key={font.value}
                        type="button"
                        onClick={() => handleFontSelect(font.value)}
                        className={`px-2 py-2.5 rounded-lg font-sans text-xs font-medium transition-all ${
                          isActive ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:border-accent'
                        }`}
                        style={font.preview ? { fontFamily: font.preview } : undefined}
                      >
                        {font.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-xl bg-secondary/40 border border-border p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Accessibility className="w-4 h-4 text-muted-foreground" />
                  <span className="font-sans text-sm font-medium">Font Accessibility</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {A11Y_FONTS.map(font => (
                    <button
                      key={font.value}
                      type="button"
                      onClick={() => handleA11ySelect(font.value)}
                      className={`px-2 py-2.5 rounded-lg font-sans text-xs font-medium transition-all ${
                        a11yFont === font.value ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:border-accent'
                      }`}
                      style={font.preview ? { fontFamily: font.preview } : undefined}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-secondary/40 border border-border p-3">
                <div className="flex items-center gap-2 mb-3">
                  <Palette className="w-4 h-4 text-muted-foreground" />
                  <span className="font-sans text-sm font-medium">Theme Color</span>
                </div>
                <ThemeColorPicker compact />
              </div>

              {showNotif && (
                <button
                  type="button"
                  onClick={handleNotifClick}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 text-primary font-sans text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  <Bell className="w-4 h-4" />
                  <span>Enable Daily Reminders</span>
                </button>
              )}
            </div>
            
            <div className="pt-4 mt-2 border-t border-border">
              <button
                onClick={handleClose}
                className="w-full py-3.5 rounded-xl font-sans text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all shadow-md active:scale-[0.98]"
              >
                Close Setup
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}