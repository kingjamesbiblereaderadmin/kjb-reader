import { getBibleData, isBibleCached } from '@/lib/bibleCache';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { base44 } from '@/api/base44Client';

// We no longer use a fallback pool to ensure random seeding comes from all over the Bible.

// Daily verses are now fetched entirely from the API so all users see the same verse.

const DAILY_VERSE_CACHE_KEY = 'kjb-daily-verse-cache';

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

// Fetch today's daily verse from the API.
// Result is cached in localStorage so online and offline always show the same verse.
let tempOfflineVerse = null;

// Fetch today's daily verse from the API.
// Result is cached in localStorage so online and offline always show the same verse.
export async function getDailyVerseFromBible() {
  // Return today's cached verse if already picked
  const cached = loadCachedDailyVerse(true); // requireToday=true
  if (cached) return cached;

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      // Pass the client's local date so the daily verse rolls over exactly at local midnight
      const res = await base44.functions.invoke('bibleApi', { action: 'daily_verse', clientDate: getTodayKey() });
      if (res.data && res.data.verse) {
        const verse = res.data.verse;
        const bookData = BIBLE_BOOKS.find(b => b.name === verse.book || b.shortName === verse.book);
        verse.abbr = bookData ? bookData.abbr : verse.book.slice(0, 3).toUpperCase();
        verse.book = bookData ? bookData.shortName : verse.book;
        saveCachedDailyVerse(verse);
        tempOfflineVerse = null; // clear temporary fallback
        return verse;
      }
    } catch (e) {
      console.error('Failed to fetch daily verse from API', e);
    }
  }

  // Try to generate a random offline verse using cached data
  if (tempOfflineVerse) return tempOfflineVerse;
  
  try {
    const bible = await getBibleData();
    if (bible && bible['Genesis']) {
      const bookNames = Object.keys(bible).filter(k => k !== '__colophons');
      const randomBook = bookNames[Math.floor(Math.random() * bookNames.length)];
      const chapters = Object.keys(bible[randomBook]);
      const randomChapter = chapters[Math.floor(Math.random() * chapters.length)];
      const verses = bible[randomBook][randomChapter];
      const randomVerse = verses[Math.floor(Math.random() * verses.length)];
      
      const text = randomVerse.text.replace(/¶\s*/g, '').replace(/^<<[^>]*>>\s*/, '');
      const bookData = BIBLE_BOOKS.find(b => b.name === randomBook || b.shortName === randomBook);
      
      tempOfflineVerse = {
        abbr: bookData ? bookData.abbr : randomBook.slice(0, 3).toUpperCase(),
        book: bookData ? bookData.shortName : randomBook,
        chapter: parseInt(randomChapter),
        verse: randomVerse.verse,
        text,
        ref: `${randomBook} ${randomChapter}:${randomVerse.verse} (Offline Random)`
      };
      return tempOfflineVerse;
    }
  } catch (e) {
    console.error('Failed to pick offline random verse', e);
  }

  // If offline or API fails and no local data, return the offline fallback
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