import { base44 } from '@/api/base44Client';
import { BIBLE_BOOKS } from '@/lib/bibleData';

const PROGRESS_KEY = 'kjb-reading-progress';

// ── Local (localStorage) operations ──

export function getReadingProgress() {
  try {
    return JSON.parse(localStorage.getItem(PROGRESS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function getLatestProgress() {
  const all = getReadingProgress();
  return all.length > 0 ? all[0] : null;
}

// ── Cloud sync — only for signed-in users ──

async function isAuthed() {
  try {
    return await base44.auth.isAuthenticated();
  } catch {
    return false;
  }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function abbrToBookName(abbr) {
  const book = BIBLE_BOOKS.find(b => b.abbr === abbr);
  return book ? book.shortName : abbr;
}

/**
 * Loads reading progress from the cloud and merges with local storage.
 * Called automatically when the user authenticates and on every reload.
 */
export async function syncReadingProgressFromCloud() {
  if (!(await isAuthed())) return;

  try {
    const cloudProgress = await base44.entities.ReadingProgress.list('-created_date', 500);
    const localProgress = getReadingProgress();

    // Merge: cloud records take priority (they're the source of truth across devices).
    // Keep local-only records that aren't in the cloud yet.
    const cloudKeys = new Set(cloudProgress.map(p => `${p.date}:${p.book}:${p.chapter}`));
    const localOnly = localProgress.filter(
      p => !cloudKeys.has(`${p.date}:${p.book}:${p.chapter}`)
    );

    const merged = [
      ...localOnly,
      ...cloudProgress.map(p => ({
        date: p.date,
        book: p.book,
        chapter: p.chapter,
        completed: p.completed || false,
      })),
    ];

    localStorage.setItem(PROGRESS_KEY, JSON.stringify(merged));

    // Push local-only records to the cloud
    if (localOnly.length > 0) {
      await base44.entities.ReadingProgress.bulkCreate(localOnly);
    }

    window.dispatchEvent(new Event('kjb-progress-synced'));
  } catch (err) {
    console.error('[readingProgress] Cloud sync failed:', err);
  }
}

/**
 * Records that the user read a chapter. Creates a cloud record if one doesn't
 * already exist for today + this book + chapter. Fire-and-forget.
 */
export async function recordReadingProgress(abbr, chapter) {
  if (!abbr || !chapter || chapter === 0) return;

  const book = abbrToBookName(abbr);
  const date = todayStr();
  const key = `${date}:${book}:${chapter}`;

  // Update localStorage (dedupe by date+book+chapter)
  const local = getReadingProgress();
  const exists = local.some(p => `${p.date}:${p.book}:${p.chapter}` === key);
  if (!exists) {
    local.unshift({ date, book, chapter, completed: false });
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(local));
  }

  // Sync to cloud (fire-and-forget)
  if (!(await isAuthed())) return;
  try {
    // Check if a record already exists for today + this book + chapter
    const matches = await base44.entities.ReadingProgress.filter({ date, book, chapter });
    if (matches.length === 0) {
      await base44.entities.ReadingProgress.create({ date, book, chapter, completed: false });
    }
  } catch (err) {
    console.error('[readingProgress] Cloud record failed:', err);
  }
}

export function resetReadingProgressSync() {}

/**
 * Clears all locally-stored reading progress.
 * Called on logout so a guest doesn't see the previous user's history.
 */
export function clearLocalReadingProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}