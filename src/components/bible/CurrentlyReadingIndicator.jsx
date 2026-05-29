import React, { useRef, useLayoutEffect, useState } from 'react';
import { AlignLeft } from 'lucide-react';

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
}) {
  const isFilterMode = filterMode && selectedVerses.size > 0;
  const isRandom = lastReadingPos && lastReadingPos.fromRandom;
  const isDaily = lastReadingPos && lastReadingPos.fromDailyVerse;

  // Use pos.verse as the source of truth (persists even when highlight fades)
  const verseNum = pos.verse;

  let label = '';
  if (isFilterMode) {
    label = `Selected ${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}`;
  } else if (isRandom) {
    label = `Random chapter — ${book.shortName} ${pos.chapter}`;
  } else if (isDaily) {
    label = `Daily verse — ${book.shortName} ${pos.chapter}:${verseNum || '1'}`;
  } else if (verseNum) {
    label = `${book.shortName} ${pos.chapter}:${verseNum}`;
  }

  if (!label) return null;

  return (
    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-accent/10 border border-accent/20 min-w-[180px] max-w-[280px] flex-shrink-0">
      <div className="flex-1 min-w-0 overflow-hidden">
        <AutoShrinkText className="font-serif font-semibold text-accent block">
          {label}
        </AutoShrinkText>
      </div>
      <button
        onClick={onClear}
        className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-accent text-accent-foreground font-sans text-[10px] font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
        title={isFilterMode ? 'Show full chapter' : 'Clear highlight'}
      >
        <AlignLeft className="w-3 h-3" /> Clear
      </button>
    </div>
  );
}