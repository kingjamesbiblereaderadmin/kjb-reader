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
  'kjb-notifications-enabled',
  'kjb-notif-time',
  'kjb-theme-1611',
  'kjb-position',
  // Indicators — daily/random verse, search, gospel
  'kjb-last-reading',
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
    } else {
      const cloudSettings = existing[0].settings || {};
      const recordId = existing[0].id;

      // PUSH local settings UP first, merging with cloud (local takes priority).
      // This ensures the user's latest local changes are in the cloud BEFORE
      // we pull anything down — preventing a stale cloud value (e.g. an old
      // "light" theme) from overwriting a recent local change (e.g. "dark")
      // when the user reopens the app.
      const hasLocalChanges = SYNC_KEYS.some(
        k => localStorage.getItem(k) !== null && localStorage.getItem(k) !== cloudSettings[k]
      );
      if (hasLocalChanges) {
        const mergedUp = { ...cloudSettings, ...localSettings };
        await base44.entities.UserSetting.update(recordId, { settings: mergedUp });
      }

      // Pull cloud settings DOWN every time. Because we pushed local UP first,
      // local values are already in the cloud — so this only fills in keys
      // that exist in cloud but not locally (cross-device sync). Local values
      // are never overwritten by stale cloud data.
      const effectiveSettings = hasLocalChanges
        ? { ...cloudSettings, ...localSettings }
        : cloudSettings;
      let changed = false;
      Object.entries(effectiveSettings).forEach(([key, val]) => {
        if (SYNC_KEYS.includes(key)) {
          if (localStorage.getItem(key) !== val) {
            localStorage.setItem(key, val);
            changed = true;
          }
        }
      });

      if (changed) {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('kjb-fonts-changed'));
      }
      // Always stamp a local sync-completion time so the Account page can show
      // when the sync actually ran — even when there were no changes to push
      // (the cloud record's updated_date only moves when a write happens).
      try { localStorage.setItem('kjb-last-sync-time', new Date().toISOString()); } catch {}
      window.dispatchEvent(new Event('kjb-settings-synced'));
    }

    if (!_pushListenerStarted) {
      _pushListenerStarted = true;
      _startPushListener();
    }
  } catch (err) {
    console.error('[settingsSync] Cloud sync failed:', err);
  }
}

function _startPushListener() {
  window.addEventListener('storage', _debouncedPush);
  window.addEventListener('kjb-fonts-changed', _debouncedPush);
}

function _stopPushListener() {
  window.removeEventListener('storage', _debouncedPush);
  window.removeEventListener('kjb-fonts-changed', _debouncedPush);
}

function _debouncedPush() {
  if (_pushTimer) clearTimeout(_pushTimer);
  _pushTimer = setTimeout(_pushToCloud, 2000);
}

async function _pushToCloud() {
  if (!(await isAuthed())) return;
  try {
    const localSettings = collectLocalSettings();
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
  _stopPushListener();
  if (_pushTimer) { clearTimeout(_pushTimer); _pushTimer = null; }
}

/**
 * Clears all locally-stored synced settings and the session sync flag.
 * Called on logout so a guest (or next user) on the same device doesn't
 * inherit the previous user's cloud-synced preferences from localStorage.
 */
export function clearLocalSettings() {
  SYNC_KEYS.forEach(key => localStorage.removeItem(key));
}