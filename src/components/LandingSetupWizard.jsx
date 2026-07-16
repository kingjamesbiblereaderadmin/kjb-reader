import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import {
  Bell, Share, MonitorSmartphone, Download, Accessibility, Palette,
  Type, Moon, Sun, Monitor, ChevronLeft, ChevronRight, Check, Star,
  Image as ImageIcon, Upload, Trash2, Crop,
} from 'lucide-react';
import { toast } from 'sonner';
import { getAccessibilityFont, setAccessibilityFont } from '@/lib/accessibilityFont';
import { useTheme } from '@/lib/themeContext';
import { detectIncognito } from '@/lib/incognito';
import {
  getNotificationsEnabled, requestNotificationPermission,
  scheduleDailyNotification, showLocalNotification, cleanForNotification,
} from '@/lib/notifications';
import { getDailyVerse } from '@/lib/dailyVerse';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { shrinkImageUnderLimit } from '@/lib/imageCompress';
import ThemeColorPicker from '@/components/bible/ThemeColorPicker';
import ImageCropper from '@/components/bible/ImageCropper';

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
  return /edg/i.test(ua) && /iphone|ipad|ipod|android/i.test(ua);
};
const isEdgeDesktop = () => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /edg/i.test(ua) && !/iphone|ipad|ipod|android/i.test(ua);
};

const isBookmarkBrowser = () => {
  const ua = navigator.userAgent;
  const isFirefox = /firefox/i.test(ua);
  const isMac = /Macintosh|Mac OS X/i.test(ua);
  const isSafari = /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
  const mobile = /iphone|ipad|ipod|android/i.test(ua);
  return !mobile && (isFirefox || (isMac && isSafari));
};

const isStandalonePWA = () => {
  if (typeof window === 'undefined') return false;
  try { if (window.self !== window.top) return false; } catch { return false; }
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  if (window.matchMedia('(display-mode: minimal-ui)').matches) return true;
  if (window.matchMedia('(display-mode: window-controls-overlay)').matches) return true;
  if (window.navigator.standalone === true) return true;
  return false;
};

const inIframe = () => {
  try { return window.self !== window.top; } catch { return true; }
};

export default function LandingSetupWizard() {
  const [step, setStep] = useState(0);
  const [isIncognito, setIsIncognito] = useState(false);
  const [incognitoChecked, setIncognitoChecked] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installDone, setInstallDone] = useState(false);
  const [promptCancelled, setPromptCancelled] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [notifDone, setNotifDone] = useState(false);

  const { mode, setMode } = useTheme();
  const [a11yFont, setA11yFont] = useState(getAccessibilityFont);
  const [readerFontFamily, setReaderFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-reader-font-family') || 'serif'; } catch { return 'serif'; }
  });
  const [verseFontFamily, setVerseFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-verse-font-family') || 'serif'; } catch { return 'serif'; }
  });
  const [customBg, setCustomBg] = useState(() => {
    try { return localStorage.getItem('kjb-daily-verse-bg') || ''; } catch { return ''; }
  });
  const [cropImage, setCropImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const bgFileInputRef = useRef(null);
  const { promptInstall } = useInstallPrompt();

  // Per-step completion — only true when the user actually interacted.
  const [completed, setCompleted] = useState({
    install: false,
    theme: false,
    fonts: false,
    background: false,
    a11y: false,
    notif: false,
  });

  const markDone = (id) => setCompleted(prev => prev[id] ? prev : { ...prev, [id]: true });

  useEffect(() => {
    detectIncognito().then((v) => { setIsIncognito(v); setIncognitoChecked(true); });
  }, []);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone = isStandalonePWA();
      setIsStandalone(standalone);
      if (standalone) { setInstallDone(true); markDone('install'); }
    };
    checkStandalone();
    window.addEventListener('focus', checkStandalone);
    return () => window.removeEventListener('focus', checkStandalone);
  }, []);

  useEffect(() => {
    const checkNotif = () => {
      try {
        const enabled = localStorage.getItem('kjb-notifications-enabled') === 'true';
        const granted = 'Notification' in window && Notification.permission === 'granted';
        const done = enabled && granted;
        setNotifDone(done);
        if (done) markDone('notif');
      } catch {}
    };
    checkNotif();
  }, []);

  // If a custom background is already set (e.g. from cloud sync), mark it done.
  useEffect(() => {
    if (customBg) markDone('background');
  }, [customBg]);

  const actuallyInstalled = isStandalone || installDone;
  const showInstall = incognitoChecked && !isIncognito && !actuallyInstalled;

  const pickReaderFont = (value) => {
    try { localStorage.setItem('kjb-reader-font-family', value); } catch {}
    setReaderFontFamily(value);
    if (a11yFont !== 'default') { setA11yFont('default'); setAccessibilityFont('default'); }
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('kjb-fonts-changed'));
    markDone('fonts');
  };

  const pickVerseFont = (value) => {
    try { localStorage.setItem('kjb-verse-font-family', value); } catch {}
    setVerseFontFamily(value);
    if (a11yFont !== 'default') { setA11yFont('default'); setAccessibilityFont('default'); }
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('kjb-fonts-changed'));
    markDone('fonts');
  };

  const handleInstallClick = async () => {
    try { window.kjbPromptedThisSession = true; } catch {}
    try {
      const accepted = await promptInstall();
      if (accepted) { setInstallDone(true); markDone('install'); return; }
      setPromptCancelled(true);
      setShowManualGuide(true);
    } catch {
      setPromptCancelled(true);
      setShowManualGuide(true);
    }
  };

  const handleNotifClick = async () => {
    if (!('Notification' in window)) {
      alert('Notifications are not supported in this browser.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        localStorage.setItem('kjb-notifications-enabled', 'true');
        window.kjbNotifEnabledThisSession = true;
        setNotifDone(true);
        markDone('notif');
        await requestNotificationPermission();
        scheduleDailyNotification();
        const v = getDailyVerse();
        showLocalNotification('KJB — Reminders On', `"${cleanForNotification(v.text)}" — ${v.ref} (KJB)`, null, '/');
      }
    } catch (err) {
      console.error('Notif permission error:', err);
    }
  };

  const handleBgUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const base64 = await shrinkImageUnderLimit(file);
      setCropImage(base64);
    } catch (err) {
      alert(err.message || 'Failed to process image');
    } finally {
      e.target.value = '';
      setUploading(false);
    }
  };

  const STEPS = [
    { id: 'install', label: 'Install', icon: Download },
    { id: 'theme', label: 'Theme', icon: Palette },
    { id: 'fonts', label: 'Fonts', icon: Type },
    { id: 'background', label: 'Background', icon: ImageIcon },
    { id: 'a11y', label: 'Accessibility', icon: Accessibility },
    { id: 'notif', label: 'Notifications', icon: Bell },
  ];

  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) return;
    setStep(s => s + 1);
  };
  const handleBack = () => {
    if (isFirst) return;
    setStep(s => s - 1);
  };

  return (
    <div className="bg-card/70 backdrop-blur-xl border border-border/60 rounded-2xl p-6 sm:p-7 shadow-lg shadow-black/[0.03]">
      {/* Step indicator — compact circles, tick only when actually completed */}
      <div className="flex items-center justify-center gap-1 mb-6">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = completed[s.id];
          return (
            <React.Fragment key={s.id}>
              <button
                type="button"
                onClick={() => setStep(i)}
                className={`flex flex-col items-center gap-0.5 transition-all ${active ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  done ? 'bg-primary border-primary text-primary-foreground'
                  : active ? 'bg-primary/10 border-primary text-primary'
                  : 'bg-secondary border-border text-muted-foreground'
                }`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className={`font-sans text-[9px] ${active ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 w-3 sm:w-6 rounded-full transition-all ${completed[s.id] ? 'bg-primary' : 'bg-border'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step content */}
      <div className="min-h-[160px] flex flex-col justify-center">
        {/* Step 0: Install */}
        {step === 0 && (
          <div className="text-center">
            <h3 className="font-serif text-lg font-bold text-foreground mb-1">Install the App</h3>
            <p className="font-sans text-xs text-muted-foreground mb-4">Get offline access and faster loading</p>

            {isIncognito && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-900/40 p-3 mb-3 text-left">
                <p className="font-sans text-xs text-amber-700 dark:text-amber-400 font-medium leading-snug">
                  You're in a private window. App install and notifications won't work, and settings will be erased when you close this window.
                </p>
              </div>
            )}

            {inIframe() && (
              <div className="bg-secondary/40 border border-border rounded-xl p-3 mb-3 text-left">
                <p className="font-sans text-xs text-blue-600 dark:text-blue-400 font-medium">
                  You're viewing this inside an embed preview. Open the app in a new tab to install it.
                </p>
              </div>
            )}

            {actuallyInstalled ? (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 p-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-sans text-xs text-emerald-800 dark:text-emerald-300 font-bold">App installed!</p>
                </div>
              </div>
            ) : showInstall && isBookmarkBrowser() ? (
              <button
                type="button"
                onClick={() => {
                  const isMac = /Macintosh|Mac OS X/i.test(navigator.userAgent);
                  toast.info('Add to Favourites / Bookmarks', {
                    description: isMac ? 'Press ⌘ D to bookmark this app.' : 'Press Ctrl + D to bookmark this app.',
                  });
                  markDone('install');
                }}
                className="w-full flex items-center gap-2 px-4 py-3 rounded-xl font-sans text-sm font-medium bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Star className="w-4 h-4" /> Add to Favourites
              </button>
            ) : showInstall && !inIframe() ? (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full flex items-center gap-2 px-4 py-3 rounded-xl font-sans text-sm font-medium bg-primary text-primary-foreground hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  {isIOS() ? <Share className="w-4 h-4" /> : isMobile() ? <Download className="w-4 h-4" /> : <MonitorSmartphone className="w-4 h-4" />}
                  <span className="text-left">
                    <span className="block font-semibold">{isMobile() ? 'Add to Home Screen' : 'Install App'}</span>
                    <span className="block text-[10px] opacity-80">Offline access, faster loading</span>
                  </span>
                </button>
                {showManualGuide && !actuallyInstalled && (
                  <div className="bg-secondary/40 border border-border rounded-xl p-3 text-left">
                    <p className="font-sans text-xs text-foreground leading-relaxed">
                      <strong>Manual Installation:</strong><br />
                      {isIOS() ? (
                        <>Tap the <strong>Share</strong> icon, then select <strong>"Add to Home Screen"</strong>.</>
                      ) : isEdgeMobile() ? (
                        <>Tap <strong>Menu (⋯)</strong> → <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</>
                      ) : isSamsung() ? (
                        <>Tap <strong>Menu (≡)</strong> → <strong>"Add page to"</strong> → <strong>"Home screen"</strong>.</>
                      ) : isMobile() ? (
                        <>Open browser <strong>Menu (⋮ or ⋯)</strong> → <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</>
                      ) : isEdgeDesktop() ? (
                        <>Click <strong>Apps/Install</strong> in the address bar, or <strong>Menu (⋯) → Apps → Install this site as an app</strong>.</>
                      ) : (
                        <>If an <strong>Install</strong> icon appears in your address bar, click it. Otherwise check your browser menu.</>
                      )}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="font-sans text-xs text-muted-foreground">You can install the app later from Settings.</p>
            )}
          </div>
        )}

        {/* Step 1: Theme (mode + color) */}
        {step === 1 && (
          <div className="text-center">
            <h3 className="font-serif text-lg font-bold text-foreground mb-1">Theme & Color</h3>
            <p className="font-sans text-xs text-muted-foreground mb-4">Choose light/dark and your accent color</p>
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto mb-5">
              {[
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
                { id: 'auto', label: 'Auto', icon: Monitor },
              ].map(opt => {
                const Icon = opt.icon;
                const isActive = mode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => { setMode(opt.id); markDone('theme'); }}
                    className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border-2 font-sans text-xs font-medium transition-all ${
                      isActive ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                      : 'bg-card text-foreground border-border hover:border-accent'
                    }`}
                  >
                    <Icon className="w-5 h-5" /> {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="max-w-sm mx-auto" onClick={() => markDone('theme')}>
              <ThemeColorPicker compact />
            </div>
          </div>
        )}

        {/* Step 2: Fonts (reading + daily verse) */}
        {step === 2 && (
          <div className="text-center">
            <h3 className="font-serif text-lg font-bold text-foreground mb-1">Fonts</h3>
            <p className="font-sans text-xs text-muted-foreground mb-4">Pick fonts for reading and the daily verse</p>

            <p className="font-sans text-xs font-medium text-foreground mb-2">Reading Font</p>
            <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto mb-5">
              {VERSE_FONTS.map(font => {
                const isActive = a11yFont !== 'default' ? false : readerFontFamily === font.value;
                const isDisabled = a11yFont !== 'default';
                return (
                  <button
                    key={font.value}
                    disabled={isDisabled}
                    type="button"
                    onClick={() => pickReaderFont(font.value)}
                    className={`px-2 py-3 rounded-xl border-2 font-sans text-xs font-medium transition-all ${
                      isActive ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                      : 'bg-card text-foreground border-border hover:border-accent'
                    } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </button>
                );
              })}
            </div>

            <p className="font-sans text-xs font-medium text-foreground mb-2">Daily Verse Font</p>
            <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
              {VERSE_FONTS.map(font => {
                const isActive = a11yFont !== 'default' ? false : verseFontFamily === font.value;
                const isDisabled = a11yFont !== 'default';
                return (
                  <button
                    key={font.value}
                    disabled={isDisabled}
                    type="button"
                    onClick={() => pickVerseFont(font.value)}
                    className={`px-2 py-3 rounded-xl border-2 font-sans text-xs font-medium transition-all ${
                      isActive ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                      : 'bg-card text-foreground border-border hover:border-accent'
                    } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
                    style={{ fontFamily: font.value }}
                  >
                    {font.label}
                  </button>
                );
              })}
            </div>
            {a11yFont !== 'default' && (
              <p className="font-sans text-[10px] text-muted-foreground mt-2">Disabled while an accessibility font is active</p>
            )}
          </div>
        )}

        {/* Step 3: Custom Background */}
        {step === 3 && (
          <div className="text-center">
            <h3 className="font-serif text-lg font-bold text-foreground mb-1">Daily Verse Background</h3>
            <p className="font-sans text-xs text-muted-foreground mb-4">Upload a custom image for the daily verse card (optional)</p>

            {customBg ? (
              <div className="space-y-2">
                <div className="w-full max-w-sm mx-auto rounded-xl bg-cover bg-center border border-border shadow-lg" style={{ backgroundImage: `url(${customBg})`, minHeight: '160px', backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div className="flex gap-2 justify-center">
                  <button
                    type="button"
                    onClick={() => bgFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-transparent border border-border text-foreground font-sans text-xs font-medium hover:border-accent transition-all"
                  >
                    <Crop className="w-3.5 h-3.5" /> Replace
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomBg('');
                      localStorage.removeItem('kjb-daily-verse-bg');
                      window.dispatchEvent(new Event('storage'));
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-transparent border border-destructive text-destructive font-sans text-xs font-medium hover:bg-destructive/10 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </div>
            ) : (
              <>
                <input
                  ref={bgFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBgUpload}
                  disabled={uploading}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => bgFileInputRef.current?.click()}
                  disabled={uploading}
                  className="mx-auto flex flex-col items-center justify-center w-full max-w-sm px-4 py-8 border-2 border-dashed border-border rounded-xl bg-secondary/50 hover:bg-secondary/70 transition-colors cursor-pointer"
                >
                  {uploading ? (
                    <p className="font-sans text-xs text-muted-foreground">Processing...</p>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                      <p className="font-sans text-xs text-muted-foreground">Click to upload image</p>
                      <p className="font-sans text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}

        {/* Step 4: Accessibility Font */}
        {step === 4 && (
          <div className="text-center">
            <h3 className="font-serif text-lg font-bold text-foreground mb-1">Accessibility Font</h3>
            <p className="font-sans text-xs text-muted-foreground mb-4">For readers with dyslexia or low vision</p>
            <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
              {A11Y_FONTS.map(font => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => { setA11yFont(font.value); setAccessibilityFont(font.value); markDone('a11y'); }}
                  className={`px-2 py-3 rounded-xl border-2 font-sans text-xs font-bold transition-all flex flex-col items-center justify-center ${
                    a11yFont === font.value ? 'bg-primary text-primary-foreground border-primary shadow-md scale-[1.02]'
                    : 'bg-card text-foreground border-border hover:border-accent'
                  }`}
                  style={font.preview ? { fontFamily: font.preview } : undefined}
                >
                  {font.label}
                  {font.value === 'dyslexic' && <span className="text-[8px] opacity-75 font-normal">Dyslexia</span>}
                  {font.value === 'hyperlegible' && <span className="text-[8px] opacity-75 font-normal">Low Vision</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 5: Notifications */}
        {step === 5 && (
          <div className="text-center">
            <h3 className="font-serif text-lg font-bold text-foreground mb-1">Daily Verse Notifications</h3>
            <p className="font-sans text-xs text-muted-foreground mb-2">See the verse of the day when you open the app on a new day</p>
            <p className="font-sans text-[11px] text-muted-foreground/80 mb-4 max-w-xs mx-auto leading-relaxed">
              When you open KJB Reader for the first time each day, today's verse appears as a notification. You can also set a daily reminder time in Settings.
            </p>
            {!isIncognito ? (
              notifDone ? (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/40 p-3 inline-flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="font-sans text-xs text-emerald-800 dark:text-emerald-300 font-bold">Notifications enabled</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleNotifClick}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-sans text-sm font-medium bg-primary/10 border-2 border-primary/20 text-primary hover:bg-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Bell className="w-4 h-4" /> Enable Notifications
                </button>
              )
            ) : (
              <p className="font-sans text-xs text-muted-foreground">Not available in private browsing</p>
            )}
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-border/60">
        <button
          type="button"
          onClick={handleBack}
          disabled={isFirst}
          className={`inline-flex items-center gap-1 px-4 py-2.5 rounded-xl font-sans text-sm font-medium transition-all ${
            isFirst ? 'opacity-0 pointer-events-none' : 'bg-secondary text-foreground hover:bg-accent/20'
          }`}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        {isLast ? (
          <Link
            to="/"
            onClick={() => { try { localStorage.setItem('kjb-has-visited-app', 'true'); } catch {} }}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Enter KJB Reader <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-1 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Crop modal — portaled so it's not trapped in the card's stacking context */}
      {cropImage && createPortal(
        <ImageCropper
          image={cropImage}
          onCrop={(croppedDataUrl) => {
            try {
              localStorage.setItem('kjb-daily-verse-bg', croppedDataUrl);
              setCustomBg(croppedDataUrl);
              markDone('background');
              window.dispatchEvent(new Event('storage'));
            } catch (err) {
              alert('Storage full! Please try a smaller image.');
              console.error('localStorage quota exceeded:', err);
            }
            setCropImage(null);
          }}
          onCancel={() => { setCropImage(null); }}
        />,
        document.body
      )}
    </div>
  );
}