// Notification helpers for KJB PWA
// Strategy: store next-fire timestamp, check on page load/focus + SW periodic sync

const NOTIF_KEY = 'kjb-notifications-enabled';
const NOTIF_TIME_KEY = 'kjb-notification-time'; // HH:MM
const NOTIF_LAST_KEY = 'kjb-notification-last'; // YYYY-MM-DD
const NOTIF_NEXT_KEY = 'kjb-notification-next'; // Unix ms timestamp

// Reading reminder keys
const READING_REMINDER_KEY = 'kjb-reading-reminder-enabled';
const READING_REMINDER_TIME_KEY = 'kjb-reading-reminder-time'; // HH:MM
const READING_REMINDER_LAST_KEY = 'kjb-reading-reminder-last'; // YYYY-MM-DD
const READING_REMINDER_NEXT_KEY = 'kjb-reading-reminder-next'; // Unix ms timestamp

export function getNotificationsEnabled() {
  return localStorage.getItem(NOTIF_KEY) === 'true';
}

export function getNotificationTime() {
  return localStorage.getItem(NOTIF_TIME_KEY) || '08:00';
}

export function setNotificationTime(time) {
  localStorage.setItem(NOTIF_TIME_KEY, time);
}

export async function registerSW() {
  if (!('serviceWorker' in navigator)) return null;
  try {
    return await navigator.serviceWorker.register('/sw.js');
  } catch { return null; }
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
  localStorage.removeItem(NOTIF_NEXT_KEY);
}

// Reading reminder functions
export function getReadingReminderEnabled() {
  return localStorage.getItem(READING_REMINDER_KEY) === 'true';
}

export function getReadingReminderTime() {
  return localStorage.getItem(READING_REMINDER_TIME_KEY) || '20:00';
}

export function setReadingReminderTime(time) {
  localStorage.setItem(READING_REMINDER_TIME_KEY, time);
}

export function enableReadingReminder() {
  localStorage.setItem(READING_REMINDER_KEY, 'true');
}

export function disableReadingReminder() {
  localStorage.setItem(READING_REMINDER_KEY, 'false');
  localStorage.removeItem(READING_REMINDER_NEXT_KEY);
}

// Compute the next fire time for reading reminder
function getNextReadingReminderFireDate() {
  const [hh, mm] = getReadingReminderTime().split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hh, mm, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target;
}

// Save next reading reminder fire timestamp
async function saveNextReadingReminderFireTime() {
  const t = getNextReadingReminderFireDate();
  localStorage.setItem(READING_REMINDER_NEXT_KEY, String(t.getTime()));
}

// Reading reminder timer
let _readingReminderTimer = null;

function armReadingReminderTimer() {
  if (_readingReminderTimer) { clearTimeout(_readingReminderTimer); _readingReminderTimer = null; }
  const ms = getNextReadingReminderFireDate() - Date.now();
  _readingReminderTimer = setTimeout(async () => {
    const today = todayString();
    if (localStorage.getItem(READING_REMINDER_LAST_KEY) === today) {
      saveNextReadingReminderFireTime();
      armReadingReminderTimer();
      return;
    }
    localStorage.setItem(READING_REMINDER_LAST_KEY, today);
    await showLocalNotification(
      'KJB Reader — Daily Reading Reminder',
      'Time to read your daily chapter! Open the app to continue your reading journey.'
    );
    saveNextReadingReminderFireTime();
    armReadingReminderTimer();
  }, ms);
}

export function scheduleReadingReminder() {
  if (!getReadingReminderEnabled()) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  saveNextReadingReminderFireTime();
  armReadingReminderTimer();
}

// Check if reading reminder is overdue
function checkOverdueReadingReminder() {
  if (!getReadingReminderEnabled()) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const nextTs = parseInt(localStorage.getItem(READING_REMINDER_NEXT_KEY) || '0', 10);
  if (!nextTs) return;
  const today = todayString();
  if (Date.now() >= nextTs && localStorage.getItem(READING_REMINDER_LAST_KEY) !== today) {
    localStorage.setItem(READING_REMINDER_LAST_KEY, today);
    showLocalNotification(
      'KJB Reader — Daily Reading Reminder',
      'Time to read your daily chapter! Open the app to continue your reading journey.'
    );
    saveNextReadingReminderFireTime();
  }
}

export function initReadingReminder() {
  if (!getReadingReminderEnabled()) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  checkOverdueReadingReminder();
  scheduleReadingReminder();

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkOverdueReadingReminder();
    }
  }, { once: false });
}

// Compute the next fire time (today or tomorrow) as a Date
function getNextFireDate() {
  const [hh, mm] = getNotificationTime().split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(hh, mm, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);
  return target;
}

// Save next fire timestamp to localStorage AND SW cache so periodicsync can read it
async function saveNextFireTime(verse) {
  const t = getNextFireDate();
  localStorage.setItem(NOTIF_NEXT_KEY, String(t.getTime()));
  // Write config to SW-accessible cache for background periodicsync
  try {
    const cache = await caches.open('kjb-notif-config');
    const config = {
      nextTs: t.getTime(),
      lastDate: localStorage.getItem(NOTIF_LAST_KEY) || '',
      verseText: verse ? verse.text.slice(0, 120) + (verse.text.length > 120 ? '…' : '') : '',
      verseRef: verse ? verse.ref : '',
    };
    await cache.put('/notif-config', new Response(JSON.stringify(config), {
      headers: { 'Content-Type': 'application/json' }
    }));
  } catch {}
}

// Show a notification via SW (required on Android PWA)
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

// In-page timer (fires while app is open / in background tab)
let _notifTimer = null;

function armTimer(verse) {
  if (_notifTimer) { clearTimeout(_notifTimer); _notifTimer = null; }
  const ms = getNextFireDate() - Date.now();
  _notifTimer = setTimeout(async () => {
    const today = todayString();
    if (localStorage.getItem(NOTIF_LAST_KEY) === today) {
      // Already fired today, schedule for tomorrow
      scheduleAndSave(verse);
      return;
    }
    localStorage.setItem(NOTIF_LAST_KEY, today);
    await showLocalNotification(
      'King James Bible — Verse of the Day',
      `"${verse.text.slice(0, 120)}${verse.text.length > 120 ? '…' : ''}" — ${verse.ref}`
    );
    scheduleAndSave(verse);
  }, ms);
}

function scheduleAndSave(verse) {
  saveNextFireTime(verse);
  armTimer(verse);
}

// Register periodic background sync so Android can fire even when app is closed
async function registerPeriodicSync() {
  try {
    const reg = await navigator.serviceWorker.ready;
    if ('periodicSync' in reg) {
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
      if (status.state === 'granted') {
        await reg.periodicSync.register('daily-verse-notif', { minInterval: 60 * 60 * 1000 }); // 1 hour min
      }
    }
  } catch {}
}

// On page focus/visibility, check if a notification is overdue
function checkOverdueNotification(verse) {
  if (!getNotificationsEnabled()) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const nextTs = parseInt(localStorage.getItem(NOTIF_NEXT_KEY) || '0', 10);
  if (!nextTs) return;
  const today = todayString();
  if (Date.now() >= nextTs && localStorage.getItem(NOTIF_LAST_KEY) !== today) {
    localStorage.setItem(NOTIF_LAST_KEY, today);
    showLocalNotification(
      'King James Bible — Daily Verse',
      `"${verse.text.slice(0, 120)}${verse.text.length > 120 ? '…' : ''}" — ${verse.ref}`
    );
    saveNextFireTime();
  }
}

export function scheduleDailyNotification(verse) {
  if (!getNotificationsEnabled()) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  scheduleAndSave(verse);
  registerPeriodicSync();
}

// Call once on app load
export function initNotifications(verse) {
  if (!getNotificationsEnabled()) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  // Check if we missed a notification while closed
  checkOverdueNotification(verse);

  // Arm the in-page timer
  scheduleDailyNotification(verse);

  // Re-check on visibility change (e.g. user switches back to the app)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkOverdueNotification(verse);
    }
  }, { once: false });
}