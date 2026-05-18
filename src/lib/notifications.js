// Notification helpers — works as PWA on Android via SW showNotification

const NOTIF_KEY = 'kjb-notifications-enabled';
const NOTIF_TIME_KEY = 'kjb-notification-time'; // HH:MM
const NOTIF_LAST_KEY = 'kjb-notification-last'; // YYYY-MM-DD

export function getNotificationsEnabled() {
  return localStorage.getItem(NOTIF_KEY) === 'true';
}

export function getNotificationTime() {
  return localStorage.getItem(NOTIF_TIME_KEY) || '08:00';
}

export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch { return null; }
}

export function setNotificationTime(time) {
  localStorage.setItem(NOTIF_TIME_KEY, time);
}

export function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  const result = await Notification.requestPermission();
  if (result === 'granted') localStorage.setItem(NOTIF_KEY, 'true');
  return result;
}

export function disableNotifications() {
  localStorage.setItem(NOTIF_KEY, 'false');
}

// Show a notification immediately via the SW (works on Android)
export async function showLocalNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'daily-verse',
      renotify: true,
    });
  } catch {
    try { new Notification(title, { body }); } catch {}
  }
}

// Schedule via setTimeout (fires when app is open/backgrounded on Android PWA)
let _notifTimer = null;

export function scheduleDailyNotification(verse) {
  if (_notifTimer) { clearTimeout(_notifTimer); _notifTimer = null; }
  if (!getNotificationsEnabled()) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const [hh, mm] = getNotificationTime().split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hh, mm, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  const ms = target - now;

  _notifTimer = setTimeout(async () => {
    const last = localStorage.getItem(NOTIF_LAST_KEY);
    const today = todayString();
    if (last === today) return;
    localStorage.setItem(NOTIF_LAST_KEY, today);
    await showLocalNotification(
      'King James Bible — Daily Verse',
      `"${verse.text.slice(0, 120)}${verse.text.length > 120 ? '…' : ''}" — ${verse.ref}`
    );
    // Reschedule for tomorrow
    scheduleDailyNotification(verse);
  }, ms);
}

// Call once on app load to re-arm the scheduler
export function initNotifications(verse) {
  if (getNotificationsEnabled() && 'Notification' in window && Notification.permission === 'granted') {
    scheduleDailyNotification(verse);
  }
}