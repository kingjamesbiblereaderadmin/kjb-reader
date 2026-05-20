import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, BookOpen, Loader2, Filter, Copy, Download, CheckSquare, Square, X, BookMarked, ChevronDown } from 'lucide-react';
import { getBibleData } from '@/lib/bibleCache';
import { BIBLE_BOOKS, OLD_TESTAMENT, NEW_TESTAMENT } from '@/lib/bibleData';
import { expandSearchTerms } from '@/lib/searchSynonyms';

const OT_BOOKS = new Set(BIBLE_BOOKS.filter(b => b.testament === 'OT' || BIBLE_BOOKS.indexOf(b) < 39).map(b => b.apiName));
const NT_BOOKS = new Set(BIBLE_BOOKS.filter(b => b.testament === 'NT' || BIBLE_BOOKS.indexOf(b) >= 39).map(b => b.apiName));

function highlightText(text, terms) {
  if (!terms || terms.length === 0) return text;
  const escaped = terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part)
      ? <mark key={i} className="bg-accent/40 text-foreground rounded px-0.5">{part}</mark>
      : part
  );
}

export default function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const getQueryFromUrl = () => new URLSearchParams(window.location.search).get('q') || '';

  const [query, setQuery] = useState(getQueryFromUrl);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [expandedTerms, setExpandedTerms] = useState([]);
  const [testament, setTestament] = useState('all');
  const [wholeWord, setWholeWord] = useState(false);
  const [numberedBookFilter, setNumberedBookFilter] = useState(null);
  const [showBookFilter, setShowBookFilter] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState(new Set());

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [copyFeedback, setCopyFeedback] = useState(false);

  const runSearch = useCallback(async (kw) => {
    if (!kw || kw.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    setResults([]);
    setSelected(new Set());
    setSelectMode(false);
    setNumberedBookFilter(null);
    setSelectedBooks(new Set());

    try {
      const bible = await getBibleData();
      const terms = expandSearchTerms(kw);
      setExpandedTerms(terms.length > 1 ? terms : []);
      
      const kwLower = kw.trim().toLowerCase();
      
      // Check if query is a verse range (e.g., "Romans 1:20-22")
      const rangeMatch = kwLower.match(/^([a-z0-9\s]+)\s+(\d+):(\d+)-(\d+)$/);
      if (rangeMatch) {
        const bookStr = rangeMatch[1].trim();
        const ch = parseInt(rangeMatch[2]);
        const v1 = parseInt(rangeMatch[3]);
        const v2 = parseInt(rangeMatch[4]);
        const matchingBook = BIBLE_BOOKS.find(b => 
          b.shortName.toLowerCase().includes(bookStr) ||
          b.abbr.toLowerCase() === bookStr
        );
        if (matchingBook && ch >= 1 && ch <= matchingBook.chapters && v1 <= v2) {
          // Navigate directly to the range
          goToVerse(matchingBook.abbr, ch, v1, v2);
          setLoading(false);
          return;
        }
      }

      // Check if query is a numbered book (e.g., "1 john", "2 timothy") or contains one
      const numberedBookMatch = kwLower.match(/(\d+)\s+([a-z]+)/);
      let targetBookAbbr = null;
      if (numberedBookMatch) {
        const num = numberedBookMatch[1];
        const bookPart = numberedBookMatch[2];
        const matchingBook = BIBLE_BOOKS.find(b => 
          b.shortName.toLowerCase() === `${num} ${bookPart}` ||
          b.shortName.toLowerCase().startsWith(`${num} ${bookPart}`) ||
          b.shortName.toLowerCase().includes(`${num} ${bookPart}`)
        );
        if (matchingBook) {
          targetBookAbbr = matchingBook.abbr;
          setNumberedBookFilter(targetBookAbbr);
        }
      }

      const matches = [];
      const seen = new Set();

      for (const bookName in bible) {
        if (bookName === '__colophons') continue;
        if (testament === 'ot' && !OT_BOOKS.has(bookName)) continue;
        if (testament === 'nt' && !NT_BOOKS.has(bookName)) continue;
        
        // If specific books selected, only search those
        if (selectedBooks.size > 0) {
          const bookEntry = BIBLE_BOOKS.find(b => b.apiName === bookName);
          if (!bookEntry || !selectedBooks.has(bookEntry.abbr)) continue;
        }
        
        // If searching for a numbered book, only show results from that specific book
        if (targetBookAbbr) {
          const bookEntry = BIBLE_BOOKS.find(b => b.apiName === bookName);
          if (!bookEntry || bookEntry.abbr !== targetBookAbbr) continue;
        }

        const chapters = bible[bookName];
        for (const chapterNum in chapters) {
          const verses = chapters[chapterNum];
          for (const verseObj of verses) {
            const verseTextLower = verseObj.text.toLowerCase();
            let found = false;
            for (const term of terms) {
              if (wholeWord) {
                const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                if (new RegExp(`\\b${escapedTerm}\\b`).test(verseTextLower)) { found = true; break; }
              } else {
                if (verseTextLower.includes(term)) { found = true; break; }
              }
            }

            if (found) {
            const key = `${bookName}-${chapterNum}-${verseObj.verse}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const bookEntry = BIBLE_BOOKS.find(b => b.apiName === bookName);
            matches.push({
              book: bookName,
              chapter: parseInt(chapterNum),
              verse: verseObj.verse,
              text: verseObj.text.replace(/\[([^\]]+)\]/g, '$1').replace(/¶\s*/g, '').replace(/^<<[^>]*>>\s*/, ''),
              abbr: bookEntry ? bookEntry.abbr : bookName.slice(0, 3).toUpperCase(),
            });
            }
            }
            }
      }

      setResults(matches);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    }
    setLoading(false);
  }, [testament, wholeWord]);

  // Re-run search whenever URL changes (fixes header search bar)
  useEffect(() => {
    const q = getQueryFromUrl();
    if (q) {
      setQuery(q);
      runSearch(q);
    }
  }, [location.search]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const kw = query.trim();
    if (kw.length >= 2) {
      window.history.replaceState({}, '', `/search?q=${encodeURIComponent(kw)}`);
      runSearch(kw);
    }
  };

  const goToVerse = (abbr, chapter, verse, verseEnd) => {
    try { localStorage.setItem('kjb-position', JSON.stringify({ abbr, chapter, verse: verse || null, verseEnd: verseEnd || null })); } catch {}
    window.scrollTo({ top: 0 });
    navigate('/read');
  };

  // Selection helpers
  const toggleSelect = (i) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(results.map((_, i) => i)));
  const clearSelection = () => { setSelected(new Set()); setSelectMode(false); };

  const formatVerses = (indices) => {
    const sorted = [...indices].sort((a, b) => a - b);
    const verses = sorted.map(i => {
      const r = results[i];
      const clean = r.text.replace(/\[([^\]]+)\]/g, '$1').replace(/¶\s*/g, '').replace(/^<<[^>]*>>\s*/, '');
      return clean;
    });
    const first = results[sorted[0]];
    const last = results[sorted[sorted.length - 1]];
    const firstBookEntry = BIBLE_BOOKS.find(b => b.apiName === first.book);
    const firstBookName = firstBookEntry ? firstBookEntry.shortName : first.book;
    const verseRange = sorted.length > 1
      ? `${firstBookName} ${first.chapter}:${first.verse}-${last.verse}`
      : `${firstBookName} ${first.chapter}:${first.verse}`;
    return `"${verses.join(' ')}" — ${verseRange} (KJB)`;
  };

  const handleCopySelected = async () => {
    const text = selected.size > 0 ? formatVerses(selected) : formatVerses(results.map((_, i) => i));
    await navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1800);
  };

  const handleExport = () => {
    const indices = selected.size > 0 ? selected : new Set(results.map((_, i) => i));
    const q = getQueryFromUrl() || query;
    const header = `KJB Search Results — "${q}"\n${'='.repeat(50)}\n\n`;
    const body = formatVerses(indices);
    const footer = `\n\n${'='.repeat(50)}\n${indices.size} verse${indices.size !== 1 ? 's' : ''} — King James Bible (PCE)`;
    const blob = new Blob([header + body + footer], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kjb-search-${q.replace(/\s+/g, '-').slice(0, 30)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedList = [...selected].sort((a, b) => a - b);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="font-serif text-2xl font-bold text-foreground mb-4">Search Bible</h1>

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
        <button
          type="button"
          onClick={() => setShowBookFilter(!showBookFilter)}
          className={`px-2.5 py-1 rounded-lg font-sans text-xs font-medium transition-colors flex items-center gap-1 ${
            showBookFilter ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
          }`}
        >
          <BookOpen className="w-3 h-3" />
          Books {selectedBooks.size > 0 && `(${selectedBooks.size})`}
          <ChevronDown className={`w-3 h-3 transition-transform ${showBookFilter ? 'rotate-180' : ''}`} />
        </button>
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

      {/* Book filter panel */}
      {showBookFilter && (
        <div className="mb-5 p-4 rounded-xl bg-secondary/50 border border-border">
          <div className="flex items-center justify-between mb-3">
            <p className="font-sans text-sm font-semibold text-foreground">Select Books</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (testament === 'ot') setSelectedBooks(new Set(OLD_TESTAMENT.map(b => b.abbr)));
                  else if (testament === 'nt') setSelectedBooks(new Set(NEW_TESTAMENT.map(b => b.abbr)));
                  else setSelectedBooks(new Set(BIBLE_BOOKS.map(b => b.abbr)));
                }}
                className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedBooks(new Set())}
                className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-64 overflow-y-auto">
            {(testament === 'ot' ? OLD_TESTAMENT : testament === 'nt' ? NEW_TESTAMENT : BIBLE_BOOKS).map(book => (
              <button
                key={book.abbr}
                onClick={() => {
                  setSelectedBooks(prev => {
                    const next = new Set(prev);
                    next.has(book.abbr) ? next.delete(book.abbr) : next.add(book.abbr);
                    return next;
                  });
                }}
                className={`px-2 py-1.5 rounded-lg font-sans text-xs font-medium transition-colors text-left truncate ${
                  selectedBooks.has(book.abbr)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card text-foreground hover:bg-accent/20'
                }`}
                title={book.shortName}
              >
                {book.shortName.length > 12 ? book.abbr : book.shortName}
              </button>
            ))}
          </div>
        </div>
      )}

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
        <div>
          {/* Results header + action bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <p className="font-sans text-xs text-muted-foreground">
                {results.length} result{results.length !== 1 ? 's' : ''} for "{getQueryFromUrl() || query}"
              </p>
              {expandedTerms.length > 1 && (
                <p className="font-sans text-xs text-accent mt-0.5">
                  Also searching: {expandedTerms.filter(t => t !== query.toLowerCase()).join(', ')}
                </p>
              )}
              {numberedBookFilter && (
                <p className="font-sans text-xs text-primary font-semibold mt-0.5 flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  Showing only {BIBLE_BOOKS.find(b => b.abbr === numberedBookFilter)?.shortName}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {!selectMode ? (
                <>
                  <button
                    onClick={() => setSelectMode(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
                  >
                    <CheckSquare className="w-3.5 h-3.5" /> Select
                  </button>
                  <button
                    onClick={handleCopySelected}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> {copyFeedback ? 'Copied!' : 'Copy All'}
                  </button>
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Export
                  </button>
                </>
              ) : (
                <>
                  <button onClick={selectAll} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors">
                    <CheckSquare className="w-3.5 h-3.5" /> All
                  </button>
                  <button onClick={clearSelection} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors">
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  {selected.size > 0 && (
                    <>
                      <button
                        onClick={handleCopySelected}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 transition-opacity"
                      >
                        <Copy className="w-3.5 h-3.5" /> {copyFeedback ? 'Copied!' : `Copy (${selected.size})`}
                      </button>
                      <button
                        onClick={handleExport}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" /> Export ({selected.size})
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Selected verses reading panel */}
          {selectMode && selected.size > 0 && (
            <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between mb-2">
                <p className="font-sans text-xs font-semibold text-primary flex items-center gap-1.5">
                  <BookMarked className="w-3.5 h-3.5" />
                  {selected.size} verse{selected.size !== 1 ? 's' : ''} selected
                </p>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedList.map(i => (
                  <div key={i} className="text-sm">
                    <span className="font-sans text-xs text-accent font-semibold mr-2">
                      {BIBLE_BOOKS.find(b => b.apiName === results[i].book)?.shortName || results[i].book} {results[i].chapter}:{results[i].verse}
                    </span>
                    <span className="font-serif text-foreground leading-relaxed">{results[i].text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Verse list */}
          <div className="space-y-2">
            {results.map((r, i) => {
              const isSelected = selected.has(i);
              return (
                <div
                  key={i}
                  onClick={() => selectMode ? toggleSelect(i) : goToVerse(r.abbr, r.chapter, r.verse)}
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
                      {BIBLE_BOOKS.find(b => b.apiName === r.book)?.shortName || r.book} {r.chapter}:{r.verse}
                    </p>
                    <p className="font-serif text-base text-foreground leading-relaxed">
                      "{highlightText(r.text, expandedTerms.length > 1 ? expandedTerms : [query])}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
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