import { useEffect, useRef } from 'react';

export function useToolbarState(pos, loading, verses, filterMode, selectedVerses, searchTerm, searchResultIndex, searchTotalResults, gospelMode, searchClearedRef, setFilterMode, setSelectedVerses, setHighlightedVerses, resultViewRef, setSearchTerm, setSearchResultIndex, setSearchTotalResults) {
  // Persist toolbar state with chapter + search/gospel context
  useEffect(() => {
    if (loading) return;
    try {
      const state = {
        abbr: pos.abbr,
        chapter: pos.chapter,
        filterMode,
        selectedVerses: [...selectedVerses],
        resultView: resultViewRef.current,
        hasSearchContext: !!(searchTerm && !searchClearedRef.current),
        hasGospelContext: gospelMode,
        searchTerm: searchTerm && !searchClearedRef.current ? searchTerm : null,
        searchResultIndex,
        searchTotalResults,
        timestamp: Date.now()
      };
      localStorage.setItem('kjb-reader-toolbar-state', JSON.stringify(state));
    } catch {}
  }, [filterMode, selectedVerses, searchTerm, gospelMode, searchResultIndex, searchTotalResults, pos.abbr, pos.chapter, loading]);

  // Restore toolbar state after chapter loads
  useEffect(() => {
    if (loading || verses.length === 0) return;
    const restoreToolbarState = () => {
      try {
        const saved = localStorage.getItem('kjb-reader-toolbar-state');
        if (!saved) return;
        const state = JSON.parse(saved);
        if (state && state.abbr === pos.abbr && state.chapter === pos.chapter && Date.now() - state.timestamp < 600000) {
          if (state.filterMode !== undefined) setFilterMode(state.filterMode);
          if (state.selectedVerses && state.selectedVerses.length > 0) {
            const newSet = new Set(state.selectedVerses);
            setSelectedVerses(newSet);
            setHighlightedVerses(newSet);
          }
          if (state.resultView) resultViewRef.current = state.resultView;
          if (state.hasSearchContext && state.searchTerm && !searchTerm) {
            searchClearedRef.current = false;
            setSearchTerm(state.searchTerm);
            setSearchResultIndex(state.searchResultIndex || 0);
            setSearchTotalResults(state.searchTotalResults || 0);
          }
        }
      } catch {}
    };
    restoreToolbarState();
    const timer = setTimeout(restoreToolbarState, 100);
    window.addEventListener('focus', restoreToolbarState);
    return () => { clearTimeout(timer); window.removeEventListener('focus', restoreToolbarState); };
  }, [loading, pos.abbr, pos.chapter, verses.length]);
}