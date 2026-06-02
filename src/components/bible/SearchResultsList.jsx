import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ChevronDown, ArrowDown, ChevronRight } from 'lucide-react';
import { BIBLE_BOOKS, BOOK_BY_API_NAME } from '@/lib/bibleData';
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

// Count occurrences of the search term within a verse's text (multiple hits per verse)
function countOccurrences(text, term, caseSensitive) {
  if (!term) return 1;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(escaped, caseSensitive ? 'g' : 'gi');
  const clean = (text || '').replace(/[[\]]/g, '');
  return (clean.match(re) || []).length;
}

function SearchResultsList({ results, highlightTerm, highlightCaseSensitive, selectMode, selected, onToggleSelect, onGoToVerse, focusedIndex = -1, resultRefs }) {
  // Stable ref setter so rows don't re-render just because the callback identity changed.
  const setRowRef = useCallback((idx, el) => {
    if (resultRefs) resultRefs.current[idx] = el;
  }, [resultRefs]);

  const [otExpanded, setOtExpanded] = useState(true);
  const [ntExpanded, setNtExpanded] = useState(true);
  // Which book groups are collapsed (by apiName). Default: all expanded.
  const [collapsedBooks, setCollapsedBooks] = useState(() => new Set());
  const otRef = useRef(null);
  const ntRef = useRef(null);

  const [fontFamily, setFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-reader-font-family') || 'serif'; } catch { return 'serif'; }
  });
  useEffect(() => {
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
  const fontStyle = useMemo(() => ({ fontFamily: getFontFamilyValue(fontFamily) }), [fontFamily]);

  // Group results by testament → book, preserving canonical order and each
  // result's original flat index (used for keyboard focus, selection, navigation).
  const { groups, otCount, ntCount } = useMemo(() => {
    const byBook = new Map(); // apiName -> { book, items: [{ r, i }], count }
    let ot = 0, nt = 0;
    results.forEach((r, i) => {
      const occ = countOccurrences(r.text, highlightTerm, highlightCaseSensitive);
      if (NT_BOOKS.has(r.book)) nt += occ; else ot += occ;
      if (!byBook.has(r.book)) {
        byBook.set(r.book, { book: r.book, items: [], count: 0 });
      }
      const g = byBook.get(r.book);
      g.items.push({ r, i });
      g.count += occ;
    });
    // Order book groups canonically
    const ordered = [...byBook.values()].sort((a, b) => {
      const ai = BIBLE_BOOKS.findIndex(x => x.apiName === a.book);
      const bi = BIBLE_BOOKS.findIndex(x => x.apiName === b.book);
      return ai - bi;
    });
    return {
      groups: ordered.map(g => ({ ...g, isNT: NT_BOOKS.has(g.book) })),
      otCount: ot,
      ntCount: nt,
    };
  }, [results, highlightTerm, highlightCaseSensitive]);

  // When the focused row changes (via keyboard nav), make sure its book group
  // is expanded, then scroll the app's real scroll container (#kjb-scroll) so
  // the focused row sits just below the header. Deferred a frame so it reads
  // the final layout after any expand + focus re-render.
  useEffect(() => {
    if (focusedIndex < 0) return;
    const focused = results[focusedIndex];
    if (focused && collapsedBooks.has(focused.book)) {
      setCollapsedBooks(prev => {
        const next = new Set(prev);
        next.delete(focused.book);
        return next;
      });
    }
    requestAnimationFrame(() => {
      const el = resultRefs?.current?.[focusedIndex];
      const container = document.getElementById('kjb-scroll');
      if (!el || !container) return;
      const HEADER_OFFSET = 16;
      const delta = el.getBoundingClientRect().top - container.getBoundingClientRect().top - HEADER_OFFSET;
      container.scrollTo({ top: container.scrollTop + delta, behavior: 'auto' });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusedIndex]);

  const toggleBook = useCallback((apiName) => {
    setCollapsedBooks(prev => {
      const next = new Set(prev);
      next.has(apiName) ? next.delete(apiName) : next.add(apiName);
      return next;
    });
  }, []);

  let firstNTSeen = false;

  return (
    <div className="space-y-2">
      {groups.map((group, gi) => {
        const isNT = group.isNT;
        const showOTHeader = gi === 0 && !isNT;
        const showNTHeader = isNT && !firstNTSeen;
        if (isNT) firstNTSeen = true;
        const sectionCollapsed = isNT ? !ntExpanded : !otExpanded;
        const bookEntry = BOOK_BY_API_NAME[group.book];
        const bookName = bookEntry?.shortName || group.book;
        const bookCollapsed = collapsedBooks.has(group.book);

        return (
          <React.Fragment key={`grp-${group.book}`}>
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

            {/* Per-book dropdown header + its verses (hidden if testament collapsed) */}
            {!sectionCollapsed && (
              <div className="rounded-xl border border-border/60 overflow-hidden">
                <button
                  onClick={() => toggleBook(group.book)}
                  className="w-full flex items-center gap-2 px-3 py-2 bg-secondary/60 hover:bg-accent/15 transition-colors text-left"
                >
                  {bookCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
                  <span className="font-sans text-sm font-semibold text-foreground">{bookName}</span>
                  <span className="font-sans text-xs text-muted-foreground">
                    · {group.items.length} verse{group.items.length !== 1 ? 's' : ''}
                    {group.count > group.items.length ? ` · ${group.count} occurrence${group.count !== 1 ? 's' : ''}` : ''}
                  </span>
                </button>
                {!bookCollapsed && (
                  <div className="p-2 space-y-2">
                    {group.items.map(({ r, i }) => {
                      // Key refs and focus by the ABSOLUTE results index (i), not
                      // visible render order — the keyboard handler steps through
                      // `results` by index, so they must stay aligned regardless of grouping.
                      return (
                        <SearchResultRow
                          key={`row-${i}`}
                          r={r}
                          i={i}
                          thisIndex={i}
                          isFocused={focusedIndex === i}
                          isSelected={selected.has(i)}
                          selectMode={selectMode}
                          highlightTerm={highlightTerm}
                          highlightCaseSensitive={highlightCaseSensitive}
                          fontStyle={fontStyle}
                          onToggleSelect={onToggleSelect}
                          onGoToVerse={onGoToVerse}
                          setRef={setRowRef}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default React.memo(SearchResultsList);