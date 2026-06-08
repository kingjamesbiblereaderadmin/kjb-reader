import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Loader2, AlignJustify, AlignLeft, List, Columns2, Maximize2, Minimize2, ChevronDown, CheckSquare, Square, Copy, X, BookMarked, ZoomIn, Minus, Plus, Type, Share2, Printer } from 'lucide-react';
import { buildVerseUrl, formatVerseShare, cleanVerseText } from '@/lib/formatDailyVerse';
import { BIBLE_BOOKS, getNextBook, getPrevBook } from '@/lib/bibleData';
import { fetchChapter, fetchVerseCount, renderVerseText, renderColophonText, renderSubscriptText } from '@/lib/bibleApi';
import { getBibleData } from '@/lib/bibleCache';
import { SUBSCRIPTS, COLOPHONS } from '@/lib/bibleSubscripts';
import BookSelector from '@/components/bible/BookSelector';
import ChapterSelector from '@/components/bible/ChapterSelector';
import VerseSelector from '@/components/bible/VerseSelector';
import VerseText from '@/components/bible/VerseText';
import TitlePage from '@/components/bible/TitlePage';
import SelectorSheet from '@/components/bible/SelectorSheet';
import RunningHead from '@/components/bible/RunningHead';
import CurrentlyReadingIndicator from '@/components/bible/CurrentlyReadingIndicator';
import MinimizedHeaderBar from '@/components/bible/MinimizedHeaderBar';
import ReadingRangeBar from '@/components/bible/ReadingRangeBar';
import SelectActionBar from '@/components/bible/SelectActionBar';
import { useHeaderHide } from '@/lib/HeaderHideContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Accessibility } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { getAccessibilityFont, setAccessibilityFont, applyReaderFont } from '@/lib/accessibilityFont';
import { getSearchNav, setSearchNav, setSearchIndex, clearSearchNav, getGospelNav, setGospelNav, setGospelIndex, clearGospelNav } from '@/lib/searchNav';
import { getGospelResults } from '@/lib/gospelVerses';
import { getOccurrenceLabel, scrollToOccurrence, emphasizeOccurrence } from '@/lib/occurrenceLabel';
import { useReaderUrlSync } from '@/lib/useReaderUrlSync';
import { resolveBook, formatVerseRange } from '@/lib/readerHelpers';
import { useClosePopovers } from '@/lib/useClosePopovers';
import { printChapterContents } from '@/lib/printHelpers';

const isMobile = () => window.innerWidth < 640;

const STORAGE_KEY = 'kjb-position';

function loadPosition() {
  try {
    const p = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (p?.abbr && BIBLE_BOOKS.find(b => b.abbr === p.abbr)) return p;
  } catch {}
  return { abbr: 'GEN', chapter: 1, verse: null };
}

function savePosition(abbr, chapter, verse = null) {
  try {
    // Preserve an existing verseEnd (verse-range / multi-reference filter) when
    // it still applies to the same book+chapter+verse. Otherwise drop it.
    let verseEnd = null;
    try {
      const prev = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (prev.abbr === abbr && prev.chapter === chapter && prev.verse === verse && prev.verseEnd) {
        verseEnd = prev.verseEnd;
      }
    } catch {}
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ abbr, chapter, verse, verseEnd }));
  } catch {}
}


export default function BibleReader() {
  const { hideHeader, setHideHeader } = useHeaderHide();
  const routerLocation = useLocation();
  const routerNavigate = useNavigate();
  const [pos, setPos] = useState(() => {
    // On a plain refresh, don't restore a single highlighted verse (it would
    // show the "currently reading" indicator). URL/search/daily navigation
    // sets the verse explicitly elsewhere.
    const p = loadPosition();
    return { ...p, verse: null };
  });
  const [verses, setVerses] = useState([]);
  const [colophon, setColophon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightVerse, setHighlightVerse] = useState(pos.verse || null);
  // 'colophon' | 'subscript' | null — highlight a non-verse section (from search)
  const [highlightSection, setHighlightSection] = useState(null);
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
  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState(new Set());
  const [filterMode, setFilterMode] = useState(false); // show only selected verses
  const [fontFamily, setFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-reader-font-family') || 'serif'; } catch { return 'serif'; }
  });
  const [a11yFont, setA11yFont] = useState(getAccessibilityFont);
  const a11yActive = a11yFont !== 'default';

  // Self-heal a stuck conflicting state: an accessibility font + 'cursive' reader
  // font can't both apply (cursive is excluded from the a11y override). Reset the
  // reader font to serif so the active accessibility font renders correctly.
  useEffect(() => {
    if (a11yFont !== 'default' && fontFamily === 'cursive') {
      setFontFamily('serif');
      try { localStorage.setItem('kjb-reader-font-family', 'serif'); } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Track search term for CurrentlyReadingIndicator
  const [searchTerm, setSearchTerm] = useState(() => getSearchNav().term || null);
  const [searchResultIndex, setSearchResultIndex] = useState(() => getSearchNav().index);
  const [searchTotalResults, setSearchTotalResults] = useState(() => getSearchNav().results.length);
  // Ref to prevent focus events from restoring a search we intentionally cleared
  const searchClearedRef = useRef(false);
  // Ref to prevent focus events from restoring a daily/random "last reading"
  // indicator after the user manually navigated (book/chapter/verse) or cleared it
  const lastReadingClearedRef = useRef(false);

  // Gospel stepper state — show "Gospel" indicator with up/down arrows
  const [gospelMode, setGospelMode] = useState(false);
  const [gospelResultIndex, setGospelResultIndex] = useState(() => getGospelNav().index);
  const [gospelTotalResults, setGospelTotalResults] = useState(() => getGospelNav().results.length);

  const handleFontChange = (font) => {
    // Dyslexic & Legible are accessibility fonts — apply them app-wide (and
    // disable the other reader fonts), matching the Settings behaviour.
    if (font === 'dyslexic' || font === 'hyperlegible') {
      setAccessibilityFont(font);
      setA11yFont(font);
      window.dispatchEvent(new Event('storage'));
      return;
    }
    // Picking a normal reading font (Serif/Sans/Mono/Cursive) must turn OFF any
    // active accessibility font, otherwise the indicator shows the new font but
    // the app keeps rendering in the accessibility font.
    // IMPORTANT: write the new reader font to localStorage BEFORE disabling the
    // a11y font. setAccessibilityFont fires 'kjb-fonts-changed' synchronously,
    // which makes the sync effect re-read kjb-reader-font-family — if we wrote it
    // afterwards it would read the stale value and revert the font.
    try { localStorage.setItem('kjb-reader-font-family', font); } catch {}
    setFontFamily(font);
    applyReaderFont(font);
    if (a11yFont !== 'default') {
      setAccessibilityFont('default');
      setA11yFont('default');
    }
    window.dispatchEvent(new Event('storage'));
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

  // Multi-select state (selectMode/selectedVerses/filterMode declared earlier)
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
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen?.();
        setFullscreen(true);
      } else {
        await document.exitFullscreen?.();
        setFullscreen(false);
      }
    } catch {}
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

  // Ensure popovers are dismissed when navigating away from the page
  useEffect(() => {
    return () => {
      setShowBookPicker(false);
      setShowChapterPicker(false);
      setShowVersePicker(false);
      setShowZoomPopover(false);
      setShowFontPopover(false);
    };
  }, [routerLocation.pathname]);



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
    const newZoom = Math.max(75, Math.min(250, zoomLevel + delta));
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

    
    const toUse = selectedVerses.size > 0 ? selectedVerses : new Set(verses.map(v => v.verse));
    const selectedVersesList = verses.filter(v => toUse.has(v.verse)).sort((a, b) => a.verse - b.verse);

    // Group consecutive verses; non-consecutive runs become separate referenced blocks.
    const groups = [];
    let group = [];
    selectedVersesList.forEach((v) => {
      if (group.length === 0 || v.verse === group[group.length - 1].verse + 1) {
        group.push(v);
      } else {
        groups.push(group);
        group = [v];
      }
    });
    if (group.length) groups.push(group);

    const firstVerse = selectedVersesList[0]?.verse || null;
    const lastVerse = selectedVersesList[selectedVersesList.length - 1]?.verse || null;

    const subscriptKey = `${book.apiName}:${pos.chapter}`;
    const chapterSubscript = SUBSCRIPTS[subscriptKey] || null;
    const lastVerseNum = verses.length ? verses[verses.length - 1].verse : null;
    const blocks = groups.map((g) => {
      const range = formatVerseRange(g.map(v => v.verse));
      // Include the Psalm subscript/superscription when verse 1 is in this group,
      // and the chapter colophon when the chapter's last verse is in this group.
      const includesV1 = g.some(v => v.verse === 1);
      const includesLast = lastVerseNum != null && g.some(v => v.verse === lastVerseNum);
      return formatVerseShare({
        text: g.map(v => cleanVerseText(v.text)).join(' '),
        subscript: includesV1 ? chapterSubscript : null,
        colophon: includesLast ? colophon : null,
        ref: `${book.shortName} ${pos.chapter}:${range}`,
        url: buildVerseUrl({ abbr: pos.abbr, chapter: pos.chapter, verse: g[0].verse, verseEnd: g[g.length - 1].verse > g[0].verse ? g[g.length - 1].verse : undefined, from: searchTerm ? 'search' : undefined }),
      });
    });
    const lines = blocks.join('\n\n———\n\n');
    
    console.log('[BibleReader] Copying to clipboard:', lines.substring(0, 100) + '...');
    
    try {
      const textarea = document.createElement('textarea');
      textarea.value = lines;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    } catch {
      await navigator.clipboard.writeText(lines);
    }
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1800);
  };

  const handleReadSelected = () => {
    setFilterMode(true);
    setSelectMode(false);
    // Reflect the selected verse range in the browser URL so it's shareable
    if (selectedVerses.size > 0) {
      const first = Math.min(...selectedVerses);
      const last = Math.max(...selectedVerses);
      let url = `/read?book=${pos.abbr}&chapter=${pos.chapter}&verse=${first}`;
      if (last > first) url += `&verseEnd=${last}`;
      try {
        window.history.replaceState({}, '', url);
        savePosition(pos.abbr, pos.chapter, first);
        const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...p, verseEnd: last > first ? last : null }));
      } catch {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Auto-dismiss overlay after 3 seconds
    setTimeout(() => setShowFilterOverlay(false), 3000);
  };

  // Share the current chapter (or selected verses) with a deep-link URL.
  const [shareFeedback, setShareFeedback] = useState(false);
  const handleShareChapter = async () => {
    const hasSel = selectedVerses.size > 0;
    const ref = hasSel ? `${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}` : `${book.shortName} ${pos.chapter}`;
    const shareText = `${ref} (KJB)\n\n${buildVerseUrl({ abbr: pos.abbr, chapter: pos.chapter, verse: hasSel ? Math.min(...selectedVerses) : null, verseEnd: hasSel ? Math.max(...selectedVerses) : null })}`;
    try {
      if (navigator.share) return await navigator.share({ title: `${ref} — KJB Reader`, text: shareText });
    } catch (err) { if (err?.name === 'AbortError') return; }
    try {
      await navigator.clipboard.writeText(shareText);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 1800);
    } catch {}
  };

  const topRef = useRef(null);
  const rangeHighlightRef = useRef(false); // guards reset effect while a range highlight is active
  // Remembers the user's preferred result view ('filter' = verses only, 'full' =
  // full chapter) so stepping up/down through results keeps it until they toggle.
  const resultViewRef = useRef('filter');
  // When true, the next chapter load is a fresh navigation and must start at the top.
  const freshNavRef = useRef(false);
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);
  const book = BIBLE_BOOKS.find(b => b.abbr === pos.abbr) || BIBLE_BOOKS[0];

  // Keep the address bar in sync with the current position on every change —
  // including direct setPos navigations (gospel/search steppers, daily/random).
  useReaderUrlSync(pos, loading);

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
    } catch (err) {
      console.error('Load chapter error:', err);
      setError('Failed to load chapter. Please check your connection.');
    }
    setLoading(false);
  }, []);



  useEffect(() => {
    // Preload and cache ALL Bible data with italics on first mount
    getBibleData().catch(err => console.error('[BibleReader] Cache preload failed:', err));
    
    // Only restore search nav if we're arriving from a search navigation
    const initParams = new URLSearchParams(window.location.search);
    if (initParams.get('from') === 'search') {
      const { term, index, results } = getSearchNav();
      // Fall back to the ?q= URL param so shared/bookmarked links restore the term.
      const urlTerm = initParams.get('q') || term;
      if (urlTerm) {
        searchClearedRef.current = false;
        setSearchTerm(urlTerm);
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
    // Restore gospel stepper when arriving from a gospel link
    if (initParams.get('from') === 'gospel') {
      let g = getGospelNav();
      // Fresh/shared link with no in-memory nav: seed the full gospel list and
      // set the index to the verse in the URL so the stepper shows X of Y.
      if (g.results.length === 0) {
        const results = getGospelResults();
        const b = resolveBook(initParams.get('book'));
        const ch = parseInt(initParams.get('chapter') || '0', 10);
        const vs = initParams.get('verse') ? parseInt(initParams.get('verse'), 10) : null;
        const idx = Math.max(0, results.findIndex(r => b && r.abbr === b.abbr && r.chapter === ch && r.verse === vs));
        setGospelNav(results, idx);
        g = { results, index: idx };
      }
      if (g.results.length > 0) {
        setGospelMode(true);
        setGospelResultIndex(g.index);
        setGospelTotalResults(g.results.length);
      }
    } else {
      clearGospelNav();
    }
    
    // Check for URL parameters: ?book=John&chapter=3&verse=16
    // (book accepts abbr, short name, or full name)
    const urlParams = new URLSearchParams(window.location.search);
    const urlBook = urlParams.get('book');
    const urlChapter = urlParams.get('chapter');
    const urlVerse = urlParams.get('verse');

    const urlTitlePage = urlParams.get('titlePage');
    if (urlTitlePage === 'old' || urlTitlePage === 'new') {
      const abbr = urlTitlePage === 'new' ? 'MAT' : 'GEN';
      setPos({ abbr, chapter: 0, verse: null });
      loadChapter(abbr, 0, null);
      return;
    }
    // When arriving from a search or gospel navigation, let the route effect own the load
    // via stepToResult (it has the in-memory result with verseEnd). Running the
    // mount handler too would race it and wipe the verse-range filter.
    if (initParams.get('from') === 'search' || initParams.get('from') === 'gospel') {
      return;
    }
    const urlBookObj = resolveBook(urlBook);
    if (urlBookObj && urlChapter) {
      const chapterNum = parseInt(urlChapter, 10);
      const verseNum = urlVerse ? parseInt(urlVerse, 10) : null;
      // A verse range (verseEnd) may be carried in localStorage for filter mode —
      // apply it on first mount so a multi-reference / range load highlights the
      // whole range immediately (not just the first verse).
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
      }
      setPos({ abbr: urlBookObj.abbr, chapter: chapterNum, verse: verseNum });
      setHighlightVerse(verseNum || null);
      loadChapter(urlBookObj.abbr, chapterNum, verseNum);
    } else {
      // Plain refresh — load the chapter WITHOUT restoring a verse highlight,
      // so the "currently reading" indicator doesn't reappear on reload.
      loadChapter(pos.abbr, pos.chapter, null);
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
    const urlTitlePage = urlParams.get('titlePage');
    if (urlTitlePage === 'old' || urlTitlePage === 'new') {
      const abbr = urlTitlePage === 'new' ? 'MAT' : 'GEN';
      setSearchTerm(null);
      setGospelMode(false);
      setFilterMode(false);
      setSelectedVerses(new Set());
      setHighlightedVerses(new Set());
      setPos({ abbr, chapter: 0, verse: null });
      loadChapter(abbr, 0, null);
      return;
    }
    const urlBookObj = resolveBook(urlParams.get('book'));
    const urlChapter = urlParams.get('chapter');
    const isFromSearch = urlParams.get('from') === 'search';
    const isFromDaily = urlParams.get('from') === 'daily';
    const isFromGospel = urlParams.get('from') === 'gospel';
    const urlHighlightSection = urlParams.get('highlight');
    setHighlightSection(urlHighlightSection === 'colophon' || urlHighlightSection === 'subscript' ? urlHighlightSection : null);
    if (urlBookObj && urlChapter) {
      const chapterNum = parseInt(urlChapter, 10);
      const verseNum = urlParams.get('verse') ? parseInt(urlParams.get('verse'), 10) : null;
      // A verse range (verseEnd) may be carried in localStorage for filter mode.
      let verseEnd = urlParams.get('verseEnd') ? parseInt(urlParams.get('verseEnd'), 10) : null;
      try {
        if (!verseEnd) {
          const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
          if (p.abbr === urlBookObj.abbr && p.chapter === chapterNum && p.verseEnd) verseEnd = p.verseEnd;
        }
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
      // Gospel stepper navigation
      if (isFromGospel) {
        let g = getGospelNav();
        // Shared/opened link with no in-memory nav: seed the full gospel list
        // and set the index to this verse so the stepper shows the right X of Y.
        if (g.results.length === 0) {
          const results = getGospelResults();
          const idx = Math.max(0, results.findIndex(r => r.abbr === urlBookObj.abbr && r.chapter === chapterNum && r.verse === verseNum));
          setGospelNav(results, idx);
          g = { results, index: idx };
        }
        if (g.results.length > 0) {
          setGospelMode(true);
          setGospelResultIndex(g.index);
          setGospelTotalResults(g.results.length);
          const cur = g.results[g.index];
          if (cur) {
            stepToResult(cur);
            return;
          }
        }
      } else {
        setGospelMode(false);
        clearGospelNav();
      }
      // Restore context based on navigation source
      if (isFromSearch) {
        let { term, index, results } = getSearchNav();
        // Fall back to the ?q= URL param so shared/bookmarked links restore the term.
        const urlTerm = urlParams.get('q') || term;
        // Shared/bookmarked link: no in-memory results — seed a single-result nav
        // from the URL (carrying any verseEnd from storage) so the search
        // indicator shows AND the first result still filters its full range.
        if (urlTerm && results.length === 0) {
          results = [{ abbr: urlBookObj.abbr, chapter: chapterNum, verse: verseNum, verseEnd: verseEnd || null }];
          index = 0;
          setSearchNav(results, index, urlTerm);
        }
        if (urlTerm) {
          searchClearedRef.current = false;
          setSearchTerm(urlTerm);
          setSearchResultIndex(index);
          setSearchTotalResults(results.length);
        }
        // Drive the initial load through the SAME stepper logic so the very first
        // result filters/highlights its range consistently with up/down stepping.
        const cur = results[index];
        if (cur) {
          stepToResult(cur);
          return;
        }
      } else {
        // Non-search URL navigation — clear any lingering search state
        searchClearedRef.current = true;
        clearSearchNav();
        setSearchTerm(null);
        setSearchResultIndex(0);
        setSearchTotalResults(0);
      }
      // Restore lastReadingPos from storage for daily/random navigations.
      // For a shared/opened ?from=daily link there's no stored value, so seed
      // the daily indicator directly from the URL params.
      if (isFromDaily) {
        lastReadingClearedRef.current = false;
        try {
          const saved = localStorage.getItem('kjb-last-reading');
          if (saved) {
            setLastReadingPos(JSON.parse(saved));
          } else {
            const dailyPos = { abbr: urlBookObj.abbr, chapter: chapterNum, verse: verseNum || null, fromDailyVerse: true };
            localStorage.setItem('kjb-last-reading', JSON.stringify(dailyPos));
            setLastReadingPos(dailyPos);
          }
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
        setPos({ abbr: p.abbr, chapter: p.chapter, verse: null });
        // Always reload — internal navigation (book/chapter picker) doesn't change
        // routerLocation.search so this effect never fires for those navigations.
        // Don't restore a verse highlight (avoids the "currently reading" indicator on refresh).
        loadChapter(p.abbr, p.chapter, null);
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
      // If this navigation came from a search/multi-ref stepper, route it through
      // stepToResult so the first result filters/highlights its range consistently.
      const fromSearch = new URLSearchParams(window.location.search).get('from') === 'search';
      const nav = getSearchNav();
      if (fromSearch && nav.results.length > 0) {
        const cur = nav.results[nav.index] || nav.results[0];
        if (cur && cur.abbr === p.abbr && cur.chapter === p.chapter) {
          stepToResult(cur);
          return;
        }
      }
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

  // Smoothly scroll a verse element just below the sticky toolbar. Reusable so
  // the scroll effect AND the "Full Chapter" toggle can both call it.
  const scrollToVerseEl = useCallback((verseNum) => {
    const verseEl = document.getElementById(`v${verseNum}`);
    if (!verseEl) return;
    const occ = posRef.current?.occurrence || 0;
    emphasizeOccurrence(verseEl.querySelectorAll('mark[data-occ]'), occ);
    
    const scroller = document.getElementById('kjb-scroll');
    const toolbarH = topRef.current ? topRef.current.getBoundingClientRect().height : 0;
    const stickyOffset = toolbarH + 48; // Give comfortable breathing room above the verse
    
    // Find the verse number element to reliably get the top position,
    // avoiding CSS column fragmentation issues on the parent block.
    const numEl = verseEl.querySelector('sup, .kjb-dropcap-num');
    let topRect = numEl ? numEl.getBoundingClientRect().top : verseEl.getBoundingClientRect().top;
    
    // If a stanza heading (e.g., ALEPH in Psalm 119) exists above the verse number,
    // scroll to the heading instead so it isn't hidden behind the sticky toolbar.
    const heading = verseEl.querySelector('.font-bold.text-center');
    if (heading && heading.getBoundingClientRect().top < topRect) {
      topRect = heading.getBoundingClientRect().top;
    }
    
    if (scroller) {
      scroller.scrollTo({ top: Math.max(0, topRect - scroller.getBoundingClientRect().top + scroller.scrollTop - stickyOffset), behavior: 'smooth' });
    } else {
      window.scrollTo({ top: Math.max(0, topRect + window.scrollY - stickyOffset), behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (loading) return;
    if (highlightVerse) {
      const scrollToVerse = () => scrollToVerseEl(highlightVerse);
      const t1 = setTimeout(scrollToVerse, 50), t2 = setTimeout(scrollToVerse, 200), t3 = setTimeout(scrollToVerse, 600);
      const container = document.querySelector('.kjb-reader-content');
      let ro = null;
      if (container && window.ResizeObserver) { ro = new ResizeObserver(scrollToVerse); ro.observe(container); }
      const tStop = setTimeout(() => ro && ro.disconnect(), 2000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(tStop); ro && ro.disconnect(); };
    }
    if (freshNavRef.current) {
      freshNavRef.current = false;
      (document.getElementById('kjb-scroll') || window).scrollTo({ top: 0 });
      return;
    }
    if (highlightSection) return;
    const timer = setTimeout(() => {
      try {
        const saved = parseInt(sessionStorage.getItem(`kjb-scroll-${pos.abbr}-${pos.chapter}`) || '0', 10);
        if (saved > 0) (document.getElementById('kjb-scroll') || window).scrollTo({ top: saved });
      } catch {}
    }, 80);
    return () => clearTimeout(timer);
  }, [verses, loading, highlightVerse, highlightSection, pos.abbr, pos.chapter]);

  // Scroll to + briefly highlight a colophon/subscript when navigated from search
  useEffect(() => {
    if (loading || !highlightSection) return;
    const anchorId = highlightSection === 'colophon' ? 'kjb-colophon-anchor' : 'kjb-subscript-anchor';
    const scrollToSection = () => {
      const el = document.getElementById(anchorId);
      if (!el) return;
      const scroller = document.getElementById('kjb-scroll');
      const toolbarH = topRef.current ? topRef.current.getBoundingClientRect().height : 0;
      const stickyOffset = toolbarH + 48;
      if (scroller) {
        const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - stickyOffset;
        scroller.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      } else {
        const top = el.getBoundingClientRect().top + window.scrollY - stickyOffset;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    };
    const t1 = setTimeout(scrollToSection, 250);
    const t2 = setTimeout(scrollToSection, 650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading, highlightSection, verses, colophon, pos.abbr, pos.chapter]);

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

  // Keep zoom + font in sync if changed elsewhere (e.g. Settings, daily card)
  // after reload, on focus, on storage events, AND whenever this route becomes
  // active (so a font picked on Home's daily card is reflected here immediately).
  useEffect(() => {
    const sync = () => {
      try { setZoomLevel(parseInt(localStorage.getItem('kjb-zoom') || '100')); } catch {}
      try {
        const f = localStorage.getItem('kjb-reader-font-family') || 'serif';
        setFontFamily(f);
        applyReaderFont(f);
      } catch {}
      try { setA11yFont(getAccessibilityFont()); } catch {}
    };
    sync(); // run immediately on mount / when pathname changes
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    window.addEventListener('kjb-fonts-changed', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('focus', sync);
      window.removeEventListener('kjb-fonts-changed', sync);
    };
  }, [routerLocation.pathname]);

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



  // Reset verse status when exiting filter mode or clearing selection.
  // Don't clear when a multi-verse range highlight is active (search/multi-ref
  // steps highlight a range without entering filter mode).
  useEffect(() => {
    if (!filterMode && selectedVerses.size === 0 && !rangeHighlightRef.current) {
      try {
        const current = JSON.parse(localStorage.getItem('kjb-position') || '{}');
        if (current.verse || current.verseEnd) {
          localStorage.setItem('kjb-position', JSON.stringify({ ...current, verse: null, verseEnd: null }));
        }
      } catch {}
      setHighlightedVerses(new Set());
    }
  }, [filterMode, selectedVerses]);

  const navigate = (newAbbr, newChapter, jumpVerse = null, fromDailyVerse = false, fromRandom = false, isAutoAdvance = false, section = null) => {
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
    // Clear gospel stepper on manual navigation
    setGospelMode(false);
    clearGospelNav();
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
      // Strip stale ?from=daily/?from=search from the URL. During auto-advance,
      // use replaceState only — routerNavigate would retrigger the route effect
      // and reload the chapter, breaking continuous Read Aloud.
      if (routerLocation.search) {
        if (isAutoAdvance) { try { window.history.replaceState({}, '', '/read'); } catch {} }
        else { try { routerNavigate('/read', { replace: true }); } catch {} }
      }
    }
    // Manual navigation resets the result-view preference back to the default.
    resultViewRef.current = 'filter';
    // Clear highlights when navigating without a specific verse
    if (!jumpVerse) {
      setHighlightVerse(null);
    }
    setHighlightSection(section);
    // Mark fresh navigation (start at top); clear any active range highlight.
    rangeHighlightRef.current = false;
    freshNavRef.current = true;
    const newPos = { abbr: newAbbr, chapter: newChapter, verse: jumpVerse };
    setPos(newPos);
    // Reflect new position in the address bar without triggering the route effect.
    try {
      let url;
      if (newChapter === 0) {
        url = `/read?titlePage=${newAbbr === 'MAT' ? 'new' : 'old'}`;
      } else {
        url = `/read?book=${newAbbr}&chapter=${newChapter}`;
        if (jumpVerse) url += `&verse=${jumpVerse}`;
        if (section) url += `&highlight=${section}`;
      }
      window.history.replaceState({}, '', url);
    } catch {}
    loadChapter(newAbbr, newChapter, jumpVerse);
  };

  // Step the search/gospel stepper to a result. If it's in the SAME chapter we're
  // already viewing, skip loadChapter (which flickers loading and can interrupt
  // the smooth scroll) and just move the highlight so the scroll effect re-fires.
  const stepToResult = (r) => {
    const section = r.section || null;
    const targetVerse = section ? null : (r.verse || null);
    setHighlightSection(section);
    // A verse RANGE (e.g. multi-reference / passage step) filters the reader to
    // show ONLY those verses. A single verse highlights + scrolls within the
    // full chapter.
    // Honour the user's chosen view: 'filter' (verses only) or 'full' (full chapter).
    const useFilter = resultViewRef.current !== 'full';
    if (!section && r.verse && r.verseEnd && r.verseEnd > r.verse) {
      const end = r.verseEnd;
      const range = new Set();
      for (let v = r.verse; v <= end; v++) range.add(v);
      rangeHighlightRef.current = true;
      setHighlightedVerses(range);
      setSelectedVerses(range);
      setFilterMode(useFilter);
      try {
        const cur = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, abbr: r.abbr, chapter: r.chapter, verse: r.verse, verseEnd: end }));
      } catch {}
    } else if (!section && targetVerse) {
      // Single-verse search result → filter the reader to show ONLY that verse.
      const single = new Set([targetVerse]);
      rangeHighlightRef.current = true;
      setHighlightedVerses(single);
      setSelectedVerses(single);
      setFilterMode(useFilter);
      try {
        const cur = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, abbr: r.abbr, chapter: r.chapter, verse: targetVerse, verseEnd: null }));
      } catch {}
    } else {
      rangeHighlightRef.current = false;
      setFilterMode(false);
      setHighlightedVerses(new Set());
      setSelectedVerses(new Set());
      try {
        const cur = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, abbr: r.abbr, chapter: r.chapter, verse: r.verse || null, verseEnd: null }));
      } catch {}
    }
    const sameChapter = !loading && verses.length > 0 && posRef.current.abbr === r.abbr && posRef.current.chapter === r.chapter;
    const sameVerse = sameChapter && posRef.current.verse === targetVerse;
    setPos({ abbr: r.abbr, chapter: r.chapter, verse: targetVerse, occurrence: r.occurrence || 0 });
    setHighlightVerse(targetVerse);
    // Already on this chapter → don't reload (no spinner, no jump to top). The
    // highlightVerse change re-fires the scroll effect; when only the occurrence
    // changed within the SAME verse, scroll to that <mark> directly here.
    if (sameChapter) {
      if (sameVerse && targetVerse) scrollToOccurrence(targetVerse, r.occurrence || 0, topRef);
      return;
    }
    loadChapter(r.abbr, r.chapter, targetVerse);
  };

  const clearSearchContext = () => {
    searchClearedRef.current = true;
    clearSearchNav();
    setSearchTerm(null);
    setSearchResultIndex(0);
    setSearchTotalResults(0);
    setHighlightVerse(null);
  };

  const goNext = (isAutoAdvance = false) => {
    if (pos.chapter < book.chapters) {
      navigate(pos.abbr, pos.chapter + 1, null, false, false, isAutoAdvance);
    } else {
      const next = getNextBook(pos.abbr);
      if (next) navigate(next.abbr, 1, null, false, false, isAutoAdvance);
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

  return (
    <div onClick={(e) => { if (!e.target.closest('.kjb-verse-container, h1, h2, h3, .kjb-subscript, .kjb-colophon, #kjb-colophon-anchor, #kjb-subscript-anchor, button, a')) { setHighlightVerse(null); setHighlightSection(null); if (!selectMode) setHighlightedVerses(new Set()); } }} className={`w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-3 ${hideHeader ? 'pt-16' : ''}`}>

      {/* Sticky nav bar — hidden when hideHeader is on */}
      {!hideHeader && (
        <div ref={topRef} className="print:hidden sticky top-0 z-[100] border-b border-border pb-2 pt-2 mb-2 relative shadow-sm -mx-5 sm:-mx-8 lg:-mx-12 px-5 sm:px-8 lg:px-12 bg-background before:content-[''] before:absolute before:bottom-full before:left-0 before:right-0 before:h-12 before:bg-background">
          <div className="flex flex-wrap items-stretch justify-stretch gap-1.5 w-full max-w-7xl mx-auto [&>button:not(.kjb-fixed-btn)]:flex-grow [&>button:not(.kjb-fixed-btn)]:basis-auto [&>div.relative]:flex-grow [&>div.relative>button]:w-full">

            {/* Book selector */}
            <div className="relative flex">
              <button
                onClick={() => { setShowBookPicker(p => !p); setShowChapterPicker(false); setShowVersePicker(false); setShowZoomPopover(false); setShowFontPopover(false); }}
                onTouchEnd={(e) => { e.preventDefault(); setShowBookPicker(p => !p); setShowChapterPicker(false); setShowVersePicker(false); setShowZoomPopover(false); setShowFontPopover(false); }}
                className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 w-full"
              >
                <span className="truncate text-center">{isViewingTitlePage ? 'Title Page' : book.shortName}</span>
                <ChevronRight className={`w-3 h-3 opacity-70 transition-transform duration-200 flex-shrink-0 ${showBookPicker ? 'rotate-90' : ''}`} />
              </button>

              {/* Desktop popover */}
              {showBookPicker && !isMobile() && (
                <div className="absolute top-full left-0 mt-1 z-[100]">
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
            </div>

            {!isViewingTitlePage && (
              <>
              {/* Chapter selector */}
              <div className="relative flex">
                <button
                  onClick={() => { setShowChapterPicker(p => !p); setShowBookPicker(false); setShowVersePicker(false); setShowZoomPopover(false); setShowFontPopover(false); }}
                  onTouchEnd={(e) => { e.preventDefault(); setShowChapterPicker(p => !p); setShowBookPicker(false); setShowVersePicker(false); setShowZoomPopover(false); setShowFontPopover(false); }}
                  className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 w-full"
                >
                  <span>Ch.{pos.chapter}</span>
                  <ChevronRight className={`w-3 h-3 opacity-70 transition-transform duration-200 flex-shrink-0 ${showChapterPicker ? 'rotate-90' : ''}`} />
                </button>
                {showChapterPicker && !isMobile() && (
                  <div className="absolute top-full left-0 mt-1 z-[100]">
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
              </div>

              {/* Verse selector */}
              <div className="relative flex">
                <button
                  onClick={() => { setShowVersePicker(p => !p); setShowBookPicker(false); setShowChapterPicker(false); setShowZoomPopover(false); setShowFontPopover(false); }}
                  onTouchEnd={(e) => { e.preventDefault(); setShowVersePicker(p => !p); setShowBookPicker(false); setShowChapterPicker(false); setShowZoomPopover(false); setShowFontPopover(false); }}
                  className={`flex items-center justify-center gap-1.5 px-3 rounded-lg border border-border font-sans text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 w-full ${
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
                  <span className="truncate min-w-[3.5rem] text-center">
                    {selectMode
                      ? `${selectedVerses.size > 0 ? selectedVerses.size : '0'} selected`
                      : filterMode && selectedVerses.size > 0
                      ? `vv.${formatVerseRange([...selectedVerses])}`
                      : highlightSection === 'colophon'
                      ? 'Colophon'
                      : highlightSection === 'subscript'
                      ? 'Subscript'
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
                  <div className="absolute top-full left-0 mt-1 z-[100]">
                    <VerseSelector
                      totalVerses={verseCount}
                      currentVerse={highlightVerse}
                      multiSelect={true}
                      hasSubscript={!!SUBSCRIPTS[`${book.apiName}:${pos.chapter}`]}
                      hasColophon={!!colophon}
                      onSelect={(v) => {
                        if (v && v.section) {
                          navigate(pos.abbr, pos.chapter, null, false, false, false, v.section);
                          setShowVersePicker(false);
                          return;
                        }
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
                    hasSubscript={!!SUBSCRIPTS[`${book.apiName}:${pos.chapter}`]}
                    hasColophon={!!colophon}
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
              </div>

              {/* Zoom control */}
              <div className="relative flex">
              <button
                onClick={() => { setShowZoomPopover(p => !p); setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false); setShowFontPopover(false); }}
                onTouchEnd={(e) => { e.preventDefault(); setShowZoomPopover(p => !p); setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false); setShowFontPopover(false); }}
                title={`Zoom: ${zoomLevel}%`}
                className="flex items-center justify-center gap-1 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 whitespace-nowrap"
              >
                <ZoomIn className="w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0" />
                <span className="truncate">{zoomLevel}%</span>
              </button>
              {/* Desktop popover */}
              {showZoomPopover && !isMobile() && (
                <div className="absolute top-full left-0 mt-1 z-[100]">
                  <div className="bg-card border border-border rounded-xl shadow-xl p-4 w-64 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3 pr-6">
                      <span className="font-sans text-xs font-medium text-foreground">Text Size</span>
                      <span className="font-sans text-xs font-semibold text-primary">{zoomLevel}%</span>
                    </div>
                    <button 
                      onClick={() => setShowZoomPopover(false)}
                      className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
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
                        max="250"
                        step="5"
                        value={zoomLevel}
                        onChange={handleZoomChange}
                        className="flex-1 h-2 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer accent-primary"
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
                      max="250"
                      step="5"
                      value={zoomLevel}
                      onChange={handleZoomChange}
                      className="flex-1 h-3 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer accent-primary"
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
              </div>

              {/* Font family toggle */}
              <div className="relative flex">
              <button
                onClick={() => { setShowFontPopover(p => !p); setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false); setShowZoomPopover(false); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setShowFontPopover(p => !p); setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false); setShowZoomPopover(false); }}
                title="Font family"
                className="flex items-center justify-center gap-1 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 whitespace-nowrap"
              >
                <Type className="w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0" />
                <span className="hidden sm:inline">{(() => {
                  const active = a11yActive ? a11yFont : fontFamily;
                  return active === 'serif' ? 'Serif' : active === 'sans-serif' ? 'Sans' : active === 'monospace' ? 'Mono' : active === 'dyslexic' ? 'Dyslexic' : active === 'hyperlegible' ? 'Legible' : 'Cursive';
                })()}</span>
              </button>
              {/* Desktop popover */}
              {showFontPopover && !isMobile() && (
                <div className="absolute top-full left-0 mt-1 z-[100]">
                  <div className="bg-card border border-border rounded-xl shadow-xl p-4 w-64 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3 pr-6">
                      <span className="font-sans text-xs font-medium text-foreground">Font Family</span>
                    </div>
                    <button 
                      onClick={() => setShowFontPopover(false)}
                      className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {a11yActive && (
                      <p className="font-sans text-[11px] text-muted-foreground mb-2 leading-snug">
                        An accessibility font is active app-wide and overrides reading fonts. Pick another accessibility font, or disable it in Settings → Accessibility.
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'serif', label: 'Serif' },
                        { value: 'sans-serif', label: 'Sans' },
                        { value: 'monospace', label: 'Mono' },
                        { value: 'cursive', label: 'Cursive' },
                        { value: 'dyslexic', label: 'Dyslexic' },
                        { value: 'hyperlegible', label: 'Legible' },
                      ].map(font => {
                        const isA11yChoice = font.value === 'dyslexic' || font.value === 'hyperlegible';
                        const isActive = a11yActive ? a11yFont === font.value : fontFamily === font.value;
                        const isDisabled = a11yActive && !isA11yChoice;
                        return (
                        <button
                          key={font.value}
                          disabled={isDisabled}
                          onClick={() => { handleFontChange(font.value); setShowFontPopover(false); }}
                          className={`px-3 py-2 rounded-lg border font-sans text-xs font-medium transition-all ${
                            isActive
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'bg-secondary text-secondary-foreground border-border hover:bg-accent/20'
                          } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
                          style={{ fontFamily: getFontFamilyValue(font.value) }}
                        >
                          {font.label}
                        </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {/* Mobile bottom sheet */}
              <SelectorSheet open={showFontPopover && isMobile()} onClose={() => setShowFontPopover(false)} title="Font Family">
                <div className="space-y-2 p-2">
                  {a11yActive && (
                    <p className="font-sans text-xs text-muted-foreground leading-snug mb-1">
                      An accessibility font is active app-wide and overrides reading fonts. Pick another accessibility font, or disable it in Settings → Accessibility.
                    </p>
                  )}
                  {[
                    { value: 'serif', label: 'Serif' },
                    { value: 'sans-serif', label: 'Sans' },
                    { value: 'monospace', label: 'Mono' },
                    { value: 'cursive', label: 'Cursive' },
                    { value: 'dyslexic', label: 'Dyslexic' },
                    { value: 'hyperlegible', label: 'Legible' },
                  ].map(font => {
                    const isA11yChoice = font.value === 'dyslexic' || font.value === 'hyperlegible';
                    const isActive = a11yActive ? a11yFont === font.value : fontFamily === font.value;
                    const isDisabled = a11yActive && !isA11yChoice;
                    return (
                    <button
                      key={font.value}
                      disabled={isDisabled}
                      onClick={() => { handleFontChange(font.value); setShowFontPopover(false); }}
                      className={`w-full px-4 py-3 rounded-lg border font-sans text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary text-secondary-foreground border-border hover:bg-accent/20'
                      } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`}
                      style={{ fontFamily: getFontFamilyValue(font.value) }}
                    >
                      {font.label}
                    </button>
                    );
                  })}
                </div>
              </SelectorSheet>
              </div>

              {/* Flow toggle (Line ↔ Paragraph) */}
              <button
                onClick={toggleFlow}
                onTouchEnd={(e) => { e.preventDefault(); toggleFlow(); }}
                title={flowMode === 'line' ? 'Switch to paragraph' : 'Switch to line-by-line'}
                className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap"
              >
                {flowMode === 'line' ? <List className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /> : <AlignJustify className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />}
                <span className="hidden lg:inline">{flowMode === 'line' ? 'Lines' : 'Para'}</span>
              </button>
              {/* Column toggle (Single ↔ Two-Column) */}
              <button
                onClick={toggleColumn}
                onTouchEnd={(e) => { e.preventDefault(); toggleColumn(); }}
                title={columnOn ? 'Switch to single column' : 'Switch to two-column'}
                className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap"
              >
                {columnOn ? <Columns2 className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /> : <AlignLeft className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />}
                <span className="hidden lg:inline">{columnOn ? '2-Col' : '1-Col'}</span>
              </button>
              {/* Select mode toggle */}
              <button
                onClick={toggleSelectMode}
                onTouchEnd={(e) => { e.preventDefault(); toggleSelectMode(); }}
                title="Select verses"
                className={`flex items-center justify-center gap-1.5 px-3 rounded-lg border border-border font-sans text-xs font-medium transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap ${selectMode ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'}`}
              >
                <CheckSquare className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
                <span className="hidden lg:inline">Select</span>
              </button>
              {/* Share / Print */}
              <button onClick={handleShareChapter} onTouchEnd={(e) => { e.preventDefault(); handleShareChapter(); }} title={shareFeedback ? 'Link copied!' : 'Share this chapter'} className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap"><Share2 className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /><span className="hidden lg:inline">{shareFeedback ? 'Copied!' : 'Share'}</span></button>
              <button
                onClick={() => printChapterContents(verses, book, pos, filterMode, selectedVerses, colophon, columnMode, paragraphMode)}
                title="Print Chapter"
                className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground hover:bg-accent/20 transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap"
              >
                <Printer className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
                <span className="hidden lg:inline">Print</span>
              </button>

              {/* Prev */}
              <button
                onClick={goPrev}
                onTouchEnd={(e) => { e.preventDefault(); goPrev(); }}
                disabled={isFirstChapterFirstBook}
                className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-30 transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:active:scale-100 touch-manipulation h-11 whitespace-nowrap"
              >
                <ChevronLeft className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
                <span className="hidden lg:inline">Prev</span>
              </button>
              {/* Next */}
              <button
                onClick={() => goNext()}
                onTouchEnd={(e) => { e.preventDefault(); goNext(); }}
                disabled={isLastChapterLastBook}
                className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-30 transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100 disabled:active:scale-100 touch-manipulation h-11 whitespace-nowrap"
              >
                <span className="hidden lg:inline">Next</span>
                <ChevronRight className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
              </button>
              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                onTouchEnd={(e) => { e.preventDefault(); toggleFullscreen(); }}
                title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                className="kjb-fixed-btn flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 whitespace-nowrap"
              >
                {fullscreen ? <Minimize2 className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /> : <Maximize2 className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />}
                <span className="hidden lg:inline">{fullscreen ? 'Exit' : 'Full Screen'}</span>
              </button>

              {/* Hide header */}
              <button
                onClick={(e) => { e.stopPropagation(); setHideHeader(!hideHeader); }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setHideHeader(!hideHeader); }}
                title={hideHeader ? "Show header" : "Hide header"}
                className="kjb-fixed-btn flex items-center justify-center px-2.5 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] whitespace-nowrap flex-shrink-0"
              >
                <ChevronDown className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ${hideHeader ? '' : 'rotate-180'}`} />
              </button>

              {/* Currently reading indicator - integrated into toolbar */}
              {(highlightVerse || (filterMode && selectedVerses.size > 0) || lastReadingActive || searchTerm || gospelMode) && (
                <CurrentlyReadingIndicator
                  highlightVerse={highlightVerse}
                  filterMode={filterMode}
                  selectedVerses={selectedVerses}
                  lastReadingPos={lastReadingActive ? lastReadingPos : null}
                  book={book}
                  pos={pos}
                  highlightSection={highlightSection}
                  searchTerm={searchTerm}
                  gospelMode={gospelMode}
                  gospelLabel={gospelMode ? (getGospelNav().results[gospelResultIndex]?.label || 'Gospel') : null}
                  currentResultIndex={gospelMode ? gospelResultIndex : searchResultIndex}
                  totalResults={gospelMode ? gospelTotalResults : searchTotalResults}
                  occurrenceLabel={!gospelMode && searchTerm ? getOccurrenceLabel(searchResultIndex) : ''}
                  onPrevResult={() => {
                    if (gospelMode) {
                      const { results, index } = getGospelNav();
                      if (results.length === 0) return;
                      // Wrap: first → last
                      const prevIndex = (index - 1 + results.length) % results.length;
                      const r = results[prevIndex];
                      if (r) {
                        setGospelIndex(prevIndex);
                        setGospelResultIndex(prevIndex);
                        stepToResult(r);
                      }
                      return;
                    }
                    const { results, index } = getSearchNav();
                    if (results.length === 0) return;
                    // Wrap: first → last
                    const prevIndex = (index - 1 + results.length) % results.length;
                    const r = results[prevIndex];
                    if (r) {
                      setSearchIndex(prevIndex);
                      setSearchResultIndex(prevIndex);
                      stepToResult(r);
                    }
                  }}
                  onNextResult={() => {
                    if (gospelMode) {
                      const { results, index } = getGospelNav();
                      if (results.length === 0) return;
                      // Wrap: last → first
                      const nextIndex = (index + 1) % results.length;
                      const r = results[nextIndex];
                      if (r) {
                        setGospelIndex(nextIndex);
                        setGospelResultIndex(nextIndex);
                        stepToResult(r);
                      }
                      return;
                    }
                    const { results, index } = getSearchNav();
                    if (results.length === 0) return;
                    // Wrap: last → first
                    const nextIndex = (index + 1) % results.length;
                    const r = results[nextIndex];
                    if (r) {
                      setSearchIndex(nextIndex);
                      setSearchResultIndex(nextIndex);
                      stepToResult(r);
                    }
                  }}
                  onClear={() => {
                    if (gospelMode) {
                      setGospelMode(false);
                      clearGospelNav();
                      setHighlightVerse(null);
                      try { window.history.replaceState({}, '', '/read'); } catch {}
                      return;
                    }
                    if (searchTerm) {
                      clearSearchContext();
                    } else if (lastReadingPos && lastReadingPos.abbr && lastReadingPos.chapter && !lastReadingPos.cleared) {
                      // Return to the PREVIOUS reading session if one was stored
                      // (random/daily navigation), otherwise stay on this chapter.
                      const abbr = lastReadingPos.prevAbbr || lastReadingPos.abbr;
                      const chapter = lastReadingPos.prevChapter || lastReadingPos.chapter;
                      lastReadingClearedRef.current = true;
                      searchClearedRef.current = true;
                      setFilterMode(false);
                      setSelectMode(false);
                      setSelectedVerses(new Set());
                      setHighlightVerse(null);
                      setShowFilterOverlay(false);
                      setLastReadingPos(null);
                      try {
                        localStorage.removeItem('kjb-last-reading');
                        localStorage.setItem(STORAGE_KEY, JSON.stringify({ abbr, chapter, verse: null }));
                      } catch {}
                      // Strip ?from=daily from the URL WITHOUT triggering the route
                      // effect (routerNavigate would reload again → flash).
                      try { window.history.replaceState({}, '', '/read'); } catch {}
                      // Load the previous chapter directly — single load, no flash.
                      freshNavRef.current = true;
                      setPos({ abbr, chapter, verse: null });
                      loadChapter(abbr, chapter, null);
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
                  className="flex flex-1 items-center justify-center gap-1.5 px-2.5 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-30 transition-all duration-200 hover:scale-105 active:scale-95 disabled:hover:scale-100 touch-manipulation h-11 min-w-[44px]"
                >
                  <ChevronLeft className="w-5 h-5 flex-shrink-0" />
                  <span className="hidden lg:inline">Prev</span>
                </button>
                <button
                  onClick={() => goNext()}
                  onTouchEnd={(e) => { e.preventDefault(); goNext(); }}
                  title="Next"
                  className="flex flex-1 items-center justify-center gap-1.5 px-2.5 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px]"
                >
                  <span className="hidden lg:inline">Next</span>
                  <ChevronRight className="w-5 h-5 flex-shrink-0" />
                </button>
                <button
                  onClick={toggleFullscreen}
                  onTouchEnd={(e) => { e.preventDefault(); toggleFullscreen(); }}
                  title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                  className="flex flex-1 items-center justify-center gap-1.5 px-2.5 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px]"
                >
                  {fullscreen ? <Minimize2 className="w-5 h-5 flex-shrink-0" /> : <Maximize2 className="w-5 h-5 flex-shrink-0" />}
                  <span className="hidden lg:inline">{fullscreen ? 'Exit' : 'Full'}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setHideHeader(!hideHeader); }}
                  onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); setHideHeader(!hideHeader); }}
                  title={hideHeader ? "Show header" : "Hide header"}
                  className="flex items-center justify-center px-2.5 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation h-11 min-w-[44px] flex-shrink-0"
                >
                  <ChevronDown className={`w-5 h-5 flex-shrink-0 ${hideHeader ? '' : 'rotate-180'}`} />
                </button>
              </>
            )}
          </div>

          {/* Select action bar — merged into the sticky toolbar so it sticks together */}
          {selectMode && (
            <SelectActionBar
              selectedCount={selectedVerses.size}
              totalVerses={verses.length}
              copyFeedback={copyFeedback}
              shareFeedback={shareFeedback}
              onSelectAll={selectAllVerses}
              onCancel={toggleSelectMode}
              onCopy={handleCopySelected}
              onShare={handleShareChapter}
              onReadSelected={handleReadSelected}
              onShowFull={() => { setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set()); setShowFilterOverlay(false); }}
              onPrintPage={() => window.print()}
              onPrintContents={() => printChapterContents(verses, book, pos, true, selectedVerses, colophon, columnMode, paragraphMode)}
            />
          )}

          {/* Reading a verse range — merged into the sticky toolbar like the copy bar.
              Shown whenever verses are selected (in either filtered or full-chapter view). */}
          {!selectMode && selectedVerses.size > 0 && (
            <ReadingRangeBar
              label={`Reading ${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}`}
              filterMode={filterMode}
              copyFeedback={copyFeedback}
              shareFeedback={shareFeedback}
              onCopy={handleCopySelected}
              onShare={handleShareChapter}
              onPrintPage={() => window.print()}
              onPrintContents={() => printChapterContents(verses, book, pos, filterMode, selectedVerses, colophon, columnMode, paragraphMode)}
              onToggleView={() => {
                // Toggle between filtered (verses only) and full-chapter view,
                // keeping the same verse selection/highlight either way.
                setFilterMode(prev => {
                  const next = !prev;
                  rangeHighlightRef.current = next;
                  // Remember the manual choice so stepping up/down keeps this view.
                  resultViewRef.current = next ? 'filter' : 'full';
                  // When switching TO full chapter, scroll down to the first
                  // highlighted verse. highlightVerse may already equal `first`,
                  // so scroll explicitly here instead of relying on a state change.
                  if (!next && selectedVerses.size > 0) {
                    const first = Math.min(...selectedVerses);
                    setHighlightVerse(first);
                    // Defer until the full chapter has re-rendered (more verses
                    // appear), then scroll to the first highlighted verse.
                    setTimeout(() => scrollToVerseEl(first), 80);
                    setTimeout(() => scrollToVerseEl(first), 350);
                  }
                  return next;
                });
              }}
              onClear={() => { rangeHighlightRef.current = false; setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set()); setHighlightedVerses(new Set()); setShowFilterOverlay(false); }}
            />
          )}
        </div>
      )}

      {/* Show header chevron when hidden — portaled to body so it stays truly
          fixed to the viewport (escapes the animated page wrapper) while text scrolls */}
      {hideHeader && (
        <MinimizedHeaderBar
          fullscreen={fullscreen}
          toggleFullscreen={toggleFullscreen}
          setHideHeader={setHideHeader}
        />
      )}

      {/* Click/tap outside to close desktop dropdowns and mobile sheets */}
      {(showBookPicker || showChapterPicker || showVersePicker || showZoomPopover || showFontPopover) && (
        <div
          className="fixed inset-0 z-[99]"
          onClick={(e) => {
            setShowBookPicker(false); 
            setShowChapterPicker(false); 
            setShowVersePicker(false); 
            setShowZoomPopover(false); 
            setShowFontPopover(false); 
          }}
          onTouchStart={(e) => {
            setShowBookPicker(false); 
            setShowChapterPicker(false); 
            setShowVersePicker(false); 
            setShowZoomPopover(false); 
            setShowFontPopover(false); 
          }}
        />
      )}

      {/* Book title — hidden when showing title page or in two-column (uses running head), EXCEPT chapter 1 which always shows centered title. ALWAYS shown when printing. */}
      {!isViewingTitlePage && (
        <div className={`text-center mb-6 pt-8 ${(!columnMode || pos.chapter === 1) ? '' : 'hidden print:block'}`} style={{ fontSize: `${zoomLevel / 100}rem` }}>
          <h1 className={`${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'} text-3xl md:text-4xl font-bold text-foreground mb-2 leading-tight`} style={{ fontStyle: 'normal', fontWeight: '900' }}>{book.name}</h1>
          <p className={`font-sans text-muted-foreground tracking-widest uppercase mt-5 ${fontFamily === 'cursive' ? 'cursive-em-style' : ''}`} style={{ fontStyle: 'normal', fontSize: `${zoomLevel / 100 * 0.875}rem`, fontWeight: fontFamily === 'cursive' ? '400' : undefined }}>
            Chapter {pos.chapter}
          </p>
          {/* Subscript — centred below chapter name, fully italic, [bracketed] words roman within italic */}
          {SUBSCRIPTS[`${book.apiName}:${pos.chapter}`] && (
            <p
              onClick={() => setHighlightSection(s => s === 'subscript' ? null : 'subscript')} id="kjb-subscript-anchor"
              className={`kjb-subscript text-sm text-muted-foreground mt-2 mb-4 max-w-lg mx-auto leading-relaxed text-center transition-colors duration-500 rounded-lg cursor-pointer ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'} ${highlightSection === 'subscript' ? 'bg-accent/20 ring-1 ring-accent/40 px-3 py-2' : ''}`}
              style={{ fontStyle: 'normal', fontSize: `${zoomLevel / 100}rem` }}
              dangerouslySetInnerHTML={{ __html: renderSubscriptText(SUBSCRIPTS[`${book.apiName}:${pos.chapter}`], highlightSection === 'subscript' ? searchTerm : null) }}
            />
          )}
        </div>
      )}





      {/* Title pages or verses */}
      <div 
        className={`kjb-reader-content leading-loose text-foreground ${fontFamily === 'cursive' ? 'cursive-em-style' : ''}`}
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
        {!loading && !error && verses.length > 0 && (() => {
          // Verses actually shown (respecting filter mode for ranges/selections)
          const shownCount = filterMode
            ? verses.filter(v => selectedVerses.has(v.verse)).length
            : verses.length;
          // Only use two columns when there's enough content to fill them.
          // A short selection (a few verses) reads better in a single column.
          const useColumns = columnMode && shownCount > 6;
          return (
          <div
            className={`${useColumns ? 'kjb-two-col text-left hyphens-auto' : 'text-left'} ${paragraphMode ? 'text-left px-2 sm:px-4' : ''}`}
            style={useColumns ? {
              fontSize: 'inherit',
              columnCount: 2,
              columnGap: '1.5rem',
              columnRule: '1px solid hsl(var(--border))',
            } : { fontSize: 'inherit' }}
          >
            {/* Subscript (Psalm superscription) — centred, fully italic, [bracketed] words roman */}
            {columnMode && !isViewingTitlePage && SUBSCRIPTS[`${book.apiName}:${pos.chapter}`] && (
              <p
                onClick={() => setHighlightSection(s => s === 'subscript' ? null : 'subscript')} id="kjb-subscript-anchor"
                className={`kjb-subscript text-center text-muted-foreground mb-4 leading-relaxed transition-colors duration-500 rounded-lg cursor-pointer ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'} ${highlightSection === 'subscript' ? 'bg-accent/20 ring-1 ring-accent/40 px-3 py-2' : ''}`}
                style={{ fontStyle: 'normal', fontSize: `${zoomLevel / 100}rem`, breakInside: 'avoid' }}
                dangerouslySetInnerHTML={{ __html: renderSubscriptText(SUBSCRIPTS[`${book.apiName}:${pos.chapter}`], highlightSection === 'subscript' ? searchTerm : null) }}
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
                colophon={verses.length > 0 && v.verse === verses[verses.length - 1].verse ? colophon : null}
                subscript={v.verse === 1 ? (SUBSCRIPTS[`${book.apiName}:${pos.chapter}`] || null) : null}
                isCursive={fontFamily === 'cursive'}
                fontFamilyValue={getFontFamilyValue(fontFamily)}
                zoomLevel={zoomLevel}
                columnMode={useColumns}
                dropCap={idx === 0 && v.verse === 1}
                searchTerm={searchTerm && highlightVerse === v.verse ? searchTerm : null}
                />
                ))}
          </div>
          );
        })()}
        {/* Colophon - column mode: centered across both columns; non-column: footer with line on top */}
        {!loading && !error && colophon && (
          <div onClick={(e) => {
            if (highlightSection === 'colophon') {
              setHighlightSection(null);
              // prevent default so it doesn't propagate to container click which ignores it anyway
            } else {
              setHighlightSection('colophon');
            }
          }} id="kjb-colophon-anchor" className={`${columnMode ? 'mt-6 mb-4' : 'mt-12 mb-4 border-t border-border pt-6'} text-center transition-colors duration-500 rounded-lg cursor-pointer ${highlightSection === 'colophon' ? 'bg-accent/20 ring-1 ring-accent/40 px-3 py-2' : ''}`}>
            <p
              className={`kjb-colophon text-sm text-muted-foreground leading-relaxed ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'}`}
              style={{ 
                fontStyle: 'normal',
                fontSize: `${zoomLevel / 100}rem`,
                breakInside: 'avoid'
              }}
              dangerouslySetInnerHTML={{ __html: renderColophonText(colophon, highlightSection === 'colophon' ? searchTerm : null) }}
            />
          </div>
        )}
      </div>



      {/* End-of-section text footers */}
      {!loading && !error && ((pos.abbr === 'MAL' && pos.chapter === 4) || (pos.abbr === 'REV' && pos.chapter === 22)) && (
        <div className="text-center mt-12 mb-4">
          <p className={`text-sm text-muted-foreground tracking-widest uppercase ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'}`} style={{ fontSize: `${zoomLevel / 100}rem`, fontStyle: 'normal' }}>
            {pos.abbr === 'MAL' ? 'The End of the Prophets' : 'The End'}
          </p>
        </div>
      )}

      {/* Print Footer */}
      {!loading && !error && (
        <div className="hidden print:block mt-8 pt-4 border-t border-border text-sm text-muted-foreground text-center">
          Printed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
        </div>
      )}

      {/* Bottom nav */}
      {!loading && !error && (
        <div className="print:hidden flex justify-between gap-2 mt-6 pt-6 border-t border-border pb-2 sm:mt-4 sm:pt-4">
          <button
            onClick={goPrev}
            disabled={isFirstChapterFirstBook}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 disabled:opacity-30 transition-colors min-h-[48px] touch-manipulation"
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
            onClick={() => goNext()}
            disabled={isLastChapterLastBook}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 disabled:opacity-30 transition-colors min-h-[48px] touch-manipulation"
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