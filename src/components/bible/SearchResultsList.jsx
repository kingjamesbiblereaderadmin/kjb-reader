import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronDown, ChevronUp, ArrowDown, ChevronRight } from 'lucide-react';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import SearchResultRow from '@/components/bible/SearchResultRow';

const NT_BOOKS = new Set(BIBLE_BOOKS.filter(b => b.testament === 'NT' || BIBLE_BOOKS.indexOf(b) >= 39).map(b => b.apiName));

// Map reader font family values to actual CSS font families
function getFontFamilyValue(family) {
  if (family === 'cursive') return "'Dancing Script', cursive";
  if (family === 'serif') return "'Merriweather', 'Cormorant Garamond', Georgia, serif";
  if (family === 'sans-serif') return "'Inter', system-ui, -apple-system, sans-serif";
  if (family === 'monospace') return "'Courier New', monospace";
  if (family === 'dyslexic') return "'OpenDyslexic', 'Comic Sans MS', sans-serif";
  return "'Merriweather', 'Cormorant Garamond', Georgia, serif";
}

function SearchResultsList({ results, highlightTerm, highlightCaseSensitive, selectMode, selected, onToggleSelect, onGoToVerse, focusedIndex = -1, resultRefs }) {
  // Stable ref setter so rows don't re-render just because the callback identity changed.
  const setRowRef = useCallback((idx, el) => {
    if (resultRefs) resultRefs.current[idx] = el;
  }, [resultRefs]);
  // Track a flat index across results for keyboard focus
  let resultIndex = -1;
  const [otExpanded, setOtExpanded] = useState(true);
  const [ntExpanded, setNtExpanded] = useState(true);
  const otRef = React.useRef(null);
  const ntRef = React.useRef(null);
  
  const [fontFamily, setFontFamily] = React.useState(() => {
    try { return localStorage.getItem('kjb-reader-font-family') || 'serif'; } catch { return 'serif'; }
  });
  React.useEffect(() => {
    const sync = () => {
      try { setFontFamily(localStorage.getItem('kjb-reader-font-family') || 'serif'); } catch {}
    };
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);
  const fontStyle = React.useMemo(() => ({ fontFamily: getFontFamilyValue(fontFamily) }), [fontFamily]);

  // Count total occurrences of the search term (includes multiple hits per verse)
  // split by testament, so the OT/NT headers can show a subtle bracketed count.
  const { otCount, ntCount } = React.useMemo(() => {
    let ot = 0, nt = 0;
    if (!highlightTerm) {
      results.forEach(r => (NT_BOOKS.has(r.book) ? nt++ : ot++));
      return { otCount: ot, ntCount: nt };
    }
    const escaped = highlightTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(escaped, highlightCaseSensitive ? 'g' : 'gi');
    results.forEach(r => {
      const clean = (r.text || '').replace(/[[\]]/g, '');
      const n = (clean.match(re) || []).length;
      if (NT_BOOKS.has(r.book)) nt += n; else ot += n;
    });
    return { otCount: ot, ntCount: nt };
  }, [results, highlightTerm, highlightCaseSensitive]);

  return (
    <div className="space-y-2">
      {results.map((r, i) => {
        const isSelected = selected.has(i);
        const isSubscript = r.isSubscript;
        const isHeading = r.isHeading;
        const isColophon = r.isColophon || (r.verse === 0 && !isSubscript && !isHeading);
        const isNT = NT_BOOKS.has(r.book);
        const prevIsNT = i > 0 ? NT_BOOKS.has(results[i - 1].book) : null;
        const showOTHeader = i === 0 && !isNT;
        const showNTHeader = isNT && (i === 0 || !prevIsNT);
        // Skip rendering this result if its section is collapsed
        const isOTCollapsed = !isNT && !otExpanded;
        const isNTCollapsed = isNT && !ntExpanded;
        // When collapsed: show only the header row, skip all result rows
        if (isOTCollapsed && !showOTHeader) return null;
        if (isNTCollapsed && !showNTHeader) return null;
        return (
          <React.Fragment key={`frag-${i}`}>
            {showOTHeader && (
              <div ref={otRef} className="flex items-center gap-2 pt-2 pb-1 border-b border-border mb-1">
                {ntCount > 0 ? (
                  <button
                    onClick={() => setOtExpanded(!otExpanded)}
                    className="flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {otExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    Old Testament <span className="font-normal normal-case text-muted-foreground/60">[{otCount}]</span>
                  </button>
                ) : (
                  <p className="font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Old Testament <span className="font-normal normal-case text-muted-foreground/60">[{otCount}]</span>
                  </p>
                )}
                {ntCount > 0 && (
                  <button
                    onClick={() => { setNtExpanded(true); setTimeout(() => ntRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}
                    className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
                  >
                    Jump to NT <ArrowDown className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            {showNTHeader && (
              <div ref={ntRef} className="flex items-center gap-2 pt-3 pb-1 border-b border-border mb-1">
                {otCount > 0 ? (
                  <button
                    onClick={() => setNtExpanded(!ntExpanded)}
                    className="flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {ntExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    New Testament <span className="font-normal normal-case text-muted-foreground/60">[{ntCount}]</span>
                  </button>
                ) : (
                  <p className="font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    New Testament <span className="font-normal normal-case text-muted-foreground/60">[{ntCount}]</span>
                  </p>
                )}
                {otCount > 0 && (
                  <button
                    onClick={() => { setOtExpanded(true); setTimeout(() => otRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}
                    className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
                  >
                    Jump to OT <ArrowDown className="w-3 h-3 rotate-180" />
                  </button>
                )}
              </div>
            )}
            {!isOTCollapsed && !isNTCollapsed && (() => {
              resultIndex++;
              const isFocused = focusedIndex === resultIndex;
              const thisIndex = resultIndex;
              return (
                <SearchResultRow
                  r={r}
                  i={i}
                  thisIndex={thisIndex}
                  isFocused={isFocused}
                  isSelected={isSelected}
                  selectMode={selectMode}
                  highlightTerm={highlightTerm}
                  highlightCaseSensitive={highlightCaseSensitive}
                  fontStyle={fontStyle}
                  onToggleSelect={onToggleSelect}
                  onGoToVerse={onGoToVerse}
                  setRef={setRowRef}
                />
              );
            })()}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default React.memo(SearchResultsList);