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

// Smoothly scroll to a specific occurrence's <mark> within a verse already on
// screen (used when stepping between occurrences without reloading the chapter).
export function scrollToOccurrence(verseNum, occ, topRef) {
  requestAnimationFrame(() => {
    const verseEl = document.getElementById(`v${verseNum}`);
    if (!verseEl) return;
    const marks = verseEl.querySelectorAll('mark[data-occ]');
    const el = (occ > 0 && marks[occ]) ? marks[occ] : verseEl;
    const scroller = document.getElementById('kjb-scroll');
    const toolbarH = topRef?.current ? topRef.current.getBoundingClientRect().height : 0;
    const off = toolbarH + 12;
    if (scroller) {
      const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - off;
      scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    } else {
      const top = el.getBoundingClientRect().top + window.scrollY - off;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  });
}