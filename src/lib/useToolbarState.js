import { useEffect, useRef, useState } from 'react';
import { getGospelNav } from '@/lib/searchNav';

export function useToolbarState(pos, loading, verses, filterMode, selectedVerses, searchTerm, searchResultIndex, searchTotalResults, gospelMode, searchClearedRef, setFilterMode, setSelectedVerses, setHighlightedVerses, resultViewRef, setSearchTerm, setSearchResultIndex, setSearchTotalResults, setGospelMode, setGospelResultIndex, setGospelTotalResults, setHighlightVerse) {
  // Prevents the save effect from overwriting persisted state with default
  // values before the restore has had a chance to rehydrate it.
  const hasRestoredRef = useRef(false);
  // Forces the save effect to fire once after restore completes — even when
  // nothing was restored (e.g. toolbar state was cleared by goMulti). Without
  // this, the save effect would never fire and the current filterMode/selection
  // would never be persisted.
  const [restoreTick, setRestoreTick] = useState(0);

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
  }, [filterMode, selectedVerses, searchTerm, searchClearedRef.current, gospelMode, searchResultIndex, searchTotalResults, pos.abbr, pos.chapter, loading, restoreTick]);

  // Restore toolbar state after chapter loads
  useEffect(() => {
    if (loading || verses.length === 0) return;

    const restoreToolbarState = () => {
      // Mark as restored so the save effect can start persisting again.
      hasRestoredRef.current = true;
      try {
        // Never rehydrate a stale search/gospel context when we've just
        // navigated here via Daily Verse or Random Chapter - those flows
        // explicitly clear search/gospel state, and this restore (also
        // triggered on window focus) shouldn't undo that.
        const navUrlParams = new URLSearchParams(window.location.search);
        const navFrom = navUrlParams.get('from');
        if (navFrom === 'daily' || navFrom === 'random') {
          setRestoreTick(t => t + 1);
          return;
        }
        const saved = localStorage.getItem('kjb-reader-toolbar-state');
        console.log('[ToolbarState] Restore attempt - saved:', saved);
        if (!saved) {
          // Nothing to restore — still force a save so the current state
          // (e.g. filterMode set by stepToResult) gets persisted.
          setRestoreTick(t => t + 1);
          return;
        }
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
            // Re-highlight and scroll to the restored verse(s) so coming back to
            // /read (e.g. via the bottom nav) lands where the user left off,
            // not just at the top of the chapter with the toolbar re-populated.
            if (setHighlightVerse) setHighlightVerse(Math.min(...newSet));
          }
          // Restore the "verse/chapter only" flag (Show Full Chapter vs Verses
          // Only) so it matches what the user last had open on this chapter.
          if (state.resultView) {
            console.log('[ToolbarState] Restoring resultView:', state.resultView);
            resultViewRef.current = state.resultView;
          }
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
      // Force the save effect to fire with the (possibly) restored state.
      setRestoreTick(t => t + 1);
    };
    restoreToolbarState();
    const timer = setTimeout(restoreToolbarState, 100);
    window.addEventListener('focus', restoreToolbarState);
    return () => { clearTimeout(timer); window.removeEventListener('focus', restoreToolbarState); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, pos.abbr, pos.chapter, verses.length]);
}