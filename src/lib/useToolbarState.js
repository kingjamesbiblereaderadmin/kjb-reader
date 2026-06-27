import { useEffect, useRef } from 'react';
import { getGospelNav } from '@/lib/searchNav';

export function useToolbarState(pos, loading, verses, filterMode, selectedVerses, searchTerm, searchResultIndex, searchTotalResults, gospelMode, searchClearedRef, setFilterMode, setSelectedVerses, setHighlightedVerses, resultViewRef, setSearchTerm, setSearchResultIndex, setSearchTotalResults, setGospelMode, setGospelResultIndex, setGospelTotalResults) {
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
    } catch (err) {
      console.error('[ToolbarState] Save error:', err);
    }
  }, [filterMode, selectedVerses, searchTerm, searchClearedRef.current, gospelMode, searchResultIndex, searchTotalResults, pos.abbr, pos.chapter, loading]);

  // Restore toolbar state after chapter loads
  useEffect(() => {
    if (loading || verses.length === 0) return;
    const restoreToolbarState = () => {
      try {
        const saved = localStorage.getItem('kjb-reader-toolbar-state');
        if (!saved) return;
        const state = JSON.parse(saved);
        // Restore search/gospel context if we're on the SAME chapter where it was saved
        if (state && state.abbr === pos.abbr && state.chapter === pos.chapter) {
          if (state.filterMode !== undefined) setFilterMode(state.filterMode);
          if (state.selectedVerses && state.selectedVerses.length > 0) {
            const newSet = new Set(state.selectedVerses);
            setSelectedVerses(newSet);
            setHighlightedVerses(newSet);
          }
          if (state.resultView) resultViewRef.current = state.resultView;
          // Always restore search context if it exists and hasn't been cleared
          if (state.hasSearchContext && state.searchTerm) {
            searchClearedRef.current = false;
            setSearchTerm(state.searchTerm);
            setSearchResultIndex(state.searchResultIndex || 0);
            setSearchTotalResults(state.searchTotalResults || 0);
          }
          // Restore gospel context
          if (state.hasGospelContext) {
            const g = getGospelNav();
            if (g.results.length > 0) {
              setGospelMode(true);
              setGospelResultIndex(g.index);
              setGospelTotalResults(g.results.length);
            }
          }
        }
      } catch (err) {
        console.error('[ToolbarState] Restore error:', err);
      }
    };
    restoreToolbarState();
    const timer = setTimeout(restoreToolbarState, 100);
    window.addEventListener('focus', restoreToolbarState);
    return () => { clearTimeout(timer); window.removeEventListener('focus', restoreToolbarState); };
  }, [loading, pos.abbr, pos.chapter, verses.length, setGospelMode, setGospelResultIndex, setGospelTotalResults]);
}