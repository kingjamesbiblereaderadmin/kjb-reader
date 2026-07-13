import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Search } from 'lucide-react';

// Finds eligible daily-verse candidates filtered by character count and word
// count of the verse text only. Clicking a result loads it into the tester
// card via the onSelect callback.
export default function VerseLengthFinder({ onSelect }) {
  const [minChars, setMinChars] = useState('');
  const [maxChars, setMaxChars] = useState('');
  const [minWords, setMinWords] = useState('');
  const [maxWords, setMaxWords] = useState('');
  const [sortBy, setSortBy] = useState('chars');
  const [order, setOrder] = useState('asc');
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const num = (v) => (v === '' ? undefined : Number(v));

  const search = async () => {
    setLoading(true);
    const res = await base44.functions.invoke('bibleApi', {
      action: 'find_by_length',
      minChars: num(minChars),
      maxChars: num(maxChars),
      minWords: num(minWords),
      maxWords: num(maxWords),
      sortBy,
      order,
      limit: 200,
    });
    setResults(res?.data?.results || []);
    setTotal(res?.data?.total || 0);
    setLoading(false);
  };

  return (
    <div className="rounded-xl bg-card border border-border p-4 space-y-4">
      <h3 className="font-sans text-sm font-semibold text-foreground">Find verses by length</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="block font-sans text-xs text-muted-foreground mb-1">Min chars</label>
          <input type="number" min={0} value={minChars} onChange={(e) => setMinChars(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
        </div>
        <div>
          <label className="block font-sans text-xs text-muted-foreground mb-1">Max chars</label>
          <input type="number" min={0} value={maxChars} onChange={(e) => setMaxChars(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
        </div>
        <div>
          <label className="block font-sans text-xs text-muted-foreground mb-1">Min words</label>
          <input type="number" min={0} value={minWords} onChange={(e) => setMinWords(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
        </div>
        <div>
          <label className="block font-sans text-xs text-muted-foreground mb-1">Max words</label>
          <input type="number" min={0} value={maxWords} onChange={(e) => setMaxWords(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block font-sans text-xs text-muted-foreground mb-1">Sort by</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">
            <option value="chars">Characters</option>
            <option value="words">Words</option>
          </select>
        </div>
        <div>
          <label className="block font-sans text-xs text-muted-foreground mb-1">Order</label>
          <select value={order} onChange={(e) => setOrder(e.target.value)}
            className="px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground">
            <option value="asc">Shortest first</option>
            <option value="desc">Longest first</option>
          </select>
        </div>
        <button onClick={search} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </div>

      {results.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">{total} match{total === 1 ? '' : 'es'} — showing {results.length}</p>
          <div className="rounded-lg border border-border overflow-hidden max-h-80 overflow-y-auto">
            {results.map((r) => (
              <button key={r.ref} onClick={() => onSelect(r)}
                className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left border-b border-border last:border-0 hover:bg-accent/10 transition-colors">
                <span className="font-sans text-xs text-accent font-semibold truncate">{r.ref}</span>
                <span className="font-sans text-[11px] text-muted-foreground shrink-0">{r.words}w · {r.chars}c</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}