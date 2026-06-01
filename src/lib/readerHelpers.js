import { BIBLE_BOOKS } from '@/lib/bibleData';

// Resolve a book from a URL/string token — accepts abbr (e.g. "GEN"),
// short name, or api name (case-insensitive, ignores spaces).
export function resolveBook(token) {
  if (!token) return null;
  const t = String(token).trim().toLowerCase().replace(/\s+/g, '');
  return BIBLE_BOOKS.find(b =>
    b.abbr.toLowerCase() === t ||
    b.shortName.toLowerCase().replace(/\s+/g, '') === t ||
    (b.apiName && b.apiName.toLowerCase().replace(/\s+/g, '') === t) ||
    (b.name && b.name.toLowerCase().replace(/\s+/g, '') === t)
  ) || null;
}

// Format verses with dashes for consecutive, commas for gaps (e.g. 1-3,5).
export function formatVerseRange(verses) {
  if (!verses || verses.length === 0) return '';
  if (verses.length === 1) return String(verses[0]);

  const sorted = [...verses].sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? String(start) : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? String(start) : `${start}-${end}`);

  return ranges.join(',');
}