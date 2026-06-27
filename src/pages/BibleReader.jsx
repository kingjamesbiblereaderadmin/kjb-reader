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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
import { usePinchZoom } from '@/hooks/usePinchZoom';

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
    const p = loadPosition();
    return { ...p, verse: null };
  });
  const [verses, setVerses] = useState([]);
  const [colophon, setColophon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightVerse, setHighlightVerse] = useState(pos.verse || null);
  const [highlightSection, setHighlightSection] = useState(null);
  const [highlightedVerses, setHighlightedVerses] = useState(new Set());
  const [verseCount, setVerseCount] = useState(0);

  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [showVersePicker, setShowVersePicker] = useState(false);
  const [flowMode, setFlowMode] = useState(() => {
    try {
      const v = localStorage.getItem('kjb-flow');
      if (v === 'line' || v === 'paragraph') return v;
      return localStorage.getItem('kjb-layout') === 'paragraph' ? 'paragraph' : 'line';
    } catch { return 'line'; }
  });
  const [columnOn, setColumnOn] = useState(() => {
    try {
      const v = localStorage.getItem('kjb-column');
      if (v === 'true') return true;
      if (v === 'false') return false;
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
  const [selectMode, setSelectMode] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState(new Set());
  const [filterMode, setFilterMode] = useState(false);
  const [fontFamily, setFontFamily] = useState(() => {
    try { return localStorage.getItem('kjb-reader-font-family') || 'serif'; } catch { return 'serif'; }
  });
  const [a11yFont, setA11yFont] = useState(getAccessibilityFont);
  const a11yActive = a11yFont !== 'default';

  useEffect(() => {
    if (a11yFont !== 'default' && fontFamily === 'cursive') {
      setFontFamily('serif');
      try { localStorage.setItem('kjb-reader-font-family', 'serif'); } catch {}
    }
  }, []);
  
  const [searchTerm, setSearchTerm] = useState(() => {
    try { return localStorage.getItem('kjb-search-term') || getSearchNav().term || null; } catch { return getSearchNav().term || null; }
  });
  const [searchResultIndex, setSearchResultIndex] = useState(() => {
    try { return parseInt(localStorage.getItem('kjb-search-index') || String(getSearchNav().index), 10); } catch { return getSearchNav().index; }
  });
  const [searchTotalResults, setSearchTotalResults] = useState(() => {
    try { const r = JSON.parse(localStorage.getItem('kjb-search-results') || '[]'); return r.length || getSearchNav().results.length; } catch { return getSearchNav().results.length; }
  });
  const searchClearedRef = useRef(false);
  const lastReadingClearedRef = useRef(false);
  // The reading position saved BEFORE a search jump, so closing the search
  // results returns the reader to where the user was reading.
  const preSearchPosRef = useRef(null);

  const [gospelMode, setGospelMode] = useState(false);
  const [gospelResultIndex, setGospelResultIndex] = useState(() => getGospelNav().index);
  const [gospelTotalResults, setGospelTotalResults] = useState(() => getGospelNav().results.length);

  const handleFontChange = (font) => {
    if (font === 'dyslexic' || font === 'hyperlegible') {
      setAccessibilityFont(font);
      setA11yFont(font);
      window.dispatchEvent(new Event('storage'));
      return;
    }
    try { localStorage.setItem('kjb-reader-font-family', font); } catch {}
    setFontFamily(font);
    applyReaderFont(font);
    if (a11yFont !== 'default') {
      setAccessibilityFont('default');
      setA11yFont('default');
    }
    window.dispatchEvent(new Event('storage'));
  };

  const getFontFamilyValue = (family) => {
    if (family === 'cursive') return "'Dancing Script', cursive";
    if (family === 'serif') return "'Merriweather', 'Cormorant Garamond', Georgia, serif";
    if (family === 'sans-serif') return "'Inter', system-ui, -apple-system, sans-serif";
    if (family === 'monospace') return "'Courier New', monospace";
    if (family === 'dyslexic') return "'OpenDyslexic', 'Comic Sans MS', sans-serif";
    if (family === 'hyperlegible') return "'Atkinson Hyperlegible', system-ui, sans-serif";
    return family;
  };

  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showFilterOverlay, setShowFilterOverlay] = useState(false);
  const [lastReadingPos, setLastReadingPos] = useState(() => {
    try {
      const saved = localStorage.getItem('kjb-last-reading');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure the indicator shows when returning from daily verse or random chapter
        if (parsed && (parsed.fromDailyVerse || parsed.fromRandom || parsed.prevAbbr)) {
          return parsed;
        }
      }
      return null;
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

  useEffect(() => {
    return () => {
      setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false);
      setShowZoomPopover(false); setShowFontPopover(false);
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
      setSelectMode(false); setSelectedVerses(new Set()); setFilterMode(false);
    } else {
      setSelectMode(true);
    }
  };

  const activateSelectFromVerse = (verseNum) => {
    setSelectMode(true);
    setSelectedVerses(new Set([parseInt(verseNum, 10)]));
  };

  const toggleVerseSelect = (verseNum) => {
    setSelectedVerses(prev => {
      const next = new Set(prev);
      const parsed = parseInt(verseNum, 10);
      next.has(parsed) ? next.delete(parsed) : next.add(parsed);
      return next;
    });
  };

  const selectAllVerses = () => {
    setSelectedVerses(new Set(verses.map(v => parseInt(v.verse, 10))));
  };

  const generateShareText = () => {
    const toUse = selectedVerses.size > 0 ? selectedVerses : new Set(verses.map(v => v.verse));
    const selectedVersesList = verses.filter(v => toUse.has(v.verse)).sort((a, b) => a.verse - b.verse);

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

    const subscriptKey = `${book.apiName}:${pos.chapter}`;
    const chapterSubscript = SUBSCRIPTS[subscriptKey] || null;
    const lastVerseNum = verses.length ? verses[verses.length - 1].verse : null;
    const blocks = groups.map((g) => {
      const range = formatVerseRange(g.map(v => v.verse));
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
    return blocks.join('\n\n———\n\n');
  };

  const handleCopySelected = async () => {
    const lines = generateShareText();
    
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
    setTimeout(() => setShowFilterOverlay(false), 3000);
  };

  const [shareFeedback, setShareFeedback] = useState(false);
  const handleShareChapter = async () => {
    const shareText = generateShareText();
    const hasSel = selectedVerses.size > 0;
    const ref = hasSel ? `${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}` : `${book.shortName} ${pos.chapter}`;
    try {
      if (navigator.share) return await navigator.share({ title: `${ref} — KJB Reader`, text: shareText });
    } catch (err) { if (err?.name === 'AbortError') return; }
    try {
      await navigator.clipboard.writeText(shareText);
      setShareFeedback(true);
      setTimeout(() => setShareFeedback(false), 1800);
    } catch {}
  };

  const [shareLinkFeedback, setShareLinkFeedback] = useState(false);
  const handleShareLink = async () => {
    const hasSel = selectedVerses.size > 0;
    const ref = hasSel ? `${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}` : `${book.shortName} ${pos.chapter}`;
    const url = buildVerseUrl({ abbr: pos.abbr, chapter: pos.chapter, verse: hasSel ? Math.min(...selectedVerses) : null, verseEnd: hasSel ? Math.max(...selectedVerses) : null });
    // Wrap the link in <> so chat apps don't render a link embed/preview.
    const shareText = `${ref} (KJB)\n\n<${url}>`;
    try {
      if (navigator.share) return await navigator.share({ title: `${ref} — KJB Reader`, text: shareText, url });
    } catch (err) { if (err?.name === 'AbortError') return; }
    try {
      await navigator.clipboard.writeText(shareText);
      setShareLinkFeedback(true);
      setTimeout(() => setShareLinkFeedback(false), 1800);
    } catch {}
  };

  const topRef = useRef(null);
  const readerContentRef = useRef(null);
  const setZoomPersist = useCallback((next) => {
    setZoomLevel(next);
    try { localStorage.setItem('kjb-zoom', String(next)); } catch {}
  }, []);
  usePinchZoom(readerContentRef, zoomLevel, setZoomPersist);
  const rangeHighlightRef = useRef(false);
  const resultViewRef = useRef('filter');
  const freshNavRef = useRef(false);
  const posRef = useRef(pos);
  useEffect(() => { posRef.current = pos; }, [pos]);
  const book = BIBLE_BOOKS.find(b => b.abbr === pos.abbr) || BIBLE_BOOKS[0];

  useReaderUrlSync(pos, loading);
  const isViewingTitlePage = pos.chapter === 0 && (pos.abbr === 'GEN' || pos.abbr === 'MAT');

  const loadChapter = useCallback(async (bookAbbr, chapter, jumpVerse) => {
    setLoading(true); setError(null); setVerses([]); setColophon(null);
    (document.getElementById('kjb-scroll') || window).scrollTo({ top: 0 });
    const b = BIBLE_BOOKS.find(bk => bk.abbr === bookAbbr);
    if (!b) { setError('Book not found'); setLoading(false); return; }
    if (!jumpVerse) setHighlightVerse(null);
    if (chapter === 0) {
      setVerseCount(0); setLoading(false); setHighlightVerse(jumpVerse || null);
      savePosition(bookAbbr, chapter);
      return;
    }
    try {
      const data = await fetchChapter(b.apiName, chapter);
      setVerses(data.verses); setColophon(data.colophon || null); setVerseCount(data.verses.length);
      if (jumpVerse) setHighlightVerse(jumpVerse);
      savePosition(bookAbbr, chapter, jumpVerse || null);
    } catch (err) {
      setError('Failed to load chapter. Please check your connection.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    getBibleData().catch(err => console.error('[BibleReader] Cache preload failed:', err));
    const initParams = new URLSearchParams(window.location.search);
    if (initParams.get('from') === 'search') {
      const { term, index, results } = getSearchNav();
      const urlTerm = initParams.get('q') || term;
      if (urlTerm) {
        searchClearedRef.current = false; setSearchTerm(urlTerm);
        setSearchResultIndex(index); setSearchTotalResults(results.length);
      }
    } else {
      clearSearchNav(); setSearchTerm(null);
    }
    if (initParams.get('from') === 'daily') {
      try {
        const saved = localStorage.getItem('kjb-last-reading');
        if (saved) setLastReadingPos(JSON.parse(saved));
      } catch {}
    }
    if (initParams.get('from') === 'gospel') {
      let g = getGospelNav();
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
        setGospelMode(true); setGospelResultIndex(g.index); setGospelTotalResults(g.results.length);
      }
    } else { clearGospelNav(); }
    
    const urlBook = initParams.get('book');
    const urlChapter = initParams.get('chapter');
    const urlVerse = initParams.get('verse');
    const urlTitlePage = initParams.get('titlePage');
    if (urlTitlePage === 'old' || urlTitlePage === 'new') {
      const abbr = urlTitlePage === 'new' ? 'MAT' : 'GEN';
      setPos({ abbr, chapter: 0, verse: null });
      loadChapter(abbr, 0, null);
      return;
    }
    if (initParams.get('from') === 'search' || initParams.get('from') === 'gospel') return;
    
    const urlBookObj = resolveBook(urlBook);
    if (urlBookObj && urlChapter) {
      const chapterNum = parseInt(urlChapter, 10);
      const verseNum = urlVerse ? parseInt(urlVerse, 10) : null;
      let verseEnd = null;
      try {
        const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (p.abbr === urlBookObj.abbr && p.chapter === chapterNum && p.verseEnd) verseEnd = p.verseEnd;
      } catch {}
      if (verseNum && verseEnd && verseEnd > verseNum) {
        const range = new Set();
        for (let v = verseNum; v <= verseEnd; v++) range.add(v);
        setSelectedVerses(range); setHighlightedVerses(range); setFilterMode(true);
      }
      setPos({ abbr: urlBookObj.abbr, chapter: chapterNum, verse: verseNum });
      setHighlightVerse(verseNum || null);
      loadChapter(urlBookObj.abbr, chapterNum, verseNum);
    } else {
      // No URL params (e.g. Home → Reader): restore the LAST saved position
      // AND its highlighted verse / range, not the default GEN 1.
      let restored = false;
      try {
        const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        if (p && p.abbr && p.chapter) {
          if (p.verse && p.verseEnd && p.verseEnd > p.verse) {
            const range = new Set();
            for (let v = p.verse; v <= p.verseEnd; v++) range.add(v);
            setSelectedVerses(range); setHighlightedVerses(range); setFilterMode(true);
          }
          setPos({ abbr: p.abbr, chapter: p.chapter, verse: p.verse || null });
          setHighlightVerse(p.verse || null);
          loadChapter(p.abbr, p.chapter, p.verse || null);
          restored = true;
        }
      } catch {}
      if (!restored) loadChapter(pos.abbr, pos.chapter, null);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(routerLocation.search);
    const urlTitlePage = urlParams.get('titlePage');
    if (urlTitlePage === 'old' || urlTitlePage === 'new') {
      const abbr = urlTitlePage === 'new' ? 'MAT' : 'GEN';
      setSearchTerm(null); setGospelMode(false); setFilterMode(false);
      setSelectedVerses(new Set()); setHighlightedVerses(new Set());
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
        setSelectedVerses(range); setHighlightedVerses(range); setFilterMode(true);
      } else {
        setFilterMode(false); setSelectedVerses(new Set()); setHighlightedVerses(new Set());
      }
      
      if (isFromGospel) {
        let g = getGospelNav();
        if (g.results.length === 0) {
          const results = getGospelResults();
          const idx = Math.max(0, results.findIndex(r => r.abbr === urlBookObj.abbr && r.chapter === chapterNum && r.verse === verseNum));
          setGospelNav(results, idx);
          g = { results, index: idx };
        }
        if (g.results.length > 0) {
          setGospelMode(true); setGospelResultIndex(g.index); setGospelTotalResults(g.results.length);
          if (g.results[g.index]) { stepToResult(g.results[g.index]); return; }
        }
      } else {
        setGospelMode(false); clearGospelNav();
      }
      
      if (isFromSearch) {
        let { term, index, results } = getSearchNav();
        const urlTerm = urlParams.get('q') || term;
        if (urlTerm && results.length === 0) {
          results = [{ abbr: urlBookObj.abbr, chapter: chapterNum, verse: verseNum, verseEnd: verseEnd || null }];
          index = 0; setSearchNav(results, index, urlTerm);
        }
        if (urlTerm) {
          searchClearedRef.current = false; setSearchTerm(urlTerm);
          setSearchResultIndex(index); setSearchTotalResults(results.length);
        }
        if (results[index]) { stepToResult(results[index]); return; }
      } else {
        searchClearedRef.current = true; clearSearchNav(); setSearchTerm(null);
        setSearchResultIndex(0); setSearchTotalResults(0);
      }
      
      if (posRef.current.abbr === urlBookObj.abbr && posRef.current.chapter === chapterNum && posRef.current.verse === verseNum && !isFromGospel) {
        return;
      }
      
      if (isFromDaily) {
        lastReadingClearedRef.current = false;
        try {
          const saved = localStorage.getItem('kjb-last-reading');
          if (saved) setLastReadingPos(JSON.parse(saved));
          else {
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

    try {
      const p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (p && p.abbr && p.chapter) {
        // Restore a previously highlighted verse or multi-verse range so coming
        // back to the Reader keeps the highlight, not just the chapter.
        if (p.verse && p.verseEnd && p.verseEnd > p.verse) {
          const range = new Set();
          for (let v = p.verse; v <= p.verseEnd; v++) range.add(v);
          setSelectedVerses(range); setHighlightedVerses(range); setFilterMode(true);
        } else {
          setFilterMode(false); setSelectedVerses(new Set()); setHighlightedVerses(new Set());
        }
        setPos({ abbr: p.abbr, chapter: p.chapter, verse: p.verse || null });
        setHighlightVerse(p.verse || null);
        loadChapter(p.abbr, p.chapter, p.verse || null);
      }
    } catch {}
    try {
      const saved = localStorage.getItem('kjb-last-reading');
      if (saved) setLastReadingPos(JSON.parse(saved));
    } catch {}

    const applyRequestedPosition = () => {
      let p;
      try { p = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch { return; }
      if (!p || !resolveBook(p.abbr)) return;
      const fromSearch = new URLSearchParams(window.location.search).get('from') === 'search';
      const nav = getSearchNav();
      if (fromSearch && nav.results.length > 0) {
        const cur = nav.results[nav.index] || nav.results[0];
        if (cur && cur.abbr === p.abbr && cur.chapter === p.chapter) {
          stepToResult(cur); return;
        }
      }
      if (p.verse && p.verseEnd && p.verseEnd > p.verse) {
        const range = new Set();
        for (let v = p.verse; v <= p.verseEnd; v++) range.add(v);
        setSelectedVerses(range); setHighlightedVerses(range); setFilterMode(true);
      } else {
        setFilterMode(false); setSelectedVerses(new Set()); setHighlightedVerses(new Set());
      }
      setPos({ abbr: p.abbr, chapter: p.chapter, verse: p.verse || null });
      setHighlightVerse(p.verse || null);
      loadChapter(p.abbr, p.chapter, p.verse || null);
    };
    window.addEventListener('kjb-navigate', applyRequestedPosition);
    return () => window.removeEventListener('kjb-navigate', applyRequestedPosition);
  }, [routerLocation.search, loadChapter]);

  const scrollToVerseEl = useCallback((verseNum) => {
    const verseEl = document.getElementById(`v${verseNum}`);
    if (!verseEl) return;
    const occ = posRef.current?.occurrence || 0;
    emphasizeOccurrence(verseEl.querySelectorAll('mark[data-occ]'), occ);
    const scroller = document.getElementById('kjb-scroll');
    const toolbarH = topRef.current ? topRef.current.getBoundingClientRect().height : 0;
    const stickyOffset = toolbarH + 48;
    const numEl = verseEl.querySelector('sup, .kjb-dropcap-num');
    let topRect = numEl ? numEl.getBoundingClientRect().top : verseEl.getBoundingClientRect().top;
    const heading = verseEl.querySelector('.font-bold.text-center');
    if (heading && heading.getBoundingClientRect().top < topRect) topRect = heading.getBoundingClientRect().top;
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
    // Restore the saved scroll position for this chapter. The content may not
    // have its full height yet right after a fresh mount/navigation, so we retry
    // across several frames AND observe the content for layout changes — this
    // prevents the scroll from collapsing to the top before the page is laid out.
    let saved = 0;
    try { saved = parseInt(localStorage.getItem(`kjb-scroll-${pos.abbr}-${pos.chapter}`) || '0', 10); } catch {}
    if (!saved || saved <= 0) return;
    const restore = () => {
      const scroller = document.getElementById('kjb-scroll');
      const target = scroller || window;
      const maxY = scroller
        ? scroller.scrollHeight - scroller.clientHeight
        : document.documentElement.scrollHeight - window.innerHeight;
      // Only restore once the page is tall enough to actually reach the saved Y.
      if (maxY >= saved - 4) { target.scrollTo({ top: saved }); return true; }
      return false;
    };
    const timers = [60, 200, 500, 1000, 1800, 3000].map(ms => setTimeout(restore, ms));
    const container = document.querySelector('.kjb-reader-content');
    let ro = null;
    if (container && window.ResizeObserver) { ro = new ResizeObserver(() => { if (restore()) ro && ro.disconnect(); }); ro.observe(container); }
    // Keep observing for longer so late layout shifts (fonts, images, large
    // chapters) still let the restore land instead of collapsing to the top.
    const tStop = setTimeout(() => ro && ro.disconnect(), 5000);
    return () => { timers.forEach(clearTimeout); clearTimeout(tStop); ro && ro.disconnect(); };
  }, [verses, loading, highlightVerse, highlightSection, pos.abbr, pos.chapter]);

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
    const t1 = setTimeout(scrollToSection, 250); const t2 = setTimeout(scrollToSection, 650);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [loading, highlightSection, verses, colophon, pos.abbr, pos.chapter]);

  useEffect(() => {
    if (loading || isViewingTitlePage) return;
    const key = `kjb-scroll-${pos.abbr}-${pos.chapter}`;
    const scroller = document.getElementById('kjb-scroll');
    const target = scroller || window;
    const getY = () => (scroller ? scroller.scrollTop : window.scrollY);
    let raf = null;
    // Write the current scroll position immediately (used on scroll-idle and
    // when the app is backgrounded/closed/unmounted, so the LAST position is
    // never lost to a dropped rAF callback).
    const flush = () => {
      if (raf) { cancelAnimationFrame(raf); raf = null; }
      try { localStorage.setItem(key, String(Math.round(getY()))); } catch {}
    };
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        try { localStorage.setItem(key, String(Math.round(getY()))); } catch {}
      });
    };
    // Flush the latest position whenever the page is hidden/closed. pagehide +
    // visibilitychange cover reload, tab close, app background, and PWA close —
    // cases where a pending rAF would otherwise never run.
    const onHide = () => flush();
    target.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onHide);
    document.addEventListener('visibilitychange', onHide);
    return () => {
      flush();
      target.removeEventListener('scroll', onScroll);
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onHide);
      document.removeEventListener('visibilitychange', onHide);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [loading, isViewingTitlePage, pos.abbr, pos.chapter]);

  useEffect(() => {
    const sync = () => {
      try { setZoomLevel(parseInt(localStorage.getItem('kjb-zoom') || '100')); } catch {}
      try { const f = localStorage.getItem('kjb-reader-font-family') || 'serif'; setFontFamily(f); applyReaderFont(f); } catch {}
      try { setA11yFont(getAccessibilityFont()); } catch {}
      // Re-read search context and last reading position so the indicator reappears on focus/storage change
      try {
        const term = localStorage.getItem('kjb-search-term');
        const results = JSON.parse(localStorage.getItem('kjb-search-results') || '[]');
        const index = parseInt(localStorage.getItem('kjb-search-index') || '0', 10);
        if (term && results.length > 0) {
          setSearchTerm(term);
          setSearchResultIndex(index);
          setSearchTotalResults(results.length);
        }
      } catch {}
      try {
        const saved = localStorage.getItem('kjb-last-reading');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && (parsed.fromDailyVerse || parsed.fromRandom || parsed.prevAbbr)) {
            setLastReadingPos(parsed);
          }
        }
      } catch {}
    };
    sync();
    window.addEventListener('storage', sync); window.addEventListener('focus', sync); window.addEventListener('kjb-fonts-changed', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('focus', sync); window.removeEventListener('kjb-fonts-changed', sync); };
  }, [routerLocation.pathname]);

  useEffect(() => {
    const refreshContext = () => {
      try {
        const { term, index, results } = getSearchNav();
        if (searchClearedRef.current && !term) return;
        if (term) searchClearedRef.current = false;
        setSearchTerm(term || null); setSearchResultIndex(index); setSearchTotalResults(results.length);
        if (lastReadingClearedRef.current) { setLastReadingPos(null); return; }
        const lastReading = localStorage.getItem('kjb-last-reading');
        setLastReadingPos(lastReading ? JSON.parse(lastReading) : null);
      } catch {}
    };
    window.addEventListener('focus', refreshContext);
    return () => { window.removeEventListener('focus', refreshContext); };
  }, []);

  useEffect(() => {
    if (!filterMode && selectedVerses.size === 0 && !rangeHighlightRef.current) {
      try {
        const current = JSON.parse(localStorage.getItem('kjb-position') || '{}');
        if (current.verse || current.verseEnd) localStorage.setItem('kjb-position', JSON.stringify({ ...current, verse: null, verseEnd: null }));
      } catch {}
      setHighlightedVerses(new Set());
    }
  }, [filterMode, selectedVerses]);

  const navigate = (newAbbr, newChapter, jumpVerse = null, fromDailyVerse = false, fromRandom = false, isAutoAdvance = false, section = null) => {
    if (newChapter === 0 && newAbbr !== 'GEN' && newAbbr !== 'MAT') return;
    searchClearedRef.current = true; clearSearchNav(); setSearchTerm(null); setSearchResultIndex(0); setSearchTotalResults(0);
    setGospelMode(false); clearGospelNav();
    
    savePosition(newAbbr, newChapter, jumpVerse);

    if ((fromDailyVerse || fromRandom) && pos.abbr && pos.chapter) {
      lastReadingClearedRef.current = false;
      // Capture the exact scroll position so clearing returns there precisely.
      const scroller = document.getElementById('kjb-scroll');
      const scrollY = scroller ? scroller.scrollTop : window.scrollY;
      const lastPos = { abbr: pos.abbr, chapter: pos.chapter, fromDailyVerse, fromRandom, scrollY };
      try { localStorage.setItem('kjb-last-reading', JSON.stringify(lastPos)); } catch {}
      setLastReadingPos(lastPos);
    } else {
      lastReadingClearedRef.current = true;
      try { localStorage.removeItem('kjb-last-reading'); } catch {}
      setLastReadingPos(null);
      if (routerLocation.search || window.location.search) {
        try { window.history.replaceState({}, '', '/read'); } catch {}
      }
    }
    resultViewRef.current = 'filter';
    if (!jumpVerse) {
      setHighlightVerse(null);
      setFilterMode(false);
      setSelectMode(false);
      setSelectedVerses(new Set());
      setHighlightedVerses(new Set());
      setShowFilterOverlay(false);
    }
    setHighlightSection(section);
    rangeHighlightRef.current = false; freshNavRef.current = true;
    const newPos = { abbr: newAbbr, chapter: newChapter, verse: jumpVerse };
    setPos(newPos);
    loadChapter(newAbbr, newChapter, jumpVerse);
    try {
      let url;
      if (newChapter === 0) url = `/read?titlePage=${newAbbr === 'MAT' ? 'new' : 'old'}`;
      else { url = `/read?book=${newAbbr}&chapter=${newChapter}`; if (jumpVerse) url += `&verse=${jumpVerse}`; if (section) url += `&highlight=${section}`; }
      routerNavigate(url, { replace: isAutoAdvance || false });
    } catch {}
  };

  const stepToResult = (r) => {
    // Remember where the user was reading BEFORE the first search jump, so
    // closing the search results can return them there. Only capture once per
    // search session (cleared in clearSearchContext).
    if (!preSearchPosRef.current) {
      try {
        // Capture the EXACT live scroll position now, so closing the search can
        // restore the precise pixel offset (the per-chapter saved key gets
        // overwritten when the result is in the same chapter the user was in).
        const scroller = document.getElementById('kjb-scroll');
        const exactY = scroller ? scroller.scrollTop : window.scrollY;
        // Prefer the pre-jump position stashed by SearchPage (kjb-pre-search) or
        // GospelPage (kjb-pre-jump) before they overwrote kjb-position with the
        // jump target. Fall back to the current position (covers in-reader
        // stepping where no stash exists yet).
        const stash = JSON.parse(localStorage.getItem('kjb-pre-search') || localStorage.getItem('kjb-pre-jump') || 'null');
        if (stash && stash.abbr && stash.chapter) {
          preSearchPosRef.current = { abbr: stash.abbr, chapter: stash.chapter, scrollY: typeof stash.scrollY === 'number' ? stash.scrollY : exactY };
        } else {
          const cur = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
          if (cur && cur.abbr && cur.chapter) {
            preSearchPosRef.current = { abbr: cur.abbr, chapter: cur.chapter, scrollY: exactY };
          }
        }
      } catch {}
    }
    const section = r.section || null;
    const targetVerse = section ? null : (r.verse || null);
    setHighlightSection(section);
    const useFilter = resultViewRef.current !== 'full';
    if (!section && r.verse && r.verseEnd && parseInt(r.verseEnd, 10) > parseInt(r.verse, 10)) {
      const start = parseInt(r.verse, 10); const end = parseInt(r.verseEnd, 10);
      const range = new Set(); for (let v = start; v <= end; v++) range.add(v);
      rangeHighlightRef.current = true; setHighlightedVerses(range); setSelectedVerses(range); setFilterMode(useFilter);
      try {
        const cur = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, abbr: r.abbr, chapter: r.chapter, verse: start, verseEnd: end }));
      } catch {}
    } else if (!section && targetVerse) {
      const parsedTarget = parseInt(targetVerse, 10); const single = new Set([parsedTarget]);
      rangeHighlightRef.current = true; setHighlightedVerses(single); setSelectedVerses(single); setFilterMode(useFilter);
      try {
        const cur = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, abbr: r.abbr, chapter: r.chapter, verse: parsedTarget, verseEnd: null }));
      } catch {}
    } else {
      rangeHighlightRef.current = false; setFilterMode(false); setHighlightedVerses(new Set()); setSelectedVerses(new Set());
      try {
        const cur = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, abbr: r.abbr, chapter: r.chapter, verse: r.verse || null, verseEnd: null }));
      } catch {}
    }
    const sameChapter = !loading && verses.length > 0 && posRef.current.abbr === r.abbr && posRef.current.chapter === r.chapter;
    const sameVerse = sameChapter && posRef.current.verse === targetVerse;
    setPos({ abbr: r.abbr, chapter: r.chapter, verse: targetVerse, occurrence: r.occurrence || 0 });
    setHighlightVerse(targetVerse);
    if (sameChapter) {
      if (sameVerse && targetVerse) scrollToOccurrence(targetVerse, r.occurrence || 0, topRef);
      return;
    }
    loadChapter(r.abbr, r.chapter, targetVerse);
  };

  // Single source of truth for "return to a previously-read chapter". Used by
  // every Clear/deselect path (search, daily verse, random) so they ALL land
  // back on the chapter at its saved scroll position — never the top. It clears
  // all overlay/highlight state and leaves freshNavRef false so the per-chapter
  // scroll-restore effect runs instead of forcing scroll-to-top.
  const returnToChapter = (abbr, chapter, exactY) => {
    if (!abbr || !chapter) return;
    setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set());
    setHighlightedVerses(new Set()); setHighlightVerse(null); setHighlightSection(null);
    setShowFilterOverlay(false);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ abbr, chapter, verse: null, verseEnd: null })); } catch {}
    // Seed the per-chapter scroll key with the EXACT pre-search offset so the
    // scroll-restore effect lands on the precise position the user left from.
    if (typeof exactY === 'number' && exactY > 0) {
      try { localStorage.setItem(`kjb-scroll-${abbr}-${chapter}`, String(Math.round(exactY))); } catch {}
    }
    try { window.history.replaceState({}, '', '/read'); } catch {}
    freshNavRef.current = false;
    setPos({ abbr, chapter, verse: null });
    loadChapter(abbr, chapter, null);
  };

  const clearSearchContext = () => {
    searchClearedRef.current = true; clearSearchNav(); setSearchTerm(null); setSearchResultIndex(0); setSearchTotalResults(0);
    // Return to the chapter the user was reading before they searched.
    const back = preSearchPosRef.current;
    preSearchPosRef.current = null;
    try { localStorage.removeItem('kjb-pre-search'); } catch {}
    if (back && back.abbr && back.chapter) {
      returnToChapter(back.abbr, back.chapter, back.scrollY);
    } else {
      setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set());
      setHighlightedVerses(new Set()); setHighlightVerse(null); setHighlightSection(null);
      setShowFilterOverlay(false);
    }
  };

  const goNext = (isAutoAdvance = false) => {
    if (pos.chapter < book.chapters) { navigate(pos.abbr, pos.chapter + 1, null, false, false, isAutoAdvance); }
    else { const next = getNextBook(pos.abbr); if (next) navigate(next.abbr, 1, null, false, false, isAutoAdvance); }
  };

  const goPrev = () => {
    if (pos.chapter > 1) { navigate(pos.abbr, pos.chapter - 1); }
    else if (pos.chapter === 1 && (pos.abbr === 'GEN' || pos.abbr === 'MAT')) { navigate(pos.abbr, 0); }
    else { const prev = getPrevBook(pos.abbr); if (prev) navigate(prev.abbr, prev.chapters); }
  };

  const anyMenuOpen = showBookPicker || showChapterPicker || showVersePicker || showZoomPopover || showFontPopover;
  const closeAllMenus = useCallback(() => {
    setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false);
    setShowZoomPopover(false); setShowFontPopover(false);
  }, []);

  // Close any open reader menu when the user clicks ANYWHERE outside the reader
  // toolbar / open popovers — including the app header bar buttons (search,
  // home, dark mode, 3-dot menu), which call stopPropagation and so never reach
  // the in-page backdrop. A capture-phase document listener catches them all.
  useEffect(() => {
    if (!anyMenuOpen) return;
    const onDocClick = (e) => {
      if (!e.target.closest('.kjb-reader-toolbar, .kjb-popover-panel, [role="menu"], [data-radix-popper-content-wrapper], [vaul-drawer], [data-vaul-drawer], [vaul-overlay], [data-vaul-overlay]')) {
        closeAllMenus();
      }
    };
    document.addEventListener('click', onDocClick, true);
    return () => document.removeEventListener('click', onDocClick, true);
  }, [anyMenuOpen, closeAllMenus]);

  const lastReadingActive = !!(lastReadingPos && !lastReadingPos.cleared && lastReadingPos.abbr === pos.abbr && lastReadingPos.chapter === pos.chapter);
  const isLastChapterLastBook = pos.abbr === 'REV' && pos.chapter === 22;
  const isFirstChapterFirstBook = pos.abbr === 'GEN' && pos.chapter === 0;
  const isGenesisChapterOne = pos.abbr === 'GEN' && pos.chapter === 1;

  return (
    <div onClick={(e) => { if (!e.target.closest('.kjb-verse-container, h1, h2, h3, .kjb-subscript, .kjb-colophon, #kjb-colophon-anchor, #kjb-subscript-anchor, button, a')) { setHighlightVerse(null); setHighlightSection(null); if (!selectMode) setHighlightedVerses(new Set()); } }} className={`w-full max-w-[120rem] mx-auto px-5 sm:px-8 lg:px-12 py-3 ${hideHeader ? 'pt-16' : ''}`}>
      {!hideHeader && (
        <div ref={topRef} className="print:hidden sticky top-0 z-[100] border-b border-border pb-4 pt-3 mb-8 relative shadow-sm -mx-5 sm:-mx-8 lg:-mx-12 px-5 sm:px-8 lg:px-12 bg-background before:content-[''] before:absolute before:bottom-full before:left-0 before:right-0 before:h-12 before:bg-background">
          <div
            onClickCapture={(e) => {
              // Tapping empty space inside the toolbar (the gaps/padding between
              // buttons, not a button or an open popover) closes any open menu.
              if (anyMenuOpen && !e.target.closest('button, [role="menu"], .kjb-popover-panel')) {
                closeAllMenus();
              }
            }}
            className="kjb-reader-toolbar flex flex-wrap items-stretch justify-stretch gap-3 w-full max-w-[120rem] mx-auto [&>button:not(.kjb-fixed-btn)]:flex-grow [&>button:not(.kjb-fixed-btn)]:basis-auto [&>div.relative]:flex-grow [&>div.relative>button]:w-full">
            <div className="relative flex">
              <button
                onClick={() => { setShowBookPicker(p => !p); setShowChapterPicker(false); setShowVersePicker(false); setShowZoomPopover(false); setShowFontPopover(false); }}
                className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-all duration-200 touch-manipulation h-11 w-full"
              >
                <span className="truncate text-center">{isViewingTitlePage ? 'Title Page' : book.shortName}</span>
                <ChevronRight className={`w-3 h-3 opacity-70 transition-transform duration-200 flex-shrink-0 ${showBookPicker ? 'rotate-90' : ''}`} />
              </button>
              {showBookPicker && !isMobile() && (
                <div className="kjb-popover-panel absolute top-full left-0 mt-1 z-[100]">
                  <BookSelector
                    currentAbbr={pos.abbr}
                    onSelect={(b, isTitlePage, showChapter) => {
                      if (isTitlePage) { navigate(b.abbr, 0); setShowBookPicker(false); }
                      else if (showChapter) { navigate(b.abbr, 1); setShowBookPicker(false); setShowChapterPicker(true); }
                    }}
                    onClose={() => setShowBookPicker(false)}
                  />
                </div>
              )}
              <SelectorSheet open={showBookPicker && isMobile()} onClose={() => setShowBookPicker(false)} title="Select Book">
                <BookSelector
                  currentAbbr={pos.abbr}
                  onSelect={(b, isTitlePage, showChapter) => {
                    if (isTitlePage) { navigate(b.abbr, 0); setShowBookPicker(false); }
                    else if (showChapter) { navigate(b.abbr, 1); setShowBookPicker(false); setShowChapterPicker(true); }
                  }}
                  onClose={() => setShowBookPicker(false)}
                />
              </SelectorSheet>
            </div>

            {!isViewingTitlePage && (
              <>
              <div className="relative flex">
                <button
                  onClick={() => { setShowChapterPicker(p => !p); setShowBookPicker(false); setShowVersePicker(false); setShowZoomPopover(false); setShowFontPopover(false); }}
                  className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-all duration-200 touch-manipulation h-11 w-full"
                >
                  <span>Ch.{pos.chapter}</span>
                  <ChevronRight className={`w-3 h-3 opacity-70 transition-transform duration-200 flex-shrink-0 ${showChapterPicker ? 'rotate-90' : ''}`} />
                </button>
                {showChapterPicker && !isMobile() && (
                  <div className="kjb-popover-panel absolute top-full left-0 mt-1 z-[100]">
                    <ChapterSelector
                      totalChapters={book.chapters}
                      currentChapter={pos.chapter}
                      onSelect={(ch, showVerse) => { navigate(pos.abbr, ch); setShowChapterPicker(false); if (showVerse) setShowVersePicker(true); }}
                      onClose={() => setShowChapterPicker(false)}
                    />
                  </div>
                )}
                <SelectorSheet open={showChapterPicker && isMobile()} onClose={() => setShowChapterPicker(false)} title={`${book.shortName} — Select Chapter`}>
                  <ChapterSelector
                    totalChapters={book.chapters}
                    currentChapter={pos.chapter}
                    onSelect={(ch, showVerse) => { navigate(pos.abbr, ch); setShowChapterPicker(false); if (showVerse) setShowVersePicker(true); }}
                    onClose={() => setShowChapterPicker(false)}
                  />
                </SelectorSheet>
              </div>

              <div className="relative flex">
                <button
                  onClick={() => { setShowVersePicker(p => !p); setShowBookPicker(false); setShowChapterPicker(false); setShowZoomPopover(false); setShowFontPopover(false); }}
                  className={`flex items-center justify-center gap-1.5 px-3 rounded-lg border border-border font-sans text-sm font-medium transition-all duration-200 touch-manipulation h-11 w-full ${
                    selectMode ? 'bg-primary text-primary-foreground' : filterMode && selectedVerses.size > 0 ? 'bg-accent/20 text-accent' : highlightVerse ? 'bg-accent/20 text-accent' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                  }`}
                  disabled={verseCount === 0}
                >
                  <span className="truncate min-w-[3.5rem] text-center">
                    {selectMode ? `${selectedVerses.size > 0 ? selectedVerses.size : '0'} selected` : filterMode && selectedVerses.size > 0 ? `vv.${formatVerseRange([...selectedVerses])}` : highlightSection === 'colophon' ? 'Colophon' : highlightSection === 'subscript' ? 'Subscript' : highlightVerse ? `v.${highlightVerse}` : 'Verse'}
                  </span>
                  {selectMode ? <CheckSquare className="w-3.5 h-3.5 opacity-70 flex-shrink-0 transition-transform duration-200" /> : <ChevronRight className={`w-3 h-3 opacity-70 transition-transform duration-200 flex-shrink-0 ${showVersePicker ? 'rotate-90' : ''}`} />}
                </button>
                {showVersePicker && verseCount > 0 && !isMobile() && (
                  <div className="kjb-popover-panel absolute top-full left-0 mt-1 z-[100]">
                    <VerseSelector
                      totalVerses={verseCount}
                      currentVerse={highlightVerse}
                      multiSelect={true}
                      hasSubscript={!!SUBSCRIPTS[`${book.apiName}:${pos.chapter}`]}
                      hasColophon={!!colophon}
                      onSelect={(v) => {
                        if (v && v.section) { navigate(pos.abbr, pos.chapter, null, false, false, false, v.section); setShowVersePicker(false); return; }
                        const first = Array.isArray(v) ? v[0] : v;
                        if (Array.isArray(v) && v.length > 1) { const range = new Set(v); setSelectedVerses(range); setHighlightedVerses(range); setSelectMode(false); setFilterMode(true); }
                        navigate(pos.abbr, pos.chapter, first); setShowVersePicker(false);
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
                      if (Array.isArray(v) && v.length > 1) { const range = new Set(v); setSelectedVerses(range); setHighlightedVerses(range); setSelectMode(false); setFilterMode(true); }
                      navigate(pos.abbr, pos.chapter, first); setShowVersePicker(false);
                    }}
                    onClose={() => setShowVersePicker(false)}
                  />
                </SelectorSheet>
              </div>

              <div className="relative flex">
              <button
                onClick={() => { setShowZoomPopover(p => !p); setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false); setShowFontPopover(false); }}
                title={`Zoom: ${zoomLevel}%`}
                className="flex items-center justify-center gap-1 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all duration-200 touch-manipulation h-11 whitespace-nowrap"
              >
                <ZoomIn className="w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0" />
                <span className="truncate">{zoomLevel}%</span>
              </button>
              {showZoomPopover && !isMobile() && (
                <div className="kjb-popover-panel absolute top-full right-0 mt-1 z-[100]" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-card border border-border rounded-xl shadow-xl p-4 w-64 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3 pr-6">
                      <span className="font-sans text-xs font-medium text-foreground">Text Size</span>
                      <span className="font-sans text-xs font-semibold text-primary">{zoomLevel}%</span>
                    </div>
                    <button onClick={() => setShowZoomPopover(false)} className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
                    <div className="flex items-center gap-2 mb-2">
                      <button onClick={() => adjustZoom(-5)} className="p-1.5 rounded-lg bg-secondary hover:bg-accent/20 transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                      <input type="range" min="75" max="250" step="5" value={zoomLevel} onChange={handleZoomChange} className="flex-1 h-2 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer accent-primary" />
                      <button onClick={() => adjustZoom(5)} className="p-1.5 rounded-lg bg-secondary hover:bg-accent/20 transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    {zoomLevel !== 100 && (
                      <button onClick={() => { setZoomLevel(100); try { localStorage.setItem('kjb-zoom', '100'); } catch {} }} className="w-full mt-2 px-2 py-1.5 rounded-lg bg-primary/10 text-primary font-sans text-xs font-medium hover:bg-primary/20 transition-colors">Reset to 100%</button>
                    )}
                  </div>
                </div>
              )}
              <SelectorSheet open={showZoomPopover && isMobile()} onClose={() => setShowZoomPopover(false)} title="Text Size">
                <div className="space-y-4 p-2">
                  <div className="flex items-center justify-between">
                    <span className="font-sans text-sm font-medium text-foreground">Zoom Level</span>
                    <span className="font-sans text-sm font-semibold text-primary">{zoomLevel}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => adjustZoom(-5)} className="p-2 rounded-lg bg-secondary hover:bg-accent/20 transition-colors"><Minus className="w-4 h-4" /></button>
                    <input type="range" min="75" max="250" step="5" value={zoomLevel} onChange={handleZoomChange} className="flex-1 h-3 bg-muted-foreground/30 rounded-lg appearance-none cursor-pointer accent-primary" />
                    <button onClick={() => adjustZoom(5)} className="p-2 rounded-lg bg-secondary hover:bg-accent/20 transition-colors"><Plus className="w-4 h-4" /></button>
                  </div>
                  {zoomLevel !== 100 && (
                    <button onClick={() => { setZoomLevel(100); try { localStorage.setItem('kjb-zoom', '100'); } catch {} }} className="w-full px-4 py-3 rounded-lg bg-primary/10 text-primary font-sans text-sm font-medium hover:bg-primary/20 transition-colors">Reset to 100%</button>
                  )}
                </div>
              </SelectorSheet>
              </div>

              <div className="relative flex">
              <button
                onClick={() => { setShowFontPopover(p => !p); setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false); setShowZoomPopover(false); }}
                title="Font family"
                className="flex items-center justify-center gap-1 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all duration-200 touch-manipulation h-11 whitespace-nowrap"
              >
                <Type className="w-3.5 h-3.5 transition-transform duration-200 flex-shrink-0" />
                <span className="hidden sm:inline">{(() => { const active = a11yActive ? a11yFont : fontFamily; return active === 'serif' ? 'Serif' : active === 'sans-serif' ? 'Sans' : active === 'monospace' ? 'Mono' : active === 'dyslexic' ? 'Dyslexic' : active === 'hyperlegible' ? 'Legible' : 'Cursive'; })()}</span>
              </button>
              {showFontPopover && !isMobile() && (
                <div className="kjb-popover-panel absolute top-full left-0 mt-1 z-[100]" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-card border border-border rounded-xl shadow-xl p-4 w-64 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3 pr-6"><span className="font-sans text-xs font-medium text-foreground">Font Family</span></div>
                    <button onClick={() => setShowFontPopover(false)} className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"><X className="w-4 h-4" /></button>
                    {a11yActive && <p className="font-sans text-[11px] text-muted-foreground mb-2 leading-snug">An accessibility font is active app-wide and overrides reading fonts.</p>}
                    <div className="grid grid-cols-2 gap-2">
                      {[ { value: 'serif', label: 'Serif' }, { value: 'sans-serif', label: 'Sans' }, { value: 'monospace', label: 'Mono' }, { value: 'cursive', label: 'Cursive' }, { value: 'dyslexic', label: 'Dyslexic' }, { value: 'hyperlegible', label: 'Legible' } ].map(font => {
                        const isA11yChoice = font.value === 'dyslexic' || font.value === 'hyperlegible';
                        const isActive = a11yActive ? a11yFont === font.value : fontFamily === font.value;
                        const isDisabled = a11yActive && !isA11yChoice;
                        return (
                        <button key={font.value} disabled={isDisabled} onClick={() => { handleFontChange(font.value); setShowFontPopover(false); }} className={`px-3 py-2 rounded-lg border font-sans text-xs font-medium transition-all ${ isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:bg-accent/20' } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`} style={{ fontFamily: getFontFamilyValue(font.value) }}>{font.label}</button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              <SelectorSheet open={showFontPopover && isMobile()} onClose={() => setShowFontPopover(false)} title="Font Family">
                <div className="space-y-2 p-2">
                  {a11yActive && <p className="font-sans text-xs text-muted-foreground leading-snug mb-1">An accessibility font is active app-wide and overrides reading fonts.</p>}
                  {[ { value: 'serif', label: 'Serif' }, { value: 'sans-serif', label: 'Sans' }, { value: 'monospace', label: 'Mono' }, { value: 'cursive', label: 'Cursive' }, { value: 'dyslexic', label: 'Dyslexic' }, { value: 'hyperlegible', label: 'Legible' } ].map(font => {
                    const isA11yChoice = font.value === 'dyslexic' || font.value === 'hyperlegible';
                    const isActive = a11yActive ? a11yFont === font.value : fontFamily === font.value;
                    const isDisabled = a11yActive && !isA11yChoice;
                    return (
                    <button key={font.value} disabled={isDisabled} onClick={() => { handleFontChange(font.value); setShowFontPopover(false); }} className={`w-full px-4 py-3 rounded-lg border font-sans text-sm font-medium transition-all ${ isActive ? 'bg-primary text-primary-foreground border-primary' : 'bg-secondary text-secondary-foreground border-border hover:bg-accent/20' } ${isDisabled ? 'opacity-40 pointer-events-none' : ''}`} style={{ fontFamily: getFontFamilyValue(font.value) }}>{font.label}</button>
                    );
                  })}
                </div>
              </SelectorSheet>
              </div>

              <button onClick={toggleFlow} title={flowMode === 'line' ? 'Switch to paragraph' : 'Switch to line-by-line'} className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all duration-200 touch-manipulation h-11 min-w-[44px] whitespace-nowrap">{flowMode === 'line' ? <List className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /> : <AlignJustify className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />}<span className="hidden lg:inline">{flowMode === 'line' ? 'Lines' : 'Para'}</span></button>
              <button onClick={toggleColumn} title={columnOn ? 'Switch to single column' : 'Switch to two-column'} className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-all duration-200 touch-manipulation h-11 min-w-[44px] whitespace-nowrap">{columnOn ? <Columns2 className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /> : <AlignLeft className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />}<span className="hidden lg:inline">{columnOn ? '2-Col' : '1-Col'}</span></button>
              <button onClick={toggleSelectMode} title="Select verses" className={`flex items-center justify-center gap-1.5 px-3 rounded-lg border border-border font-sans text-xs font-medium transition-all duration-200 touch-manipulation h-11 min-w-[44px] whitespace-nowrap ${selectMode ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'}`}><CheckSquare className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /><span className="hidden lg:inline">Select</span></button>
              
              <DropdownMenu onOpenChange={(open) => { if (open) closeAllMenus(); }}>
                <DropdownMenuTrigger asChild>
                  <button title={shareFeedback || shareLinkFeedback ? 'Copied!' : 'Share'} className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border text-secondary-foreground hover:bg-accent/20 transition-all duration-200 touch-manipulation h-11 min-w-[44px] whitespace-nowrap">
                    <Share2 className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
                    <span className="hidden lg:inline">{shareFeedback || shareLinkFeedback ? 'Copied!' : 'Share'}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  <DropdownMenuItem onClick={handleShareChapter} className="cursor-pointer">
                    <AlignLeft className="w-4 h-4 mr-2" />
                    Share Text
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShareLink} className="cursor-pointer">
                    <Share2 className="w-4 h-4 mr-2" />
                    Share Link Only
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                onClick={() => printChapterContents(verses, book, pos, filterMode, selectedVerses, colophon, columnMode, paragraphMode)}
                title="Print"
                className="kjb-fixed-btn flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation h-11 whitespace-nowrap"
              >
                <Printer className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />
                <span className="hidden lg:inline">Print</span>
              </button>

              <div className="flex gap-2 flex-shrink-0">
                <button onClick={goPrev} disabled={isFirstChapterFirstBook} className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-30 transition-all duration-200 touch-manipulation h-11 whitespace-nowrap"><ChevronLeft className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /><span className="hidden lg:inline">Prev</span></button>
                <button onClick={() => goNext()} disabled={isLastChapterLastBook} className="flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-30 transition-all duration-200 touch-manipulation h-11 whitespace-nowrap"><span className="hidden lg:inline">Next</span><ChevronRight className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /></button>
              </div>
              <button onClick={toggleFullscreen} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} className="kjb-fixed-btn flex items-center justify-center gap-1.5 px-3 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation h-11 whitespace-nowrap">{fullscreen ? <Minimize2 className="w-5 h-5 transition-transform duration-200 flex-shrink-0" /> : <Maximize2 className="w-5 h-5 transition-transform duration-200 flex-shrink-0" />}<span className="hidden lg:inline">{fullscreen ? 'Exit' : 'Full Screen'}</span></button>
              <button onClick={(e) => { e.stopPropagation(); setHideHeader(!hideHeader); }} title={hideHeader ? "Show header" : "Hide header"} className="kjb-fixed-btn flex items-center justify-center px-2.5 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation h-11 min-w-[44px] whitespace-nowrap flex-shrink-0"><ChevronDown className={`w-5 h-5 transition-transform duration-200 flex-shrink-0 ${hideHeader ? '' : 'rotate-180'}`} /></button>

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
                      const prevIndex = (index - 1 + results.length) % results.length;
                      const r = results[prevIndex];
                      if (r) { setGospelIndex(prevIndex); setGospelResultIndex(prevIndex); stepToResult(r); }
                      return;
                    }
                    const { results, index } = getSearchNav();
                    if (results.length === 0) return;
                    const prevIndex = (index - 1 + results.length) % results.length;
                    const r = results[prevIndex];
                    if (r) { setSearchIndex(prevIndex); setSearchResultIndex(prevIndex); stepToResult(r); }
                  }}
                  onNextResult={() => {
                    if (gospelMode) {
                      const { results, index } = getGospelNav();
                      if (results.length === 0) return;
                      const nextIndex = (index + 1) % results.length;
                      const r = results[nextIndex];
                      if (r) { setGospelIndex(nextIndex); setGospelResultIndex(nextIndex); stepToResult(r); }
                      return;
                    }
                    const { results, index } = getSearchNav();
                    if (results.length === 0) return;
                    const nextIndex = (index + 1) % results.length;
                    const r = results[nextIndex];
                    if (r) { setSearchIndex(nextIndex); setSearchResultIndex(nextIndex); stepToResult(r); }
                  }}
                  onClear={() => {
                    if (gospelMode) {
                      clearGospelNav(); setGospelMode(false);
                      // Return to where the user was reading before the gospel jump
                      // (captured in preSearchPosRef by stepToResult), at its saved
                      // scroll position — same robust path as search/daily/random.
                      const back = preSearchPosRef.current;
                      preSearchPosRef.current = null;
                      try { localStorage.removeItem('kjb-pre-jump'); } catch {}
                      if (back && back.abbr && back.chapter) {
                        returnToChapter(back.abbr, back.chapter, back.scrollY);
                      } else {
                        setHighlightVerse(null); setHighlightSection(null);
                        try { window.history.replaceState({}, '', '/read'); } catch {}
                      }
                      return;
                    }
                    if (searchTerm) {
                      clearSearchContext();
                    } else if (lastReadingPos && lastReadingPos.abbr && lastReadingPos.chapter && !lastReadingPos.cleared) {
                      const abbr = lastReadingPos.prevAbbr || lastReadingPos.abbr;
                      const chapter = lastReadingPos.prevChapter || lastReadingPos.chapter;
                      lastReadingClearedRef.current = true; searchClearedRef.current = true;
                      setLastReadingPos(null);
                      try { localStorage.removeItem('kjb-last-reading'); } catch {}
                      // Returning to the chapter you were reading before the daily
                      // verse / random jump — restore its exact saved scroll position.
                      returnToChapter(abbr, chapter, typeof lastReadingPos.scrollY === 'number' ? lastReadingPos.scrollY : undefined);
                    } else if (filterMode && selectedVerses.size > 0) {
                      setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set());
                      setHighlightVerse(null); setShowFilterOverlay(false);
                    } else {
                      setHighlightVerse(null); setFilterMode(false); setSelectedVerses(new Set()); setShowFilterOverlay(false);
                    }
                  }}
                />
              )}
            </>
            )}

            {isViewingTitlePage && (
              <>
                <button onClick={goPrev} disabled={isFirstChapterFirstBook} title="Previous" className="flex flex-1 items-center justify-center gap-1.5 px-2.5 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground disabled:opacity-30 transition-all duration-200 touch-manipulation h-11 min-w-[44px]"><ChevronLeft className="w-5 h-5 flex-shrink-0" /><span className="hidden lg:inline">Prev</span></button>
                <button onClick={() => goNext()} title="Next" className="flex flex-1 items-center justify-center gap-1.5 px-2.5 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation h-11 min-w-[44px]"><span className="hidden lg:inline">Next</span><ChevronRight className="w-5 h-5 flex-shrink-0" /></button>
                <button onClick={toggleFullscreen} title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'} className="flex flex-1 items-center justify-center gap-1.5 px-2.5 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation h-11 min-w-[44px]">{fullscreen ? <Minimize2 className="w-5 h-5 flex-shrink-0" /> : <Maximize2 className="w-5 h-5 flex-shrink-0" />}<span className="hidden lg:inline">{fullscreen ? 'Exit' : 'Full'}</span></button>
                <button onClick={(e) => { e.stopPropagation(); setHideHeader(!hideHeader); }} title={hideHeader ? "Show header" : "Hide header"} className="flex items-center justify-center px-2.5 rounded-lg bg-secondary border border-border hover:bg-accent/20 text-foreground transition-all duration-200 touch-manipulation h-11 min-w-[44px] flex-shrink-0"><ChevronDown className={`w-5 h-5 flex-shrink-0 ${hideHeader ? '' : 'rotate-180'}`} /></button>
              </>
            )}
          </div>

          {selectMode && (
            <SelectActionBar
              selectedCount={selectedVerses.size} totalVerses={verses.length} copyFeedback={copyFeedback} shareFeedback={shareFeedback} shareLinkFeedback={shareLinkFeedback}
              onSelectAll={selectAllVerses} onCancel={toggleSelectMode} onCopy={handleCopySelected} onShareText={handleShareChapter} onShareLink={handleShareLink}
              onReadSelected={handleReadSelected} onShowFull={() => { setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set()); setShowFilterOverlay(false); }}
              onPrintPage={() => window.print()} onPrintContents={() => printChapterContents(verses, book, pos, true, selectedVerses, colophon, columnMode, paragraphMode)}
            />
          )}

          {!selectMode && selectedVerses.size > 0 && (
            <ReadingRangeBar
              label={`Reading ${book.shortName} ${pos.chapter}:${formatVerseRange([...selectedVerses])}`}
              filterMode={filterMode} copyFeedback={copyFeedback} shareFeedback={shareFeedback} shareLinkFeedback={shareLinkFeedback}
              onCopy={handleCopySelected} onShareText={handleShareChapter} onShareLink={handleShareLink} onPrintPage={() => window.print()}
              onPrintContents={() => printChapterContents(verses, book, pos, filterMode, selectedVerses, colophon, columnMode, paragraphMode)}
              onToggleView={() => {
                setFilterMode(prev => {
                  const next = !prev; rangeHighlightRef.current = next; resultViewRef.current = next ? 'filter' : 'full';
                  if (!next && selectedVerses.size > 0) {
                    const first = Math.min(...selectedVerses); setHighlightVerse(first);
                    setTimeout(() => scrollToVerseEl(first), 80); setTimeout(() => scrollToVerseEl(first), 350);
                  }
                  return next;
                });
              }}
              onClear={() => { rangeHighlightRef.current = false; setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set()); setHighlightedVerses(new Set()); setShowFilterOverlay(false); }}
            />
          )}
        </div>
      )}

      {hideHeader && <MinimizedHeaderBar fullscreen={fullscreen} toggleFullscreen={toggleFullscreen} setHideHeader={setHideHeader} />}

      {/* Desktop-only backdrop for the inline popovers. On mobile the selectors
          use the Vaul drawer (SelectorSheet), which has its own overlay — rendering
          this backdrop there would intercept the first tap and close the sheet. */}
      {!isMobile() && (showBookPicker || showChapterPicker || showVersePicker || showZoomPopover || showFontPopover) && (
        <div
          className="fixed inset-0 z-[99]"
          onClick={() => { setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false); setShowZoomPopover(false); setShowFontPopover(false); }}
        />
      )}

      {!isViewingTitlePage && (
        <div className={`text-center mb-6 pt-8 ${(!columnMode || pos.chapter === 1) ? '' : 'hidden print:block'}`} style={{ fontSize: `${zoomLevel / 100}rem` }}>
          <h1 className={`${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'} text-3xl md:text-4xl font-bold text-foreground mb-2 leading-tight`} style={{ fontStyle: 'normal', fontWeight: '900' }}>{book.name}</h1>
          <p className={`font-sans text-muted-foreground tracking-widest uppercase mt-5 ${fontFamily === 'cursive' ? 'cursive-em-style' : ''}`} style={{ fontStyle: 'normal', fontSize: `${zoomLevel / 100 * 0.875}rem`, fontWeight: fontFamily === 'cursive' ? '400' : undefined }}>
            Chapter {pos.chapter}
          </p>
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

      <div 
        ref={readerContentRef}
        className={`kjb-reader-content leading-loose text-foreground ${fontFamily === 'cursive' ? 'cursive-em-style' : ''}`}
        style={{ fontSize: `${zoomLevel / 100 * 1.125}rem`, lineHeight: zoomLevel > 100 ? '1.8' : '1.6', ...(fontFamily !== 'cursive' ? { fontFamily: getFontFamilyValue(fontFamily) } : {}) }}
      >
        {loading && <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div>}
        {error && <div className="text-center py-16 text-destructive font-sans">{error}</div>}
        {!loading && !error && isViewingTitlePage && (
          <div style={{ fontFamily: "'Merriweather', 'Cormorant Garamond', Georgia, serif" }} className="[&_*]:!font-serif"><TitlePage type={pos.abbr === 'GEN' ? 'testament-old' : 'testament-new'} /></div>
        )}
        {!loading && !error && verses.length > 0 && columnMode && !isViewingTitlePage && pos.chapter !== 1 && (
          <RunningHead bookName={book.name} chapter={pos.chapter} baseFontRem={zoomLevel / 100 * 0.7} isCursive={fontFamily === 'cursive'} />
        )}
        {!loading && !error && verses.length > 0 && (() => {
          // selectedVerses may contain numbers (restored from localStorage) while
          // v.verse can be a string from the cached Bible data. Coerce both so the
          // filter matches — otherwise every verse is filtered out and only the
          // chapter heading / reference shows with no verse text.
          const verseInSelection = (v) => selectedVerses.has(parseInt(v.verse, 10)) || selectedVerses.has(String(v.verse));
          // Only actually filter when there's a real selection — never blank the
          // whole chapter (which left just the reference/highlight visible).
          const activeFilter = filterMode && selectedVerses.size > 0;
          const shownCount = activeFilter ? verses.filter(verseInSelection).length : verses.length;
          const useColumns = columnMode && shownCount > 6;
          return (
          <div className={`${useColumns ? 'kjb-two-col text-left hyphens-auto' : 'text-left'} ${paragraphMode ? 'text-left px-2 sm:px-4' : ''}`} style={useColumns ? { fontSize: 'inherit', columnCount: 2, columnGap: '1.5rem', columnRule: '1px solid hsl(var(--border))' } : { fontSize: 'inherit' }}>
            {columnMode && !isViewingTitlePage && SUBSCRIPTS[`${book.apiName}:${pos.chapter}`] && (
              <p onClick={() => setHighlightSection(s => s === 'subscript' ? null : 'subscript')} id="kjb-subscript-anchor" className={`kjb-subscript text-center text-muted-foreground mb-4 leading-relaxed transition-colors duration-500 rounded-lg cursor-pointer ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'} ${highlightSection === 'subscript' ? 'bg-accent/20 ring-1 ring-accent/40 px-3 py-2' : ''}`} style={{ fontStyle: 'normal', fontSize: `${zoomLevel / 100}rem`, breakInside: 'avoid' }} dangerouslySetInnerHTML={{ __html: renderSubscriptText(SUBSCRIPTS[`${book.apiName}:${pos.chapter}`], highlightSection === 'subscript' ? searchTerm : null) }} />
            )}
            {verses.filter(v => !activeFilter || verseInSelection(v)).map((v, idx) => (
              <VerseText
                key={`${pos.abbr}-${pos.chapter}-${v.verse}`} verse={v} highlight={parseInt(highlightVerse, 10) === parseInt(v.verse, 10) || highlightedVerses.has(parseInt(v.verse, 10))}
                id={`v${v.verse}`} bookName={book.name} abbr={pos.abbr} chapter={pos.chapter} isFirstVerse={idx === 0} paragraphMode={paragraphMode} selectMode={selectMode}
                isSelected={selectedVerses.has(parseInt(v.verse, 10)) || selectedVerses.has(String(v.verse))} onSelect={toggleVerseSelect} onActivateSelect={activateSelectFromVerse} totalVerses={verseCount}
                colophon={verses.length > 0 && String(v.verse) === String(verses[verses.length - 1].verse) ? colophon : null}
                subscript={parseInt(v.verse, 10) === 1 ? (SUBSCRIPTS[`${book.apiName}:${pos.chapter}`] || null) : null}
                isCursive={fontFamily === 'cursive'} fontFamilyValue={getFontFamilyValue(fontFamily)} zoomLevel={zoomLevel} columnMode={useColumns} dropCap={idx === 0 && parseInt(v.verse, 10) === 1}
                searchTerm={searchTerm && parseInt(highlightVerse, 10) === parseInt(v.verse, 10) ? searchTerm : null}
              />
            ))}
          </div>
          );
        })()}
        {!loading && !error && colophon && (
          <div onClick={() => { setHighlightSection(highlightSection === 'colophon' ? null : 'colophon'); }} id="kjb-colophon-anchor" className={`${columnMode ? 'mt-6 mb-4' : 'mt-12 mb-4 border-t border-border pt-6'} text-center transition-colors duration-500 rounded-lg cursor-pointer ${highlightSection === 'colophon' ? 'bg-accent/20 ring-1 ring-accent/40 px-3 py-2' : ''}`}>
            <p className={`kjb-colophon text-sm text-muted-foreground leading-relaxed ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'}`} style={{ fontStyle: 'normal', fontSize: `${zoomLevel / 100}rem`, breakInside: 'avoid' }} dangerouslySetInnerHTML={{ __html: renderColophonText(colophon, highlightSection === 'colophon' ? searchTerm : null) }} />
          </div>
        )}
      </div>

      {!loading && !error && ((pos.abbr === 'MAL' && pos.chapter === 4) || (pos.abbr === 'REV' && pos.chapter === 22)) && (
        <div className="text-center mt-12 mb-10"><p className={`text-sm text-muted-foreground tracking-widest uppercase ${fontFamily === 'cursive' ? 'cursive-em-style' : 'font-serif'}`} style={{ fontSize: `${zoomLevel / 100}rem`, fontStyle: 'normal' }}>{pos.abbr === 'MAL' ? 'The End of the Prophets' : 'The End'}</p></div>
      )}

      {!loading && !error && (
        <div className="hidden print:block mt-8 pt-4 border-t border-border text-sm text-muted-foreground text-center">Printed on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</div>
      )}

      {!loading && !error && (
        <div className="print:hidden flex flex-nowrap justify-between gap-2 mt-8 pt-6 border-t border-border pb-2">
          {!isFirstChapterFirstBook ? (
          <button onClick={goPrev} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors min-h-[48px] touch-manipulation min-w-0">
            <ChevronLeft className="w-4 h-4 flex-shrink-0" />
            <span className="hidden sm:inline truncate">{isGenesisChapterOne ? 'Title Page' : isViewingTitlePage ? `${getPrevBook(pos.abbr)?.shortName} ${getPrevBook(pos.abbr)?.chapters}` : pos.chapter > 1 ? `Chapter ${pos.chapter - 1}` : (pos.abbr === 'GEN' || pos.abbr === 'MAT') ? `${book.shortName} Title Page` : `${getPrevBook(pos.abbr)?.shortName} ${getPrevBook(pos.abbr)?.chapters}`}</span>
          </button>
          ) : <div className="flex-1" />}
          {!isLastChapterLastBook ? (
          <button onClick={() => goNext()} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors min-h-[48px] touch-manipulation min-w-0">
            <span className="hidden sm:inline truncate">{isViewingTitlePage ? `Chapter 1` : pos.chapter < book.chapters ? `Chapter ${pos.chapter + 1}` : getNextBook(pos.abbr) ? `${getNextBook(pos.abbr).shortName} 1` : ''}</span>
            <ChevronRight className="w-4 h-4 flex-shrink-0" />
          </button>
          ) : <div className="flex-1" />}
        </div>
      )}

    </div>
  );
}