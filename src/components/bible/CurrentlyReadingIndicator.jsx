import React from 'react';
import { X, ChevronUp, ChevronDown } from 'lucide-react';

// Format verses with dashes for consecutive, commas for gaps
function formatVerseRange(verses) {
  if (!verses || verses.length === 0) return '';
  if (verses.length === 1) return String(verses[0]);
  const sorted = [...verses].sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0], end = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) { end = sorted[i]; }
    else { ranges.push(start === end ? String(start) : `${start}-${end}`); start = sorted[i]; end = sorted[i]; }
  }
  ranges.push(start === end ? String(start) : `${start}-${end}`);
  return ranges.join(',');
}

export default function CurrentlyReadingIndicator({
  highlightVerse,
  filterMode,
  selectedVerses,
  lastReadingPos,
  book,
  pos,
  highlightSection,
  onClear,
  searchTerm,
  onPrevResult,
  onNextResult,
  currentResultIndex,
  totalResults,
  gospelMode,
  gospelLabel,
  occurrenceLabel,
}) {
  const isFilterMode = filterMode && selectedVerses.size > 0;
  // isRandom now defined above with isDaily
  // Check URL params first to determine the navigation source
  const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const isFromDaily = urlParams?.get('from') === 'daily';
  const isFromRandom = urlParams?.get('from') === 'random';
  const isFromSearch = urlParams?.get('from') === 'search';
  
  // Use lastReadingPos if available, but also check the URL for 'from=daily' 
  // to handle cases where the user clicked a notification or opened a shared link.
  // An active search or gospel context always wins over a stale lastReadingPos
  // daily/random flag — otherwise typing a search reference while viewing the
  // Daily Verse (or a previous search result) leaves the indicator stuck
  // showing "Daily Verse" against the new reference instead of updating to
  // reflect the search.
  const hasActiveSearchOrGospel = !!searchTerm || isFromSearch || gospelMode;
  const isDaily = !hasActiveSearchOrGospel && (isFromDaily || (lastReadingPos && (lastReadingPos.fromDailyVerse || lastReadingPos.fromDaily)));
  const isRandom = !hasActiveSearchOrGospel && (isFromRandom || (lastReadingPos && (lastReadingPos.fromRandom || lastReadingPos.fromRandomChapter)));
  
  // Only use search term if we're actually in search mode (not daily/random)
  let effectiveSearchTerm = searchTerm;
  if (isDaily || isRandom) {
    // Force clear search term for daily/random - don't show search toolbar
    effectiveSearchTerm = null;
  } else if (!effectiveSearchTerm && !gospelMode && urlParams) {
    if (isFromSearch) {
      effectiveSearchTerm = urlParams.get('q') || localStorage.getItem('kjb-search-term') || null;
    }
  }
  const verseNum = pos.verse;
  // Suffix for non-verse sections (Psalm superscription / book colophon)
  const sectionSuffix = highlightSection === 'colophon'
    ? ' (Colophon)'
    : highlightSection === 'subscript'
    ? ' (Superscription)'
    : '';

  // Build label — no double colons
  let typeLabel = '';
  let reference = '';
  let searchedRefs = null;
  let clearLabel = 'Clear';

  if (gospelMode) {
    typeLabel = gospelLabel || 'Gospel';
    const gospelVerses = selectedVerses && selectedVerses.size > 1
      ? `:${formatVerseRange([...selectedVerses])}`
      : verseNum ? `:${verseNum}` : '';
    reference = `${book.shortName} ${pos.chapter}${gospelVerses}`;
    clearLabel = 'Clear';
  } else if (effectiveSearchTerm) {
    typeLabel = `Searched: "${effectiveSearchTerm}"`;
    const isStanza = book.abbr === 'PSA' && pos.chapter === 119 && selectedVerses && selectedVerses.size > 1;
    const searchVerses = isStanza
      ? ` (Stanza)`
      : (verseNum ? `:${verseNum}${occurrenceLabel || ''}` : '');
    reference = `${book.shortName} ${pos.chapter}${searchVerses}${sectionSuffix}`;
    clearLabel = (selectedVerses && selectedVerses.size > 0) || filterMode ? 'Show Full Chapter' : 'Clear search';
  } else if (isFilterMode) {
    typeLabel = 'Reading';
    reference = `${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}`;
    clearLabel = 'Show Full Chapter';
  } else if (isDaily) {
    const v = (lastReadingPos && lastReadingPos.verse) || verseNum || '1';
    typeLabel = 'Daily Verse';
    reference = `${book.shortName} ${pos.chapter}:${v}`;
    clearLabel = 'Clear';
  } else if (isRandom) {
    typeLabel = 'Random Chapter';
    reference = `${book.shortName} ${pos.chapter}${verseNum ? `:${verseNum}` : ''}`;
    clearLabel = 'Clear';
  } else if (verseNum) {
    reference = `${book.shortName} ${pos.chapter}:${verseNum}`;
  } else {
    reference = `${book.shortName} ${pos.chapter}`;
  }

  if (!reference) return null;

  const showNavigation = !isDaily && !isRandom && (effectiveSearchTerm || gospelMode) && totalResults > 1 && onPrevResult && onNextResult;

  return (
    <div className="flex items-stretch gap-2 px-3 py-2 rounded-lg bg-yellow-500 text-black font-sans text-xs font-medium min-w-0 flex-shrink-0">
      <div className="flex flex-col leading-snug gap-0.5 min-w-0 justify-center">
        {typeLabel ? (
          <>
            <span className="font-semibold text-[10px] uppercase tracking-wide opacity-75 truncate max-w-full block">{typeLabel}</span>
            {searchedRefs && (
              <span className="text-[10px] opacity-60 truncate max-w-full block">Searched: {searchedRefs}</span>
            )}
            <span className="font-bold text-sm truncate max-w-full block">{reference}</span>
          </>
        ) : (
          <span className="font-bold text-sm truncate max-w-full block">{reference}</span>
        )}
      </div>
      {(showNavigation || onClear) && (
        <div className="flex items-center gap-1 flex-shrink-0 border-l border-black/20 pl-2">
          {showNavigation && (
            <>
              <span className="text-[10px] font-semibold opacity-70">{currentResultIndex + 1}/{totalResults}</span>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPrevResult(); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onPrevResult(); }}
                title="Previous result (wraps to last)"
                className="p-1 rounded hover:bg-black/20 transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNextResult(); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onNextResult(); }}
                title="Next result (wraps to first)"
                className="p-1 rounded hover:bg-black/20 transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </>
          )}
          {onClear && (
            <button
              id="kjb-currently-reading-clear-btn"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClear();
              }}
              title={clearLabel}
              className="p-1 rounded hover:bg-black/20 transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}