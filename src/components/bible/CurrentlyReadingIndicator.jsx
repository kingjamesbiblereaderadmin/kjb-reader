import React, { useRef, useLayoutEffect, useState } from 'react';
import { AlignLeft, ChevronLeft, ChevronRight } from 'lucide-react';

// Format verses with dashes for consecutive, commas for gaps
function formatVerseRange(verses) {
  if (!verses || verses.length === 0) return '';
  if (verses.length === 1) return String(verses[0]);
  
  const sorted = [...verses].sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0];
  let end = sorted[0];
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? String(start) : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? String(start) : `${start}-${end}`);
  
  return ranges.join(',');
}

// Auto-shrinking text for the "Currently reading" label so long book names fit.
function AutoShrinkText({ children, className, baseSize = '0.75rem' }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => { setScale(1); }, [children]);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const overflowing = el.scrollWidth > el.clientWidth + 1;
    if (overflowing && scale > 0.5) {
      setScale(s => Math.max(0.5, s - 0.1));
    }
  }, [scale, children]);

  return (
    <span
      ref={ref}
      className={className}
      style={{ fontSize: baseSize, transform: `scale(${scale})`, transformOrigin: 'left center', whiteSpace: 'nowrap', display: 'inline-block' }}
    >
      {children}
    </span>
  );
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
}) {
  const isFilterMode = filterMode && selectedVerses.size > 0;
  const isRandom = lastReadingPos && lastReadingPos.fromRandom;
  const isDaily = lastReadingPos && lastReadingPos.fromDailyVerse;

  // Use pos.verse as the source of truth (persists even when highlight fades)
  const verseNum = pos.verse;

  let prefix = '';
  let label = '';
  let clearLabel = 'Clear';
  
  if (searchTerm) {
    prefix = `Search: "${searchTerm}"`;
    label = `${book.shortName} ${pos.chapter}:${verseNum || ''}`;
    clearLabel = 'Clear search';
  } else if (isFilterMode) {
    prefix = 'Reading';
    label = `${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}`;
    clearLabel = 'Show Full Chapter';
  } else if (isRandom) {
    prefix = 'Currently reading';
    label = `Random chapter: ${book.shortName} ${pos.chapter}:${verseNum || '1'}`;
    clearLabel = 'Clear';
  } else if (isDaily) {
    prefix = 'Currently reading';
    label = `Daily verse: ${book.shortName} ${pos.chapter}:${verseNum || '1'}`;
    clearLabel = 'Clear';
  } else if (verseNum) {
    label = `${book.shortName} ${pos.chapter}:${verseNum}`;
  } else {
    label = `${book.shortName} ${pos.chapter}`;
  }

  if (!label) return null;

  const showNav = searchTerm && totalResults > 1;

  return (
    <div className="flex items-center justify-center gap-1.5 px-2.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all duration-200 h-11 min-w-[44px]">
      <div className="flex-1 min-w-0 text-center">
        <p className="font-sans text-xs font-medium text-secondary-foreground leading-tight">
          {prefix ? `${prefix}: ${label}` : label}
        </p>
      </div>
    </div>
  );
}