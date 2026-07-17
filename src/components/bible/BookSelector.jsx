import React, { useState } from 'react';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { OLD_TESTAMENT, NEW_TESTAMENT } from '@/lib/bibleData';

export default function BookSelector({ currentAbbr, onSelect, onClose, initialTestament }) {
  const [oldOpen, setOldOpen] = useState(initialTestament === 'old');
  const [newOpen, setNewOpen] = useState(initialTestament === 'new');

  const renderBook = (book) => {
    const active = book.abbr === currentAbbr;
    return (
      <button
        key={book.abbr}
        onClick={() => { onSelect(book, false, true); onClose(); }}
        className={`w-full text-left px-4 py-2.5 text-sm font-sans transition-colors border-b border-border/60 last:border-b-0 ${
          active
            ? 'bg-primary text-primary-foreground font-semibold'
            : 'hover:bg-accent/10 text-foreground'
        }`}
      >
        <span>{book.shortName}</span>
        <span className="ml-2 text-xs text-muted-foreground">{book.chapters} ch.</span>
      </button>
    );
  };

  return (
    <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden w-[95vw] max-w-md max-h-[70vh] flex flex-col relative">
      <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
        <span className="font-sans text-sm font-semibold">Select Book</span>
        <button 
          onClick={onClose}
          className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="overflow-y-auto flex-1 pb-6 overscroll-contain">
        {/* Title Page - Above Old Testament */}
        <button
          onClick={() => { onSelect({ abbr: 'GEN', name: 'Genesis', chapters: 50, shortName: 'Gen' }, true, false); onClose(); }}
          className="w-full text-left px-4 py-3.5 text-sm font-serif transition-colors hover:bg-accent/10 font-medium text-foreground border-b border-border"
        >
          <span>Title Page</span>
        </button>
        <div className="h-2 bg-muted/40 border-b border-border" />

        {/* Old Testament */}
        <button
          data-vaul-no-drag
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full flex items-center justify-between px-4 py-3 font-sans font-bold text-sm text-foreground bg-secondary/40 hover:bg-accent/10 transition-colors border-y border-border"
          onClick={() => setOldOpen(o => !o)}
        >
          <span>Old Testament <span className="text-muted-foreground font-normal">(39 books)</span></span>
          {oldOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {oldOpen && (
          <div className="flex flex-col border-b border-border">
            {OLD_TESTAMENT.map((book) => renderBook(book))}
          </div>
        )}

        {/* New Testament */}
        <button
          data-vaul-no-drag
          onPointerDown={(e) => e.stopPropagation()}
          className="w-full flex items-center justify-between px-4 py-3 font-sans font-bold text-sm text-foreground bg-secondary/40 hover:bg-accent/10 transition-colors border-y border-border"
          onClick={() => setNewOpen(o => !o)}
        >
          <span>New Testament <span className="text-muted-foreground font-normal">(27 books)</span></span>
          {newOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {newOpen && (
          <div className="flex flex-col">
            <button
              onClick={() => { onSelect({ abbr: 'MAT', name: 'Matthew', chapters: 28, shortName: 'Mat' }, true); onClose(); }}
              className="w-full text-left px-4 py-2.5 text-sm font-sans transition-colors hover:bg-accent/10 text-foreground font-medium border-b border-border"
            >
              <span>Title Page</span>
            </button>
            {NEW_TESTAMENT.map((book) => renderBook(book))}
          </div>
        )}
      </div>
    </div>
  );
}