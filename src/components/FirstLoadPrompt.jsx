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
  const [showAndroidHint, setShowAndroidHint] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(null);
  const [downloaded, setDownloaded] = useState(propDownloaded || false);
  const [installDone, setInstallDone] = useState(() => {
    // Check if already installed on mount
    return window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone;
  });
  const [notifDone, setNotifDone] = useState(() => {
    // Check if notifications already enabled
    return 'Notification' in window && Notification.permission === 'granted';
  });

  useEffect(() => {
    if (propDownloaded !== undefined) {
      setDownloaded(propDownloaded);
    } else {
      // Check if already cached on mount
      isBibleCached().then(cached => setDownloaded(cached));
    }
  }, [propDownloaded]);

  // Sync downloaded state when prop changes
  useEffect(() => {
    if (propDownloaded === true) {
      setDownloaded(true);
    }
  }, [propDownloaded]);

  const alreadyInstalled = isInStandaloneMode();
  const isDesktop = !isMobile();
  // Show install: either native prompt available, iOS, Android, or desktop PWA
  // Hide once installed or user completed install action
  const showInstall = !alreadyInstalled && !installDone && (isInstallable || isIOS() || isAndroid() || isDesktop);
  // Show notification option only if not already granted
  const showNotif = !notifDone;
  // Show offline download prompt if not already downloaded
  const showOffline = !downloaded;

  // Only dismiss when all visible actions are complete
  const allDone = (downloaded || !showOffline) && (installDone || !showInstall) && (notifDone || !showNotif);
  if (allDone) return null;
  
  // Don't render the prompt at all if nothing to show
  if (!showInstall && !showOffline && !showNotif) return null;

  const handleInstallClick = async () => {
    console.log('[FirstLoadPrompt] handleInstallClick called');
    // For Android Chrome, always show the install prompt
    if (isAndroid()) {
      const accepted = await onInstall();
      console.log('[FirstLoadPrompt] android install accepted:', accepted);
      if (accepted) {
        setInstallDone(true);
      }
      return;
    }
    // For iOS or desktop
    if (isInstallable) {
      const accepted = await onInstall();
      console.log('[FirstLoadPrompt] install accepted:', accepted);
      if (accepted) {
        setInstallDone(true);
      }
    } else if (isIOS()) {
      // iOS — show manual instructions (toggle hint)
      setShowIOSHint(h => !h);
    } else if (isDesktop) {
      // Desktop PWA - try to trigger install
      const accepted = await onInstall();
      console.log('[FirstLoadPrompt] desktop install accepted:', accepted);
      if (accepted) {
        setInstallDone(true);
      }
    }
  };

  const handleNotifClick = async () => {
    console.log('[FirstLoadPrompt] handleNotifClick called');
    if (onEnableNotif) {
      try {
        await onEnableNotif();
        setNotifDone(true);
      } catch (err) {
        console.error('Notification setup failed:', err);
      }
    }
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
      // Dispatch storage event to sync Settings page and FirstLoadPrompt
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      console.error('Failed to download offline data:', err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      {/* Backdrop - tap outside to dismiss */}
      <div 
        className="fixed inset-0 z-40 bg-background/20 backdrop-blur-sm"
        onClick={onDismiss}
        onTouchEnd={(e) => { e.preventDefault(); onDismiss(); }}
      />
      <div className="fixed bottom-16 sm:bottom-4 right-4 z-50 w-80 pointer-events-auto">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <p className="font-serif text-base font-semibold text-foreground leading-tight">Get the most from KJB Reader</p>
            <button
              onClick={onDismiss}
              onTouchEnd={(e) => { e.preventDefault(); onDismiss(); }}
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
              onTouchEnd={(e) => { e.preventDefault(); if (!downloading) handleDownloadOffline(); }}
              disabled={downloading}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-accent text-accent-foreground font-sans text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-50 touch-manipulation"
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
              onTouchEnd={(e) => { e.preventDefault(); handleInstallClick(); }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 active:opacity-80 transition-opacity touch-manipulation"
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
            {!isIOS() && !isInstallable && (
              <p className="mt-2 font-sans text-xs text-muted-foreground leading-relaxed px-1">
                <strong>Tip:</strong> If the install prompt didn't appear, use your browser menu → <strong>"Install app"</strong> or <strong>"Add to Home Screen"</strong>.
              </p>
            )}
          </div>
        )}

        {showNotif && (
          <button
            onClick={handleNotifClick}
            onTouchEnd={(e) => { e.preventDefault(); handleNotifClick(); }}
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