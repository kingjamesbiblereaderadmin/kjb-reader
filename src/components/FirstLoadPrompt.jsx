import React, { useState } from 'react';
import { Download, Bell, X, Share } from 'lucide-react';

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isInStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone;

export default function FirstLoadPrompt({ isInstallable, notifPermission, onInstall, onEnableNotif, onDismiss }) {
  const [showIOSHint, setShowIOSHint] = useState(false);

  const alreadyInstalled = isInStandaloneMode();
  // Show install: either native prompt available, or iOS where we show manual hint
  const showInstall = !alreadyInstalled && (isInstallable || isIOS());
  // Show notif: 'default' (never asked) OR re-show if denied so user knows to unblock in settings
  const showNotif = 'Notification' in window && notifPermission !== 'granted';

  if (!showInstall && !showNotif) return null;

  const handleInstallClick = () => {
    if (isInstallable) {
      onInstall();
    } else {
      // iOS — show manual instructions
      setShowIOSHint(h => !h);
    }
  };

  return (
    <div className="fixed bottom-16 sm:bottom-4 right-4 z-50 w-72 pointer-events-auto">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className="font-serif text-base font-semibold text-foreground leading-tight">Get the most from KJB Reader</p>
          <button
            onClick={onDismiss}
            className="shrink-0 p-1 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {showInstall && (
          <div>
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {isIOS() && !isInstallable ? <Share className="w-4 h-4 shrink-0" /> : <Download className="w-4 h-4 shrink-0" />}
              <span className="text-left">
                <span className="block font-semibold">Add to Home Screen</span>
                <span className="block text-xs opacity-80">Offline access, faster loading</span>
              </span>
            </button>
            {showIOSHint && (
              <p className="mt-2 font-sans text-xs text-muted-foreground leading-relaxed px-1">
                Tap the <strong>Share</strong> button <span className="inline-block">⎙</span> in Safari, then choose <strong>"Add to Home Screen"</strong>.
              </p>
            )}
          </div>
        )}

        {showNotif && (
          <button
            onClick={onEnableNotif}
            disabled={notifPermission === 'denied'}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-50"
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span className="text-left">
              <span className="block font-semibold">Daily Verse Notifications</span>
              <span className="block text-xs text-muted-foreground">
                {notifPermission === 'denied'
                  ? 'Blocked — enable in browser settings'
                  : 'A verse delivered to you each day'}
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}