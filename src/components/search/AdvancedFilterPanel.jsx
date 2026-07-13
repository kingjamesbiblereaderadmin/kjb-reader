import React, { useState } from 'react';
import { RotateCcw, ArrowUpDown, ChevronDown } from 'lucide-react';
import { NUMERIC_METRICS, BOOLEAN_METRICS } from '@/lib/verseAnalysis';
import { BIBLE_BOOKS } from '@/lib/bibleData';

// A collapsible section wrapper so users can hide/show ("deselect") each group
// of filters to keep the panel tidy.
function Section({ title, icon: Icon, open, onToggle, children }) {
  return (
    <div className="rounded-2xl bg-card/70 border border-border/60 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-accent/5 transition-colors text-left"
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-muted-foreground" />}
          <span className="font-sans text-sm font-semibold text-foreground">{title}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

// The full filter + sort control panel for Advanced Search. Controlled — the
// parent owns the `filters` object and passes `onChange(next)`.
export default function AdvancedFilterPanel({ filters, onChange, onReset }) {
  const [openSections, setOpenSections] = useState({
    scope: true,
    sort: true,
    numeric: true,
    property: true,
  });
  const toggleSection = (k) => setOpenSections(prev => ({ ...prev, [k]: !prev[k] }));

  const set = (patch) => onChange({ ...filters, ...patch });
  const setRange = (key, side, value) =>
    onChange({ ...filters, ranges: { ...filters.ranges, [key]: { ...filters.ranges[key], [side]: value } } });
  const setBool = (key, value) =>
    onChange({ ...filters, bools: { ...filters.bools, [key]: value } });

  const books = filters.testament === 'all'
    ? BIBLE_BOOKS
    : BIBLE_BOOKS.filter(b => b.testament === filters.testament);

  const noSort = filters.sortKey === 'none';
  const isCanonical = filters.sortKey === 'canonical';

  return (
    <div className="space-y-4">
      {/* Scope + text */}
      <Section title="Scope & text" open={openSections.scope} onToggle={() => toggleSection('scope')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Testament</label>
            <select
              value={filters.testament}
              onChange={(e) => set({ testament: e.target.value, book: 'all' })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
            >
              <option value="all">All (Old + New)</option>
              <option value="old">Old Testament</option>
              <option value="new">New Testament</option>
            </select>
          </div>
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Book</label>
            <select
              value={filters.book}
              onChange={(e) => set({ book: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
            >
              <option value="all">All books</option>
              {books.map(b => <option key={b.abbr} value={b.apiName}>{b.shortName}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block font-sans text-xs text-muted-foreground mb-1">Text contains (optional)</label>
          <input
            type="text"
            value={filters.textContains}
            onChange={(e) => set({ textContains: e.target.value })}
            placeholder="e.g. love LORD begat…"
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
          />
          <p className="font-sans text-[11px] text-muted-foreground mt-1">Multiple words match verses containing all of them (any order).</p>
        </div>
      </Section>

      {/* Sort */}
      <Section title="Sort by" icon={ArrowUpDown} open={openSections.sort} onToggle={() => toggleSection('sort')}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={filters.sortKey}
            onChange={(e) => set({ sortKey: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
          >
            <option value="none">None (no sorting)</option>
            <option value="canonical">Book order (canonical)</option>
            {NUMERIC_METRICS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select>
          <select
            value={filters.sortDir}
            onChange={(e) => set({ sortDir: e.target.value })}
            disabled={noSort}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground disabled:opacity-40"
          >
            {isCanonical ? (
              <>
                <option value="asc">Genesis → Revelation</option>
                <option value="desc">Revelation → Genesis</option>
              </>
            ) : (
              <>
                <option value="desc">Highest first (e.g. longest)</option>
                <option value="asc">Lowest first (e.g. shortest)</option>
              </>
            )}
          </select>
        </div>
        {noSort && (
          <p className="font-sans text-xs text-muted-foreground -mt-1">Results stay in Bible order, unsorted.</p>
        )}
      </Section>

      {/* Numeric ranges */}
      <Section title="Numeric filters" open={openSections.numeric} onToggle={() => toggleSection('numeric')}>
        <p className="font-sans text-xs text-muted-foreground -mt-1">Leave blank for no limit.</p>
        <div className="space-y-2">
          {NUMERIC_METRICS.map(m => (
            <div key={m.key} className="grid grid-cols-[1fr_auto_auto] items-center gap-2">
              <span className="font-sans text-xs text-foreground truncate">{m.label}</span>
              <input
                type="number"
                inputMode="numeric"
                value={filters.ranges[m.key].min}
                onChange={(e) => setRange(m.key, 'min', e.target.value)}
                placeholder="min"
                className="w-20 px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground"
              />
              <input
                type="number"
                inputMode="numeric"
                value={filters.ranges[m.key].max}
                onChange={(e) => setRange(m.key, 'max', e.target.value)}
                placeholder="max"
                className="w-20 px-2 py-1.5 rounded-lg bg-secondary border border-border text-xs text-foreground"
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Boolean toggles */}
      <Section title="Property filters" open={openSections.property} onToggle={() => toggleSection('property')}>
        <div className="space-y-2.5">
          {BOOLEAN_METRICS.map(m => (
            <div key={m.key} className="flex items-center justify-between gap-3">
              <span className="font-sans text-xs text-foreground flex-1">{m.label}</span>
              <div className="flex rounded-lg overflow-hidden border border-border shrink-0">
                {['any', 'yes', 'no'].map(opt => (
                  <button
                    key={opt}
                    onClick={() => setBool(m.key, opt)}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                      filters.bools[m.key] === opt
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {opt === 'any' ? 'Any' : opt === 'yes' ? 'Yes' : 'No'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <button
        onClick={onReset}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary/50 border border-border text-foreground font-sans text-sm font-medium hover:border-accent transition-colors"
      >
        <RotateCcw className="w-4 h-4" />
        Reset all filters
      </button>
    </div>
  );
}