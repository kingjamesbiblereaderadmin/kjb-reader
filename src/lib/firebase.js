import { initializeApp } from 'npm:firebase@10.13.0/app';
import { getMessaging, getToken, onMessage } from 'npm:firebase@10.13.0/messaging';

// Firebase config - update with your actual Firebase project config
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
  vapidKey: 'YOUR_VAPID_KEY' // From Firebase Cloud Messaging settings
};

let messaging = null;

// Initialize Firebase Messaging
export function initFirebase() {
  if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'YOUR_API_KEY') {
    console.log('[FCM] Firebase config not set - using basic push');
    return null;
  }
  
  try {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log('[FCM] Firebase initialized');
    return messaging;
  } catch (err) {
    console.error('[FCM] Init error:', err);
    return null;
  }
}

// Get FCM token for push notifications
export async function getFCMToken() {
  if (!messaging) {
    messaging = initFirebase();
    if (!messaging) return null;
  }
  
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('[FCM] Permission not granted');
      return null;
    }
    
    const token = await getToken(messaging, {
      vapidKey: firebaseConfig.vapidKey
    });
    
    console.log('[FCM] Token obtained:', token);
    return token;
  } catch (err) {
    console.error('[FCM] Token error:', err);
    return null;
  }
}

// Listen for foreground messages
export function onForegroundMessage(callback) {
  if (!messaging) return () => {};
  
  return onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground message:', payload);
    callback(payload);
  });
}

// Subscribe to push notifications with FCM
export async function subscribeWithFCM() {
  const token = await getFCMToken();
  if (!token) return null;
  
  // Save token to backend
  const response = await fetch('/functions/savePushSubscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: `https://fcm.googleapis.com/fcm/send/${token}`,
      keys: {
        auth: '',
        p256dh: ''
      },
      type: 'fcm'
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to save subscription');
  }
  
  return token;
}

export { messaging };