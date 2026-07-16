import { base44 } from '@/api/base44Client';

// localStorage keys that should sync across devices for signed-in users.
// Excludes: large blobs (daily verse bg image, notif image), device-specific
// flags (install status, last route, prompt dismissed), and cache version markers.
const SYNC_KEYS = [
  'kjb-zoom',
  'kjb-reader-font-family',
  'kjb-verse-font-family',
  'kjb-verse-text-color',
  'kjb-verse-text-opacity',
  'kjb-verse-panel-visible',
  'kjb-a11y-font',
  'kjb-theme-mode',
  'kjb-colour',
  'kjb-color-mode',
  'kjb-custom-accent',
  'kjb-footer-mode',
  'kjb-footer-auto-hide-enabled',
  'kjb-footer-hide-time',
  'kjb-notifications-enabled',
  'kjb-notification-time',
  'kjb-theme-1611',
  'kjb-position',
  // Indicators — daily/random verse, search, gospel
  'kjb-last-reading',
  'kjb-search-results',
  'kjb-search-term',
  'kjb-search-index',
  'kjb-search-total',
  'kjb-gospel-results',
  'kjb-gospel-index',
  'kjb-reader-toolbar-state',
  // Reading layout preferences (paragraph/line mode, column mode)
  'kjb-flow',
  'kjb-column',
];

let _pushListenerStarted = false;
let _pushTimer = null;
let _pullTimer = null;
let _periodicTimer = null;
// Snapshot of the last settings we pushed to the cloud. Used to skip
// unnecessary API calls when nothing has changed, and by the periodic
// safety-net timer to detect writes that missed the storage event dispatch.
let _lastPushedSnapshot = null;
let _patched = false;
// True while we're writing cloud-pulled values INTO localStorage. Suppresses
// the push listener so we don't immediately push back (redundant API call /
// race with the other tab that just pushed).
let _applyingCloud = false;

// Monkey-patch localStorage.setItem / removeItem so that any write to a synced
// key automatically dispatches a 'storage' event. Same-tab localStorage writes
// don't fire storage events natively, so without this the cloud push never
// triggers for the 60+ places across the app that write synced keys. This
// catches every write — current and future — in one place.
// Applied at module load (not inside syncSettingsFromCloud) so the patch is
// active even if the first cloud sync fails — otherwise no push would ever fire.
function _patchLocalStorage() {
  if (_patched) return;
  _patched = true;
  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);
  localStorage.setItem = function(key, value) {
    originalSetItem(key, value);
    if (SYNC_KEYS.includes(key)) {
      window.dispatchEvent(new Event('storage'));
    }
  };
  localStorage.removeItem = function(key) {
    originalRemoveItem(key);
    if (SYNC_KEYS.includes(key)) {
      window.dispatchEvent(new Event('storage'));
    }
  };
}
// Apply immediately on module load — don't wait for a successful sync.
_patchLocalStorage();
// Register the push listener immediately too. _pushToCloud checks isAuthed()
// internally, so it's safe even when the user isn't signed in yet — the push
// just becomes a no-op until auth succeeds.
_startPushListener();

async function isAuthed() {
  try {
    return await base44.auth.isAuthenticated();
  } catch {
    return false;
  }
}

function collectLocalSettings() {
  const settings = {};
  SYNC_KEYS.forEach(key => {
    const val = localStorage.getItem(key);
    if (val !== null) settings[key] = val;
  });
  return settings;
}

/**
 * Downloads settings from the cloud and applies them to localStorage.
 * If no cloud settings exist yet, pushes local settings up.
 * Called automatically when the user authenticates.
 */
export async function syncSettingsFromCloud() {
  if (!(await isAuthed())) return;

  try {
    const existing = await base44.entities.UserSetting.list('-updated_date', 1);
    const localSettings = collectLocalSettings();

    if (existing.length === 0) {
      // First sign-in ever: push local settings to cloud
      if (Object.keys(localSettings).length > 0) {
        await base44.entities.UserSetting.create({ settings: localSettings });
      }
      try { localStorage.setItem('kjb-last-sync-time', new Date().toISOString()); } catch {}
      window.dispatchEvent(new Event('kjb-settings-synced'));
    } else {
      const cloudSettings = existing[0].settings || {};
      const recordId = existing[0].id;

      // PULL cloud DOWN first — cloud is the source of truth for cross-device
      // sync. This must happen BEFORE any push, so that a fresh device's local
      // defaults (e.g. "serif" font, "light" theme) don't overwrite the user's
      // actual cloud settings. Real-time local changes are pushed up separately
      // by the _debouncedPush listener whenever the user changes a setting.
      //
      // _applyingCloud suppresses the push listener while we write cloud values
      // into localStorage — otherwise each setItem triggers a synthetic storage
      // event → _debouncedPush → redundant push of the very data we just pulled.
      _applyingCloud = true;
      const cloudKeys = new Set(Object.keys(cloudSettings));
      let changed = false;
      Object.entries(cloudSettings).forEach(([key, val]) => {
        if (SYNC_KEYS.includes(key)) {
          if (localStorage.getItem(key) !== val) {
            localStorage.setItem(key, val);
            changed = true;
          }
        }
      });
      _applyingCloud = false;

      // Update the snapshot so the next _pushToCloud sees the freshly-pulled
      // state as "already known" and skips a redundant push.
      _lastPushedSnapshot = JSON.stringify(collectLocalSettings());

      if (changed) {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('kjb-fonts-changed'));
      }

      // Push local UP only for keys that exist locally but NOT in cloud
      // (i.e. new local settings the user added that haven't synced yet).
      // Don't push keys that differ from cloud — those are either defaults
      // (which should be overwritten by cloud) or real-time changes already
      // handled by _debouncedPush.
      const localOnly = {};
      let hasLocalOnly = false;
      SYNC_KEYS.forEach(key => {
        const val = localStorage.getItem(key);
        if (val !== null && !cloudKeys.has(key)) {
          localOnly[key] = val;
          hasLocalOnly = true;
        }
      });
      if (hasLocalOnly) {
        const mergedUp = { ...cloudSettings, ...localOnly };
        await base44.entities.UserSetting.update(recordId, { settings: mergedUp });
      }

      try { localStorage.setItem('kjb-last-sync-time', new Date().toISOString()); } catch {}
      window.dispatchEvent(new Event('kjb-settings-synced'));
    }

    _startPushListener();
  } catch (err) {
    console.error('[settingsSync] Cloud sync failed:', err);
  }
}

function _startPushListener() {
  if (_pushListenerStarted) return;
  _pushListenerStarted = true;

  // CRITICAL: distinguish same-tab writes from cross-tab writes.
  // - Same-tab: the monkey-patch dispatches a synthetic Event('storage')
  //   (NOT a StorageEvent). We PUSH our change to the cloud.
  // - Cross-tab: the browser fires a native StorageEvent with .key set.
  //   Another tab/device changed something — we PULL from cloud, never push
  //   (pushing would overwrite the other tab's change with our stale state).
  window.addEventListener('storage', (e) => {
    if (_applyingCloud) return;
    if (e instanceof StorageEvent && e.key) {
      // Native cross-tab event — pull the latest from cloud.
      _debouncedPull();
    } else {
      // Synthetic same-tab event — push our change up.
      _debouncedPush();
    }
  });
  window.addEventListener('kjb-fonts-changed', _debouncedPush);
  // Safety-net: periodically check if local settings have drifted from the
  // last pushed snapshot. With the localStorage patch this is mostly redundant,
  // but kept as a backup. The snapshot comparison makes it a no-op when idle.
  if (_periodicTimer) clearInterval(_periodicTimer);
  _periodicTimer = setInterval(_debouncedPush, 5_000);
}

function _stopPushListener() {
  window.removeEventListener('storage', _debouncedPush);
  window.removeEventListener('kjb-fonts-changed', _debouncedPush);
  if (_periodicTimer) { clearInterval(_periodicTimer); _periodicTimer = null; }
  if (_pullTimer) { clearTimeout(_pullTimer); _pullTimer = null; }
}

function _debouncedPush() {
  if (_applyingCloud) return;
  if (_pushTimer) clearTimeout(_pushTimer);
  _pushTimer = setTimeout(_pushToCloud, 800);
}

function _debouncedPull() {
  if (_pullTimer) clearTimeout(_pullTimer);
  _pullTimer = setTimeout(syncSettingsFromCloud, 300);
}

async function _pushToCloud() {
  if (!(await isAuthed())) return;
  try {
    const localSettings = collectLocalSettings();
    // Skip the API call entirely if nothing has changed since the last push.
    // This makes the periodic safety-net timer essentially free when idle.
    const snapshot = JSON.stringify(localSettings);
    if (_lastPushedSnapshot !== null && snapshot === _lastPushedSnapshot) return;
    _lastPushedSnapshot = snapshot;

    const existing = await base44.entities.UserSetting.list('-updated_date', 1);
    if (existing.length === 0) {
      await base44.entities.UserSetting.create({ settings: localSettings });
    } else {
      await base44.entities.UserSetting.update(existing[0].id, { settings: localSettings });
    }
  } catch (err) {
    console.error('[settingsSync] Cloud push failed:', err);
  }
}

export function resetSettingsSync() {
  _pushListenerStarted = false;
  _lastPushedSnapshot = null;
  _applyingCloud = false;
  _stopPushListener();
  if (_pushTimer) { clearTimeout(_pushTimer); _pushTimer = null; }
  if (_pullTimer) { clearTimeout(_pullTimer); _pullTimer = null; }
}

/**
 * Clears all locally-stored synced settings and the session sync flag.
 * Called on logout so a guest (or next user) on the same device doesn't
 * inherit the previous user's cloud-synced preferences from localStorage.
 */
export function clearLocalSettings() {
  SYNC_KEYS.forEach(key => localStorage.removeItem(key));
}