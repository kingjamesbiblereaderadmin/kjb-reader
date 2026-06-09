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

    // Chromium (Chrome/Edge/Brave) Incognito / InPrivate / Guest — two signals,
    // either one positive means private (OR), to cover all Chromium versions:
    //
    // Signal A — Storage quota cap (the proven `detectIncognito` library trick):
    // In private mode Chromium hard-caps the temporary-storage quota at ~1.07 GB
    // regardless of disk size, whereas a NORMAL window reports a quota that is a
    // large fraction of free disk (always many GB on modern devices, and always
    // far above the jsHeapSizeLimit). We flag private when the quota sits at or
    // below the documented private ceiling.
    if (navigator.storage && navigator.storage.estimate) {
      try {
        const { quota } = await navigator.storage.estimate();
        // 1.1 GB ceiling — Chromium private quota is ~1.07 GB; normal windows
        // report far more. Devices with <2GB total quota are essentially
        // nonexistent for desktop Chrome/Edge where InPrivate exists.
        if (typeof quota === 'number' && quota > 0 && quota < 1_181_116_006) {
          return true;
        }
      } catch {}
    }

    // Signal B — legacy temporary-filesystem API (older Chromium builds):
    // DISABLED in private mode (error callback), succeeds in normal windows.
    const fs = window.requestFileSystem || window.webkitRequestFileSystem;
    if (fs) {
      const privateViaFS = await new Promise((resolve) => {
        try {
          fs(
            0,    // 0 = TEMPORARY
            100,  // 100 bytes requested
            () => resolve(false), // success → normal window
            () => resolve(true)   // error → private mode
          );
        } catch {
          resolve(true);
        }
      });
      return privateViaFS;
    }
  } catch {
    // ignore — fall through to "not incognito"
  }
  return false;
}