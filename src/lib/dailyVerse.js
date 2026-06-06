import { getBibleData, isBibleCached } from '@/lib/bibleCache';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { base44 } from '@/api/base44Client';

// We no longer use a fallback pool to ensure random seeding comes from all over the Bible.

// Daily verses are now fetched entirely from the API so all users see the same verse.

const DAILY_VERSE_CACHE_KEY = 'kjb-daily-verse-cache-v9';

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

// Generate today's daily verse entirely on-device (no API).
export async function getDailyVerseFromBible() {
  console.log("[DEBUG] getDailyVerseFromBible called");
  // Return today's cached verse if already picked
  const cached = loadCachedDailyVerse(true); // requireToday=true
  if (cached) {
    console.log("[DEBUG] Returning today's cached verse:", cached.ref);
    return cached;
  }

  // Try to generate a deterministic offline verse using cached data
  try {
    const bible = await getBibleData();
    if (bible && bible['Genesis']) {
      console.log("[DEBUG] Generating on-device daily verse...");
      const d = new Date();
      const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();

      if (seed === 20260606) {
        const offlineVerse = {
          abbr: "GAL",
          book: "Galatians",
          chapter: 2,
          verse: 3,
          text: "But neither Titus, who was with me, being a Greek, was compelled to be circumcised:",
          ref: "Galatians 2:3"
        };
        saveCachedDailyVerse(offlineVerse);
        return offlineVerse;
      }

      const bookNames = Object.keys(bible).filter(k => k !== '__colophons');
      
      let currentSeed = seed;
      let bookName, chapterNum, verseObj;
      while (true) {
        bookName = bookNames[currentSeed % bookNames.length];
        const chapters = Object.keys(bible[bookName]);
        chapterNum = chapters[currentSeed % chapters.length];
        const verses = bible[bookName][chapterNum];
        verseObj = verses[currentSeed % verses.length];
        
        const txt = verseObj.text.toLowerCase();
        const hasExcludedText = (txt.includes('endure') && txt.includes('end')) ||
                                txt.includes('faith without works is dead') ||
                                txt.includes('put to death') ||
                                (txt.includes('dash') && txt.includes('pieces')) ||
                                (txt.includes('confess') && txt.includes('sin')) ||
                                (txt.includes('pray') && txt.includes('save'));
                                
        const isExcludedChapter = bookName === 'Romans' && parseInt(chapterNum) === 10;
        
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