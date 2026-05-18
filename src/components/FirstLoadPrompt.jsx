import React from 'react';
import { Download, Bell, X } from 'lucide-react';

export default function FirstLoadPrompt({ isInstallable, notifPermission, onInstall, onEnableNotif, onDismiss }) {
  const showInstall = !window.matchMedia('(display-mode: standalone)').matches && !window.navigator.standalone;
  const showNotif = notifPermission === 'default' && 'Notification' in window;

  if (!showInstall && !showNotif) return null;

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
          <button
            onClick={onInstall}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Download className="w-4 h-4 shrink-0" />
            <span className="text-left">
              <span className="block font-semibold">Add to Home Screen</span>
              <span className="block text-xs opacity-80">Offline access, faster loading</span>
            </span>
          </button>
        )}

        {showNotif && (
          <button
            onClick={onEnableNotif}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors"
          >
            <Bell className="w-4 h-4 shrink-0" />
            <span className="text-left">
              <span className="block font-semibold">Daily Verse Notifications</span>
              <span className="block text-xs text-muted-foreground">A verse delivered to you each day</span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}