import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { OLD_TESTAMENT, NEW_TESTAMENT } from '@/lib/bibleData';

export default function BookSelector({ currentAbbr, onSelect, onClose }) {
  const [oldOpen, setOldOpen] = useState(true);
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
    <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden w-72 max-h-[80vh] flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <p className="font-serif font-semibold text-foreground text-center">Select Book</p>
      </div>
      <div className="overflow-y-auto flex-1 p-2 space-y-1">
        {/* Old Testament */}
        <button
          className="w-full flex items-center justify-between px-3 py-2 rounded font-sans font-semibold text-sm text-primary hover:bg-secondary transition-colors"
          onClick={() => setOldOpen(o => !o)}
        >
          <span>Old Testament <span className="text-muted-foreground font-normal">(39 books)</span></span>
          {oldOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {oldOpen && (
          <div className="ml-2 space-y-0.5">
            <button
              onClick={() => { onSelect({ abbr: 'GEN', name: 'Genesis', chapters: 50, shortName: 'Gen' }, true, false); onClose(); }}
              className="w-full text-left px-3 py-1.5 rounded text-sm font-sans transition-colors hover:bg-secondary text-foreground"
            >
              <span>Title Page</span>
              <span className="ml-2 text-xs text-muted-foreground">intro</span>
            </button>
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
          <div className="ml-2 space-y-0.5">
            {NEW_TESTAMENT.map((book) => (
              book.abbr === 'MAT' ? (
                <div key="mat-section">
                  <button
                    onClick={() => { onSelect({ abbr: 'MAT', name: 'Matthew', chapters: 28, shortName: 'Mat' }, true); onClose(); }}
                    className="w-full text-left px-3 py-1.5 rounded text-sm font-sans transition-colors hover:bg-secondary text-foreground"
                  >
                    <span>Title Page</span>
                    <span className="ml-2 text-xs text-muted-foreground">intro</span>
                  </button>
                  {renderBook(book)}
                </div>
              ) : renderBook(book)
            ))}
          </div>
        )}
      </div>
    </div>
  );
}