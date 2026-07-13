import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FlaskConical, Loader2, SlidersHorizontal, X, CheckSquare, Square } from 'lucide-react';
import {
  buildVerseIndex, applyFilters, defaultFilters, NUMERIC_METRICS, isDefaultFilters,
} from '@/lib/verseAnalysis';
import AdvancedFilterPanel from '@/components/search/AdvancedFilterPanel';
import AdvancedResultRow from '@/components/search/AdvancedResultRow';
import AdvancedResultsToolbar from '@/components/search/AdvancedResultsToolbar';

const PAGE_SIZE = 50;

export default function AdvancedSearchPage() {
  const [records, setRecords] = useState(null);   // null = loading
  const [error, setError] = useState('');
  const [filters, setFilters] = useState(defaultFilters);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [showFilters, setShowFilters] = useState(false); // mobile drawer
  const [selectMode, setSelectMode] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(() => new Set());

  useEffect(() => {
    let cancelled = false;
    buildVerseIndex()
      .then(recs => { if (!cancelled) setRecords(recs); })
      .catch(err => { if (!cancelled) setError(err?.message || 'Could not load Bible data.'); });
    return () => { cancelled = true; };
  }, []);

  // Until the user actually sets a filter or search term, the page starts
  // empty (no results) rather than dumping all 31,102 verses.
  const isEmpty = useMemo(() => isDefaultFilters(filters), [filters]);

  // Recompute results whenever filters or records change.
  const results = useMemo(() => {
    if (!records || isEmpty) return [];
    return applyFilters(records, filters);
  }, [records, filters, isEmpty]);

  // Reset the visible window + selection when the result set changes.
  useEffect(() => { setVisible(PAGE_SIZE); setSelectedKeys(new Set()); }, [filters]);

  const keyOf = (r) => `${r.abbr}-${r.chapter}-${r.verse}`;

  const toggleSelect = useCallback((r) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      const k = keyOf(r);
      if (next.has(k)) next.delete(k); else next.add(k);
      return next;
    });
  }, []);

  const selectedRecords = useMemo(
    () => results.filter(r => selectedKeys.has(keyOf(r))),
    [results, selectedKeys]
  );

  const sortLabel = useMemo(
    () => NUMERIC_METRICS.find(m => m.key === filters.sortKey)?.label.toLowerCase() || '',
    [filters.sortKey]
  );

  const handleReset = useCallback(() => setFilters(defaultFilters()), []);

  return (
    <div className="w-full max-w-[120rem] mx-auto px-5 sm:px-8 lg:px-12 pt-10 pb-32">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 mb-4">
          <FlaskConical className="w-7 h-7 text-white" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Advanced Search</h1>
        <p className="font-sans text-sm text-muted-foreground max-w-md mx-auto">
          Research the King James Bible by verse properties — length, pilcrows, italics, capitals, punctuation and more.
        </p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      {records === null && !error && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary/70" />
          <p className="font-sans text-sm text-muted-foreground">Analysing all 31,102 verses…</p>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-destructive/10 border border-destructive/40 p-4 max-w-lg mx-auto">
          <p className="font-sans text-sm text-destructive">{error} Make sure the Bible has downloaded, then try again.</p>
        </div>
      )}

      {records && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* Desktop filter column */}
          <div className="hidden lg:block sticky top-4">
            <AdvancedFilterPanel filters={filters} onChange={setFilters} onReset={handleReset} />
          </div>

          {/* Results column */}
          <div>
            {/* Result count + mobile filter button */}
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="font-sans text-sm text-muted-foreground">
                {isEmpty
                  ? 'Set a filter or search to begin'
                  : <><span className="font-semibold text-foreground">{results.length.toLocaleString()}</span> verse{results.length === 1 ? '' : 's'} match</>}
              </p>
              <button
                onClick={() => setShowFilters(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* Export / copy / print + select toggle */}
            {!isEmpty && results.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <AdvancedResultsToolbar records={results} selectedRecords={selectMode ? selectedRecords : null} />
                <button
                  onClick={() => { setSelectMode(m => !m); setSelectedKeys(new Set()); }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-colors ${
                    selectMode
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary/60 border-border text-foreground hover:border-accent'
                  }`}
                >
                  {selectMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  {selectMode ? 'Done' : 'Select'}
                </button>
              </div>
            )}

            {selectMode && !isEmpty && results.length > 0 && (
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setSelectedKeys(new Set(results.slice(0, visible).map(keyOf)))}
                  className="font-sans text-xs text-primary font-medium hover:underline"
                >
                  Select all shown
                </button>
                <button
                  onClick={() => setSelectedKeys(new Set())}
                  className="font-sans text-xs text-muted-foreground font-medium hover:underline"
                >
                  Clear
                </button>
              </div>
            )}

            {isEmpty ? (
              <div className="rounded-2xl bg-card/70 border border-border/60 p-8 text-center">
                <p className="font-sans text-sm text-muted-foreground">Choose a testament, book, keyword, or metric filter to start exploring verses.</p>
              </div>
            ) : results.length === 0 ? (
              <div className="rounded-2xl bg-card/70 border border-border/60 p-8 text-center">
                <p className="font-sans text-sm text-muted-foreground">No verses match these filters. Try loosening them.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {results.slice(0, visible).map(r => {
                  const k = keyOf(r);
                  if (selectMode) {
                    const checked = selectedKeys.has(k);
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => toggleSelect(r)}
                        className={`w-full flex items-start gap-3 text-left rounded-2xl transition-colors ${
                          checked ? 'ring-2 ring-primary rounded-2xl' : ''
                        }`}
                      >
                        <span className="mt-4 shrink-0">
                          {checked
                            ? <CheckSquare className="w-5 h-5 text-primary" />
                            : <Square className="w-5 h-5 text-muted-foreground" />}
                        </span>
                        <span className="flex-1 pointer-events-none">
                          <AdvancedResultRow record={r} sortKey={filters.sortKey} sortLabel={sortLabel} />
                        </span>
                      </button>
                    );
                  }
                  return (
                    <AdvancedResultRow key={k} record={r} sortKey={filters.sortKey} sortLabel={sortLabel} />
                  );
                })}
                {visible < results.length && (
                  <button
                    onClick={() => { setVisible(v => v + PAGE_SIZE); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="w-full py-3 rounded-xl bg-secondary/50 border border-border text-foreground font-sans text-sm font-medium hover:border-accent transition-colors"
                  >
                    Show more ({(results.length - visible).toLocaleString()} remaining)
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile filter drawer */}
      {showFilters && records && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="relative ml-auto w-[88%] max-w-sm h-full bg-background overflow-y-auto p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg font-semibold text-foreground">Filters</h2>
              <button onClick={() => setShowFilters(false)} className="p-2 rounded-lg hover:bg-secondary">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <AdvancedFilterPanel filters={filters} onChange={setFilters} onReset={handleReset} />
            <button
              onClick={() => { setShowFilters(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-full mt-4 py-3 rounded-xl bg-primary text-primary-foreground font-sans text-sm font-medium"
            >
              {isEmpty ? 'Done' : `Show ${results.length.toLocaleString()} results`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}