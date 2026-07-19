import { useEffect, useRef } from 'react';
import { getGospelNav } from '@/lib/searchNav';

export function useToolbarState(pos, loading, verses, filterMode, selectedVerses, searchTerm, searchResultIndex, searchTotalResults, gospelMode, searchClearedRef, setFilterMode, setSelectedVerses, setHighlightedVerses, resultViewRef, setSearchTerm, setSearchResultIndex, setSearchTotalResults, setGospelMode, setGospelResultIndex, setGospelTotalResults) {
  // Prevents the save effect from overwriting persisted state with default
  // values before the restore effect has had a chance to rehydrate it.
  const hasRestoredRef = useRef(false);

  // Persist toolbar state with chapter + search/gospel context
  useEffect(() => {
    if (loading || !hasRestoredRef.current) return;
    try {
      // Only save if we have an ACTIVE search/gospel context (don't save cleared state)
      const hasActiveContext = (searchTerm && !searchClearedRef.current) || gospelMode || selectedVerses.size > 0 || filterMode;
      if (!hasActiveContext) {
        // Clear persisted state when there's no active context
        localStorage.removeItem('kjb-reader-toolbar-state');
        console.log('[ToolbarState] Cleared state - no active context');
        return;
      }
      
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
      console.log('[ToolbarState] Saved state:', state);
    } catch (err) {
      console.error('[ToolbarState] Save error:', err);
    }
  }, [filterMode, selectedVerses, searchTerm, searchClearedRef.current, gospelMode, searchResultIndex, searchTotalResults, pos.abbr, pos.chapter, loading]);

  // Restore toolbar state after chapter loads
  useEffect(() => {
    if (loading || verses.length === 0) return;
    const restoreToolbarState = () => {
      // Mark as restored so the save effect can start persisting again.
      // This prevents the save effect (which also fires when loading flips
      // to false) from overwriting the saved state with default values
      // before we've had a chance to rehydrate filterMode / selectedVerses.
      hasRestoredRef.current = true;
      try {
        // Never rehydrate a stale search/gospel context when we've just
        // navigated here via Daily Verse or Random Chapter - those flows
        // explicitly clear search/gospel state, and this restore (also
        // triggered on window focus) shouldn't undo that.
        const navUrlParams = new URLSearchParams(window.location.search);
        const navFrom = navUrlParams.get('from');
        if (navFrom === 'daily' || navFrom === 'random') return;
        const saved = localStorage.getItem('kjb-reader-toolbar-state');
        console.log('[ToolbarState] Restore attempt - saved:', saved);
        if (!saved) return;
        const state = JSON.parse(saved);
        console.log('[ToolbarState] Parsed state:', state);
        // Restore search/gospel context if we're on the SAME chapter where it was saved
        if (state && state.abbr === pos.abbr && state.chapter === pos.chapter) {
          console.log('[ToolbarState] Chapter match - restoring');
          if (state.filterMode !== undefined) {
            console.log('[ToolbarState] Setting filterMode:', state.filterMode);
            setFilterMode(state.filterMode);
          }
          if (state.selectedVerses && state.selectedVerses.length > 0) {
            const newSet = new Set(state.selectedVerses);
            console.log('[ToolbarState] Setting selectedVerses:', newSet);
            setSelectedVerses(newSet);
            setHighlightedVerses(newSet);
          }
          if (state.resultView) resultViewRef.current = state.resultView;
          // Always restore search context if it exists and hasn't been cleared
          if (state.hasSearchContext && state.searchTerm) {
            console.log('[ToolbarState] Restoring search:', state.searchTerm);
            searchClearedRef.current = false;
            setSearchTerm(state.searchTerm);
            setSearchResultIndex(state.searchResultIndex || 0);
            setSearchTotalResults(state.searchTotalResults || 0);
          }
          // Restore gospel context
          if (state.hasGospelContext) {
            console.log('[ToolbarState] Restoring gospel mode');
            const g = getGospelNav();
            if (g.results.length > 0) {
              setGospelMode(true);
              setGospelResultIndex(g.index);
              setGospelTotalResults(g.results.length);
            }
          }
        } else {
          console.log('[ToolbarState] Chapter mismatch - not restoring', { state, pos });
        }
      } catch (err) {
        console.error('[ToolbarState] Restore error:', err);
      }
    };
    restoreToolbarState();
    const timer = setTimeout(restoreToolbarState, 100);
    window.addEventListener('focus', restoreToolbarState);
    return () => { clearTimeout(timer); window.removeEventListener('focus', restoreToolbarState); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pos.abbr, pos.chapter, verses.length]);
}