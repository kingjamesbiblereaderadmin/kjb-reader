// Shared home-page update check.
// Detects new app-code (service worker) and Bible-data caches. When an update
// is found, it downloads the new Bible data, activates the new service worker,
// flags the splash "home update" sequence, and reloads — so the splash screen
// plays "Found updates → Installing → Applying → Checking → Welcome back".
// When no update is found, resolves false silently (no splash, no toast).

export async function checkHomeForUpdates() {
  if (typeof navigator === 'undefined' || !navigator.onLine) return false;

  // 1. App code update — a new service worker waiting/installing
  let swUpdated = false;
  if ('serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
    if (reg) {
      await reg.update().catch(() => {});
      if (reg.waiting) {
        swUpdated = true;
      } else if (reg.installing) {
        if (reg.installing.state === 'installed') {
          swUpdated = true;
        } else {
          swUpdated = await new Promise(resolve => {
            const worker = reg.installing;
            worker.addEventListener('statechange', () => {
              if (worker.state === 'installed') resolve(true);
              else if (worker.state === 'redundant') resolve(false);
            });
            setTimeout(() => resolve(false), 5000);
          });
        }
      }
    }
  }

  // 2. Bible data update
  const { checkForUpdates, downloadBibleForOffline } = await import('@/lib/bibleCache');
  const bibleNeedsUpdate = await checkForUpdates().catch(() => false);

  if (!swUpdated && !bibleNeedsUpdate) return false;

  // Updates found — apply and trigger splash
  let updateType = 'app';
  if (swUpdated && bibleNeedsUpdate) updateType = 'both';
  else if (bibleNeedsUpdate) updateType = 'bible';

  if (bibleNeedsUpdate) {
    localStorage.removeItem('bible_cache_version');
    localStorage.removeItem('bible_last_refresh');
    await downloadBibleForOffline();
  }

  sessionStorage.setItem('kjb_sw_updated', updateType);
  sessionStorage.setItem('kjb-splash-home-update', 'true');

  if (swUpdated && 'serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
    sessionStorage.setItem('kjb_last_app_update', Date.now().toString());
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    } else if (reg?.installing && ['installed', 'activating', 'activated'].includes(reg.installing.state)) {
      reg.installing.postMessage({ type: 'SKIP_WAITING' });
    }
    return true; // main.jsx reloads on controllerchange
  }

  setTimeout(() => { window.location.href = window.location.pathname + '?refresh=' + Date.now(); }, 500);
  return true;
}