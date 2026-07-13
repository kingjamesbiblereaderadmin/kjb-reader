// Detect whether a newer service worker (app code) version has been deployed.
// The SW calls skipWaiting() on install, so a freshly-deployed worker usually
// auto-activates before any page code runs — leaving no waiting/installing
// worker to detect. Instead we fetch sw.js fresh and compare its version
// string ("// KJB Reader Service Worker vXXXX") against the version we last
// marked applied (kjb-applied-sw-version).

export async function fetchDeployedSwVersion() {
  // Prefer the runtime version bumped from DevTools (served by the manifest
  // function) so a version bump reaches clients without a code deploy. Falls
  // back to the version string baked into sw.js.
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
    const m = text.match(/Service Worker\s+(v?[a-zA-Z0-9_-]+)/i);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

// Returns true if the deployed SW version differs from the last applied version.
// Also stashes the deployed version in sessionStorage('kjb-pending-sw-version')
// so the splash flow can mark it applied once it finishes.
export async function isSwUpdateAvailable() {
  const deployedVersion = await fetchDeployedSwVersion();
  if (!deployedVersion) return false;

  const applied = localStorage.getItem('kjb-applied-sw-version');
  try { sessionStorage.setItem('kjb-pending-sw-version', deployedVersion); } catch {}

  if (!applied) {
    // First time we ever see a version — record it so future bumps register.
    try { localStorage.setItem('kjb-applied-sw-version', deployedVersion); } catch {}
    return false;
  }
  return applied !== deployedVersion;
}

// Mark the pending deployed version as applied (call after a splash flow that
// applied updates completes).
export function markSwVersionApplied() {
  try {
    const pending = sessionStorage.getItem('kjb-pending-sw-version');
    if (pending) {
      localStorage.setItem('kjb-applied-sw-version', pending);
      sessionStorage.removeItem('kjb-pending-sw-version');
    }
  } catch {}
}