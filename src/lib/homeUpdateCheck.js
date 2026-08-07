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

// Fetch the deployed SW version. Prefer the dynamic manifest endpoint (always
// served no-store, so it's the reliable source of "what's deployed right now")
// over /sw.js, which the browser SW-script cache and edge caches can serve
// stale for hours after a deploy — that staleness caused the home-update prompt
// to never fire even after a version bump. Falls back to parsing /sw.js.
async function fetchDeployedSwVersion() {
  try {
    const res = await fetch('/functions/manifest', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json().catch(() => null);
      if (json?.version) return json.version;
    }
  } catch {}
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

  // Guard against a premature background reload: calling reg.update() below can
  // install AND auto-activate a freshly-deployed worker (it calls skipWaiting),
  // which fires controllerchange in main.jsx. If the home-update splash flag
  // isn't set yet, main.jsx would reload first and drop us into the
  // "subsequent" flow ("LOADING → CHECKING"). Set the flag up-front so
  // main.jsx's controllerchange guard blocks that reload. We clear it again at
  // the end if no update was actually found.
  sessionStorage.setItem('kjb-splash-home-update', 'true');

  // 1. App code update — a new service worker waiting/installing
  let swUpdated = false;
  let deployedVersion = null;
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

    // Version-comparison fallback. This runs even when swUpdated was already
    // set true via reg.waiting, so we always know the deployed version and can
    // stash it as pending for the post-reload splash to mark applied. Without
    // this, detection via reg.waiting left kjb-pending-sw-version unset, so the
    // splash never advanced kjb-applied-sw-version and the same bump re-fired
    // on every subsequent visit.
    deployedVersion = await fetchDeployedSwVersion();
    if (deployedVersion) {
      const applied = localStorage.getItem('kjb-applied-sw-version');
      if (applied && applied !== deployedVersion) {
        swUpdated = true;
      }
      try { sessionStorage.setItem('kjb-pending-sw-version', deployedVersion); } catch {}
      // First time we ever see a version, store it so future bumps register.
      if (!applied) localStorage.setItem('kjb-applied-sw-version', deployedVersion);
    }
  }

  // 2. Bible data update
  const { checkForUpdates, CACHE_VERSION } = await import('@/lib/bibleCache');
  const bibleNeedsUpdate = await checkForUpdates().catch(() => false);

  if (!swUpdated && !bibleNeedsUpdate) {
    // No real update — clear the pre-emptive flag so the next normal load
    // doesn't wrongly start in the home-update flow.
    sessionStorage.removeItem('kjb-splash-home-update');
    return false;
  }

  // GUARD AGAINST A RELOAD LOOP: only reload ONCE per deployed version.
  // The post-reload splash installs the update and *tries* to mark it applied,
  // but if that step is unreliable (e.g. an IndexedDB write that doesn't
  // persist, or the splash flow erroring out early), the same update would be
  // re-detected on the next check and reload again — forever. By recording the
  // versions as "seen for reload" HERE, before reloading, we ensure the reload
  // fires at most once for a given SW + Bible version pair.
  try {
    const deployedSw = await fetchDeployedSwVersion();
    const lastReloadKey = `${deployedSw || 'nosw'}|${CACHE_VERSION}`;
    if (sessionStorage.getItem('kjb-home-reload-key') === lastReloadKey) {
      // Already reloaded once for this exact version pair this session —
      // don't loop. Clear the pending flag and carry on normally.
      sessionStorage.removeItem('kjb-splash-home-update');
      return false;
    }
    sessionStorage.setItem('kjb-home-reload-key', lastReloadKey);
  } catch {}

  // Updates found — flag the splash sequence and reload. The splash (running on
  // the reloaded page) does the install + activate with proper messaging.
  let updateType = 'app';
  if (swUpdated && bibleNeedsUpdate) updateType = 'both';
  else if (bibleNeedsUpdate) updateType = 'bible';

  sessionStorage.setItem('kjb_sw_updated', updateType);
  // kjb-splash-home-update already set at the top of this function.

  setTimeout(() => { window.location.href = window.location.pathname + '?refresh=' + Date.now(); }, 300);
  return true;
}