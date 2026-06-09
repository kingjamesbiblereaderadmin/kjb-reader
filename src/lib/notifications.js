// Notification helpers for KJB PWA
// Strategy: store next-fire timestamp, check on page load/focus + SW periodic sync

import { getDailyVerse, getDailyVerseFromBible } from './dailyVerse';

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
    const reg = await navigator.serviceWorker.register('/sw.js');
    
    // Automatically reload the page when a new service worker takes over
    // so users get the latest UI updates immediately.
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    if (reg.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    reg.addEventListener('updatefound', () => {
      const installingWorker = reg.installing;
      if (installingWorker) {
        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
            installingWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      }
    });
    // Force an update check to ensure users get the latest app shell features (e.g. WiFi icon)
    reg.update();
    return reg;
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
  // NOTE: On Android (Chrome/Edge), reg.showNotification() SILENTLY FAILS unless
  // the real OS-level Notification.permission is 'granted'. So we must NOT force
  // hasPermission=true just because a SW registered — that's why the toggle
  // showed "enabled" but nothing ever fired. We only register the SW here.
  if ('serviceWorker' in navigator) {
    try {
      console.log('[Notif] Checking service worker registration...');
      let reg = await navigator.serviceWorker.getRegistration('/');
      if (!reg) {
        console.log('[Notif] Registering service worker...');
        reg = await navigator.serviceWorker.register('/sw.js');
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



const APP_LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png';

// ---- App-based notifications only ----
// Reminders are handled entirely on-device via the in-app timer + service
// worker (showLocalNotification). No server push / VAPID is used.

// Show a notification via SW (required on Android PWA)
export async function showLocalNotification(title, body, imageUrl = null, targetUrl = null) {
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
      console.log('[Notif] Checking for active service worker...');
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg && reg.active) {
        console.log('[Notif] Service worker ready:', reg);
        console.log('[Notif] SW registration scope:', reg.scope);
        console.log('[Notif] SW active:', reg.active ? 'yes' : 'no');
        console.log('[Notif] showNotification method exists:', typeof reg.showNotification);
        
        // Show notification using service worker with app logo.
        // requireInteraction keeps the notification on screen so the user can
        // expand it and read the full verse text (some OSes collapse the body
        // to one line until the notification is expanded/tapped).
        await reg.showNotification(title, {
          body: body,
          icon: APP_LOGO_URL,
          badge: APP_LOGO_URL,
          tag: 'daily-verse',
          renotify: true,
          vibrate: [200, 100, 200],
          silent: false,
          requireInteraction: true,
          // BigTextStyle hint for Android: a longer body is expandable so the
          // full verse text is shown when the user pulls the notification down.
          // Some Androids only render the full body when an image is present.
          image: APP_LOGO_URL,
          data: {
            body,
            url: targetUrl ? (window.location.origin ? (window.location.origin + targetUrl) : targetUrl) : (window.location.origin ? (window.location.origin + '/') : '/')
          }
        });
        console.log('[Notif] ✅ Service worker notification sent successfully');
        return;
      } else {
        console.log('[Notif] No active service worker found, falling back to standard API.');
      }
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
        requireInteraction: true,
        image: APP_LOGO_URL,
        data: {
          body,
          url: targetUrl ? (window.location.origin ? (window.location.origin + targetUrl) : targetUrl) : (window.location.origin ? (window.location.origin + '/') : '/')
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

async function fireNotificationNow() {
  let verse;
  try {
    verse = await getDailyVerseFromBible();
    // Don't fire the notification if we got the offline fallback message
    if (verse.ref === "Offline Mode") {
      return;
    }
  } catch {
    return;
  }
  
  const today = todayString();
  localStorage.setItem(NOTIF_LAST_KEY, today);
  
  showLocalNotification(
    'King James Bible — Daily Verse',
    `"${verse.text}" — ${verse.ref} (KJB)`,
    null,
    `/read?book=${verse.abbr}&chapter=${verse.chapter}&verse=${verse.verse}&from=daily`
  );
}

// Fire once per day: when the app is opened on a new day (and we haven't
// shown today's verse yet). No time scheduling — just a new-day check.
async function checkNewDayNotification() {
  if (!getNotificationsEnabled()) return;
  if (localStorage.getItem(NOTIF_LAST_KEY) === todayString()) return;
  await fireNotificationNow();
}

// Kept for callers (Settings toggle). Fires today's verse immediately if not
// yet shown today, so enabling on a new day gives instant feedback.
export function scheduleDailyNotification() {
  checkNewDayNotification();
}

// Call once on app load - checks for missed notifications and arms timer
let _notificationsInitialized = false;
export function initNotifications() {
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

  // Fire today's verse if the app is opened on a new day
  checkNewDayNotification();

  // Re-check on visibility change (e.g. user switches back to the app)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkNewDayNotification();
    }
  });

  // Check on window focus
  window.addEventListener('focus', () => {
    checkNewDayNotification();
  });

  // Check on pageshow — covers PWA resume from back/forward cache
  window.addEventListener('pageshow', () => {
    checkNewDayNotification();
  });
  
  console.log('[Notif] Notifications initialized successfully');
  console.log('[Notif] ========== initNotifications END ==========');
}

// Manual trigger for debugging/testing
export async function triggerScheduledNotification() {
  console.log('[Notif] Manual trigger called');
  let verse;
  try {
    verse = await getDailyVerseFromBible();
    if (verse.ref === "Offline Mode") {
      console.log('[Notif] Bible data not ready, aborting manual test');
      alert('Please wait for the Bible data to load before testing notifications.');
      return;
    }
  } catch {
    console.log('[Notif] Bible data not ready, aborting manual test');
    alert('Please wait for the Bible data to load before testing notifications.');
    return;
  }
  const today = todayString();
  
  await showLocalNotification(
    'KJB — Manual Test',
    `"${verse.text}" — ${verse.ref} (KJB)`,
    null,
    `/read?book=${verse.abbr}&chapter=${verse.chapter}&verse=${verse.verse}&from=daily`
  );
  console.log('[Notif] Manual trigger completed');
}