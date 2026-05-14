import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, ChevronRight, ChevronDown } from 'lucide-react';
import { BIBLE_BOOKS } from '@/lib/bibleData';
import { fetchVerseCount } from '@/lib/bibleApi';

export default function ContentsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('old');
  const [expanded, setExpanded] = useState(null); // abbr of expanded book
  const [selectedChapter, setSelectedChapter] = useState({}); // abbr -> chapter
  const [selectedVerse, setSelectedVerse] = useState({}); // abbr -> verse (null = start)
  const [verseCounts, setVerseCounts] = useState({}); // "abbr:chapter" -> count

  const books = BIBLE_BOOKS.filter(b => b.testament === tab);

  const goTo = (abbr, chapter, verse = null) => {
    try { localStorage.setItem('kjb-position', JSON.stringify({ abbr, chapter, verse })); } catch {}
    window.scrollTo({ top: 0 });
    navigate('/read');
  };

  const toggleBook = (abbr) => {
    setExpanded(prev => prev === abbr ? null : abbr);
    setSelectedChapter(prev => ({ ...prev, [abbr]: prev[abbr] || 1 }));
    setSelectedVerse(prev => ({ ...prev, [abbr]: null }));
  };

  const selectChapter = (abbr, apiName, c) => {
    setSelectedChapter(prev => ({ ...prev, [abbr]: c }));
    setSelectedVerse(prev => ({ ...prev, [abbr]: null }));
    const key = `${abbr}:${c}`;
    if (!verseCounts[key]) {
      fetchVerseCount(apiName, c).then(count => {
        setVerseCounts(prev => ({ ...prev, [key]: count }));
      });
    }
  };

  // Load verse count when a book first expands
  useEffect(() => {
    if (!expanded) return;
    const book = BIBLE_BOOKS.find(b => b.abbr === expanded);
    if (!book) return;
    const ch = selectedChapter[expanded] || 1;
    const key = `${expanded}:${ch}`;
    if (!verseCounts[key]) {
      fetchVerseCount(book.apiName, ch).then(count => {
        setVerseCounts(prev => ({ ...prev, [key]: count }));
      });
    }
  }, [expanded]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-secondary mb-4">
          <List className="w-7 h-7 text-accent" />
        </div>
        <h1 className="font-serif text-4xl font-bold text-foreground mb-2">Table of Contents</h1>
        <p className="font-sans text-sm text-muted-foreground">King James Bible — Pure Cambridge Edition</p>
        <div className="mt-4 w-16 h-px bg-accent mx-auto" />
      </div>

      {/* Testament tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => { setTab('old'); setExpanded(null); }}
          className={`flex-1 py-2.5 rounded-xl font-sans font-semibold text-sm transition-colors ${
            tab === 'old' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
          }`}
        >
          Old Testament
        </button>
        <button
          onClick={() => { setTab('new'); setExpanded(null); }}
          className={`flex-1 py-2.5 rounded-xl font-sans font-semibold text-sm transition-colors ${
            tab === 'new' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
          }`}
        >
          New Testament
        </button>
      </div>

      {/* Book list */}
      <div className="space-y-1.5">
        {books.map((book, idx) => {
          const isOpen = expanded === book.abbr;
          const ch = selectedChapter[book.abbr] || 1;
          const verse = selectedVerse[book.abbr] || null;
          const vcKey = `${book.abbr}:${ch}`;
          const vc = verseCounts[vcKey] || 0;

          return (
            <div key={book.abbr} className="bg-card border border-border rounded-xl overflow-hidden transition-all">
              {/* Book row */}
              <button
                onClick={() => toggleBook(book.abbr)}
                className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-accent/5 transition-colors group text-left"
              >
                <span className="font-sans text-xs text-muted-foreground w-6 flex-shrink-0 text-right">
                  {idx + 1}
                </span>
                <div className="flex-1">
                  <p className="font-serif text-base font-semibold text-foreground group-hover:text-accent transition-colors leading-tight">
                    {book.shortName}
                  </p>
                  <p className="font-sans text-xs text-muted-foreground mt-0.5">
                    {book.chapters} {book.chapters === 1 ? 'chapter' : 'chapters'}
                  </p>
                </div>
                {isOpen
                  ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  : <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-accent transition-colors" />
                }
              </button>

              {/* Expanded: chapter + verse pickers */}
              {isOpen && (
                <div className="border-t border-border px-5 py-4 bg-background/40 space-y-4">

                  {/* Chapter grid */}
                  <div>
                    <p className="font-sans text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">Chapter</p>
                    <div className="flex flex-wrap gap-1.5">
                      {Array.from({ length: book.chapters }, (_, i) => i + 1).map(c => (
                        <button
                          key={c}
                          onClick={() => selectChapter(book.abbr, book.apiName, c)}
                          className={`w-9 h-9 rounded-lg font-sans text-sm font-medium transition-colors ${
                            ch === c
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Verse grid */}
                  {vc > 0 && (
                    <div>
                      <p className="font-sans text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                        Verse <span className="normal-case font-normal">(optional)</span>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: vc }, (_, i) => i + 1).map(v => (
                          <button
                            key={v}
                            onClick={() => setSelectedVerse(prev => ({ ...prev, [book.abbr]: prev[book.abbr] === v ? null : v }))}
                            className={`w-9 h-9 rounded-lg font-sans text-sm font-medium transition-colors ${
                              verse === v
                                ? 'bg-accent text-accent-foreground'
                                : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Read button */}
                  <button
                    onClick={() => goTo(book.abbr, ch, verse)}
                    className="w-full py-2.5 rounded-xl bg-accent text-accent-foreground font-sans font-semibold text-sm hover:opacity-90 transition-opacity"
                  >
                    Read {book.shortName} {ch}{verse ? `:${verse}` : ''} →
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-center font-sans text-xs text-muted-foreground mt-8">
        {tab === 'old' ? '39 books' : '27 books'} · Tap any book to select a chapter
      </p>
    </div>
  );
}