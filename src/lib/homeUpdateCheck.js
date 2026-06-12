// Shared home-page update check.
// DETECTION ONLY: detects new app-code (service worker) and Bible-data caches.
// When an update is found, it ONLY flags the "home update" splash sequence and
// reloads. It does NOT install or activate anything here — doing so would call
// SKIP_WAITING, fire controllerchange, and reload the page before the splash
// could play (resetting to a plain "loading → no updates found" sequence).
//
// After the reload, SplashScreen's home_update flow performs the actual
// "Found updates → Installing → Applying → Checking → Welcome back" steps,
// including downloading Bible data and activating the new service worker.
// When no update is found, resolves false silently (no splash, no reload).

// Fetch the deployed sw.js fresh (bypassing cache) and read its version string
// from the top comment: "// KJB Reader Service Worker vXXXX". Returns null if it
// can't be determined.
async function fetchDeployedSwVersion() {
  try {
    const res = await fetch('/sw.js', { cache: 'no-store' });
    if (!res.ok) return null;
    const text = await res.text();
    const m = text.match(/Service Worker\s+(v[0-9_]+)/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

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

    // Fallback: the SW calls skipWaiting() on install, so a freshly deployed
    // worker often auto-activates before we get here — leaving no waiting/
    // installing worker to detect. Compare the deployed sw.js version against
    // the version we last applied; if it changed, an update is available.
    if (!swUpdated) {
      const deployedVersion = await fetchDeployedSwVersion();
      if (deployedVersion) {
        const applied = localStorage.getItem('kjb-applied-sw-version');
        if (applied && applied !== deployedVersion) {
          swUpdated = true;
        }
        // Record the latest deployed version so the home_update splash can mark
        // it applied once the sequence completes.
        sessionStorage.setItem('kjb-pending-sw-version', deployedVersion);
        // First time we ever see a version, store it so future bumps register.
        if (!applied) localStorage.setItem('kjb-applied-sw-version', deployedVersion);
      }
    }
  }

  // 2. Bible data update
  const { checkForUpdates } = await import('@/lib/bibleCache');
  const bibleNeedsUpdate = await checkForUpdates().catch(() => false);

  if (!swUpdated && !bibleNeedsUpdate) return false;

  // Updates found — flag the splash sequence and reload. The splash (running on
  // the reloaded page) does the install + activate with proper messaging.
  let updateType = 'app';
  if (swUpdated && bibleNeedsUpdate) updateType = 'both';
  else if (bibleNeedsUpdate) updateType = 'bible';

  sessionStorage.setItem('kjb_sw_updated', updateType);
  sessionStorage.setItem('kjb-splash-home-update', 'true');

  setTimeout(() => { window.location.href = window.location.pathname + '?refresh=' + Date.now(); }, 300);
  return true;
}