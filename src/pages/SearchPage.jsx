import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, BookOpen, Loader2, Filter } from 'lucide-react';
import { getBibleData } from '@/lib/bibleCache';
import { BIBLE_BOOKS } from '@/lib/bibleData';

const OT_BOOKS = new Set(BIBLE_BOOKS.filter(b => b.testament === 'OT' || BIBLE_BOOKS.indexOf(b) < 39).map(b => b.apiName));
const NT_BOOKS = new Set(BIBLE_BOOKS.filter(b => b.testament === 'NT' || BIBLE_BOOKS.indexOf(b) >= 39).map(b => b.apiName));

function highlightText(text, keyword) {
  if (!keyword) return text;
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-accent/40 text-foreground rounded px-0.5">{part}</mark>
      : part
  );
}

export default function SearchPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = urlParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [testament, setTestament] = useState('all'); // 'all' | 'ot' | 'nt'
  const [wholeWord, setWholeWord] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (initialQuery.trim().length >= 2) {
      runSearch(initialQuery.trim());
    }
  }, []);

  const runSearch = async (kw) => {
    setLoading(true);
    setSearched(true);
    setResults([]);

    try {
      const bible = await getBibleData();
      const keyword = kw.toLowerCase();
      const matches = [];

      for (const bookName in bible) {
        if (bookName === '__colophons') continue;

        // Testament filter
        if (testament === 'ot' && !OT_BOOKS.has(bookName)) continue;
        if (testament === 'nt' && !NT_BOOKS.has(bookName)) continue;

        const chapters = bible[bookName];
        for (const chapterNum in chapters) {
          const verses = chapters[chapterNum];
          for (const verseObj of verses) {
            const verseTextLower = verseObj.text.toLowerCase();
            let found = false;
            if (wholeWord) {
              // Match whole word boundary
              const escapedKw = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              found = new RegExp(`\\b${escapedKw}\\b`).test(verseTextLower);
            } else {
              found = verseTextLower.includes(keyword);
            }

            if (found) {
              const bookEntry = BIBLE_BOOKS.find(b => b.apiName === bookName);
              matches.push({
                book: bookName,
                chapter: parseInt(chapterNum),
                verse: verseObj.verse,
                text: verseObj.text.replace(/\[([^\]]+)\]/g, '$1').replace(/¶\s*/g, '').replace(/^<<[^>]*>>\s*/, ''),
                abbr: bookEntry ? bookEntry.abbr : bookName.slice(0, 3).toUpperCase(),
              });
              if (matches.length >= 200) break;
            }
          }
          if (matches.length >= 200) break;
        }
        if (matches.length >= 200) break;
      }

      setResults(matches);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim().length >= 2) {
      window.history.replaceState({}, '', `/search?q=${encodeURIComponent(query.trim())}`);
      runSearch(query.trim());
    }
  };

  const goToVerse = (abbr, chapter, verse) => {
    try { localStorage.setItem('kjb-position', JSON.stringify({ abbr, chapter, verse })); } catch {}
    window.scrollTo({ top: 0 });
    navigate('/read');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="font-serif text-2xl font-bold text-foreground mb-4">Keyword Search</h1>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="e.g. grace, faith, blood..."
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-secondary border border-border text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={query.trim().length < 2 || loading}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <Filter className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="font-sans text-xs text-muted-foreground">Testament:</span>
        {[['all', 'All'], ['ot', 'Old Testament'], ['nt', 'New Testament']].map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => setTestament(val)}
            className={`px-2.5 py-1 rounded-lg font-sans text-xs font-medium transition-colors ${
              testament === val ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="ml-2 flex items-center gap-1.5">
          <input
            id="whole-word"
            type="checkbox"
            checked={wholeWord}
            onChange={e => setWholeWord(e.target.checked)}
            className="w-3.5 h-3.5 accent-[hsl(var(--accent))] cursor-pointer"
          />
          <label htmlFor="whole-word" className="font-sans text-xs text-muted-foreground cursor-pointer select-none">Whole word only</label>
        </div>
      </div>

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
          <p className="font-sans text-xs text-muted-foreground mb-4">{results.length}{results.length >= 200 ? '+' : ''} result{results.length !== 1 ? 's' : ''} for "{initialQuery || query}"</p>
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
              <p className="font-serif text-base text-foreground leading-relaxed">
                "{highlightText(r.text, query)}"
              </p>
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