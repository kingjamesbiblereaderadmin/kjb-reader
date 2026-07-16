import { syncFromCloud } from '@/lib/savedVerses';
import { syncSettingsFromCloud } from '@/lib/settingsSync';
import { syncReadingProgressFromCloud } from '@/lib/readingProgress';

let _syncTimer = null;
let _lastSync = 0;
const MIN_INTERVAL = 3000; // Don't sync more than once every 3 seconds

/**
 * Debounced pull of all user data from the cloud (saved verses, settings,
 * reading progress). Called on route changes, chapter changes, and tab focus
 * so cross-device changes appear without a manual sync.
 * Real-time pushes (settings changes, verse saves, progress records) already
 * fire immediately via their own listeners — this only handles the PULL.
 */
export function syncAllFromCloud(force = false) {
  const now = Date.now();
  if (!force && now - _lastSync < MIN_INTERVAL) return;
  _lastSync = now;

  if (_syncTimer) clearTimeout(_syncTimer);
  _syncTimer = setTimeout(() => {
    syncFromCloud();
    syncSettingsFromCloud();
    syncReadingProgressFromCloud();
  }, 200);
}