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
  
  // IMPORTANT: Request the Notification permission FIRST, before any other
  // await. Mobile Chromium browsers (Edge, Chrome, Samsung Internet) only
  // treat requestPermission() as tied to the user's tap for a very short
  // "transient activation" window (a few seconds). If we await service
  // worker registration first, that window can expire — especially on a
  // fresh install where registering the SW takes a moment — and the browser
  // then silently auto-denies the request instead of showing the prompt at
  // all (looks like notifications got "automatically blocked"). Requesting
  // permission immediately, synchronously-adjacent to the click, avoids that.
  if ('Notification' in window) {
    try {
      console.log('[Notif] Current Notification permission:', Notification.permission);
      console.log('[Notif] Requesting Notification permission...');
      const result = await Notification.requestPermission();
      console.log('[Notif] Notification permission result:', result);
      if (result === 'granted') {
        hasPermission = true;
      }
    } catch (err) {
      console.warn('[Notif] Notification.requestPermission failed:', err.message);
    }
  }
  
  // Step 2: Register service worker (required for Android/Samsung to actually
  // display notifications) AFTER permission has already been decided, so it
  // can never eat into the user-gesture window the permission prompt needs.
  if ('serviceWorker' in navigator) {
    try {
      console.log('[Notif] Registering service worker...');
      let reg = await navigator.serviceWorker.getRegistration('/');
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js');
      }
      console.log('[Notif] Service worker registered:', reg.scope);
    } catch (err) {
      console.error('[Notif] Service worker registration failed:', err.message);
    }
  }
  
  console.log('[Notif] Final permission status:', hasPermission ? 'granted' : 'denied');
  console.log('[Notif] Notifications enabled in localStorage:', getNotificationsEnabled());
  
  return hasPermission ? 'granted' : 'denied';
}

export function disableNotifications() {
  localStorage.setItem(NOTIF_KEY, 'false');
  localStorage.removeItem(NOTIF_NEXT_KEY);
}



// App logo for notifications
// Android shows this in expanded notification (full color)
const APP_LOGO_URL = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/8e738d108_cfb4bf781_Untitled.png';

// Clean verse text for plain-text notifications. KEEP pilcrows (¶) and the
// [italic] brackets. The source stores every apostrophe AND pilcrow as the
// broken replacement char (�/\uFFFD); they're told apart by position —
// letter+� → apostrophe (e.g. "David's"), otherwise → pilcrow ¶.
export function cleanForNotification(text) {
  return (text || '')
    .replace(/(\p{L})\uFFFD/gu, "$1'")
    .replace(/\uFFFD/g, '¶')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

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
      console.log('[Notif] Waiting for active service worker...');
      // Await serviceWorker.ready so the immediate "Reminders On"/test notification
      // doesn't fail when the SW is still installing. Race a timeout so we never hang
      // if registration failed entirely, then fall through to the standard API.
      const reg = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((resolve) => setTimeout(() => resolve(null), 3000)),
      ]) || await navigator.serviceWorker.getRegistration();
      if (reg && reg.active) {
        console.log('[Notif] Service worker ready:', reg);
        console.log('[Notif] SW registration scope:', reg.scope);
        console.log('[Notif] SW active:', reg.active ? 'yes' : 'no');
        console.log('[Notif] showNotification method exists:', typeof reg.showNotification);
        
        // Show notification using service worker with app logo.
        // Android shows white silhouette in status bar (standard OS behavior for all apps).
        // Full-color logo appears when notification is expanded/tapped.
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
          requireInteraction: false,
          color: '#8b5cf6',
          colorized: true,
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
        requireInteraction: false,
        color: '#8b5cf6',
        colorized: true,
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
    // Always get a verse - API when online, deterministic offline when offline
    verse = await getDailyVerseFromBible();
  } catch (err) {
    console.error('[Notif] Failed to get daily verse:', err.message);
    return;
  }
  
  const today = todayString();
  localStorage.setItem(NOTIF_LAST_KEY, today);
  
  showLocalNotification(
    'King James Bible — Daily Verse',
    `"${cleanForNotification(verse.text)}" — ${verse.ref} (KJB)`,
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
    // Always get a verse - API when online, deterministic offline when offline
    verse = await getDailyVerseFromBible();
  } catch (err) {
    console.error('[Notif] Failed to get daily verse:', err.message);
    alert('Failed to get daily verse. Please try again.');
    return;
  }
  
  await showLocalNotification(
    'KJB — Manual Test',
    `"${cleanForNotification(verse.text)}" — ${verse.ref} (KJB)`,
    null,
    `/read?book=${verse.abbr}&chapter=${verse.chapter}&verse=${verse.verse}&from=daily`
  );
  console.log('[Notif] Manual trigger completed');
}