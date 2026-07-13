import { base44 } from '@/api/base44Client';

// Shared, database-backed corrections to individual verses. Fetched once and
// cached in memory. Applied inside fetchChapter so every reader sees the fix
// without re-generating any Bible data (no credits spent).
//
// Shape in memory: Map keyed by "Book:chapter:verse" -> corrected text.

let _cache = null;      // Map | null
let _loading = null;    // Promise | null

function keyFor(book, chapter, verse) {
  return `${book}:${chapter}:${verse}`;
}

// Sentinel "verse" numbers used to store non-verse chapter parts as overrides
// in the same BibleTextOverride entity:
//   0  → the Psalm superscription / subscript line for that chapter
//   -1 → the epistle colophon line for that chapter
export const SUBSCRIPT_VERSE = 0;
export const COLOPHON_VERSE = -1;

// Read an overridden subscript/colophon (returns null if none loaded/saved).
export function getSubscriptOverride(book, chapter) {
  if (!_cache) return null;
  return _cache.get(keyFor(book, chapter, SUBSCRIPT_VERSE)) ?? null;
}
export function getColophonOverride(book, chapter) {
  if (!_cache) return null;
  return _cache.get(keyFor(book, chapter, COLOPHON_VERSE)) ?? null;
}

// Load all overrides from the database (once). Safe to call repeatedly.
export async function loadOverrides(force = false) {
  if (_cache && !force) return _cache;
  if (_loading && !force) return _loading;
  _loading = (async () => {
    try {
      const rows = await base44.entities.BibleTextOverride.list('-updated_date', 1000);
      const map = new Map();
      for (const r of rows) {
        if (r.book && r.chapter && r.verse && typeof r.text === 'string') {
          map.set(keyFor(r.book, r.chapter, r.verse), r.text);
        }
      }
      _cache = map;
      return map;
    } catch (err) {
      console.warn('[overrides] load failed:', err?.message);
      _cache = new Map();
      return _cache;
    } finally {
      _loading = null;
    }
  })();
  return _loading;
}

// Synchronously read the already-loaded cache (returns null if not loaded yet).
export function getOverrideSync(book, chapter, verse) {
  if (!_cache) return null;
  return _cache.get(keyFor(book, chapter, verse)) ?? null;
}

// Apply cached overrides to an array of {verse, text} for a given book/chapter.
// Returns a new array only if something changed.
export function applyOverrides(book, chapter, verses) {
  if (!_cache || !_cache.size || !Array.isArray(verses)) return verses;
  let changed = false;
  const out = verses.map(v => {
    const ov = _cache.get(keyFor(book, chapter, v.verse));
    if (ov != null && ov !== v.text) {
      changed = true;
      return { ...v, text: ov };
    }
    return v;
  });
  return changed ? out : verses;
}

// Clear the in-memory cache (call after saving/deleting so readers pick up changes).
export function invalidateOverrides() {
  _cache = null;
  _loading = null;
}