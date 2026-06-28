import { useRef } from 'react';

export function useReaderNavigation(pos, loadChapter, routerNavigate, routerLocation) {
  const preSearchPosRef = useRef(null);
  const rangeHighlightRef = useRef(false);
  const resultViewRef = useRef('filter');
  const freshNavRef = useRef(false);

  const savePosition = (abbr, chapter, verse = null) => {
    try {
      let verseEnd = null;
      try {
        const prev = JSON.parse(localStorage.getItem('kjb-position') || '{}');
        if (prev.abbr === abbr && prev.chapter === chapter && prev.verse === verse && prev.verseEnd) {
          verseEnd = prev.verseEnd;
        }
      } catch (err) { console.debug('[useReaderNavigation] read previous position failed:', err); }
      try { localStorage.setItem('kjb-position', JSON.stringify({ abbr, chapter, verse, verseEnd })); } catch (err) { console.debug('[useReaderNavigation] persist kjb-position failed:', err); }
    } catch (err) { console.debug('[useReaderNavigation] savePosition outer error:', err); }
  };

  const navigate = (newAbbr, newChapter, jumpVerse = null, fromDailyVerse = false, fromRandom = false, isAutoAdvance = false, section = null, preserveSearchContext = false, clearSearchNav, setGospelMode, clearGospelNav) => {
    if (newChapter === 0 && newAbbr !== 'GEN' && newAbbr !== 'MAT') return;
    if (!preserveSearchContext) {
      clearSearchNav();
      setGospelMode(false);
      clearGospelNav();
    }
    
    savePosition(newAbbr, newChapter, jumpVerse);
    resultViewRef.current = 'filter';
    rangeHighlightRef.current = false;
    freshNavRef.current = true;
    
    loadChapter(newAbbr, newChapter, jumpVerse);
    
    try {
      let url;
      if (newChapter === 0) url = `/read?titlePage=${newAbbr === 'MAT' ? 'new' : 'old'}`;
      else { url = `/read?book=${newAbbr}&chapter=${newChapter}`; if (jumpVerse) url += `&verse=${jumpVerse}`; if (section) url += `&highlight=${section}`; }
      try { routerNavigate(url, { replace: isAutoAdvance || false }); } catch (err) { console.debug('[useReaderNavigation] routerNavigate failed:', err); }
  };

  const returnToChapter = (abbr, chapter, exactY, setFilterMode, setSelectMode, setSelectedVerses, setHighlightedVerses, setHighlightVerse, setHighlightSection, setShowFilterOverlay, loadChapter) => {
    if (!abbr || !chapter) return;
    setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set());
    setHighlightedVerses(new Set()); setHighlightVerse(null); setHighlightSection(null);
    setShowFilterOverlay(false);
    if (typeof exactY === 'number' && exactY > 0) {
      try { localStorage.setItem(`kjb-scroll-${abbr}-${chapter}`, String(Math.round(exactY))); } catch (err) { console.debug('[useReaderNavigation] persist kjb-scroll failed:', err); }
    }
    try { window.history.replaceState({}, '', '/read'); } catch {}
    freshNavRef.current = false;
    loadChapter(abbr, chapter, null);
  };

  return { navigate, returnToChapter, preSearchPosRef, rangeHighlightRef, resultViewRef, freshNavRef };
}