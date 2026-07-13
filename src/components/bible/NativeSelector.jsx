import React, { useState, useEffect } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { fetchVerseCount } from '@/lib/bibleApi';

/**
 * Native <select> dropdown picker for Book → Chapter → Verse, styled like the
 * Dev Tools editor. Used on mobile in the reader and Contents so tapping opens
 * the device's native picker wheel instead of a grid popup.
 *
 * onGo(abbr, chapter, verse|null) fires when the user confirms.
 * Verse is optional — leaving it on "Whole chapter" navigates to the chapter.
 */
export default function NativeSelector({ initialAbbr = 'GEN', initialChapter = 1, onGo }) {
  const [abbr, setAbbr] = useState(initialAbbr);
  const [chapter, setChapter] = useState(initialChapter || 1);
  const [verse, setVerse] = useState(''); // '' = whole chapter
  const [verseCount, setVerseCount] = useState(0);
  const [loadingVerses, setLoadingVerses] = useState(false);

  const book = BIBLE_BOOKS.find(b => b.abbr === abbr) || BIBLE_BOOKS[0];
  const maxChapters = book.chapters;

  // Fetch verse count whenever book/chapter changes so the verse dropdown fills.
  useEffect(() => {
    let cancelled = false;
    setLoadingVerses(true);
    setVerseCount(0);
    fetchVerseCount(book.apiName, chapter)
      .then(count => { if (!cancelled) setVerseCount(count || 0); })
      .catch(() => { if (!cancelled) setVerseCount(0); })
      .finally(() => { if (!cancelled) setLoadingVerses(false); });
    return () => { cancelled = true; };
  }, [book.apiName, chapter]);

  const handleBook = (newAbbr) => {
    setAbbr(newAbbr);
    setChapter(1);
    setVerse('');
  };

  const handleChapter = (ch) => {
    setChapter(Number(ch));
    setVerse('');
  };

  const handleGo = () => {
    onGo(abbr, chapter, verse === '' ? null : Number(verse));
  };

  const selectClass = 'w-full px-3 py-3 rounded-xl bg-secondary border border-border text-base text-foreground appearance-none';

  return (
    <div className="space-y-3 p-1">
      <div>
        <label className="block font-sans text-xs text-muted-foreground mb-1.5">Book</label>
        <select value={abbr} onChange={(e) => handleBook(e.target.value)} className={selectClass}>
          {BIBLE_BOOKS.map(b => (
            <option key={b.abbr} value={b.abbr}>{b.shortName}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-sans text-xs text-muted-foreground mb-1.5">Chapter</label>
          <select value={chapter} onChange={(e) => handleChapter(e.target.value)} className={selectClass}>
            {Array.from({ length: maxChapters }, (_, i) => i + 1).map(ch => (
              <option key={ch} value={ch}>{ch}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-sans text-xs text-muted-foreground mb-1.5">Verse</label>
          <select value={verse} onChange={(e) => setVerse(e.target.value)} disabled={loadingVerses || verseCount === 0} className={`${selectClass} disabled:opacity-50`}>
            <option value="">Whole chapter</option>
            {Array.from({ length: verseCount }, (_, i) => i + 1).map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleGo}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-primary border border-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
      >
        {loadingVerses ? <Loader2 className="w-4 h-4 animate-spin" /> : (
          <>Go to {book.shortName} {chapter}{verse !== '' ? `:${verse}` : ''} <ArrowRight className="w-4 h-4" /></>
        )}
      </button>
    </div>
  );
}