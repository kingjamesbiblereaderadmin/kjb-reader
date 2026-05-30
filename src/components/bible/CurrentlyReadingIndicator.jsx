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
  onClear,
  searchTerm,
  onPrevResult,
  onNextResult,
  currentResultIndex,
  totalResults,
  gospelMode,
}) {
  const isFilterMode = filterMode && selectedVerses.size > 0;
  const isRandom = lastReadingPos && lastReadingPos.fromRandom;
  const isDaily = lastReadingPos && lastReadingPos.fromDailyVerse;
  const verseNum = pos.verse;

  // Build label — no double colons
  let typeLabel = '';
  let reference = '';
  let clearLabel = 'Clear';

  if (gospelMode) {
    typeLabel = 'Gospel';
    reference = `${book.shortName} ${pos.chapter}${verseNum ? `:${verseNum}` : ''}`;
    clearLabel = 'Clear';
  } else if (searchTerm) {
    typeLabel = `Search: "${searchTerm}"`;
    reference = `${book.shortName} ${pos.chapter}${verseNum ? `:${verseNum}` : ''}`;
    clearLabel = 'Clear search';
  } else if (isFilterMode) {
    typeLabel = 'Reading';
    reference = `${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}`;
    clearLabel = 'Show Full Chapter';
  } else if (isDaily) {
    const v = lastReadingPos.verse || verseNum || '1';
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

  const showNavigation = (searchTerm || gospelMode) && totalResults > 1 && onPrevResult && onNextResult;

  return (
    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-yellow-500 text-black font-sans text-xs font-medium h-11 whitespace-nowrap flex-shrink-0">
      <div className="flex flex-col leading-tight min-w-0">
        {typeLabel ? (
          <>
            <span className="font-semibold text-[10px] uppercase tracking-wide opacity-75">{typeLabel}</span>
            <span className="font-bold text-xs">{reference}</span>
          </>
        ) : (
          <span className="font-bold text-xs">{reference}</span>
        )}
      </div>
      {showNavigation && (
        <>
          <span className="ml-1 text-[10px] font-semibold opacity-70">{currentResultIndex + 1}/{totalResults}</span>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPrevResult(); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onPrevResult(); }}
            disabled={currentResultIndex <= 0}
            title="Previous result"
            className="p-0.5 rounded hover:bg-black/20 transition-colors flex-shrink-0 disabled:opacity-30"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNextResult(); }}
            onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onNextResult(); }}
            disabled={currentResultIndex >= totalResults - 1}
            title="Next result"
            className="p-0.5 rounded hover:bg-black/20 transition-colors flex-shrink-0 disabled:opacity-30"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </>
      )}
      {onClear && (
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClear(); }}
          onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); onClear(); }}
          title={clearLabel}
          className="ml-0.5 p-0.5 rounded hover:bg-black/20 transition-colors flex-shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}