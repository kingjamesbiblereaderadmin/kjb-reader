import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function SearchPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (initialQuery.trim().length >= 3) {
      runSearch(initialQuery.trim());
    }
  }, []);

  const runSearch = async (kw) => {
    setLoading(true);
    setSearched(true);
    setResults([]);
    const res = await base44.integrations.Core.InvokeLLM({
      prompt: `Search the King James Bible (Pure Cambridge Edition) for verses containing or closely related to the keyword(s): "${kw}".
Return up to 15 matching verses. For each verse provide the book abbreviation (e.g. GEN, PSA, JHN, ROM), the book's full name, chapter number, verse number, and the full verse text from the KJB.`,
      response_json_schema: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                abbr: { type: 'string' },
                book: { type: 'string' },
                chapter: { type: 'number' },
                verse: { type: 'number' },
                text: { type: 'string' },
              },
            },
          },
        },
      },
    });
    setResults(res.results || []);
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim().length >= 3) {
      window.history.replaceState({}, '', `/search?q=${encodeURIComponent(query.trim())}`);
      runSearch(query.trim());
    }
  };

  const goToVerse = (abbr, chapter, verse) => {
    try { localStorage.setItem('kjb-position', JSON.stringify({ abbr, chapter, verse })); } catch {}
    navigate('/read');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="font-serif text-2xl font-bold text-foreground mb-4">Keyword Search</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. grace, faith, propitiation..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-secondary border border-border text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={query.trim().length < 3 || loading}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </form>

      {loading && (
        <div className="flex justify-center py-16">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent mx-auto mb-3" />
            <p className="font-sans text-sm text-muted-foreground">Searching the KJB…</p>
          </div>
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <p className="font-sans text-sm text-muted-foreground text-center py-12">No results found for "{query}".</p>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="font-sans text-xs text-muted-foreground mb-4">{results.length} result{results.length !== 1 ? 's' : ''} for "{initialQuery || query}"</p>
          {results.map((r, i) => (
            <button
              key={i}
              onClick={() => goToVerse(r.abbr, r.chapter, r.verse)}
              className="w-full text-left p-4 rounded-xl bg-card border border-border hover:border-accent/40 hover:bg-accent/5 transition-colors"
            >
              <p className="font-sans text-xs text-accent font-semibold mb-1 flex items-center gap-1">
                <BookOpen className="w-3 h-3" />
                {r.book} {r.chapter}:{r.verse}
              </p>
              <p className="font-serif text-base text-foreground leading-relaxed">"{r.text}"</p>
            </button>
          ))}
        </div>
      )}

      {!searched && !loading && (
        <p className="font-sans text-sm text-muted-foreground text-center py-12">
          Type a word or phrase above and press Search.
        </p>
      )}
    </div>
  );
}