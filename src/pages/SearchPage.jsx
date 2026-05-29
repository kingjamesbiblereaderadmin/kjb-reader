import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, BookOpen, Loader2, Filter, Copy, Download, CheckSquare, Square, X, BookMarked, ChevronDown, Share2, ChevronUp, ChevronDown as ChevronDownIcon, ChevronRight } from 'lucide-react';
import { getBibleData } from '@/lib/bibleCache';
import { BIBLE_BOOKS, OLD_TESTAMENT, NEW_TESTAMENT } from '@/lib/bibleData';
import { parseReference } from '@/lib/parseReference';
import SearchResultsList from '@/components/bible/SearchResultsList';

const OT_BOOKS = new Set(BIBLE_BOOKS.filter(b => b.testament === 'old').map(b => b.apiName));
const NT_BOOKS = new Set(BIBLE_BOOKS.filter(b => b.testament === 'new').map(b => b.apiName));

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
  const [totalOccurrences, setTotalOccurrences] = useState(0);
  const [searched, setSearched] = useState(false);
  const [testamentFilter, setTestamentFilter] = useState(new Set(['all'])); // Multi-select: 'all', 'old', 'new'
  const [wholeWord, setWholeWord] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [exactMatch, setExactMatch] = useState(false);
  const [numberedBookFilter, setNumberedBookFilter] = useState(null);
  const [showBookFilter, setShowBookFilter] = useState(false);
  const [selectedBooks, setSelectedBooks] = useState(new Set());
  const [showBookResult, setShowBookResult] = useState(null); // { bookName, abbr, chapters, testament }
  const [bookFilterQuery, setBookFilterQuery] = useState('');
  const [booksWithResults, setBooksWithResults] = useState(null); // Track which books have results for current search (null = no search yet)

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [shareFeedback, setShareFeedback] = useState(false);
  
  // Track current search result index for navigation
  const [currentResultIndex, setCurrentResultIndex] = useState(0);

  const runSearch = useCallback(async (kw) => {
    if (!kw || kw.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    setResults([]);
    setSelected(new Set());
    setSelectMode(false);
    setNumberedBookFilter(null);
    setSelectedBooks(new Set()); // Clear book filter on new search

    try {
      console.log('[SEARCH] Starting search for:', kw);
      const bible = await getBibleData();
      console.log('[SEARCH] Bible data loaded, books:', Object.keys(bible).filter(k => k !== '__colophons').length);
      let searchTerm = kw.trim();
      // If query is wrapped in quotes, treat as exact phrase: strip the quotes
      // (the Bible text doesn't contain literal quote characters)
      const isQuotedPhrase = (searchTerm.startsWith('"') && searchTerm.endsWith('"') && searchTerm.length >= 3) ||
                              (searchTerm.startsWith('\u201C') && searchTerm.endsWith('\u201D') && searchTerm.length >= 3);
      if (isQuotedPhrase) {
        searchTerm = searchTerm.slice(1, -1).trim();
      }
      setHighlightTerm(searchTerm);
      
      // Quoted phrases force exact phrase + whole word on (NOT match case —
      // case-sensitivity would exclude capitalized instances like "Blood" at
      // verse starts, undercounting vs standard concordance figures).
      const effectiveCaseSensitive = caseSensitive;
      const effectiveWholeWord = isQuotedPhrase ? true : wholeWord;
      const effectiveExactMatch = isQuotedPhrase ? true : exactMatch;
      setHighlightCaseSensitive(effectiveCaseSensitive);
      if (isQuotedPhrase) {
        if (!wholeWord) setWholeWord(true);
        if (!exactMatch) setExactMatch(true);
      }
      
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
      
      // Check if query matches a book name (e.g. "Genesis", "Samuel", "Kings", "Chronicles")
      // Match full names, abbreviations, and partial matches for books with shared names
      const bookMatches = BIBLE_BOOKS.filter(b => 
        b.shortName.toLowerCase() === kwLower ||
        b.name.toLowerCase() === kwLower ||
        b.abbr.toLowerCase() === kwLower ||
        b.apiName.toLowerCase() === kwLower ||
        (kwLower.length >= 3 && b.shortName.toLowerCase().includes(kwLower))
      );
      
      // If multiple books match (e.g. "Samuel" matches 1&2 Samuel), show the first one
      // If exact match found, prioritize it
      const exactMatch = bookMatches.find(b => 
        b.shortName.toLowerCase() === kwLower ||
        b.apiName.toLowerCase() === kwLower
      );
      const bookMatch = exactMatch || (bookMatches.length > 0 ? bookMatches[0] : null);
      
      if (bookMatch && !isQuotedPhrase && !numberedBookMatch) {
        setShowBookResult({ bookName: bookMatch.shortName, abbr: bookMatch.abbr, chapters: bookMatch.chapters, testament: bookMatch.testament });
      } else {
        setShowBookResult(null);
      }
      
      // Clear last reading position when starting a new search
      try { localStorage.removeItem('kjb-last-reading'); } catch {}
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
        // Multi-select testament filter
        const hasAll = testamentFilter.has('all');
        const hasOld = testamentFilter.has('old');
        const hasNew = testamentFilter.has('new');
        const isOT = OT_BOOKS.has(bookName);
        const isNT = NT_BOOKS.has(bookName);
        // Skip if no matching testament selected
        if (!hasAll && ((isOT && !hasOld) || (isNT && !hasNew))) continue;
        
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
            
            if (effectiveExactMatch) {
              // Exact phrase match: the term must appear verbatim as a contiguous
              // phrase (respecting Match case + Whole word toggles), NOT the whole
              // verse equalling the term.
              const hay = effectiveCaseSensitive ? searchText : searchTextLower;
              const needle = effectiveCaseSensitive ? searchTerm : searchTermLower;
              if (effectiveWholeWord) {
                const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const re = new RegExp(`(^|[^A-Za-z'])${escaped}($|[^A-Za-z'])`, effectiveCaseSensitive ? '' : 'i');
                found = re.test(searchText);
              } else {
                found = hay.includes(needle);
              }
            } else if (effectiveCaseSensitive) {
              if (effectiveWholeWord) {
                const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const wordRegex = new RegExp(`(^|[^A-Za-z'])${escapedTerm}($|[^A-Za-z'])`);
                found = wordRegex.test(searchText);
              } else {
                found = searchText.includes(searchTerm);
              }
            } else {
              if (effectiveWholeWord) {
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
            
            if (effectiveExactMatch) {
              const hay = effectiveCaseSensitive ? colophonText : colophonLower;
              const needle = effectiveCaseSensitive ? searchTerm : searchTermLower;
              if (effectiveWholeWord) {
                const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const re = new RegExp(`(^|[^A-Za-z'])${escaped}($|[^A-Za-z'])`, effectiveCaseSensitive ? '' : 'i');
                colophonFound = re.test(colophonText);
              } else {
                colophonFound = hay.includes(needle);
              }
            } else if (effectiveCaseSensitive) {
              if (effectiveWholeWord) {
                const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const wordRegex = new RegExp(`\\b${escapedTerm}\\b`);
                colophonFound = wordRegex.test(colophonText);
              } else {
                colophonFound = colophonText.includes(searchTerm);
              }
            } else {
              if (effectiveWholeWord) {
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

      // Track which books have results
      const booksWithHits = new Set(matches.map(m => {
        const bookEntry = BIBLE_BOOKS.find(b => b.apiName === m.book);
        return bookEntry ? bookEntry.abbr : null;
      }).filter(Boolean));
      setBooksWithResults(booksWithHits);

      // Compute total occurrences (multiple hits per verse counted) so the
      // results header matches standard concordance figures.
      const occEscaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      let occRe;
      if (effectiveWholeWord) {
        occRe = new RegExp(`(?<![A-Za-z'])${occEscaped}(?![A-Za-z'])`, effectiveCaseSensitive ? 'g' : 'gi');
      } else {
        occRe = new RegExp(occEscaped, effectiveCaseSensitive ? 'g' : 'gi');
      }
      let totalOcc = 0;
      for (const m of matches) {
        const clean = (m.text || '').replace(/[[\]]/g, '');
        totalOcc += (clean.match(occRe) || []).length;
      }
      setTotalOccurrences(totalOcc);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    }
    setLoading(false);
  }, [testamentFilter, wholeWord, caseSensitive, exactMatch, selectedBooks, numberedBookFilter]);

  // Re-run the search whenever filters change (after an initial search has been done)
  // Note: selectedBooks is NOT included - book selection filters results without re-searching
  useEffect(() => {
    const q = (getQueryFromUrl() || query).trim();
    if (searched && q.length >= 2) {
      runSearch(q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testamentFilter, wholeWord, caseSensitive, exactMatch, numberedBookFilter]);

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
      setSearched(true);
      setShowBookResult(null);
      runSearch(kw);
    }
  };

  const goToVerse = useCallback((abbr, chapter, verse, verseEnd, resultIndex = null) => {
    // Store the search term for the CurrentlyReadingIndicator
    const q = getQueryFromUrl() || query;
    try { localStorage.setItem('kjb-search-term', q); } catch {}
    try { localStorage.setItem('kjb-position', JSON.stringify({ abbr, chapter, verse: verse || null, verseEnd: verseEnd || null })); } catch {}
    // Clear last reading position (from daily verse/random) when navigating from search
    try { localStorage.removeItem('kjb-last-reading'); } catch {}
    // Store search results and index for navigation
    try {
      localStorage.setItem('kjb-search-index', String(resultIndex !== null ? resultIndex : 0));
      localStorage.setItem('kjb-search-total', String(results.length));
      localStorage.setItem('kjb-search-results', JSON.stringify(results.map(r => ({ abbr: r.abbr, chapter: r.chapter, verse: r.verse }))));
    } catch {}
    window.scrollTo({ top: 0 });
    // Navigate with URL params so the reader reliably scrolls to + highlights the verse.
    const url = verse ? `/read?book=${abbr}&chapter=${chapter}&verse=${verse}` : `/read?book=${abbr}&chapter=${chapter}`;
    navigate(url);
    // If already on /read, notify the mounted reader to load this passage.
    setTimeout(() => { try { window.dispatchEvent(new Event('kjb-navigate')); } catch {} }, 0);
  }, [navigate, query, results]);

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

  const handleShare = async () => {
    const indices = selected.size > 0 ? selected : new Set(results.map((_, i) => i));
    const text = formatVerses(indices);
    const q = getQueryFromUrl() || query;
    const shareText = `KJB Search Results — "${q}"\n\n${text}`;
    
    try {
      if (navigator.share) {
        await navigator.share({ title: `KJB Search: ${q}`, text: shareText });
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return;
    }
    
    try {
      await navigator.clipboard.writeText(shareText);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 1800);
    } catch {}
  };

  const selectedList = [...selected].sort((a, b) => a - b);
  
  // Navigate to previous/next search result
  const handlePrevResult = () => {
    if (currentResultIndex > 0) {
      const prevIndex = currentResultIndex - 1;
      const result = results[prevIndex];
      goToVerse(result.abbr, result.chapter, result.verse, null, prevIndex);
    }
  };
  
  const handleNextResult = () => {
    if (currentResultIndex < results.length - 1) {
      const nextIndex = currentResultIndex + 1;
      const result = results[nextIndex];
      goToVerse(result.abbr, result.chapter, result.verse, null, nextIndex);
    }
  };

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
        {[['all', 'All'], ['old', 'OT'], ['new', 'NT']].map(([val, label]) => {
          const isActive = testamentFilter.has(val);
          return (
            <button
              key={val}
              type="button"
              onClick={() => {
                setTestamentFilter(prev => {
                  const next = new Set(prev);
                  if (val === 'all') {
                    // Toggle all: if all is already active, clear everything; otherwise select only all
                    if (next.has('all')) {
                      next.clear();
                    } else {
                      next.clear();
                      next.add('all');
                    }
                  } else {
                    // Toggle specific testament
                    if (next.has(val)) {
                      next.delete(val);
                      // If nothing left, add 'all' back
                      if (next.size === 0) next.add('all');
                    } else {
                      next.add(val);
                      // If both OT and NT are selected, also add 'all' for consistency
                      if (next.has('old') && next.has('new')) next.add('all');
                    }
                  }
                  return next;
                });
              }}
              className={`px-2.5 py-1 rounded-lg font-sans text-xs font-medium transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
              }`}
            >
              {label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowBookFilter(!showBookFilter)}
          className={`px-2.5 py-1 rounded-lg font-sans text-xs font-medium transition-colors flex items-center gap-1 ${
            showBookFilter ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
          }`}
        >
          <BookOpen className="w-3 h-3" />
          Books {selectedBooks.size > 0 && selectedBooks.size < 66 ? `(${selectedBooks.size})` : selectedBooks.size === 66 ? '(All)' : ''}
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
          className="fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center p-4"
          onClick={() => setShowBookFilter(false)}
          style={{ pointerEvents: 'auto' }}
        >
          <div
            className="w-full max-w-md max-h-[80vh] flex flex-col bg-card border border-border rounded-2xl shadow-xl"
            onClick={(e) => e.stopPropagation()}
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border flex-shrink-0">
              <p className="font-sans text-sm font-semibold text-foreground">
                Select Books {selectedBooks.size > 0 && selectedBooks.size < 66 ? `(${selectedBooks.size})` : selectedBooks.size === 66 ? '(All 66)' : ''}
              </p>
              <button onClick={() => setShowBookFilter(false)} className="p-1 rounded-lg hover:bg-accent/20">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            {/* Search input for filtering books */}
            <div className="p-3 sm:p-4 pb-2 flex-shrink-0">
              <input
                type="text"
                value={bookFilterQuery}
                onChange={(e) => setBookFilterQuery(e.target.value)}
                placeholder="Search books..."
                className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm font-sans text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors"
                autoFocus
              />
            </div>
            <div className="flex gap-2 p-3 sm:p-4 pb-0 flex-shrink-0">
              <button
                onClick={() => {
                  const booksToSelect = BIBLE_BOOKS
                    .filter(b => !bookFilterQuery || b.shortName.toLowerCase().includes(bookFilterQuery.toLowerCase()));
                  setSelectedBooks(new Set(booksToSelect.map(b => b.abbr)));
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
            <div className="flex-1 overflow-y-auto px-3 sm:px-4 pb-2" style={{ minHeight: '200px' }}>
              <div className="space-y-4">
                {/* Old Testament section */}
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 sticky top-0 bg-card py-1">
                    Old Testament {searched && booksWithResults && booksWithResults.size > 0 && <span className="font-normal normal-case text-muted-foreground/60">({[...booksWithResults].filter(abbr => OLD_TESTAMENT.some(b => b.abbr === abbr)).length})</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {OLD_TESTAMENT
                      .filter(book => {
                        const matchesQuery = !bookFilterQuery || book.shortName.toLowerCase().includes(bookFilterQuery.toLowerCase());
                        // Only show books that have results for the current search (if searched)
                        const hasResults = !searched || !booksWithResults || booksWithResults.has(book.abbr);
                        return matchesQuery && hasResults;
                      })
                      .map(book => {
                        const isSelected = selectedBooks.has(book.abbr);
                        return (
                          <button
                            key={book.abbr}
                            onClick={() => {
                              setSelectedBooks(prev => {
                                const next = new Set(prev);
                                next.has(book.abbr) ? next.delete(book.abbr) : next.add(book.abbr);
                                return next;
                              });
                            }}
                            className={`px-3 py-2 rounded-lg font-sans text-xs font-medium transition-colors whitespace-normal text-left ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-foreground hover:bg-accent/20'
                            }`}
                            title={book.shortName}
                          >
                            {book.shortName}
                          </button>
                        );
                      })}
                  </div>
                </div>
                {/* New Testament section */}
                <div>
                  <p className="font-sans text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2 sticky top-0 bg-card py-1">
                    New Testament {searched && booksWithResults && booksWithResults.size > 0 && <span className="font-normal normal-case text-muted-foreground/60">({[...booksWithResults].filter(abbr => NEW_TESTAMENT.some(b => b.abbr === abbr)).length})</span>}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {NEW_TESTAMENT
                      .filter(book => {
                        const matchesQuery = !bookFilterQuery || book.shortName.toLowerCase().includes(bookFilterQuery.toLowerCase());
                        // Only show books that have results for the current search (if searched)
                        const hasResults = !searched || !booksWithResults || booksWithResults.has(book.abbr);
                        return matchesQuery && hasResults;
                      })
                      .map(book => {
                        const isSelected = selectedBooks.has(book.abbr);
                        return (
                          <button
                            key={book.abbr}
                            onClick={() => {
                              setSelectedBooks(prev => {
                                const next = new Set(prev);
                                next.has(book.abbr) ? next.delete(book.abbr) : next.add(book.abbr);
                                return next;
                              });
                            }}
                            className={`px-3 py-2 rounded-lg font-sans text-xs font-medium transition-colors whitespace-normal text-left ${
                              isSelected
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-foreground hover:bg-accent/20'
                            }`}
                            title={book.shortName}
                          >
                            {book.shortName}
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 border-t border-border flex-shrink-0">
              <button
                onClick={() => setShowBookFilter(false)}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Search {selectedBooks.size > 0 && selectedBooks.size < 66 ? `(${selectedBooks.size} book${selectedBooks.size !== 1 ? 's' : ''})` : selectedBooks.size === 66 ? '(All 66 books)' : 'All Books'}
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
        <div className="space-y-4">
          <p className="font-sans text-sm text-muted-foreground text-center py-12">No results found for "{stripQuotes(query)}".</p>
          {showBookResult && (
            <div className="max-w-md mx-auto p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="font-sans text-xs text-muted-foreground mb-3 text-center">
                Did you mean the book of <span className="font-semibold text-foreground">{showBookResult.bookName}</span>?
              </p>
              <button
                onClick={() => {
                  setShowBookResult(null);
                  goToVerse(showBookResult.abbr, 1, null);
                }}
                className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              >
                <BookOpen className="w-4 h-4" />
                Go to {showBookResult.bookName}
              </button>
            </div>
          )}
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          {/* Book match suggestion - shown when search term also matches a book name */}
          {showBookResult && (
            <div className="mb-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
              <p className="font-sans text-xs text-muted-foreground mb-3">
                Found the book of <span className="font-semibold text-foreground">{showBookResult.bookName}</span>. How would you like to search?
              </p>
              <div className="grid sm:grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setShowBookResult(null);
                    goToVerse(showBookResult.abbr, 1, null);
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <BookOpen className="w-5 h-5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-serif text-sm font-bold">Go to {showBookResult.bookName}</p>
                    <p className="text-xs opacity-75">{showBookResult.chapters} {showBookResult.chapters === 1 ? 'chapter' : 'chapters'} • {showBookResult.testament === 'old' ? 'Old' : 'New'} Testament</p>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setShowBookResult(null);
                    // Search is already running, just let it complete
                  }}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent/20 transition-colors"
                >
                  <Search className="w-5 h-5 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-serif text-sm font-bold">Search "{stripQuotes(getQueryFromUrl() || query)}"</p>
                    <p className="text-xs opacity-75">Find all mentions in verses</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Results header + action bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <div>
              <p className="font-sans text-xs text-muted-foreground">
                {results.length} verse{results.length !== 1 ? 's' : ''} for "{stripQuotes(getQueryFromUrl() || query)}"
                {totalOccurrences > results.length && (
                  <span className="text-muted-foreground/70"> · {totalOccurrences} occurrences</span>
                )}
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
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
                  >
                    <Share2 className="w-3.5 h-3.5" /> {shareFeedback ? 'Copied!' : 'Share'}
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
                      <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
                      >
                        <Share2 className="w-3.5 h-3.5" /> {shareFeedback ? 'Copied!' : `Share (${selected.size})`}
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