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
      window.dispatchEvent(new Event('kjb-settings-synced'));
    } else {
      const cloudSettings = existing[0].settings || {};
      const recordId = existing[0].id;

      // PULL cloud DOWN first — cloud is the source of truth for cross-device
      // sync. This must happen BEFORE any push, so that a fresh device's local
      // defaults (e.g. "serif" font, "light" theme) don't overwrite the user's
      // actual cloud settings. Real-time local changes are pushed up separately
      // by the _debouncedPush listener whenever the user changes a setting.
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