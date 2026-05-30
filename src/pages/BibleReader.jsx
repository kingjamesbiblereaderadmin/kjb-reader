import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Loader2, AlignJustify, AlignLeft, List, Columns2, Maximize2, Minimize2, ChevronDown, CheckSquare, Square, Copy, X, BookMarked, ZoomIn, Minus, Plus, Type, Share2 } from 'lucide-react';
import { buildVerseUrl, formatVerseShare, cleanVerseText } from '@/lib/formatDailyVerse';
import { BIBLE_BOOKS, getNextBook, getPrevBook } from '@/lib/bibleData';
import { fetchChapter, fetchVerseCount, renderVerseText, renderColophonText, renderSubscriptText } from '@/lib/bibleApi';
import { getBibleData, forceReloadBibleData } from '@/lib/bibleCache';
import { SUBSCRIPTS, COLOPHONS } from '@/lib/bibleSubscripts';
import BookSelector from '@/components/bible/BookSelector';
import ChapterSelector from '@/components/bible/ChapterSelector';
import VerseSelector from '@/components/bible/VerseSelector';
import VerseText from '@/components/bible/VerseText';
import TitlePage from '@/components/bible/TitlePage';
import SelectorSheet from '@/components/bible/SelectorSheet';
import RunningHead from '@/components/bible/RunningHead';
import CurrentlyReadingIndicator from '@/components/bible/CurrentlyReadingIndicator';
import { useHeaderHide } from '@/lib/HeaderHideContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { Accessibility } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getAccessibilityFont } from '@/lib/accessibilityFont';
import { getSearchNav, setSearchIndex, clearSearchNav } from '@/lib/searchNav';

const isMobile = () => window.innerWidth < 640;

const STORAGE_KEY = 'kjb-position';

// Resolve a book from a URL/string token — accepts abbr (e.g. "GEN"),
// short name, or api name (case-insensitive, ignores spaces).
function resolveBook(token) {
  if (!token) return null;
  const t = String(token).trim().toLowerCase().replace(/\s+/g, '');
  return BIBLE_BOOKS.find(b =>
    b.abbr.toLowerCase() === t ||
    b.shortName.toLowerCase().replace(/\s+/g, '') === t ||
    (b.apiName && b.apiName.toLowerCase().replace(/\s+/g, '') === t) ||
    (b.name && b.name.toLowerCase().replace(/\s+/g, '') === t)
  ) || null;
}

// Format verses with dashes for consecutive, commas for gaps
function formatVerseRange(verses) {
  if (!verses || verses.length === 0) return '';
  if (verses.length === 1) return String(verses[0]);
  
  const sorted = [...verses].sort((a, b) => a - b);
  const ranges = [];
  let start = sorted[0];
  let end = sorted[0];
  
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? String(start) : `${start}-${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }
  ranges.push(start === end ? String(start) : `${start}-${end}`);
  
  return ranges.join(',');
}

function loadPosition() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const p = JSON.parse(s);
      console.log('Loaded from localStorage:', p);
      // Validate abbr exists in BIBLE_BOOKS
      const bookExists = BIBLE_BOOKS.find(b => b.abbr === p.abbr);
      console.log('Book exists:', bookExists);
      if (p && p.abbr && bookExists) {
        return p;
      } else {
        console.warn('Invalid position data, using default');
      }
    }
  } catch (err) {
    console.error('Failed to load position:', err);
  }
  return { abbr: 'GEN', chapter: 1, verse: null };
}

function savePosition(abbr, chapter, verse = null) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ abbr, chapter, verse })); } catch {}
}


export default function BibleReader() {
  const { hideHeader, setHideHeader } = useHeaderHide();
  const routerLocation = useLocation();
  const routerNavigate = useNavigate();
  const [pos, setPos] = useState(loadPosition);
  const [verses, setVerses] = useState([]);
  const [colophon, setColophon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightVerse, setHighlightVerse] = useState(pos.verse || null);
  const [highlightedVerses, setHighlightedVerses] = useState(new Set());
  const [verseCount, setVerseCount] = useState(0);

  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [showVersePicker, setShowVersePicker] = useState(false);
  // Two independent controls:
  //  • flowMode: 'line' | 'paragraph' (reading flow)
  //  • columnOn: boolean (single vs two-column), combinable with either flow
  const [flowMode, setFlowMode] = useState(() => {
    try {
      const v = localStorage.getItem('kjb-flow');
      if (v === 'line' || v === 'paragraph') return v;
      // Migrate from the old 3-way 'kjb-layout' key
      const old = localStorage.getItem('kjb-layout');
      return old === 'paragraph' ? 'paragraph' : 'line';
    } catch { return 'line'; }
  });
  const [columnOn, setColumnOn] = useState(() => {
    try {
      const v = localStorage.getItem('kjb-column');
      if (v === 'true') return true;
      if (v === 'false') return false;
      // Migrate from the old 3-way 'kjb-layout' key
      return localStorage.getItem('kjb-layout') === 'column';
    } catch { return false; }
  });
  const paragraphMode = flowMode === 'paragraph';
  const columnMode = columnOn;
  const [fullscreen, setFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(() => {
    try { return parseInt(localStorage.getItem('kjb-zoom') || '100'); } catch { return 100; }
  });
  const [showZoomPopover, setShowZoomPopover] = useState(false);
  const [showFontPopover, setShowFontPopover] = useState(false);
  const [fontFamily, setFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-reader-font-family') || 'serif'; } catch { return 'serif'; }
  });
  const [a11yFont, setA11yFont] = useState(getAccessibilityFont);
  const a11yActive = a11yFont !== 'default';
  
  // Track search term for CurrentlyReadingIndicator
  const [searchTerm, setSearchTerm] = useState(() => getSearchNav().term || null);
  const [searchResultIndex, setSearchResultIndex] = useState(() => getSearchNav().index);
  const [searchTotalResults, setSearchTotalResults] = useState(() => getSearchNav().results.length);
  // Ref to prevent focus events from restoring a search we intentionally cleared
  const searchClearedRef = useRef(false);
  // Ref to prevent focus events from restoring a daily/random "last reading"
  // indicator after the user manually navigated (book/chapter/verse) or cleared it
  const lastReadingClearedRef = useRef(false);

  const handleFontChange = (font) => {
    setFontFamily(font);
    try { localStorage.setItem('kjb-reader-font-family', font); } catch {}
  };

  // Map font family values to actual CSS font families
  const getFontFamilyValue = (family) => {
    if (family === 'cursive') return "'Dancing Script', cursive";
    if (family === 'serif') return "'Merriweather', 'Cormorant Garamond', Georgia, serif";
    if (family === 'sans-serif') return "'Inter', system-ui, -apple-system, sans-serif";
    if (family === 'monospace') return "'Courier New', monospace";
    if (family === 'dyslexic') return "'OpenDyslexic', 'Comic Sans MS', sans-serif";
    if (family === 'hyperlegible') return "'Atkinson Hyperlegible', system-ui, sans-serif";
    return family;
  };

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState(new Set());
  const [filterMode, setFilterMode] = useState(false); // show only selected verses
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showFilterOverlay, setShowFilterOverlay] = useState(false);
  // Track last reading position before navigating to daily verse/random chapter
  const [lastReadingPos, setLastReadingPos] = useState(() => {
    try {
      const saved = localStorage.getItem('kjb-last-reading');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen?.();
        setFullscreen(true);
      } catch (err) {
        console.error('Fullscreen error:', err);
      }
    } else {
      try {
        await document.exitFullscreen?.();
        setFullscreen(false);
      } catch (err) {
        console.error('Exit fullscreen error:', err);
      }
    }
  };

  useEffect(() => {
    // Detect both the JS Fullscreen API and browser-native (F11) fullscreen.
    // F11 doesn't fire 'fullscreenchange', so we also compare the window's
    // outer height against the screen height on resize.
    const handler = () => {
      const apiFull = !!document.fullscreenElement;
      const browserFull = Math.abs(window.innerHeight - window.screen.height) < 2;
      setFullscreen(apiFull || browserFull);
    };
    handler();
    document.addEventListener('fullscreenchange', handler);
    window.addEventListener('resize', handler);
    return () => {
      document.removeEventListener('fullscreenchange', handler);
      window.removeEventListener('resize', handler);
    };
  }, []);



  const toggleFlow = () => {
    const next = flowMode === 'line' ? 'paragraph' : 'line';
    setFlowMode(next);
    try { localStorage.setItem('kjb-flow', next); } catch {}
  };

  const toggleColumn = () => {
    setColumnOn(prev => {
      const next = !prev;
      try { localStorage.setItem('kjb-column', String(next)); } catch {}
      return next;
    });
  };

  const adjustZoom = (delta) => {
    const newZoom = Math.max(75, Math.min(150, zoomLevel + delta));
    setZoomLevel(newZoom);
    try { localStorage.setItem('kjb-zoom', String(newZoom)); } catch {}
  };

  const handleZoomChange = (e) => {
    const newZoom = parseInt(e.target.value);
    setZoomLevel(newZoom);
    try { localStorage.setItem('kjb-zoom', String(newZoom)); } catch {}
  };

  const toggleSelectMode = () => {
    if (selectMode) {
      setSelectMode(false);
      setSelectedVerses(new Set());
      setFilterMode(false);
    } else {
      setSelectMode(true);
    }
  };

  const toggleVerseSelect = (verseNum) => {
    setSelectedVerses(prev => {
      const next = new Set(prev);
      next.has(verseNum) ? next.delete(verseNum) : next.add(verseNum);
      return next;
    });
  };

  const selectAllVerses = () => {
    setSelectedVerses(new Set(verses.map(v => v.verse)));
  };

  const handleCopySelected = async () => {
    console.log('[BibleReader] handleCopySelected called');
    console.log('[BibleReader] Selected verses:', selectedVerses.size);
    console.log('[BibleReader] Copy feedback state before:', copyFeedback);
    
    const toUse = selectedVerses.size > 0 ? selectedVerses : new Set(verses.map(v => v.verse));
    const selectedVersesList = verses.filter(v => toUse.has(v.verse)).sort((a, b) => a.verse - b.verse);
    const versesText = selectedVersesList.map(v => cleanVerseText(v.text)).join(' ');

    const verseRange = formatVerseRange(selectedVersesList.map(v => v.verse));
    const reference = `${book.shortName} ${pos.chapter}:${verseRange}`;
    const firstVerse = selectedVersesList[0]?.verse || null;

    const lines = formatVerseShare({
      text: versesText,
      ref: reference,
      url: buildVerseUrl({ abbr: pos.abbr, chapter: pos.chapter, verse: firstVerse }),
    });
    
    console.log('[BibleReader] Copying to clipboard:', lines.substring(0, 100) + '...');
    
    // Use deprecated execCommand to avoid Chrome toast notification
    try {
      const textarea = document.createElement('textarea');
      textarea.value = lines;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      console.log('[BibleReader] ✅ Copy via execCommand (no toast)');
    } catch (err) {
      // Fallback to modern API
      await navigator.clipboard.writeText(lines);
      console.log('[BibleReader] ✅ Clipboard write successful (fallback)');
    }
    
    setCopyFeedback(true);
    console.log('[BibleReader] Copy feedback state after:', true);
    setTimeout(() => {
      console.log('[BibleReader] Copy feedback timeout cleared');
      setCopyFeedback(false);
    }, 1800);
  };

  const handleReadSelected = () => {
    setFilterMode(true);
    setShowFilterOverlay(true);
    setSelectMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Auto-dismiss overlay after 3 seconds
    setTimeout(() => setShowFilterOverlay(false), 3000);
  };

  // Share the current chapter (or selected verses) with a deep-link URL.
  const [shareFeedback, setShareFeedback] = useState(false);
  const handleShareChapter = async () => {
    const hasSelection = selectedVerses.size > 0;
    const firstVerse = hasSelection ? Math.min(...selectedVerses) : null;
    const ref = hasSelection
      ? `${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}`
      : `${book.shortName} ${pos.chapter}`;
    const url = buildVerseUrl({ abbr: pos.abbr, chapter: pos.chapter, verse: firstVerse });
    const shareText = `${ref} (KJB)\n\n${url}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: `${ref} — KJB Reader`, text: shareText });
        return;
      }
    } catch (err) {
      if (err?.name === 'AbortError') return; // user cancelled
    }
    // Fallback: copy link + reference to clipboard
    try {
      await navigator.clipboard.writeText(shareText);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 1800);
    } catch {}
  };

  const topRef = useRef(null);
  // When true, the next chapter load is a fresh navigation and must start at the
  // top (do NOT restore the saved scroll offset for that chapter).
  const freshNavRef = useRef(false);
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);
  const book = BIBLE_BOOKS.find(b => b.abbr === pos.abbr) || BIBLE_BOOKS[0];

  // Determine if viewing a title page (chapter 0)
  const isViewingTitlePage = pos.chapter === 0 && (pos.abbr === 'GEN' || pos.abbr === 'MAT');

  const loadChapter = useCallback(async (bookAbbr, chapter, jumpVerse) => {
    setLoading(true);
    setError(null);
    setVerses([]);
    setColophon(null);
    // Always scroll to top first; verse centering happens after load
    (document.getElementById('kjb-scroll') || window).scrollTo({ top: 0 });
    const b = BIBLE_BOOKS.find(bk => bk.abbr === bookAbbr);
    if (!b) { setError('Book not found'); setLoading(false); return; }
    
    // Reset highlight when no specific verse is targeted
    if (!jumpVerse) {
      setHighlightVerse(null);
    }
    
    // Skip API fetch for title pages (chapter 0)
    if (chapter === 0) {
      setVerseCount(0);
      setLoading(false);
      setHighlightVerse(jumpVerse || null);
      savePosition(bookAbbr, chapter);
      return;
    }
    
    try {
      const data = await fetchChapter(b.apiName, chapter);
      setVerses(data.verses);
      setColophon(data.colophon || null);
      setVerseCount(data.verses.length);
      // Only set highlight if jumpVerse was explicitly provided
      if (jumpVerse) {
        setHighlightVerse(jumpVerse);
      }
      savePosition(bookAbbr, chapter, jumpVerse || null);
      
      // Debug: log sample verses to check for brackets
      console.log('[BibleReader] Loaded', data.verses.length, 'verses for', b.apiName, chapter);
      const versesWithBrackets = data.verses.filter(v => v.text.includes('['));
      console.log('[BibleReader] Has brackets?', versesWithBrackets.length > 0, `(${versesWithBrackets.length}/${data.verses.length})`);
      if (versesWithBrackets.length > 0) {
        console.log('[BibleReader] Sample verse WITH brackets:', versesWithBrackets[0]?.text?.substring(0, 200));
      }
      if (data.verses.length > 0 && versesWithBrackets.length === 0) {
        console.log('[BibleReader] ⚠️ NO BRACKETS FOUND - Sample verse 1:', data.verses[0]?.text?.substring(0, 200));
      }
      console.log('[BibleReader] Colophon for', b.apiName, chapter, ':', data.colophon);
    } catch (err) {
      console.error('Load chapter error:', err);
      setError('Failed to load chapter. Please check your connection.');
    }
    setLoading(false);
  }, []);



  useEffect(() => {
    // Preload and cache ALL Bible data with italics on first mount
    const preloadAndCache = async () => {
      try {
        console.log('[BibleReader] Preloading and caching all Bible data with italics...');
        const data = await getBibleData();
        // Verify cache has italics by checking for brackets
        const sampleBook = data['1 John'];
        if (sampleBook && sampleBook[2]) {
          const verse23 = sampleBook[2].find(v => v.verse === 23);
          if (verse23) {
            console.log('[BibleReader] Cache verification - 1 John 2:23 has brackets?', verse23.text.includes('['));
          }
        }
        console.log('[BibleReader] Bible cache ready with italics');
      } catch (err) {
        console.error('[BibleReader] Cache preload failed:', err);
      }
    };
    preloadAndCache();
    
    // Only restore search nav if we're arriving from a search navigation
    const initParams = new URLSearchParams(window.location.search);
    if (initParams.get('from') === 'search') {
      const { term, index, results } = getSearchNav();
      if (term) {
        searchClearedRef.current = false;
        setSearchTerm(term);
        setSearchResultIndex(index);
        setSearchTotalResults(results.length);
      }
    } else {
      // Clear any stale search nav on fresh load
      clearSearchNav();
      setSearchTerm(null);
    }
    // Restore lastReadingPos when arriving from daily/random
    if (initParams.get('from') === 'daily') {
      try {
        const saved = localStorage.getItem('kjb-last-reading');
        if (saved) setLastReadingPos(JSON.parse(saved));
      } catch {}
    }
    
    // Check for URL parameters: ?book=John&chapter=3&verse=16
    // (book accepts abbr, short name, or full name)
    const urlParams = new URLSearchParams(window.location.search);
    const urlBook = urlParams.get('book');
    const urlChapter = urlParams.get('chapter');
    const urlVerse = urlParams.get('verse');

    const urlBookObj = resolveBook(urlBook);
    if (urlBookObj && urlChapter) {
      const chapterNum = parseInt(urlChapter, 10);
      const verseNum = urlVerse ? parseInt(urlVerse, 10) : null;
      setPos({ abbr: urlBookObj.abbr, chapter: chapterNum, verse: verseNum });
      setHighlightVerse(verseNum || null);
      loadChapter(urlBookObj.abbr, chapterNum, verseNum);
    } else {
      // Load from saved position — restore highlight from saved verse
      const savedVerse = pos.verse || null;
      if (savedVerse) setHighlightVerse(savedVerse);
      loadChapter(pos.abbr, pos.chapter, savedVerse);
    }
    
    // If a verse range was passed, pre-select those verses and enter filter mode
    if (pos.verse && pos.verseEnd && pos.verseEnd > pos.verse) {
      const range = new Set();
      for (let v = pos.verse; v <= pos.verseEnd; v++) range.add(v);
      setSelectedVerses(range);
      setHighlightedVerses(range);
      setFilterMode(true);
    }
  }, []);

  // React to navigation requests when the reader is ALREADY mounted:
  //  • search bar / daily verse / random verse dispatch a 'kjb-navigate' event
  //    after writing kjb-position
  //  • the URL query string changes (?book=&chapter=&verse=)
  // Without this, navigating to /read while already on /read does nothing.
  useEffect(() => {

    // 1) URL params take priority when present
    const urlParams = new URLSearchParams(routerLocation.search);
    const urlBookObj = resolveBook(urlParams.get('book'));
    const urlChapter = urlParams.get('chapter');
    const isFromSearch = urlParams.get('from') === 'search';
    const isFromDaily = urlParams.get('from') === 'daily';
    if (urlBookObj && urlChapter) {
      const chapterNum = parseInt(urlChapter, 10);
      const verseNum = urlParams.get('verse') ? parseInt(urlParams.get('verse'), 10) : null;
      // A verse range (verseEnd) may be carried in localStorage for filter mode.
      let verseEnd = null;
      try {
        const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (p.abbr === urlBookObj.abbr && p.chapter === chapterNum && p.verseEnd) verseEnd = p.verseEnd;
      } catch {}
      if (verseNum && verseEnd && verseEnd > verseNum) {
        const range = new Set();
        for (let v = verseNum; v <= verseEnd; v++) range.add(v);
        setSelectedVerses(range);
        setHighlightedVerses(range);
        setFilterMode(true);
      } else {
        setFilterMode(false);
        setSelectedVerses(new Set());
        setHighlightedVerses(new Set());
      }
      // Restore context based on navigation source
      if (isFromSearch) {
        const { term, index, results } = getSearchNav();
        if (term) {
          searchClearedRef.current = false;
          setSearchTerm(term);
          setSearchResultIndex(index);
          setSearchTotalResults(results.length);
        }
      } else {
        // Non-search URL navigation — clear any lingering search state
        searchClearedRef.current = true;
        clearSearchNav();
        setSearchTerm(null);
        setSearchResultIndex(0);
        setSearchTotalResults(0);
      }
      // Restore lastReadingPos from storage for daily/random navigations
      if (isFromDaily) {
        lastReadingClearedRef.current = false;
        try {
          const saved = localStorage.getItem('kjb-last-reading');
          if (saved) setLastReadingPos(JSON.parse(saved));
        } catch {}
      }
      setPos({ abbr: urlBookObj.abbr, chapter: chapterNum, verse: verseNum });
      setHighlightVerse(verseNum || null);
      loadChapter(urlBookObj.abbr, chapterNum, verseNum);
      return;
    }

    // 2) No URL params — reload from saved position (handles returning from Home with no URL params)
    try {
      const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (p && p.abbr && p.chapter) {
        const savedVerse = p.verse || null;
        setPos({ abbr: p.abbr, chapter: p.chapter, verse: savedVerse });
        if (savedVerse) setHighlightVerse(savedVerse);
        // Always reload — internal navigation (book/chapter picker) doesn't change
        // routerLocation.search so this effect never fires for those navigations.
        loadChapter(p.abbr, p.chapter, savedVerse);
      }
    } catch {}
    try {
      const saved = localStorage.getItem('kjb-last-reading');
      if (saved) setLastReadingPos(JSON.parse(saved));
    } catch {}

    // 3) Honour an explicit navigate event (dispatched by SearchPage/HomePage after writing kjb-position)
    const applyRequestedPosition = () => {
      let p;
      try { p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return; }
      if (!p || !resolveBook(p.abbr)) return;
      if (p.verse && p.verseEnd && p.verseEnd > p.verse) {
        const range = new Set();
        for (let v = p.verse; v <= p.verseEnd; v++) range.add(v);
        setSelectedVerses(range);
        setHighlightedVerses(range);
        setFilterMode(true);
      } else {
        setFilterMode(false);
        setSelectedVerses(new Set());
        setHighlightedVerses(new Set());
      }
      setPos({ abbr: p.abbr, chapter: p.chapter, verse: p.verse || null });
      setHighlightVerse(p.verse || null);
      loadChapter(p.abbr, p.chapter, p.verse || null);
    };
    window.addEventListener('kjb-navigate', applyRequestedPosition);
    return () => window.removeEventListener('kjb-navigate', applyRequestedPosition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerLocation.search, loadChapter]);

  // Scroll to verse when highlight is set; otherwise restore last scroll
  // position for this chapter (so switching pages and back resumes reading).
  useEffect(() => {
    if (loading) return;
    if (highlightVerse) {
      // Align the verse start just below the sticky app header + reader toolbar
      // (not hidden underneath, not mid-verse). Retry once after layout settles.
      const scrollToVerse = () => {
        const el = document.getElementById(`v${highlightVerse}`);
        if (!el) return;
        const scroller = document.getElementById('kjb-scroll');
        const toolbarH = topRef.current ? topRef.current.getBoundingClientRect().height : 0;
        const stickyOffset = toolbarH + 12;
        if (scroller) {
          const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - stickyOffset;
          scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        } else {
          const top = el.getBoundingClientRect().top + window.scrollY - stickyOffset;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        }
      };
      const t1 = setTimeout(scrollToVerse, 200);
      const t2 = setTimeout(scrollToVerse, 600);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    // Fresh navigation (book/chapter picker, prev/next, etc.) — always start at the
    // top and do NOT restore a previously-saved scroll offset for this chapter.
    if (freshNavRef.current) {
      freshNavRef.current = false;
      (document.getElementById('kjb-scroll') || window).scrollTo({ top: 0 });
      return;
    }
    // No highlight: restore saved scroll offset for this chapter
    const timer = setTimeout(() => {
      try {
        const key = `kjb-scroll-${pos.abbr}-${pos.chapter}`;
        const saved = parseInt(sessionStorage.getItem(key) || '0', 10);
        if (saved > 0) (document.getElementById('kjb-scroll') || window).scrollTo({ top: saved });
      } catch {}
    }, 80);
    return () => clearTimeout(timer);
  }, [verses, loading, highlightVerse, pos.abbr, pos.chapter]);

  // Continuously save scroll position for the current chapter
  useEffect(() => {
    if (loading || isViewingTitlePage) return;
    const key = `kjb-scroll-${pos.abbr}-${pos.chapter}`;
    const scroller = document.getElementById('kjb-scroll');
    const target = scroller || window;
    const getY = () => (scroller ? scroller.scrollTop : window.scrollY);
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        try { sessionStorage.setItem(key, String(Math.round(getY()))); } catch {}
      });
    };
    target.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      target.removeEventListener('scroll', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [loading, isViewingTitlePage, pos.abbr, pos.chapter]);

  // Keep zoom + font in sync if changed elsewhere (e.g. Settings) after reload
  useEffect(() => {
    const sync = () => {
      try { setZoomLevel(parseInt(localStorage.getItem('kjb-zoom') || '100')); } catch {}
      try { setFontFamily(localStorage.getItem('kjb-reader-font-family') || 'serif'); } catch {}
      try { setA11yFont(getAccessibilityFont()); } catch {}
    };
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
    };
  }, []);

  // Refresh search navigation context when returning from another page (e.g. SearchPage)
  useEffect(() => {
    const refreshContext = () => {
      try {
        const { term, index, results } = getSearchNav();
        // If user intentionally cleared search, don't restore it on focus
        if (searchClearedRef.current && !term) return;
        // If there's a new term in storage (user did a fresh search), reset the cleared flag
        if (term) searchClearedRef.current = false;
        setSearchTerm(term || null);
        setSearchResultIndex(index);
        setSearchTotalResults(results.length);
        // Don't restore a daily/random indicator the user already cleared/navigated away from
        if (lastReadingClearedRef.current) {
          setLastReadingPos(null);
          return;
        }
        const lastReading = localStorage.getItem('kjb-last-reading');
        setLastReadingPos(lastReading ? JSON.parse(lastReading) : null);
      } catch {}
    };
    window.addEventListener('focus', refreshContext);
    return () => {
      window.removeEventListener('focus', refreshContext);
    };
  }, []);



  // Reset verse status when exiting filter mode or clearing selection
  useEffect(() => {
    if (!filterMode && selectedVerses.size === 0) {
      try {
        const current = JSON.parse(localStorage.getItem('kjb-position') || '{}');
        if (current.verse || current.verseEnd) {
          localStorage.setItem('kjb-position', JSON.stringify({ ...current, verse: null, verseEnd: null }));
        }
      } catch {}
      setHighlightedVerses(new Set());
    }
  }, [filterMode, selectedVerses]);

  const navigate = (newAbbr, newChapter, jumpVerse = null, fromDailyVerse = false, fromRandom = false) => {
    // Prevent chapter 0 for non-GEN/MAT books
    if (newChapter === 0 && newAbbr !== 'GEN' && newAbbr !== 'MAT') {
      return;
    }
    // Always clear search context on any manual navigation
    searchClearedRef.current = true;
    clearSearchNav();
    setSearchTerm(null);
    setSearchResultIndex(0);
    setSearchTotalResults(0);
    // Save last reading position before navigating FROM daily verse or random chapter
    if ((fromDailyVerse || fromRandom) && pos.abbr && pos.chapter) {
      lastReadingClearedRef.current = false;
      const lastPos = { abbr: pos.abbr, chapter: pos.chapter, fromDailyVerse, fromRandom };
      try { localStorage.setItem('kjb-last-reading', JSON.stringify(lastPos)); } catch {}
      setLastReadingPos(lastPos);
    } else {
      // Manual navigation (book/chapter/verse picker, prev/next) — clear any stale
      // daily/random "last reading" context so the indicator doesn't keep showing it.
      lastReadingClearedRef.current = true;
      try { localStorage.removeItem('kjb-last-reading'); } catch {}
      setLastReadingPos(null);
      // Also strip any stale ?from=daily / ?from=search etc. from the URL so the
      // route effect (and focus handlers) can't restore the daily indicator.
      // Use routerNavigate so React Router's location updates too (replaceState alone
      // leaves routerLocation.search stale, letting the route effect re-apply daily).
      if (routerLocation.search) {
        try { routerNavigate('/read', { replace: true }); } catch {}
      }
    }
    // Clear highlights when navigating without a specific verse
    if (!jumpVerse) {
      setHighlightVerse(null);
    }
    // Mark this as a fresh navigation so the reader starts at the top of the
    // new chapter (skips scroll restoration).
    freshNavRef.current = true;
    const newPos = { abbr: newAbbr, chapter: newChapter, verse: jumpVerse };
    setPos(newPos);
    loadChapter(newAbbr, newChapter, jumpVerse);
  };

  const clearSearchContext = () => {
    searchClearedRef.current = true;
    clearSearchNav();
    setSearchTerm(null);
    setSearchResultIndex(0);
    setSearchTotalResults(0);
    setHighlightVerse(null);
  };

  const goNext = () => {
    if (pos.chapter < book.chapters) {
      navigate(pos.abbr, pos.chapter + 1);
    } else {
      const next = getNextBook(pos.abbr);
      if (next) {
        navigate(next.abbr, 1);
      }
    }
  };



  const goPrev = () => {
    if (pos.chapter > 1) {
      navigate(pos.abbr, pos.chapter - 1);
    } else if (pos.chapter === 1 && (pos.abbr === 'GEN' || pos.abbr === 'MAT')) {
      // For GEN/MAT, allow going to chapter 0 (title page)
      navigate(pos.abbr, 0);
    } else {
      // Go to previous book's last chapter
      const prev = getPrevBook(pos.abbr);
      if (prev) navigate(prev.abbr, prev.chapters);
    }
  };

  // The daily/random "last reading" indicator should only show while the user is
  // actually viewing that exact chapter. Once they navigate elsewhere (or after a
  // refresh that lands on a different chapter), it must not persist.
  const lastReadingActive = !!(
    lastReadingPos &&
    !lastReadingPos.cleared &&
    lastReadingPos.abbr === pos.abbr &&
    lastReadingPos.chapter === pos.chapter
  );

  const isLastChapterLastBook = pos.abbr === 'REV' && pos.chapter === 22;
  const isFirstChapterFirstBook = pos.abbr === 'GEN' && pos.chapter === 0;
  const isGenesisChapterOne = pos.abbr === 'GEN' && pos.chapter === 1;

  // Force reload Bible data (for debugging colophons and italics)
  const handleForceReload = async () => {
    setLoading(true);
    try {
      console.log('[BibleReader] Forcing Bible cache reload...');
      const freshData = await forceReloadBibleData();
      console.log('[BibleReader] Fresh data loaded - checking for brackets...');
      const sampleBook = freshData['1 John'];
      if (sampleBook && sampleBook[2]) {
        const verse23 = sampleBook[2].find(v => v.verse === 23);
        if (verse23) {
          console.log('[BibleReader] 1 John 2:23 has brackets?', verse23.text.includes('['));
          console.log('[BibleReader] 1 John 2:23 text:', verse23.text.substring(0, 300));
        }
      }
      window.location.reload();
    } catch (err) {
      console.error('Force reload failed:', err);
      setError('Failed to reload. Please try again.');
      setLoading(false);
    }
  };

  // Auto-track reading when chapter loads
  useEffect(() => {
    const autoTrackReading = async () => {
      if (loading || isViewingTitlePage || !verses.length) return;
      
      try {
        // Check if this matches today's assigned reading
        const today = new Date().toISOString().split('T')[0];
        const todayProgress = await base44.entities.ReadingProgress.filter({ date: today });
        
        if (todayProgress.length > 0) {
          const todayReading = todayProgress[0];
          // If user is viewing today's assigned chapter and it's not completed, mark it
          if (todayReading.book === book.name && todayReading.chapter === pos.chapter && !todayReading.completed) {
            await base44.entities.ReadingProgress.update(todayReading.id, {
              completed: true,
            });
            
            // Schedule next chapter for tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            
            const tomorrowExisting = await base44.entities.ReadingProgress.filter({ date: tomorrowStr });
            if (tomorrowExisting.length === 0) {
              // Get next chapter (handle book transitions)
              let nextBook = book.name;
              let nextChapter = pos.chapter + 1;
              
              if (nextChapter > book.chapters) {
                const nextBookData = getNextBook(pos.abbr);
                if (nextBookData) {
                  nextBook = nextBookData.name;
                  nextChapter = 1;
                }
              }
              
              await base44.entities.ReadingProgress.create({
                date: tomorrowStr,
                book: nextBook,
                chapter: nextChapter,
                completed: false,
              });
            }
          }
        }
      } catch (error) {
        console.error('Auto-track error:', error);
      }
    };

    const timer = setTimeout(autoTrackReading, 2000); // Wait 2 seconds after load
    return () => clearTimeout(timer);
  }, [verses, loading, book.name, pos.chapter, isViewingTitlePage]);

  return (
    <div className={`w-full px-5 sm:px-12 lg:px-16 py-3 ${hideHeader ? 'pt-16' : ''}`}>

      {/* Sticky nav bar — hidden when hideHeader is on */}
      {!hideHeader && (
        <div ref={topRef} className="sticky top-0 z-[100] border-b border-border pb-2 pt-2 mb-2 relative shadow-sm before:content-[''] before:absolute before:bottom-full before:-left-5 before:-right-5 sm:before:-left-12 sm:before:-right-12 lg:before:-left-16 lg:before:-right-16 before:h-12 before:bg-background" style={{ backgroundColor: 'hsl(var(--background))' }}>
          <div className="flex flex-wrap items-center justify-start gap-1.5 w-full">

            {/* Book selector */}
            <button
              onClick={() => { setShowBookPicker(p => !p); setShowChapterPicker(false); setShowVersePicker(false); }}
              onTouchEnd={(e) => { e.preventDefault(); setShowBookPicker(p => !p); setShowChapterPicker(false); setShowVersePicker(false); }}
              className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11"
            >
              <span className="truncate text-center" style={{ maxWidth: `${120 * zoomLevel / 100}px`, fontSize: `${Math.max(0.7, Math.min(1, 100 / zoomLevel)) * 1}em` }}>{isViewingTitlePage ? 'Title Page' : book.shortName}</span>
              <ChevronRight className={`w-3 h-3 opacity-70 transition-transform duration-200 flex-shrink-0 ${showBookPicker ? 'rotate-90' : ''}`} />
            </button>





            {/* Desktop popover */}
            {showBookPicker && !isMobile() && (
              <div className="absolute top-full left-0 mt-1 z-50">
                <BookSelector
                  currentAbbr={pos.abbr}
                  onSelect={(b, isTitlePage, showChapter) => {
                    if (isTitlePage) {
                      navigate(b.abbr, 0);
                      setShowBookPicker(false);
                    } else if (showChapter) {
                      navigate(b.abbr, 1);
                      setShowBookPicker(false);
                      setShowChapterPicker(true);
                    }
                  }}
                  onClose={() => setShowBookPicker(false)}
                />
              </div>
            )}
            {/* Mobile bottom sheet */}
            <SelectorSheet open={showBookPicker && isMobile()} onClose={() => setShowBookPicker(false)} title="Select Book">
              <BookSelector
                currentAbbr={pos.abbr}
                onSelect={(b, isTitlePage, showChapter) => {
                  if (isTitlePage) {
                    navigate(b.abbr, 0);
                    setShowBookPicker(false);
                  } else if (showChapter) {
                    navigate(b.abbr, 1);
                    setShowBookPicker(false);
                    setShowChapterPicker(true);
                  }
                }}
                onClose={() => setShowBookPicker(false)}
              />
            </SelectorSheet>

            {!isViewingTitlePage && (
              <>
              {/* Chapter selector */}
              <button
                onClick={() => { setShowChapterPicker(p => !p); setShowBookPicker(false); setShowVersePicker(false); }}
                onTouchEnd={(e) => { e.preventDefault(); setShowChapterPicker(p => !p); setShowBookPicker(false); setShowVersePicker(false); }}
                className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11"
              >
                <span>Ch.{pos.chapter}</span>
                <ChevronRight className={`w-3 h-3 opacity-70 transition-transform duration-200 flex-shrink-0 ${showChapterPicker ? 'rotate-90' : ''}`} />
              </button>
              {showChapterPicker && !isMobile() && (
                <div className="absolute top-full left-0 mt-1 z-50">
                  <ChapterSelector
                    totalChapters={book.chapters}
                    currentChapter={pos.chapter}
                    onSelect={(ch, showVerse) => {
                      navigate(pos.abbr, ch);
                      setShowChapterPicker(false);
                      if (showVerse) setShowVersePicker(true);
                    }}
                    onClose={() => setShowChapterPicker(false)}
                  />
                </div>
              )}
              <SelectorSheet open={showChapterPicker && isMobile()} onClose={() => setShowChapterPicker(false)} title={`${book.shortName} — Select Chapter`}>
                <ChapterSelector
                  totalChapters={book.chapters}
                  currentChapter={pos.chapter}
                  onSelect={(ch, showVerse) => {
                    navigate(pos.abbr, ch);
                    setShowChapterPicker(false);
                    if (showVerse) setShowVersePicker(true);
                  }}
                  onClose={() => setShowChapterPicker(false)}
                />
              </SelectorSheet>

              {/* Verse selector */}
              <button
                onClick={() => { setShowVersePicker(p => !p); setShowBookPicker(false); setShowChapterPicker(false); }}
                onTouchEnd={(e) => { e.preventDefault(); setShowVersePicker(p => !p); setShowBookPicker(false); setShowChapterPicker(false); }}
                className={`flex items-center justify-center gap-1.5 px-3 rounded-lg font-sans text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 ${
                  selectMode
                    ? 'bg-primary text-primary-foreground'
                    : filterMode && selectedVerses.size > 0
                    ? 'bg-accent/20 text-accent'
                    : highlightVerse
                    ? 'bg-accent/20 text-accent'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                }`}
                disabled={verseCount === 0}
              >
                <span className="truncate" style={{ maxWidth: `${80 * zoomLevel / 100}px`, fontSize: `${zoomLevel / 100}em` }}>
                  {selectMode
                    ? `${selectedVerses.size > 0 ? selectedVerses.size : '0'} selected`
                    : filterMode && selectedVerses.size > 0
                    ? `vv.${formatVerseRange([...selectedVerses])}`
                    : highlightVerse
                    ? `v.${highlightVerse}`
                    : 'Verse'}
                </span>
                {selectMode ? (
                  <CheckSquare className="w-3.5 h-3.5 opacity-70 flex-shrink-0 transition-transform duration-200" />
                ) : (
                  <ChevronRight className={`w-3 h-3 opacity-70 transition-transform duration-200 flex-shrink-0 ${showVersePicker ? 'rotate-90' : ''}`} />
                )}
              </button>
              {showVersePicker && verseCount > 0 && !isMobile() && (
                <div className="absolute top-full left-0 mt-1 z-50">
                  <VerseSelector
                    totalVerses={verseCount}
                    currentVerse={highlightVerse}
                    multiSelect={true}
                    onSelect={(v) => {
                      const first = Array.isArray(v) ? v[0] : v;
                      if (Array.isArray(v) && v.length > 1) {
                        const range = new Set(v);
                        setSelectedVerses(range);
                        setHighlightedVerses(range);
                        setSelectMode(false);
                        setFilterMode(true);
                      }
                      navigate(pos.abbr, pos.chapter, first);
                      setShowVersePicker(false);
                    }}
                    onClose={() => setShowVersePicker(false)}
                  />
                </div>
              )}
              <SelectorSheet open={showVersePicker && verseCount > 0 && isMobile()} onClose={() => setShowVersePicker(false)} title={`${book.shortName} ${pos.chapter} — Select Verse`}>
                <VerseSelector
                  totalVerses={verseCount}
                  currentVerse={highlightVerse}
                  multiSelect={false}
                  onSelect={(v) => {
                    const first = Array.isArray(v) ? v[0] : v;
                    if (Array.isArray(v) && v.length > 1) {
                      const range = new Set(v);
                      setSelectedVerses(range);
                      setHighlightedVerses(range);
                      setSelectMode(false);
                      setFilterMode(true);
                    }
                    navigate(pos.abbr, pos.chapter, first);
                    setShowVersePicker(false);
                  }}
                  onClose={() => setShowVersePicker(false)}
                />
              </SelectorSheet>

              {/* Zoom control */}
              <button
                onClick={() => { setShowZoomPopover(p => !p); }}
                onTouchEnd={(e) => { e.preventDefault(); setShowZoomPopover(p => !p); }}
                title={`Zoom: ${zoomLevel}%`}
                className="flex flex-1 items-center justify-center gap-1 px-3 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 whitespace-nowrap"
              >
                <ZoomIn className="w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0" />
                <span className="truncate" style={{ fontSize: `${zoomLevel / 100}em` }}>{zoomLevel}%</span>
              </button>
              {/* Desktop popover */}
              {showZoomPopover && !isMobile() && (
                <div className="absolute top-full left-0 mt-1 z-50">
                  <div className="bg-card border border-border rounded-xl shadow-xl p-4 w-64">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-sans text-xs font-medium text-foreground">Text Size</span>
                      <span className="font-sans text-xs font-semibold text-primary">{zoomLevel}%</span>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <button
                        onClick={() => adjustZoom(-5)}
                        className="p-1.5 rounded-lg bg-secondary hover:bg-accent/20 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <input
                        type="range"
                        min="75"
                        max="150"
                        step="5"
                        value={zoomLevel}
                        onChange={handleZoomChange}
                        className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <button
                        onClick={() => adjustZoom(5)}
                        className="p-1.5 rounded-lg bg-secondary hover:bg-accent/20 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    {zoomLevel !== 100 && (
                      <button
                        onClick={() => {
                          setZoomLevel(100);
                          try { localStorage.setItem('kjb-zoom', '100'); } catch {}
                        }}
                        className="w-full mt-2 px-2 py-1.5 rounded-lg bg-primary/10 text-primary font-sans text-xs font-medium hover:bg-primary/20 transition-colors"
                      >
                        Reset to 100%
                      </button>
                    )}
                  </div>
                </div>
              )}
              {/* Mobile bottom sheet */}
              <SelectorSheet open={showZoomPopover && isMobile()} onClose={() => setShowZoomPopover(false)} title="Text Size">
                <div className="space-y-4 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-sm font-medium text-foreground">Zoom Level</span>
                    <span className="font-sans text-sm font-semibold text-primary">{zoomLevel}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => adjustZoom(-5)}
                      className="p-2 rounded-lg bg-secondary hover:bg-accent/20 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      type="range"
                      min="75"
                      max="150"
                      step="5"
                      value={zoomLevel}
                      onChange={handleZoomChange}
                      className="flex-1 h-3 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                    <button
                      onClick={() => adjustZoom(5)}
                      className="p-2 rounded-lg bg-secondary hover:bg-accent/20 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {zoomLevel !== 100 && (
                    <button
                      onClick={() => {
                        setZoomLevel(100);
                        try { localStorage.setItem('kjb-zoom', '100'); } catch {}
                      }}
                      className="w-full px-4 py-3 rounded-lg bg-primary/10 text-primary font-sans text-sm font-medium hover:bg-primary/20 transition-colors"
                    >
                      Reset to 100%
                    </button>
                  )}
                </div>
              </SelectorSheet>

              {/* Font family toggle */}
              <button
                onClick={() => { setShowFontPopover(p => !p); }}
                onTouchEnd={(e) => { e.preventDefault(); setShowFontPopover(p => !p); }}
                title="Font family"
                className="flex flex-1 items-center justify-center gap-1 px-3 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 whitespace-nowrap"
              >
                <Type className="w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0" />
                <span className="hidden sm:inline" style={{ fontSize: `${zoomLevel / 100}em` }}>{fontFamily === 'serif' ? 'Serif' : fontFamily === 'sans-serif' ? 'Sans' : fontFamily === 'monospace' ? 'Mono' : fontFamily === 'dyslexic' ? 'Dyslexic' : fontFamily === 'hyperlegible' ? 'Legible' : 'Cursive'}</span>
              </button>
              {/* Desktop popover */}
              {showFontPopover && !isMobile() && (
                <div className="absolute top-full left-0 mt-1 z-50">
                  <div className="bg-card border border-border rounded-xl shadow-xl p-4 w-64">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-sans text-xs font-medium text-foreground">Font Family</span>
                    </div>
                    {a11yActive ? (
                      <>
                        <p className="font-sans text-[11px] text-muted-foreground mb-2 leading-snug">
                          Accessibility font is on — it overrides reading fonts. Disable it to choose a font.
                        </p>
                        <button
                          onClick={() => { setShowFontPopover(false); routerNavigate('/settings'); }}
                          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 transition-opacity"
                        >
                          <Accessibility className="w-3.5 h-3.5" />
                          Accessibility Settings
                        </button>
                      </>
                    ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'serif', label: 'Serif' },
                        { value: 'sans-serif', label: 'Sans' },
                        { value: 'monospace', label: 'Mono' },
                        { value: 'cursive', label: 'Cursive' },
                        { value: 'dyslexic', label: 'Dyslexic' },
                        { value: 'hyperlegible', label: 'Legible' },
                      ].map(font => (
                        <button
                          key={font.value}
                          onClick={() => { handleFontChange(font.value); setShowFontPopover(false); }}
                          className={`px-3 py-2 rounded-lg font-sans text-xs font-medium transition-all ${
                            fontFamily === font.value
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                          }`}
                          style={{ fontFamily: getFontFamilyValue(font.value) }}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                    )}
                  </div>
                </div>
              )}
              {/* Mobile bottom sheet */}
              <SelectorSheet open={showFontPopover && isMobile()} onClose={() => setShowFontPopover(false)} title="Font Family">
                {a11yActive ? (
                  <div className="p-2 space-y-3">
                    <p className="font-sans text-xs text-muted-foreground leading-snug">
                      Accessibility font is on — it overrides reading fonts. Disable it to choose a font.
                    </p>
                    <button
                      onClick={() => { setShowFontPopover(false); routerNavigate('/settings'); }}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
                    >
                      <Accessibility className="w-4 h-4" />
                      Accessibility Settings
                    </button>
                  </div>
                ) : (
                <div className="space-y-2 p-2">
                  {[
                    { value: 'serif', label: 'Serif' },
                    { value: 'sans-serif', label: 'Sans' },
                    { value: 'monospace', label: 'Mono' },
                    { value: 'cursive', label: 'Cursive' },
                    { value: 'dyslexic', label: 'Dyslexic' },
                    { value: 'hyperlegible', label: 'Legible' },
                  ].map(font => (
                    <button
                      key={font.value}
                      onClick={() => { handleFontChange(font.value); setShowFontPopover(false); }}
                      className={`w-full px-4 py-3 rounded-lg font-sans text-sm font-medium transition-all ${
                        fontFamily === font.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                      }`}
                      style={{ fontFamily: getFontFamilyValue(font.value) }}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
                )}
              </SelectorSheet>

              {/* Flow toggle (Line ↔ Paragraph) */}
              <button
                onClick={toggleFlow}
                onTouchEnd={(e) => { e.preventDefault(); toggleFlow(); }}
                title={flowMode === 'line' ? 'Switch to paragraph' : 'Switch to line-by-line'}
                className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap"
              >
                {flowMode === 'line' ? <List className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /> : <AlignJustify className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />}
                <span className="hidden lg:inline">{flowMode === 'line' ? 'Lines' : 'Para'}</span>
              </button>
              {/* Column toggle (Single ↔ Two-Column) */}
              <button
                onClick={toggleColumn}
                onTouchEnd={(e) => { e.preventDefault(); toggleColumn(); }}
                title={columnOn ? 'Switch to single column' : 'Switch to two-column'}
                className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap"
              >
                {columnOn ? <Columns2 className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /> : <AlignLeft className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />}
                <span className="hidden lg:inline">{columnOn ? '2-Col' : '1-Col'}</span>
              </button>
              {/* Select mode toggle */}
              <button
                onClick={toggleSelectMode}
                onTouchEnd={(e) => { e.preventDefault(); toggleSelectMode(); }}
                title="Select verses"
                className={`flex items-center justify-center gap-1.5 px-3 rounded-lg font-sans text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap ${selectMode ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'}`}
              >
                <CheckSquare className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
                <span className="hidden lg:inline">Select</span>
              </button>
              {/* Share chapter / selected verses */}
              <button
                onClick={handleShareChapter}
                onTouchEnd={(e) => { e.preventDefault(); handleShareChapter(); }}
                title={shareFeedback ? 'Link copied!' : 'Share this chapter'}
                className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap"
              >
                <Share2 className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
                <span className="hidden lg:inline">{shareFeedback ? 'Copied!' : 'Share'}</span>
              </button>

              {/* Prev */}
              <button
                onClick={goPrev}
                onTouchEnd={(e) => { e.preventDefault(); goPrev(); }}
                disabled={isFirstChapterFirstBook}
                className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary hover:bg-accent/20 text-foreground disabled:opacity-30 transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:active:scale-100 touch-manipulation h-11 whitespace-nowrap"
              >
                <ChevronLeft className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
                <span className="hidden lg:inline">Prev</span>
              </button>
              {/* Next */}
              <button
                onClick={goNext}
                onTouchEnd={(e) => { e.preventDefault(); goNext(); }}
                disabled={isLastChapterLastBook}
                className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary hover:bg-accent/20 text-foreground disabled:opacity-30 transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:active:scale-100 touch-manipulation h-11 whitespace-nowrap"
              >
                <span className="hidden lg:inline">Next</span>
                <ChevronRight className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
              </button>
              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                onTouchEnd={(e) => { e.preventDefault(); toggleFullscreen(); }}
                title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 whitespace-nowrap"
              >
                {fullscreen ? <Minimize2 className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /> : <Maximize2 className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />}
                <span className="hidden lg:inline">{fullscreen ? 'Exit' : 'Full Screen'}</span>
              </button>

              {/* Currently reading indicator - integrated into toolbar */}
              {(highlightVerse || (filterMode && selectedVerses.size > 0) || lastReadingActive || searchTerm) && (
                <CurrentlyReadingIndicator
                  highlightVerse={highlightVerse}
                  filterMode={filterMode}
                  selectedVerses={selectedVerses}
                  lastReadingPos={lastReadingActive ? lastReadingPos : null}
                  book={book}
                  pos={pos}
                  searchTerm={searchTerm}
                  currentResultIndex={searchResultIndex}
                  totalResults={searchTotalResults}
                  onPrevResult={() => {
                    const { results, index } = getSearchNav();
                    const prevIndex = index - 1;
                    if (prevIndex >= 0 && results[prevIndex]) {
                      const r = results[prevIndex];
                      setSearchIndex(prevIndex);
                      setSearchResultIndex(prevIndex);
                      setPos({ abbr: r.abbr, chapter: r.chapter, verse: r.verse || null });
                      setHighlightVerse(r.verse || null);
                      loadChapter(r.abbr, r.chapter, r.verse || null);
                    }
                  }}
                  onNextResult={() => {
                    const { results, index } = getSearchNav();
                    const nextIndex = index + 1;
                    if (nextIndex < results.length && results[nextIndex]) {
                      const r = results[nextIndex];
                      setSearchIndex(nextIndex);
                      setSearchResultIndex(nextIndex);
                      setPos({ abbr: r.abbr, chapter: r.chapter, verse: r.verse || null });
                      setHighlightVerse(r.verse || null);
                      loadChapter(r.abbr, r.chapter, r.verse || null);
                    }
                  }}
                  onClear={() => {
                    if (searchTerm) {
                      clearSearchContext();
                    } else if (lastReadingPos && lastReadingPos.abbr && lastReadingPos.chapter && !lastReadingPos.cleared) {
                      const { abbr, chapter } = lastReadingPos;
                      lastReadingClearedRef.current = true;
                      setFilterMode(false);
                      setSelectMode(false);
                      setSelectedVerses(new Set());
                      setHighlightVerse(null);
                      setShowFilterOverlay(false);
                      setLastReadingPos(null);
                      try { localStorage.removeItem('kjb-last-reading'); } catch {}
                      navigate(abbr, chapter);
                    } else if (filterMode && selectedVerses.size > 0) {
                      setFilterMode(false);
                      setSelectMode(false);
                      setSelectedVerses(new Set());
                      setHighlightVerse(null);
                      setShowFilterOverlay(false);
                    } else {
                      setHighlightVerse(null);
                      setFilterMode(false);
                      setSelectedVerses(new Set());
                      setShowFilterOverlay(false);
                    }
                  }}
                />
              )}
                  {/* Hide header */}
              <button
                onClick={(e) => { e.stopPropagation(); setHideHeader(!hideHeader); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setHideHeader(!hideHeader); }}
                title={hideHeader ? "Show header" : "Hide header"}
                className="flex items-center justify-center px-2.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap flex-shrink-0"
              >
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ${hideHeader ? '' : 'rotate-180'}`} />
              </button>
            </>
            )}

            {/* Title page navigation — prev/next/fullscreen always available */}
            {isViewingTitlePage && (
              <>
                <button
                  onClick={goPrev}
                  onTouchEnd={(e) => { e.preventDefault(); goPrev(); }}
                  disabled={isFirstChapterFirstBook}
                  title="Previous"
                  className="flex flex-1 items-center justify-center gap-1.5 px-2.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground disabled:opacity-30 transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100 touch-manipulation h-11 min-w-[44px]"
                >
                  <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden lg:inline">Prev</span>
                </button>
                <button
                  onClick={goNext}
                  onTouchEnd={(e) => { e.preventDefault(); goNext(); }}
                  title="Next"
                  className="flex flex-1 items-center justify-center gap-1.5 px-2.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px]"
                >
                  <span className="hidden lg:inline">Next</span>
                  <ChevronRight className="w-5 h-5 flex-shrink-0" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  onTouchEnd={(e) => { e.preventDefault(); toggleFullscreen(); }}
                  title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  className="flex flex-1 items-center justify-center gap-1.5 px-2.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px]"
                >
                  {fullscreen ? <Minimize2 className="w-5 h-5 flex-shrink-0" /> : <Maximize2 className="w-5 h-5 flex-shrink-0" />}
                  <span className="hidden lg:inline">{fullscreen ? 'Exit' : 'Full'}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setHideHeader(!hideHeader); }}
                  onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setHideHeader(!hideHeader); }}
                  title={hideHeader ? "Show header" : "Hide header"}
                  className="flex items-center justify-center px-2.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] flex-shrink-0"
                >
                  <ChevronDown className={`w-5 h-5 flex-shrink-0 ${hideHeader ? '' : 'rotate-180'}`} />
                </button>
              </>
            )}
          </div>
        </div>
      )}



      {/* Show header chevron when hidden — portaled to body so it stays truly
          fixed to the viewport (escapes the animated page wrapper) while text scrolls */}
      {hideHeader && createPortal(
        <div className="fixed top-0 left-0 right-0 border-b border-border bg-background/95 backdrop-blur z-[110]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="w-full px-5 sm:px-12 lg:px-16 py-1.5 flex items-center justify-end">
            <div className="flex items-center gap-1">
              <button
                onClick={toggleFullscreen}
                title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                className="p-2 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation flex items-center justify-center"
              >
                {fullscreen ? <Minimize2 className="w-4 h-4 transition-transform duration-200" /> : <Maximize2 className="w-4 h-4 transition-transform duration-200" />}
              </button>
              <button
                onClick={() => setHideHeader(false)}
                className="p-2 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation flex items-center justify-center"
                title="Show header"
              >
                <ChevronDown className="w-4 h-4 rotate-180 transition-transform duration-200" />
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Click/tap outside to close desktop dropdowns and mobile sheets */}
      {(showBookPicker || showChapterPicker || showVersePicker || showZoomPopover || showFontPopover) && (
        <div
          className="fixed inset-0 z-[35]"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowBookPicker(false); 
            setShowChapterPicker(false); 
            setShowVersePicker(false); 
            setShowZoomPopover(false); 
            setShowFontPopover(false); 
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowBookPicker(false); 
            setShowChapterPicker(false); 
            setShowVersePicker(false); 
            setShowZoomPopover(false); 
            setShowFontPopover(false); 
          }}
        />
      )}

      {/* Book title — hidden when showing title page or in two-column (uses running head), EXCEPT chapter 1 which always shows centered title */}
      {!isViewingTitlePage && (!columnMode || pos.chapter === 1) && (
        <div className="text-center mb-6 pt-8" style={{ fontSize: `${zoomLevel / 100}rem` }}>
          <h1 className={`${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'} text-3xl md:text-4xl font-bold text-foreground mb-2 leading-tight`} style={{ fontStyle: 'normal', fontWeight: '900' }}>{book.name}</h1>
          <p className={`font-sans text-muted-foreground tracking-widest uppercase mt-2 ${fontFamily === 'cursive' ? 'cursive-em-style' : ''}`} style={{ fontStyle: 'normal', fontSize: `${zoomLevel / 100 * 0.875}rem`, fontWeight: fontFamily === 'cursive' ? '400' : undefined }}>
            Chapter {pos.chapter}
          </p>
          {/* Subscript — centred below chapter name, fully italic, [bracketed] words roman within italic */}
          {SUBSCRIPTS[`${book.apiName}:${pos.chapter}`] && (
            <p
              className={`kjb-subscript text-sm text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed text-center ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'}`}
              style={{ fontSize: `${zoomLevel / 100}rem` }}
              dangerouslySetInnerHTML={{ __html: renderSubscriptText(SUBSCRIPTS[`${book.apiName}:${pos.chapter}`]) }}
            />
          )}
        </div>
      )}





      {/* Title pages or verses */}
      <div 
        className={`leading-loose text-foreground/90 ${fontFamily === 'cursive' ? 'cursive-em-style' : ''}`}
        style={{ 
          fontSize: `${zoomLevel / 100 * 1.125}rem`, 
          lineHeight: zoomLevel > 100 ? '1.8' : '1.6',
          ...(fontFamily !== 'cursive' ? { fontFamily: getFontFamilyValue(fontFamily) } : {})
        }}
      >
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}
        {error && (
          <div className="text-center py-16 text-destructive font-sans">{error}</div>
        )}
        {!loading && !error && isViewingTitlePage && (
          <div style={{ fontFamily: "'Merriweather', 'Cormorant Garamond', Georgia, serif" }} className="[&_*]:!font-serif">
            <TitlePage type={pos.abbr === 'GEN' ? 'testament-old' : 'testament-new'} />
          </div>
        )}
        {/* Print-style running head — book name left, chapter right (column mode, non-title pages, chapters 2+) */}
        {!loading && !error && verses.length > 0 && columnMode && !isViewingTitlePage && pos.chapter !== 1 && (
          <RunningHead bookName={book.name} chapter={pos.chapter} baseFontRem={zoomLevel / 100 * 0.7} isCursive={fontFamily === 'cursive'} />
        )}
        {!loading && !error && verses.length > 0 && (
          <div
            className={`${columnMode ? 'kjb-two-col text-justify hyphens-auto' : 'text-left'} ${paragraphMode ? 'text-justify hyphens-auto px-2 sm:px-4' : ''}`}
            style={columnMode ? {
              fontSize: 'inherit',
              columnCount: 2,
              columnGap: '1.5rem',
              columnRule: '1px solid hsl(var(--border))',
            } : { fontSize: 'inherit' }}
          >
            {/* Subscript (Psalm superscription) — centred, fully italic, [bracketed] words roman */}
            {columnMode && !isViewingTitlePage && SUBSCRIPTS[`${book.apiName}:${pos.chapter}`] && (
              <p
                className={`kjb-subscript text-center text-muted-foreground mb-4 leading-relaxed ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'}`}
                style={{ fontSize: `${zoomLevel / 100}rem`, breakInside: 'avoid' }}
                dangerouslySetInnerHTML={{ __html: renderSubscriptText(SUBSCRIPTS[`${book.apiName}:${pos.chapter}`]) }}
              />
            )}
            {verses
              .filter(v => !filterMode || selectedVerses.has(v.verse))
              .map((v, idx) => (
              <VerseText
                key={v.verse}
                verse={v}
                highlight={highlightVerse === v.verse || highlightedVerses.has(v.verse)}
                id={`v${v.verse}`}
                bookName={book.name}
                abbr={pos.abbr}
                chapter={pos.chapter}
                isFirstVerse={idx === 0}
                paragraphMode={paragraphMode}
                selectMode={selectMode}
                isSelected={selectedVerses.has(v.verse)}
                onSelect={toggleVerseSelect}
                totalVerses={verseCount}
                colophon={colophon}
                isCursive={fontFamily === 'cursive'}
                fontFamilyValue={getFontFamilyValue(fontFamily)}
                zoomLevel={zoomLevel}
                searchTerm={searchTerm && highlightVerse === v.verse ? searchTerm : null}
                />
                ))}
          </div>
        )}
        {/* Colophon - column mode: centered across both columns; non-column: footer with line on top */}
        {!loading && !error && colophon && (
          <div className={`${columnMode ? 'mt-6 mb-4' : 'mt-12 mb-4 border-t border-border pt-6'} text-center`}>
            <p
              className={`text-sm text-muted-foreground leading-relaxed ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'}`}
              style={{ 
                fontStyle: 'normal',
                fontSize: `${zoomLevel / 100}rem`,
                breakInside: 'avoid'
              }}
              dangerouslySetInnerHTML={{ __html: renderColophonText(colophon) }}
            />
          </div>
        )}
      </div>



      {/* End-of-section text footers */}
      {!loading && !error && pos.abbr === 'MAL' && pos.chapter === 4 && (
        <div className="text-center mt-12 mb-4">
          <p 
            className={`text-sm text-muted-foreground tracking-widest uppercase ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'}`}
            style={{ fontSize: `${zoomLevel / 100}rem`, fontStyle: 'normal' }}
          >
            The End of the Prophets
          </p>
        </div>
      )}
      {!loading && !error && pos.abbr === 'REV' && pos.chapter === 22 && (
        <div className="text-center mt-12 mb-4">
          <p 
            className={`text-sm text-muted-foreground tracking-widest uppercase ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'}`}
            style={{ fontSize: `${zoomLevel / 100}rem`, fontStyle: 'normal' }}
          >
            The End
          </p>
        </div>
      )}

      {/* Filter mode overlay - centered popup */}
      {showFilterOverlay && (
        <>
          <div className="fixed inset-0 z-[98] bg-background/60 backdrop-blur-sm" onClick={() => { setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set()); setShowFilterOverlay(false); }} />
          <div className="fixed inset-0 z-[99] flex items-center justify-center pointer-events-none">
            <div className="bg-card border border-border rounded-2xl shadow-2xl px-6 py-4 max-w-sm w-full mx-4 pointer-events-auto">
              <p className="font-serif text-sm font-semibold text-foreground mb-3">
                {selectedVerses.size > 0
                  ? `Reading ${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}`
                  : `Showing ${selectedVerses.size} selected verse${selectedVerses.size !== 1 ? 's' : ''}`}
              </p>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={handleCopySelected}
                  className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 transition-opacity"
                >
                  <Copy className="w-3.5 h-3.5 inline mr-1" /> {copyFeedback ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => { setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set()); setShowFilterOverlay(false); }}
                  className="flex-1 px-3 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
                >
                  <X className="w-3.5 h-3.5 inline mr-1" /> Close
                </button>
              </div>
              <button
                onClick={() => { setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set()); setShowFilterOverlay(false); }}
                className="w-full px-3 py-2 rounded-lg bg-accent/10 text-accent font-sans text-xs font-medium hover:bg-accent/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <AlignLeft className="w-3.5 h-3.5" /> Show Full Chapter
              </button>
            </div>
          </div>
        </>
      )}

      {/* Floating select action bar */}
      {selectMode && (
        <div className="fixed bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-2xl bg-card border border-border shadow-2xl max-w-[95vw] w-auto overflow-x-auto">
          <span className="font-sans text-xs text-muted-foreground font-medium">
            {selectedVerses.size === 0 ? '0' : selectedVerses.size}{selectedVerses.size === 0 ? '' : `/${verses.length}`} selected
          </span>
          <div className="w-px h-4 bg-border" />
          <button
            onClick={selectAllVerses}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
          >
            <CheckSquare className="w-3.5 h-3.5" /> All
          </button>
          <button
            onClick={toggleSelectMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          {selectedVerses.size > 0 && (
            <>
              <button
                onClick={handleCopySelected}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground font-sans text-xs font-medium transition-colors"
              >
                <Copy className="w-3.5 h-3.5" /> {copyFeedback ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleReadSelected}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <BookMarked className="w-3.5 h-3.5" /> Read Selected
              </button>
              <button
                onClick={() => { setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set()); setShowFilterOverlay(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 font-sans text-xs font-medium transition-colors"
              >
                <AlignLeft className="w-3.5 h-3.5" /> Show Full Chapter
              </button>
            </>
          )}
        </div>
      )}

      {/* Bottom nav */}
      {!loading && !error && (
        <div className="flex justify-between gap-2 mt-6 pt-6 border-t border-border pb-2 sm:mt-4 sm:pt-4">
          <button
            onClick={goPrev}
            disabled={isFirstChapterFirstBook}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 disabled:opacity-30 transition-colors min-h-[48px] touch-manipulation"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isFirstChapterFirstBook
                ? 'Beginning'
                : isGenesisChapterOne
                ? 'Title Page'
                : isViewingTitlePage
                ? `${getPrevBook(pos.abbr)?.shortName} ${getPrevBook(pos.abbr)?.chapters}`
                : pos.chapter > 1
                ? `Chapter ${pos.chapter - 1}`
                : (pos.abbr === 'GEN' || pos.abbr === 'MAT')
                ? `${book.shortName} Title Page`
                : `${getPrevBook(pos.abbr)?.shortName} ${getPrevBook(pos.abbr)?.chapters}`}
            </span>
          </button>

          <button
            onClick={goNext}
            disabled={isLastChapterLastBook}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 disabled:opacity-30 transition-colors min-h-[48px] touch-manipulation"
          >
            <span className="hidden sm:inline">
              {isViewingTitlePage
                ? `Chapter 1`
                : pos.chapter < book.chapters
                ? `Chapter ${pos.chapter + 1}`
                : `${getNextBook(pos.abbr)?.shortName} 1`}
            </span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}



    </div>
  );
}