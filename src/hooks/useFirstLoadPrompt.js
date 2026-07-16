import { useState, useEffect } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { requestNotificationPermission, scheduleDailyNotification, getNotificationsEnabled } from '@/lib/notifications';

export function useFirstLoadPrompt(isPWAInstalled = false) {
  const installPromptResult = useInstallPrompt();
  const { isInstallable, isInstalled, promptInstall, dismiss } = installPromptResult;

  const [notifPermission, setNotifPermission] = useState(() => {
    if (!('serviceWorker' in navigator)) return 'unsupported';
    if (!('Notification' in window)) return 'supported';
    return Notification.permission;
  });

  useEffect(() => {
    const checkNotif = () => {
      if (!('Notification' in window)) return;
      setNotifPermission(Notification.permission);
    };
    checkNotif();
    window.addEventListener('storage', checkNotif);
    window.addEventListener('focus', checkNotif);
    document.addEventListener('visibilitychange', checkNotif);
    window.addEventListener('kjb-notif-changed', checkNotif);
    return () => {
      window.removeEventListener('storage', checkNotif);
      window.removeEventListener('focus', checkNotif);
      window.removeEventListener('kjb-notif-changed', checkNotif);
      document.removeEventListener('visibilitychange', checkNotif);
    };
  }, []);

  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const notifGranted = 'Notification' in window && Notification.permission === 'granted';
    const dismissed = localStorage.getItem('kjb-prompt-dismissed') === 'true' || localStorage.getItem('kjb-install-dismissed') === 'true';

    const triggerPrompt = () => {
      if (isPWAInstalled && !notifGranted) {
        setShowPrompt(true);
      } else if (!isPWAInstalled && !dismissed) {
        setShowPrompt(true);
      }
    };

    if (window.kjbSplashDone) {
      triggerPrompt();
    } else {
      const onSplashDone = () => {
        window.removeEventListener('kjb-splash-done', onSplashDone);
        triggerPrompt();
      };
      window.addEventListener('kjb-splash-done', onSplashDone);
      return () => window.removeEventListener('kjb-splash-done', onSplashDone);
    }
  }, [isPWAInstalled, notifPermission]);

  const handleInstall = () => promptInstall();

  const handleEnableNotif = async () => {
    try {
      const result = await requestNotificationPermission();
      const actualPermission = 'Notification' in window ? Notification.permission : 'unsupported';
      setNotifPermission(actualPermission);

      if (actualPermission === 'granted') {
        localStorage.setItem('kjb-notifications-enabled', 'true');
        scheduleDailyNotification();
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('kjb-notif-changed', { detail: { enabled: true } }));
        return 'granted';
      } else if (result === 'denied' || actualPermission === 'denied') {
        alert('Notifications are blocked. Please allow notifications in your browser/app settings for this site.');
      }
    } catch (err) {
      console.error('Notification permission error:', err);
    }
    return 'denied';
  };

  const handleDismiss = () => {
    dismiss();
    try { localStorage.setItem('kjb-prompt-dismissed', 'true'); } catch {}
  };

  const handleDismissPrompt = () => {
    setShowPrompt(false);
    handleDismiss();
  };

  return {
    showPrompt,
    isInstallable,
    isInstalled,
    notifPermission,
    handleInstall,
    handleEnableNotif,
    handleDismissPrompt,
  };
}