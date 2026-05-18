import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlignJustify, List, Maximize2, Minimize2, EyeOff, Eye, ArrowDownToLine, ArrowUpFromLine } from 'lucide-react';
import { BIBLE_BOOKS, getNextBook, getPrevBook } from '@/lib/bibleData';
import { fetchChapter, fetchVerseCount } from '@/lib/bibleApi';
import { getBibleData } from '@/lib/bibleCache';
import { SUBSCRIPTS, COLOPHONS } from '@/lib/bibleSubscripts';
import BookSelector from '@/components/bible/BookSelector';
import ChapterSelector from '@/components/bible/ChapterSelector';
import VerseSelector from '@/components/bible/VerseSelector';
import VerseText from '@/components/bible/VerseText';
import TitlePage from '@/components/bible/TitlePage';
import SelectorSheet from '@/components/bible/SelectorSheet';

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
  const [hideUI, setHideUI] = useState(false);
  const [textOnlyMode, setTextOnlyMode] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setFullscreen(false);
    }
  };

  const toggleTextOnly = () => {
    setTextOnlyMode(prev => !prev);
  };

  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const toggleLayout = () => {
    const next = !paragraphMode;
    setParagraphMode(next);
    try { localStorage.setItem('kjb-layout', next ? 'paragraph' : 'line'); } catch {}
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

  return (
    <div className={`max-w-3xl mx-auto px-4 py-6 ${hideUI || textOnlyMode ? 'select-text' : ''}`}>

      {/* Sticky nav bar — hidden when hideUI or textOnlyMode is on */}
      {!(hideUI || textOnlyMode) && (
        <div ref={topRef} className="sticky top-14 z-40 bg-background/95 backdrop-blur border-b border-border pb-3 mb-6">
          <div className="relative flex flex-wrap items-center gap-2 pt-3">

            {/* Book selector */}
            <button
              onClick={() => { setShowBookPicker(p => !p); setShowChapterPicker(false); setShowVersePicker(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-colors"
            >
              {isViewingTitlePage ? 'Title Page' : book.shortName}
              <ChevronRight className="w-3 h-3 opacity-70" />
            </button>
            {/* Desktop popover */}
            {showBookPicker && !isMobile() && (
              <div className="absolute top-full left-0 mt-1 z-50">
                <BookSelector
                  currentAbbr={pos.abbr}
                  onSelect={(b, isTitlePage) => { navigate(b.abbr, isTitlePage ? 0 : 1); }}
                  onClose={() => setShowBookPicker(false)}
                />
              </div>
            )}
            {/* Mobile bottom sheet */}
            <SelectorSheet open={showBookPicker && isMobile()} onClose={() => setShowBookPicker(false)} title="Select Book">
              <BookSelector
                currentAbbr={pos.abbr}
                onSelect={(b, isTitlePage) => { navigate(b.abbr, isTitlePage ? 0 : 1); }}
                onClose={() => setShowBookPicker(false)}
              />
            </SelectorSheet>

            {/* Chapter selector */}
            <button
              onClick={() => { if (!isViewingTitlePage) { setShowChapterPicker(p => !p); setShowBookPicker(false); setShowVersePicker(false); } }}
              disabled={isViewingTitlePage}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Ch. {isViewingTitlePage ? 'Intro' : pos.chapter}
              <ChevronRight className="w-3 h-3 opacity-70" />
            </button>
            {showChapterPicker && !isViewingTitlePage && !isMobile() && (
              <div className="absolute top-full left-0 mt-1 z-50">
                <ChapterSelector
                  totalChapters={book.chapters}
                  currentChapter={pos.chapter}
                  onSelect={(ch) => navigate(pos.abbr, ch)}
                  onClose={() => setShowChapterPicker(false)}
                />
              </div>
            )}
            <SelectorSheet open={showChapterPicker && !isViewingTitlePage && isMobile()} onClose={() => setShowChapterPicker(false)} title={`${book.shortName} — Select Chapter`}>
              <ChapterSelector
                totalChapters={book.chapters}
                currentChapter={pos.chapter}
                onSelect={(ch) => navigate(pos.abbr, ch)}
                onClose={() => setShowChapterPicker(false)}
              />
            </SelectorSheet>

            {/* Verse selector */}
            <button
              onClick={() => { if (!isViewingTitlePage) { setShowVersePicker(p => !p); setShowBookPicker(false); setShowChapterPicker(false); } }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={verseCount === 0 || isViewingTitlePage}
            >
              {highlightVerse ? `v.${highlightVerse}` : 'Verse'}
              <ChevronRight className="w-3 h-3 opacity-70" />
            </button>
            {showVersePicker && verseCount > 0 && !isViewingTitlePage && !isMobile() && (
              <div className="absolute top-full left-0 mt-1 z-50">
                <VerseSelector
                  totalVerses={verseCount}
                  currentVerse={highlightVerse}
                  onSelect={(v) => { navigate(pos.abbr, pos.chapter, v); setShowVersePicker(false); }}
                  onClose={() => setShowVersePicker(false)}
                  autoSelect={true}
                />
              </div>
            )}
            <SelectorSheet open={showVersePicker && verseCount > 0 && !isViewingTitlePage && isMobile()} onClose={() => setShowVersePicker(false)} title={`${book.shortName} ${pos.chapter} — Select Verse`}>
              <VerseSelector
                totalVerses={verseCount}
                currentVerse={highlightVerse}
                onSelect={(v) => { navigate(pos.abbr, pos.chapter, v); setShowVersePicker(false); }}
                onClose={() => setShowVersePicker(false)}
                autoSelect={true}
              />
            </SelectorSheet>

            {/* Layout toggle */}
            <button
              onClick={toggleLayout}
              title={paragraphMode ? 'Switch to line-by-line' : 'Switch to paragraph'}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors"
            >
              {paragraphMode ? <AlignJustify className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
              {paragraphMode ? 'Para' : 'Lines'}
            </button>

            {/* Prev/Next + Fullscreen + Hide UI */}
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={goPrev}
                disabled={isFirstChapterFirstBook}
                className="p-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goNext}
                disabled={isLastChapterLastBook}
                className="p-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setTextOnlyMode(true)}
                title="Text only mode"
                className="p-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-colors"
              >
                <ArrowDownToLine className="w-4 h-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                className="p-1.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-colors"
              >
                {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show UI button when hidden */}
      {hideUI && (
        <button
          onClick={() => setHideUI(false)}
          className="fixed bottom-20 right-4 z-50 p-3 rounded-full bg-card/80 backdrop-blur border border-border text-muted-foreground hover:text-foreground shadow-lg transition-colors"
          title="Show UI"
        >
          <Eye className="w-5 h-5" />
        </button>
      )}

      {/* Show UI button when text-only mode */}
      {textOnlyMode && (
        <button
          onClick={() => setTextOnlyMode(false)}
          className="fixed bottom-20 right-4 z-50 p-3 rounded-full bg-card/80 backdrop-blur border border-border text-muted-foreground hover:text-foreground shadow-lg transition-colors"
          title="Show UI"
        >
          <ArrowUpFromLine className="w-5 h-5" />
        </button>
      )}

      {/* Click outside to close desktop dropdowns */}
      {(showBookPicker || showChapterPicker || showVersePicker) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => { setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false); }}
        />
      )}

      {/* Book title — hidden when showing title page */}
      {!isViewingTitlePage && (
        <div className="text-center mb-6">
          <p className="font-sans text-xs text-muted-foreground tracking-widest uppercase mb-1">
            {book.testament === 'old' ? 'Old Testament' : 'New Testament'}
          </p>
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-1 leading-tight">{book.name}</h1>
          <p className="font-sans text-sm text-muted-foreground tracking-widest uppercase mt-1">Chapter {pos.chapter}</p>
          {/* Subscript — shown below chapter heading on the relevant final chapter */}
          {SUBSCRIPTS[`${book.apiName}:${pos.chapter}`] && (
            <p className="font-serif text-sm text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">
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
      <div className="font-serif text-lg leading-loose text-foreground/90">
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
          <>
            <div className={paragraphMode ? 'text-justify hyphens-auto' : ''}>
              {verses.map((v, idx) => (
                <VerseText
                  key={v.verse}
                  verse={v}
                  highlight={highlightVerse === v.verse}
                  id={`v${v.verse}`}
                  bookName={book.name}
                  abbr={pos.abbr}
                  chapter={pos.chapter}
                  isColophon={false}
                  isFirstVerse={idx === 0}
                  paragraphMode={paragraphMode}
                />
              ))}
            </div>
            {/* Colophon footer — displayed separately at the bottom */}
            {colophon && (
              <div className="mt-8 pt-6 border-t border-border">
                <span className="inline text-base text-muted-foreground">
                  ¶ {colophon.replace(/[\[\]]/g, '')}
                </span>
              </div>
            )}
          </>
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

      {/* Bottom nav */}
      {!loading && !error && (
        <div className="flex justify-between mt-6 pt-6 border-t border-border">
          <button
            onClick={goPrev}
            disabled={isFirstChapterFirstBook}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
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
          </button>

          <button
            onClick={goNext}
            disabled={isLastChapterLastBook}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 disabled:opacity-30 transition-colors"
          >
            {isViewingTitlePage
              ? `Chapter 1`
              : pos.chapter < book.chapters
              ? `Chapter ${pos.chapter + 1}`
              : `${getNextBook(pos.abbr)?.shortName} 1`}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}



    </div>
  );
}