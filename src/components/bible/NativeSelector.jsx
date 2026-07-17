import React, { useState, useEffect, useMemo } from 'react';
import { ArrowRight, Loader2, ChevronDown } from 'lucide-react';
import { BIBLE_BOOKS, OLD_TESTAMENT, NEW_TESTAMENT } from '@/lib/bibleData';
import { fetchVerseCount } from '@/lib/bibleApi';

/**
 * Native <select> dropdown picker for Testament → Book → Chapter → Verse, styled
 * like the Dev Tools editor. Used on mobile in the reader and Contents so tapping
 * opens the device's native picker wheel instead of a grid popup.
 *
 * onGo(abbr, chapter, verse|null) fires when the user confirms.
 * Verse is optional — leaving it on "Whole chapter" navigates to the chapter.
 */
function FieldDropdown({ label, value, options, onSelect, disabled, small }) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => String(o.value) === String(value));
  return (
    <div>
      <label className="block font-sans text-xs text-muted-foreground mb-1.5">{label}</label>
      <button
        type="button"
        data-vaul-no-drag
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => { if (!disabled) setOpen(o => !o); }}
        disabled={disabled}
        className={`w-full px-3 py-3 rounded-xl bg-secondary text-secondary-foreground border border-border ${small ? 'text-sm' : 'text-base'} font-medium text-left flex items-center justify-between gap-2 disabled:opacity-50`}
      >
        <span className="text-left leading-snug truncate">{current ? current.label : '—'}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && !disabled && (
        <div className="mt-1 max-h-56 overflow-y-auto rounded-xl bg-background border border-border shadow-lg">
          {options.map(o => (
            <button
              key={String(o.value)}
              type="button"
              onClick={() => { onSelect(o.value); setOpen(false); }}
              className={`w-full text-left px-3 py-2 ${small ? 'text-xs leading-snug' : 'text-sm'} border-b border-border/60 last:border-b-0 transition-colors ${
                String(o.value) === String(value) ? 'bg-secondary font-medium' : 'hover:bg-accent/10'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NativeSelector({ initialAbbr = 'GEN', initialChapter = 1, onGo }) {
  const [abbr, setAbbr] = useState(initialAbbr);
  const [chapter, setChapter] = useState(initialChapter || 1);
  const [verse, setVerse] = useState(''); // '' = whole chapter
  const [verseCount, setVerseCount] = useState(0);
  const [loadingVerses, setLoadingVerses] = useState(false);

  const book = BIBLE_BOOKS.find(b => b.abbr === abbr) || BIBLE_BOOKS[0];
  const maxChapters = book.chapters;

  // Determine which testament the current book belongs to.
  const initialTestament = useMemo(
    () => (NEW_TESTAMENT.some(b => b.abbr === initialAbbr) ? 'new' : 'old'),
    [initialAbbr]
  );
  const [testament, setTestament] = useState(initialTestament);

  // Books for the currently selected testament.
  const bookList = testament === 'new' ? NEW_TESTAMENT : OLD_TESTAMENT;

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

  const handleTestament = (newTestament) => {
    setTestament(newTestament);
    const firstBook = newTestament === 'new' ? NEW_TESTAMENT[0] : OLD_TESTAMENT[0];
    setAbbr(firstBook.abbr);
    setChapter(1);
    setVerse('');
  };

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

  return (
    <div className="space-y-3 p-1">
      <FieldDropdown
        label="Testament"
        value={testament}
        options={[{ value: 'old', label: 'Old Testament' }, { value: 'new', label: 'New Testament' }]}
        onSelect={handleTestament}
      />

      <FieldDropdown
        label="Book"
        value={abbr}
        options={bookList.map(b => ({ value: b.abbr, label: b.name }))}
        onSelect={handleBook}
        small
      />

      <div className="grid grid-cols-2 gap-3">
        <FieldDropdown
          label="Chapter"
          value={chapter}
          options={Array.from({ length: maxChapters }, (_, i) => ({ value: i + 1, label: String(i + 1) }))}
          onSelect={handleChapter}
        />
        <FieldDropdown
          label="Verse"
          value={verse}
          options={[{ value: '', label: 'Whole chapter' }, ...Array.from({ length: verseCount }, (_, i) => ({ value: i + 1, label: String(i + 1) }))]}
          onSelect={(v) => setVerse(String(v))}
          disabled={loadingVerses || verseCount === 0}
        />
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