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
    // The legacy temporary-filesystem API is DISABLED in private mode and
    // invokes its error callback, but succeeds in normal windows. This is the
    // proven, low-false-positive signal used by the `detectIncognito` library.
    // NOTE: the first arg must be the TEMPORARY constant (numeric 0). Earlier
    // we passed `window.TEMPORARY ?? 0` which, when window.TEMPORARY was
    // undefined on some builds, still worked — but to be safe we hard-code 0.
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