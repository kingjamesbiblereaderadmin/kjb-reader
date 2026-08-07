import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Loader2 } from 'lucide-react';
import { parseReference } from '@/lib/parseReference';
import { getBibleData } from '@/lib/bibleCache';
import { BIBLE_BOOKS } from '@/lib/bibleData';

const clean = (t) => (t || '').replace(/^<<[^>]*>>\s*/, '').replace(/\[([^\]]+)\]/g, '$1');

export default function QuickVerseLookup() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const lookup = async (e) => {
    e?.preventDefault();
    const q = input.trim();
    if (!q) return;
    const ref = parseReference(q);
    if (!ref) { setError('Try a reference like "John 3:16"'); setResult(null); return; }
    setError(''); setLoading(true);
    try {
      const bible = await getBibleData();
      const book = BIBLE_BOOKS.find((b) => b.abbr === ref.abbr);
      const verses = bible?.[book?.apiName]?.[ref.chapter] || [];
      const v = ref.verse ? verses.find((x) => x.verse === ref.verse) : verses[0];
      if (!v) { setError('Verse not found'); setResult(null); }
      else setResult({ ...ref, bookName: book.shortName, text: clean(v.text) });
    } catch {
      setError('Could not load Bible data');
      setResult(null);
    }
    setLoading(false);
  };

  return (
    <div>
      <p className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Quick Verse</p>
      <form onSubmit={lookup} className="flex gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="John 3:16"
          className="flex-1 min-w-0 px-2.5 h-8 rounded-lg bg-secondary border border-border text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
        />
        <button type="submit" disabled={loading} className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground disabled:opacity-50">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
        </button>
      </form>
      {error && <p className="font-sans text-xs text-destructive mt-2">{error}</p>}
      {result && (
        <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
          <p className="font-sans text-xs font-semibold text-accent mb-1">{result.bookName} {result.chapter}{result.verse ? `:${result.verse}` : ''}</p>
          <p className="font-serif text-sm text-foreground leading-relaxed">{result.text}</p>
          <button
            onClick={() => navigate(`/read?book=${result.abbr}&chapter=${result.chapter}${result.verse ? `&verse=${result.verse}` : ''}`)}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-sans font-medium text-primary hover:underline"
          >
            <BookOpen className="w-3.5 h-3.5" /> Read in context
          </button>
        </div>
      )}
    </div>
  );
}