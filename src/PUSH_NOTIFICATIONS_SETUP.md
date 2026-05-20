# Android Push Notifications Setup Guide

## Current Status
✅ Service worker configured for push notifications
✅ Push subscription storage implemented
✅ Notification click handling implemented
✅ Periodic sync for background notifications

## What's Already Working

### 1. Service Worker (`/sw.js`)
- Handles `push` events for receiving notifications
- Shows notifications via `self.registration.showNotification()`
- Handles notification clicks to open the app
- Supports periodic background sync (Android only)

### 2. Backend Functions
- `savePushSubscription`: Stores user push subscriptions
- `sendPushNotification`: Sends notifications to all subscribers (admin only)

### 3. Frontend Helpers (`lib/pushNotifications.js`)
- `isPushSupported()`: Check if browser supports push
- `requestNotificationPermission()`: Request permission
- `subscribeToPush()`: Subscribe to push notifications
- `initPushNotifications()`: Initialize push

## For Basic Notifications (Already Working)

The app currently supports notifications through:
1. **Periodic Background Sync** - Android checks every hour for new verses
2. **In-page timers** - When app is open or in background tab
3. **On-app-open checks** - Notifies if verse is overdue when user opens app

## For Production Push Notifications (Optional)

To send push notifications from your server to users' devices (even when app is closed), you need:

### Option 1: Firebase Cloud Messaging (FCM) - Recommended for Android

#### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com
2. Create a new project (or use existing)
3. Add a web app to your Firebase project
4. Copy the Firebase configuration

#### Step 2: Install Firebase SDK
```bash
npm install firebase
```

#### Step 3: Update `lib/pushNotifications.js`
```javascript
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export async function subscribeToFCM() {
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;
  
  const token = await getToken(messaging, {
    vapidKey: 'YOUR_VAPID_KEY_FROM_FIREBASE'
  });
  
  // Send token to your backend
  await fetch('/functions/savePushSubscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: 'https://fcm.googleapis.com/fcm/send/' + token,
      keys: { auth: '', p256dh: '' }
    })
  });
  
  return token;
}
```

#### Step 4: Send Notifications via Firebase
Use Firebase Admin SDK or REST API to send notifications to stored tokens.

### Option 2: Web Push with VAPID Keys

#### Step 1: Generate VAPID Keys
```bash
npx web-push generate-vapid-keys
```
Or use: https://tools.reactpwa.com/vapid

#### Step 2: Set Base44 Secrets
Go to DASHBOARD → SETTINGS → SECRETS and add:
- `VAPID_PUBLIC_KEY`: Your public key
- `VAPID_PRIVATE_KEY`: Your private key
- `VAPID_SUBJECT`: Your email or URL

#### Step 3: Update Backend Functions
The functions already support VAPID - just uncomment the web-push imports once secrets are set.

## Testing Push Notifications

### Test 1: Check Service Worker Registration
```javascript
// In browser console
navigator.serviceWorker.getRegistration().then(reg => {
  console.log('SW registered:', !!reg);
  console.log('Push supported:', 'PushManager' in window);
});
```

### Test 2: Request Permission
```javascript
import { requestNotificationPermission } from '@/lib/notifications';
const result = await requestNotificationPermission();
console.log('Permission:', result);
```

### Test 3: Send Test Notification (Admin Only)
```javascript
import { base44 } from '@/api/base44Client';
const result = await base44.functions.invoke('sendPushNotification', {
  title: 'Test Notification',
  body: 'This is a test!',
  url: '/'
});
console.log('Result:', result);
```

## Current Implementation Notes

1. **No VAPID Required**: The current implementation works without VAPID keys for basic browser notifications
2. **Periodic Sync**: Android devices with app installed can receive notifications via periodic background sync
3. **Fallback Strategy**: Multiple notification methods ensure maximum compatibility:
   - Push API (when available)
   - Periodic background sync (Android)
   - In-page timers (when app is open)
   - On-open checks (catches missed notifications)

## Troubleshooting

### Notifications Not Showing on Android
1. Ensure app is installed to home screen (not just browser)
2. Check notification permission in browser settings
3. Verify service worker is registered: `navigator.serviceWorker.controller`
4. Check Chrome settings: Site settings → Notifications

### Periodic Sync Not Working
- Only works on Android when app is installed
- Requires Chrome 91+
- May be limited by battery optimization settings
- Falls back to on-open checks

### Push Subscription Fails
- Check browser supports PushManager
- Ensure HTTPS or localhost
- Try in Chrome/Edge (best support)

## Resources
- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Web Push Best Practices](https://web.dev/push-notifications-overview/)