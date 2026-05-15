import { base44 } from '@/api/base44Client';
import { BIBLE_BOOKS } from '@/lib/bibleData';

const CACHE_PREFIX = 'kjb-chapter-';

export function getCacheKey(bookAbbr, chapter) {
  return `${CACHE_PREFIX}${bookAbbr}-${chapter}`;
}

export async function fetchChapter(bookApiName, chapter) {
  const book = BIBLE_BOOKS.find(b => b.apiName === bookApiName);
  if (!book) throw new Error('Book not found');

  const cacheKey = getCacheKey(book.abbr, chapter);
  
  // Try cache first
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch {}

  // Fetch from API
  const res = await base44.functions.invoke('bibleApi', {
    action: 'getChapter',
    book: bookApiName,
    chapter: Number(chapter),
  });

  const data = { verses: res.data.verses, colophon: res.data.colophon || null };
  
  // Cache it
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch {}

  return data;
}

export async function fetchVerseCount(bookApiName, chapter) {
  const res = await base44.functions.invoke('bibleApi', {
    action: 'getVerseCount',
    book: bookApiName,
    chapter: Number(chapter),
  });
  return res.data.count;
}

export function getCachedChapterCount() {
  let count = 0;
  for (const book of BIBLE_BOOKS) {
    let allCached = true;
    for (let c = 1; c <= book.chapters; c++) {
      if (!localStorage.getItem(getCacheKey(book.abbr, c))) {
        allCached = false;
        break;
      }
    }
    if (allCached) count++;
  }
  return count;
}

export async function downloadBook(bookApiName) {
  const book = BIBLE_BOOKS.find(b => b.apiName === bookApiName);
  if (!book) throw new Error('Book not found');

  for (let c = 1; c <= book.chapters; c++) {
    await fetchChapter(bookApiName, c);
  }
}

// Render verse text: turn [word] into <em>word</em> for KJB italics
export function renderVerseText(text) {
  let cleaned = text.replace(/[<>]|>>/g, '');
  const parts = cleaned.split(/\[([^\]]+)\]/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? `<em>${part}</em>` : part
  ).join('');
}