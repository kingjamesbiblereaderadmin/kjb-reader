// Notification helpers for KJB PWA
// Strategy: store next-fire timestamp, check on page load/focus + SW periodic sync

import { getDailyVerse } from './dailyVerse';

const NOTIF_KEY = 'kjb-notifications-enabled';
const NOTIF_TIME_KEY = 'kjb-notification-time'; // HH:MM
const NOTIF_LAST_KEY = 'kjb-notification-last'; // YYYY-MM-DD
const NOTIF_NEXT_KEY = 'kjb-notification-next'; // Unix ms timestamp



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
    // If already registered, return existing registration without re-registering
    const existing = await navigator.serviceWorker.getRegistration('/');
    if (existing) return existing;
    return await navigator.serviceWorker.register('/sw.js');
  } catch { return null; }
}

export function todayString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export async function requestNotificationPermission() {
  console.log('[Notif] requestNotificationPermission called');
  console.log('[Notif] Service Worker supported:', 'serviceWorker' in navigator);
  console.log('[Notif] Notification API supported:', 'Notification' in window);
  
  let hasPermission = false;
  
  // Step 1: Try standard Notification API permission (iOS 16.4+, desktop browsers)
  if ('Notification' in window) {
    try {
      console.log('[Notif] Current Notification permission:', Notification.permission);
      if (Notification.permission !== 'granted') {
        console.log('[Notif] Requesting Notification permission...');
        const result = await Notification.requestPermission();
        console.log('[Notif] Notification permission result:', result);
        if (result === 'granted') {
          hasPermission = true;
          localStorage.setItem(NOTIF_KEY, 'true');
        }
      } else {
        console.log('[Notif] Notification permission already granted');
        hasPermission = true;
        localStorage.setItem(NOTIF_KEY, 'true');
      }
    } catch (err) {
      console.warn('[Notif] Notification.requestPermission failed:', err.message);
    }
  }
  
  // Step 2: Register service worker (Android, PWA, all platforms)
  if ('serviceWorker' in navigator) {
    try {
      console.log('[Notif] Checking service worker registration...');
      let reg = await navigator.serviceWorker.getRegistration('/');
      if (!reg) {
        console.log('[Notif] Registering service worker...');
        reg = await navigator.serviceWorker.register('/sw.js');
        console.log('[Notif] Service worker registered:', reg.scope);
      } else {
        console.log('[Notif] Service worker already registered:', reg.scope);
        console.log('[Notif] Service worker state:', reg.active ? 'active' : 'installing/activating');
        if (reg.active) {
          console.log('[Notif] Active SW script URL:', reg.active.scriptURL);
        }
      }
      
      // On Android, SW notifications work even without Notification API permission
      if (!hasPermission) {
        console.log('[Notif] Enabling notifications via service worker (no Notification API needed)');
        localStorage.setItem(NOTIF_KEY, 'true');
        hasPermission = true;
      }
    } catch (err) {
      console.error('[Notif] Service worker registration failed:', err.message);
    }
  } else {
    console.error('[Notif] Service Worker NOT supported in this browser');
  }
  
  console.log('[Notif] Final permission status:', hasPermission ? 'granted' : 'denied');
  console.log('[Notif] Notifications enabled in localStorage:', getNotificationsEnabled());
  
  return hasPermission ? 'granted' : 'denied';
}

export function disableNotifications() {
  localStorage.setItem(NOTIF_KEY, 'false');
  localStorage.removeItem(NOTIF_NEXT_KEY);
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
  console.log('[Notif] Next notification scheduled for:', t, '(', t.toLocaleString(), ')');
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
    console.log('[Notif] Config saved to SW cache');
  } catch (err) {
    console.warn('[Notif] Failed to save config to cache:', err);
  }
}

// Show a notification via SW (required on Android PWA)
export async function showLocalNotification(title, body, imageUrl = null) {
  const logoUrl = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png';
  
  // Get custom notification image from localStorage if available
  let customImage = null;
  try {
    customImage = localStorage.getItem('kjb-notif-image');
  } catch {}
  
  console.log('[Notif] showLocalNotification called:', title);
  console.log('[Notif] Body:', body);
  console.log('[Notif] Custom image available:', !!customImage);
  
  // Try service worker first (works on Android, PWA, all platforms)
  if ('serviceWorker' in navigator) {
    try {
      console.log('[Notif] Waiting for service worker to be ready...');
      const reg = await navigator.serviceWorker.ready;
      console.log('[Notif] Service worker ready, showing notification');
      console.log('[Notif] Registration scope:', reg.scope);
      console.log('[Notif] Active worker:', reg.active?.scriptURL);
      
      // Show notification using service worker
      await reg.showNotification(title, {
        body: body,
        icon: customImage || logoUrl,
        badge: logoUrl,
        tag: 'daily-verse',
        renotify: true,
        vibrate: [200, 100, 200],
        silent: false,
        requireInteraction: false,
        data: {
          url: window.location.origin ? (window.location.origin + '/') : '/'
        }
      });
      console.log('[Notif] Service worker notification sent successfully');
      return;
    } catch (err) {
      console.error('[Notif] Service worker notification failed:', err.message);
      console.error('[Notif] Error details:', err);
    }
  } else {
    console.error('[Notif] Service Worker not available');
  }
  
  // Fallback to standard Notification API (iOS 16.4+, desktop)
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      console.log('[Notif] Using standard Notification API');
      const notif = new Notification(title, { 
        body: body,
        icon: customImage || logoUrl,
        badge: logoUrl,
        vibrate: [200, 100, 200],
        tag: 'daily-verse',
        renotify: true,
        silent: false,
        data: {
          url: window.location.origin ? (window.location.origin + '/') : '/'
        }
      });
      
      console.log('[Notif] Standard notification sent');
    } catch (err) {
      console.error('[Notif] Standard notification failed:', err.message);
    }
  } else {
    console.warn('[Notif] No notification method available');
    console.warn('[Notif] Notification API available:', 'Notification' in window);
    console.warn('[Notif] Notification permission:', 'Notification' in window ? Notification.permission : 'N/A');
  }
}

// In-page timer (fires while app is open / in background tab)
let _notifTimer = null;
let _alarmTimer = null;

// Use Alarm API if available (Chrome/Edge) - more reliable than setTimeout
async function armAlarm(verse) {
  if (!('AlarmManager' in window)) {
    console.log('[Notif] Alarm API not available, falling back to timer');
    return false;
  }
  
  try {
    const alarmId = 'kjb-daily-verse';
    const fireDate = getNextFireDate();
    
    // Clear existing alarm
    await navigator.AlarmManager.clear(alarmId);
    
    // Set new alarm
    await navigator.AlarmManager.set(
      alarmId,
      fireDate.getTime(),
      async () => {
        console.log('[Notif] Alarm fired!');
        const today = todayString();
        if (localStorage.getItem(NOTIF_LAST_KEY) === today) {
          console.log('[Notif] Already notified today, rescheduling');
          scheduleAndSave(verse);
          return;
        }
        localStorage.setItem(NOTIF_LAST_KEY, today);
        await showLocalNotification(
          'King James Bible — Daily Verse',
          `"${verse.text.slice(0, 120)}${verse.text.length > 120 ? '…' : ''}" — ${verse.ref}`,
          null
        );
        scheduleAndSave(verse);
      }
    );
    console.log('[Notif] Alarm set for', fireDate);
    return true;
  } catch (err) {
    console.error('[Notif] Alarm setup failed:', err);
    return false;
  }
}

function armTimer(verse) {
  if (_notifTimer) { clearTimeout(_notifTimer); _notifTimer = null; }
  if (_alarmTimer) { clearTimeout(_alarmTimer); _alarmTimer = null; }
  
  const ms = getNextFireDate() - Date.now();
  const fireDate = getNextFireDate();
  
  console.log('[Notif] Arming timer to fire in', ms, 'ms at', fireDate);
  console.log('[Notif] Timer will fire at:', fireDate.toLocaleString());
  console.log('[Notif] Current time:', new Date().toLocaleString());
  console.log('[Notif] Notifications enabled:', getNotificationsEnabled());
  console.log('[Notif] Last notified:', localStorage.getItem(NOTIF_LAST_KEY));
  
  // Check if we should fire immediately (for testing/debugging)
  if (ms < 0) {
    console.log('[Notif] Scheduled time is in the past, will fire on next app open');
  }
  
  _notifTimer = setTimeout(async () => {
    console.log('[Notif] Timer callback executed');
    const today = todayString();
    if (localStorage.getItem(NOTIF_LAST_KEY) === today) {
      console.log('[Notif] Already notified today, rescheduling');
      scheduleAndSave(verse);
      return;
    }
    localStorage.setItem(NOTIF_LAST_KEY, today);
    console.log('[Notif] Firing notification at scheduled time');
    await showLocalNotification(
      'King James Bible — Daily Verse',
      `"${verse.text.slice(0, 120)}${verse.text.length > 120 ? '…' : ''}" — ${verse.ref}`,
      null
    );
    scheduleAndSave(verse);
  }, ms);
  
  // Also set a wake-up alarm that checks every minute near the scheduled time
  const checkInterval = 60000; // 1 minute
  const timeToCheck = ms - 300000; // Start checking 5 minutes before
  if (timeToCheck > 0 && timeToCheck < 24 * 60 * 60 * 1000) {
    console.log('[Notif] Setting wake-up checks starting in', timeToCheck, 'ms');
    _alarmTimer = setTimeout(() => {
      console.log('[Notif] Starting wake-up checks');
      const checkTimer = setInterval(() => {
        const now = Date.now();
        const target = fireDate.getTime();
        console.log('[Notif] Wake-up check: now=', now, 'target=', target, 'diff=', target - now);
        if (now >= target) {
          clearInterval(checkTimer);
          console.log('[Notif] Wake-up check triggered notification');
          const today = todayString();
          if (localStorage.getItem(NOTIF_LAST_KEY) !== today) {
            localStorage.setItem(NOTIF_LAST_KEY, today);
            showLocalNotification(
              'King James Bible — Daily Verse',
              `"${verse.text.slice(0, 120)}${verse.text.length > 120 ? '…' : ''}" — ${verse.ref}`,
              null
            );
            scheduleAndSave(verse);
          }
        }
      }, checkInterval);
      
      // Clear check timer after 10 minutes
      setTimeout(() => {
        clearInterval(checkTimer);
        console.log('[Notif] Stopped wake-up checks');
      }, 10 * 60 * 1000);
    }, timeToCheck);
  }
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
      try {
        // Try to register with 24-hour interval (minimum allowed)
        await reg.periodicSync.register('daily-verse-notif', { minInterval: 24 * 60 * 60 * 1000 });
        console.log('[Notif] Periodic sync registered (24h interval)');
      } catch (syncErr) {
        console.warn('[Notif] Periodic sync not available:', syncErr.message);
      }
    }
    // Note: periodicSync is only supported on Chrome for Android
    // Most browsers will use in-page timer or push notifications instead
  } catch (err) {
    console.warn('[Notif] Periodic sync registration failed:', err.message);
  }
}

// On page focus/visibility, check if we need to show a notification for today's verse
// Only show if user missed the daily verse (new day, never opened app to see it)
function checkOverdueNotification(verse) {
  if (!getNotificationsEnabled()) return;
  // On Android, we just need service worker - Notification API is optional
  if (!('serviceWorker' in navigator)) return;
  const nextTs = parseInt(localStorage.getItem(NOTIF_NEXT_KEY) || '0', 10);
  if (!nextTs) return;
  const today = todayString();
  const lastNotifDate = localStorage.getItem(NOTIF_LAST_KEY);
  
  // Only show recovery notification if:
  // 1. It's a new day (today != last notification date)
  // 2. The scheduled time has passed
  // 3. User hasn't been notified yet today
  if (lastNotifDate !== today && Date.now() >= nextTs) {
    // Check if user already opened app today and saw the verse (no recovery needed)
    const lastAppOpen = localStorage.getItem('kjb-last-app-open');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
    
    // Only show recovery if user didn't open app yesterday or today
    if (lastAppOpen !== today && lastAppOpen !== yesterdayStr) {
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
}

export function scheduleDailyNotification(verse) {
  if (!getNotificationsEnabled()) return;
  // On Android, we just need service worker - Notification API is optional
  if (!('serviceWorker' in navigator)) return;
  scheduleAndSave(verse);
  registerPeriodicSync();
}

// Call once on app load - checks for missed notifications and arms timer
let _notificationsInitialized = false;
export function initNotifications(verse) {
  console.log('[Notif] initNotifications called');
  console.log('[Notif] Service Worker supported:', 'serviceWorker' in navigator);
  console.log('[Notif] Notifications enabled:', getNotificationsEnabled());
  
  if (!getNotificationsEnabled()) {
    console.log('[Notif] Notifications not enabled, skipping init');
    return;
  }
  
  // Prevent multiple initializations
  if (_notificationsInitialized) {
    console.log('[Notif] Already initialized, skipping');
    return;
  }
  _notificationsInitialized = true;

  console.log('[Notif] Last notified:', localStorage.getItem(NOTIF_LAST_KEY));
  console.log('[Notif] Next fire timestamp:', localStorage.getItem(NOTIF_NEXT_KEY));
  console.log('[Notif] Notification time setting:', getNotificationTime());
  
  // Track app open date for recovery notification logic
  const today = todayString();
  localStorage.setItem('kjb-last-app-open', today);

  // Always check if notification is due when app opens (for missed notifications)
  checkOverdueNotification(verse);

  // Arm the in-page timer for future notifications at the scheduled time
  scheduleDailyNotification(verse);

  // Re-check on visibility change (e.g. user switches back to the app)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      localStorage.setItem('kjb-last-app-open', todayString());
      const freshVerse = getDailyVerse();
      console.log('[Notif] App became visible, checking overdue');
      checkOverdueNotification(freshVerse);
    }
  });
  
  // Check on window focus
  window.addEventListener('focus', () => {
    const freshVerse = getDailyVerse();
    checkOverdueNotification(freshVerse);
  });
  
  console.log('[Notif] Notifications initialized successfully');
}

// Manual trigger for debugging/testing
export async function triggerScheduledNotification() {
  console.log('[Notif] Manual trigger called');
  const verse = getDailyVerse();
  const today = todayString();
  
  // Force fire for testing
  localStorage.setItem(NOTIF_LAST_KEY, today);
  await showLocalNotification(
    'KJB — Manual Test',
    `"${verse.text.slice(0, 100)}${verse.text.length > 100 ? '…' : ''}" — ${verse.ref}`,
    null
  );
  scheduleAndSave(verse);
  console.log('[Notif] Manual trigger completed');
}