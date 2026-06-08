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

    // Chromium incognito: the temporary-storage quota is capped at roughly
    // 10% of total disk in normal mode, but is hard-limited to ~1.07GB in
    // incognito. Treat a quota at/under ~1.2GB as incognito — normal desktop
    // sessions report far larger quotas (tens of GB).
    if (navigator.storage && navigator.storage.estimate) {
      const { quota } = await navigator.storage.estimate();
      if (typeof quota === 'number' && quota < 1300 * 1024 * 1024) {
        return true;
      }
    }
  } catch {
    // ignore — fall through to "not incognito"
  }
  return false;
}