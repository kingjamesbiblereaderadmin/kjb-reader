import { useRef } from 'react';
import { getSearchNav, setSearchNav, setSearchIndex, clearSearchNav, getGospelNav, setGospelNav, setGospelIndex, clearGospelNav } from '@/lib/searchNav';
import { getGospelResults } from '@/lib/gospelVerses';
import { scrollToOccurrence } from '@/lib/occurrenceLabel';

export function useSearchAndGospelResults(
  posRef, loading, verses, topRef, searchTerm, gospelMode, setGospelMode, 
  setGospelResultIndex, setGospelTotalResults, setSearchTerm, setSearchResultIndex, 
  setSearchTotalResults, resultViewRef, setFilterMode, setHighlightedVerses, 
  setSelectedVerses, setHighlightSection, setHighlightVerse, setPos, loadChapter, 
  returnToChapter, clearSearchNavFn, setGospelNavFn, setGospelIndexFn, clearGospelNavFn,
  setSelectMode, setShowFilterOverlay
) {
  const preSearchPosRef = useRef(null);

  const stepToResult = (r) => {
    // Capture the user's ORIGINAL reading position ONCE — only if no return
    // anchor exists yet. stepToResult also runs when stepping between results
    // (the prev/next arrows), and at that point kjb-position is itself a
    // search/gospel result. Overwriting the anchors here would make "Clear"
    // return to a result chapter instead of where the user was actually reading
    // (the reported bug). The Search/Gospel pages normally set the anchor before
    // the first jump; this is just a fallback for any path that didn't.
    try {
      const hasAnchor = localStorage.getItem('kjb-pre-search') || localStorage.getItem('kjb-pre-jump');
      if (!hasAnchor) {
        const scroller = document.getElementById('kjb-scroll');
        const scrollY = scroller ? scroller.scrollTop : window.scrollY;
        const cur = JSON.parse(localStorage.getItem('kjb-position') || '{}');
        if (cur && cur.abbr && cur.chapter) {
          // Save to kjb-prev-reading-session for clear handler
          try {
            localStorage.setItem('kjb-prev-reading-session', JSON.stringify({ abbr: cur.abbr, chapter: cur.chapter, scrollY }));
            // Also save to kjb-pre-search for preSearchPosRef fallback
            localStorage.setItem('kjb-pre-search', JSON.stringify({ abbr: cur.abbr, chapter: cur.chapter, scrollY }));
          } catch (err) {
            console.debug('[useSearchAndGospelResults] failed to persist pre-search/session:', err);
          }
          preSearchPosRef.current = { abbr: cur.abbr, chapter: cur.chapter, scrollY };
        }
      }
    } catch (err) { console.debug('[useSearchAndGospelResults] stepToResult pre-anchor error:', err); }
    
    if (!preSearchPosRef.current) {
      try {
        const scroller = document.getElementById('kjb-scroll');
        const exactY = scroller ? scroller.scrollTop : window.scrollY;
        const stash = JSON.parse(localStorage.getItem('kjb-pre-search') || localStorage.getItem('kjb-pre-jump') || 'null');
        if (stash && stash.abbr && stash.chapter) {
          preSearchPosRef.current = { abbr: stash.abbr, chapter: stash.chapter, scrollY: typeof stash.scrollY === 'number' ? stash.scrollY : exactY };
        } else {
          const cur = JSON.parse(localStorage.getItem('kjb-position') || '{}');
          if (cur && cur.abbr && cur.chapter) {
            preSearchPosRef.current = { abbr: cur.abbr, chapter: cur.chapter, scrollY: exactY };
          }
        }
      } catch (err) { console.debug('[useSearchAndGospelResults] stepToResult fallback stash error:', err); }
    }
    const section = r.section || null;
    const targetVerse = section ? null : (r.verse || null);
    setHighlightSection(section);
    const useFilter = resultViewRef.current !== 'full';
    if (!section && r.verse && r.verseEnd && parseInt(r.verseEnd, 10) > parseInt(r.verse, 10)) {
      const start = parseInt(r.verse, 10); const end = parseInt(r.verseEnd, 10);
      const range = new Set(); for (let v = start; v <= end; v++) range.add(v);
      setHighlightedVerses(range); setSelectedVerses(range); setFilterMode(useFilter);
      try {
        const cur = JSON.parse(localStorage.getItem('kjb-position') || '{}');
        localStorage.setItem('kjb-position', JSON.stringify({ ...cur, abbr: r.abbr, chapter: r.chapter, verse: start, verseEnd: end }));
      } catch (err) { console.debug('[useSearchAndGospelResults] persist range position error:', err); }
    } else if (!section && targetVerse) {
      const parsedTarget = parseInt(targetVerse, 10); const single = new Set([parsedTarget]);
      setHighlightedVerses(single); setSelectedVerses(single); setFilterMode(useFilter);
      try {
        const cur = JSON.parse(localStorage.getItem('kjb-position') || '{}');
        localStorage.setItem('kjb-position', JSON.stringify({ ...cur, abbr: r.abbr, chapter: r.chapter, verse: parsedTarget, verseEnd: null }));
      } catch (err) { console.debug('[useSearchAndGospelResults] persist single position error:', err); }
    } else {
      if (!searchTerm && !gospelMode) setFilterMode(false);
      try {
        const cur = JSON.parse(localStorage.getItem('kjb-position') || '{}');
        localStorage.setItem('kjb-position', JSON.stringify({ ...cur, abbr: r.abbr, chapter: r.chapter, verse: r.verse || null, verseEnd: null }));
      } catch (err) { console.debug('[useSearchAndGospelResults] persist default position error:', err); }
    }
    const sameChapter = !loading && verses.length > 0 && posRef.current.abbr === r.abbr && posRef.current.chapter === r.chapter;
    const sameVerse = sameChapter && posRef.current.verse === targetVerse;
    setPos({ abbr: r.abbr, chapter: r.chapter, verse: targetVerse, occurrence: r.occurrence || 0 });
    setHighlightVerse(targetVerse);
    if (sameChapter) {
      if (sameVerse && targetVerse) scrollToOccurrence(targetVerse, r.occurrence || 0, topRef);
      return;
    }
    loadChapter(r.abbr, r.chapter, targetVerse);
  };

  const clearSearchContext = () => {
    clearSearchNavFn(); setSearchTerm(null); setSearchResultIndex(0); setSearchTotalResults(0);

    // Find the previous reading chapter the same way the daily-verse Clear does:
    // prefer kjb-prev-reading-session (the accurate last normal-reading chapter),
    // then fall back to the pre-search stash.
    let back = null;
    try {
      const prevRaw = localStorage.getItem('kjb-prev-reading-session');
      if (prevRaw) {
        const prev = JSON.parse(prevRaw);
        if (prev && prev.abbr && prev.chapter) back = { abbr: prev.abbr, chapter: prev.chapter, scrollY: prev.scrollY };
      }
    } catch (err) { console.debug('[useSearchAndGospelResults] clearSearchContext read prev-session error:', err); }
    if (!back && preSearchPosRef.current && preSearchPosRef.current.abbr) back = preSearchPosRef.current;

    preSearchPosRef.current = null;
    try { localStorage.removeItem('kjb-pre-search'); } catch (err) { console.debug('[useSearchAndGospelResults] clearSearchContext remove pre-search error:', err); }
    if (back && back.abbr && back.chapter) {
      const restoreY = (typeof back.scrollY === 'number' && back.scrollY > 0) ? back.scrollY : undefined;
      returnToChapter(back.abbr, back.chapter, restoreY);
    } else {
      setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set());
      setHighlightedVerses(new Set()); setHighlightVerse(null); setHighlightSection(null);
      setShowFilterOverlay(false);
    }
  };

  return { stepToResult, clearSearchContext, preSearchPosRef };
}