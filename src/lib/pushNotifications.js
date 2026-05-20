// Push notification helpers for PWA
// Supports Android push notifications even when app is closed
// Note: For production, configure Firebase Cloud Messaging (FCM)

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

// Subscribe to push notifications (without VAPID for basic support)
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
  
  try {
    // Subscribe without VAPID (works for some browsers)
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true
    });
    
    console.log('[PUSH] Subscribed:', subscription.endpoint);
    return subscription;
  } catch (err) {
    console.log('[PUSH] Subscription requires VAPID. Set up FCM for production:', err.message);
    throw err;
  }
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

// Helper: Convert VAPID key from base64 to Uint8Array (if needed for FCM)
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

// Initialize Firebase Cloud Messaging (FCM) for production push notifications
export async function initializeFCM(firebaseConfig) {
  // For production Android push notifications, you need to:
  // 1. Create a Firebase project at https://console.firebase.google.com
  // 2. Add your web app to Firebase
  // 3. Copy the Firebase config here
  // 4. Install firebase SDK: npm install firebase
  // 5. Use getMessaging() and getToken() to get FCM tokens
  // 6. Send notifications via Firebase Admin SDK or REST API
  
  console.log('[FCM] To enable production push notifications:');
  console.log('1. Create Firebase project at https://console.firebase.google.com');
  console.log('2. Add web app and copy config');
  console.log('3. Install firebase SDK');
  console.log('4. Use FCM for push notifications');
  
  // This is a placeholder - implement with actual Firebase SDK when ready
  return null;
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