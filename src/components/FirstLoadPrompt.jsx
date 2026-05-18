import React, { useState, useEffect } from 'react';
import { Download, Bell, X, Share, WifiOff, MonitorSmartphone } from 'lucide-react';
import { downloadBibleForOffline, isBibleCached } from '@/lib/bibleCache';

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const isMobile = () => /iphone|ipad|ipod|android/i.test(navigator.userAgent);
const isAndroid = () => /android/i.test(navigator.userAgent);
const isInStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone;

export default function FirstLoadPrompt({ isInstallable, notifPermission, onInstall, onDismiss, onDownloadOffline, downloaded: propDownloaded, onEnableNotif }) {
  const [showIOSHint, setShowIOSHint] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [downloaded, setDownloaded] = useState(propDownloaded || false);

  useEffect(() => {
    if (propDownloaded !== undefined) {
      setDownloaded(propDownloaded);
    } else {
      // Check if already cached on mount
      isBibleCached().then(cached => setDownloaded(cached));
    }
  }, [propDownloaded]);

  const alreadyInstalled = isInStandaloneMode();
  const isDesktop = !isMobile();
  // Show install: either native prompt available, iOS, or desktop PWA
  const showInstall = !alreadyInstalled && (isInstallable || isIOS() || isDesktop);
  // Always show notification option - works in browser and installed app/APK
  const showNotif = true;
  // Show offline download prompt if not already downloaded
  const showOffline = !downloaded;

  if (!showInstall && !showNotif && !showOffline) return null;

  const handleInstallClick = () => {
    if (isInstallable) {
      onInstall();
      onDismiss();
    } else if (isIOS()) {
      // iOS — show manual instructions
      setShowIOSHint(h => !h);
    }
    // Desktop: no action needed, browser handles PWA installation via browser menu
  };

  const handleDownloadOffline = async () => {
    setDownloading(true);
    try {
      await downloadBibleForOffline((progress) => {
        setDownloadProgress(progress);
      });
      setDownloaded(true);
      setDownloadProgress(null);
      if (onDownloadOffline) onDownloadOffline();
      onDismiss();
    } catch (err) {
      console.error('Failed to download offline data:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed bottom-16 sm:bottom-4 right-4 z-50 w-80 pointer-events-auto">
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

        {showOffline && (
          <div>
            <button
              onClick={handleDownloadOffline}
              disabled={downloading}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-accent text-accent-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {downloading ? (
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <WifiOff className="w-4 h-4 shrink-0" />
              )}
              <span className="text-left flex-1">
                <span className="block font-semibold">{downloading ? 'Downloading...' : 'Download for Offline'}</span>
                <span className="block text-xs opacity-80">
                  {downloading && downloadProgress ? `${Math.round(downloadProgress * 100)}% complete` : 'Read without internet'}
                </span>
              </span>
            </button>
          </div>
        )}

        {showInstall && (
          <div>
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {isIOS() && !isInstallable ? <Share className="w-4 h-4 shrink-0" /> : isDesktop ? <MonitorSmartphone className="w-4 h-4 shrink-0" /> : <Download className="w-4 h-4 shrink-0" />}
              <span className="text-left">
                <span className="block font-semibold">{isDesktop ? 'Install App' : 'Add to Home Screen'}</span>
                <span className="block text-xs opacity-80">{downloaded ? 'Includes offline Bible' : 'Offline access, faster loading'}</span>
              </span>
            </button>
            {showIOSHint && (
              <p className="mt-2 font-sans text-xs text-muted-foreground leading-relaxed px-1">
                Tap the <strong>Share</strong> button <span className="inline-block">⎙</span> in Safari, then choose <strong>"Add to Home Screen"</strong>.
              </p>
            )}
            {isDesktop && !isInstallable && (
              <p className="mt-2 font-sans text-xs text-muted-foreground leading-relaxed px-1">
                Click the <strong>install icon</strong> <span className="inline-block">⬇</span> in your browser's address bar to install the app.
              </p>
            )}
          </div>
        )}

        {showNotif && (
          <button
            onClick={onEnableNotif}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary font-sans text-sm font-medium hover:bg-primary/20 transition-colors text-left"
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
  );
}