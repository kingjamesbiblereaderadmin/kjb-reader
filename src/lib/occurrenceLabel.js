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

// Emphasize only the active occurrence's <mark>; dim the rest. When occ is 0 and
// there's a single match, this is a no-op visually.
export function emphasizeOccurrence(marks, occ) {
  marks.forEach((m, i) => {
    if (i === occ) {
      m.style.backgroundColor = 'rgba(250, 204, 21, 0.95)';
      m.style.outline = '2px solid rgba(202, 138, 4, 0.9)';
    } else {
      m.style.backgroundColor = 'rgba(250, 204, 21, 0.22)';
      m.style.outline = 'none';
    }
  });
}

// Smoothly scroll to a specific occurrence's <mark> within a verse already on
// screen (used when stepping between occurrences without reloading the chapter).
export function scrollToOccurrence(verseNum, occ, topRef) {
  requestAnimationFrame(() => {
    const verseEl = document.getElementById(`v${verseNum}`);
    if (!verseEl) return;
    const marks = verseEl.querySelectorAll('mark[data-occ]');
    emphasizeOccurrence(marks, occ);
    // Always scroll to the verse top (not the matched word) so the verse's
    // first line never gets clipped above the sticky toolbar.
    const scroller = document.getElementById('kjb-scroll');
    const toolbarH = topRef?.current ? topRef.current.getBoundingClientRect().height : 0;
    const off = toolbarH + 12;

    // Find the verse number element to reliably get the top position,
    // avoiding CSS column fragmentation issues on the parent block.
    const numEl = verseEl.querySelector('sup, .kjb-dropcap-num');
    const topRect = numEl ? numEl.getBoundingClientRect().top : verseEl.getBoundingClientRect().top;

    if (scroller) {
      const top = topRect - scroller.getBoundingClientRect().top + scroller.scrollTop - off;
      scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    } else {
      const top = topRect + window.scrollY - off;
      window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }
  });
}