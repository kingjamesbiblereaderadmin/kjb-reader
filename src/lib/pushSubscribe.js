// Real Web Push subscription (works even when the app is fully closed) —
// separate from the app's existing on-device-only reminder system in
// notifications.js. Call subscribeToPush() once notification permission has
// been granted; it registers with the browser's push service and stores the
// subscription server-side so sendDailyPush can reach this device later.

// Public key only — safe to ship in client code by design (pairs with the
// private key that stays server-side as a Base44 secret).
const VAPID_PUBLIC_KEY = 'BACu5VEM85EpqiXmSZodCVk1SCIyCPh0iNgQr-k_ng1Z0gx86EmYmKJ49dN_fBP7UN3iT5QEFMr8DdKqkNOXFyU';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export async function subscribeToPush(reg) {
  if (!('PushManager' in window)) {
    console.log('[Push] PushManager not supported on this browser');
    return null;
  }
  try {
    const registration = reg || (await navigator.serviceWorker.ready);

    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    const res = await fetch(`/api/apps/6a05d76723afe58d80c589e8/functions/subscribePush`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription.toJSON()),
    });
    if (!res.ok) {
      console.warn('[Push] Server rejected subscription:', res.status);
      return null;
    }
    console.log('[Push] Subscribed for real (works while app closed)');
    return subscription;
  } catch (err) {
    console.warn('[Push] subscribeToPush failed:', err.message);
    return null;
  }
}

export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) await subscription.unsubscribe();
  } catch (err) {
    console.warn('[Push] unsubscribeFromPush failed:', err.message);
  }
}

// True only if a real push notification actually fired today (not just
// that a subscription exists — a subscribed device that was offline when
// the daily cron ran still needs the offline on-open fallback below).
export async function pushDeliveredToday() {
  if (!('caches' in window)) return false;
  try {
    const cache = await caches.open('kjb-push-log');
    const res = await cache.match('/__push-last-fired');
    if (!res) return false;
    const dateStr = await res.text();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return dateStr === todayStr;
  } catch {
    return false;
  }
}
