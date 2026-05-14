import React from 'react';

export default function ChapterSelector({ totalChapters, currentChapter, onSelect, onClose }) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden w-64 max-h-[60vh] flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <p className="font-serif font-semibold text-foreground text-center">Select Chapter</p>
      </div>
      <div className="overflow-y-auto flex-1 p-3">
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: totalChapters }, (_, i) => i + 1).map(ch => (
            <button
              key={ch}
              onClick={() => { onSelect(ch); onClose(); }}
              className={`h-9 w-full rounded text-sm font-sans font-medium transition-colors ${
                ch === currentChapter
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