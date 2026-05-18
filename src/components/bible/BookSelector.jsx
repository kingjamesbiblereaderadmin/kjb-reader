import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { OLD_TESTAMENT, NEW_TESTAMENT } from '@/lib/bibleData';

export default function BookSelector({ currentAbbr, onSelect, onClose }) {
  const [oldOpen, setOldOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);

  const renderBook = (book) => {
    const active = book.abbr === currentAbbr;
    return (
      <button
        key={book.abbr}
        onClick={() => { onSelect(book, false, true); onClose(); }}
        className={`w-full text-left px-3 py-1.5 rounded text-sm font-sans transition-colors ${
          active
            ? 'bg-accent text-accent-foreground font-semibold'
            : 'hover:bg-secondary text-foreground'
        }`}
      >
        <span>{book.shortName}</span>
        <span className="ml-2 text-xs text-muted-foreground">{book.chapters} ch.</span>
      </button>
    );
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden w-full max-h-[80vh] flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <p className="font-serif font-semibold text-foreground text-center">Select Book</p>
      </div>
      <div className="overflow-y-auto flex-1 p-3 space-y-1">
        {/* Title Page - Above Old Testament */}
        <button
          onClick={() => { onSelect({ abbr: 'GEN', name: 'Genesis', chapters: 50, shortName: 'Gen' }, true, false); onClose(); }}
          className="w-full text-left px-3 py-2 rounded text-sm font-sans transition-colors hover:bg-secondary text-foreground font-medium text-primary"
        >
          <span>Title Page</span>
        </button>

        {/* Old Testament */}
        <button
          className="w-full flex items-center justify-between px-3 py-2 rounded font-sans font-semibold text-sm text-primary hover:bg-secondary transition-colors"
          onClick={() => setOldOpen(o => !o)}
        >
          <span>Old Testament <span className="text-muted-foreground font-normal">(39 books)</span></span>
          {oldOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {oldOpen && (
          <div className="space-y-0.5">
            {OLD_TESTAMENT.map((book) => renderBook(book))}
          </div>
        )}

        {/* New Testament */}
        <button
          className="w-full flex items-center justify-between px-3 py-2 rounded font-sans font-semibold text-sm text-primary hover:bg-secondary transition-colors"
          onClick={() => setNewOpen(o => !o)}
        >
          <span>New Testament <span className="text-muted-foreground font-normal">(27 books)</span></span>
          {newOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {newOpen && (
          <div className="space-y-0.5">
            <button
              onClick={() => { onSelect({ abbr: 'MAT', name: 'Matthew', chapters: 28, shortName: 'Mat' }, true); onClose(); }}
              className="w-full text-left px-3 py-1.5 rounded text-sm font-sans transition-colors hover:bg-secondary text-foreground"
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