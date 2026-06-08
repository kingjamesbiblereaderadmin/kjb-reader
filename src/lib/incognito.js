// Detects whether the app is running in a private/incognito browsing context.
// In incognito, persistent storage and PWA install/notifications are unreliable
// (service workers, storage and push are often blocked or wiped), so the UI
// hides the Install App and Notification sections.
//
// Uses the StorageManager quota heuristic: incognito sessions report a much
// smaller temporary-storage quota than normal sessions. Resolves to a boolean.
export async function detectIncognito() {
  if (typeof navigator === 'undefined') return false;
  try {
    if (navigator.storage && navigator.storage.estimate) {
      const { quota } = await navigator.storage.estimate();
      // Normal sessions get quotas in the GBs; incognito caps far lower.
      if (typeof quota === 'number' && quota < 120 * 1024 * 1024) {
        return true;
      }
    }
  } catch {
    // ignore — fall through to "not incognito"
  }
  return false;
}