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
      
      // Subscribe to web push so the server can deliver notifications when app is closed
      if (hasPermission) {
        try {
          await subscribeToPush();
        } catch (err) {
          console.warn('[Notif] Push subscription failed:', err.message);
        }
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

// Subscribe device to web push (called when notifications are enabled)
export async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('[Push] Push not supported');
    return null;
  }
  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (sub) {
      console.log('[Push] Already subscribed');
      return sub;
    }
    // Fetch VAPID public key from backend
    const res = await fetch('/api/functions/getVapidPublicKey');
    if (!res.ok) {
      console.error('[Push] Failed to fetch VAPID key');
      return null;
    }
    const vapidPublic = (await res.text()).trim();
    if (!vapidPublic) {
      console.error('[Push] Empty VAPID key');
      return null;
    }
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublic),
    });
    // Save to server with the user's preferred UTC hour
    await savePushSubscriptionToServer(sub);
    return sub;
  } catch (err) {
    console.error('[Push] Subscribe failed:', err);
    return null;
  }
}

// Save subscription + preferred hour (converted to UTC) to the server
async function savePushSubscriptionToServer(sub) {
  try {
    const [hh] = getNotificationTime().split(':').map(Number);
    // Convert local hour -> UTC hour
    const now = new Date();
    const local = new Date(now);
    local.setHours(hh, 0, 0, 0);
    const preferred_hour_utc = local.getUTCHours();

    const { base44 } = await import('@/api/base44Client');
    await base44.functions.invoke('savePushSubscription', {
      endpoint: sub.endpoint,
      keys: sub.toJSON().keys,
      preferred_hour_utc,
    });
    console.log('[Push] Subscription saved (UTC hour:', preferred_hour_utc, ')');
  } catch (err) {
    console.error('[Push] Failed to save subscription:', err);
  }
}

// Update the preferred hour on the server (call when user changes notification time)
export async function updatePushPreferredHour() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) await savePushSubscriptionToServer(sub);
  } catch (err) {
    console.error('[Push] Failed to update preferred hour:', err);
  }
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) arr[i] = rawData.charCodeAt(i);
  return arr;
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
  
  console.log('[Notif] ========== TIMER ARMED ==========');
  console.log('[Notif] Will fire in:', ms, 'ms');
  console.log('[Notif] Fire time:', fireDate.toLocaleString());
  console.log('[Notif] Current time:', new Date().toLocaleString());
  console.log('[Notif] Minutes until fire:', Math.floor(ms / 60000));
  console.log('[Notif] Notifications enabled:', getNotificationsEnabled());
  console.log('[Notif] Last notified:', localStorage.getItem(NOTIF_LAST_KEY));
  console.log('[Notif] Next timestamp:', localStorage.getItem(NOTIF_NEXT_KEY));
  console.log('[Notif] =================================');
  
  // Check if we should fire immediately (for testing/debugging)
  if (ms < 0) {
    console.log('[Notif] ⚠️ Scheduled time is in the PAST - will fire on next app open');
    console.log('[Notif] Past by:', Math.abs(Math.floor(ms / 60000)), 'minutes');
  } else if (ms < 60000) {
    console.log('[Notif] ⏰ Will fire in LESS THAN 1 MINUTE!');
  } else if (ms < 300000) {
    console.log('[Notif] ⏰ Will fire in', Math.floor(ms / 60000), 'minutes - KEEP APP OPEN');
  }
  
  _notifTimer = setTimeout(async () => {
    console.log('[Notif] ⏰⏰⏰ TIMER CALLBACK EXECUTED ⏰⏰⏰');
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
      `"${verse.text.slice(0, 120)}${verse.text.length > 120 ? '…' : ''}" — ${verse.ref} (KJB)`,
      null
    );
    scheduleAndSave(verse);
  }, ms);
  
  // Also set a wake-up alarm that checks every minute near the scheduled time
  const checkInterval = 60000; // 1 minute
  const timeToCheck = ms - 300000; // Start checking 5 minutes before
  if (timeToCheck > 0 && timeToCheck < 24 * 60 * 60 * 1000) {
    console.log('[Notif] Setting wake-up checks starting in', Math.floor(timeToCheck / 60000), 'minutes');
    _alarmTimer = setTimeout(() => {
      console.log('[Notif] Starting wake-up checks (every minute)');
      const checkTimer = setInterval(() => {
        const now = Date.now();
        const target = fireDate.getTime();
        const diff = target - now;
        console.log('[Notif] Wake-up check: diff=', diff, 'ms (', Math.floor(diff / 60000), 'min )');
        if (now >= target) {
          clearInterval(checkTimer);
          console.log('[Notif] Wake-up check triggered notification');
          const today = todayString();
          if (localStorage.getItem(NOTIF_LAST_KEY) !== today) {
            localStorage.setItem(NOTIF_LAST_KEY, today);
            showLocalNotification(
              'King James Bible — Daily Verse',
              `"${verse.text.slice(0, 120)}${verse.text.length > 120 ? '…' : ''}" — ${verse.ref} (KJB)`,
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
  } else if (ms >= 0 && ms <= 300000) {
    // Already within 5 minutes - start checking immediately
    console.log('[Notif] Already within 5 minutes - starting immediate checks');
    const checkTimer = setInterval(() => {
      const now = Date.now();
      const target = fireDate.getTime();
      const diff = target - now;
      console.log('[Notif] Immediate check: diff=', diff, 'ms');
      if (now >= target) {
        clearInterval(checkTimer);
        console.log('[Notif] Immediate check triggered notification');
        const today = todayString();
        if (localStorage.getItem(NOTIF_LAST_KEY) !== today) {
          localStorage.setItem(NOTIF_LAST_KEY, today);
          showLocalNotification(
            'King James Bible — Daily Verse',
            `"${verse.text.slice(0, 120)}${verse.text.length > 120 ? '…' : ''}" — ${verse.ref} (KJB)`,
            null
          );
          scheduleAndSave(verse);
        }
      }
    }, checkInterval);
    
    // Clear after 10 minutes
    setTimeout(() => {
      clearInterval(checkTimer);
      console.log('[Notif] Stopped immediate checks');
    }, 10 * 60 * 1000);
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
        `"${freshVerse.text.slice(0, 120)}${freshVerse.text.length > 120 ? '…' : ''}" — ${freshVerse.ref} (KJB)`,
        null // Will use stored kjb-notif-image
      );
      saveNextFireTime(freshVerse);
    }
  }
}

export function scheduleDailyNotification(verse) {
  if (!getNotificationsEnabled()) return;
  if (!('serviceWorker' in navigator)) return;
  // Server-side push (sendDailyNotifications cron) is the sole delivery mechanism.
  // We only persist the next-fire timestamp for the recovery-on-open check;
  // no in-page timer is armed to avoid duplicate notifications.
  saveNextFireTime(verse);
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
  scheduleAndSave(verse);
  console.log('[Notif] Manual trigger completed');
}