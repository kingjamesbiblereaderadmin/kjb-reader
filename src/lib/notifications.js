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
      }

      // On Android, SW notifications work even without Notification API permission
      if (!hasPermission) {
        localStorage.setItem(NOTIF_KEY, 'true');
        hasPermission = true;
      }

      // Register this device for SERVER push so notifications arrive even when
      // the app is closed (the in-page timer only fires while the app is open).
      if (hasPermission) {
        await subscribeToPush();
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

const APP_LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png';

// ---- App-based notifications only ----
// Reminders are handled entirely on-device via the in-app timer + service
// worker (showLocalNotification). No server push / VAPID is used.

// Kept as no-ops so existing callers keep working without server push.
export async function subscribeToPush() {
  return false;
}

export async function updatePushPreferredHour() {
  // No server-side schedule to update — the in-app timer reschedules itself.
}

// Show a notification via SW (required on Android PWA)
export async function showLocalNotification(title, body, imageUrl = null) {
  console.log('[Notif] showLocalNotification called:', title);
  console.log('[Notif] Body:', body);
  console.log('[Notif] Service Worker available:', 'serviceWorker' in navigator);
  console.log('[Notif] Notification API available:', 'Notification' in window);
  if ('Notification' in window) {
    console.log('[Notif] Notification permission:', Notification.permission);
  }
  
  // Try service worker first (works on Android, PWA, all platforms)
  if ('serviceWorker' in navigator) {
    try {
      console.log('[Notif] Waiting for service worker to be ready...');
      const reg = await navigator.serviceWorker.ready;
      console.log('[Notif] Service worker ready:', reg);
      console.log('[Notif] SW registration scope:', reg.scope);
      console.log('[Notif] SW active:', reg.active ? 'yes' : 'no');
      console.log('[Notif] showNotification method exists:', typeof reg.showNotification);
      
      // Show notification using service worker with app logo
      await reg.showNotification(title, {
        body: body,
        icon: APP_LOGO_URL,
        badge: APP_LOGO_URL,
        tag: 'daily-verse',
        renotify: true,
        vibrate: [200, 100, 200],
        silent: false,
        requireInteraction: false,
        data: {
          url: window.location.origin ? (window.location.origin + '/') : '/'
        }
      });
      console.log('[Notif] ✅ Service worker notification sent successfully');
      return;
    } catch (err) {
      console.error('[Notif] ❌ Service worker notification failed:', err.message);
      console.error('[Notif] Error stack:', err.stack);
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
        icon: APP_LOGO_URL,
        badge: APP_LOGO_URL,
        tag: 'daily-verse',
        renotify: true,
        vibrate: [200, 100, 200],
        silent: false,
        data: {
          url: window.location.origin ? (window.location.origin + '/') : '/'
        }
      });
      
      console.log('[Notif] ✅ Standard notification sent');
    } catch (err) {
      console.error('[Notif] ❌ Standard notification failed:', err.message);
    }
  } else {
    console.warn('[Notif] No notification method available - permission:', 'Notification' in window ? Notification.permission : 'API not available');
  }
}

// In-page poll (fires while app is open / foreground).
// A single long setTimeout is unreliable (browsers throttle/clear timers when
// the device sleeps), so instead we poll every 30s and fire as soon as today's
// scheduled time has passed and we haven't notified yet today.
let _pollInterval = null;

function fireNotificationNow(verse) {
  const today = todayString();
  localStorage.setItem(NOTIF_LAST_KEY, today);
  showLocalNotification(
    'King James Bible — Daily Verse',
    `"${verse.text.slice(0, 120)}${verse.text.length > 120 ? '…' : ''}" — ${verse.ref} (KJB)`,
    null
  );
  saveNextFireTime(verse);
}

// Returns true if today's scheduled time has passed and we haven't notified today
function isDueNow() {
  if (localStorage.getItem(NOTIF_LAST_KEY) === todayString()) return false;
  const [hh, mm] = getNotificationTime().split(':').map(Number);
  const target = new Date();
  target.setHours(hh, mm, 0, 0);
  return Date.now() >= target.getTime();
}

function armTimer(verse) {
  if (_pollInterval) { clearInterval(_pollInterval); _pollInterval = null; }

  console.log('[Notif] Poll armed. Notify time:', getNotificationTime(), '| Last notified:', localStorage.getItem(NOTIF_LAST_KEY));

  _pollInterval = setInterval(() => {
    if (isDueNow()) {
      console.log('[Notif] ⏰ Scheduled time reached — firing notification');
      const freshVerse = getDailyVerse();
      fireNotificationNow(freshVerse);
    }
  }, 30000); // check every 30 seconds
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
  if (!('serviceWorker' in navigator)) return;

  // Fire on app open / focus if today's scheduled time has already passed
  // and we haven't notified yet today (missed notification recovery).
  if (isDueNow()) {
    const freshVerse = getDailyVerse();
    fireNotificationNow(freshVerse);
  }
}

export function scheduleDailyNotification(verse) {
  if (!getNotificationsEnabled()) return;
  if (!('serviceWorker' in navigator)) return;
  // In-app notifications only: persist next-fire time, arm the in-page timer,
  // and try periodicSync (Chrome Android PWA) as a best-effort wake-up.
  saveNextFireTime(verse);
  armTimer(verse);
  registerPeriodicSync();
}

// Call once on app load - checks for missed notifications and arms timer
let _notificationsInitialized = false;
export function initNotifications(verse) {
  console.log('[Notif] ========== initNotifications START ==========');
  console.log('[Notif] initNotifications called');
  console.log('[Notif] Service Worker supported:', 'serviceWorker' in navigator);
  console.log('[Notif] Notifications enabled (from localStorage):', getNotificationsEnabled());
  console.log('[Notif] localStorage value:', localStorage.getItem(NOTIF_KEY));
  
  if (!getNotificationsEnabled()) {
    console.log('[Notif] Notifications not enabled, skipping init');
    console.log('[Notif] ========== initNotifications END (early exit) ==========');
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
  console.log('[Notif] Checking overdue notification...');
  checkOverdueNotification(verse);

  // Arm the in-page timer for future notifications at the scheduled time
  console.log('[Notif] Scheduling daily notification...');
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
  console.log('[Notif] ========== initNotifications END ==========');
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
    `"${verse.text.slice(0, 100)}${verse.text.length > 100 ? '…' : ''}" — ${verse.ref} (KJB)`,
    null
  );
  scheduleDailyNotification(verse);
  console.log('[Notif] Manual trigger completed');
}