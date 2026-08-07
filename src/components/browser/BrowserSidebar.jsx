import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Sparkles, Clock, Bookmark, BookOpen } from 'lucide-react';
import { getDailyVerseFromBible, getDailyVerse } from '@/lib/dailyVerse';
import { getLatestProgress } from '@/lib/readingProgress';
import { getSavedVerses } from '@/lib/savedVerses';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import QuickVerseLookup from './QuickVerseLookup';

const clean = (t) => (t || '').replace(/^<<[^>]*>>\s*/, '').replace(/\[([^\]]+)\]/g, '$1');

export default function BrowserSidebar({ open, onClose }) {
  const navigate = useNavigate();
  const [verse, setVerse] = useState(getDailyVerse());
  const [progress, setProgress] = useState(getLatestProgress());
  const [saved, setSaved] = useState([]);

  useEffect(() => {
    setSaved(getSavedVerses().slice(0, 4));
    getDailyVerseFromBible().then((v) => v && setVerse(v)).catch(() => {});
  }, []);

  const progAbbr = (() => {
    if (!progress) return null;
    const b = BIBLE_BOOKS.find((x) => x.abbr === progress.book || x.shortName === progress.book || x.name === progress.book);
    return b ? b.abbr : progress.book;
  })();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 top-14 right-0 z-40 w-80 max-w-[85vw] shrink-0 bg-card border-l border-border/60 flex flex-col overflow-y-auto transition-transform duration-200 lg:static lg:inset-auto lg:translate-x-0 lg:transition-none
        ${open ? 'translate-x-0 lg:flex' : 'translate-x-full lg:hidden'}`}>
        <div className="flex items-center justify-between p-3 border-b border-border/60 lg:hidden">
          <span className="font-sans text-sm font-semibold text-foreground">Bible Panel</span>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-3 space-y-4">
          <QuickVerseLookup />

          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Daily Verse</p>
            <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
              <p className="font-sans text-xs font-semibold text-accent mb-1">{verse?.ref || '—'}</p>
              <p className="font-serif text-sm text-foreground leading-relaxed">{verse?.text ? clean(verse.text) : 'Loading…'}</p>
              {verse?.abbr && (
                <button onClick={() => navigate(`/read?book=${verse.abbr}&chapter=${verse.chapter}&verse=${verse.verse}`)} className="mt-2 inline-flex items-center gap-1.5 text-xs font-sans font-medium text-primary hover:underline">
                  <BookOpen className="w-3.5 h-3.5" /> Read in context
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Reading Progress</p>
            {progress ? (
              <button onClick={() => navigate(`/read?book=${progAbbr}&chapter=${progress.chapter}`)} className="w-full text-left p-3 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors">
                <p className="font-sans text-sm font-medium text-foreground">{progress.book} {progress.chapter}</p>
                <p className="font-sans text-xs text-muted-foreground mt-0.5 inline-flex items-center gap-1"><BookOpen className="w-3 h-3" /> Continue reading</p>
              </button>
            ) : <p className="font-sans text-xs text-muted-foreground">No reading yet.</p>}
          </div>

          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5"><Bookmark className="w-3.5 h-3.5" /> Saved Verses</p>
            {saved.length ? (
              <div className="space-y-1.5">
                {saved.map((s, i) => (
                  <button key={i} onClick={() => navigate(`/read?book=${s.abbr}&chapter=${s.chapter}&verse=${s.verse}`)} className="w-full text-left p-2 rounded-lg bg-secondary/40 hover:bg-secondary transition-colors">
                    <p className="font-sans text-xs font-semibold text-accent">{s.ref}</p>
                    <p className="font-serif text-xs text-foreground/80 leading-snug line-clamp-2">{clean(s.text)}</p>
                  </button>
                ))}
              </div>
            ) : <p className="font-sans text-xs text-muted-foreground">No saved verses.</p>}
          </div>
        </div>
      </aside>
    </>
  );
}