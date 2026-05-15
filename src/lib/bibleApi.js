import { base44 } from '@/api/base44Client';
import { BIBLE_BOOKS } from '@/lib/bibleData';

export const CACHE_PREFIX = 'kjb-offline-';

function getAbbrFromApiName(bookApiName) {
  const book = BIBLE_BOOKS.find(b => b.apiName === bookApiName);
  return book ? book.abbr : bookApiName;
}

// Exported so dailyVerse.js and SettingsPage can use it
export function getCacheKey(abbr, chapter) {
  return `${CACHE_PREFIX}${abbr}-${chapter}`;
}

export async function fetchChapter(bookApiName, chapter) {
  // Check offline cache first (keyed by abbr)
  const abbr = getAbbrFromApiName(bookApiName);
  const cacheKey = getCacheKey(abbr, chapter);
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.verses) {
        return { verses: parsed.verses, colophon: parsed.colophon || null };
      }
    }
  } catch {}

  // Fall back to API
  const res = await base44.functions.invoke('bibleApi', {
    action: 'getChapter',
    book: bookApiName,
    chapter: Number(chapter),
  });
  return { verses: res.data.verses, colophon: res.data.colophon };
}

export async function fetchVerseCount(bookApiName, chapter) {
  // Try cache first
  const abbr = getAbbrFromApiName(bookApiName);
  try {
    const cached = localStorage.getItem(getCacheKey(abbr, chapter));
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && parsed.verses) return parsed.verses.length;
    }
  } catch {}

  const res = await base44.functions.invoke('bibleApi', {
    action: 'getVerseCount',
    book: bookApiName,
    chapter: Number(chapter),
  });
  return res.data.count;
}

// Search all locally cached chapters for a keyword
export function searchOfflineCache(keyword) {
  if (!keyword || keyword.trim().length < 2) return [];
  const kw = keyword.trim().toLowerCase();
  const results = [];

  for (const book of BIBLE_BOOKS) {
    for (let c = 1; c <= book.chapters; c++) {
      const key = getCacheKey(book.abbr, c);
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const data = JSON.parse(raw);
        if (!data || !data.verses) continue;
        for (const v of data.verses) {
          if (v.text && v.text.toLowerCase().includes(kw)) {
            results.push({
              abbr: book.abbr,
              book: book.shortName,
              chapter: c,
              verse: v.verse,
              text: v.text,
            });
          }
        }
      } catch {}
    }
  }

  return results;
}

// Render verse text: turn [word] into <em>word</em> for KJB italics
export function renderVerseText(text) {
  let cleaned = text.replace(/[<>]|>>/g, '');
  const parts = cleaned.split(/\[([^\]]+)\]/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? `<em>${part}</em>` : part
  ).join('');
}