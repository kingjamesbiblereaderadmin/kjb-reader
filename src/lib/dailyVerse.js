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

function loadCachedDailyVerse() {
  const last = getLastCachedDailyVerse();
  return (last && last.isToday) ? last : null;
}

function saveCachedDailyVerse(verse) {
  try {
    localStorage.setItem(DAILY_VERSE_CACHE_KEY, JSON.stringify({ dateKey: getTodayKey(), verse }));
  } catch {}
}

// Fetch today's daily verse from the API.
// Result is cached in localStorage so online and offline always show the same verse.
export async function getDailyVerseFromBible() {
  // Return today's cached verse if already picked
  const cached = loadCachedDailyVerse();
  if (cached) return cached;

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    try {
      const res = await base44.functions.invoke('bibleApi', { action: 'daily_verse' });
      if (res.data && res.data.verse) {
        const verse = res.data.verse;
        const bookData = BIBLE_BOOKS.find(b => b.name === verse.book || b.shortName === verse.book);
        verse.abbr = bookData ? bookData.abbr : verse.book.slice(0, 3).toUpperCase();
        verse.book = bookData ? bookData.shortName : verse.book;
        saveCachedDailyVerse(verse);
        return verse;
      }
    } catch (e) {
      console.error('Failed to fetch daily verse from API', e);
    }
  }

  // If offline or API fails, return the offline fallback
  return getDailyVerse();
}

// Get date-based daily verse (one per day).
// Returns the localStorage-cached verse if one was picked online today.
// If not loaded, we return a fallback offline message.
export function getDailyVerse() {
  const cached = loadCachedDailyVerse();
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