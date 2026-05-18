import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { useNavigate } from 'react-router-dom';

// Parse input like "John 3:16", "Romans 8", "Genesis", or plain keyword
function parseReference(input) {
  const trimmed = input.trim();

  // Try to match "Book Chapter:Verse" or "Book Chapter"
  // Handles books that start with a number like "1 John"
  const refMatch = trimmed.match(/^(\d?\s?[a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(\d+)(?::(\d+))?$/);
  if (refMatch) {
    const bookStr = refMatch[1].trim();
    const chapter = parseInt(refMatch[2]);
    const verse = refMatch[3] ? parseInt(refMatch[3]) : null;

    const book = BIBLE_BOOKS.find(b =>
      b.shortName.toLowerCase().startsWith(bookStr.toLowerCase()) ||
      b.abbr.toLowerCase() === bookStr.toLowerCase()
    );
    if (book && chapter >= 1 && chapter <= book.chapters) {
      return { type: 'reference', book, chapter, verse };
    }
  }

  // Try to match just a book name
  const book = BIBLE_BOOKS.find(b =>
    b.shortName.toLowerCase() === trimmed.toLowerCase() ||
    b.abbr.toLowerCase() === trimmed.toLowerCase()
  );
  if (book) return { type: 'reference', book, chapter: 1, verse: null };

  // Otherwise keyword
  if (trimmed.length >= 3) return { type: 'keyword', query: trimmed };
  return null;
}

export default function BibleSearchBar({ onClose }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!query.trim()) { setSuggestions([]); return; }
    const q = query.toLowerCase();

    // Book suggestions
    const bookMatches = BIBLE_BOOKS.filter(b =>
      b.shortName.toLowerCase().includes(q) || b.abbr.toLowerCase().startsWith(q)
    ).slice(0, 5).map(b => ({ type: 'book', book: b, label: b.shortName, sub: `${b.chapters} chapters` }));

    // Reference hint if they typed book + number
    const refMatch = query.match(/^(\d?\s?[a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(\d+)(?::(\d+))?$/);
    const refSuggestions = [];
    if (refMatch) {
      const bookStr = refMatch[1].trim();
      const ch = parseInt(refMatch[2]);
      const v = refMatch[3] ? parseInt(refMatch[3]) : null;
      const book = BIBLE_BOOKS.find(b => b.shortName.toLowerCase().startsWith(bookStr.toLowerCase()));
      if (book && ch >= 1 && ch <= book.chapters) {
        refSuggestions.push({
          type: 'ref',
          book,
          chapter: ch,
          verse: v,
          label: `${book.shortName} ${ch}${v ? `:${v}` : ''}`,
          sub: 'Go to passage',
        });
      }
    }

    // Keyword hint
    const kwSuggestions = query.trim().length >= 3 && bookMatches.length === 0 && refSuggestions.length === 0
      ? [{ type: 'keyword', query: query.trim(), label: `Search: "${query.trim()}"`, sub: 'Keyword search across the Bible' }]
      : [];

    setSuggestions([...refSuggestions, ...bookMatches, ...kwSuggestions]);
  }, [query]);

  const goTo = (abbr, chapter, verse) => {
    try { localStorage.setItem('kjb-position', JSON.stringify({ abbr, chapter, verse: verse || null })); } catch {}
    setQuery('');
    setSuggestions([]);
    setOpen(false);
    onClose?.();
    navigate('/read');
  };

  const goKeyword = (kw) => {
    setQuery('');
    setSuggestions([]);
    setOpen(false);
    onClose?.();
    navigate(`/search?q=${encodeURIComponent(kw)}`);
  };

  const handleSelect = (s) => {
    if (s.type === 'book') goTo(s.book.abbr, 1, null);
    else if (s.type === 'ref') goTo(s.book.abbr, s.chapter, s.verse);
    else if (s.type === 'keyword') goKeyword(s.query || query.trim());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const parsed = parseReference(query);
    if (parsed?.type === 'reference') {
      goTo(parsed.book.abbr, parsed.chapter, parsed.verse);
    } else if (query.trim().length >= 3) {
      goKeyword(query.trim());
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="1 Corinthians 15:1-4; Romans 3:25"
          className="w-full pl-8 pr-7 py-2.5 rounded-lg bg-secondary border border-border text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors touch-manipulation min-h-[44px]"
        />
        {query && (
          <>
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); setOpen(false); inputRef.current?.focus(); }}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-2 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Clear search"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); setOpen(false); inputRef.current?.focus(); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-2 min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </form>

      {open && suggestions.length > 0 && (
        <div className="absolute top-full mt-1 left-0 right-0 z-50 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleSelect(s)}
              className="w-full flex items-center gap-3 px-3 py-3 min-h-[48px] hover:bg-secondary transition-colors text-left border-b border-border last:border-0 touch-manipulation"
            >
              <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm font-medium text-foreground truncate">{s.label}</p>
                <p className="font-sans text-xs text-muted-foreground">{s.sub}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}