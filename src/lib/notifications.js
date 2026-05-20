// Notification helpers for KJB PWA
// Strategy: store next-fire timestamp, check on page load/focus + SW periodic sync

import { getDailyVerse } from './dailyVerse';

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
  console.log('requestNotificationPermission called');
  console.log('serviceWorker in navigator:', 'serviceWorker' in navigator);
  console.log('Notification in window:', 'Notification' in window);
  
  // Check for Service Worker support (required for Android notifications)
  if (!('serviceWorker' in navigator)) {
    console.log('No service worker support');
    return 'unsupported';
  }
  
  // Try to register service worker first
  let reg;
  try {
    reg = await navigator.serviceWorker.register('/sw.js');
    console.log('Service worker registered:', reg.scope);
  } catch (err) {
    console.error('Service worker registration failed:', err);
    return 'unsupported';
  }
  
  // For Android PWA/WebView, Notification API might not be available
  // but service worker showNotification still works
  if (!('Notification' in window)) {
    console.log('Notification API not available, but SW may work - returning granted');
    localStorage.setItem(NOTIF_KEY, 'true');
    return 'granted';
  }
  
  // Try standard permission request
  try {
    console.log('Calling Notification.requestPermission()...');
    const result = await Notification.requestPermission();
    console.log('Notification permission result:', result);
    if (result === 'granted') {
      localStorage.setItem(NOTIF_KEY, 'true');
    }
    return result;
  } catch (err) {
    console.error('Notification.requestPermission error:', err);
    // On Android WebView, this might fail but SW notifications still work
    localStorage.setItem(NOTIF_KEY, 'true');
    return 'granted';
  }
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
  // On Android, we just need service worker - Notification API is optional
  if (!('serviceWorker' in navigator)) return;
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
  // On Android, we just need service worker - Notification API is optional
  if (!('serviceWorker' in navigator)) return;

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
  const logoUrl = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png';
  
  // Always try service worker first (works on Android even when Notification API doesn't)
  try {
    const reg = await navigator.serviceWorker.ready;
    console.log('Service worker ready, showing notification via SW');
    await reg.showNotification(title, {
      body,
      icon: logoUrl,
      badge: logoUrl,
      tag: 'daily-verse',
      renotify: true,
      silent: true,
    });
    return;
  } catch (err) {
    console.error('Service worker notification failed:', err);
  }
  
  // Fallback to standard Notification API
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { body, icon: logoUrl });
    } catch (err) {
      console.error('Standard notification failed:', err);
    }
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
      `"${verse.text.slice(0, 120)}${verse.text.length > 120 ? '…' : ''}" — ${verse.ref}`,
      null // Will use stored kjb-notif-image
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

// On page focus/visibility, check if we need to show a notification for today's verse
function checkOverdueNotification(verse) {
  if (!getNotificationsEnabled()) return;
  // On Android, we just need service worker - Notification API is optional
  if (!('serviceWorker' in navigator)) return;
  const nextTs = parseInt(localStorage.getItem(NOTIF_NEXT_KEY) || '0', 10);
  if (!nextTs) return;
  const today = todayString();
  // If it's past the notification time and we haven't sent today
  if (Date.now() >= nextTs && localStorage.getItem(NOTIF_LAST_KEY) !== today) {
    localStorage.setItem(NOTIF_LAST_KEY, today);
    // Get fresh verse for today
    const freshVerse = getDailyVerse();
    showLocalNotification(
      'King James Bible — Daily Verse',
      `"${freshVerse.text.slice(0, 120)}${freshVerse.text.length > 120 ? '…' : ''}" — ${freshVerse.ref}`,
      null // Will use stored kjb-notif-image
    );
    saveNextFireTime(freshVerse);
  }
}

export function scheduleDailyNotification(verse) {
  if (!getNotificationsEnabled()) return;
  // On Android, we just need service worker - Notification API is optional
  if (!('serviceWorker' in navigator)) return;
  scheduleAndSave(verse);
  registerPeriodicSync();
}

// Call once on app load - checks for missed notifications and arms timer
export function initNotifications(verse) {
  if (!getNotificationsEnabled()) return;
  // On Android, we just need service worker - Notification API is optional
  if (!('serviceWorker' in navigator)) return;

  // Always check if we need to notify for today's verse when app opens
  checkOverdueNotification(verse);

  // Arm the in-page timer for future notifications
  scheduleDailyNotification(verse);

  // Re-check on visibility change (e.g. user switches back to the app)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      // Get fresh verse when app becomes visible
      const freshVerse = getDailyVerse();
      checkOverdueNotification(freshVerse);
    }
  }, { once: false });
}