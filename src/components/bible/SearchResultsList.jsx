import React, { useState, useEffect, useMemo, useRef } from 'react';
import { BookOpen, CheckSquare, Square, ChevronDown, ChevronUp, ArrowDown, ChevronRight } from 'lucide-react';
import { BIBLE_BOOKS } from '@/lib/bibleData';

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

// Render [bracketed] words as <em> italics, with optional search-term highlighting
function renderWithItalics(text, searchTerm, caseSensitive) {
  const segments = [];
  const italicRegex = /\[([^\]]+)\]/g;
  let lastIdx = 0;
  let m;
  while ((m = italicRegex.exec(text)) !== null) {
    if (m.index > lastIdx) segments.push({ italic: false, text: text.slice(lastIdx, m.index) });
    segments.push({ italic: true, text: m[1] });
    lastIdx = m.index + m[0].length;
  }
  if (lastIdx < text.length) segments.push({ italic: false, text: text.slice(lastIdx) });

  const renderHighlighted = (str, keyBase) => {
    if (!searchTerm) return str;
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(`(${escaped})`, flags);
    const testRegex = new RegExp(escaped, flags);
    const parts = str.split(regex);
    return parts.map((part, i) =>
      testRegex.test(part)
        ? <mark key={`${keyBase}-${i}`} className="bg-accent/40 text-foreground rounded px-0.5">{part}</mark>
        : <React.Fragment key={`${keyBase}-${i}`}>{part}</React.Fragment>
    );
  };

  return segments.map((seg, i) =>
    seg.italic
      ? <em key={i} className="text-foreground/75">{renderHighlighted(seg.text, `i${i}`)}</em>
      : <React.Fragment key={i}>{renderHighlighted(seg.text, `n${i}`)}</React.Fragment>
  );
}

function SearchResultsList({ results, highlightTerm, highlightCaseSensitive, selectMode, selected, onToggleSelect, onGoToVerse }) {
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
  const fontStyle = { fontFamily: getFontFamilyValue(fontFamily) };

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
        const isColophon = r.isColophon || r.verse === 0;
        const isNT = NT_BOOKS.has(r.book);
        const prevIsNT = i > 0 ? NT_BOOKS.has(results[i - 1].book) : null;
        const showOTHeader = i === 0 && !isNT;
        const showNTHeader = isNT && (i === 0 || !prevIsNT);
        return (
          <React.Fragment key={`frag-${i}`}>
            {showOTHeader && (
              <div className="flex items-center gap-2 pt-2 pb-1 border-b border-border mb-1">
                <button
                  onClick={() => setOtExpanded(!otExpanded)}
                  className="flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                >
                  {otExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  Old Testament <span className="font-normal normal-case text-muted-foreground/60">[{otCount}]</span>
                </button>
                {ntCount > 0 && (
                  <button
                    onClick={() => ntRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
                  >
                    Jump to NT <ArrowDown className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}
            {showNTHeader && (
              <div ref={ntRef} className="flex items-center gap-2 pt-3 pb-1 border-b border-border mb-1">
                <button
                  onClick={() => setNtExpanded(!ntExpanded)}
                  className="flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                >
                  {ntExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  New Testament <span className="font-normal normal-case text-muted-foreground/60">[{ntCount}]</span>
                </button>
                {otCount > 0 && (
                  <button
                    onClick={() => otRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
                  >
                    Jump to OT <ArrowDown className="w-3 h-3 rotate-180" />
                  </button>
                )}
              </div>
            )}
            {!((showOTHeader && !otExpanded) || (showNTHeader && !ntExpanded)) && (
              <div
                onClick={() => {
                  if (selectMode) {
                    onToggleSelect(i);
                  } else if (isColophon) {
                    onGoToVerse(r.abbr, r.chapter, null);
                  } else {
                    onGoToVerse(r.abbr, r.chapter, r.verse);
                  }
                }}
                className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? 'bg-primary/10 border-primary/40'
                    : 'bg-card border-border hover:border-accent/40 hover:bg-accent/5'
                }`}
              >
                {selectMode && (
                  <div className="shrink-0 mt-0.5">
                    {isSelected
                      ? <CheckSquare className="w-4 h-4 text-primary" />
                      : <Square className="w-4 h-4 text-muted-foreground" />
                    }
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-xs text-accent font-semibold mb-1 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {BIBLE_BOOKS.find(b => b.apiName === r.book)?.shortName || r.book} {r.chapter}
                    {isColophon ? ' (Colophon)' : `:${r.verse}`}
                  </p>
                  <p className="text-base text-foreground leading-relaxed" style={fontStyle}>
                    {isColophon ? (
                      <span className="italic text-muted-foreground">¶ {renderWithItalics(r.text, highlightTerm, highlightCaseSensitive)}</span>
                    ) : (
                      <span>"{renderWithItalics(r.text, highlightTerm, highlightCaseSensitive)}"</span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default React.memo(SearchResultsList);