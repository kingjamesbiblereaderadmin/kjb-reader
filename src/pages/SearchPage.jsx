import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, BookOpen, Loader2, Filter, Copy, Download, CheckSquare, Square, X, BookMarked, ChevronDown } from 'lucide-react';
import { getBibleData } from '@/lib/bibleCache';
import { BIBLE_BOOKS, OLD_TESTAMENT, NEW_TESTAMENT } from '@/lib/bibleData';
import { parseReference } from '@/lib/parseReference';
import SearchResultsList from '@/components/bible/SearchResultsList';

const OT_BOOKS = new Set(BIBLE_BOOKS.filter(b => b.testament === 'OT' || BIBLE_BOOKS.indexOf(b) < 39).map(b => b.apiName));
const NT_BOOKS = new Set(BIBLE_BOOKS.filter(b => b.testament === 'NT' || BIBLE_BOOKS.indexOf(b) >= 39).map(b => b.apiName));

// Strip surrounding quotes from a display query (for "results for" labels)
function stripQuotes(s) {
  if (!s) return s;
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"') && t.length >= 2) ||
      (t.startsWith('\u201C') && t.endsWith('\u201D') && t.length >= 2)) {
    return t.slice(1, -1).trim();
  }
  return t;
}

export default function SearchPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const getQueryFromUrl = () => new URLSearchParams(window.location.search).get('q') || '';

  const [query, setQuery] = useState(getQueryFromUrl);
  // Start in loading state if there's a query in the URL, so the empty/prompt
  // states don't flash before the initial search kicks off.
  const [loading, setLoading] = useState(() => getQueryFromUrl().trim().length >= 2);
  const [highlightTerm, setHighlightTerm] = useState('');
  const [highlightCaseSensitive, setHighlightCaseSensitive] = useState(false);
  const [results, setResults] = useState([]);
  const [searched, setSearched] = useState(false);
  const [testament, setTestament] = useState('all');
  const [wholeWord, setWholeWord] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [exactMatch, setExactMatch] = useState(false);
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

    try {
      const bible = await getBibleData();
      let searchTerm = kw.trim();
      // If query is wrapped in quotes, treat as exact phrase: strip the quotes
      // (the Bible text doesn't contain literal quote characters)
      const isQuotedPhrase = (searchTerm.startsWith('"') && searchTerm.endsWith('"') && searchTerm.length >= 3) ||
                              (searchTerm.startsWith('\u201C') && searchTerm.endsWith('\u201D') && searchTerm.length >= 3);
      if (isQuotedPhrase) {
        searchTerm = searchTerm.slice(1, -1).trim();
      }
      setHighlightTerm(searchTerm);
      
      // Quoted phrases force case-sensitive matching
      const effectiveCaseSensitive = isQuotedPhrase ? true : caseSensitive;
      setHighlightCaseSensitive(effectiveCaseSensitive);
      if (isQuotedPhrase && !caseSensitive) setCaseSensitive(true);
      
      const kwLower = searchTerm.toLowerCase();

      // Check if the query is a scripture reference (by name OR abbreviation),
      // e.g. "jn 3:16", "gen 1", "1 cor 13:4-7", "psalm 23". If so, jump straight to it.
      if (!isQuotedPhrase) {
        const ref = parseReference(searchTerm);
        if (ref) {
          goToVerse(ref.abbr, ref.chapter, ref.verse, ref.verseEnd);
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
            // Strip bracket markers so word boundaries match real words (e.g. [sin] -> sin)
            const searchText = verseObj.text.replace(/[[\]]/g, '');
            const searchTextLower = searchText.toLowerCase();
            
            if (exactMatch) {
              if (effectiveCaseSensitive) {
                found = (searchText === searchTerm);
              } else {
                found = (searchTextLower === searchTermLower);
              }
            } else if (effectiveCaseSensitive) {
              if (wholeWord) {
                const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const wordRegex = new RegExp(`(^|[^A-Za-z'])${escapedTerm}($|[^A-Za-z'])`);
                found = wordRegex.test(searchText);
              } else {
                found = searchText.includes(searchTerm);
              }
            } else {
              if (wholeWord) {
                const escapedTerm = searchTermLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const wordRegex = new RegExp(`(^|[^a-z'])${escapedTerm}($|[^a-z'])`, 'i');
                found = wordRegex.test(searchText);
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
              colophonFound = effectiveCaseSensitive ? (colophonText === searchTerm) : (colophonLower === searchTermLower);
            } else if (effectiveCaseSensitive) {
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
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    }
    setLoading(false);
  }, [testament, wholeWord, caseSensitive, exactMatch, selectedBooks]);

  // Re-run the search whenever filters change (after an initial search has been done)
  useEffect(() => {
    const q = (getQueryFromUrl() || query).trim();
    if (searched && q.length >= 2) {
      runSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testament, wholeWord, caseSensitive, exactMatch, selectedBooks]);

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

  const goToVerse = useCallback((abbr, chapter, verse, verseEnd) => {
    try { localStorage.setItem('kjb-position', JSON.stringify({ abbr, chapter, verse: verse || null, verseEnd: verseEnd || null })); } catch {}
    window.scrollTo({ top: 0 });
    // Navigate with URL params so the reader reliably scrolls to + highlights the verse.
    const url = verse ? `/read?book=${abbr}&chapter=${chapter}&verse=${verse}` : `/read?book=${abbr}&chapter=${chapter}`;
    navigate(url);
    // If already on /read, notify the mounted reader to load this passage.
    setTimeout(() => { try { window.dispatchEvent(new Event('kjb-navigate')); } catch {} }, 0);
  }, [navigate]);

  // Selection helpers
  const toggleSelect = useCallback((i) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }, []);

  const selectAll = () => setSelected(new Set(results.map((_, i) => i)));
  const clearSelection = () => { setSelected(new Set()); setSelectMode(false); };

  // Format selected verses — each verse on its own line with its own reference.
  // Brackets are converted to nothing (plain text) for clean copy/export.
  const formatVerses = (indices) => {
    const sorted = [...indices].sort((a, b) => a - b);
    const lines = sorted.map(i => {
      const r = results[i];
      const text = r.text
        .replace(/¶\s*/g, '')
        .replace(/^<<[^>]*>>\s*/, '')
        .replace(/\[([^\]]+)\]/g, '$1');
      const bookEntry = BIBLE_BOOKS.find(b => b.apiName === r.book);
      const bookName = bookEntry ? bookEntry.shortName : r.book;
      const ref = (r.isColophon || r.verse === 0)
        ? `${bookName} ${r.chapter} colophon`
        : `${bookName} ${r.chapter}:${r.verse}`;
      return `"${text}"\n— ${ref} (KJB)`;
    });
    return lines.join('\n\n');
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
    const footer = `\n\n${'='.repeat(50)}\n${indices.size} verse${indices.size !== 1 ? 's' : ''} — King James Bible`;
    // Prepend a UTF-8 BOM so em-dashes/curly quotes render correctly in all text viewers
    const blob = new Blob(['\uFEFF', header + body + footer], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kjb-search-${q.replace(/\s+/g, '-').slice(0, 30)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedList = [...selected].sort((a, b) => a - b);

  return (
    <div className="w-full max-w-[90rem] mx-auto px-4 sm:px-8 lg:px-16 py-6">
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

      {/* Book filter panel — modal with tap-out to dismiss */}
      {showBookFilter && (
        <div
          className="fixed inset-0 z-[60] bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={() => setShowBookFilter(false)}
        >
          <div
            className="w-full sm:max-w-lg max-h-[80vh] flex flex-col bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <p className="font-sans text-sm font-semibold text-foreground">
                Select Books {selectedBooks.size > 0 && `(${selectedBooks.size})`}
              </p>
              <button onClick={() => setShowBookFilter(false)} className="p-1 rounded-lg hover:bg-accent/20">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="flex gap-2 p-4 pb-2">
              <button
                onClick={() => {
                  if (testament === 'ot') setSelectedBooks(new Set(OLD_TESTAMENT.map(b => b.abbr)));
                  else if (testament === 'nt') setSelectedBooks(new Set(NEW_TESTAMENT.map(b => b.abbr)));
                  else setSelectedBooks(new Set(BIBLE_BOOKS.map(b => b.abbr)));
                }}
                className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
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
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 px-4 overflow-y-auto flex-1">
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
                      : 'bg-secondary text-foreground hover:bg-accent/20'
                  }`}
                  title={book.shortName}
                >
                  {book.shortName.length > 12 ? book.abbr : book.shortName}
                </button>
              ))}
            </div>
            <div className="p-4 border-t border-border">
              <button
                onClick={() => setShowBookFilter(false)}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Go {selectedBooks.size > 0 ? `(${selectedBooks.size} book${selectedBooks.size !== 1 ? 's' : ''})` : '— All Books'}
              </button>
            </div>
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
        <p className="font-sans text-sm text-muted-foreground text-center py-12">No results found for "{stripQuotes(query)}".</p>
      )}

      {!loading && results.length > 0 && (
        <div>
          {/* Results header + action bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <p className="font-sans text-xs text-muted-foreground">
                {results.length} result{results.length !== 1 ? 's' : ''} for "{stripQuotes(getQueryFromUrl() || query)}"
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
          <SearchResultsList
            results={results}
            highlightTerm={highlightTerm}
            highlightCaseSensitive={highlightCaseSensitive}
            selectMode={selectMode}
            selected={selected}
            onToggleSelect={toggleSelect}
            onGoToVerse={goToVerse}
          />
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