import { useRef } from 'react';
import { getSearchNav, setSearchNav, setSearchIndex, clearSearchNav, getGospelNav, setGospelNav, setGospelIndex, clearGospelNav } from '@/lib/searchNav';
import { getGospelResults } from '@/lib/gospelVerses';
import { scrollToOccurrence } from '@/lib/occurrenceLabel';

export function useSearchAndGospelResults(
  posRef, loading, verses, topRef, searchTerm, gospelMode, setGospelMode, 
  setGospelResultIndex, setGospelTotalResults, setSearchTerm, setSearchResultIndex, 
  setSearchTotalResults, resultViewRef, setFilterMode, setHighlightedVerses, 
  setSelectedVerses, setHighlightSection, setHighlightVerse, setPos, loadChapter, 
  returnToChapter, clearSearchNavFn, setGospelNavFn, setGospelIndexFn, clearGospelNavFn
) {
  const preSearchPosRef = useRef(null);

  const stepToResult = (r) => {
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
      } catch {}
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
      } catch {}
    } else if (!section && targetVerse) {
      const parsedTarget = parseInt(targetVerse, 10); const single = new Set([parsedTarget]);
      setHighlightedVerses(single); setSelectedVerses(single); setFilterMode(useFilter);
      try {
        const cur = JSON.parse(localStorage.getItem('kjb-position') || '{}');
        localStorage.setItem('kjb-position', JSON.stringify({ ...cur, abbr: r.abbr, chapter: r.chapter, verse: parsedTarget, verseEnd: null }));
      } catch {}
    } else {
      if (!searchTerm && !gospelMode) setFilterMode(false);
      try {
        const cur = JSON.parse(localStorage.getItem('kjb-position') || '{}');
        localStorage.setItem('kjb-position', JSON.stringify({ ...cur, abbr: r.abbr, chapter: r.chapter, verse: r.verse || null, verseEnd: null }));
      } catch {}
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
    const back = preSearchPosRef.current;
    preSearchPosRef.current = null;
    try { localStorage.removeItem('kjb-pre-search'); } catch {}
    if (back && back.abbr && back.chapter) {
      returnToChapter(back.abbr, back.chapter, back.scrollY, setFilterMode, setSelectMode, setSelectedVerses, setHighlightedVerses, setHighlightVerse, setHighlightSection, setShowFilterOverlay, loadChapter);
    } else {
      setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set());
      setHighlightedVerses(new Set()); setHighlightVerse(null); setHighlightSection(null);
      setShowFilterOverlay(false);
    }
  };

  return { stepToResult, clearSearchContext, preSearchPosRef };
}