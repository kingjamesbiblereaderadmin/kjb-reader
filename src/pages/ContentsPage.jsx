import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { List } from 'lucide-react';
import { BIBLE_BOOKS } from '@/lib/bibleData';

export default function ContentsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('old');

  const books = BIBLE_BOOKS.filter(b => b.testament === tab);

  const goToBook = (abbr) => {
    try { localStorage.setItem('kjb-position', JSON.stringify({ abbr, chapter: 1, verse: null })); } catch {}
    navigate('/read');
  };

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
          onClick={() => setTab('old')}
          className={`flex-1 py-2.5 rounded-xl font-sans font-semibold text-sm transition-colors ${
            tab === 'old' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
          }`}
        >
          Old Testament
        </button>
        <button
          onClick={() => setTab('new')}
          className={`flex-1 py-2.5 rounded-xl font-sans font-semibold text-sm transition-colors ${
            tab === 'new' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-accent/20'
          }`}
        >
          New Testament
        </button>
      </div>

      {/* Book list */}
      <div className="space-y-1.5">
        {books.map((book, idx) => (
          <button
            key={book.abbr}
            onClick={() => goToBook(book.abbr)}
            className="w-full flex items-center gap-4 px-5 py-3.5 bg-card border border-border rounded-xl hover:border-accent/50 hover:bg-accent/5 transition-colors group text-left"
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
            <span className="font-sans text-xs text-muted-foreground group-hover:text-accent transition-colors">
              Read →
            </span>
          </button>
        ))}
      </div>

      <p className="text-center font-sans text-xs text-muted-foreground mt-8">
        {tab === 'old' ? '39 books' : '27 books'} · Tap any book to begin reading
      </p>
    </div>
  );
}