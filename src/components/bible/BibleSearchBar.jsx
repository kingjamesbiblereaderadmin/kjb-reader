import React, { useState, useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { useNavigate } from 'react-router-dom';

// Parse input like "John 3:16", "Romans 8", "Romans 1:20-22", "Genesis", or plain keyword
function parseReference(input) {
  const trimmed = input.trim();

  // Try to match "Book Chapter:Verse-Verse" range e.g. Romans 1:20-22
  const rangeMatch = trimmed.match(/^(\d?\s?[a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(\d+):(\d+)-(\d+)$/);
  if (rangeMatch) {
    const bookStr = rangeMatch[1].trim();
    const chapter = parseInt(rangeMatch[2]);
    const verseStart = parseInt(rangeMatch[3]);
    const verseEnd = parseInt(rangeMatch[4]);
    const book = BIBLE_BOOKS.find(b =>
      b.shortName.toLowerCase().startsWith(bookStr.toLowerCase()) ||
      b.abbr.toLowerCase() === bookStr.toLowerCase()
    );
    if (book && chapter >= 1 && chapter <= book.chapters && verseStart <= verseEnd) {
      return { type: 'reference', book, chapter, verse: verseStart, verseEnd };
    }
  }

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

    // Reference hint if they typed book + number (including ranges)
    const refSuggestions = [];
    // Range: Book Ch:V1-V2
    const rangeMatch = query.match(/^(\d?\s?[a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(\d+):(\d+)-(\d+)$/);
    if (rangeMatch) {
      const bookStr = rangeMatch[1].trim();
      const ch = parseInt(rangeMatch[2]);
      const v1 = parseInt(rangeMatch[3]);
      const v2 = parseInt(rangeMatch[4]);
      const book = BIBLE_BOOKS.find(b => b.shortName.toLowerCase().startsWith(bookStr.toLowerCase()));
      if (book && ch >= 1 && ch <= book.chapters && v1 <= v2) {
        refSuggestions.push({
          type: 'ref',
          book,
          chapter: ch,
          verse: v1,
          verseEnd: v2,
          label: `${book.shortName} ${ch}:${v1}–${v2}`,
          sub: `Go to passage (${v2 - v1 + 1} verses)`,
        });
      }
    }
    // Single ref or chapter
    const refMatch = query.match(/^(\d?\s?[a-zA-Z]+(?:\s+[a-zA-Z]+)?)\s+(\d+)(?::(\d+))?$/);
    if (!rangeMatch && refMatch) {
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

    // If a single book match, show two options: go to book OR search for the term
    let finalSuggestions = [...refSuggestions, ...bookMatches];
    if (bookMatches.length === 1 && refSuggestions.length === 0) {
      const bookMatch = bookMatches[0];
      finalSuggestions = [
        { type: 'book', book: bookMatch.book, label: `Go to ${bookMatch.label}`, sub: `${bookMatch.book.chapters} chapters` },
        { type: 'keyword', query: query.trim(), label: `Search "${query.trim()}"`, sub: 'Find all mentions in verses' }
      ];
    }

    // Keyword hint (only if no book match)
    const kwSuggestions = query.trim().length >= 3 && bookMatches.length === 0 && refSuggestions.length === 0
      ? [{ type: 'keyword', query: query.trim(), label: `Search: "${query.trim()}"`, sub: 'Keyword search across the Bible' }]
      : [];

    setSuggestions([...finalSuggestions, ...kwSuggestions]);
  }, [query]);

  const goTo = (abbr, chapter, verse, verseEnd) => {
    // Keep verseEnd in localStorage so the reader can enter range/filter mode.
    try { localStorage.setItem('kjb-position', JSON.stringify({ abbr, chapter, verse: verse || null, verseEnd: verseEnd || null })); } catch {}
    // Clear search term and last reading position so CurrentlyReadingIndicator doesn't show stale context
    try { localStorage.removeItem('kjb-search-term'); } catch {}
    try { localStorage.removeItem('kjb-last-reading'); } catch {}
    setQuery('');
    setSuggestions([]);
    setOpen(false);
    onClose?.();
    const url = verse ? `/read?book=${abbr}&chapter=${chapter}&verse=${verse}` : `/read?book=${abbr}&chapter=${chapter}`;
    navigate(url);
    // If already on /read with the same URL, notify the mounted reader to load it.
    setTimeout(() => { try { window.dispatchEvent(new Event('kjb-navigate')); } catch {} }, 0);
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
    else if (s.type === 'ref') goTo(s.book.abbr, s.chapter, s.verse, s.verseEnd);
    else if (s.type === 'keyword') goKeyword(s.query || query.trim());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    const parsed = parseReference(query);
    if (parsed?.type === 'reference') {
      goTo(parsed.book.abbr, parsed.chapter, parsed.verse, parsed.verseEnd);
    } else if (query.trim().length >= 3) {
      goKeyword(query.trim());
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            placeholder="Search..."
            className="w-full pl-9 pr-8 py-1.5 h-9 rounded-lg bg-secondary border border-border text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors truncate"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSuggestions([]); setOpen(false); inputRef.current?.focus(); }}
              onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); setQuery(''); setSuggestions([]); setOpen(false); inputRef.current?.focus(); }}
              className="absolute right-0 top-0 bottom-0 w-10 flex items-center justify-center text-muted-foreground hover:text-foreground active:opacity-60"
              style={{ touchAction: 'manipulation' }}
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
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