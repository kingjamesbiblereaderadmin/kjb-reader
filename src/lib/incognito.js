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

    // Chromium incognito: the temporary-storage quota is hard-limited
    // (historically ~1.07GB, newer versions ~2GB or tied to deviceMemory),
    // whereas normal sessions report ~10% of free disk (tens of GB). We treat
    // the session as incognito when the quota is suspiciously small relative
    // to the device's memory, or under a fixed ~2GB ceiling.
    // Chromium private modes (Incognito / Edge InPrivate / Guest) cap the
    // storage quota at a low fixed amount (~1GB or 2× free temporary storage),
    // while a NORMAL session reports a quota based on free disk space — almost
    // always much larger AND scaling with total quota. The most reliable signal
    // that works across modern Chrome/Edge is: in private mode, quota is capped
    // at ~1.07GB (or close to it), regardless of disk size.
    if (navigator.storage && navigator.storage.estimate) {
      const { quota } = await navigator.storage.estimate();
      if (typeof quota === 'number' && quota > 0) {
        // Chromium private modes (Incognito / Edge InPrivate / Guest) cap the
        // quota relative to device memory — roughly 2× deviceMemory (in GB),
        // and never more than ~2GB. A NORMAL session reports a quota based on
        // free disk (typically tens of GB). So flag private mode when:
        //   • the quota is at/under a ~2GB ceiling, OR
        //   • the quota is small relative to the device's RAM.
        const GB = 1024 * 1024 * 1024;
        const deviceMemoryGB = navigator.deviceMemory || 8; // GB (Chromium only)
        const privateCeiling = Math.max(2 * GB, deviceMemoryGB * 2 * GB * 0.6);
        if (quota <= privateCeiling) {
          return true;
        }
      }
    }
  } catch {
    // ignore — fall through to "not incognito"
  }
  return false;
}