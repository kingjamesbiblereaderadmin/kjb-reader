import React from 'react';

export default function VerseSelector({ totalVerses, currentVerse, onSelect, onClose }) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-xl overflow-hidden w-72 max-h-[60vh] flex flex-col">
      <div className="px-4 py-3 border-b border-border">
        <p className="font-serif font-semibold text-foreground text-center">Select Verse</p>
      </div>
      <div className="overflow-y-auto flex-1 p-3">
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
          {Array.from({ length: totalVerses }, (_, i) => i + 1).map(v => (
            <button
              key={v}
              onClick={() => { onSelect(v); onClose(); }}
              className={`h-9 w-full rounded text-sm font-sans font-medium transition-colors ${
                v === currentVerse
                  ? 'bg-accent text-accent-foreground font-bold'
                  : 'bg-secondary hover:bg-accent/20 text-foreground'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}