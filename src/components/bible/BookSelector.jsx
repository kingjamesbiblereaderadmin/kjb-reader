import React, { useState } from 'react';
import { OLD_TESTAMENT, NEW_TESTAMENT } from '@/lib/bibleData';

export default function BookSelector({ currentAbbr, onSelect, onClose, initialTestament }) {
  const [tab, setTab] = useState(initialTestament === 'new' ? 'new' : 'old');

  const books = tab === 'new' ? NEW_TESTAMENT : OLD_TESTAMENT;
  const titleBook = tab === 'new'
    ? { abbr: 'MAT', name: 'Matthew', chapters: 28, shortName: 'Mat' }
    : { abbr: 'GEN', name: 'Genesis', chapters: 50, shortName: 'Gen' };

  const renderBook = (book) => {
    const active = book.abbr === currentAbbr;
    return (
      <button
        key={book.abbr}
        onClick={() => { onSelect(book, false, true); onClose(); }}
        className={`w-full text-left px-5 py-2.5 font-serif text-[15px] transition-colors border-b border-[#c9bd9f]/70 last:border-b-0 ${
          active
            ? 'bg-[#3a2c1c] text-[#f3efe6] font-semibold'
            : 'hover:bg-[#e3d6b8] text-[#2D2622]'
        }`}
      >
        <span>{book.name}</span>
        <span className={`ml-2 text-xs ${active ? 'text-[#f3efe6]/70' : 'text-[#7a6f55]'}`}>{book.chapters} ch.</span>
      </button>
    );
  };

  return (
    <div className="kjb-bible-page w-[95vw] max-w-md max-h-[78vh] flex flex-col relative !p-0">
      {/* Testament tabs */}
      <div className="grid grid-cols-2 border-b border-[#c9bd9f]">
        <button
          onClick={() => setTab('old')}
          className={`py-3 font-serif text-sm tracking-wide transition-colors ${
            tab === 'old'
              ? 'bg-[#3a2c1c] text-[#f3efe6] font-semibold'
              : 'text-[#2D2622] hover:bg-[#e3d6b8]'
          }`}
        >
          Old Testament
        </button>
        <button
          onClick={() => setTab('new')}
          className={`py-3 font-serif text-sm tracking-wide transition-colors border-l border-[#c9bd9f] ${
            tab === 'new'
              ? 'bg-[#3a2c1c] text-[#f3efe6] font-semibold'
              : 'text-[#2D2622] hover:bg-[#e3d6b8]'
          }`}
        >
          New Testament
        </button>
      </div>

      <div className="overflow-y-auto flex-1 pb-6 overscroll-contain">
        {/* Title Page for this testament */}
        <button
          onClick={() => { onSelect(titleBook, true, false); onClose(); }}
          className="w-full text-left px-5 py-3.5 font-serif text-[15px] italic transition-colors hover:bg-[#e3d6b8] text-[#2D2622] border-b border-[#c9bd9f]"
        >
          <span>¶ Title Page</span>
        </button>
        <div className="flex flex-col">
          {books.map((book) => renderBook(book))}
        </div>
      </div>
    </div>
  );
}