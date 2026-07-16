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
];

let _synced = false;
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
  if (_synced) return;
  if (!(await isAuthed())) return;

  // Only pull cloud settings DOWN once per browser session. Without this, a
  // service-worker update reload re-runs the sync and a stale cloud value
  // (e.g. an old "light" theme) overwrites the user's current local setting
  // (e.g. "dark") — making it look like the update reset their preferences.
  // sessionStorage persists across same-tab reloads (exactly the SW update
  // case) but is cleared when the tab/browser closes, so a fresh open still
  // syncs from cloud as expected.
  const SESSION_SYNCED_KEY = 'kjb-settings-cloud-synced';
  const alreadySyncedThisSession = sessionStorage.getItem(SESSION_SYNCED_KEY) === 'true';

  try {
    const existing = await base44.entities.UserSetting.list('-updated_date', 1);

    if (existing.length === 0) {
      // First sign-in ever: push local settings to cloud
      const localSettings = collectLocalSettings();
      if (Object.keys(localSettings).length > 0) {
        await base44.entities.UserSetting.create({ settings: localSettings });
      }
    } else {
      const cloudSettings = existing[0].settings || {};
      const recordId = existing[0].id;

      // Only apply cloud settings DOWN on the first sync of the session.
      // Subsequent reloads (e.g. after a SW update) skip this step so local
      // changes the user just made are preserved.
      if (!alreadySyncedThisSession) {
        let changed = false;
        Object.entries(cloudSettings).forEach(([key, val]) => {
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
          window.dispatchEvent(new Event('kjb-settings-synced'));
        }
      }

      // Always push local-only keys (not in cloud) back up — this is safe
      // on every reload because it only adds missing keys, never overwrites.
      const hasLocalOnly = SYNC_KEYS.some(
        k => cloudSettings[k] === undefined && localStorage.getItem(k) !== null
      );
      if (hasLocalOnly) {
        const merged = { ...cloudSettings, ...collectLocalSettings() };
        await base44.entities.UserSetting.update(recordId, { settings: merged });
      }
    }

    sessionStorage.setItem(SESSION_SYNCED_KEY, 'true');
    _synced = true;
    _startPushListener();
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
  _synced = false;
  _stopPushListener();
  if (_pushTimer) { clearTimeout(_pushTimer); _pushTimer = null; }
}