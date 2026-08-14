import { base44 } from '@/api/base44Client';

// VAPID public key (base64url). The matching private key is held server-side
// by the sendDailyVersePush backend function. Generated once for this app.
const VAPID_PUBLIC_KEY = 'BM1gPbiq0-DaYTv7qJe386uR3niuXmH5SQB_H51u9vp-8BQQupYxGqP2mwyj_e7kw2_lJI6NuE7zh8Zl_kYNHnY';

function urlB64ToUint8Array(base64) {
  const padding = '='.repeat((4 - base64.length % 4) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

function bufToB64url(buf) {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Subscribe this device to web push and persist the subscription so the
// sendDailyVersePush backend function can reach it. Requires a logged-in user
// (the PushSubscription entity is user-scoped).
export async function subscribePush(reg) {
  try {
    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY),
    });
    const p256dh = sub.getKey('p256dh') ? bufToB64url(sub.getKey('p256dh')) : '';
    const auth = sub.getKey('auth') ? bufToB64url(sub.getKey('auth')) : '';
    const payload = {
      endpoint: sub.endpoint,
      p256dh,
      auth,
      expiration_time: sub.expirationTime ?? null,
      // Capture the subscriber's local timezone so the daily push is
      // delivered at their local 8am.
      timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone) || 'Asia/Singapore',
    };
    // Avoid duplicates for this user/device.
    const existing = await base44.entities.PushSubscription.filter({ endpoint: sub.endpoint });
    if (!existing || !existing.length) {
      await base44.entities.PushSubscription.create(payload);
    }
    return sub;
  } catch (err) {
    console.warn('[Push] subscribe failed:', err);
    return null;
  }
}

// Unsubscribe this device and remove its stored subscription.
export async function unsubscribePush() {
  try {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();
      const mine = await base44.entities.PushSubscription.filter({ endpoint });
      if (mine && mine.length) {
        await Promise.all(mine.map((m) => base44.entities.PushSubscription.delete(m.id)));
      }
    }
  } catch (err) {
    console.warn('[Push] unsubscribe failed:', err);
  }
}