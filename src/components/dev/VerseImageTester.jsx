import React, { useState, useEffect } from 'react';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { fetchChapter } from '@/lib/bibleApi';
import DailyVerseImage from '@/components/bible/DailyVerseImage';
import { Loader2, Shuffle } from 'lucide-react';
import { getDailyVerseForDate } from '@/lib/dailyVerseSchedule';
import VerseLengthFinder from './VerseLengthFinder';
import ShareCardControls from './ShareCardControls';

// Lets the admin load ANY verse into the real daily-verse card so they can
// check crop / sizing / text-overlap. Toggles the custom background and the
// verse panel using the same localStorage keys the card reads.
export default function VerseImageTester() {
  const [book, setBook] = useState('Psalms');
  const [chapter, setChapter] = useState(23);
  const [verseNum, setVerseNum] = useState(1);
  const [verse, setVerse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useBg, setUseBg] = useState(() => !!localStorage.getItem('kjb-daily-verse-bg'));
  const [showPanel, setShowPanel] = useState(() => localStorage.getItem('kjb-verse-panel-visible') !== 'false');

  const bookEntry = BIBLE_BOOKS.find(b => b.apiName === book);
  const maxChapters = bookEntry ? bookEntry.chapters : 150;

  const loadVerse = async () => {
    setLoading(true);
    setError('');
    try {
      const { verses } = await fetchChapter(book, chapter);
      const found = verses.find(v => v.verse === Number(verseNum)) || verses[0];
      if (!found) throw new Error('Verse not found');
      setVerse({
        abbr: bookEntry?.abbr || book.slice(0, 3).toUpperCase(),
        book: bookEntry?.shortName || book,
        chapter: Number(chapter),
        verse: found.verse,
        text: found.text.replace(/^<<[^>]*>>\s*/, ''),
        ref: `${bookEntry?.shortName || book} ${chapter}:${found.verse}`,
      });
    } catch (err) {
      setError(err.message || 'Failed to load verse');
      setVerse(null);
    }
    setLoading(false);
  };

  const loadRandom = async () => {
    // Reuse the deterministic picker with a random date to grab a real eligible verse
    const d = new Date(2000 + Math.floor(Math.random() * 100), Math.floor(Math.random() * 12), 1 + Math.floor(Math.random() * 28));
    const v = await getDailyVerseForDate(d);
    if (v) {
      const be = BIBLE_BOOKS.find(b => b.shortName === v.book);
      setBook(be?.apiName || v.book);
      setChapter(v.chapter);
      setVerseNum(v.verse);
      setVerse(v);
    }
  };

  useEffect(() => { loadVerse(); /* eslint-disable-next-line */ }, []);

  // Load a verse chosen from the length finder into the card.
  const loadFromRef = async (r) => {
    const be = BIBLE_BOOKS.find(b => b.shortName === r.book || b.apiName === r.book);
    setBook(be?.apiName || r.book);
    setChapter(r.chapter);
    setVerseNum(r.verse);
    setLoading(true);
    setError('');
    try {
      const { verses } = await fetchChapter(be?.apiName || r.book, r.chapter);
      const found = verses.find(v => v.verse === Number(r.verse)) || verses[0];
      setVerse({
        abbr: be?.abbr || r.book.slice(0, 3).toUpperCase(),
        book: be?.shortName || r.book,
        chapter: Number(r.chapter),
        verse: found.verse,
        text: found.text.replace(/^<<[^>]*>>\s*/, ''),
        ref: `${be?.shortName || r.book} ${r.chapter}:${found.verse}`,
      });
    } catch (err) {
      setError(err.message || 'Failed to load verse');
    }
    setLoading(false);
  };

  const toggleBg = (on) => {
    setUseBg(on);
    // The card reads kjb-daily-verse-bg. We temporarily point it at the stored
    // original if turning on; turning off removes the key so the gradient shows.
    if (!on) {
      // Preserve the user's real bg under a temp key so we can restore it
      const cur = localStorage.getItem('kjb-daily-verse-bg');
      if (cur) localStorage.setItem('kjb-devtools-saved-bg', cur);
      localStorage.removeItem('kjb-daily-verse-bg');
    } else {
      const saved = localStorage.getItem('kjb-devtools-saved-bg');
      if (saved) localStorage.setItem('kjb-daily-verse-bg', saved);
    }
    window.dispatchEvent(new Event('storage'));
  };

  const togglePanel = (on) => {
    setShowPanel(on);
    localStorage.setItem('kjb-verse-panel-visible', String(on));
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="space-y-5">
      <VerseLengthFinder onSelect={loadFromRef} />
      <div className="rounded-xl bg-card border border-border p-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Book</label>
            <select
              value={book}
              onChange={(e) => { setBook(e.target.value); setChapter(1); setVerseNum(1); }}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground"
            >
              {BIBLE_BOOKS.map(b => <option key={b.abbr} value={b.apiName}>{b.shortName}</option>)}
            </select>
          </div>
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Chapter (1–{maxChapters})</label>
            <input type="number" min={1} max={maxChapters} value={chapter}
              onChange={(e) => setChapter(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
          </div>
          <div>
            <label className="block font-sans text-xs text-muted-foreground mb-1">Verse</label>
            <input type="number" min={1} value={verseNum}
              onChange={(e) => setVerseNum(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={loadVerse} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Load Verse
          </button>
          <button onClick={loadRandom}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-accent/20">
            <Shuffle className="w-4 h-4" /> Random
          </button>
        </div>
        <div className="flex flex-wrap gap-4 pt-1">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={useBg} onChange={(e) => toggleBg(e.target.checked)} className="w-4 h-4 accent-primary" />
            With background image
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={showPanel} onChange={(e) => togglePanel(e.target.checked)} className="w-4 h-4 accent-primary" />
            Show verse panel
          </label>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {verse && (() => {
          const clean = verse.text.replace(/[[\]]/g, '').replace(/¶/g, '').trim();
          const words = clean.split(/\s+/).filter(Boolean).length;
          return <p className="text-xs text-muted-foreground">{words} words · {clean.length} chars (verse text only)</p>;
        })()}
      </div>

      <ShareCardControls verse={verse} />

      {verse && (
        <div className="max-w-2xl mx-auto">
          <DailyVerseImage verse={verse} onClick={() => {}} isOffline={false} />
        </div>
      )}
    </div>
  );
}