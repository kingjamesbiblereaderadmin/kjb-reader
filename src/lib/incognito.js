// Detects whether the app is running in a private/incognito browsing context.
// In incognito, persistent storage and PWA install/notifications are unreliable
// (service workers, storage and push are often blocked or wiped), so the UI
// shows a warning banner.
//
// Modern browsers no longer cap incognito storage as aggressively, so the old
// quota-only heuristic missed many cases. We now combine several signals:
//  1. Storage quota relative to device memory (the most reliable on Chromium).
//  2. Failure to open IndexedDB (Firefox private mode blocks it).
//  3. localStorage being unavailable.
// Resolves to a boolean (defaults to false on any error).
//
// The result is memoized: the first call runs the actual detection and every
// subsequent call (from any component) reuses the same promise. This ensures
// the HomePage banner, Settings, and the FirstLoadPrompt all agree — previously
// each component ran its own async check and could disagree due to per-call
// IndexedDB/quota variance.
let _incognitoPromise = null;
export function detectIncognito() {
  if (!_incognitoPromise) {
    _incognitoPromise = _runDetection();
  }
  return _incognitoPromise;
}

async function _runDetection() {
  if (typeof navigator === 'undefined') return false;

  try {
    // Firefox private mode: IndexedDB is blocked / throws.
    const idbBlocked = await new Promise((resolve) => {
      try {
        if (!window.indexedDB) return resolve(true);
        const req = window.indexedDB.open('kjb-incognito-test');
        req.onsuccess = () => {
          try { req.result.close(); window.indexedDB.deleteDatabase('kjb-incognito-test'); } catch {}
          resolve(false);
        };
        req.onerror = () => resolve(true);
      } catch {
        resolve(true);
      }
    });
    if (idbBlocked) return true;

    // localStorage unavailable (some private modes block writes).
    try {
      const k = '__kjb_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
    } catch {
      return true;
    }

    // Chromium (Chrome/Edge/Brave) Incognito / InPrivate / Guest:
    // In private mode the temporary-storage quota is hard-capped at a small,
    // fixed value tied to device memory, whereas a NORMAL session reports a
    // quota proportional to free disk (always far larger). The proven, low
    // false-positive signal used by the `detectIncognito` library is:
    //   private quota ≈ (deviceMemory or 8) * 1024^3 * 2 * 0.0001  ... very small,
    // i.e. private quota is roughly ≤ 0.12 × the total disk-based quota a normal
    // window reports. In practice, private mode reports quota under ~700MB on
    // typical machines while normal windows report many GB. We use the
    // device-memory-relative cap which scales correctly across machines.
    if (navigator.storage && navigator.storage.estimate) {
      const { quota } = await navigator.storage.estimate();
      if (typeof quota === 'number' && quota > 0) {
        const deviceMemoryGB = navigator.deviceMemory || 8; // Chromium only; GB
        // Normal Chromium quota ≈ 60% of free disk (tens of GB). Private mode is
        // capped near deviceMemory-scaled bytes. This ceiling sits well below a
        // normal session's quota but above the private cap.
        const privateCeiling = deviceMemoryGB * 0.5 * 1024 * 1024 * 1024;
        if (quota < privateCeiling) {
          return true;
        }
      }
    }
  } catch {
    // ignore — fall through to "not incognito"
  }
  return false;
}