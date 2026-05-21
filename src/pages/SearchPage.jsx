import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, BookOpen, Loader2, Filter, Copy, Download, CheckSquare, Square, X, BookMarked, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { getBibleData } from '@/lib/bibleCache';
import { BIBLE_BOOKS, OLD_TESTAMENT, NEW_TESTAMENT } from '@/lib/bibleData';

const OT_BOOKS = new Set(BIBLE_BOOKS.filter(b => b.testament === 'OT' || BIBLE_BOOKS.indexOf(b) < 39).map(b => b.apiName));
const NT_BOOKS = new Set(BIBLE_BOOKS.filter(b => b.testament === 'NT' || BIBLE_BOOKS.indexOf(b) >= 39).map(b => b.apiName));

function highlightText(text, searchTerm, caseSensitive) {
  if (!searchTerm) return text;
  // Strip quotes from search term for highlighting
  let term = searchTerm.trim();
  if (term.startsWith('"') && term.endsWith('"') && term.length >= 3) {
    term = term.slice(1, -1);
  }
  if (!term) return text;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(`(${escaped})`, flags);
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;
        // Check if this part matches the search term (case sensitive or not)
        const matches = caseSensitive ? part === term : part.toLowerCase() === term.toLowerCase();
        return matches
          ? <mark key={i} className="bg-accent/40 text-foreground rounded px-0.5">{part}</mark>
          : <span key={i}>{part}</span>;
      })}
    </>
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
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [exactMatch, setExactMatch] = useState(false);
  const [numberedBookFilter, setNumberedBookFilter] = useState(null);
  const [showBookFilter, setShowBookFilter] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const RESULTS_PER_PAGE = 50;

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
    setCurrentPage(1);

    try {
      console.log('[Search] Starting search for:', kw);
      const bible = await getBibleData();
      console.log('[Search] Bible data loaded, keys:', Object.keys(bible || {}).filter(k => k !== '__colophons').length);
      // Strip quotes from search term for actual searching
      let searchTerm = kw.trim();
      if (searchTerm.startsWith('"') && searchTerm.endsWith('"') && searchTerm.length >= 3) {
        searchTerm = searchTerm.slice(1, -1);
      }
      setExpandedTerms([]);
      
      const kwLower = searchTerm.toLowerCase();
      
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
          goToVerse(matchingBook.abbr, ch, v1, v2);
          setLoading(false);
          return;
        }
      }

      // Check for "end of [book]" or "[book] end" queries
      const endMatch = kwLower.match(/(?:^|\s)(?:end of|end)\s+([a-z0-9\s]+)|(?:^|\s)([a-z0-9\s]+)\s+(?:end)$/);
      if (endMatch) {
        const bookStr = (endMatch[1] || endMatch[2] || '').trim();
        const matchingBook = BIBLE_BOOKS.find(b => 
          b.shortName.toLowerCase().includes(bookStr) ||
          b.abbr.toLowerCase().includes(bookStr) ||
          b.shortName.toLowerCase() === bookStr
        );
        if (matchingBook) {
          // Navigate to last chapter of the book
          goToVerse(matchingBook.abbr, matchingBook.chapters, null);
          setLoading(false);
          return;
        }
      }

      // Check for "pilcrows" search - show verses with pilcrow marks
      if (kwLower === 'pilcrows' || kwLower === 'pilcrow' || kwLower === '¶') {
        const pilcrowResults = [];
        const seen = new Set();
        for (const bookName in bible) {
          if (bookName === '__colophons') continue;
          if (testament === 'ot' && !OT_BOOKS.has(bookName)) continue;
          if (testament === 'nt' && !NT_BOOKS.has(bookName)) continue;
          if (selectedBooks.size > 0) {
            const bookEntry = BIBLE_BOOKS.find(b => b.apiName === bookName);
            if (!bookEntry || !selectedBooks.has(bookEntry.abbr)) continue;
          }
          const chapters = bible[bookName];
          for (const chapterNum in chapters) {
            const verses = chapters[chapterNum];
            for (const verseObj of verses) {
              if (verseObj.text.includes('¶')) {
                const key = `${bookName}-${chapterNum}-${verseObj.verse}`;
                if (seen.has(key)) continue;
                seen.add(key);
                const bookEntry = BIBLE_BOOKS.find(b => b.apiName === bookName);
                pilcrowResults.push({
                  book: bookName,
                  chapter: parseInt(chapterNum),
                  verse: verseObj.verse,
                  text: verseObj.text,
                  abbr: bookEntry ? bookEntry.abbr : bookName.slice(0, 3).toUpperCase(),
                });
              }
            }
          }
        }
        setResults(pilcrowResults);
        setLoading(false);
        return;
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

      // Check for "prophets end of [book]" queries
      const prophetsEndMatch = kwLower.match(/prophets?\s+(?:end\s+of\s+)?([a-z0-9\s]+)/);
      if (prophetsEndMatch) {
        const bookStr = prophetsEndMatch[1].trim();
        const matchingBook = BIBLE_BOOKS.find(b => 
          b.shortName.toLowerCase().includes(bookStr) ||
          b.abbr.toLowerCase().includes(bookStr)
        );
        if (matchingBook) {
          targetBookAbbr = matchingBook.abbr;
          setNumberedBookFilter(targetBookAbbr);
        }
      }

      const matches = [];
      const seen = new Set();
      const searchTermLower = searchTerm.toLowerCase();

      for (const bookName in bible) {
        if (bookName === '__colophons') continue;
        if (testament === 'ot' && !OT_BOOKS.has(bookName)) continue;
        if (testament === 'nt' && !NT_BOOKS.has(bookName)) continue;
        
        if (selectedBooks.size > 0) {
          const bookEntry = BIBLE_BOOKS.find(b => b.apiName === bookName);
          if (!bookEntry || !selectedBooks.has(bookEntry.abbr)) continue;
        }
        
        if (targetBookAbbr) {
          const bookEntry = BIBLE_BOOKS.find(b => b.apiName === bookName);
          if (!bookEntry || bookEntry.abbr !== targetBookAbbr) continue;
        }

        const chapters = bible[bookName];
        for (const chapterNum in chapters) {
          const verses = chapters[chapterNum];
          // Keep italics in brackets for search and display
          const processedVerses = verses.map(v => ({
            verse: v.verse,
            text: v.text.replace(/¶\s*/g, '').replace(/^<<[^>]*>>\s*/, '')
          }));
          
          // Search in verses
          for (const verseObj of processedVerses) {
            let found = false;
            const searchText = verseObj.text;
            const searchTextLower = searchText.toLowerCase();
            
            if (exactMatch) {
              // Exact match = exact phrase contains (case sensitive or insensitive)
              if (caseSensitive) {
                found = searchText.includes(searchTerm);
              } else {
                found = searchTextLower.includes(searchTermLower);
              }
            } else if (caseSensitive) {
              if (wholeWord) {
                const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const wordRegex = new RegExp(`\\b${escapedTerm}\\b`);
                found = wordRegex.test(searchText);
              } else {
                found = searchText.includes(searchTerm);
              }
            } else {
              if (wholeWord) {
                const escapedTerm = searchTermLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const wordRegex = new RegExp(`\\b${escapedTerm}\\b`);
                found = wordRegex.test(searchTextLower);
              } else {
                found = searchTextLower.includes(searchTermLower);
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
                text: verseObj.text,
                abbr: bookEntry ? bookEntry.abbr : bookName.slice(0, 3).toUpperCase(),
              });
            }
          }
          
          // Search in colophons for this chapter
          const colophon = bible.__colophons?.[bookName]?.[chapterNum];
          if (colophon) {
            const colophonText = colophon.replace(/¶\s*/g, '');
            const colophonLower = colophonText.toLowerCase();
            let colophonFound = false;
            
            if (exactMatch) {
              // Exact match = exact phrase contains (case sensitive or insensitive)
              colophonFound = caseSensitive ? colophonText.includes(searchTerm) : colophonLower.includes(searchTermLower);
            } else if (caseSensitive) {
              if (wholeWord) {
                const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const wordRegex = new RegExp(`\\b${escapedTerm}\\b`);
                colophonFound = wordRegex.test(colophonText);
              } else {
                colophonFound = colophonText.includes(searchTerm);
              }
            } else {
              if (wholeWord) {
                const escapedTerm = searchTermLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const wordRegex = new RegExp(`\\b${escapedTerm}\\b`);
                colophonFound = wordRegex.test(colophonLower);
              } else {
                colophonFound = colophonLower.includes(searchTermLower);
              }
            }
            
            if (colophonFound) {
              const key = `${bookName}-${chapterNum}-colophon`;
              if (!seen.has(key)) {
                seen.add(key);
                const bookEntry = BIBLE_BOOKS.find(b => b.apiName === bookName);
                matches.push({
                  book: bookName,
                  chapter: parseInt(chapterNum),
                  verse: 0, // Mark as colophon
                  text: colophonText,
                  isColophon: true,
                  abbr: bookEntry ? bookEntry.abbr : bookName.slice(0, 3).toUpperCase(),
                });
              }
            }
          }
        }
      }

      setResults(matches);
      console.log('[Search] Found', matches.length, 'results');
      console.log('[Search] Found', matches.length, 'results');
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [testament, wholeWord, caseSensitive, exactMatch]);

  // Re-run search whenever URL changes (fixes header search bar)
  useEffect(() => {
    const q = getQueryFromUrl();
    if (q) {
      setQuery(q);
      // Auto-detect quoted searches: enable case-sensitive and exact match
      if (q.startsWith('"') && q.endsWith('"') && q.length >= 3) {
        setCaseSensitive(true);
        setExactMatch(true);
      }
      runSearch(q);
    }
  }, [location.search, runSearch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const kw = query.trim();
    if (kw.length >= 2) {
      // Auto-detect quoted searches: enable case-sensitive and exact match
      if (kw.startsWith('"') && kw.endsWith('"') && kw.length >= 3) {
        setCaseSensitive(true);
        setExactMatch(true);
      }
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
      const text = r.text.replace(/¶\s*/g, '').replace(/^<<[^>]*>>\s*/, '');
      return text;
    });
    const first = results[sorted[0]];
    const last = results[sorted[sorted.length - 1]];
    const firstBookEntry = BIBLE_BOOKS.find(b => b.apiName === first.book);
    const firstBookName = firstBookEntry ? firstBookEntry.shortName : first.book;
    
    // Handle colophon results
    if (first.isColophon) {
      return `"${verses.join(' ')}" — ${firstBookName} ${first.chapter} colophon (KJB)`;
    }
    
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
    const qRaw = getQueryFromUrl() || query;
    const q = qRaw.startsWith('"') && qRaw.endsWith('"') ? qRaw.slice(1, -1) : qRaw;
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

  // Pagination
  const totalPages = Math.ceil(results.length / RESULTS_PER_PAGE);
  const startIndex = (currentPage - 1) * RESULTS_PER_PAGE;
  const endIndex = startIndex + RESULTS_PER_PAGE;
  const paginatedResults = results.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          <label htmlFor="whole-word" className="font-sans text-xs text-muted-foreground cursor-pointer select-none">Whole word</label>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            id="case-sensitive"
            type="checkbox"
            checked={caseSensitive}
            onChange={e => setCaseSensitive(e.target.checked)}
            className="w-3.5 h-3.5 accent-[hsl(var(--accent))] cursor-pointer"
          />
          <label htmlFor="case-sensitive" className="font-sans text-xs text-muted-foreground cursor-pointer select-none">Match case</label>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            id="exact-match"
            type="checkbox"
            checked={exactMatch}
            onChange={e => setExactMatch(e.target.checked)}
            className="w-3.5 h-3.5 accent-[hsl(var(--accent))] cursor-pointer"
          />
          <label htmlFor="exact-match" className="font-sans text-xs text-muted-foreground cursor-pointer select-none">Exact match</label>
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
        <p className="font-sans text-sm text-muted-foreground text-center py-12">
          No results found for "{query.startsWith('"') && query.endsWith('"') ? query.slice(1, -1) : query}".
        </p>
      )}

      {!loading && results.length > 0 && (
        <div>
          {/* Results header + action bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <p className="font-sans text-xs text-muted-foreground">
                {results.length} result{results.length !== 1 ? 's' : ''} for "{(() => {
                  const q = getQueryFromUrl() || query;
                  return q.startsWith('"') && q.endsWith('"') ? q.slice(1, -1) : q;
                })()}"
              </p>
              <p className="font-sans text-xs text-muted-foreground mt-0.5">
                Page {currentPage} of {totalPages}
              </p>

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
            {paginatedResults.map((r, i) => {
              const originalIndex = startIndex + i;
              const isSelected = selected.has(originalIndex);
              const isColophon = r.isColophon || r.verse === 0;
              return (
                <div
                  key={originalIndex}
                  onClick={() => {
                    if (selectMode) {
                      toggleSelect(originalIndex);
                    } else if (isColophon) {
                      goToVerse(r.abbr, r.chapter, null);
                    } else {
                      goToVerse(r.abbr, r.chapter, r.verse);
                    }
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer flex items-start gap-3 ${
                    selected.has(originalIndex)
                      ? 'bg-primary/10 border-primary/40'
                      : 'bg-card border-border hover:border-accent/40 hover:bg-accent/5'
                  }`}
                >
                  {selectMode && (
                    <div className="shrink-0 mt-0.5">
                      {selected.has(originalIndex)
                        ? <CheckSquare className="w-4 h-4 text-primary" />
                        : <Square className="w-4 h-4 text-muted-foreground" />
                      }
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-xs text-accent font-semibold mb-1 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {BIBLE_BOOKS.find(b => b.apiName === r.book)?.shortName || r.book} {r.chapter}
                      {isColophon ? ' (Colophon)' : `:${r.verse}`}
                    </p>
                    <p className="font-serif text-base text-foreground leading-relaxed">
                      {isColophon ? (
                        <span className="italic text-muted-foreground">¶ {highlightText(r.text, query, caseSensitive)}</span>
                      ) : (
                        <span>"{highlightText(r.text, query, caseSensitive)}"</span>
                      )}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="mt-6 mb-8 flex items-center justify-center gap-2">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <div className="flex items-center gap-1.5">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-10 h-10 rounded-xl font-sans text-sm font-semibold transition-all active:scale-95 ${
                        currentPage === pageNum
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-secondary text-secondary-foreground hover:bg-accent/20 hover:shadow-sm'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
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