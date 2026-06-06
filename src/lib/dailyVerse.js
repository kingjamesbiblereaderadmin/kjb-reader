import { getBibleData, isBibleCached } from '@/lib/bibleCache';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { base44 } from '@/api/base44Client';

const EXCLUDED_REFS = new Set([
  "Genesis 26:11", "Genesis 33:14", "Exodus 15:6", "Exodus 18:23", "Exodus 19:12", "Exodus 21:12", "Exodus 21:15", "Exodus 21:16", "Exodus 21:17", "Exodus 21:29", "Exodus 22:19", "Exodus 31:14", "Exodus 31:15", "Exodus 35:2", "Leviticus 5:5", "Leviticus 16:21", "Leviticus 19:20", "Leviticus 20:2", "Leviticus 20:9", "Leviticus 20:10", "Leviticus 20:11", "Leviticus 20:12", "Leviticus 20:13", "Leviticus 20:15", "Leviticus 20:16", "Leviticus 20:27", "Leviticus 24:16", "Leviticus 24:17", "Leviticus 24:21", "Leviticus 27:29", "Numbers 1:51", "Numbers 3:10", "Numbers 3:38", "Numbers 5:7", "Numbers 15:35", "Numbers 18:7", "Numbers 35:16", "Numbers 35:17", "Numbers 35:18", "Numbers 35:21", "Numbers 35:30", "Numbers 35:31", "Deuteronomy 13:5", "Deuteronomy 17:6", "Deuteronomy 21:22", "Deuteronomy 24:16", "Joshua 1:18", "Judges 6:31", "Judges 21:5", "1 Samuel 11:13", "2 Samuel 8:2", "2 Samuel 19:21", "2 Samuel 19:22", "2 Samuel 21:9", "1 Kings 1:12", "1 Kings 2:24", "1 Kings 8:33", "1 Kings 8:35", "1 Kings 20:31", "2 Kings 14:6",
  "1 Chronicles 16:34", "1 Chronicles 16:41", "2 Chronicles 5:13", "2 Chronicles 6:24", "2 Chronicles 6:26", "2 Chronicles 7:3", "2 Chronicles 7:6", "2 Chronicles 15:13", "2 Chronicles 20:21", "2 Chronicles 23:7", "Ezra 3:11", "Nehemiah 1:6", "Nehemiah 9:2", "Esther 8:6", "Job 8:15", "Job 31:23", "Psalms 2:9", "Psalms 9:7", "Psalms 30:5", "Psalms 32:5", "Psalms 52:1", "Psalms 72:5", "Psalms 72:7", "Psalms 72:17", "Psalms 81:15", "Psalms 89:29", "Psalms 89:36", "Psalms 100:5", "Psalms 102:12", "Psalms 102:26", "Psalms 104:31", "Psalms 106:1", "Psalms 107:1", "Psalms 111:3", "Psalms 111:10", "Psalms 112:3", "Psalms 112:9", "Psalms 117:2", "Psalms 118:1", "Psalms 118:2", "Psalms 118:3", "Psalms 118:4", "Psalms 118:29", "Psalms 119:160", "Psalms 135:13", "Psalms 136:1", "Psalms 136:2", "Psalms 136:3", "Psalms 136:4", "Psalms 136:5", "Psalms 136:6", "Psalms 136:7", "Psalms 136:8", "Psalms 136:9", "Psalms 136:10", "Psalms 136:11", "Psalms 136:12", "Psalms 136:13", "Psalms 136:14", "Psalms 136:15",
  "Psalms 136:16", "Psalms 136:17", "Psalms 136:18", "Psalms 136:19", "Psalms 136:20", "Psalms 136:21", "Psalms 136:22", "Psalms 136:23", "Psalms 136:24", "Psalms 136:25", "Psalms 136:26", "Psalms 138:8", "Psalms 145:13", "Proverbs 27:24", "Proverbs 28:13", "Isaiah 13:16", "Isaiah 13:18", "Isaiah 45:20", "Jeremiah 18:21", "Jeremiah 33:11", "Jeremiah 38:4", "Ezekiel 22:14", "Daniel 9:20", "Hosea 10:14", "Hosea 13:16", "Nahum 2:1", "Nahum 3:10", "Matthew 3:6", "Matthew 10:21", "Matthew 10:22", "Matthew 24:13", "Mark 1:5", "Mark 4:17", "Mark 13:12", "Mark 13:13", "Luke 21:16", "Luke 23:32", "John 6:27", "Acts 12:19", "Acts 26:10", "Romans 9:22", "Romans 10:1", "Romans 15:9", "1 Corinthians 13:7", "2 Thessalonians 1:4", "2 Timothy 2:3", "2 Timothy 2:10", "2 Timothy 3:11", "2 Timothy 4:3", "2 Timothy 4:5", "Hebrews 5:7", "Hebrews 6:15", "Hebrews 10:32", "Hebrews 11:27", "Hebrews 12:2", "Hebrews 12:3", "Hebrews 12:7", "Hebrews 12:20", "James 1:12", "James 2:20",
  "James 2:26", "James 5:11", "James 5:15", "1 Peter 1:25", "1 Peter 2:19", "1 Peter 3:18", "1 John 1:9"
]);

// We no longer use a fallback pool to ensure random seeding comes from all over the Bible.

// Daily verses are now fetched entirely from the API so all users see the same verse.

const DAILY_VERSE_CACHE_KEY = 'kjb-daily-verse-cache-v10';

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
        saveCachedDailyVerse(res.data.verse);
        return res.data.verse;
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
      const d = new Date();
      const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

      const bookNames = Object.keys(bible).filter(k => k !== '__colophons');
      
      let currentSeed = seed;
      let bookName, chapterNum, verseObj;
      while (true) {
        bookName = bookNames[currentSeed % bookNames.length];
        const chapters = Object.keys(bible[bookName]);
        chapterNum = chapters[currentSeed % chapters.length];
        const verses = bible[bookName][chapterNum];
        verseObj = verses[currentSeed % verses.length];
        
        const ref = `${bookName} ${chapterNum}:${verseObj.verse}`;
        const isExcludedChapter = bookName === 'Romans' && parseInt(chapterNum) === 10;
        const hasExcludedText = EXCLUDED_REFS.has(ref);
        
        if (!hasExcludedText && !isExcludedChapter) break;
        currentSeed++;
      }
      
      const text = verseObj.text.replace(/¶\s*/g, '').replace(/^<<[^>]*>>\s*/, '');
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