// Returns the a/b/c letter for the current search result when its verse has
// multiple occurrences of the term (so the reading indicator can disambiguate).
// Empty string when there's only one occurrence (no label needed).
import { getSearchNav } from '@/lib/searchNav';

export function getOccurrenceLabel(searchResultIndex) {
  const { results } = getSearchNav();
  const cur = results[searchResultIndex];
  if (!cur || !cur.verse || cur.section) return '';
  const sameVerse = results.filter(
    r => r.abbr === cur.abbr && r.chapter === cur.chapter && r.verse === cur.verse && !r.section
  );
  if (sameVerse.length < 2) return '';
  const occ = cur.occurrence || 0;
  return String.fromCharCode(97 + Math.min(occ, 25));
}