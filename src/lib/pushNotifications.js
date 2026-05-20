// Push notification helpers for PWA
// Supports Android push notifications even when app is closed

const VAPID_PUBLIC_KEY = 'YOUR_VAPID_PUBLIC_KEY_HERE'; // Replace with your actual VAPID public key

// Check if push notifications are supported
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Get notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  
  const permission = await Notification.requestPermission();
  return permission;
}

// Subscribe to push notifications
export async function subscribeToPush() {
  if (!isPushSupported()) {
    throw new Error('Push notifications not supported');
  }
  
  const registration = await navigator.serviceWorker.ready;
  
  // Check for existing subscription
  let subscription = await registration.pushManager.getSubscription();
  
  if (subscription) {
    console.log('[PUSH] Already subscribed:', subscription.endpoint);
    return subscription;
  }
  
  // Subscribe with VAPID
  subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
  });
  
  console.log('[PUSH] Subscribed:', subscription.endpoint);
  return subscription;
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush() {
  if (!isPushSupported()) {
    return false;
  }
  
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  
  if (!subscription) {
    return false;
  }
  
  const success = await subscription.unsubscribe();
  console.log('[PUSH] Unsubscribed:', success);
  return success;
}

// Send subscription to backend for storage
export async function sendSubscriptionToBackend(subscription) {
  try {
    // Replace with your actual backend endpoint
    const response = await fetch('/functions/savePushSubscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    
    if (!response.ok) {
      throw new Error('Failed to save subscription');
    }
    
    console.log('[PUSH] Subscription saved to backend');
    return await response.json();
  } catch (err) {
    console.error('[PUSH] Error saving subscription:', err);
    throw err;
  }
}

// Initialize push notifications
export async function initPushNotifications() {
  if (!isPushSupported()) {
    console.log('[PUSH] Push not supported');
    return false;
  }
  
  try {
    const permission = await requestNotificationPermission();
    
    if (permission !== 'granted') {
      console.log('[PUSH] Permission not granted:', permission);
      return false;
    }
    
    const subscription = await subscribeToPush();
    await sendSubscriptionToBackend(subscription);
    
    console.log('[PUSH] Push notifications initialized');
    return true;
  } catch (err) {
    console.error('[PUSH] Initialization error:', err);
    return false;
  }
}

// Helper: Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

// Check current push subscription status
export async function getPushSubscriptionStatus() {
  if (!isPushSupported()) {
    return { supported: false, subscribed: false };
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return {
      supported: true,
      subscribed: !!subscription,
      endpoint: subscription?.endpoint
    };
  } catch (err) {
    console.error('[PUSH] Status check error:', err);
    return { supported: true, subscribed: false, error: err.message };
  }
}