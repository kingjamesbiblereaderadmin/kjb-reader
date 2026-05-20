import React, { useState } from 'react';

export default function ChapterSelector({ totalChapters, currentChapter, onSelect, onClose }) {
  const [selectedChapter, setSelectedChapter] = useState(currentChapter);

  const handleChapterSelect = (ch) => {
    setSelectedChapter(ch);
    // Navigate to verse selector after chapter selection
    onSelect(ch, true); // pass true to indicate we want verse selector next
  };

  return (
    <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden w-72 max-h-[60vh] flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <p className="font-serif font-semibold text-foreground text-center">Select Chapter</p>
      </div>
      <div className="overflow-y-auto flex-1 p-3">
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
          {Array.from({ length: totalChapters }, (_, i) => i + 1).map(ch => (
            <button
              key={ch}
              onClick={() => handleChapterSelect(ch)}
              className={`h-9 w-full rounded text-sm font-sans font-medium transition-colors ${
                ch === selectedChapter
                  ? 'bg-accent text-accent-foreground font-bold'
                  : 'bg-secondary hover:bg-accent/20 text-foreground'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}