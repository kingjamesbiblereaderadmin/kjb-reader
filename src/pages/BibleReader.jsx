import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Loader2, AlignJustify, List, Maximize2, Minimize2, ChevronDown } from 'lucide-react';
import { BIBLE_BOOKS, getNextBook, getPrevBook } from '@/lib/bibleData';
import { fetchChapter, fetchVerseCount, renderVerseText } from '@/lib/bibleApi';
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
        <div ref={topRef} className="sticky top-14 z-40 bg-background/95 backdrop-blur border-b border-border pb-1 mb-2">
          <div className="relative flex flex-wrap items-center gap-2 pt-1 justify-between">

            {/* Book selector */}
            <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setShowBookPicker(p => !p); setShowChapterPicker(false); setShowVersePicker(false); }}
              onTouchEnd={(e) => { e.preventDefault(); setShowBookPicker(p => !p); setShowChapterPicker(false); setShowVersePicker(false); }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-colors min-w-fit touch-manipulation"
            >
              {isViewingTitlePage ? 'Title Page' : book.shortName}
              <ChevronRight className="w-3 h-3 opacity-70" />
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

            {/* Chapter selector */}
            <button
              onClick={() => { if (!isViewingTitlePage) { setShowChapterPicker(p => !p); setShowBookPicker(false); setShowVersePicker(false); } }}
              onTouchEnd={(e) => { e.preventDefault(); if (!isViewingTitlePage) { setShowChapterPicker(p => !p); setShowBookPicker(false); setShowVersePicker(false); } }}
              disabled={isViewingTitlePage}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-fit touch-manipulation"
            >
              Ch. {isViewingTitlePage ? 'Intro' : pos.chapter}
              <ChevronRight className="w-3 h-3 opacity-70" />
            </button>
            {showChapterPicker && !isViewingTitlePage && !isMobile() && (
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
            <SelectorSheet open={showChapterPicker && !isViewingTitlePage && isMobile()} onClose={() => setShowChapterPicker(false)} title={`${book.shortName} — Select Chapter`}>
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
              onClick={() => { if (!isViewingTitlePage) { setShowVersePicker(p => !p); setShowBookPicker(false); setShowChapterPicker(false); } }}
              onTouchEnd={(e) => { e.preventDefault(); if (!isViewingTitlePage) { setShowVersePicker(p => !p); setShowBookPicker(false); setShowChapterPicker(false); } }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-w-fit touch-manipulation"
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
              onTouchEnd={(e) => { e.preventDefault(); toggleLayout(); }}
              title={paragraphMode ? 'Switch to line-by-line' : 'Switch to paragraph'}
              disabled={isViewingTitlePage}
              className="flex items-center gap-1 px-3 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-xs font-medium hover:bg-accent/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed touch-manipulation"
            >
              {paragraphMode ? <AlignJustify className="w-3.5 h-3.5" /> : <List className="w-3.5 h-3.5" />}
              {paragraphMode ? 'Para' : 'Lines'}
            </button>
            </div>

            {/* Prev/Next + Fullscreen + Hide header */}
            <div className="flex items-center gap-1">
              <button
                onClick={goPrev}
                onTouchEnd={(e) => { e.preventDefault(); goPrev(); }}
                disabled={isFirstChapterFirstBook}
                className="p-2.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground disabled:opacity-30 transition-colors touch-manipulation"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goNext}
                onTouchEnd={(e) => { e.preventDefault(); goNext(); }}
                disabled={isLastChapterLastBook}
                className="p-2.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground disabled:opacity-30 transition-colors touch-manipulation"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                onTouchEnd={(e) => { e.preventDefault(); toggleFullscreen(); }}
                title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                className="p-2.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-colors touch-manipulation"
              >
                {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setHideHeader(true)}
                onTouchEnd={(e) => { e.preventDefault(); setHideHeader(true); }}
                title="Hide header"
                className="p-2.5 rounded-lg bg-secondary hover:bg-accent/20 text-foreground transition-colors touch-manipulation"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
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
      {(showBookPicker || showChapterPicker || showVersePicker) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => { setShowBookPicker(false); setShowChapterPicker(false); setShowVersePicker(false); }}
        />
      )}

      {/* Book title — hidden when showing title page */}
      {!isViewingTitlePage && (
        <div className="text-center mb-6 pt-4">
          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-1 leading-tight">{book.name}</h1>
          <p className="font-sans text-sm text-muted-foreground tracking-widest uppercase mt-1">
            Chapter {pos.chapter}
          </p>
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
                isFirstVerse={idx === 0}
                paragraphMode={paragraphMode}
              />
            ))}
          </div>
        )}
        {/* Colophon footer - shown below all verses for chapters that have one */}
        {!loading && !error && colophon && (
          <div className="mt-8 pt-6 border-t border-border">
            <p
              className="font-serif text-sm text-muted-foreground text-center leading-relaxed"
              dangerouslySetInnerHTML={{ __html: renderVerseText(colophon) }}
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