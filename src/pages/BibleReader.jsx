import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import { BIBLE_BOOKS, getNextBook, getPrevBook } from '@/lib/bibleData';
import { fetchChapter, fetchVerseCount } from '@/lib/bibleApi';
import { SUBSCRIPTS, COLOPHONS } from '@/lib/bibleSubscripts';
import BookSelector from '@/components/bible/BookSelector';
import ChapterSelector from '@/components/bible/ChapterSelector';
import VerseSelector from '@/components/bible/VerseSelector';
import VerseText from '@/components/bible/VerseText';
import TitlePage from '@/components/bible/TitlePage';

const STORAGE_KEY = 'kjb-position';

function loadPosition() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s);
  } catch {}
  return { abbr: 'GEN', chapter: 1, verse: null };
}

function savePosition(abbr, chapter) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ abbr, chapter })); } catch {}
}


export default function BibleReader() {
  const [pos, setPos] = useState(loadPosition);
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [highlightVerse, setHighlightVerse] = useState(pos.verse || null);
  const [verseCount, setVerseCount] = useState(0);

  const [showBookPicker, setShowBookPicker] = useState(false);
  const [showChapterPicker, setShowChapterPicker] = useState(false);
  const [showVersePicker, setShowVersePicker] = useState(false);

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
    
    const data = await fetchChapter(b.apiName, chapter);
    setVerses(data);
    setVerseCount(data.length);
    setLoading(false);
    setHighlightVerse(jumpVerse || null);
    savePosition(bookAbbr, chapter);
  }, []);

  useEffect(() => {
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
    <div className="max-w-3xl mx-auto px-4 py-6">
      {/* Sticky nav bar */}
      <div ref={topRef} className="sticky top-14 z-40 bg-background/95 backdrop-blur border-b border-border pb-3 mb-6">
        {/* Book / Chapter / Verse selectors */}
        <div className="flex flex-wrap items-center gap-2 pt-3">
          {/* Book selector */}
          <div className="relative">
            <button
              onClick={() => { setShowBookPicker(p => !p); setShowChapterPicker(false); setShowVersePicker(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-colors"
            >
              {book.name}
              <ChevronRight className="w-3 h-3 opacity-70" />
            </button>
            {showBookPicker && (
              <div className="absolute top-full left-0 mt-1 z-50">
                <BookSelector
                  currentAbbr={pos.abbr}
                  onSelect={(b, isTitlePage) => {
                    const chapter = isTitlePage ? 0 : 1;
                    navigate(b.abbr, chapter);
                  }}
                  onClose={() => setShowBookPicker(false)}
                />
              </div>
            )}
          </div>

          {/* Chapter selector */}
          <div className="relative">
            <button
              onClick={() => { setShowChapterPicker(p => !p); setShowBookPicker(false); setShowVersePicker(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors"
            >
              Ch. {isViewingTitlePage ? 'Intro' : pos.chapter}
              <ChevronRight className="w-3 h-3 opacity-70" />
            </button>
            {showChapterPicker && (
              <div className="absolute top-full left-0 mt-1 z-50">
                <ChapterSelector
                  totalChapters={book.chapters}
                  currentChapter={pos.chapter}
                  onSelect={(ch) => navigate(pos.abbr, ch)}
                  onClose={() => setShowChapterPicker(false)}
                />
              </div>
            )}
          </div>

          {/* Verse selector */}
          <div className="relative">
            <button
              onClick={() => { setShowVersePicker(p => !p); setShowBookPicker(false); setShowChapterPicker(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors"
              disabled={verseCount === 0}
            >
              {highlightVerse ? `v.${highlightVerse}` : 'Verse'}
              <ChevronRight className="w-3 h-3 opacity-70" />
            </button>
            {showVersePicker && verseCount > 0 && !isViewingTitlePage && (
              <div className="absolute top-full left-0 mt-1 z-50">
                <VerseSelector
                  totalVerses={verseCount}
                  currentVerse={highlightVerse}
                  onSelect={(v) => {
                    navigate(pos.abbr, pos.chapter, v);
                    setShowVersePicker(false);
                  }}
                  onClose={() => setShowVersePicker(false)}
                  autoSelect={true}
                />
              </div>
            )}
          </div>

          {/* Prev/Next chapter buttons */}
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
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
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
            <p className="font-serif text-sm italic text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">
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
            <div className="text-justify hyphens-auto">
              {verses.map((v, idx) => {
                const isColophon = COLOPHONS[`${book.apiName}:${pos.chapter}`] === v.verse;
                return !isColophon ? (
                  <VerseText
                    key={v.verse}
                    verse={v}
                    highlight={highlightVerse === v.verse}
                    id={`v${v.verse}`}
                    bookName={book.name}
                    chapter={pos.chapter}
                    isColophon={false}
                    isFirstVerse={idx === 0}
                  />
                ) : null;
              })}
            </div>
            {/* Colophon footer — displayed separately at the bottom */}
            {verses.length > 0 && COLOPHONS[`${book.apiName}:${pos.chapter}`] && (
              <div className="mt-8 pt-6 border-t border-border">
                <VerseText
                  verse={verses.find(v => v.verse === COLOPHONS[`${book.apiName}:${pos.chapter}`])}
                  id={`v${COLOPHONS[`${book.apiName}:${pos.chapter}`]}`}
                  bookName={book.name}
                  chapter={pos.chapter}
                  isColophon={true}
                  isFirstVerse={false}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom nav */}
      {!loading && !error && (
        <div className="flex justify-between mt-12 pt-6 border-t border-border">
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

      {/* Credit */}
      <p className="text-center text-xs text-muted-foreground font-sans mt-8 pb-4">
        Text: King James Bible, Pure Cambridge Edition — <a href="https://www.bibleprotector.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">bibleprotector.com</a>
      </p>
    </div>
  );
}