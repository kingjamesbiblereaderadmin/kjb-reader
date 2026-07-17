import { base44 } from '@/api/base44Client';

const LOGO_URL = 'https://base44.app/api/apps/6a05d76723afe58d80c589e8/files/mp/public/6a05d76723afe58d80c589e8/c2459f3df_kjb-icon512-v20260713.png';
const STORAGE_KEY = 'kjb-splash-logo-dataurl';

/**
 * Returns the splash logo src — a base64 data URL from localStorage if cached
 * (works fully offline), otherwise the cross-origin URL (needs network).
 */
export function getSplashLogo() {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) return cached;
  } catch {}
  return LOGO_URL;
}

/**
 * Fetches the logo via the fetchLogoBase64 backend function and caches the
 * base64 data URL in localStorage. The cross-origin logo URL can't be reliably
 * cached by the service worker (opaque responses are fragile), so we store it
 * as a data URI that works offline without any SW dependency.
 *
 * Called on app load when online. No-ops if already cached or offline.
 */
export async function cacheSplashLogo() {
  try {
    if (navigator.onLine === false) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {}
    const res = await base44.functions.invoke('fetchLogoBase64', {});
    if (res?.data?.dataUrl) {
      try {
        localStorage.setItem(STORAGE_KEY, res.data.dataUrl);
      } catch (e) {
        // localStorage might be full — clear the old key and retry once
        try {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.setItem(STORAGE_KEY, res.data.dataUrl);
        } catch {}
      }
    }
  } catch (e) {
    console.warn('[SplashLogo] Failed to cache logo:', e?.message || e);
  }
}