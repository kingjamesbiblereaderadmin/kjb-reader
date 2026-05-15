import { base44 } from '@/api/base44Client';
import { BIBLE_BOOKS } from '@/lib/bibleData';

const CACHE_PREFIX = 'kjb-offline-';

function getAbbrFromApiName(bookApiName) {
  const book = BIBLE_BOOKS.find(b => b.apiName === bookApiName);
  return book ? book.abbr : bookApiName;
}

function getCacheKey(bookApiName, chapter) {
  const abbr = getAbbrFromApiName(bookApiName);
  return `${CACHE_PREFIX}${abbr}-${chapter}`;
}

export async function fetchChapter(bookApiName, chapter) {
  // Check offline cache first (keyed by abbr, same as SettingsPage)
  const cacheKey = getCacheKey(bookApiName, chapter);
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
  const res = await base44.functions.invoke('bibleApi', {
    action: 'getVerseCount',
    book: bookApiName,
    chapter: Number(chapter),
  });
  return res.data.count;
}

// Render verse text: turn [word] into <em>word</em> for KJB italics
export function renderVerseText(text) {
  // Strip <, >, <>, >> markers
  let cleaned = text.replace(/[<>]|>>/g, '');
  const parts = cleaned.split(/\[([^\]]+)\]/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? `<em>${part}</em>` : part
  ).join('');
}