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
export async function detectIncognito() {
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
    if (navigator.storage && navigator.storage.estimate) {
      const { quota } = await navigator.storage.estimate();
      if (typeof quota === 'number') {
        // Modern Chromium private modes (Incognito / Edge InPrivate / Guest)
        // no longer hard-cap quota at ~120MB — they report a quota tied to
        // deviceMemory (e.g. ~1-2GB). A normal session instead reports a quota
        // based on free disk space, which is far larger. So we flag incognito
        // when the quota is capped relative to the device's RAM.
        const mem = navigator.deviceMemory; // in GB, Chromium only
        if (mem) {
          // Incognito caps quota at roughly (deviceMemory * 2GB) but never above
          // a low ceiling. A normal session almost always exceeds this.
          const incognitoCeiling = Math.min(mem * 1024 * 1024 * 1024, 2 * 1024 * 1024 * 1024);
          if (quota <= incognitoCeiling) {
            return true;
          }
        } else if (quota < 300 * 1024 * 1024) {
          // Fallback for browsers without deviceMemory.
          return true;
        }
      }
    }
  } catch {
    // ignore — fall through to "not incognito"
  }
  return false;
}