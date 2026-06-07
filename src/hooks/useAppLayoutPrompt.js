import { useState } from 'react';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { requestNotificationPermission, scheduleDailyNotification, getNotificationsEnabled } from '@/lib/notifications';

export function useAppLayoutPrompt() {
  const installPromptResult = useInstallPrompt();
  const { isInstallable, isInstalled, promptInstall, dismiss } = installPromptResult;
  
  const [notifPermission, setNotifPermission] = useState(() => {
    if (!('serviceWorker' in navigator)) return 'unsupported';
    if (!('Notification' in window)) return 'supported';
    return Notification.permission;
  });
  const [notifEnabled, setNotifEnabled] = useState(() => getNotificationsEnabled());

  const handleInstall = () => {
    return promptInstall();
  };

  const handleEnableNotif = async () => {
    try {
      const result = await requestNotificationPermission();
      setNotifPermission(result);
      if (result === 'granted' || result === 'unsupported') {
        scheduleDailyNotification();
        setNotifEnabled(true);
        window.dispatchEvent(new Event('storage'));
      } else if (result === 'denied') {
        alert('Notifications are blocked. Please allow notifications in your browser/app settings for this site.');
      }
    } catch (err) {
      console.error('Notification permission error:', err);
    }
  };

  const handleDismiss = () => {
    dismiss();
    try { localStorage.setItem('kjb-prompt-dismissed', 'true'); } catch {}
  };

  return { isInstallable, notifPermission, handleInstall, handleEnableNotif, handleDismiss };
}