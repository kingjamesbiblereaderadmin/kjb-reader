import { getBibleData, isBibleCached } from '@/lib/bibleCache';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { base44 } from '@/api/base44Client';
import { loadOverrides, getOverrideSync } from '@/lib/bibleTextOverrides';

// Apply a shared verse correction to a daily-verse object, if one exists.
// bookShort is the short book name (e.g. "Psalms"); overrides are keyed by it.
function applyVerseOverride(verse) {
  if (!verse || !verse.book) return verse;
  const ov = getOverrideSync(verse.book, verse.chapter, verse.verse);
  if (ov != null && ov !== verse.text) {
    return { ...verse, text: ov.replace(/^<<[^>]*>>\s*/, '') };
  }
  return verse;
}

const EXCLUDED_REFS = new Set([
  "Genesis 26:11", "Genesis 33:14", "Exodus 15:6", "Exodus 18:23", "Exodus 19:12", "Exodus 21:12", "Exodus 21:15", "Exodus 21:16", "Exodus 21:17", "Exodus 22:19", "Exodus 31:14", "Exodus 31:15", "Exodus 35:2", "Leviticus 5:5", "Leviticus 16:21", "Leviticus 19:20", "Leviticus 20:2", "Leviticus 20:9", "Leviticus 20:10", "Leviticus 20:11", "Leviticus 20:12", "Leviticus 20:13", "Leviticus 20:20", "Leviticus 20:21", "Leviticus 20:27", "Leviticus 24:16", "Leviticus 27:29", "Numbers 1:51", "Numbers 3:10", "Numbers 3:38", "Numbers 5:7", "Numbers 15:35", "Numbers 18:7", "Numbers 35:16", "Numbers 35:17", "Numbers 35:18", "Numbers 35:31", "Deuteronomy 13:5", "Deuteronomy 17:6", "Deuteronomy 21:22", "Deuteronomy 24:16", "Joshua 1:18", "Judges 6:31", "Judges 21:5", "1 Samuel 11:13", "1 Samuel 15:33", "2 Samuel 8:2", "2 Samuel 19:21", "2 Samuel 19:22", "2 Samuel 21:9", "1 Kings 1:12", "1 Kings 2:24", "1 Kings 8:33", "1 Kings 8:35", "1 Kings 20:31",
  "1 Chronicles 16:34", "1 Chronicles 16:41", "2 Chronicles 5:13", "2 Chronicles 6:24", "2 Chronicles 6:26", "2 Chronicles 7:3", "2 Chronicles 7:6", "2 Chronicles 15:13", "2 Chronicles 20:21", "2 Chronicles 23:7", "Ezra 3:11", "Nehemiah 1:6", "Nehemiah 9:2", "Esther 8:6", "Job 8:15", "Job 31:23", "Psalms 2:9", "Psalms 9:7", "Psalms 30:5", "Psalms 32:5", "Psalms 52:1", "Psalms 72:5", "Psalms 72:7", "Psalms 72:17", "Psalms 81:15", "Psalms 89:29", "Psalms 89:36", "Psalms 100:5", "Psalms 102:12", "Psalms 102:26", "Psalms 104:31", "Psalms 106:1", "Psalms 107:1", "Psalms 111:3", "Psalms 111:10", "Psalms 112:3", "Psalms 112:9", "Psalms 117:2", "Psalms 118:1", "Psalms 118:2", "Psalms 118:3", "Psalms 118:4", "Psalms 118:29", "Psalms 119:160", "Psalms 135:13", "Psalms 136:1", "Psalms 136:2", "Psalms 136:3", "Psalms 136:4", "Psalms 136:5", "Psalms 136:6", "Psalms 136:7", "Psalms 136:8", "Psalms 136:9", "Psalms 136:10", "Psalms 136:11", "Psalms 136:12", "Psalms 136:13", "Psalms 136:14", "Psalms 136:15",
  "Psalms 136:16", "Psalms 136:17", "Psalms 136:18", "Psalms 136:19", "Psalms 136:20", "Psalms 136:21", "Psalms 136:22", "Psalms 136:23", "Psalms 136:24", "Psalms 136:25", "Psalms 136:26", "Psalms 138:8", "Psalms 145:13", "Proverbs 27:24", "Proverbs 28:13", "Jeremiah 22:30", "Jeremiah 33:11", "Jeremiah 38:4", "Isaiah 13:16", "Isaiah 13:18", "Isaiah 45:20", "Ezekiel 22:14", "Daniel 9:20", "Hosea 10:14", "Hosea 13:16", "Nahum 2:1", "Nahum 3:10", "Matthew 3:6", "Matthew 10:21", "Matthew 10:22", "Matthew 24:13", "Mark 1:5", "Mark 4:17", "Mark 13:12", "Mark 13:13", "Luke 21:16", "Luke 23:32", "John 6:27", "Acts 12:19", "Acts 26:10", "Romans 9:22", "Romans 10:1", "Romans 15:9", "1 Corinthians 13:7", "2 Thessalonians 1:4", "2 Timothy 2:3", "2 Timothy 2:10", "2 Timothy 3:11", "2 Timothy 4:3", "2 Timothy 4:5", "Hebrews 5:7", "Hebrews 6:15", "Hebrews 10:32", "Hebrews 11:27", "Hebrews 12:2", "Hebrews 12:3", "Hebrews 12:7", "Hebrews 12:20", "James 1:12", "James 2:20",
  "James 2:26", "James 5:11", "James 5:15", "1 Peter 1:25", "1 Peter 2:19", "1 Peter 3:18", "1 John 1:9", "Matthew 16:25",
  // Harsh / graphically violent Old Testament verses (killing, slaughter, dashing, graphic death)
  "Genesis 34:25", "Exodus 13:15", "Exodus 22:20", "Numbers 21:2", "Numbers 21:3", "Numbers 31:7", "Deuteronomy 2:34", "Deuteronomy 3:6", "Deuteronomy 7:2", "Deuteronomy 12:2", "Deuteronomy 20:17", "Joshua 2:10", "Joshua 6:21", "Joshua 8:26", "Joshua 10:1", "Joshua 10:10", "Joshua 10:20", "Joshua 10:28", "Joshua 10:35", "Joshua 10:39", "Joshua 10:40", "Joshua 11:12", "Judges 1:17", "Judges 9:54", "Judges 11:33", "Judges 15:8", "Judges 21:11", "1 Samuel 4:10", "1 Samuel 4:17", "1 Samuel 6:19", "1 Samuel 11:7", "1 Samuel 14:14", "1 Samuel 14:30", "1 Samuel 15:3", "1 Samuel 15:8", "1 Samuel 15:9", "1 Samuel 15:15", "1 Samuel 15:18", "1 Samuel 15:20", "1 Samuel 15:21", "2 Samuel 2:23", "2 Samuel 4:6", "2 Samuel 17:9", "2 Samuel 18:7", "1 Kings 16:11", "1 Kings 20:21", "2 Kings 8:12", "2 Kings 10:9", "2 Kings 10:11", "2 Kings 10:17", "2 Kings 15:16", "2 Kings 21:24", "2 Kings 23:20", "2 Chronicles 13:17", "2 Chronicles 21:4", "2 Chronicles 21:19", "2 Chronicles 25:14", "2 Chronicles 28:5", "2 Chronicles 31:1", "2 Chronicles 32:14", "2 Chronicles 33:25", "Esther 9:5", "Psalms 44:22", "Isaiah 10:26", "Isaiah 11:15", "Isaiah 14:21", "Isaiah 27:7", "Isaiah 30:25", "Isaiah 34:2", "Isaiah 34:6", "Isaiah 65:12", "Jeremiah 7:32", "Jeremiah 11:19", "Jeremiah 12:3", "Jeremiah 19:6", "Jeremiah 19:9", "Jeremiah 25:9", "Jeremiah 25:34", "Jeremiah 39:6", "Jeremiah 41:3", "Jeremiah 48:15", "Jeremiah 50:21", "Jeremiah 50:27", "Jeremiah 51:40", "Lamentations 2:4", "Ezekiel 9:2", "Ezekiel 21:10", "Ezekiel 21:15", "Ezekiel 21:22", "Ezekiel 21:28", "Ezekiel 26:15", "Ezekiel 39:17", "Ezekiel 39:19", "Hosea 5:2", "Amos 1:13"
]);

// We no longer use a fallback pool to ensure random seeding comes from all over the Bible.

// Daily verses are now fetched entirely from the API so all users see the same verse.

const DAILY_VERSE_CACHE_KEY = 'kjb-daily-verse-cache-v18';

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function getLastCachedDailyVerse() {
  try {
    const raw = localStorage.getItem(DAILY_VERSE_CACHE_KEY);
    if (!raw) return null;
    const { dateKey, verse } = JSON.parse(raw);
    return { ...verse, isToday: dateKey === getTodayKey() };
  } catch {}
  return null;
}

function loadCachedDailyVerse(requireToday = true) {
  const last = getLastCachedDailyVerse();
  if (!last) return null;
  if (requireToday && !last.isToday) return null;
  return last;
}

function saveCachedDailyVerse(verse) {
  try {
    localStorage.setItem(DAILY_VERSE_CACHE_KEY, JSON.stringify({ dateKey: getTodayKey(), verse }));
  } catch {}
}

// Generate today's daily verse. Uses API when online, on-device logic when offline.
export async function getDailyVerseFromBible() {
  console.log("[DEBUG] getDailyVerseFromBible called");
  // Return today's cached verse if already picked
  const cached = loadCachedDailyVerse(true); // requireToday=true
  if (cached) {
    console.log("[DEBUG] Returning today's cached verse:", cached.ref);
    return cached;
  }

  // Try to use the API first if online
  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const d = new Date();
      const clientDate = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      const res = await base44.functions.invoke('bibleApi', { action: 'daily_verse', clientDate });
      if (res.data?.verse) {
        console.log("[DEBUG] Verse generated from API:", res.data.verse.ref);
        // Apply any shared verse correction so the daily card matches the reader.
        await loadOverrides().catch(() => {});
        const corrected = applyVerseOverride(res.data.verse);
        saveCachedDailyVerse(corrected);
        return corrected;
      }
    } catch (err) {
      console.warn("[DEBUG] API fetch failed, falling back to local:", err.message);
    }
  }

  // Try to generate a deterministic offline verse using cached data
  try {
    const bible = await getBibleData();
    if (bible && bible['Genesis']) {
      console.log("[DEBUG] Generating on-device daily verse...");
      // Use user's local date to match the API behavior
      const d = new Date();
      const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

      // Use biblical book order to match API (BOOK_ORDER from bibleApi)
      const BOOK_ORDER = ["Genesis","Exodus","Leviticus","Numbers","Deuteronomy","Joshua","Judges","Ruth","1 Samuel","2 Samuel","1 Kings","2 Kings","1 Chronicles","2 Chronicles","Ezra","Nehemiah","Esther","Job","Psalms","Proverbs","Ecclesiastes","Song of Solomon","Isaiah","Jeremiah","Lamentations","Ezekiel","Daniel","Hosea","Joel","Amos","Obadiah","Jonah","Micah","Nahum","Habakkuk","Zephaniah","Haggai","Zechariah","Malachi","Matthew","Mark","Luke","John","Acts","Romans","1 Corinthians","2 Corinthians","Galatians","Ephesians","Philippians","Colossians","1 Thessalonians","2 Thessalonians","1 Timothy","2 Timothy","Titus","Philemon","Hebrews","James","1 Peter","2 Peter","1 John","2 John","3 John","Jude","Revelation"];
      
      // Build a flat list of every eligible (book, chapter, verse) reference,
      // then pick one by the date seed — IDENTICAL to the backend's daily_verse
      // logic so the offline verse always matches the online one for a given day.
      const flat = [];
      for (const bn of BOOK_ORDER) {
        if (!bible[bn]) continue;
        const chapters = Object.keys(bible[bn]);
        for (const cn of chapters) {
          const verses = bible[bn][cn];
          if (!verses || !verses.length) continue;
          for (const vo of verses) {
            const ref = `${bn} ${cn}:${vo.verse}`;
            const isExcludedChapter = bn === 'Romans' && parseInt(cn) === 10;
            if (EXCLUDED_REFS.has(ref) || isExcludedChapter) continue;
            flat.push({ bookName: bn, chapterNum: cn, verseObj: vo });
          }
        }
      }
      if (!flat.length) return getDailyVerse();
      // Same prime-scatter as the backend so consecutive days differ widely.
      // Offline has no DB exclusions, and the flat list is built with the
      // hardcoded exclusions only — matching the backend's stable-length list —
      // so this lands on the same verse the backend picks for days without a
      // DB exclusion or pin.
      const picked = flat[((seed * 2654435761) % flat.length + flat.length) % flat.length];
      const bookName = picked.bookName;
      const chapterNum = picked.chapterNum;
      const verseObj = picked.verseObj;
      
      const text = verseObj.text.replace(/^<<[^>]*>>\s*/, '');
      const bookData = BIBLE_BOOKS.find(b => b.name === bookName || b.shortName === bookName);
      
      const offlineVerse = {
        abbr: bookData ? bookData.abbr : bookName.slice(0, 3).toUpperCase(),
        book: bookData ? bookData.shortName : bookName,
        chapter: parseInt(chapterNum),
        verse: verseObj.verse,
        text,
        ref: `${bookName} ${chapterNum}:${verseObj.verse}`
      };
      
      saveCachedDailyVerse(offlineVerse);
      return offlineVerse;
    }
  } catch (e) {
    console.error('Failed to pick on-device verse', e);
  }

  // If local data fails, return the offline fallback
  return getDailyVerse();
}

// Get date-based daily verse (one per day).
// Returns the localStorage-cached verse if one was picked today.
// If not loaded, returns yesterday's verse. If no cache at all, returns offline message.
export function getDailyVerse() {
  // Try today's first
  let cached = loadCachedDailyVerse(true);
  if (cached) return cached;
  
  // Try yesterday's (or any older) as fallback
  cached = loadCachedDailyVerse(false);
  if (cached) return cached;
  
  return {
    abbr: "GEN",
    book: "Offline",
    chapter: 1,
    verse: 1,
    text: "Please connect to the internet to load today's daily verse.",
    ref: "Offline Mode"
  };
}

// Synchronous fallback used for initial render / offline first load
export function getDailyVerseFallback() {
  return getDailyVerse();
}