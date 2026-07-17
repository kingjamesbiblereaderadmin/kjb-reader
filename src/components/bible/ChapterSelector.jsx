import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';

export default function ChapterSelector({ totalChapters, currentChapter, onSelect, onClose }) {
  const [selectedChapter, setSelectedChapter] = useState(currentChapter);

  return (
    <div className="bg-card rounded-2xl overflow-hidden w-[90vw] max-w-sm max-h-[70vh] flex flex-col relative">
      <div className="overflow-y-auto flex-1 p-3">
        <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
          {Array.from({ length: totalChapters }, (_, i) => i + 1).map(ch => (
            <button
              key={ch}
              data-vaul-no-drag
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setSelectedChapter(ch)}
              className={`h-9 w-full rounded text-sm font-sans font-medium border transition-colors ${
                ch === selectedChapter
                  ? 'bg-accent text-accent-foreground font-bold border-accent'
                  : 'bg-secondary hover:bg-accent/20 text-foreground border-border'
              }`}
            >
              {ch}
            </button>
          ))}
        </div>
      </div>
      <div className="p-3 border-t border-border flex gap-2">
        <button
          onClick={() => onSelect(selectedChapter, true)}
          className="flex-1 px-4 py-2.5 rounded-lg bg-secondary border border-border text-secondary-foreground font-sans text-sm font-medium hover:bg-accent/20 transition-colors"
        >
          Pick Verse
        </button>
        <button
          onClick={() => onSelect(selectedChapter, false)}
          className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-primary border border-primary text-primary-foreground font-sans text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Go to Chapter {selectedChapter}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}