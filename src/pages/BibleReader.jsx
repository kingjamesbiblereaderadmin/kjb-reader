import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlignJustify, List, Maximize2, Minimize2, ChevronDown, CheckSquare, Square, Copy, X, BookMarked, ZoomIn, Minus, Plus } from 'lucide-react';
import { BIBLE_BOOKS, getNextBook, getPrevBook } from '@/lib/bibleData';
import { fetchChapter, fetchVerseCount, renderVerseText, renderColophonText } from '@/lib/bibleApi';
import { getBibleData } from '@/lib/bibleCache';
import { SUBSCRIPTS, COLOPHONS } from '@/lib/bibleSubscripts';
import BookSelector from '@/components/bible/BookSelector';
import ChapterSelector from '@/components/bible/ChapterSelector';
import VerseSelector from '@/components/bible/VerseSelector';
import VerseText from '@/components/bible/VerseText';
import TitlePage from '@/components/bible/TitlePage';
import SelectorSheet from '@/components/bible/SelectorSheet';
import { useHeaderHide } from '@/lib/HeaderHideContext';
import { base44 } from '@/api/base44Client';

const isMobile = () => window.innerWidth < 640;

const STORAGE_KEY = 'kjb-position';

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

function savePosition(abbr, chapter) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ abbr, chapter })); } catch {}
}


export default function BibleReader() {
  const { hideHeader, setHideHeader } = useHeaderHide();
  const [pos, setPos] = useState(loadPosition);
  const [verses, setVerses] = useState([]);
  const [colophon, setColophon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightVerse, setHighlightVerse] = useState(pos.verse || null);
  const [verseCount, setVerseCount] = useState(0);

  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [showVersePicker, setShowVersePicker] = useState(false);
  const [paragraphMode, setParagraphMode] = useState(() => {
    try { return localStorage.getItem('kjb-layout') === 'paragraph'; } catch { return false; }
  });
  const [fullscreen, setFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(() => {
    try { return parseInt(localStorage.getItem('kjb-zoom') || '100'); } catch { return 100; }
  });
  const [dyslexicFont, setDyslexicFont] = useState(() => {
    try { return localStorage.getItem('kjb-dyslexic-font') === 'true'; } catch { return false; }
  });
  const [showZoomPopover, setShowZoomPopover] = useState(false);

  // Multi-select state
  const [selectMode, setSelectMode] = useState(false);
  const [selectedVerses, setSelectedVerses] = useState(new Set());
  const [filterMode, setFilterMode] = useState(false); // show only selected verses
  const [copyFeedback, setCopyFeedback] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Listen for dyslexic font changes from Settings
  useEffect(() => {
    const handleFontChange = () => {
      const newVal = localStorage.getItem('kjb-dyslexic-font') === 'true';
      setDyslexicFont(newVal);
    };
    window.addEventListener('dyslexic-font-change', handleFontChange);
    return () => window.removeEventListener('dyslexic-font-change', handleFontChange);
  }, []);

  const toggleLayout = () => {
    const next = !paragraphMode;
    setParagraphMode(next);
    try { localStorage.setItem('kjb-layout', next ? 'paragraph' : 'line'); } catch {}
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

  const handleCopySelected = async () => {
    const toUse = selectedVerses.size > 0 ? selectedVerses : new Set(verses.map(v => v.verse));
    const lines = verses
      .filter(v => toUse.has(v.verse))
      .map(v => {
        const clean = v.text.replace(/\[([^\]]+)\]/g, '$1').replace(/¶\s*/g, '').replace(/^<<[^>]*>>\s*/, '');
        return `"${clean}" — ${book.name} ${pos.chapter}:${v.verse} (KJB)`;
      })
      .join('\n\n');
    await navigator.clipboard.writeText(lines);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 1800);
  };

  const handleReadSelected = () => {
    setFilterMode(true);
    setSelectMode(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const topRef = useRef(null);
  const book = BIBLE_BOOKS.find(b => b.abbr === pos.abbr) || BIBLE_BOOKS[0];

  // Determine if viewing a title page (chapter 0)
  const isViewingTitlePage = pos.chapter === 0 && (pos.abbr === 'GEN' || pos.abbr === 'MAT');

  const loadChapter = useCallback(async (bookAbbr, chapter, jumpVerse) => {
    setLoading(true);
    setError(null);
    setVerses([]);
    // Always scroll to top first; verse centering happens after load
    window.scrollTo({ top: 0 });
    const b = BIBLE_BOOKS.find(bk => bk.abbr === bookAbbr);
    if (!b) { setError('Book not found'); setLoading(false); return; }
    
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
      setHighlightVerse(jumpVerse || null);
      savePosition(bookAbbr, chapter);
    } catch (err) {
      setError('Failed to load chapter. Please check your connection.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // Preload Bible data on first mount so it's cached for offline access
    getBibleData().catch(() => {});
    loadChapter(pos.abbr, pos.chapter, pos.verse);
    // If a verse range was passed, pre-select those verses and enter filter mode
    if (pos.verse && pos.verseEnd && pos.verseEnd > pos.verse) {
      const range = new Set();
      for (let v = pos.verse; v <= pos.verseEnd; v++) range.add(v);
      setSelectedVerses(range);
      setFilterMode(true);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      if (highlightVerse) {
        // Center on the specific verse
        setTimeout(() => {
          const el = document.getElementById(`v${highlightVerse}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      } else {
        // No verse target — ensure we're at the top
        window.scrollTo({ top: 0 });
      }
    }
  }, [verses, loading, highlightVerse]);

  const navigate = (newAbbr, newChapter, jumpVerse = null) => {
    // Prevent chapter 0 for non-GEN/MAT books
    if (newChapter === 0 && newAbbr !== 'GEN' && newAbbr !== 'MAT') {
      return;
    }
    const newPos = { abbr: newAbbr, chapter: newChapter, verse: jumpVerse };
    setPos(newPos);
    loadChapter(newAbbr, newChapter, jumpVerse);
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

  const isLastChapterLastBook = pos.abbr === 'REV' && pos.chapter === 22;
  const isFirstChapterFirstBook = pos.abbr === 'GEN' && pos.chapter === 0;
  const isGenesisChapterOne = pos.abbr === 'GEN' && pos.chapter === 1;

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
    <div className={`max-w-5xl mx-auto px-4 py-3 ${hideHeader ? 'pt-16' : ''}`}>

      {/* Sticky nav bar — hidden when hideHeader is on */}
      {!hideHeader && (
        <div ref={topRef} className="sticky top-[56px] sm:top-[72px] z-40 bg-background/95 backdrop-blur border-b border-border pb-1 mb-2">
          <div className="relative flex flex-wrap items-center gap-2 pt-1 justify-between">

            {/* Book selector */}
            <div className="flex items-center gap-0 flex-wrap -m-1">
            <div className="p-1">
            <button
              onClick={() => { setShowBookPicker(p => !p); setShowChapterPicker(false); setShowVersePicker(false); }}
              onTouchEnd={(e) => { e.preventDefault(); setShowBookPicker(p => !p); setShowChapterPicker(false); setShowVersePicker(false); }}
              className="flex items-center gap-1.5 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-colors min-w-fit touch-manipulation min-h-[48px]"
            >
              {isViewingTitlePage ? 'Title Page' : book.shortName}
              <ChevronRight className="w-3 h-3 opacity-70" />
            </button>
            </div>
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
            <div className="p-1">
            <button
              onClick={() => { setShowChapterPicker(p => !p); setShowBookPicker(false); setShowVersePicker(false); }}
              onTouchEnd={(e) => { e.preventDefault(); setShowChapterPicker(p => !p); setShowBookPicker(false); setShowVersePicker(false); }}
              className="flex items-center gap-1.5 px-4 py-3 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors min-w-fit touch-manipulation min-h-[48px]"
            >
              Ch. {pos.chapter}
              <ChevronRight className="w-3 h-3 opacity-70" />
            </button>
            </div>
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
              <div className="p-1">
              <button
                onClick={() => { setShowVersePicker(p => !p); setShowBookPicker(false); setShowChapterPicker(false); }}
                onTouchEnd={(e) => { e.preventDefault(); setShowVersePicker(p => !p); setShowBookPicker(false); setShowChapterPicker(false); }}
                className="flex items-center gap-1.5 px-4 py-3 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors min-w-fit touch-manipulation min-h-[48px]"
                disabled={verseCount === 0}
              >
                {filterMode && selectedVerses.size > 1
                  ? `vv.${Math.min(...selectedVerses)}-${Math.max(...selectedVerses)}`
                  : highlightVerse
                  ? `v.${highlightVerse}`
                  : 'Verse'}
                <ChevronRight className="w-3 h-3 opacity-70" />
              </button>
              </div>
              {showVersePicker && verseCount > 0 && !isMobile() && (
                <div className="absolute top-full left-0 mt-1 z-50">
                  <VerseSelector
                    totalVerses={verseCount}
                    currentVerse={highlightVerse}
                    multiSelect={true}
                    onSelect={(v) => {
                      const first = Array.isArray(v) ? v[0] : v;
                      if (Array.isArray(v) && v.length > 1) {
                        setSelectedVerses(new Set(v));
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
                  multiSelect={true}
                  onSelect={(v) => {
                    const first = Array.isArray(v) ? v[0] : v;
                    if (Array.isArray(v) && v.length > 1) {
                      setSelectedVerses(new Set(v));
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
              <div className="p-1 relative">
              <button
                onClick={() => setShowZoomPopover(p => !p)}
                onTouchEnd={(e) => { e.preventDefault(); setShowZoomPopover(p => !p); }}
                title={`Zoom: ${zoomLevel}%`}
                className="flex items-center gap-1 px-3 py-3 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors touch-manipulation min-h-[48px]"
              >
                <ZoomIn className="w-3.5 h-3.5" />
                {zoomLevel}%
              </button>
              {showZoomPopover && (
                <div className="absolute top-full right-0 mt-2 z-50 bg-card border border-border rounded-xl shadow-xl p-4 w-64">
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
              )}
              </div>

              {/* Layout toggle */}
              <div className="p-1">
              <button
                onClick={toggleLayout}
                onTouchEnd={(e) => { e.preventDefault(); toggleLayout(); }}
                title={paragraphMode ? 'Switch to line-by-line' : 'Switch to paragraph'}
                className="flex items-center gap-1 px-3 py-3 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors touch-manipulation min-h-[48px]"
              >
                {paragraphMode ? <AlignJustify className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
                {paragraphMode ? 'Para' : 'Lines'}
              </button>
              </div>
              {/* Select mode toggle */}
              <div className="p-1">
              <button
                onClick={toggleSelectMode}
                onTouchEnd={(e) => { e.preventDefault(); toggleSelectMode(); }}
                title="Select verses"
                className={`flex items-center gap-1 px-3 py-3 rounded-lg font-sans text-xs font-medium transition-colors touch-manipulation min-h-[48px] ${selectMode ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'}`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                {selectMode ? 'Done' : 'Select'}
              </button>
              </div>
              </>
            )}
            </div>

            {/* Prev/Next + Fullscreen + Hide header */}
            <div className="flex items-center gap-0">
              <div className="p-1">
              <button
                onClick={goPrev}
                onTouchEnd={(e) => { e.preventDefault(); goPrev(); }}
                disabled={isFirstChapterFirstBook}
                className="p-3 rounded-lg bg-secondary hover:bg-accent/20 text-foreground disabled:opacity-30 transition-colors touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              </div>
              <div className="p-1">
              <button
                onClick={goNext}
                onTouchEnd={(e) => { e.preventDefault(); goNext(); }}
                disabled={isLastChapterLastBook}
                className="p-3 rounded-lg bg-secondary hover:bg-accent/20 text-foreground disabled:opacity-30 transition-colors touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              </div>
              <div className="p-1">
              <button
                onClick={toggleFullscreen}
                onTouchEnd={(e) => { e.preventDefault(); toggleFullscreen(); }}
                title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                className="p-3 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-colors touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
              >
                {fullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
              </button>
              </div>
              <div className="p-1">
              <button
                onClick={() => setHideHeader(true)}
                onTouchEnd={(e) => { e.preventDefault(); setHideHeader(true); }}
                title="Hide header"
                className="p-3 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-colors touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show header chevron when hidden — aligned with top border */}
      {hideHeader && (
        <div className="fixed top-0 left-0 right-0 h-[49px] border-b border-border bg-background/95 backdrop-blur z-50">
          <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-end">
            <div className="flex items-center gap-1">
              <button
                onClick={toggleFullscreen}
                title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                className="p-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-colors"
              >
                {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setHideHeader(false)}
                className="p-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-colors"
                title="Show header"
              >
                <ChevronDown className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close desktop dropdowns */}
      {(showBookPicker || showChapterPicker || showVersePicker || showZoomPopover) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => { setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false); setShowZoomPopover(false); }}
        />
      )}

      {/* Book title — hidden when showing title page */}
      {!isViewingTitlePage && (
        <div className="text-center mb-6 pt-4">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-1 leading-tight">{book.name}</h1>
          <p className="font-sans text-sm text-muted-foreground tracking-widest uppercase mt-1">
            Chapter {pos.chapter}
          </p>
          {/* Subscript — centred below chapter number, plain (not italic) */}
          {SUBSCRIPTS[`${book.apiName}:${pos.chapter}`] && (
            <p style={{ fontStyle: 'normal' }} className="font-serif text-sm text-muted-foreground mt-2 max-w-lg mx-auto leading-relaxed text-center">
              {SUBSCRIPTS[`${book.apiName}:${pos.chapter}`]}
            </p>
          )}
          <div className="mt-3 w-16 h-px bg-accent mx-auto" />
        </div>
      )}

      {/* Title page only - no chapter info */}
      {isViewingTitlePage && (
        <div className="mb-8" />
      )}

      {/* Title pages or verses */}
      <div 
        className={`${dyslexicFont ? 'font-[var(--font-dyslexic)]' : 'font-serif'} leading-loose text-foreground/90`}
        style={{ fontSize: `${zoomLevel / 100}rem`, lineHeight: zoomLevel > 100 ? '1.8' : '1.6' }}
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
          <TitlePage type={pos.abbr === 'GEN' ? 'testament-old' : 'testament-new'} />
        )}
        {!loading && !error && verses.length > 0 && (
          <div className={paragraphMode ? 'text-justify hyphens-auto' : ''}>
            {verses
              .filter(v => !filterMode || selectedVerses.has(v.verse))
              .map((v, idx) => (
              <VerseText
                key={v.verse}
                verse={v}
                highlight={highlightVerse === v.verse}
                id={`v${v.verse}`}
                bookName={book.name}
                abbr={pos.abbr}
                chapter={pos.chapter}
                isFirstVerse={idx === 0}
                paragraphMode={paragraphMode}
                selectMode={selectMode}
                isSelected={selectedVerses.has(v.verse)}
                onSelect={toggleVerseSelect}
              />
            ))}
          </div>
        )}
        {/* Colophon footer - centred, plain text, only [bracketed] words italic */}
        {!loading && !error && colophon && (
          <div className="mt-12 mb-4 border-t border-border pt-6 text-center">
            <p
              className="font-serif text-sm text-muted-foreground leading-relaxed not-italic [&_em]:italic [&_em]:text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: '¶&nbsp;&nbsp;' + renderColophonText(colophon) }}
            />
          </div>
        )}
      </div>

      {/* End-of-section markers — shown as a text footer below the verses */}
      {!loading && !error && pos.abbr === 'MAL' && pos.chapter === 4 && (
        <div className="text-center mt-12 mb-4">
          <p className="font-serif text-sm text-muted-foreground tracking-widest uppercase">
            End of the Prophets
          </p>
        </div>
      )}
      {!loading && !error && pos.abbr === 'REV' && pos.chapter === 22 && (
        <div className="text-center mt-12 mb-4">
          <p className="font-serif text-sm text-muted-foreground tracking-widest uppercase">
            The End
          </p>
        </div>
      )}

      {/* Filter mode banner */}
      {filterMode && (
        <div className="sticky top-[56px] sm:top-[72px] z-40 mb-3 px-3 py-2 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-between gap-2">
          <p className="font-sans text-xs text-primary font-semibold flex items-center gap-1.5">
            <BookMarked className="w-3.5 h-3.5" />
            {selectedVerses.size > 1
              ? `Reading ${book.shortName} ${pos.chapter}:${Math.min(...selectedVerses)}-${Math.max(...selectedVerses)}`
              : `Showing ${selectedVerses.size} selected verse${selectedVerses.size !== 1 ? 's' : ''}`}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopySelected}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-xs font-medium hover:opacity-90 transition-opacity"
            >
              <Copy className="w-3 h-3" /> {copyFeedback ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={() => { setFilterMode(false); setSelectMode(false); setSelectedVerses(new Set()); }}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-secondary text-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
            >
              <X className="w-3 h-3" /> Exit
            </button>
          </div>
        </div>
      )}

      {/* Floating select action bar */}
      {selectMode && selectedVerses.size > 0 && (
        <div className="fixed bottom-24 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-card border border-border shadow-2xl">
          <span className="font-sans text-xs text-muted-foreground font-medium">{selectedVerses.size} selected</span>
          <div className="w-px h-4 bg-border" />
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
        </div>
      )}

      {/* Bottom nav */}
      {!loading && !error && (
        <div className="flex justify-between gap-2 mt-6 pt-6 border-t border-border">
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