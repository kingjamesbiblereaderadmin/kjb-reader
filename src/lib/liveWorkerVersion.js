// Ask the ACTUAL running service worker for its live version (its CACHE_NAME).
// This is the single source of truth for "what worker is really running" — far
// more reliable than a hardcoded constant in the UI, which drifts out of sync.
//
// Returns the version string (e.g. "v20260713_2200") or null if there's no
// active service worker (e.g. dev, unsupported browser, or not yet registered).
export function getLiveWorkerVersion(timeoutMs = 3000) {
  return new Promise((resolve) => {
    try {
      if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
        resolve(null);
        return;
      }
      const sw = navigator.serviceWorker.controller;
      if (!sw) {
        resolve(null);
        return;
      }

      const channel = new MessageChannel();
      let done = false;
      const finish = (val) => {
        if (done) return;
        done = true;
        resolve(val);
      };

      channel.port1.onmessage = (event) => {
        if (event.data && event.data.type === 'VERSION') {
          finish(event.data.version || null);
        }
      };

      sw.postMessage({ type: 'GET_VERSION' }, [channel.port2]);
      setTimeout(() => finish(null), timeoutMs);
    } catch {
      resolve(null);
    }
  });
}