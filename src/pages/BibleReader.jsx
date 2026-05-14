import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, BookOpen, Loader2 } from 'lucide-react';
import { BIBLE_BOOKS, getNextBook, getPrevBook } from '@/lib/bibleData';
import { fetchChapter, fetchVerseCount } from '@/lib/bibleApi';
import BookSelector from '@/components/bible/BookSelector';
import ChapterSelector from '@/components/bible/ChapterSelector';
import VerseSelector from '@/components/bible/VerseSelector';
import VerseText from '@/components/bible/VerseText';

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

const DAILY_TOPICS = [
  "sunrise+mountains+nature",
  "holy+land+israel+landscape",
  "ancient+jerusalem+stone",
  "sea+of+galilee+sunrise",
  "desert+wilderness+faith",
  "olive+tree+israel",
  "wheat+field+harvest+golden",
];

const DAILY_IMAGES = [
  "https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800&q=80",
  "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=800&q=80",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=800&q=80",
  "https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=800&q=80",
  "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80",
  "https://images.unsplash.com/photo-1502126324834-38f8e02d7160?w=800&q=80",
];

function DailyPhoto() {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  const imgUrl = DAILY_IMAGES[dayOfYear % DAILY_IMAGES.length];

  return (
    <div className="w-full h-36 md:h-48 overflow-hidden rounded-xl mb-6 relative">
      <img
        src={imgUrl}
        alt="Daily photo"
        className="w-full h-full object-cover"
        onError={(e) => { e.target.parentNode.style.display = 'none'; }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent rounded-xl" />
      <div className="absolute bottom-3 left-4">
        <p className="font-serif text-white text-xl font-semibold drop-shadow">KJB Reader</p>
        <p className="font-sans text-white/70 text-xs">King James Bible — Pure Cambridge Edition</p>
      </div>
    </div>
  );
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

  const loadChapter = useCallback(async (bookAbbr, chapter, jumpVerse) => {
    setLoading(true);
    setError(null);
    setVerses([]);
    const b = BIBLE_BOOKS.find(bk => bk.abbr === bookAbbr);
    if (!b) { setError('Book not found'); setLoading(false); return; }
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
    if (highlightVerse && !loading) {
      setTimeout(() => {
        const el = document.getElementById(`v${highlightVerse}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } else if (!highlightVerse && topRef.current) {
      topRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [verses, loading, highlightVerse]);

  const navigate = (newAbbr, newChapter, jumpVerse = null) => {
    const newPos = { abbr: newAbbr, chapter: newChapter, verse: jumpVerse };
    setPos(newPos);
    setHighlightVerse(jumpVerse);
    loadChapter(newAbbr, newChapter, jumpVerse);
  };

  const goNext = () => {
    if (pos.chapter < book.chapters) {
      navigate(pos.abbr, pos.chapter + 1);
    } else {
      const next = getNextBook(pos.abbr);
      if (next) navigate(next.abbr, 1);
    }
  };

  const goPrev = () => {
    if (pos.chapter > 1) {
      navigate(pos.abbr, pos.chapter - 1);
    } else {
      const prev = getPrevBook(pos.abbr);
      if (prev) navigate(prev.abbr, prev.chapters);
    }
  };

  const isLastChapterLastBook = pos.abbr === 'REV' && pos.chapter === 22;
  const isFirstChapterFirstBook = pos.abbr === 'GEN' && pos.chapter === 1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <DailyPhoto />
      {/* Sticky nav bar */}
      <div ref={topRef} className="sticky top-14 z-40 bg-background/95 backdrop-blur border-b border-border pb-3 mb-6">
        {/* Book / Chapter / Verse selectors */}
        <div className="flex flex-wrap items-center gap-2 pt-3">
          {/* Book selector */}
          <div className="relative">
            <button
              onClick={() => { setShowBookPicker(p => !p); setShowChapterPicker(false); setShowVersePicker(false); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>{book.shortName}</span>
              <ChevronRight className="w-3 h-3 opacity-70" />
            </button>
            {showBookPicker && (
              <div className="absolute top-full left-0 mt-1 z-50">
                <BookSelector
                  currentAbbr={pos.abbr}
                  onSelect={(b) => navigate(b.abbr, 1)}
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
              Ch. {pos.chapter}
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
            {showVersePicker && verseCount > 0 && (
              <div className="absolute top-full left-0 mt-1 z-50">
                <VerseSelector
                  totalVerses={verseCount}
                  currentVerse={highlightVerse}
                  onSelect={(v) => {
                    setHighlightVerse(v);
                    setShowVersePicker(false);
                    setTimeout(() => {
                      const el = document.getElementById(`v${v}`);
                      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 50);
                  }}
                  onClose={() => setShowVersePicker(false)}
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

      {/* Book title */}
      <div className="text-center mb-6">
        <p className="font-sans text-xs text-muted-foreground tracking-widest uppercase mb-1">
          {book.testament === 'old' ? 'Old Testament' : 'New Testament'}
        </p>
        <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-1 leading-tight">{book.name}</h1>
        <p className="font-sans text-sm text-muted-foreground tracking-widest uppercase mt-1">Chapter {pos.chapter}</p>
        <div className="mt-3 w-16 h-px bg-accent mx-auto" />
      </div>

      {/* Verses */}
      <div className="font-serif text-lg leading-loose text-foreground/90">
        {loading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        )}
        {error && (
          <div className="text-center py-16 text-destructive font-sans">{error}</div>
        )}
        {!loading && !error && (
          <div className="text-justify hyphens-auto">
            {verses.map(v => (
              <VerseText
                key={v.verse}
                verse={v}
                highlight={highlightVerse === v.verse}
                id={`v${v.verse}`}
              />
            ))}
          </div>
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
              : pos.chapter > 1
              ? `Chapter ${pos.chapter - 1}`
              : `${getPrevBook(pos.abbr)?.shortName} ${getPrevBook(pos.abbr)?.chapters}`}
          </button>

          <button
            onClick={goNext}
            disabled={isLastChapterLastBook}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 disabled:opacity-30 transition-colors"
          >
            {pos.chapter < book.chapters
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