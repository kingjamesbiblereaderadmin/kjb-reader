import { base44 } from '@/api/base44Client';

const SAVED_KEY = 'kjb-saved-verses';

// ── Local (localStorage) operations — synchronous, work for all users ──

export function getSavedVerses() {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getSavedFolders() {
  try {
    const folders = JSON.parse(localStorage.getItem('kjb-saved-folders') || '["Favorites"]');
    if (!folders.includes('Favorites')) {
      folders.unshift('Favorites');
    }
    return folders;
  } catch {
    return ['Favorites'];
  }
}

export function createFolder(name) {
  const folders = getSavedFolders();
  if (!folders.includes(name)) {
    folders.push(name);
    localStorage.setItem('kjb-saved-folders', JSON.stringify(folders));
  }
}

export function isVerseSaved(abbr, chapter, verse) {
  return getSavedVerses().some(v => v.abbr === abbr && v.chapter === chapter && v.verse === verse);
}

// ── Cloud sync (database) — only for signed-in users ──

let _synced = false;

async function isAuthed() {
  try {
    return await base44.auth.isAuthenticated();
  } catch {
    return false;
  }
}

/**
 * Loads saved verses from the cloud and merges with local storage.
 * Local-only verses (not yet in the cloud) are pushed up.
 * Called automatically when the user authenticates.
 */
export async function syncFromCloud() {
  if (_synced) return;
  if (!(await isAuthed())) return;

  try {
    const cloudVerses = await base44.entities.SavedVerse.list('-created_date', 500);
    const localVerses = getSavedVerses();

    const cloudKeys = new Set(cloudVerses.map(v => `${v.abbr}:${v.chapter}:${v.verse}`));

    // Merged list: cloud verses (already sorted newest-first) + local-only verses prepended
    const localOnly = localVerses.filter(v => !cloudKeys.has(`${v.abbr}:${v.chapter}:${v.verse}`));
    const merged = [
      ...localOnly,
      ...cloudVerses.map(v => ({
        abbr: v.abbr,
        chapter: v.chapter,
        verse: v.verse,
        ref: v.ref,
        text: v.text,
        folder: v.folder || 'Favorites',
      })),
    ];

    localStorage.setItem(SAVED_KEY, JSON.stringify(merged));

    // Merge folders from cloud into local folder list
    const cloudFolders = [...new Set(cloudVerses.map(v => v.folder || 'Favorites'))];
    const localFolders = getSavedFolders();
    const mergedFolders = [...new Set([...cloudFolders, ...localFolders])];
    if (!mergedFolders.includes('Favorites')) mergedFolders.unshift('Favorites');
    localStorage.setItem('kjb-saved-folders', JSON.stringify(mergedFolders));

    // Push local-only verses to the cloud
    if (localOnly.length > 0) {
      await base44.entities.SavedVerse.bulkCreate(
        localOnly.map(v => ({
          abbr: v.abbr,
          chapter: v.chapter,
          verse: v.verse,
          ref: v.ref,
          text: v.text,
          folder: v.folder || 'Favorites',
        }))
      );
    }

    _synced = true;
    window.dispatchEvent(new Event('kjb-saved-synced'));
  } catch (err) {
    console.error('[savedVerses] Cloud sync failed:', err);
  }
}

export function resetCloudSync() {
  _synced = false;
}

// ── Write operations — update localStorage synchronously, then sync to cloud ──

export function saveVerse(entry) {
  const saved = getSavedVerses();
  if (!isVerseSaved(entry.abbr, entry.chapter, entry.verse)) {
    saved.unshift({ ...entry, folder: entry.folder || 'Favorites' });
    localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    _syncSave(entry);
  }
}

export function updateVerseFolder(abbr, chapter, verse, newFolder) {
  const saved = getSavedVerses().map(v => {
    if (v.abbr === abbr && v.chapter === chapter && v.verse === verse) {
      return { ...v, folder: newFolder };
    }
    return v;
  });
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  _syncUpdateFolder(abbr, chapter, verse, newFolder);
}

export function removeSavedVerse(abbr, chapter, verse) {
  const saved = getSavedVerses().filter(v => !(v.abbr === abbr && v.chapter === chapter && v.verse === verse));
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  _syncRemove(abbr, chapter, verse);
}

export function deleteFolder(name) {
  if (name === 'Favorites') return;
  const folders = getSavedFolders().filter(f => f !== name);
  localStorage.setItem('kjb-saved-folders', JSON.stringify(folders));

  const saved = getSavedVerses().map(v => {
    if (v.folder === name) {
      return { ...v, folder: 'Favorites' };
    }
    return v;
  });
  localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
  _syncDeleteFolder(name);
}

// ── Cloud write helpers (fire-and-forget) ──

async function _syncSave(entry) {
  if (!(await isAuthed())) return;
  try {
    await base44.entities.SavedVerse.create({
      abbr: entry.abbr,
      chapter: entry.chapter,
      verse: entry.verse,
      ref: entry.ref,
      text: entry.text,
      folder: entry.folder || 'Favorites',
    });
  } catch (err) {
    console.error('[savedVerses] Cloud save failed:', err);
  }
}

async function _syncRemove(abbr, chapter, verse) {
  if (!(await isAuthed())) return;
  try {
    await base44.entities.SavedVerse.deleteMany({ abbr, chapter, verse });
  } catch (err) {
    console.error('[savedVerses] Cloud remove failed:', err);
  }
}

async function _syncUpdateFolder(abbr, chapter, verse, newFolder) {
  if (!(await isAuthed())) return;
  try {
    const matches = await base44.entities.SavedVerse.filter({ abbr, chapter, verse });
    if (matches.length > 0) {
      await base44.entities.SavedVerse.update(matches[0].id, { folder: newFolder });
    }
  } catch (err) {
    console.error('[savedVerses] Cloud update folder failed:', err);
  }
}

async function _syncDeleteFolder(name) {
  if (!(await isAuthed())) return;
  try {
    await base44.entities.SavedVerse.updateMany(
      { folder: name },
      { $set: { folder: 'Favorites' } }
    );
  } catch (err) {
    console.error('[savedVerses] Cloud folder delete failed:', err);
  }
}