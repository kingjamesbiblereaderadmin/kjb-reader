// Push notification helpers for KJB PWA
// Works with browser notifications and service worker - no Firebase required

import { getDailyVerse } from './dailyVerse';

const NOTIF_KEY = 'kjb-notifications-enabled';

export function getNotificationsEnabled() {
  return localStorage.getItem(NOTIF_KEY) === 'true';
}

// Check if browser supports notifications
export function checkNotificationSupport() {
  if (!('serviceWorker' in navigator)) {
    return { supported: false, reason: 'No service worker support' };
  }
  return { supported: true };
}

// Request notification permission
export async function requestNotificationPermission() {
  const support = checkNotificationSupport();
  if (!support.supported) {
    return 'unsupported';
  }
  
  // For Android PWA/WebView, Notification API might not be available
  // but service worker showNotification still works
  if (!('Notification' in window)) {
    localStorage.setItem(NOTIF_KEY, 'true');
    return 'granted';
  }
  
  try {
    const result = await Notification.requestPermission();
    if (result === 'granted') {
      localStorage.setItem(NOTIF_KEY, 'true');
    }
    return result;
  } catch (err) {
    console.error('Notification permission error:', err);
    localStorage.setItem(NOTIF_KEY, 'true');
    return 'granted';
  }
}

// Disable notifications
export function disableNotifications() {
  localStorage.setItem(NOTIF_KEY, 'false');
}

// Show a notification via service worker (works on Android)
export async function showLocalNotification(title, body) {
  const logoUrl = 'https://media.base44.com/images/public/6a05d76723afe58d80c589e8/799704588_Untitled.png';
  
  // Try service worker first (works on Android even when Notification API doesn't)
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      icon: logoUrl,
      badge: logoUrl,
      tag: 'kjb-notification',
      renotify: true,
    });
    return;
  } catch (err) {
    console.error('Service worker notification failed:', err);
  }
  
  // Fallback to standard Notification API
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, { 
        body,
        icon: logoUrl
      });
    } catch (err) {
      console.error('Standard notification failed:', err);
    }
  }
}

// Enable notifications and register service worker
export async function enableNotifications() {
  const support = checkNotificationSupport();
  if (!support.supported) {
    return { success: false, error: 'Notifications not supported in this browser' };
  }
  
  try {
    const result = await requestNotificationPermission();
    if (result === 'granted' || result === 'unsupported') {
      // Register service worker
      await navigator.serviceWorker.register('/sw.js');
      localStorage.setItem(NOTIF_KEY, 'true');
      return { success: true };
    } else if (result === 'denied') {
      return { success: false, error: 'Notifications blocked in browser settings' };
    }
  } catch (err) {
    console.error('Enable notifications error:', err);
    return { success: false, error: err.message };
  }
  
  return { success: false, error: 'Unknown error' };
}

// Disable notifications
export async function disableNotificationsWithSW() {
  disableNotifications();
  
  // Try to unsubscribe from push
  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    }
  } catch (err) {
    console.error('Unsubscribe error:', err);
  }
  
  return { success: true };
}

// Test notification
export async function sendTestNotification() {
  const verse = getDailyVerse();
  await showLocalNotification(
    'KJB Reader — Test',
    `Notifications are working! "${verse.text.slice(0, 60)}..."`
  );
}

// Initialize notifications on app load
export function initNotifications() {
  if (!getNotificationsEnabled()) return;
  
  const support = checkNotificationSupport();
  if (!support.supported) return;
  
  // Service worker will handle showing notifications
  console.log('[Notifications] Initialized');
}