// Web Push / local notification helpers

const NOTIF_KEY = 'kjb-notifications-enabled';
const NOTIF_TIME_KEY = 'kjb-notification-time'; // HH:MM string
const NOTIF_LAST_KEY = 'kjb-notification-last'; // date string YYYY-MM-DD

export function getNotificationsEnabled() {
  return localStorage.getItem(NOTIF_KEY) === 'true';
}

export function getNotificationTime() {
  return localStorage.getItem(NOTIF_TIME_KEY) || '08:00';
}

export function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Register the service worker
export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js');
    return reg;
  } catch {
    return null;
  }
}

// Request notification permission and save preference
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  const result = await Notification.requestPermission();
  if (result === 'granted') {
    localStorage.setItem(NOTIF_KEY, 'true');
  }
  return result;
}

export function disableNotifications() {
  localStorage.setItem(NOTIF_KEY, 'false');
}

export function setNotificationTime(time) {
  localStorage.setItem(NOTIF_TIME_KEY, time);
}

// Show a local notification immediately (no push server needed)
export async function showLocalNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(title, { body, icon: '/icon-192.png', tag: 'daily-verse', renotify: true });
    } else {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
  } catch {
    // Fallback: direct Notification API
    try { new Notification(title, { body }); } catch {}
  }
}

// Schedule a daily notification using setTimeout (fires while tab is open)
// For background delivery, a push server would be needed — this covers the common PWA case
export function scheduleDailyNotification(verse) {
  if (!getNotificationsEnabled()) return;
  if (Notification.permission !== 'granted') return;

  const [hh, mm] = getNotificationTime().split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hh, mm, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const ms = target - now;
  setTimeout(() => {
    const last = localStorage.getItem(NOTIF_LAST_KEY);
    const today = todayString();
    if (last === today) return; // already sent today
    localStorage.setItem(NOTIF_LAST_KEY, today);
    showLocalNotification(
      'King James Bible — Daily Verse',
      `"${verse.text.slice(0, 100)}${verse.text.length > 100 ? '…' : ''}" — ${verse.ref}`
    );
  }, ms);
}